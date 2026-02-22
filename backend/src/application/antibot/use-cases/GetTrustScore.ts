import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { IFollowRepository } from "../../../domain/social";
import type { ITrustScoreRepository } from "../../../domain/antibot/repositories/ITrustScoreRepository";
import { TrustScore, RestrictionLevel } from "../../../domain/antibot";

export interface GetTrustScoreInput {
  userId: string;
}

export interface GetTrustScoreOutput {
  userId: string;
  score: number;
  restrictionLevel: RestrictionLevel;
  factors: {
    accountAgeDays: number;
    emailVerified: boolean;
    profileCompleteness: number;
    behaviorScore: number;
    contentQualityScore: number;
    followersCount: number;
    followingCount: number;
    reportCount: number;
    captchaSuccessRate: number;
  };
}

export class GetTrustScore {
  constructor(
    private readonly trustScoreRepository: ITrustScoreRepository,
    private readonly userRepository: IUserRepository,
    private readonly followRepository: IFollowRepository
  ) {}

  async execute(input: GetTrustScoreInput): Promise<Result<GetTrustScoreOutput>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(
        new DomainError(userIdResult.getError().message, "INVALID_USER_ID")
      );
    }

    const userId = userIdResult.getValue();

    let trustScore = await this.trustScoreRepository.findByUserId(userId);

    if (!trustScore) {

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.fail(
          new DomainError("User not found", "USER_NOT_FOUND")
        );
      }

      const followersCount = await this.followRepository.countFollowers(userId);
      const followingCount = await this.followRepository.countFollowing(userId);

      const accountAgeDays = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const profileCompleteness = this.calculateProfileCompleteness(user);

      const trustScoreResult = TrustScore.create({
        userId,
        factors: {
          accountAgeDays,
          emailVerified: user.verified,
          profileCompleteness,
          followersCount,
          followingCount,
        },
      });

      if (trustScoreResult.isFailure()) {
        return Result.fail(trustScoreResult.getError());
      }

      trustScore = trustScoreResult.getValue();
      await this.trustScoreRepository.save(trustScore);
    }

    return Result.ok({
      userId: trustScore.userId.value,
      score: trustScore.score,
      restrictionLevel: trustScore.restrictionLevel,
      factors: trustScore.factors,
    });
  }

  private calculateProfileCompleteness(user: {
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
  }): number {
    let score = 0;
    let total = 4;

    if (user.displayName && user.displayName.length > 0) score++;
    if (user.bio && user.bio.length > 0) score++;
    if (user.avatarUrl) score++;
    if (user.coverUrl) score++;

    return score / total;
  }
}
