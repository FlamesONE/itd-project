import { getRedisPubSub, type NotificationEvent } from "./RedisPubSub";
import type { IUserRepository } from "../../../domain/identity/repositories/IUserRepository";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import { UserId } from "../../../domain/identity/value-objects/UserId";

export class NotificationBroadcaster {
  constructor(
    private userRepository: IUserRepository,
    private notificationRepository: INotificationRepository
  ) {}

  async broadcast(notification: {
    id: string;
    userId: string;
    actorId: string;
    type: string;
    postId: string | null;
    commentId: string | null;
    createdAt: Date;
  }): Promise<void> {
    try {

      const actorIdResult = UserId.create(notification.actorId);
      if (actorIdResult.isFailure()) return;

      const actor = await this.userRepository.findById(actorIdResult.getValue());
      if (!actor) return;

      const message = this.generateMessage(notification.type, actor.displayName);

      const payload: NotificationEvent["payload"] = {
        id: notification.id,
        actorId: notification.actorId,
        actorUsername: actor.username.value,
        actorDisplayName: actor.displayName,
        actorAvatarUrl: actor.avatarUrl,
        actorEmoji: actor.emoji ?? null,
        type: notification.type,
        postId: notification.postId,
        commentId: notification.commentId,
        message,
        createdAt: notification.createdAt.toISOString(),
      };

      const pubsub = getRedisPubSub();
      await pubsub.publishNotification(notification.userId, payload);

      await this.broadcastUnreadCount(notification.userId);
    } catch (error) {
      console.error("[NotificationBroadcaster] Failed to broadcast:", error);
    }
  }

  async broadcastUnreadCount(userId: string): Promise<void> {
    try {
      const userIdResult = UserId.create(userId);
      if (userIdResult.isFailure()) return;

      const unreadCount = await this.notificationRepository.countUnreadByUserId(userIdResult.getValue());

      const pubsub = getRedisPubSub();
      await pubsub.publishCounterUpdate(userId, unreadCount);
    } catch (error) {
      console.error("[NotificationBroadcaster] Failed to broadcast unread count:", error);
    }
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
        return `${actorName} упомянул вас`;
      case "reply":
        return `${actorName} ответил на ваш комментарий`;
      default:
        return `${actorName} взаимодействовал с вами`;
    }
  }
}
