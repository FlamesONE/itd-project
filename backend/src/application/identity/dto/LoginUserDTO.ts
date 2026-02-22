export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    bio: string | null;
    emoji: string;
    avatarUrl: string | null;
    verified: boolean;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    createdAt: Date;
  };
}
