import { describe, it, expect, beforeEach, mock } from "bun:test";
import { CollaborativeFilteringService } from "../../src/infrastructure/services/recommendation/CollaborativeFilteringService";
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

describe("CollaborativeFilteringService", () => {
  let service: CollaborativeFilteringService;
  let cacheService: RecommendationCacheService;

  beforeEach(() => {
    queryCallCount = 0;
    mockQueryResults.length = 0;
    mockCacheData.clear();
    cacheService = new RecommendationCacheService();
    service = new CollaborativeFilteringService(cacheService);
  });

  describe("getSimilarUsersByFollows", () => {
    it("should return empty array when no similar users found", async () => {
      mockQueryResults.push([]);

      const result = await service.getSimilarUsersByFollows("user-123", 10);

      expect(result).toEqual([]);
    });

    it("should return similar users based on common follows", async () => {
      mockQueryResults.push([
        { user_id: "similar-1", common_follows: "5", total_follows: "10", similarity_score: 0.7 },
        { user_id: "similar-2", common_follows: "3", total_follows: "8", similarity_score: 0.5 },
      ]);

      const result = await service.getSimilarUsersByFollows("user-123", 10);

      expect(result.length).toBe(2);
      expect(result[0].userId).toBe("similar-1");
      expect(result[0].commonFollows).toBe(5);
      expect(result[0].similarityScore).toBe(0.7);
    });

    it("should use cache if available", async () => {
      const cachedUsers = [
        { userId: "cached-1", similarityScore: 0.9, commonFollows: 10 },
      ];
      await cacheService.setCachedSimilarUsers("user-123", cachedUsers);

      const result = await service.getSimilarUsersByFollows("user-123", 10);

      expect(result.length).toBe(1);
      expect(result[0].userId).toBe("cached-1");
      expect(queryCallCount).toBe(0);
    });
  });

  describe("getSimilarUsersByLikes", () => {
    it("should return empty array when no similar users found", async () => {
      mockQueryResults.push([]);

      const result = await service.getSimilarUsersByLikes("user-123", 10);

      expect(result).toEqual([]);
    });

    it("should return similar users based on common likes", async () => {
      mockQueryResults.push([
        { user_id: "similar-1", common_likes: "10", similarity_score: 0.8 },
      ]);

      const result = await service.getSimilarUsersByLikes("user-123", 10);

      expect(result.length).toBe(1);
      expect(result[0].userId).toBe("similar-1");
      expect(result[0].commonLikes).toBe(10);
    });
  });

  describe("getSimilarUsers", () => {
    it("should combine results from follows and likes with proper weights", async () => {
      mockQueryResults.push([
        { user_id: "user-a", common_follows: "5", total_follows: "10", similarity_score: 0.5 },
      ]);
      mockQueryResults.push([
        { user_id: "user-b", common_likes: "10", similarity_score: 0.8 },
      ]);

      const result = await service.getSimilarUsers("user-123", 10);

      expect(result.length).toBe(2);
      const userIds = result.map((u) => u.userId);
      expect(userIds).toContain("user-a");
      expect(userIds).toContain("user-b");
    });

    it("should merge scores for users found in both methods", async () => {
      mockQueryResults.push([
        { user_id: "shared-user", common_follows: "5", total_follows: "10", similarity_score: 0.5 },
      ]);
      mockQueryResults.push([
        { user_id: "shared-user", common_likes: "10", similarity_score: 0.5 },
      ]);

      const result = await service.getSimilarUsers("user-123", 10);

      expect(result.length).toBe(1);
      expect(result[0].userId).toBe("shared-user");
      expect(result[0].similarityScore).toBeCloseTo(0.5, 2);
    });
  });

  describe("getPopularPostsAmongSimilarUsers", () => {
    it("should return empty array when no similar user ids provided", async () => {
      const result = await service.getPopularPostsAmongSimilarUsers([], "user-123", 20);
      expect(result).toEqual([]);
    });

    it("should return popular posts among similar users", async () => {
      mockQueryResults.push([
        {
          post_id: "post-1",
          author_id: "author-1",
          content: "Popular content",
          likes_count: 100,
          comments_count: 20,
          reposts_count: 10,
          views_count: 500,
          engagement_score: 200,
          created_at: new Date(),
          liked_by_count: "5",
        },
      ]);

      const result = await service.getPopularPostsAmongSimilarUsers(
        ["similar-1", "similar-2"],
        "user-123",
        20
      );

      expect(result.length).toBe(1);
      expect(result[0].postId).toBe("post-1");
      expect(result[0].likedByCount).toBe(5);
    });
  });

  describe("getRecommendedUsersBySimilarUsers", () => {
    it("should return empty array when no similar user ids provided", async () => {
      const result = await service.getRecommendedUsersBySimilarUsers("user-123", [], 10);
      expect(result).toEqual([]);
    });

    it("should return users followed by similar users", async () => {
      mockQueryResults.push([
        { user_id: "recommended-1", followed_by_count: "3" },
        { user_id: "recommended-2", followed_by_count: "2" },
      ]);

      const result = await service.getRecommendedUsersBySimilarUsers(
        "user-123",
        ["similar-1", "similar-2"],
        10
      );

      expect(result.length).toBe(2);
      expect(result[0].userId).toBe("recommended-1");
      expect(result[0].followedByCount).toBe(3);
    });
  });
});
