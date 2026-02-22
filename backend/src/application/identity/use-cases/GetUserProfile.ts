import { Result, DomainError } from "../../../domain/shared";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { IFollowRepository } from "../../../domain/social";

export interface GetUserProfileInput {
  userId: string;
  currentUserId?: string;
}

export interface GetUserProfileOutput {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  emoji: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  lastSeenAt: Date;
  createdAt: Date;
}

export class GetUserProfile {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly followRepository: IFollowRepository
  ) {}

  async execute(input: GetUserProfileInput): Promise<Result<GetUserProfileOutput>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const userId = userIdResult.getValue();
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail(new DomainError("User not found", "USER_NOT_FOUND"));
    }

    const [followersCount, followingCount] = await Promise.all([
      this.followRepository.countFollowers(userId),
      this.followRepository.countFollowing(userId),
    ]);

    let isFollowing = false;
    if (input.currentUserId) {
      const currentUserIdResult = UserId.create(input.currentUserId);
      if (currentUserIdResult.isSuccess()) {
        isFollowing = await this.followRepository.isFollowing(
          currentUserIdResult.getValue(),
          userId
        );
      }
    }

    return Result.ok({
      id: user.id.value,
      email: user.email.value,
      username: user.username.value,
      displayName: user.displayName,
      bio: user.bio,
      emoji: user.emoji,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      verified: user.verified,
      followersCount,
      followingCount,
      postsCount: user.postsCount,
      isFollowing,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
    });
  }
}
