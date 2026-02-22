import { Result, DomainError } from "../../../domain/shared";
import { PostId, PostContent } from "../../../domain/content";
import type { IPostRepository } from "../../../domain/content";
import { UserId } from "../../../domain/identity";

export interface UpdatePostInput {
  postId: string;
  userId: string;
  content: string;
}

export interface UpdatePostOutput {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdatePost {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: UpdatePostInput): Promise<Result<UpdatePostOutput>> {
    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const contentResult = PostContent.create(input.content);
    if (contentResult.isFailure()) {
      return Result.fail(contentResult.getError());
    }

    const post = await this.postRepository.findById(postIdResult.getValue());
    if (!post) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    if (!post.authorId.equals(userIdResult.getValue())) {
      return Result.fail(new DomainError("Not authorized to update this post", "NOT_AUTHORIZED"));
    }

    const updateResult = post.updateContent(contentResult.getValue());
    if (updateResult.isFailure()) {
      return Result.fail(updateResult.getError());
    }

    await this.postRepository.save(post);

    return Result.ok({
      id: post.id.value,
      authorId: post.authorId.value,
      content: post.content.value,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }
}
