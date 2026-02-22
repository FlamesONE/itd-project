import { Result, DomainError } from "../../../domain/shared";
import { Post, PostContent } from "../../../domain/content";
import type { IPostRepository } from "../../../domain/content";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { RecommendationCacheService } from "../../../infrastructure/services/recommendation/RecommendationCacheService";
import type { CreatePostInput, CreatePostOutput } from "../dto";

import { Notification, NotificationType } from "../../../domain/notification";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";

export class CreatePost {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly recommendationCacheService?: RecommendationCacheService
  ) { }

  async execute(input: CreatePostInput): Promise<Result<CreatePostOutput>> {

    const authorIdResult = UserId.create(input.authorId);
    if (authorIdResult.isFailure()) {
      return Result.fail(authorIdResult.getError());
    }

    const authorId = authorIdResult.getValue();

    const author = await this.userRepository.findById(authorId);
    if (!author) {
      return Result.fail(new DomainError("Author not found", "AUTHOR_NOT_FOUND"));
    }

    let wallOwnerId: UserId | undefined;
    if (input.targetUserId) {
      const wallOwnerIdResult = UserId.create(input.targetUserId);
      if (wallOwnerIdResult.isFailure()) {
        return Result.fail(wallOwnerIdResult.getError());
      }
      wallOwnerId = wallOwnerIdResult.getValue();

      const wallOwner = await this.userRepository.findById(wallOwnerId);
      if (!wallOwner) {
        return Result.fail(new DomainError("Wall owner not found", "WALL_OWNER_NOT_FOUND"));
      }
    }

    const contentResult = PostContent.create(input.content);
    if (contentResult.isFailure()) {
      return Result.fail(contentResult.getError());
    }

    const postResult = Post.create({
      authorId,
      wallOwnerId,
      content: contentResult.getValue(),
    });

    if (postResult.isFailure()) {
      return Result.fail(postResult.getError());
    }

    const post = postResult.getValue();

    await this.postRepository.save(post);

    if (wallOwnerId && !wallOwnerId.equals(authorId)) {
      const notificationResult = Notification.create({
        userId: wallOwnerId,
        actorId: authorId,
        type: NotificationType.mention(),
        postId: post.id,
      });

      if (notificationResult.isSuccess()) {
        await this.notificationRepository.save(notificationResult.getValue());
      }
    }

    if (this.recommendationCacheService) {
      await this.recommendationCacheService.invalidateUserInterests(authorId.value);

      await this.recommendationCacheService.invalidateTrendingPosts();
    }

    return Result.ok({
      id: post.id.value,
      authorId: post.authorId.value,
      wallOwnerId: post.wallOwnerId?.value,
      content: post.content.value,
      isPinned: post.isPinned,
      pinnedAt: post.pinnedAt,
      createdAt: post.createdAt,
    });
  }
}
