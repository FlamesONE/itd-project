import { Post } from "../entities/Post";
import { PostId } from "../value-objects/PostId";
import { UserId } from "../../identity/value-objects/UserId";

export interface IPostRepository {
  save(post: Post): Promise<void>;
  findById(id: PostId): Promise<Post | null>;
  findByAuthorId(authorId: UserId, limit?: number, offset?: number): Promise<Post[]>;
  findByWallOwnerId(wallOwnerId: UserId, limit?: number, offset?: number): Promise<Post[]>;
  delete(id: PostId): Promise<void>;
  existsById(id: PostId): Promise<boolean>;
  getFeed(userId: UserId, limit?: number, offset?: number): Promise<Post[]>;
  getTrending(limit?: number, offset?: number, periodDays?: number): Promise<Post[]>;
  updateEngagementScores(): Promise<void>;
  incrementViewCount(id: PostId): Promise<number>;
  search(query: string, limit?: number, offset?: number): Promise<Post[]>;
  pinPost(postId: PostId, userId: UserId): Promise<void>;
  unpinPost(postId: PostId, userId: UserId): Promise<void>;
  findPinnedPost(userId: UserId): Promise<Post | null>;
}
