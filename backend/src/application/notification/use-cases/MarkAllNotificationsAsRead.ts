import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import type { MarkAllAsReadInput } from "../dto";

export class MarkAllNotificationsAsRead {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(input: MarkAllAsReadInput): Promise<Result<void>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError(userIdResult.getError().message, "INVALID_USER_ID"));
    }

    await this.notificationRepository.markAllAsRead(userIdResult.getValue());

    return Result.ok(undefined);
  }
}
