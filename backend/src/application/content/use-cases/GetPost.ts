import { Result, DomainError } from "../../../domain/shared";
import { PostId } from "../../../domain/content";
import type { IPostRepository, ICommentRepository } from "../../../domain/content";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { ILikeRepository, IRepostRepository } from "../../../domain/social";
import type { GetPostInput, PostOutput } from "../dto";

export class GetPost {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
    private readonly likeRepository: ILikeRepository,
    private readonly commentRepository: ICommentRepository,
    private readonly repostRepository?: IRepostRepository
  ) {}

  async execute(input: GetPostInput): Promise<Result<PostOutput>> {
    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const postId = postIdResult.getValue();
    const post = await this.postRepository.findById(postId);

    if (!post || post.isDeleted) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    const author = await this.userRepository.findById(post.authorId);
    if (!author) {
      return Result.fail(new DomainError("Author not found", "AUTHOR_NOT_FOUND"));
    }

    const [likesCount, commentsCount, repostsCount] = await Promise.all([
      this.likeRepository.countByPost(postId),
      this.commentRepository.countByPostId(postId),
      this.repostRepository?.countByPost(postId) ?? Promise.resolve(0),
    ]);

    let isLiked = false;
    let isReposted = false;
    if (input.currentUserId) {
      const currentUserIdResult = UserId.create(input.currentUserId);
      if (currentUserIdResult.isSuccess()) {
        const currentUserId = currentUserIdResult.getValue();
        [isLiked, isReposted] = await Promise.all([
          this.likeRepository.isLikedBy(currentUserId, postId),
          this.repostRepository?.isRepostedBy(currentUserId, postId) ?? Promise.resolve(false),
        ]);
      }
    }

    return Result.ok({
      id: post.id.value,
      authorId: post.authorId.value,
      authorUsername: author.username.value,
      authorDisplayName: author.displayName,
      authorEmoji: author.emoji,
      authorAvatarUrl: author.avatarUrl,
      authorVerified: author.verified,
      wallOwnerId: post.wallOwnerId?.value,
      content: post.content.value,
      likesCount,
      commentsCount,
      repostsCount,
      viewsCount: post.viewsCount,
      isPinned: post.isPinned,
      pinnedAt: post.pinnedAt,
      isLiked,
      isReposted,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }
}
