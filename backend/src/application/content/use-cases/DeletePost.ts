import { Result, DomainError } from "../../../domain/shared";
import { PostId } from "../../../domain/content";
import type { IPostRepository } from "../../../domain/content";
import { UserId } from "../../../domain/identity";
import type { DeletePostInput } from "../dto";

export class DeletePost {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: DeletePostInput): Promise<Result<void>> {
    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const postId = postIdResult.getValue();
    const userId = userIdResult.getValue();

    const post = await this.postRepository.findById(postId);

    if (!post) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    const isAuthor = post.authorId.equals(userId);
    const isWallOwner = post.wallOwnerId && post.wallOwnerId.equals(userId);

    if (!isAuthor && !isWallOwner) {
      return Result.fail(new DomainError("Not authorized to delete this post", "NOT_AUTHORIZED"));
    }

    const deleteResult = post.delete();
    if (deleteResult.isFailure()) {
      return Result.fail(deleteResult.getError());
    }

    await this.postRepository.save(post);

    return Result.ok(undefined);
  }
}
