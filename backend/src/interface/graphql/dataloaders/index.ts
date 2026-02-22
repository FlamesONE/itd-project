import DataLoader from "dataloader";
import type { Container } from "../../../container";
import { UserId } from "../../../domain/identity";
import { PostId } from "../../../domain/content";

export interface DataLoaders {
  userLoader: DataLoader<string, UserData | null>;
  postLoader: DataLoader<string, PostData | null>;
  isFollowingLoader: DataLoader<string, boolean>;
  isLikedLoader: DataLoader<string, boolean>;
  isRepostedLoader: DataLoader<string, boolean>;
  likesCountLoader: DataLoader<string, number>;
  repostsCountLoader: DataLoader<string, number>;
  commentsCountLoader: DataLoader<string, number>;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  emoji: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
}

interface PostData {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export function createDataLoaders(
  container: Container,
  currentUserId?: string
): DataLoaders {
  const userLoader = new DataLoader<string, UserData | null>(
    async (userIds: readonly string[]) => {
      const users = await Promise.all(
        userIds.map(async (id: string) => {
          const userIdResult = UserId.create(id);
          if (userIdResult.isFailure()) return null;
          return container.userRepository.findById(userIdResult.getValue());
        })
      );

      return users.map((user) =>
        user
          ? {
              id: user.id.value,
              email: user.email.value,
              username: user.username.value,
              displayName: user.displayName,
              bio: user.bio,
              emoji: user.emoji,
              avatarUrl: user.avatarUrl,
              coverUrl: user.coverUrl,
              verified: user.verified,
              followersCount: user.followersCount,
              followingCount: user.followingCount,
              postsCount: user.postsCount,
              createdAt: user.createdAt,
            }
          : null
      );
    },
    { cache: true }
  );

  const postLoader = new DataLoader<string, PostData | null>(
    async (postIds: readonly string[]) => {
      const posts = await Promise.all(
        postIds.map(async (id: string) => {
          const postIdResult = PostId.create(id);
          if (postIdResult.isFailure()) return null;
          return container.postRepository.findById(postIdResult.getValue());
        })
      );

      return posts.map((post) =>
        post
          ? {
              id: post.id.value,
              authorId: post.authorId.value,
              content: post.content.value,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              isDeleted: post.isDeleted,
            }
          : null
      );
    },
    { cache: true }
  );

  const isFollowingLoader = new DataLoader<string, boolean>(
    async (targetUserIds: readonly string[]) => {
      if (!currentUserId) {
        return targetUserIds.map(() => false);
      }

      const currentUserIdResult = UserId.create(currentUserId);
      if (currentUserIdResult.isFailure()) {
        return targetUserIds.map(() => false);
      }

      const results = await Promise.all(
        targetUserIds.map(async (targetId: string) => {
          const targetIdResult = UserId.create(targetId);
          if (targetIdResult.isFailure()) return false;
          return container.followRepository.isFollowing(
            currentUserIdResult.getValue(),
            targetIdResult.getValue()
          );
        })
      );

      return results;
    },
    { cache: true }
  );

  const isLikedLoader = new DataLoader<string, boolean>(
    async (postIds: readonly string[]) => {
      if (!currentUserId) {
        return postIds.map(() => false);
      }

      const currentUserIdResult = UserId.create(currentUserId);
      if (currentUserIdResult.isFailure()) {
        return postIds.map(() => false);
      }

      const results = await Promise.all(
        postIds.map(async (postId: string) => {
          const postIdResult = PostId.create(postId);
          if (postIdResult.isFailure()) return false;
          return container.likeRepository.isLikedBy(
            currentUserIdResult.getValue(),
            postIdResult.getValue()
          );
        })
      );

      return results;
    },
    { cache: true }
  );

  const isRepostedLoader = new DataLoader<string, boolean>(
    async (postIds: readonly string[]) => {
      if (!currentUserId) {
        return postIds.map(() => false);
      }

      const currentUserIdResult = UserId.create(currentUserId);
      if (currentUserIdResult.isFailure()) {
        return postIds.map(() => false);
      }

      const results = await Promise.all(
        postIds.map(async (postId: string) => {
          const postIdResult = PostId.create(postId);
          if (postIdResult.isFailure()) return false;
          return container.repostRepository.isRepostedBy(
            currentUserIdResult.getValue(),
            postIdResult.getValue()
          );
        })
      );

      return results;
    },
    { cache: true }
  );

  const likesCountLoader = new DataLoader<string, number>(
    async (postIds: readonly string[]) => {
      const results = await Promise.all(
        postIds.map(async (postId: string) => {
          const postIdResult = PostId.create(postId);
          if (postIdResult.isFailure()) return 0;
          return container.likeRepository.countByPost(postIdResult.getValue());
        })
      );

      return results;
    },
    { cache: true }
  );

  const repostsCountLoader = new DataLoader<string, number>(
    async (postIds: readonly string[]) => {
      const results = await Promise.all(
        postIds.map(async (postId: string) => {
          const postIdResult = PostId.create(postId);
          if (postIdResult.isFailure()) return 0;
          return container.repostRepository.countByPost(postIdResult.getValue());
        })
      );

      return results;
    },
    { cache: true }
  );

  const commentsCountLoader = new DataLoader<string, number>(
    async (postIds: readonly string[]) => {
      const results = await Promise.all(
        postIds.map(async (postId: string) => {
          const postIdResult = PostId.create(postId);
          if (postIdResult.isFailure()) return 0;
          return container.commentRepository.countByPostId(postIdResult.getValue());
        })
      );

      return results;
    },
    { cache: true }
  );

  return {
    userLoader,
    postLoader,
    isFollowingLoader,
    isLikedLoader,
    isRepostedLoader,
    likesCountLoader,
    repostsCountLoader,
    commentsCountLoader,
  };
}
