import { Result, DomainError } from "../../../domain/shared";
import type { IPostRepository } from "../../../domain/content/repositories/IPostRepository";
import type { IUserRepository } from "../../../domain/identity/repositories/IUserRepository";
import type { ILikeRepository } from "../../../domain/social/repositories/ILikeRepository";
import type { IRepostRepository } from "../../../domain/social/repositories/IRepostRepository";
import type { IHashtagRepository } from "../../../domain/content/repositories/IHashtagRepository";
import { UserId } from "../../../domain/identity/value-objects/UserId";
import { query } from "../../../infrastructure/persistence/postgresql/connection";
import { PostId, PostContent } from "../../../domain/content";

export interface GetPostsByHashtagInput {
  hashtag: string;
  limit?: number;
  offset?: number;
  currentUserId?: string;
}

export interface HashtagPostOutput {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorEmoji: string;
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

export interface GetPostsByHashtagOutput {
  hashtag: string;
  postsCount: number;
  posts: HashtagPostOutput[];
}

interface PostRow {
  id: string;
  author_id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  views_count: number;
  created_at: Date;
  updated_at: Date;
}

export class GetPostsByHashtag {
  constructor(
    private readonly hashtagRepository: IHashtagRepository,
    private readonly userRepository: IUserRepository,
    private readonly likeRepository: ILikeRepository,
    private readonly repostRepository: IRepostRepository
  ) {}

  async execute(input: GetPostsByHashtagInput): Promise<Result<GetPostsByHashtagOutput>> {

    const hashtagName = input.hashtag.replace(/^#/, "").toLowerCase();
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const hashtag = await this.hashtagRepository.findByName(hashtagName);
    if (!hashtag) {
      return Result.ok({
        hashtag: hashtagName,
        postsCount: 0,
        posts: [],
      });
    }

    const rows = await query<PostRow>(
      `SELECT p.* FROM posts p
       INNER JOIN post_hashtags ph ON p.id = ph.post_id
       INNER JOIN hashtags h ON ph.hashtag_id = h.id
       WHERE h.name = $1 AND p.is_deleted = false
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [hashtagName, limit, offset]
    );

    let currentUserId: UserId | undefined;
    if (input.currentUserId) {
      const result = UserId.create(input.currentUserId);
      if (result.isSuccess()) {
        currentUserId = result.getValue();
      }
    }

    const posts: HashtagPostOutput[] = await Promise.all(
      rows.map(async (row) => {
        const authorIdResult = UserId.create(row.author_id);
        const author = authorIdResult.isSuccess()
          ? await this.userRepository.findById(authorIdResult.getValue())
          : null;

        let isLiked = false;
        let isReposted = false;

        if (currentUserId) {
          const postIdResult = PostId.create(row.id);
          if (postIdResult.isSuccess()) {
            isLiked = await this.likeRepository.isLikedBy(currentUserId, postIdResult.getValue());
            isReposted = await this.repostRepository.isRepostedBy(currentUserId, postIdResult.getValue());
          }
        }

        return {
          id: row.id,
          authorId: row.author_id,
          authorUsername: author?.username.value ?? "unknown",
          authorDisplayName: author?.displayName ?? "Unknown",
          authorEmoji: author?.emoji ?? "😀",
          content: row.content,
          likesCount: row.likes_count ?? 0,
          commentsCount: row.comments_count ?? 0,
          repostsCount: row.reposts_count ?? 0,
          viewsCount: row.views_count ?? 0,
          isLiked,
          isReposted,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      })
    );

    return Result.ok({
      hashtag: hashtagName,
      postsCount: hashtag.postsCount,
      posts,
    });
  }
}
