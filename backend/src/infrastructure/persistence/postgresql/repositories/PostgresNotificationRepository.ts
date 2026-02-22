import { query, queryOne, execute } from "../connection";
import {
  Notification,
  NotificationId,
  NotificationType,
} from "../../../../domain/notification";
import type { INotificationRepository } from "../../../../domain/notification";
import { UserId } from "../../../../domain/identity";
import { PostId, CommentId } from "../../../../domain/content";

interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: Date;
}

export class PostgresNotificationRepository implements INotificationRepository {
  async save(notification: Notification): Promise<void> {
    await execute(
      `INSERT INTO notifications (id, user_id, actor_id, type, post_id, comment_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET is_read = $7`,
      [
        notification.id.value,
        notification.userId.value,
        notification.actorId.value,
        notification.type.value,
        notification.postId?.value ?? null,
        notification.commentId?.value ?? null,
        notification.isRead,
        notification.createdAt,
      ]
    );
  }

  async findById(id: NotificationId): Promise<Notification | null> {
    const row = await queryOne<NotificationRow>(
      "SELECT * FROM notifications WHERE id = $1",
      [id.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async findByUserId(
    userId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Notification[]> {
    const rows = await query<NotificationRow>(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async findUnreadByUserId(
    userId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Notification[]> {
    const rows = await query<NotificationRow>(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND is_read = false
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async countUnreadByUserId(userId: UserId): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false",
      [userId.value]
    );

    return parseInt(row?.count ?? "0", 10);
  }

  async markAsRead(id: NotificationId): Promise<void> {
    await execute("UPDATE notifications SET is_read = true WHERE id = $1", [
      id.value,
    ]);
  }

  async markAllAsRead(userId: UserId): Promise<void> {
    await execute(
      "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
      [userId.value]
    );
  }

  async markPostNotificationsAsRead(userId: UserId, postId: PostId): Promise<void> {
    await execute(
      "UPDATE notifications SET is_read = true WHERE user_id = $1 AND post_id = $2 AND is_read = false",
      [userId.value, postId.value]
    );
  }

  async delete(id: NotificationId): Promise<void> {
    await execute("DELETE FROM notifications WHERE id = $1", [id.value]);
  }

  private toDomain(row: NotificationRow): Notification {
    return Notification.reconstitute({
      id: NotificationId.create(row.id).getValue(),
      userId: UserId.create(row.user_id).getValue(),
      actorId: UserId.create(row.actor_id).getValue(),
      type: NotificationType.create(row.type).getValue(),
      postId: row.post_id ? PostId.create(row.post_id).getValue() : null,
      commentId: row.comment_id
        ? CommentId.create(row.comment_id).getValue()
        : null,
      isRead: row.is_read,
      createdAt: row.created_at,
    });
  }
}
