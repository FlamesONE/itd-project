import type { Notification } from "../../../../domain/notification/entities/Notification";
import type { NotificationId } from "../../../../domain/notification/value-objects/NotificationId";
import type { UserId } from "../../../../domain/identity/value-objects/UserId";
import type { PostId } from "../../../../domain/content/value-objects/PostId";
import type { INotificationRepository } from "../../../../domain/notification/repositories/INotificationRepository";
import type { IUserRepository } from "../../../../domain/identity/repositories/IUserRepository";
import { getRedisPubSub, type NotificationEvent } from "../../../services/realtime";

export class BroadcastingNotificationRepository implements INotificationRepository {
  constructor(
    private readonly wrapped: INotificationRepository,
    private readonly userRepository: IUserRepository
  ) { }

  async save(notification: Notification): Promise<void> {

    await this.wrapped.save(notification);

    this.broadcastNotification(notification).catch((err) => {
      console.error("[BroadcastingNotificationRepository] Failed to broadcast:", err);
    });
  }

  async findById(id: NotificationId): Promise<Notification | null> {
    return this.wrapped.findById(id);
  }

  async findByUserId(userId: UserId, limit?: number, offset?: number): Promise<Notification[]> {
    return this.wrapped.findByUserId(userId, limit, offset);
  }

  async findUnreadByUserId(userId: UserId, limit?: number, offset?: number): Promise<Notification[]> {
    return this.wrapped.findUnreadByUserId(userId, limit, offset);
  }

  async countUnreadByUserId(userId: UserId): Promise<number> {
    return this.wrapped.countUnreadByUserId(userId);
  }

  async markAsRead(id: NotificationId): Promise<void> {
    await this.wrapped.markAsRead(id);

    const notification = await this.wrapped.findById(id);
    if (notification) {
      this.broadcastUnreadCount(notification.userId).catch(() => { });
    }
  }

  async markAllAsRead(userId: UserId): Promise<void> {
    await this.wrapped.markAllAsRead(userId);

    this.broadcastUnreadCountValue(userId.value, 0).catch(() => { });
  }

  async markPostNotificationsAsRead(userId: UserId, postId: PostId): Promise<void> {
    await this.wrapped.markPostNotificationsAsRead(userId, postId);

    await this.broadcastUnreadCount(userId);
  }

  async delete(id: NotificationId): Promise<void> {
    return this.wrapped.delete(id);
  }

  private async broadcastNotification(notification: Notification): Promise<void> {

    const actor = await this.userRepository.findById(notification.actorId);
    if (!actor) return;

    const message = this.generateMessage(notification.type.value, actor.displayName);

    const payload: NotificationEvent["payload"] = {
      id: notification.id.value,
      actorId: notification.actorId.value,
      actorUsername: actor.username.value,
      actorDisplayName: actor.displayName,
      actorAvatarUrl: actor.avatarUrl,
      actorEmoji: actor.emoji ?? null,
      type: notification.type.value,
      postId: notification.postId?.value ?? null,
      commentId: notification.commentId?.value ?? null,
      message,
      createdAt: notification.createdAt.toISOString(),
    };

    const pubsub = getRedisPubSub();
    await pubsub.publishNotification(notification.userId.value, payload);

    await this.broadcastUnreadCount(notification.userId);
  }

  private async broadcastUnreadCount(userId: UserId): Promise<void> {
    const unreadCount = await this.wrapped.countUnreadByUserId(userId);
    await this.broadcastUnreadCountValue(userId.value, unreadCount);
  }

  private async broadcastUnreadCountValue(userId: string, count: number): Promise<void> {
    const pubsub = getRedisPubSub();
    await pubsub.publishCounterUpdate(userId, count);
  }

  private generateMessage(type: string, actorName: string): string {
    switch (type) {
      case "like":
        return `${actorName} понравился ваш пост`;
      case "comment":
        return `${actorName} прокомментировал ваш пост`;
      case "repost":
        return `${actorName} сделал репост вашего поста`;
      case "follow":
        return `${actorName} подписался на вас`;
      case "mention":
        return `${actorName} написал на вашей стене`;
      case "reply":
        return `${actorName} ответил на ваш комментарий`;
      default:
        return `${actorName} взаимодействовал с вами`;
    }
  }
}
