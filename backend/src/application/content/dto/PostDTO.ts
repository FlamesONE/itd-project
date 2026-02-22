export interface CreatePostInput {
  authorId: string;
  content: string;
  targetUserId?: string;
}

export interface CreatePostOutput {
  id: string;
  authorId: string;
  wallOwnerId?: string;
  content: string;
  isPinned: boolean;
  pinnedAt?: Date;
  createdAt: Date;
}

export interface GetPostInput {
  postId: string;
  currentUserId?: string;
}

export interface PostOutput {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorEmoji: string;
  authorAvatarUrl: string | null;
  authorVerified: boolean;
  wallOwnerId?: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  isPinned: boolean;
  pinnedAt?: Date;
  isLiked: boolean;
  isReposted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeletePostInput {
  postId: string;
  userId: string;
}

export interface GetFeedInput {
  userId: string;
  limit?: number;
  offset?: number;
}
