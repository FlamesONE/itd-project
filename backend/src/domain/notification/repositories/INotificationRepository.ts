import { Notification } from "../entities/Notification";
import { NotificationId } from "../value-objects/NotificationId";
import { UserId } from "../../identity/value-objects/UserId";
import { PostId } from "../../content/value-objects/PostId";

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: NotificationId): Promise<Notification | null>;
  findByUserId(
    userId: UserId,
    limit?: number,
    offset?: number
  ): Promise<Notification[]>;
  findUnreadByUserId(
    userId: UserId,
    limit?: number,
    offset?: number
  ): Promise<Notification[]>;
  countUnreadByUserId(userId: UserId): Promise<number>;
  markAsRead(id: NotificationId): Promise<void>;
  markAllAsRead(userId: UserId): Promise<void>;
  markPostNotificationsAsRead(userId: UserId, postId: PostId): Promise<void>;
  delete(id: NotificationId): Promise<void>;
}
