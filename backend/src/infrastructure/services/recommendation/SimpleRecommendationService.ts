import type {
  IRecommendationService,
  RecommendedUser,
  RecommendedPost,
} from "../../../domain/recommendation";
import type { IUserRepository } from "../../../domain/identity";
import type { IFollowRepository } from "../../../domain/social";
import type { IPostRepository } from "../../../domain/content";
import type { ILikeRepository } from "../../../domain/social";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import type { RecommendationCacheService } from "./RecommendationCacheService";
import type { CollaborativeFilteringService } from "./CollaborativeFilteringService";
import type { ContentBasedService } from "./ContentBasedService";
import type { ScoringService, PostMetrics, UserMetrics } from "./ScoringService";
import { query } from "../../persistence/postgresql/connection";

export class SimpleRecommendationService implements IRecommendationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly followRepository: IFollowRepository,
    private readonly postRepository: IPostRepository,
    private readonly likeRepository: ILikeRepository,
    private readonly cacheService?: RecommendationCacheService,
    private readonly collaborativeService?: CollaborativeFilteringService,
    private readonly contentService?: ContentBasedService,
    private readonly scoringService?: ScoringService
  ) {}

  async getUserRecommendations(
    userId: UserId,
    limit = 10
  ): Promise<RecommendedUser[]> {

    if (this.cacheService) {
      const cached = await this.cacheService.getCachedUserRecommendations(userId.value);
      if (cached) {
        return cached.slice(0, limit);
      }
    }

    const recommendations: RecommendedUser[] = [];
    const seenUserIds = new Set<string>();

    const following = await this.followRepository.getFollowing(userId);
    const followingIds = new Set(following.map((f) => f.followingId.value));

    if (this.collaborativeService) {
      try {
        const similarUsers = await this.collaborativeService.getSimilarUsers(
          userId.value,
          limit * 2
        );

        for (const similar of similarUsers) {
          if (seenUserIds.has(similar.userId) || followingIds.has(similar.userId)) {
            continue;
          }

          const user = await this.userRepository.findById(
            UserId.create(similar.userId).getValue()
          );
          if (!user) continue;

          seenUserIds.add(similar.userId);
          recommendations.push({
            userId: user.id.value,
            username: user.username.value,
            displayName: user.displayName,
            emoji: user.emoji,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            followersCount: user.followersCount,
            mutualFollowersCount: 0,
            score: 50 + similar.similarityScore * 100,
            reason: "similar_interests",
          });
        }
      } catch (error) {
        console.error("[Recommendations] Collaborative filtering error:", error);
      }
    }

    if (this.contentService) {
      try {
        const contentUsers = await this.contentService.getContentBasedUserRecommendations(
          userId.value,
          limit
        );

        for (const contentUser of contentUsers) {
          if (seenUserIds.has(contentUser.userId) || followingIds.has(contentUser.userId)) {
            continue;
          }

          seenUserIds.add(contentUser.userId);
          recommendations.push({
            userId: contentUser.userId,
            username: contentUser.username,
            displayName: contentUser.displayName,
            emoji: contentUser.emoji,
            avatarUrl: contentUser.avatarUrl,
            bio: contentUser.bio,
            followersCount: contentUser.followersCount,
            mutualFollowersCount: contentUser.commonHashtags,
            score: 40 + contentUser.hashtagSimilarity * 80,
            reason: "similar_interests",
          });
        }
      } catch (error) {
        console.error("[Recommendations] Content-based filtering error:", error);
      }
    }

    for (const follow of following.slice(0, 5)) {
      const friendsFollowing = await this.followRepository.getFollowing(
        follow.followingId
      );

      for (const ff of friendsFollowing.slice(0, 10)) {
        if (
          followingIds.has(ff.followingId.value) ||
          ff.followingId.value === userId.value ||
          seenUserIds.has(ff.followingId.value)
        ) {
          continue;
        }

        const user = await this.userRepository.findById(ff.followingId);
        if (!user) continue;

        const mutualCount = await this.countMutualFollowers(userId, ff.followingId);
        seenUserIds.add(ff.followingId.value);

        recommendations.push({
          userId: user.id.value,
          username: user.username.value,
          displayName: user.displayName,
          emoji: user.emoji,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          followersCount: user.followersCount,
          mutualFollowersCount: mutualCount,
          score: 30 + mutualCount * 10,
          reason: "mutual_followers",
        });
      }
    }

    const popularUsers = await this.getPopularUsers(userId, followingIds, seenUserIds);
    for (const user of popularUsers) {
      if (seenUserIds.has(user.id.value)) continue;
      seenUserIds.add(user.id.value);

      recommendations.push({
        userId: user.id.value,
        username: user.username.value,
        displayName: user.displayName,
        emoji: user.emoji,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        followersCount: user.followersCount,
        mutualFollowersCount: 0,
        score: Math.min(user.followersCount / 10, 50),
        reason: "popular",
      });
    }

    const newUsers = await this.getNewActiveUsers(userId, followingIds, seenUserIds);
    for (const user of newUsers) {
      if (seenUserIds.has(user.id)) continue;
      seenUserIds.add(user.id);

      recommendations.push({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        emoji: user.emoji,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        followersCount: user.followersCount,
        mutualFollowersCount: 0,
        score: 25 + user.postsCount * 5,
        reason: "new_user",
      });
    }

    let finalRecommendations: RecommendedUser[];
    if (this.scoringService) {
      const userMetrics: UserMetrics[] = recommendations.map((r) => ({
        userId: r.userId,
        username: r.username,
        displayName: r.displayName,
        emoji: r.emoji,
        avatarUrl: r.avatarUrl,
        bio: r.bio,
        followersCount: r.followersCount,
        mutualFollowersCount: r.mutualFollowersCount,
        similarityScore: r.score / 100,
      }));

      const scored = this.scoringService.processUserRecommendations(userMetrics, {
        limit,
        temperature: 1.2,
        useWeightedSampling: true,
      });

      finalRecommendations = scored.map((s) => {
        const original = recommendations.find((r) => r.userId === s.userId)!;
        return {
          ...original,
          score: s.finalScore,
        };
      });
    } else {
      finalRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    if (this.cacheService) {
      await this.cacheService.setCachedUserRecommendations(
        userId.value,
        finalRecommendations
      );
    }

    return finalRecommendations;
  }

  async getPostRecommendations(
    userId: UserId,
    limit = 20
  ): Promise<RecommendedPost[]> {

    if (this.cacheService) {
      const cached = await this.cacheService.getCachedPostRecommendations(userId.value);
      if (cached) {
        return cached.slice(0, limit);
      }
    }

    const recommendations: RecommendedPost[] = [];
    const seenPostIds = new Set<string>();

    if (this.collaborativeService) {
      try {
        const similarUsers = await this.collaborativeService.getSimilarUsers(
          userId.value,
          20
        );

        if (similarUsers.length > 0) {
          const similarUserIds = similarUsers.map((u) => u.userId);
          const popularPosts = await this.collaborativeService.getPopularPostsAmongSimilarUsers(
            similarUserIds,
            userId.value,
            limit
          );

          for (const post of popularPosts) {
            if (seenPostIds.has(post.postId)) continue;
            seenPostIds.add(post.postId);

            recommendations.push({
              postId: post.postId,
              authorId: post.authorId,
              content: post.content,
              likesCount: post.likesCount,
              commentsCount: post.commentsCount,
              repostsCount: post.repostsCount,
              score: post.engagementScore + post.likedByCount * 10,
              reason: "liked_by_follows",
            });
          }
        }
      } catch (error) {
        console.error("[Recommendations] Collaborative post filtering error:", error);
      }
    }

    if (this.contentService) {
      try {
        const contentPosts = await this.contentService.getContentBasedPostRecommendations(
          userId.value,
          limit
        );

        for (const post of contentPosts) {
          if (seenPostIds.has(post.postId)) continue;
          seenPostIds.add(post.postId);

          recommendations.push({
            postId: post.postId,
            authorId: post.authorId,
            content: post.content,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            repostsCount: post.repostsCount,
            score: post.contentScore,
            reason: "similar_content",
          });
        }
      } catch (error) {
        console.error("[Recommendations] Content-based post filtering error:", error);
      }
    }

    const trending = await this.postRepository.getTrending(limit, 0, 7);
    for (const post of trending) {
      if (post.authorId.value === userId.value || seenPostIds.has(post.id.value)) {
        continue;
      }
      seenPostIds.add(post.id.value);

      recommendations.push({
        postId: post.id.value,
        authorId: post.authorId.value,
        content: post.content.value,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        repostsCount: post.repostsCount,
        score: post.engagementScore,
        reason: "trending",
      });
    }

    const following = await this.followRepository.getFollowing(userId);
    for (const follow of following.slice(0, 5)) {
      const likedPosts = await this.likeRepository.getLikesByUser(
        follow.followingId,
        5
      );

      for (const like of likedPosts) {
        if (seenPostIds.has(like.postId.value)) continue;

        const post = await this.postRepository.findById(like.postId);
        if (!post || post.authorId.value === userId.value) continue;

        seenPostIds.add(post.id.value);
        recommendations.push({
          postId: post.id.value,
          authorId: post.authorId.value,
          content: post.content.value,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          repostsCount: post.repostsCount,
          score: 30,
          reason: "liked_by_follows",
        });
      }
    }

    let finalRecommendations: RecommendedPost[];
    if (this.scoringService) {
      const postMetrics: PostMetrics[] = recommendations.map((r) => ({
        postId: r.postId,
        authorId: r.authorId,
        content: r.content,
        likesCount: r.likesCount,
        commentsCount: r.commentsCount,
        repostsCount: r.repostsCount,
        viewsCount: 0,
        createdAt: new Date(),
      }));

      const scored = this.scoringService.processPostRecommendations(postMetrics, {
        limit,
        maxPostsPerAuthor: 2,
        temperature: 1.0,
        useWeightedSampling: true,
      });

      finalRecommendations = scored.map((s) => {
        const original = recommendations.find((r) => r.postId === s.postId)!;
        return {
          ...original,
          score: s.finalScore,
        };
      });
    } else {

      const authorCounts = new Map<string, number>();
      finalRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .filter((rec) => {
          const count = authorCounts.get(rec.authorId) || 0;
          if (count < 2) {
            authorCounts.set(rec.authorId, count + 1);
            return true;
          }
          return false;
        })
        .slice(0, limit);
    }

    if (this.cacheService) {
      await this.cacheService.setCachedPostRecommendations(
        userId.value,
        finalRecommendations
      );
    }

    return finalRecommendations;
  }

  async refreshUserRecommendations(userId: UserId): Promise<void> {
    if (this.cacheService) {
      await this.cacheService.invalidateAllForUser(userId.value);
    }

    await this.getUserRecommendations(userId);
    await this.getPostRecommendations(userId);
  }

  private async countMutualFollowers(
    userId1: UserId,
    userId2: UserId
  ): Promise<number> {
    const followers1 = await this.followRepository.getFollowers(userId1);
    const followers2 = await this.followRepository.getFollowers(userId2);

    const followers1Set = new Set(followers1.map((f) => f.followerId.value));

    let count = 0;
    for (const follower of followers2) {
      if (followers1Set.has(follower.followerId.value)) {
        count++;
      }
    }

    return count;
  }

  private async getPopularUsers(
    currentUserId: UserId,
    followingIds: Set<string>,
    excludeIds: Set<string>
  ): Promise<Array<{
    id: { value: string };
    username: { value: string };
    displayName: string;
    emoji: string;
    avatarUrl: string | null;
    bio: string | null;
    followersCount: number;
  }>> {
    const sql = `
      SELECT
        id,
        username,
        display_name,
        emoji,
        avatar_url,
        bio,
        followers_count
      FROM users
      WHERE id != $1
        AND id NOT IN (SELECT following_id FROM follows WHERE follower_id = $1)
      ORDER BY followers_count DESC
      LIMIT 10
    `;

    const rows = await query<{
      id: string;
      username: string;
      display_name: string;
      emoji: string;
      avatar_url: string | null;
      bio: string | null;
      followers_count: number;
    }>(sql, [currentUserId.value]);

    return rows
      .filter((row) => !followingIds.has(row.id) && !excludeIds.has(row.id))
      .map((row) => ({
        id: { value: row.id },
        username: { value: row.username },
        displayName: row.display_name,
        emoji: row.emoji,
        avatarUrl: row.avatar_url,
        bio: row.bio,
        followersCount: row.followers_count,
      }));
  }

  private async getNewActiveUsers(
    currentUserId: UserId,
    followingIds: Set<string>,
    excludeIds: Set<string>
  ): Promise<Array<{
    id: string;
    username: string;
    displayName: string;
    emoji: string;
    avatarUrl: string | null;
    bio: string | null;
    followersCount: number;
    postsCount: number;
  }>> {
    const sql = `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.emoji,
        u.avatar_url,
        u.bio,
        u.followers_count,
        u.posts_count
      FROM users u
      WHERE u.id != $1
        AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = $1)
        AND u.created_at > NOW() - INTERVAL '7 days'
        AND u.posts_count > 0
      ORDER BY u.created_at DESC, u.posts_count DESC
      LIMIT 10
    `;

    const rows = await query<{
      id: string;
      username: string;
      display_name: string;
      emoji: string;
      avatar_url: string | null;
      bio: string | null;
      followers_count: number;
      posts_count: number;
    }>(sql, [currentUserId.value]);

    return rows
      .filter((row) => !followingIds.has(row.id) && !excludeIds.has(row.id))
      .map((row) => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        emoji: row.emoji,
        avatarUrl: row.avatar_url,
        bio: row.bio,
        followersCount: row.followers_count,
        postsCount: row.posts_count,
      }));
  }
}
