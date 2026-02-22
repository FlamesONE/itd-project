import { Result, DomainError } from "../../../domain/shared/Result";
import type { IUserRepository } from "../../../domain/identity/repositories/IUserRepository";
import type { IFollowRepository } from "../../../domain/social/repositories/IFollowRepository";
import { UserId } from "../../../domain/identity";

interface SearchUsersInput {
  query: string;
  limit?: number;
  offset?: number;
  currentUserId?: string;
}

export interface UserDTO {
  id: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  isFollowing: boolean;
}

export class SearchUsers {
  constructor(
    private userRepository: IUserRepository,
    private followRepository: IFollowRepository
  ) {}

  async execute(input: SearchUsersInput): Promise<Result<UserDTO[], DomainError>> {
    const { query, limit = 20, offset = 0, currentUserId } = input;

    if (!query || query.trim().length === 0) {
      return Result.ok([]);
    }

    const users = await this.userRepository.search(query.trim(), limit, offset);

    const userDTOs = await Promise.all(
      users.map(async (user) => {
        let isFollowing = false;

        if (currentUserId) {
          const currentUserIdResult = UserId.create(currentUserId);
          if (currentUserIdResult.isSuccess()) {
            isFollowing = await this.followRepository.isFollowing(
              currentUserIdResult.getValue(),
              user.id
            );
          }
        }

        return {
          id: user.id.value,
          username: user.username.value,
          displayName: user.displayName,
          emoji: user.emoji,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          followersCount: user.followersCount,
          isFollowing,
        };
      })
    );

    return Result.ok(userDTOs);
  }
}
