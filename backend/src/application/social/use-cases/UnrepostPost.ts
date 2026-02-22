import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import { PostId } from "../../../domain/content/value-objects/PostId";
import type { IRepostRepository } from "../../../domain/social/repositories/IRepostRepository";

interface UnrepostPostDTO {
  userId: string;
  postId: string;
}

export class UnrepostPost {
  constructor(private repostRepository: IRepostRepository) {}

  async execute(dto: UnrepostPostDTO): Promise<Result<void>> {

    const userIdResult = UserId.create(dto.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError(userIdResult.getError().message, "INVALID_USER_ID"));
    }
    const userId = userIdResult.getValue();

    const postIdResult = PostId.create(dto.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(new DomainError(postIdResult.getError().message, "INVALID_POST_ID"));
    }
    const postId = postIdResult.getValue();

    const existingRepost = await this.repostRepository.findByUserAndPost(userId, postId);
    if (!existingRepost) {
      return Result.fail(new DomainError("Repost not found", "REPOST_NOT_FOUND"));
    }

    await this.repostRepository.delete(userId, postId);

    return Result.ok(undefined);
  }
}
