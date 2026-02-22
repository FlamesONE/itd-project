import { Result, DomainError } from "../../../domain/shared";
import type { ILikeRepository } from "../../../domain/social";
import { UserId } from "../../../domain/identity";
import { PostId } from "../../../domain/content";
import type { UnlikePostInput } from "../dto";

export class UnlikePost {
  constructor(private readonly likeRepository: ILikeRepository) {}

  async execute(input: UnlikePostInput): Promise<Result<void>> {

    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const userId = userIdResult.getValue();
    const postId = postIdResult.getValue();

    const existingLike = await this.likeRepository.findByUserAndPost(userId, postId);
    if (!existingLike) {
      return Result.fail(new DomainError("Not liked this post", "NOT_LIKED"));
    }

    await this.likeRepository.delete(userId, postId);

    return Result.ok(undefined);
  }
}
