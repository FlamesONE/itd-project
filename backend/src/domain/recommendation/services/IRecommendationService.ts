import { UserId } from "../../identity/value-objects/UserId";

export interface RecommendedUser {
  userId: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  mutualFollowersCount: number;
  score: number;
  reason: RecommendationReason;
}

export type RecommendationReason =
  | "mutual_followers"
  | "similar_interests"
  | "popular"
  | "new_user"
  | "location_based";

export interface RecommendedPost {
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  score: number;
  reason: PostRecommendationReason;
}

export type PostRecommendationReason =
  | "liked_by_follows"
  | "trending"
  | "similar_content"
  | "from_followed_topic";

export interface IRecommendationService {
  getUserRecommendations(
    userId: UserId,
    limit?: number
  ): Promise<RecommendedUser[]>;

  getPostRecommendations(
    userId: UserId,
    limit?: number
  ): Promise<RecommendedPost[]>;

  refreshUserRecommendations(userId: UserId): Promise<void>;
}
