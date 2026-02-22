import { query, queryOne, execute } from "../connection";
import { Like, LikeId } from "../../../../domain/social";
import type {
  ILikeRepository,
  SimilarUserByLikes,
  PopularPostAmongUsers,
} from "../../../../domain/social";
import { UserId } from "../../../../domain/identity";
import { PostId } from "../../../../domain/content";

interface LikeRow {
  id: string;
  user_id: string;
  post_id: string;
  created_at: Date;
}

export class PostgresLikeRepository implements ILikeRepository {
  async save(like: Like): Promise<void> {
    await execute(
      `INSERT INTO likes (id, user_id, post_id, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, post_id) DO NOTHING`,
      [like.id.value, like.userId.value, like.postId.value, like.createdAt]
    );
  }

  async delete(userId: UserId, postId: PostId): Promise<void> {
    await execute(
      "DELETE FROM likes WHERE user_id = $1 AND post_id = $2",
      [userId.value, postId.value]
    );
  }

  async findByUserAndPost(
    userId: UserId,
    postId: PostId
  ): Promise<Like | null> {
    const row = await queryOne<LikeRow>(
      "SELECT * FROM likes WHERE user_id = $1 AND post_id = $2",
      [userId.value, postId.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async getLikesByPost(
    postId: PostId,
    limit = 20,
    offset = 0
  ): Promise<Like[]> {
    const rows = await query<LikeRow>(
      `SELECT * FROM likes
       WHERE post_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async getLikesByUser(
    userId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Like[]> {
    const rows = await query<LikeRow>(
      `SELECT * FROM likes
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async countByPost(postId: PostId): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM likes WHERE post_id = $1",
      [postId.value]
    );

    return parseInt(row?.count ?? "0", 10);
  }

  async isLikedBy(userId: UserId, postId: PostId): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2) as exists",
      [userId.value, postId.value]
    );

    return row?.exists ?? false;
  }

  async getSimilarUsersByLikes(
    userId: UserId,
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
    }>(sql, [userId.value, limit]);

    return rows.map((row) => ({
      userId: row.user_id,
      commonLikes: parseInt(row.common_likes, 10),
      similarityScore: row.similarity_score,
    }));
  }

  async getPopularPostsAmongUsers(
    userIds: string[],
    excludeUserId: UserId,
    limit = 20
  ): Promise<PopularPostAmongUsers[]> {
    if (userIds.length === 0) {
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
    }>(sql, [userIds, excludeUserId.value, limit]);

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

  private toDomain(row: LikeRow): Like {
    return Like.reconstitute({
      id: LikeId.create(row.id).getValue(),
      userId: UserId.create(row.user_id).getValue(),
      postId: PostId.create(row.post_id).getValue(),
      createdAt: row.created_at,
    });
  }
}
