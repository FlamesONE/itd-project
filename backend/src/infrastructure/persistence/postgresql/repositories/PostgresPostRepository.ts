import { query, queryOne, execute } from "../connection";
import { Post, PostId, PostContent } from "../../../../domain/content";
import type { IPostRepository } from "../../../../domain/content";
import { UserId } from "../../../../domain/identity";

interface PostRow {
  id: string;
  author_id: string;
  wall_owner_id: string | null;
  content: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  views_count: number;
  engagement_score: number;
  is_pinned: boolean;
  pinned_at: Date | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PostgresPostRepository implements IPostRepository {
  async save(post: Post): Promise<void> {
    const existingPost = await queryOne<PostRow>(
      "SELECT id FROM posts WHERE id = $1",
      [post.id.value]
    );

    if (existingPost) {
      await execute(
        `UPDATE posts
         SET content = $1, is_deleted = $2, is_pinned = $3, pinned_at = $4, updated_at = $5
         WHERE id = $6`,
        [post.content.value, post.isDeleted, post.isPinned, post.pinnedAt ?? null, new Date(), post.id.value]
      );
    } else {
      await execute(
        `INSERT INTO posts (id, author_id, wall_owner_id, content, is_deleted, is_pinned, pinned_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          post.id.value,
          post.authorId.value,
          post.wallOwnerId?.value ?? null,
          post.content.value,
          post.isDeleted,
          post.isPinned,
          post.pinnedAt ?? null,
          post.createdAt,
          post.updatedAt,
        ]
      );
    }
  }

  async findById(id: PostId): Promise<Post | null> {
    const row = await queryOne<PostRow>(
      "SELECT * FROM posts WHERE id = $1",
      [id.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async findByAuthorId(
    authorId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Post[]> {
    const rows = await query<PostRow>(
      `SELECT * FROM posts
       WHERE author_id = $1 AND is_deleted = false
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [authorId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async findByWallOwnerId(
    wallOwnerId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Post[]> {
    const rows = await query<PostRow>(
      `SELECT * FROM posts
       WHERE is_deleted = false
         AND (
           (wall_owner_id = $1) OR
           (author_id = $1 AND wall_owner_id IS NULL)
         )
       ORDER BY is_pinned DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [wallOwnerId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: PostId): Promise<void> {
    await execute(
      "UPDATE posts SET is_deleted = true, updated_at = $1 WHERE id = $2",
      [new Date(), id.value]
    );
  }

  async existsById(id: PostId): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1 AND is_deleted = false) as exists",
      [id.value]
    );

    return row?.exists ?? false;
  }

  async getFeed(userId: UserId, limit = 20, offset = 0): Promise<Post[]> {
    const rows = await query<PostRow>(
      `SELECT p.* FROM posts p
       INNER JOIN follows f ON p.author_id = f.following_id
       WHERE f.follower_id = $1 AND p.is_deleted = false
       UNION
       SELECT p.* FROM posts p
       WHERE p.author_id = $1 AND p.is_deleted = false
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async getTrending(limit = 20, offset = 0, periodDays = 7): Promise<Post[]> {
    const rows = await query<PostRow>(
      `SELECT * FROM posts
       WHERE is_deleted = false
         AND created_at > NOW() - INTERVAL '1 day' * $1
       ORDER BY engagement_score DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [periodDays, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async updateEngagementScores(): Promise<void> {
    await execute(
      `UPDATE posts
       SET engagement_score = (
         COALESCE(likes_count, 0) + COALESCE(comments_count, 0) * 2 + COALESCE(reposts_count, 0) * 3
       ) / POWER(
         EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 + 2,
         1.5
       )
       WHERE is_deleted = false
         AND created_at > NOW() - INTERVAL '7 days'`,
      []
    );
  }

  async incrementViewCount(id: PostId): Promise<number> {
    const row = await queryOne<{ views_count: number }>(
      `UPDATE posts
       SET views_count = COALESCE(views_count, 0) + 1
       WHERE id = $1 AND is_deleted = false
       RETURNING views_count`,
      [id.value]
    );

    return row?.views_count ?? 0;
  }

  async search(searchQuery: string, limit = 20, offset = 0): Promise<Post[]> {
    const rows = await query<PostRow>(
      `SELECT * FROM posts
       WHERE is_deleted = false
         AND content ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${searchQuery}%`, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async pinPost(postId: PostId, userId: UserId): Promise<void> {
    await execute(
      `UPDATE posts
       SET is_pinned = false, pinned_at = null
       WHERE COALESCE(wall_owner_id, author_id) = $1 AND is_pinned = true`,
      [userId.value]
    );

    await execute(
      `UPDATE posts
       SET is_pinned = true, pinned_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND is_deleted = false`,
      [postId.value]
    );
  }

  async unpinPost(postId: PostId, userId: UserId): Promise<void> {
    await execute(
      `UPDATE posts
       SET is_pinned = false, pinned_at = null, updated_at = NOW()
       WHERE id = $1 AND COALESCE(wall_owner_id, author_id) = $2`,
      [postId.value, userId.value]
    );
  }

  async findPinnedPost(userId: UserId): Promise<Post | null> {
    const row = await queryOne<PostRow>(
      `SELECT * FROM posts
       WHERE COALESCE(wall_owner_id, author_id) = $1
         AND is_pinned = true
         AND is_deleted = false`,
      [userId.value]
    );

    if (!row) return null;
    return this.toDomain(row);
  }

  private toDomain(row: PostRow): Post {
    return Post.reconstitute({
      id: PostId.create(row.id).getValue(),
      authorId: UserId.create(row.author_id).getValue(),
      wallOwnerId: row.wall_owner_id ? UserId.create(row.wall_owner_id).getValue() : undefined,
      content: PostContent.create(row.content).getValue(),
      likesCount: row.likes_count ?? 0,
      commentsCount: row.comments_count ?? 0,
      repostsCount: row.reposts_count ?? 0,
      viewsCount: row.views_count ?? 0,
      engagementScore: row.engagement_score ?? 0,
      isPinned: row.is_pinned ?? false,
      pinnedAt: row.pinned_at ?? undefined,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
