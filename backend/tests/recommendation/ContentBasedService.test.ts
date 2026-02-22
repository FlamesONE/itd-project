import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ContentBasedService } from "../../src/infrastructure/services/recommendation/ContentBasedService";
import { RecommendationCacheService } from "../../src/infrastructure/services/recommendation/RecommendationCacheService";

let queryCallCount = 0;
const mockQueryResults: unknown[][] = [];

mock.module("../../src/infrastructure/persistence/postgresql/connection", () => ({
  query: async <T>(): Promise<T[]> => {
    const result = mockQueryResults[queryCallCount] || [];
    queryCallCount++;
    return result as T[];
  },
}));

const mockCacheData = new Map<string, { value: unknown; expiry?: number }>();

mock.module("../../src/infrastructure/persistence/redis/connection", () => ({
  cacheGet: async <T>(key: string): Promise<T | null> => {
    const data = mockCacheData.get(key);
    if (!data) return null;
    return data.value as T;
  },
  cacheSet: async <T>(key: string, value: T, ttlSeconds?: number): Promise<void> => {
    mockCacheData.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },
  cacheDelete: async (): Promise<void> => {},
  cacheDeletePattern: async (): Promise<void> => {},
}));

describe("ContentBasedService", () => {
  let service: ContentBasedService;
  let cacheService: RecommendationCacheService;

  beforeEach(() => {
    queryCallCount = 0;
    mockQueryResults.length = 0;
    mockCacheData.clear();
    cacheService = new RecommendationCacheService();
    service = new ContentBasedService(cacheService);
  });

  describe("getUserTopHashtags", () => {
    it("should return user top hashtags from database", async () => {
      mockQueryResults.push([
        { id: "h1", name: "typescript", user_usage_count: "15" },
        { id: "h2", name: "nodejs", user_usage_count: "10" },
      ]);

      const result = await service.getUserTopHashtags("user-123", 10);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe("typescript");
      expect(result[0].userUsageCount).toBe(15);
    });

    it("should use cached interests if available", async () => {
      await cacheService.setCachedUserInterests("user-123", {
        topHashtags: ["react", "vue", "angular"],
        preferredTopics: [],
        engagementPatterns: { likeWeight: 1, commentWeight: 2, repostWeight: 3 },
      });

      const result = await service.getUserTopHashtags("user-123", 10);

      expect(result.length).toBe(3);
      expect(result[0].name).toBe("react");
      expect(queryCallCount).toBe(0);
    });

    it("should cache hashtags after fetching", async () => {
      mockQueryResults.push([
        { id: "h1", name: "coding", user_usage_count: "20" },
      ]);

      await service.getUserTopHashtags("user-456", 10);

      const cached = await cacheService.getCachedUserInterests("user-456");
      expect(cached).not.toBeNull();
      expect(cached!.topHashtags).toContain("coding");
    });
  });

  describe("getPostsByHashtags", () => {
    it("should return empty array when no hashtags provided", async () => {
      const result = await service.getPostsByHashtags([], "user-123", 20);
      expect(result).toEqual([]);
    });

    it("should return posts matching hashtags", async () => {
      mockQueryResults.push([
        {
          post_id: "post-1",
          author_id: "author-1",
          content: "Test content",
          likes_count: 50,
          comments_count: 10,
          reposts_count: 5,
          views_count: 200,
          engagement_score: 100,
          created_at: new Date(),
          matching_tags: "2",
          content_score: 140,
        },
      ]);

      const result = await service.getPostsByHashtags(
        ["typescript", "nodejs"],
        "user-123",
        20
      );

      expect(result.length).toBe(1);
      expect(result[0].postId).toBe("post-1");
      expect(result[0].matchingTags).toBe(2);
    });
  });

  describe("getUsersByHashtags", () => {
    it("should return empty array when no hashtags provided", async () => {
      const result = await service.getUsersByHashtags([], "user-123", 10);
      expect(result).toEqual([]);
    });

    it("should return users with similar hashtags", async () => {
      mockQueryResults.push([
        {
          user_id: "similar-user",
          username: "coder123",
          display_name: "Coder",
          emoji: "👨‍💻",
          avatar_url: null,
          bio: "I code things",
          followers_count: 500,
          common_hashtags: "3",
          hashtag_similarity: 0.75,
        },
      ]);

      const result = await service.getUsersByHashtags(
        ["typescript", "nodejs", "react", "vue"],
        "user-123",
        10
      );

      expect(result.length).toBe(1);
      expect(result[0].userId).toBe("similar-user");
      expect(result[0].commonHashtags).toBe(3);
      expect(result[0].hashtagSimilarity).toBe(0.75);
    });
  });

  describe("getContentBasedPostRecommendations", () => {
    it("should return empty array when user has no hashtags", async () => {
      mockQueryResults.push([]);

      const result = await service.getContentBasedPostRecommendations("user-123", 20);

      expect(result).toEqual([]);
    });

    it("should return posts based on user hashtags", async () => {
      mockQueryResults.push([
        { id: "h1", name: "typescript", user_usage_count: "10" },
      ]);
      mockQueryResults.push([
        {
          post_id: "rec-post",
          author_id: "other-author",
          content: "TypeScript tips",
          likes_count: 100,
          comments_count: 20,
          reposts_count: 10,
          views_count: 500,
          engagement_score: 200,
          created_at: new Date(),
          matching_tags: "1",
          content_score: 220,
        },
      ]);

      const result = await service.getContentBasedPostRecommendations("user-123", 20);

      expect(result.length).toBe(1);
      expect(result[0].content).toBe("TypeScript tips");
    });
  });

  describe("getContentBasedUserRecommendations", () => {
    it("should return empty array when user has no hashtags", async () => {
      mockQueryResults.push([]);

      const result = await service.getContentBasedUserRecommendations("user-123", 10);

      expect(result).toEqual([]);
    });

    it("should return users based on similar hashtags", async () => {
      mockQueryResults.push([
        { id: "h1", name: "typescript", user_usage_count: "10" },
      ]);
      mockQueryResults.push([
        {
          user_id: "rec-user",
          username: "tsdev",
          display_name: "TS Developer",
          emoji: "🎯",
          avatar_url: null,
          bio: null,
          followers_count: 200,
          common_hashtags: "1",
          hashtag_similarity: 1.0,
        },
      ]);

      const result = await service.getContentBasedUserRecommendations("user-123", 10);

      expect(result.length).toBe(1);
      expect(result[0].username).toBe("tsdev");
    });
  });

  describe("analyzeUserEngagementPatterns", () => {
    it("should return default weights when no engagement data", async () => {
      mockQueryResults.push([]);

      const result = await service.analyzeUserEngagementPatterns("user-123");

      expect(result).toEqual({
        likeWeight: 1,
        commentWeight: 2,
        repostWeight: 3,
      });
    });

    it("should calculate weights based on user activity", async () => {
      mockQueryResults.push([
        { likes_count: "100", comments_count: "50", reposts_count: "25" },
      ]);

      const result = await service.analyzeUserEngagementPatterns("user-123");

      expect(result.likeWeight).toBeGreaterThan(1);
      expect(result.commentWeight).toBeGreaterThan(2);
      expect(result.repostWeight).toBeGreaterThan(3);
    });
  });
});
