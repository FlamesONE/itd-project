import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import type { IUserRepository } from "../../../domain/identity/repositories/IUserRepository";
import type { GetNotificationsInput, NotificationOutput } from "../dto";

export class GetNotifications {
  constructor(
    private notificationRepository: INotificationRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: GetNotificationsInput): Promise<Result<NotificationOutput[]>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError(userIdResult.getError().message, "INVALID_USER_ID"));
    }
    const userId = userIdResult.getValue();

    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const notifications = input.unreadOnly
      ? await this.notificationRepository.findUnreadByUserId(userId, limit, offset)
      : await this.notificationRepository.findByUserId(userId, limit, offset);

    const actorIds = [...new Set(notifications.map((n) => n.actorId.value))];
    const actorPromises = actorIds.map((id) =>
      this.userRepository.findById(UserId.create(id).getValue())
    );
    const actors = await Promise.all(actorPromises);
    const actorMap = new Map(
      actors.filter(Boolean).map((actor) => [actor!.id.value, actor!])
    );

    const output: NotificationOutput[] = notifications.map((notification) => {
      const actor = actorMap.get(notification.actorId.value);
      return {
        id: notification.id.value,
        userId: notification.userId.value,
        actorId: notification.actorId.value,
        actorUsername: actor?.username.value,
        actorDisplayName: actor?.displayName,
        type: notification.type.value,
        postId: notification.postId?.value ?? null,
        commentId: notification.commentId?.value ?? null,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      };
    });

    return Result.ok(output);
  }
}
