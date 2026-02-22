import { getPool } from "../connection";
import type { IMediaRepository } from "../../../../domain/media/repositories/IMediaRepository";
import { Media, MediaId, MediaType } from "../../../../domain/media";
import { UserId } from "../../../../domain/identity";
import { PostId } from "../../../../domain/content";

interface MediaRow {
  id: string;
  user_id: string;
  post_id: string | null;
  type: string;
  url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  file_size: number;
  mime_type: string;
  created_at: Date;
}

export class PostgresMediaRepository implements IMediaRepository {
  async findById(id: MediaId): Promise<Media | null> {
    const pool = getPool();
    const result = await pool.query<MediaRow>(
      `SELECT * FROM media WHERE id = $1`,
      [id.value]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.toDomain(result.rows[0]);
  }

  async findByPostId(postId: PostId): Promise<Media[]> {
    const pool = getPool();
    const result = await pool.query<MediaRow>(
      `SELECT * FROM media WHERE post_id = $1 ORDER BY created_at`,
      [postId.value]
    );

    return Promise.all(result.rows.map((row) => this.toDomain(row)));
  }

  async findByUserId(
    userId: UserId,
    limit: number = 20,
    offset: number = 0
  ): Promise<Media[]> {
    const pool = getPool();
    const result = await pool.query<MediaRow>(
      `SELECT * FROM media WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId.value, limit, offset]
    );

    return Promise.all(result.rows.map((row) => this.toDomain(row)));
  }

  async save(media: Media): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO media (
        id, user_id, post_id, type, url, thumbnail_url,
        width, height, file_size, mime_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        post_id = $3,
        thumbnail_url = $6,
        width = $7,
        height = $8`,
      [
        media.id.value,
        media.userId.value,
        media.postId?.value ?? null,
        media.type,
        media.url,
        media.thumbnailUrl,
        media.width,
        media.height,
        media.fileSize,
        media.mimeType,
        media.createdAt,
      ]
    );
  }

  async delete(id: MediaId): Promise<void> {
    const pool = getPool();
    await pool.query(`DELETE FROM media WHERE id = $1`, [id.value]);
  }

  async updatePostId(mediaId: MediaId, postId: PostId): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE media SET post_id = $1 WHERE id = $2`,
      [postId.value, mediaId.value]
    );
  }

  private async toDomain(row: MediaRow): Promise<Media> {
    const mediaIdResult = MediaId.create(row.id);
    const userIdResult = UserId.create(row.user_id);

    if (mediaIdResult.isFailure() || userIdResult.isFailure()) {
      throw new Error("Invalid data in database");
    }

    let postId: PostId | null = null;
    if (row.post_id) {
      const postIdResult = PostId.create(row.post_id);
      if (postIdResult.isSuccess()) {
        postId = postIdResult.getValue();
      }
    }

    const result = Media.reconstruct(mediaIdResult.getValue(), {
      userId: userIdResult.getValue(),
      postId,
      type: row.type as MediaType,
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      width: row.width,
      height: row.height,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      createdAt: row.created_at,
    });

    if (result.isFailure()) {
      throw new Error("Failed to reconstruct Media");
    }

    return result.getValue();
  }
}
