import { Result, DomainError } from "../../../domain/shared";
import { Like } from "../../../domain/social";
import type { ILikeRepository } from "../../../domain/social";
import { UserId } from "../../../domain/identity";
import { PostId } from "../../../domain/content";
import type { IPostRepository } from "../../../domain/content";
import type { INotificationRepository } from "../../../domain/notification/repositories/INotificationRepository";
import { Notification } from "../../../domain/notification/entities/Notification";
import { NotificationType } from "../../../domain/notification/value-objects/NotificationType";
import type { RecommendationCacheService } from "../../../infrastructure/services/recommendation/RecommendationCacheService";
import type { LikePostInput } from "../dto";

export class LikePost {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly postRepository: IPostRepository,
    private readonly notificationRepository?: INotificationRepository,
    private readonly recommendationCacheService?: RecommendationCacheService
  ) {}

  async execute(input: LikePostInput): Promise<Result<void>> {

    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const userId = userIdResult.getValue();
    const postId = postIdResult.getValue();

    const post = await this.postRepository.findById(postId);
    if (!post || post.isDeleted) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    const existingLike = await this.likeRepository.findByUserAndPost(userId, postId);
    if (existingLike) {
      return Result.fail(new DomainError("Already liked this post", "ALREADY_LIKED"));
    }

    const likeResult = Like.create({
      userId,
      postId,
    });

    if (likeResult.isFailure()) {
      return Result.fail(likeResult.getError());
    }

    await this.likeRepository.save(likeResult.getValue());

    if (this.recommendationCacheService) {
      await this.recommendationCacheService.invalidatePostRecommendations(userId.value);
    }

    if (this.notificationRepository && post.authorId.value !== userId.value) {
      const typeResult = NotificationType.create("like");
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

    return Result.ok(undefined);
  }
}
