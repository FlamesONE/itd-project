import { query } from "../../persistence/postgresql/connection";
import type { RecommendationCacheService, SimilarUser } from "./RecommendationCacheService";

export interface SimilarUserByFollows {
  userId: string;
  commonFollows: number;
  totalFollows: number;
  similarityScore: number;
}

export interface SimilarUserByLikes {
  userId: string;
  commonLikes: number;
  similarityScore: number;
}

export interface PopularPostAmongSimilar {
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  engagementScore: number;
  createdAt: Date;
  likedByCount: number;
}

export class CollaborativeFilteringService {
  constructor(
    private readonly cacheService: RecommendationCacheService
  ) {}

  async getSimilarUsersByFollows(
    userId: string,
    limit = 20
  ): Promise<SimilarUserByFollows[]> {

    const cached = await this.cacheService.getCachedSimilarUsers(userId);
    if (cached) {
      return cached
        .filter((u) => u.commonFollows !== undefined)
        .map((u) => ({
          userId: u.userId,
          commonFollows: u.commonFollows!,
          totalFollows: 0,
          similarityScore: u.similarityScore,
        }))
        .slice(0, limit);
    }

    const sql = `
      WITH user_follows AS (
        SELECT following_id FROM follows WHERE follower_id = $1
      ),
      similar_users AS (
        SELECT
          f.follower_id AS user_id,
          COUNT(*) AS common_follows,
          (SELECT COUNT(*) FROM follows WHERE follower_id = f.follower_id) AS total_follows
        FROM follows f
        WHERE f.following_id IN (SELECT following_id FROM user_follows)
          AND f.follower_id != $1
          AND f.follower_id NOT IN (SELECT following_id FROM user_follows)
        GROUP BY f.follower_id
        HAVING COUNT(*) >= 2
      )
      SELECT
        user_id,
        common_follows,
        total_follows,
        common_follows::float / GREATEST(
          total_follows + (SELECT COUNT(*) FROM user_follows) - common_follows,
          1
        ) AS similarity_score
      FROM similar_users
      ORDER BY similarity_score DESC
      LIMIT $2
    `;

    const rows = await query<{
      user_id: string;
      common_follows: string;
      total_follows: string;
      similarity_score: number;
    }>(sql, [userId, limit]);

    const result = rows.map((row) => ({
      userId: row.user_id,
      commonFollows: parseInt(row.common_follows, 10),
      totalFollows: parseInt(row.total_follows, 10),
      similarityScore: row.similarity_score,
    }));

    const cacheData: SimilarUser[] = result.map((r) => ({
      userId: r.userId,
      similarityScore: r.similarityScore,
      commonFollows: r.commonFollows,
    }));
    await this.cacheService.setCachedSimilarUsers(userId, cacheData);

    return result;
  }

  async getSimilarUsersByLikes(
    userId: string,
    limit = 20
  ): Promise<SimilarUserByLikes[]> {
    const sql = `
      WITH user_likes AS (
        SELECT post_id FROM likes WHERE user_id = $1
      )
      SELECT
        l.user_id,
        COUNT(*) AS common_likes,
        COUNT(*)::float / GREATEST((SELECT COUNT(*) FROM user_likes), 1) AS similarity_score
      FROM likes l
      WHERE l.post_id IN (SELECT post_id FROM user_likes)
        AND l.user_id != $1
      GROUP BY l.user_id
      HAVING COUNT(*) >= 3
      ORDER BY similarity_score DESC
      LIMIT $2
    `;

    const rows = await query<{
      user_id: string;
      common_likes: string;
      similarity_score: number;
    }>(sql, [userId, limit]);

    return rows.map((row) => ({
      userId: row.user_id,
      commonLikes: parseInt(row.common_likes, 10),
      similarityScore: row.similarity_score,
    }));
  }

  async getSimilarUsers(userId: string, limit = 20): Promise<SimilarUser[]> {
    const [byFollows, byLikes] = await Promise.all([
      this.getSimilarUsersByFollows(userId, limit),
      this.getSimilarUsersByLikes(userId, limit),
    ]);

    const userScores = new Map<string, SimilarUser>();

    for (const user of byFollows) {
      userScores.set(user.userId, {
        userId: user.userId,
        similarityScore: user.similarityScore * 0.6,
        commonFollows: user.commonFollows,
      });
    }

    for (const user of byLikes) {
      const existing = userScores.get(user.userId);
      if (existing) {
        existing.similarityScore += user.similarityScore * 0.4;
        existing.commonLikes = user.commonLikes;
      } else {
        userScores.set(user.userId, {
          userId: user.userId,
          similarityScore: user.similarityScore * 0.4,
          commonLikes: user.commonLikes,
        });
      }
    }

    return Array.from(userScores.values())
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  async getPopularPostsAmongSimilarUsers(
    similarUserIds: string[],
    excludeUserId: string,
    limit = 20
  ): Promise<PopularPostAmongSimilar[]> {
    if (similarUserIds.length === 0) {
      return [];
    }

    const sql = `
      SELECT
        p.id AS post_id,
        p.author_id,
        p.content,
        p.likes_count,
        p.comments_count,
        p.reposts_count,
        p.views_count,
        p.engagement_score,
        p.created_at,
        COUNT(l.user_id) AS liked_by_count
      FROM posts p
      INNER JOIN likes l ON p.id = l.post_id
      WHERE l.user_id = ANY($1::uuid[])
        AND p.author_id != $2
        AND p.is_deleted = false
        AND p.created_at > NOW() - INTERVAL '7 days'
      GROUP BY p.id
      ORDER BY liked_by_count DESC, p.engagement_score DESC
      LIMIT $3
    `;

    const rows = await query<{
      post_id: string;
      author_id: string;
      content: string;
      likes_count: number;
      comments_count: number;
      reposts_count: number;
      views_count: number;
      engagement_score: number;
      created_at: Date;
      liked_by_count: string;
    }>(sql, [similarUserIds, excludeUserId, limit]);

    return rows.map((row) => ({
      postId: row.post_id,
      authorId: row.author_id,
      content: row.content,
      likesCount: row.likes_count,
      commentsCount: row.comments_count,
      repostsCount: row.reposts_count,
      viewsCount: row.views_count,
      engagementScore: row.engagement_score,
      createdAt: row.created_at,
      likedByCount: parseInt(row.liked_by_count, 10),
    }));
  }

  async getRecommendedUsersBySimilarUsers(
    userId: string,
    similarUserIds: string[],
    limit = 10
  ): Promise<Array<{ userId: string; followedByCount: number }>> {
    if (similarUserIds.length === 0) {
      return [];
    }

    const sql = `
      SELECT
        f.following_id AS user_id,
        COUNT(*) AS followed_by_count
      FROM follows f
      WHERE f.follower_id = ANY($1::uuid[])
        AND f.following_id != $2
        AND f.following_id NOT IN (
          SELECT following_id FROM follows WHERE follower_id = $2
        )
      GROUP BY f.following_id
      ORDER BY followed_by_count DESC
      LIMIT $3
    `;

    const rows = await query<{
      user_id: string;
      followed_by_count: string;
    }>(sql, [similarUserIds, userId, limit]);

    return rows.map((row) => ({
      userId: row.user_id,
      followedByCount: parseInt(row.followed_by_count, 10),
    }));
  }
}
