import { Result, DomainError } from "../../../domain/shared";
import { Follow } from "../../../domain/social";
import type { IFollowRepository } from "../../../domain/social";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import { Notification } from "../../../domain/notification/entities/Notification";
import { NotificationType } from "../../../domain/notification/value-objects/NotificationType";
import type { RecommendationCacheService } from "../../../infrastructure/services/recommendation/RecommendationCacheService";
import type { FollowUserInput } from "../dto";

export class FollowUser {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository?: INotificationRepository,
    private readonly recommendationCacheService?: RecommendationCacheService
  ) {}

  async execute(input: FollowUserInput): Promise<Result<void>> {

    const followerIdResult = UserId.create(input.followerId);
    if (followerIdResult.isFailure()) {
      return Result.fail(followerIdResult.getError());
    }

    const followingIdResult = UserId.create(input.followingId);
    if (followingIdResult.isFailure()) {
      return Result.fail(followingIdResult.getError());
    }

    const followerId = followerIdResult.getValue();
    const followingId = followingIdResult.getValue();

    if (followerId.equals(followingId)) {
      return Result.fail(new DomainError("Cannot follow yourself", "CANNOT_FOLLOW_SELF"));
    }

    const followingUser = await this.userRepository.findById(followingId);
    if (!followingUser) {
      return Result.fail(new DomainError("User to follow not found", "USER_NOT_FOUND"));
    }

    const existingFollow = await this.followRepository.findByFollowerAndFollowing(
      followerId,
      followingId
    );
    if (existingFollow) {
      return Result.fail(new DomainError("Already following this user", "ALREADY_FOLLOWING"));
    }

    const followResult = Follow.create({
      followerId,
      followingId,
    });

    if (followResult.isFailure()) {
      return Result.fail(followResult.getError());
    }

    await this.followRepository.save(followResult.getValue());

    if (this.recommendationCacheService) {
      await this.recommendationCacheService.invalidateUserRecommendations(followerId.value);
      await this.recommendationCacheService.invalidateSimilarUsers(followerId.value);
    }

    if (this.notificationRepository) {
      const typeResult = NotificationType.create("follow");
      if (typeResult.isSuccess()) {
        const notificationResult = Notification.create({
          userId: followingId,
          actorId: followerId,
          type: typeResult.getValue(),
        });
        if (notificationResult.isSuccess()) {
          await this.notificationRepository.save(notificationResult.getValue());
        }
      }
    }

    return Result.ok(undefined);
  }
}
