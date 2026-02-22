import type { FragmentOf } from '@shared/api/graphql';
import { CommentFragment } from '@shared/api/graphql';

export type CommentData = FragmentOf<typeof CommentFragment>;

export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl?: string | null | undefined;
  verified: boolean;
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  content: string;
  audioUrl?: string | null;
  audioDuration?: number | null;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}
