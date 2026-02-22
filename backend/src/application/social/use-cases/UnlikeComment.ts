import { Result, DomainError } from "../../../domain/shared/Result";
import type { ICommentLikeRepository } from "../../../domain/social/repositories/ICommentLikeRepository";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import { CommentId } from "../../../domain/content/value-objects/CommentId";

interface UnlikeCommentInput {
  userId: string;
  commentId: string;
}

export class UnlikeComment {
  constructor(private readonly commentLikeRepository: ICommentLikeRepository) {}

  async execute(input: UnlikeCommentInput): Promise<Result<void>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError(userIdResult.getError().message, "INVALID_USER_ID"));
    }

    const commentIdResult = CommentId.create(input.commentId);
    if (commentIdResult.isFailure()) {
      return Result.fail(new DomainError(commentIdResult.getError().message, "INVALID_COMMENT_ID"));
    }

    const userId = userIdResult.getValue();
    const commentId = commentIdResult.getValue();

    const existingLike = await this.commentLikeRepository.findByUserAndComment(userId, commentId);
    if (!existingLike) {
      return Result.fail(new DomainError("Like not found", "LIKE_NOT_FOUND"));
    }

    await this.commentLikeRepository.delete(existingLike.id);

    return Result.ok(undefined);
  }
}
