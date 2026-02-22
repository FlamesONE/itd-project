import type { NotificationTypeValue } from "../../../domain/notification";

export interface GetNotificationsInput {
  userId: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationOutput {
  id: string;
  userId: string;
  actorId: string;
  actorUsername?: string;
  actorDisplayName?: string;
  type: NotificationTypeValue;
  postId: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface MarkAsReadInput {
  notificationId?: string;
  postId?: string;
  userId: string;
}

export interface MarkAllAsReadInput {
  userId: string;
}

export interface CreateNotificationInput {
  userId: string;
  actorId: string;
  type: NotificationTypeValue;
  postId?: string;
  commentId?: string;
}
