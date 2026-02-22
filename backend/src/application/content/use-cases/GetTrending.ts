import { Result, DomainError } from "../../../domain/shared/Result";
import type { IPostRepository } from "../../../domain/content";
import type { IUserRepository } from "../../../domain/identity";
import type { ILikeRepository, IRepostRepository } from "../../../domain/social";
import { UserId } from "../../../domain/identity";

export interface GetTrendingInput {
  limit?: number;
  offset?: number;
  period?: "day" | "week" | "month";
  currentUserId?: string;
}

export interface TrendingPostOutput {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorEmoji: string;
  authorAvatarUrl: string | null;
  authorVerified: boolean;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  isLiked: boolean;
  isReposted: boolean;
  engagementScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GetTrending {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
    private readonly likeRepository: ILikeRepository,
    private readonly repostRepository: IRepostRepository
  ) {}

  async execute(input: GetTrendingInput): Promise<Result<TrendingPostOutput[]>> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;
    const period = input.period ?? "week";

    const periodDays = period === "day" ? 1 : period === "week" ? 7 : 30;

    const posts = await this.postRepository.getTrending(limit, offset, periodDays);

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await this.userRepository.findById(post.authorId);

        let isLiked = false;
        let isReposted = false;

        if (input.currentUserId) {
          const userIdResult = UserId.create(input.currentUserId);
          if (userIdResult.isSuccess()) {
            const userId = userIdResult.getValue();
            isLiked = await this.likeRepository.isLikedBy(userId, post.id);
            isReposted = await this.repostRepository.isRepostedBy(userId, post.id);
          }
        }

        return {
          id: post.id.value,
          authorId: post.authorId.value,
          authorUsername: author?.username.value ?? "unknown",
          authorDisplayName: author?.displayName ?? "Unknown",
          authorEmoji: author?.emoji ?? "😀",
          authorAvatarUrl: author?.avatarUrl ?? null,
          authorVerified: author?.verified ?? false,
          content: post.content.value,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          repostsCount: post.repostsCount,
          viewsCount: post.viewsCount ?? 0,
          isLiked,
          isReposted,
          engagementScore: post.engagementScore,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

    return Result.ok(enrichedPosts);
  }
}
