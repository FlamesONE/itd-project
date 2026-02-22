import { Repost } from "../entities/Repost";
import { UserId } from "../../identity/value-objects/UserId";
import { PostId } from "../../content/value-objects/PostId";

export interface IRepostRepository {
  save(repost: Repost): Promise<void>;
  delete(userId: UserId, postId: PostId): Promise<void>;
  findByUserAndPost(userId: UserId, postId: PostId): Promise<Repost | null>;
  getRepostsByPost(postId: PostId, limit?: number, offset?: number): Promise<Repost[]>;
  getRepostsByUser(userId: UserId, limit?: number, offset?: number): Promise<Repost[]>;
  countByPost(postId: PostId): Promise<number>;
  isRepostedBy(userId: UserId, postId: PostId): Promise<boolean>;
}
