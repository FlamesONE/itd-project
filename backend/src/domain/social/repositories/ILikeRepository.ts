import { Like } from "../entities/Like";
import { UserId } from "../../identity/value-objects/UserId";
import { PostId } from "../../content/value-objects/PostId";

export interface SimilarUserByLikes {
  userId: string;
  commonLikes: number;
  similarityScore: number;
}

export interface PopularPostAmongUsers {
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  engagementScore: number;
  createdAt: Date;
  likedByCount: number;
}

export interface ILikeRepository {
  save(like: Like): Promise<void>;
  delete(userId: UserId, postId: PostId): Promise<void>;
  findByUserAndPost(userId: UserId, postId: PostId): Promise<Like | null>;
  getLikesByPost(postId: PostId, limit?: number, offset?: number): Promise<Like[]>;
  getLikesByUser(userId: UserId, limit?: number, offset?: number): Promise<Like[]>;
  countByPost(postId: PostId): Promise<number>;
  isLikedBy(userId: UserId, postId: PostId): Promise<boolean>;

  getSimilarUsersByLikes(userId: UserId, limit?: number): Promise<SimilarUserByLikes[]>;

  getPopularPostsAmongUsers(
    userIds: string[],
    excludeUserId: UserId,
    limit?: number
  ): Promise<PopularPostAmongUsers[]>;
}
