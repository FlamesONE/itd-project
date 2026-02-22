import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import { PostId } from "../../../domain/content/value-objects/PostId";
import { Repost } from "../../../domain/social/entities/Repost";
import type { IRepostRepository } from "../../../domain/social/repositories/IRepostRepository";
import type { IPostRepository } from "../../../domain/content/repositories/IPostRepository";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import { Notification } from "../../../domain/notification/entities/Notification";
import { NotificationType } from "../../../domain/notification/value-objects/NotificationType";

interface RepostPostDTO {
  userId: string;
  postId: string;
  quoteContent?: string;
}

interface RepostPostResult {
  id: string;
  userId: string;
  postId: string;
  quoteContent: string | null;
  createdAt: Date;
}

export class RepostPost {
  constructor(
    private repostRepository: IRepostRepository,
    private postRepository: IPostRepository,
    private notificationRepository?: INotificationRepository
  ) {}

  async execute(dto: RepostPostDTO): Promise<Result<RepostPostResult>> {

    const userIdResult = UserId.create(dto.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError(userIdResult.getError().message, "INVALID_USER_ID"));
    }
    const userId = userIdResult.getValue();

    const postIdResult = PostId.create(dto.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(new DomainError(postIdResult.getError().message, "INVALID_POST_ID"));
    }
    const postId = postIdResult.getValue();

    const post = await this.postRepository.findById(postId);
    if (!post) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    const existingRepost = await this.repostRepository.findByUserAndPost(userId, postId);
    if (existingRepost) {
      return Result.fail(new DomainError("Already reposted", "ALREADY_REPOSTED"));
    }

    if (post.authorId.value === userId.value) {
      return Result.fail(new DomainError("Cannot repost own post", "CANNOT_REPOST_OWN"));
    }

    const repostResult = Repost.create({
      userId,
      postId,
      quoteContent: dto.quoteContent,
    });

    if (repostResult.isFailure()) {
      return Result.fail(new DomainError(repostResult.getError().message, "REPOST_CREATION_FAILED"));
    }

    const repost = repostResult.getValue();

    await this.repostRepository.save(repost);

    if (this.notificationRepository) {
      const typeResult = NotificationType.create("repost");
      if (typeResult.isSuccess()) {
        const notificationResult = Notification.create({
          userId: post.authorId,
          actorId: userId,
          type: typeResult.getValue(),
          postId,
        });
        if (notificationResult.isSuccess()) {
          await this.notificationRepository.save(notificationResult.getValue());
        }
      }
    }

    return Result.ok({
      id: repost.id.value,
      userId: repost.userId.value,
      postId: repost.postId.value,
      quoteContent: repost.quoteContent,
      createdAt: repost.createdAt,
    });
  }
}
