import type { FragmentOf } from '@shared/api/graphql';
import { NotificationFragment } from '@shared/api/graphql';

export type NotificationData = FragmentOf<typeof NotificationFragment>;

export type NotificationType = 'like' | 'comment' | 'repost' | 'follow' | 'mention' | 'reply';

export interface NotificationActor {
  id: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl?: string | null | undefined;
}

export interface NotificationPost {
  id: string;
  content: string;
}

export interface NotificationComment {
  id: string;
  content: string;
}

export interface Notification {
  id: string;
  actor: NotificationActor;
  type: NotificationType;
  post?: NotificationPost | null;
  comment?: NotificationComment | null;
  isRead: boolean;
  createdAt: string;
}
