import { Result, DomainError } from "../../../domain/shared/Result";
import type { IPostRepository } from "../../../domain/content/repositories/IPostRepository";
import type { IUserRepository } from "../../../domain/identity/repositories/IUserRepository";
import type { ILikeRepository } from "../../../domain/social/repositories/ILikeRepository";
import type { IRepostRepository } from "../../../domain/social/repositories/IRepostRepository";
import { UserId } from "../../../domain/identity";

interface SearchPostsInput {
  query: string;
  limit?: number;
  offset?: number;
  currentUserId?: string;
}

export interface PostDTO {
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
  createdAt: Date;
  updatedAt: Date;
}

export class SearchPosts {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
    private likeRepository: ILikeRepository,
    private repostRepository: IRepostRepository
  ) {}

  async execute(input: SearchPostsInput): Promise<Result<PostDTO[], DomainError>> {
    const { query, limit = 20, offset = 0, currentUserId } = input;

    if (!query || query.trim().length === 0) {
      return Result.ok([]);
    }

    const posts = await this.postRepository.search(query.trim(), limit, offset);

    const postDTOs = await Promise.all(
      posts.map(async (post) => {
        const author = await this.userRepository.findById(post.authorId);
        const [likesCount, repostsCount] = await Promise.all([
          this.likeRepository.countByPost(post.id),
          this.repostRepository?.countByPost(post.id) ?? Promise.resolve(0),
        ]);

        let isLiked = false;
        let isReposted = false;

        if (currentUserId) {
          const userIdResult = UserId.create(currentUserId);
          if (userIdResult.isSuccess()) {
            [isLiked, isReposted] = await Promise.all([
              this.likeRepository.isLikedBy(userIdResult.getValue(), post.id),
              this.repostRepository?.isRepostedBy(userIdResult.getValue(), post.id) ?? Promise.resolve(false),
            ]);
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
          likesCount,
          commentsCount: post.commentsCount ?? 0,
          repostsCount,
          viewsCount: post.viewsCount ?? 0,
          isLiked,
          isReposted,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

    return Result.ok(postDTOs);
  }
}
