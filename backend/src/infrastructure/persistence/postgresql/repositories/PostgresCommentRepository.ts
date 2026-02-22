import { query, queryOne, execute } from "../connection";
import { Comment, CommentId, PostId } from "../../../../domain/content";
import type { ICommentRepository, CommentSortBy } from "../../../../domain/content";
import { UserId } from "../../../../domain/identity";

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  audio_url: string | null;
  audio_duration: number | null;
  likes_count: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PostgresCommentRepository implements ICommentRepository {
  async save(comment: Comment): Promise<void> {
    const existingComment = await queryOne<CommentRow>(
      "SELECT id FROM comments WHERE id = $1",
      [comment.id.value]
    );

    if (existingComment) {
      await execute(
        `UPDATE comments
         SET content = $1, audio_url = $2, audio_duration = $3, is_deleted = $4, updated_at = $5
         WHERE id = $6`,
        [comment.content, comment.audioUrl, comment.audioDuration, comment.isDeleted, new Date(), comment.id.value]
      );
    } else {
      await execute(
        `INSERT INTO comments (id, post_id, author_id, parent_comment_id, content, audio_url, audio_duration, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          comment.id.value,
          comment.postId.value,
          comment.authorId.value,
          comment.parentCommentId?.value ?? null,
          comment.content,
          comment.audioUrl,
          comment.audioDuration,
          comment.isDeleted,
          comment.createdAt,
          comment.updatedAt,
        ]
      );
    }
  }

  async findById(id: CommentId): Promise<Comment | null> {
    const row = await queryOne<CommentRow>(
      "SELECT * FROM comments WHERE id = $1",
      [id.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async findByPostId(
    postId: PostId,
    limit = 20,
    offset = 0,
    sortBy: CommentSortBy = 'NEWEST'
  ): Promise<Comment[]> {
    const orderBy = sortBy === 'POPULAR'
      ? 'likes_count DESC, created_at DESC'
      : 'created_at DESC';

    const rows = await query<CommentRow>(
      `SELECT * FROM comments
       WHERE post_id = $1 AND is_deleted = false AND parent_comment_id IS NULL
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [postId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async findByAuthorId(
    authorId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Comment[]> {
    const rows = await query<CommentRow>(
      `SELECT * FROM comments
       WHERE author_id = $1 AND is_deleted = false
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [authorId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: CommentId): Promise<void> {
    await execute(
      "UPDATE comments SET is_deleted = true, updated_at = $1 WHERE id = $2",
      [new Date(), id.value]
    );
  }

  async countByPostId(postId: PostId): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM comments WHERE post_id = $1 AND is_deleted = false",
      [postId.value]
    );

    return parseInt(row?.count ?? "0", 10);
  }

  async findReplies(
    parentCommentId: CommentId,
    limit = 20,
    offset = 0
  ): Promise<Comment[]> {
    const rows = await query<CommentRow>(
      `SELECT * FROM comments
       WHERE parent_comment_id = $1 AND is_deleted = false
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [parentCommentId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async countReplies(parentCommentId: CommentId): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM comments WHERE parent_comment_id = $1 AND is_deleted = false",
      [parentCommentId.value]
    );

    return parseInt(row?.count ?? "0", 10);
  }

  private toDomain(row: CommentRow): Comment {
    return Comment.reconstitute({
      id: CommentId.create(row.id).getValue(),
      postId: PostId.create(row.post_id).getValue(),
      authorId: UserId.create(row.author_id).getValue(),
      parentCommentId: row.parent_comment_id
        ? CommentId.create(row.parent_comment_id).getValue()
        : null,
      content: row.content || "",
      audioUrl: row.audio_url,
      audioDuration: row.audio_duration,
      likesCount: row.likes_count ?? 0,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
