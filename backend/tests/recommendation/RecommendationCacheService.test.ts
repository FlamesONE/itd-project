import { describe, it, expect, beforeEach, mock } from "bun:test";
import { RecommendationCacheService } from "../../src/infrastructure/services/recommendation/RecommendationCacheService";

const mockCacheData = new Map<string, { value: unknown; expiry?: number }>();

mock.module("../../src/infrastructure/persistence/redis/connection", () => ({
  cacheGet: async <T>(key: string): Promise<T | null> => {
    const data = mockCacheData.get(key);
    if (!data) return null;
    if (data.expiry && Date.now() > data.expiry) {
      mockCacheData.delete(key);
      return null;
    }
    return data.value as T;
  },
  cacheSet: async <T>(key: string, value: T, ttlSeconds?: number): Promise<void> => {
    mockCacheData.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },
  cacheDelete: async (key: string): Promise<void> => {
    mockCacheData.delete(key);
  },
  cacheDeletePattern: async (pattern: string): Promise<void> => {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    for (const key of mockCacheData.keys()) {
      if (regex.test(key)) {
        mockCacheData.delete(key);
      }
    }
  },
}));

describe("RecommendationCacheService", () => {
  let cacheService: RecommendationCacheService;

  beforeEach(() => {
    mockCacheData.clear();
    cacheService = new RecommendationCacheService();
  });

  describe("User Recommendations", () => {
    it("should cache and retrieve user recommendations", async () => {
      const userId = "user-123";
      const recommendations = [
        {
          userId: "rec-1",
          username: "user1",
          displayName: "User 1",
          emoji: "👤",
          avatarUrl: null,
          bio: null,
          followersCount: 100,
          mutualFollowersCount: 5,
          score: 80,
          reason: "mutual_followers" as const,
        },
      ];

      await cacheService.setCachedUserRecommendations(userId, recommendations);
      const cached = await cacheService.getCachedUserRecommendations(userId);

      expect(cached).toEqual(recommendations);
    });

    it("should return null for non-existent cache", async () => {
      const cached = await cacheService.getCachedUserRecommendations("non-existent");
      expect(cached).toBeNull();
    });

    it("should invalidate user recommendations", async () => {
      const userId = "user-123";
      await cacheService.setCachedUserRecommendations(userId, []);

      await cacheService.invalidateUserRecommendations(userId);
      const cached = await cacheService.getCachedUserRecommendations(userId);

      expect(cached).toBeNull();
    });
  });

  describe("Post Recommendations", () => {
    it("should cache and retrieve post recommendations", async () => {
      const userId = "user-123";
      const recommendations = [
        {
          postId: "post-1",
          authorId: "author-1",
          content: "Test post",
          likesCount: 50,
          commentsCount: 10,
          repostsCount: 5,
          score: 75,
          reason: "trending" as const,
        },
      ];

      await cacheService.setCachedPostRecommendations(userId, recommendations);
      const cached = await cacheService.getCachedPostRecommendations(userId);

      expect(cached).toEqual(recommendations);
    });
  });

  describe("Similar Users", () => {
    it("should cache and retrieve similar users", async () => {
      const userId = "user-123";
      const similarUsers = [
        { userId: "similar-1", similarityScore: 0.8, commonFollows: 10 },
        { userId: "similar-2", similarityScore: 0.6, commonLikes: 5 },
      ];

      await cacheService.setCachedSimilarUsers(userId, similarUsers);
      const cached = await cacheService.getCachedSimilarUsers(userId);

      expect(cached).toEqual(similarUsers);
    });
  });

  describe("User Interests", () => {
    it("should cache and retrieve user interests", async () => {
      const userId = "user-123";
      const interests = {
        topHashtags: ["coding", "typescript", "nodejs"],
        preferredTopics: ["tech"],
        engagementPatterns: {
          likeWeight: 1.5,
          commentWeight: 2.0,
          repostWeight: 3.0,
        },
      };

      await cacheService.setCachedUserInterests(userId, interests);
      const cached = await cacheService.getCachedUserInterests(userId);

      expect(cached).toEqual(interests);
    });
  });

  describe("Invalidation", () => {
    it("should invalidate all cache for a user", async () => {
      const userId = "user-123";

      await cacheService.setCachedUserRecommendations(userId, []);
      await cacheService.setCachedPostRecommendations(userId, []);
      await cacheService.setCachedSimilarUsers(userId, []);
      await cacheService.setCachedUserInterests(userId, {
        topHashtags: [],
        preferredTopics: [],
        engagementPatterns: { likeWeight: 1, commentWeight: 2, repostWeight: 3 },
      });

      await cacheService.invalidateAllForUser(userId);

      expect(await cacheService.getCachedUserRecommendations(userId)).toBeNull();
      expect(await cacheService.getCachedPostRecommendations(userId)).toBeNull();
      expect(await cacheService.getCachedSimilarUsers(userId)).toBeNull();
      expect(await cacheService.getCachedUserInterests(userId)).toBeNull();
    });
  });

  describe("Trending Posts", () => {
    it("should cache and retrieve trending posts", async () => {
      const trendingPosts = [
        {
          postId: "trending-1",
          authorId: "author-1",
          content: "Trending content",
          likesCount: 1000,
          commentsCount: 200,
          repostsCount: 50,
          score: 500,
          reason: "trending" as const,
        },
      ];

      await cacheService.setCachedTrendingPosts(trendingPosts);
      const cached = await cacheService.getCachedTrendingPosts();

      expect(cached).toEqual(trendingPosts);
    });

    it("should invalidate trending posts", async () => {
      await cacheService.setCachedTrendingPosts([]);
      await cacheService.invalidateTrendingPosts();

      const cached = await cacheService.getCachedTrendingPosts();
      expect(cached).toBeNull();
    });
  });
});
