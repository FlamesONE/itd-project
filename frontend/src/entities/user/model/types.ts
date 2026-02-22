import type { FragmentOf, ResultOf } from '@shared/api/graphql';
import { UserFragment, RecommendedUsersQuery } from '@shared/api/graphql';

export type UserData = FragmentOf<typeof UserFragment>;
export type RecommendedUserData = ResultOf<typeof RecommendedUsersQuery>['recommendedUsers'][number];

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string | null | undefined;
  emoji: string;
  avatarUrl?: string | null | undefined;
  coverUrl?: string | null | undefined;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  followsMe?: boolean;
  wallPrivacy?: 'public' | 'followers' | 'private';
  canViewWall?: boolean;
  lastSeenAt?: string | null;
  isOnline?: boolean;
  createdAt: string;
}

export interface ClanStats {
  emoji: string;
  membersCount: number;
  percentage: number;
}

export interface Hashtag {
  id: string;
  name: string;
  postsCount: number;
  dailyCount: number;
  weeklyCount: number;
}

export interface HashtagSearchResult {
  id: string;
  name: string;
  postsCount: number;
}

export interface RecommendedUser {
  userId: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl?: string | null | undefined;
  bio?: string | null | undefined;
  followersCount: number;
  mutualFollowersCount: number;
  score: number;
  reason: string;
}
