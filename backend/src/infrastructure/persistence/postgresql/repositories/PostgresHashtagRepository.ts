import { query, queryOne } from "../connection";
import { Hashtag, HashtagId } from "../../../../domain/content/entities/Hashtag";
import type {
  IHashtagRepository,
  TrendingHashtag,
  UserHashtag,
  PostByHashtag,
} from "../../../../domain/content/repositories/IHashtagRepository";
import type { PostId } from "../../../../domain/content/value-objects/PostId";
import type { UserId } from "../../../../domain/identity/value-objects/UserId";

interface HashtagRow {
  id: string;
  name: string;
  posts_count: number;
  daily_count: number;
  weekly_count: number;
  last_used_at: Date;
  created_at: Date;
}

export class PostgresHashtagRepository implements IHashtagRepository {
  async findById(id: HashtagId): Promise<Hashtag | null> {
    const row = await queryOne<HashtagRow>(
      "SELECT * FROM hashtags WHERE id = $1",
      [id.value]
    );

    if (!row) return null;
    return this.toDomain(row);
  }

  async findByName(name: string): Promise<Hashtag | null> {
    const row = await queryOne<HashtagRow>(
      "SELECT * FROM hashtags WHERE name = $1",
      [name.toLowerCase()]
    );

    if (!row) return null;
    return this.toDomain(row);
  }

  async findByPostId(postId: PostId): Promise<Hashtag[]> {
    const rows = await query<HashtagRow>(
      `SELECT h.* FROM hashtags h
       INNER JOIN post_hashtags ph ON h.id = ph.hashtag_id
       WHERE ph.post_id = $1`,
      [postId.value]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async getTrending(
    period: "day" | "week" | "all",
    limit: number
  ): Promise<TrendingHashtag[]> {
    let orderBy: string;

    switch (period) {
      case "day":
        orderBy = "daily_count DESC, posts_count DESC";
        break;
      case "week":
        orderBy = "weekly_count DESC, posts_count DESC";
        break;
      default:
        orderBy = "posts_count DESC";
    }

    const rows = await query<HashtagRow>(
      `SELECT * FROM hashtags
       WHERE posts_count > 0
       ORDER BY ${orderBy}
       LIMIT $1`,
      [limit]
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      postsCount: row.posts_count,
      dailyCount: row.daily_count ?? 0,
      weeklyCount: row.weekly_count ?? 0,
    }));
  }

  async search(prefix: string, limit: number): Promise<Hashtag[]> {
    const rows = await query<HashtagRow>(
      `SELECT * FROM hashtags
       WHERE name LIKE $1
       ORDER BY posts_count DESC
       LIMIT $2`,
      [`${prefix.toLowerCase()}%`, limit]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async getPostsCount(name: string): Promise<number> {
    const row = await queryOne<{ posts_count: number }>(
      "SELECT posts_count FROM hashtags WHERE name = $1",
      [name.toLowerCase()]
    );

    return row?.posts_count ?? 0;
  }

  async getUserTopHashtags(userId: UserId, limit = 10): Promise<UserHashtag[]> {
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
    }>(sql, [userId.value, limit]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      userUsageCount: parseInt(row.user_usage_count, 10),
    }));
  }

  async getPostsByHashtags(
    hashtagNames: string[],
    excludeAuthorId: UserId,
    limit = 20
  ): Promise<PostByHashtag[]> {
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
    }>(sql, [hashtagNames, excludeAuthorId.value, limit]);

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

  private toDomain(row: HashtagRow): Hashtag {
    return Hashtag.reconstitute({
      id: HashtagId.create(row.id).getValue(),
      name: row.name,
      postsCount: row.posts_count,
      dailyCount: row.daily_count ?? 0,
      weeklyCount: row.weekly_count ?? 0,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
    });
  }
}
