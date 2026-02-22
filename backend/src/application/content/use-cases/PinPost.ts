import type { IPostRepository } from "../../../domain/content";
import { PostId } from "../../../domain/content";
import type { IUserRepository } from "../../../domain/identity";
import { UserId } from "../../../domain/identity";
import type { IFollowRepository } from "../../../domain/social";
import { Result, DomainError } from "../../../domain/shared";

export class PinPost {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
    private followRepository: IFollowRepository
  ) {}

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
          "You can only pin posts on your own wall",
          "UNAUTHORIZED"
        )
      );
    }

    const pinResult = post.pin();
    if (pinResult.isFailure()) {
      return Result.fail(pinResult.getError());
    }

    await this.postRepository.pinPost(postId, userId);

    return Result.ok(undefined);
  }
}
