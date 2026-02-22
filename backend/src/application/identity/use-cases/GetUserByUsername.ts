import { Result, DomainError } from "../../../domain/shared";
import { Username } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { IFollowRepository } from "../../../domain/social";

export interface GetUserByUsernameInput {
  username: string;
  currentUserId?: string;
}

export interface GetUserByUsernameOutput {
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

export class GetUserByUsername {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly followRepository: IFollowRepository
  ) {}

  async execute(input: GetUserByUsernameInput): Promise<Result<GetUserByUsernameOutput>> {
    const usernameResult = Username.create(input.username);
    if (usernameResult.isFailure()) {
      return Result.fail(usernameResult.getError());
    }

    const username = usernameResult.getValue();
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return Result.fail(new DomainError("User not found", "USER_NOT_FOUND"));
    }

    const [followersCount, followingCount] = await Promise.all([
      this.followRepository.countFollowers(user.id),
      this.followRepository.countFollowing(user.id),
    ]);

    let isFollowing = false;
    if (input.currentUserId) {
      const { UserId } = await import("../../../domain/identity");
      const currentUserIdResult = UserId.create(input.currentUserId);
      if (currentUserIdResult.isSuccess()) {
        isFollowing = await this.followRepository.isFollowing(
          currentUserIdResult.getValue(),
          user.id
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
