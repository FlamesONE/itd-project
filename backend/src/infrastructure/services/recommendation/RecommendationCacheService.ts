import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
} from "../../persistence/redis/connection";
import type {
  RecommendedUser,
  RecommendedPost,
} from "../../../domain/recommendation";

const TTL = {
  USER_RECOMMENDATIONS: 5 * 60,
  POST_RECOMMENDATIONS: 3 * 60,
  SIMILAR_USERS: 15 * 60,
  USER_INTERESTS: 60 * 60,
  TRENDING_POSTS: 2 * 60,
} as const;

const KEYS = {
  USER_RECOMMENDATIONS: (userId: string) => `recommendations:users:${userId}`,
  POST_RECOMMENDATIONS: (userId: string) => `recommendations:posts:${userId}`,
  SIMILAR_USERS: (userId: string) => `recommendations:similar:${userId}`,
  USER_INTERESTS: (userId: string) => `recommendations:interests:${userId}`,
  TRENDING_POSTS: "trending:posts",
} as const;

export interface SimilarUser {
  userId: string;
  similarityScore: number;
  commonFollows?: number;
  commonLikes?: number;
}

export interface UserInterests {
  topHashtags: string[];
  preferredTopics: string[];
  engagementPatterns: {
    likeWeight: number;
    commentWeight: number;
    repostWeight: number;
  };
}

export class RecommendationCacheService {

  async getCachedUserRecommendations(
    userId: string
  ): Promise<RecommendedUser[] | null> {
    return cacheGet<RecommendedUser[]>(KEYS.USER_RECOMMENDATIONS(userId));
  }

  async setCachedUserRecommendations(
    userId: string,
    data: RecommendedUser[]
  ): Promise<void> {
    await cacheSet(
      KEYS.USER_RECOMMENDATIONS(userId),
      data,
      TTL.USER_RECOMMENDATIONS
    );
  }

  async invalidateUserRecommendations(userId: string): Promise<void> {
    await cacheDelete(KEYS.USER_RECOMMENDATIONS(userId));
  }

  async getCachedPostRecommendations(
    userId: string
  ): Promise<RecommendedPost[] | null> {
    return cacheGet<RecommendedPost[]>(KEYS.POST_RECOMMENDATIONS(userId));
  }

  async setCachedPostRecommendations(
    userId: string,
    data: RecommendedPost[]
  ): Promise<void> {
    await cacheSet(
      KEYS.POST_RECOMMENDATIONS(userId),
      data,
      TTL.POST_RECOMMENDATIONS
    );
  }

  async invalidatePostRecommendations(userId: string): Promise<void> {
    await cacheDelete(KEYS.POST_RECOMMENDATIONS(userId));
  }

  async getCachedSimilarUsers(userId: string): Promise<SimilarUser[] | null> {
    return cacheGet<SimilarUser[]>(KEYS.SIMILAR_USERS(userId));
  }

  async setCachedSimilarUsers(
    userId: string,
    data: SimilarUser[]
  ): Promise<void> {
    await cacheSet(KEYS.SIMILAR_USERS(userId), data, TTL.SIMILAR_USERS);
  }

  async invalidateSimilarUsers(userId: string): Promise<void> {
    await cacheDelete(KEYS.SIMILAR_USERS(userId));
  }

  async getCachedUserInterests(userId: string): Promise<UserInterests | null> {
    return cacheGet<UserInterests>(KEYS.USER_INTERESTS(userId));
  }

  async setCachedUserInterests(
    userId: string,
    data: UserInterests
  ): Promise<void> {
    await cacheSet(KEYS.USER_INTERESTS(userId), data, TTL.USER_INTERESTS);
  }

  async invalidateUserInterests(userId: string): Promise<void> {
    await cacheDelete(KEYS.USER_INTERESTS(userId));
  }

  async getCachedTrendingPosts(): Promise<RecommendedPost[] | null> {
    return cacheGet<RecommendedPost[]>(KEYS.TRENDING_POSTS);
  }

  async setCachedTrendingPosts(data: RecommendedPost[]): Promise<void> {
    await cacheSet(KEYS.TRENDING_POSTS, data, TTL.TRENDING_POSTS);
  }

  async invalidateTrendingPosts(): Promise<void> {
    await cacheDelete(KEYS.TRENDING_POSTS);
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateUserRecommendations(userId),
      this.invalidatePostRecommendations(userId),
      this.invalidateSimilarUsers(userId),
      this.invalidateUserInterests(userId),
    ]);
  }

  async invalidateAllUserRecommendations(): Promise<void> {
    await cacheDeletePattern("recommendations:users:*");
  }

  async invalidateAllPostRecommendations(): Promise<void> {
    await cacheDeletePattern("recommendations:posts:*");
  }
}
