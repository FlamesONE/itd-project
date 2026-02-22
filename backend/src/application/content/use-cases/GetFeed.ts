import { Result, DomainError } from "../../../domain/shared";
import type { IPostRepository } from "../../../domain/content";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { ILikeRepository, IRepostRepository } from "../../../domain/social";
import type { GetFeedInput, PostOutput } from "../dto";

export class GetFeed {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
    private readonly likeRepository: ILikeRepository,
    private readonly repostRepository?: IRepostRepository
  ) {}

  async execute(input: GetFeedInput): Promise<Result<PostOutput[]>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const userId = userIdResult.getValue();
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const posts = await this.postRepository.getFeed(userId, limit, offset);

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const [author, likesCount, repostsCount, isLiked, isReposted] = await Promise.all([
          this.userRepository.findById(post.authorId),
          this.likeRepository.countByPost(post.id),
          this.repostRepository?.countByPost(post.id) ?? Promise.resolve(0),
          this.likeRepository.isLikedBy(userId, post.id),
          this.repostRepository?.isRepostedBy(userId, post.id) ?? Promise.resolve(false),
        ]);

        if (!author) {
          throw new DomainError("Author not found", "AUTHOR_NOT_FOUND");
        }

        return {
          id: post.id.value,
          authorId: post.authorId.value,
          authorUsername: author.username.value,
          authorDisplayName: author.displayName,
          authorEmoji: author.emoji,
          authorAvatarUrl: author.avatarUrl,
          authorVerified: author.verified,
          content: post.content.value,
          likesCount,
          commentsCount: 0,
          repostsCount,
          viewsCount: post.viewsCount ?? 0,
          isPinned: post.isPinned ?? false,
          pinnedAt: post.pinnedAt,
          isLiked,
          isReposted,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

    return Result.ok(postsWithDetails);
  }
}
