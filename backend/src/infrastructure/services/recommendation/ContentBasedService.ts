import { query } from "../../persistence/postgresql/connection";
import type { RecommendationCacheService, UserInterests } from "./RecommendationCacheService";

export interface UserHashtag {
  id: string;
  name: string;
  userUsageCount: number;
}

export interface ContentBasedPost {
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  engagementScore: number;
  createdAt: Date;
  matchingTags: number;
  contentScore: number;
}

export interface UserByHashtags {
  userId: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  commonHashtags: number;
  hashtagSimilarity: number;
}

export class ContentBasedService {
  constructor(
    private readonly cacheService: RecommendationCacheService
  ) {}

  async getUserTopHashtags(userId: string, limit = 10): Promise<UserHashtag[]> {

    const cached = await this.cacheService.getCachedUserInterests(userId);
    if (cached && cached.topHashtags.length > 0) {

      return cached.topHashtags.slice(0, limit).map((name, idx) => ({
        id: `cached-${idx}`,
        name,
        userUsageCount: 0,
      }));
    }

    const sql = `
      SELECT
        h.id,
        h.name,
        COUNT(ph.post_id) AS user_usage_count
      FROM hashtags h
      INNER JOIN post_hashtags ph ON h.id = ph.hashtag_id
      INNER JOIN posts p ON ph.post_id = p.id
      WHERE p.author_id = $1 AND p.is_deleted = false
      GROUP BY h.id
      ORDER BY user_usage_count DESC
      LIMIT $2
    `;

    const rows = await query<{
      id: string;
      name: string;
      user_usage_count: string;
    }>(sql, [userId, limit]);

    const result = rows.map((row) => ({
      id: row.id,
      name: row.name,
      userUsageCount: parseInt(row.user_usage_count, 10),
    }));

    if (result.length > 0) {
      const interests: UserInterests = {
        topHashtags: result.map((r) => r.name),
        preferredTopics: [],
        engagementPatterns: {
          likeWeight: 1,
          commentWeight: 2,
          repostWeight: 3,
        },
      };
      await this.cacheService.setCachedUserInterests(userId, interests);
    }

    return result;
  }

  async getPostsByHashtags(
    hashtagNames: string[],
    excludeAuthorId: string,
    limit = 20
  ): Promise<ContentBasedPost[]> {
    if (hashtagNames.length === 0) {
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
        COUNT(DISTINCT ph.hashtag_id) AS matching_tags,
        p.engagement_score * (1 + COUNT(DISTINCT ph.hashtag_id) * 0.2) AS content_score
      FROM posts p
      INNER JOIN post_hashtags ph ON p.id = ph.post_id
      INNER JOIN hashtags h ON ph.hashtag_id = h.id
      WHERE h.name = ANY($1)
        AND p.author_id != $2
        AND p.is_deleted = false
        AND p.created_at > NOW() - INTERVAL '7 days'
      GROUP BY p.id
      ORDER BY content_score DESC
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
      matching_tags: string;
      content_score: number;
    }>(sql, [hashtagNames, excludeAuthorId, limit]);

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
      matchingTags: parseInt(row.matching_tags, 10),
      contentScore: row.content_score,
    }));
  }

  async getUsersByHashtags(
    hashtagNames: string[],
    excludeUserId: string,
    limit = 10
  ): Promise<UserByHashtags[]> {
    if (hashtagNames.length === 0) {
      return [];
    }

    const sql = `
      SELECT
        u.id AS user_id,
        u.username,
        u.display_name,
        u.emoji,
        u.avatar_url,
        u.bio,
        u.followers_count,
        COUNT(DISTINCT h.id) AS common_hashtags,
        COUNT(DISTINCT h.id)::float / $4 AS hashtag_similarity
      FROM users u
      INNER JOIN posts p ON u.id = p.author_id
      INNER JOIN post_hashtags ph ON p.id = ph.post_id
      INNER JOIN hashtags h ON ph.hashtag_id = h.id
      WHERE h.name = ANY($1)
        AND u.id != $2
        AND u.id NOT IN (
          SELECT following_id FROM follows WHERE follower_id = $2
        )
        AND p.is_deleted = false
      GROUP BY u.id
      HAVING COUNT(DISTINCT h.id) >= 2
      ORDER BY common_hashtags DESC, u.followers_count DESC
      LIMIT $3
    `;

    const rows = await query<{
      user_id: string;
      username: string;
      display_name: string;
      emoji: string;
      avatar_url: string | null;
      bio: string | null;
      followers_count: number;
      common_hashtags: string;
      hashtag_similarity: number;
    }>(sql, [hashtagNames, excludeUserId, limit, hashtagNames.length]);

    return rows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      emoji: row.emoji,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      followersCount: row.followers_count,
      commonHashtags: parseInt(row.common_hashtags, 10),
      hashtagSimilarity: row.hashtag_similarity,
    }));
  }

  async getContentBasedPostRecommendations(
    userId: string,
    limit = 20
  ): Promise<ContentBasedPost[]> {

    const userHashtags = await this.getUserTopHashtags(userId, 10);

    if (userHashtags.length === 0) {
      return [];
    }

    const hashtagNames = userHashtags.map((h) => h.name);

    return this.getPostsByHashtags(hashtagNames, userId, limit);
  }

  async getContentBasedUserRecommendations(
    userId: string,
    limit = 10
  ): Promise<UserByHashtags[]> {

    const userHashtags = await this.getUserTopHashtags(userId, 10);

    if (userHashtags.length === 0) {
      return [];
    }

    const hashtagNames = userHashtags.map((h) => h.name);

    return this.getUsersByHashtags(hashtagNames, userId, limit);
  }

  async analyzeUserEngagementPatterns(userId: string): Promise<{
    likeWeight: number;
    commentWeight: number;
    repostWeight: number;
  }> {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM likes WHERE user_id = $1) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE author_id = $1) AS comments_count,
        (SELECT COUNT(*) FROM reposts WHERE user_id = $1) AS reposts_count
    `;

    const rows = await query<{
      likes_count: string;
      comments_count: string;
      reposts_count: string;
    }>(sql, [userId]);

    if (rows.length === 0) {
      return { likeWeight: 1, commentWeight: 2, repostWeight: 3 };
    }

    const likes = parseInt(rows[0].likes_count, 10);
    const comments = parseInt(rows[0].comments_count, 10);
    const reposts = parseInt(rows[0].reposts_count, 10);

    const total = likes + comments + reposts || 1;

    return {
      likeWeight: 1 + (likes / total) * 2,
      commentWeight: 2 + (comments / total) * 3,
      repostWeight: 3 + (reposts / total) * 4,
    };
  }
}
