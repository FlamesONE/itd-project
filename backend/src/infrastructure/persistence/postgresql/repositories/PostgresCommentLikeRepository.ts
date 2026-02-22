import { query, queryOne, execute } from "../connection";
import { CommentLike } from "../../../../domain/social/entities/CommentLike";
import { CommentLikeId } from "../../../../domain/social/value-objects/CommentLikeId";
import { UserId } from "../../../../domain/identity/value-objects/UserId";
import { CommentId } from "../../../../domain/content/value-objects/CommentId";
import type { ICommentLikeRepository } from "../../../../domain/social/repositories/ICommentLikeRepository";

interface CommentLikeRow {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: Date;
}

export class PostgresCommentLikeRepository implements ICommentLikeRepository {
  async save(commentLike: CommentLike): Promise<void> {
    await execute(
      `INSERT INTO comment_likes (id, user_id, comment_id, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, comment_id) DO NOTHING`,
      [
        commentLike.id.value,
        commentLike.userId.value,
        commentLike.commentId.value,
        commentLike.createdAt,
      ]
    );
  }

  async delete(id: CommentLikeId): Promise<void> {
    await execute("DELETE FROM comment_likes WHERE id = $1", [id.value]);
  }

  async findById(id: CommentLikeId): Promise<CommentLike | null> {
    const row = await queryOne<CommentLikeRow>(
      "SELECT * FROM comment_likes WHERE id = $1",
      [id.value]
    );

    if (!row) return null;
    return this.toDomain(row);
  }

  async findByUserAndComment(userId: UserId, commentId: CommentId): Promise<CommentLike | null> {
    const row = await queryOne<CommentLikeRow>(
      "SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2",
      [userId.value, commentId.value]
    );

    if (!row) return null;
    return this.toDomain(row);
  }

  async isLikedBy(userId: UserId, commentId: CommentId): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM comment_likes WHERE user_id = $1 AND comment_id = $2) as exists",
      [userId.value, commentId.value]
    );

    return row?.exists ?? false;
  }

  async countByComment(commentId: CommentId): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1",
      [commentId.value]
    );

    return parseInt(row?.count ?? "0", 10);
  }

  private toDomain(row: CommentLikeRow): CommentLike {
    return CommentLike.reconstitute({
      id: CommentLikeId.create(row.id).getValue(),
      userId: UserId.create(row.user_id).getValue(),
      commentId: CommentId.create(row.comment_id).getValue(),
      createdAt: row.created_at,
    });
  }
}
