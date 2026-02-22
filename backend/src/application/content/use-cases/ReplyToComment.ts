import { Result, DomainError } from "../../../domain/shared/Result";
import { Comment, CommentId, PostId } from "../../../domain/content";
import type { ICommentRepository, IPostRepository } from "../../../domain/content";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import { Notification } from "../../../domain/notification/entities/Notification";
import { NotificationType } from "../../../domain/notification/value-objects/NotificationType";

export interface ReplyToCommentInput {
  postId: string;
  parentCommentId: string;
  authorId: string;
  content: string;
  audioUrl?: string;
  audioDuration?: number;
}

export interface ReplyToCommentOutput {
  id: string;
  postId: string;
  parentCommentId: string;
  authorId: string;
  content: string;
  audioUrl: string | null;
  audioDuration: number | null;
  createdAt: Date;
}

export class ReplyToComment {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository?: INotificationRepository
  ) {}

  async execute(input: ReplyToCommentInput): Promise<Result<ReplyToCommentOutput>> {
    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(new DomainError(postIdResult.getError().message, "INVALID_POST_ID"));
    }

    const parentCommentIdResult = CommentId.create(input.parentCommentId);
    if (parentCommentIdResult.isFailure()) {
      return Result.fail(new DomainError(parentCommentIdResult.getError().message, "INVALID_COMMENT_ID"));
    }

    const authorIdResult = UserId.create(input.authorId);
    if (authorIdResult.isFailure()) {
      return Result.fail(new DomainError(authorIdResult.getError().message, "INVALID_AUTHOR_ID"));
    }

    const postId = postIdResult.getValue();
    const parentCommentId = parentCommentIdResult.getValue();
    const authorId = authorIdResult.getValue();

    const post = await this.postRepository.findById(postId);
    if (!post || post.isDeleted) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    const parentComment = await this.commentRepository.findById(parentCommentId);
    if (!parentComment || parentComment.isDeleted) {
      return Result.fail(new DomainError("Parent comment not found", "PARENT_COMMENT_NOT_FOUND"));
    }

    const author = await this.userRepository.findById(authorId);
    if (!author) {
      return Result.fail(new DomainError("Author not found", "AUTHOR_NOT_FOUND"));
    }

    const replyResult = Comment.create({
      postId,
      authorId,
      parentCommentId,
      content: input.content,
      audioUrl: input.audioUrl,
      audioDuration: input.audioDuration,
    });

    if (replyResult.isFailure()) {
      return Result.fail(replyResult.getError());
    }

    const reply = replyResult.getValue();
    await this.commentRepository.save(reply);

    if (this.notificationRepository && parentComment.authorId.value !== authorId.value) {
      const typeResult = NotificationType.create("reply");
      if (typeResult.isSuccess()) {
        const notificationResult = Notification.create({
          userId: parentComment.authorId,
          actorId: authorId,
          type: typeResult.getValue(),
          postId,
          commentId: reply.id,
        });
        if (notificationResult.isSuccess()) {
          await this.notificationRepository.save(notificationResult.getValue());
        }
      }
    }

    return Result.ok({
      id: reply.id.value,
      postId: reply.postId.value,
      parentCommentId: parentCommentId.value,
      authorId: reply.authorId.value,
      content: reply.content,
      audioUrl: reply.audioUrl,
      audioDuration: reply.audioDuration,
      createdAt: reply.createdAt,
    });
  }
}
