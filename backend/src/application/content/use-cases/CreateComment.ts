import { Result, DomainError } from "../../../domain/shared";
import { Comment, PostId } from "../../../domain/content";
import type { ICommentRepository, IPostRepository } from "../../../domain/content";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import { Notification } from "../../../domain/notification/entities/Notification";
import { NotificationType } from "../../../domain/notification/value-objects/NotificationType";

export interface CreateCommentInput {
  postId: string;
  authorId: string;
  content: string;
  audioUrl?: string;
  audioDuration?: number;
}

export interface CreateCommentOutput {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  audioUrl: string | null;
  audioDuration: number | null;
  createdAt: Date;
}

export class CreateComment {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository?: INotificationRepository
  ) {}

  async execute(input: CreateCommentInput): Promise<Result<CreateCommentOutput>> {
    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const authorIdResult = UserId.create(input.authorId);
    if (authorIdResult.isFailure()) {
      return Result.fail(authorIdResult.getError());
    }

    const postId = postIdResult.getValue();
    const authorId = authorIdResult.getValue();

    const post = await this.postRepository.findById(postId);
    if (!post || post.isDeleted) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    const author = await this.userRepository.findById(authorId);
    if (!author) {
      return Result.fail(new DomainError("Author not found", "AUTHOR_NOT_FOUND"));
    }

    const commentResult = Comment.create({
      postId,
      authorId,
      content: input.content,
      audioUrl: input.audioUrl,
      audioDuration: input.audioDuration,
    });

    if (commentResult.isFailure()) {
      return Result.fail(commentResult.getError());
    }

    const comment = commentResult.getValue();
    await this.commentRepository.save(comment);

    if (this.notificationRepository && post.authorId.value !== authorId.value) {
      const typeResult = NotificationType.create("comment");
      if (typeResult.isSuccess()) {
        const notificationResult = Notification.create({
          userId: post.authorId,
          actorId: authorId,
          type: typeResult.getValue(),
          postId,
          commentId: comment.id,
        });
        if (notificationResult.isSuccess()) {
          await this.notificationRepository.save(notificationResult.getValue());
        }
      }
    }

    return Result.ok({
      id: comment.id.value,
      postId: comment.postId.value,
      authorId: comment.authorId.value,
      content: comment.content,
      audioUrl: comment.audioUrl,
      audioDuration: comment.audioDuration,
      createdAt: comment.createdAt,
    });
  }
}
