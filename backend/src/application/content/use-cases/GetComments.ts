import { Result, DomainError } from "../../../domain/shared";
import { PostId } from "../../../domain/content";
import type { ICommentRepository, IPostRepository } from "../../../domain/content";
import type { IUserRepository } from "../../../domain/identity";

export type CommentSortBy = 'NEWEST' | 'POPULAR';

export interface GetCommentsInput {
  postId: string;
  limit?: number;
  offset?: number;
  sortBy?: CommentSortBy;
}

export interface CommentOutput {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  authorUsername: string;
  authorDisplayName: string;
  content: string;
  audioUrl: string | null;
  audioDuration: number | null;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GetComments {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: GetCommentsInput): Promise<Result<CommentOutput[]>> {
    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const postId = postIdResult.getValue();

    const post = await this.postRepository.findById(postId);
    if (!post || post.isDeleted) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    const comments = await this.commentRepository.findByPostId(
      postId,
      input.limit ?? 20,
      input.offset ?? 0,
      input.sortBy ?? 'NEWEST'
    );

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await this.userRepository.findById(comment.authorId);
        return {
          id: comment.id.value,
          postId: comment.postId.value,
          authorId: comment.authorId.value,
          parentCommentId: comment.parentCommentId?.value ?? null,
          authorUsername: author?.username.value ?? "unknown",
          authorDisplayName: author?.displayName ?? "Unknown",
          content: comment.content,
          audioUrl: comment.audioUrl,
          audioDuration: comment.audioDuration,
          likesCount: comment.likesCount,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        };
      })
    );

    return Result.ok(commentsWithAuthors);
  }
}
