import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import { NotificationId } from "../../../domain/notification/value-objects/NotificationId";
import { PostId } from "../../../domain/content/value-objects/PostId";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import type { MarkAsReadInput } from "../dto";

export class MarkNotificationAsRead {
  constructor(private notificationRepository: INotificationRepository) { }

  async execute(input: MarkAsReadInput): Promise<Result<void>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError(userIdResult.getError().message, "INVALID_USER_ID"));
    }

    const userId = userIdResult.getValue();

    if (input.postId) {
      const postIdResult = PostId.create(input.postId);
      if (postIdResult.isFailure()) {
        return Result.fail(new DomainError(postIdResult.getError().message, "INVALID_POST_ID"));
      }

      await this.notificationRepository.markPostNotificationsAsRead(userId, postIdResult.getValue());
      return Result.ok(undefined);
    }

    if (input.notificationId) {
      const notificationIdResult = NotificationId.create(input.notificationId);
      if (notificationIdResult.isFailure()) {
        return Result.fail(
          new DomainError(notificationIdResult.getError().message, "INVALID_NOTIFICATION_ID")
        );
      }

      const notification = await this.notificationRepository.findById(
        notificationIdResult.getValue()
      );

      if (!notification) {
        return Result.fail(
          new DomainError("Notification not found", "NOTIFICATION_NOT_FOUND")
        );
      }

      if (notification.userId.value !== input.userId) {
        return Result.fail(
          new DomainError("Not authorized to mark this notification", "UNAUTHORIZED")
        );
      }

      await this.notificationRepository.markAsRead(notificationIdResult.getValue());
    }

    return Result.ok(undefined);
  }
}
