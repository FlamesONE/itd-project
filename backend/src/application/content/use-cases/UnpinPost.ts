import type { IPostRepository } from "../../../domain/content";
import { PostId } from "../../../domain/content";
import { UserId } from "../../../domain/identity";
import { Result, DomainError } from "../../../domain/shared";

export class UnpinPost {
  constructor(private postRepository: IPostRepository) {}

  async execute(params: {
    postId: string;
    userId: string;
  }): Promise<Result<void>> {
    const postIdResult = PostId.create(params.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const userIdResult = UserId.create(params.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const postId = postIdResult.getValue();
    const userId = userIdResult.getValue();

    const post = await this.postRepository.findById(postId);
    if (!post) {
      return Result.fail(
        new DomainError("Post not found", "POST_NOT_FOUND")
      );
    }

    const wallOwnerId = post.wallOwnerId?.value || post.authorId.value;
    if (wallOwnerId !== userId.value) {
      return Result.fail(
        new DomainError(
          "You can only unpin posts on your own wall",
          "UNAUTHORIZED"
        )
      );
    }

    const unpinResult = post.unpin();
    if (unpinResult.isFailure()) {
      return Result.fail(unpinResult.getError());
    }

    await this.postRepository.unpinPost(postId, userId);

    return Result.ok(undefined);
  }
}
