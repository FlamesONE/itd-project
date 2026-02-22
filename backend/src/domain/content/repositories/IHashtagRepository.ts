import type { Hashtag, HashtagId } from "../entities/Hashtag";
import type { PostId } from "../value-objects/PostId";
import type { UserId } from "../../identity/value-objects/UserId";

export interface TrendingHashtag {
  id: string;
  name: string;
  postsCount: number;
  dailyCount: number;
  weeklyCount: number;
}

export interface UserHashtag {
  id: string;
  name: string;
  userUsageCount: number;
}

export interface PostByHashtag {
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  engagementScore: number;
  createdAt: Date;
  matchingTags: number;
  contentScore: number;
}

export interface IHashtagRepository {
  findById(id: HashtagId): Promise<Hashtag | null>;
  findByName(name: string): Promise<Hashtag | null>;
  findByPostId(postId: PostId): Promise<Hashtag[]>;

  getTrending(period: "day" | "week" | "all", limit: number): Promise<TrendingHashtag[]>;

  search(prefix: string, limit: number): Promise<Hashtag[]>;

  getPostsCount(name: string): Promise<number>;

  getUserTopHashtags(userId: UserId, limit?: number): Promise<UserHashtag[]>;

  getPostsByHashtags(
    hashtagNames: string[],
    excludeAuthorId: UserId,
    limit?: number
  ): Promise<PostByHashtag[]>;
}
