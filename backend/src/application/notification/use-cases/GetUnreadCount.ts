import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";

interface GetUnreadCountInput {
  userId: string;
}

export class GetUnreadCount {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(input: GetUnreadCountInput): Promise<Result<number>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError(userIdResult.getError().message, "INVALID_USER_ID"));
    }

    const count = await this.notificationRepository.countUnreadByUserId(
      userIdResult.getValue()
    );

    return Result.ok(count);
  }
}
