import { Follow } from "../entities/Follow";
import { UserId } from "../../identity/value-objects/UserId";

export interface SimilarUserByFollows {
  userId: string;
  commonFollows: number;
  totalFollows: number;
  similarityScore: number;
}

export interface IFollowRepository {
  save(follow: Follow): Promise<void>;
  delete(followerId: UserId, followingId: UserId): Promise<void>;
  findByFollowerAndFollowing(followerId: UserId, followingId: UserId): Promise<Follow | null>;
  getFollowers(userId: UserId, limit?: number, offset?: number): Promise<Follow[]>;
  getFollowing(userId: UserId, limit?: number, offset?: number): Promise<Follow[]>;
  countFollowers(userId: UserId): Promise<number>;
  countFollowing(userId: UserId): Promise<number>;
  isFollowing(followerId: UserId, followingId: UserId): Promise<boolean>;
  getFollowingIds(userId: UserId): Promise<UserId[]>;

  getSimilarUsersByFollows(userId: UserId, limit?: number): Promise<SimilarUserByFollows[]>;
}
