import { query, queryOne, execute } from "../connection";
import { Repost, RepostId } from "../../../../domain/social";
import type { IRepostRepository } from "../../../../domain/social";
import { UserId } from "../../../../domain/identity";
import { PostId } from "../../../../domain/content";

interface RepostRow {
  id: string;
  user_id: string;
  post_id: string;
  quote_content: string | null;
  created_at: Date;
}

export class PostgresRepostRepository implements IRepostRepository {
  async save(repost: Repost): Promise<void> {
    await execute(
      `INSERT INTO reposts (id, user_id, post_id, quote_content, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, post_id) DO NOTHING`,
      [
        repost.id.value,
        repost.userId.value,
        repost.postId.value,
        repost.quoteContent,
        repost.createdAt,
      ]
    );
  }

  async delete(userId: UserId, postId: PostId): Promise<void> {
    await execute(
      "DELETE FROM reposts WHERE user_id = $1 AND post_id = $2",
      [userId.value, postId.value]
    );
  }

  async findByUserAndPost(
    userId: UserId,
    postId: PostId
  ): Promise<Repost | null> {
    const row = await queryOne<RepostRow>(
      "SELECT * FROM reposts WHERE user_id = $1 AND post_id = $2",
      [userId.value, postId.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async getRepostsByPost(
    postId: PostId,
    limit = 20,
    offset = 0
  ): Promise<Repost[]> {
    const rows = await query<RepostRow>(
      `SELECT * FROM reposts
       WHERE post_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async getRepostsByUser(
    userId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Repost[]> {
    const rows = await query<RepostRow>(
      `SELECT * FROM reposts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async countByPost(postId: PostId): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM reposts WHERE post_id = $1",
      [postId.value]
    );

    return parseInt(row?.count ?? "0", 10);
  }

  async isRepostedBy(userId: UserId, postId: PostId): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM reposts WHERE user_id = $1 AND post_id = $2) as exists",
      [userId.value, postId.value]
    );

    return row?.exists ?? false;
  }

  private toDomain(row: RepostRow): Repost {
    return Repost.reconstitute({
      id: RepostId.create(row.id).getValue(),
      userId: UserId.create(row.user_id).getValue(),
      postId: PostId.create(row.post_id).getValue(),
      quoteContent: row.quote_content,
      createdAt: row.created_at,
    });
  }
}
