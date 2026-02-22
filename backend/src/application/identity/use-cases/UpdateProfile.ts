import { Result, DomainError } from "../../../domain/shared";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";

export interface UpdateProfileInput {
  userId: string;
  displayName?: string;
  bio?: string;
  emoji?: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export interface UpdateProfileOutput {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  emoji: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<Result<UpdateProfileOutput>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const user = await this.userRepository.findById(userIdResult.getValue());
    if (!user) {
      return Result.fail(new DomainError("User not found", "USER_NOT_FOUND"));
    }

    user.updateProfile({
      displayName: input.displayName,
      bio: input.bio,
      emoji: input.emoji,
      avatarUrl: input.avatarUrl,
      coverUrl: input.coverUrl,
    });

    await this.userRepository.save(user);

    return Result.ok({
      id: user.id.value,
      email: user.email.value,
      username: user.username.value,
      displayName: user.displayName,
      bio: user.bio,
      emoji: user.emoji,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
