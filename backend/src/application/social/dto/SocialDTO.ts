export interface FollowUserInput {
  followerId: string;
  followingId: string;
}

export interface UnfollowUserInput {
  followerId: string;
  followingId: string;
}

export interface LikePostInput {
  userId: string;
  postId: string;
}

export interface UnlikePostInput {
  userId: string;
  postId: string;
}

export interface GetFollowersInput {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GetFollowingInput {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
}
