import { Result, DomainError } from "../../../domain/shared";
import { CommentId } from "../../../domain/content";
import type { ICommentRepository } from "../../../domain/content";
import { UserId } from "../../../domain/identity";

export interface DeleteCommentInput {
  commentId: string;
  userId: string;
}

export class DeleteComment {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(input: DeleteCommentInput): Promise<Result<void>> {
    const commentIdResult = CommentId.create(input.commentId);
    if (commentIdResult.isFailure()) {
      return Result.fail(commentIdResult.getError());
    }

    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const comment = await this.commentRepository.findById(commentIdResult.getValue());
    if (!comment) {
      return Result.fail(new DomainError("Comment not found", "COMMENT_NOT_FOUND"));
    }

    if (!comment.authorId.equals(userIdResult.getValue())) {
      return Result.fail(new DomainError("Not authorized to delete this comment", "NOT_AUTHORIZED"));
    }

    const deleteResult = comment.delete();
    if (deleteResult.isFailure()) {
      return Result.fail(deleteResult.getError());
    }

    await this.commentRepository.save(comment);

    return Result.ok(undefined);
  }
}
