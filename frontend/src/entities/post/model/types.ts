import type { FragmentOf, ResultOf } from '@shared/api/graphql';
import { PostFragment, FeedQuery, TrendingQuery } from '@shared/api/graphql';

export type PostData = FragmentOf<typeof PostFragment>;
export type FeedData = ResultOf<typeof FeedQuery>['feed'][number];
export type TrendingPostData = ResultOf<typeof TrendingQuery>['trending'][number];

export type MediaType = 'IMAGE' | 'AVATAR' | 'COVER';

export interface Media {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  type: MediaType;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl?: string | null | undefined;
  verified: boolean;
}

export interface RepostInfo {
  quoteContent?: string | null;
  repostedAt: string;
  repostedById?: string | null;
  repostedByUsername?: string | null;
  repostedByDisplayName?: string | null;
  repostedByEmoji?: string | null;
  repostedByAvatarUrl?: string | null;
  repostedByVerified?: boolean | null;
}

export interface Post {
  id: string;
  author: PostAuthor;
  wallOwner?: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  content: string;
  media: Media[];
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  isPinned?: boolean;
  pinnedAt?: string | null;
  isLiked: boolean;
  isReposted: boolean;
  repostInfo?: RepostInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrendingPost extends Post {
  engagementScore: number;
}
