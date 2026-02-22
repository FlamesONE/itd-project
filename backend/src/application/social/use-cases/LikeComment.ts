import { Result, DomainError } from "../../../domain/shared/Result";
import { CommentLike } from "../../../domain/social/entities/CommentLike";
import type { ICommentLikeRepository } from "../../../domain/social/repositories/ICommentLikeRepository";
import type { ICommentRepository } from "../../../domain/content/repositories/ICommentRepository";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import { Notification } from "../../../domain/notification/entities/Notification";
import { NotificationType } from "../../../domain/notification/value-objects/NotificationType";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import { CommentId } from "../../../domain/content/value-objects/CommentId";

interface LikeCommentInput {
  userId: string;
  commentId: string;
}

export class LikeComment {
  constructor(
    private readonly commentLikeRepository: ICommentLikeRepository,
    private readonly commentRepository: ICommentRepository,
    private readonly notificationRepository?: INotificationRepository
  ) {}

  async execute(input: LikeCommentInput): Promise<Result<void>> {
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

    const comment = await this.commentRepository.findById(commentId);
    if (!comment || comment.isDeleted) {
      return Result.fail(new DomainError("Comment not found", "COMMENT_NOT_FOUND"));
    }

    const existingLike = await this.commentLikeRepository.findByUserAndComment(userId, commentId);
    if (existingLike) {
      return Result.fail(new DomainError("Already liked this comment", "ALREADY_LIKED"));
    }

    const likeResult = CommentLike.create({ userId, commentId });
    if (likeResult.isFailure()) {
      return Result.fail(likeResult.getError());
    }

    await this.commentLikeRepository.save(likeResult.getValue());

    if (this.notificationRepository && comment.authorId.value !== userId.value) {
      const typeResult = NotificationType.create("like");
      if (typeResult.isSuccess()) {
        const notificationResult = Notification.create({
          userId: comment.authorId,
          actorId: userId,
          type: typeResult.getValue(),
          postId: comment.postId,
          commentId,
        });
        if (notificationResult.isSuccess()) {
          await this.notificationRepository.save(notificationResult.getValue());
        }
      }
    }

    return Result.ok(undefined);
  }
}
