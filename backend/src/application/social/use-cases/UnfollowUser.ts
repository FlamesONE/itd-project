import { Result, DomainError } from "../../../domain/shared";
import type { IFollowRepository } from "../../../domain/social";
import { UserId } from "../../../domain/identity";
import type { RecommendationCacheService } from "../../../infrastructure/services/recommendation/RecommendationCacheService";
import type { UnfollowUserInput } from "../dto";

export class UnfollowUser {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly recommendationCacheService?: RecommendationCacheService
  ) {}

  async execute(input: UnfollowUserInput): Promise<Result<void>> {

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

    const existingFollow = await this.followRepository.findByFollowerAndFollowing(
      followerId,
      followingId
    );

    if (!existingFollow) {
      return Result.fail(new DomainError("Not following this user", "NOT_FOLLOWING"));
    }

    await this.followRepository.delete(followerId, followingId);

    if (this.recommendationCacheService) {
      await this.recommendationCacheService.invalidateUserRecommendations(followerId.value);
      await this.recommendationCacheService.invalidateSimilarUsers(followerId.value);
    }

    return Result.ok(undefined);
  }
}
