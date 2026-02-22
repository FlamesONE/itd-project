import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import { PostId } from "../../../domain/content/value-objects/PostId";
import { CommentId } from "../../../domain/content/value-objects/CommentId";
import { Notification } from "../../../domain/notification/entities/Notification";
import { NotificationType } from "../../../domain/notification/value-objects/NotificationType";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import type { CreateNotificationInput, NotificationOutput } from "../dto";

export class CreateNotification {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(input: CreateNotificationInput): Promise<Result<NotificationOutput>> {

    if (input.userId === input.actorId) {
      return Result.fail(
        new DomainError("Cannot create notification for yourself", "SELF_NOTIFICATION")
      );
    }

    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError(userIdResult.getError().message, "INVALID_USER_ID"));
    }

    const actorIdResult = UserId.create(input.actorId);
    if (actorIdResult.isFailure()) {
      return Result.fail(new DomainError(actorIdResult.getError().message, "INVALID_ACTOR_ID"));
    }

    const typeResult = NotificationType.create(input.type);
    if (typeResult.isFailure()) {
      return Result.fail(new DomainError(typeResult.getError().message, "INVALID_TYPE"));
    }

    let postId: PostId | undefined;
    if (input.postId) {
      const postIdResult = PostId.create(input.postId);
      if (postIdResult.isFailure()) {
        return Result.fail(new DomainError(postIdResult.getError().message, "INVALID_POST_ID"));
      }
      postId = postIdResult.getValue();
    }

    let commentId: CommentId | undefined;
    if (input.commentId) {
      const commentIdResult = CommentId.create(input.commentId);
      if (commentIdResult.isFailure()) {
        return Result.fail(
          new DomainError(commentIdResult.getError().message, "INVALID_COMMENT_ID")
        );
      }
      commentId = commentIdResult.getValue();
    }

    const notificationResult = Notification.create({
      userId: userIdResult.getValue(),
      actorId: actorIdResult.getValue(),
      type: typeResult.getValue(),
      postId,
      commentId,
    });

    if (notificationResult.isFailure()) {
      return Result.fail(
        new DomainError(notificationResult.getError().message, "NOTIFICATION_CREATION_FAILED")
      );
    }

    const notification = notificationResult.getValue();
    await this.notificationRepository.save(notification);

    return Result.ok({
      id: notification.id.value,
      userId: notification.userId.value,
      actorId: notification.actorId.value,
      type: notification.type.value,
      postId: notification.postId?.value ?? null,
      commentId: notification.commentId?.value ?? null,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
  }
}
