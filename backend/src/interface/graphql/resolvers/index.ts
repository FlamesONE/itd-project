import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../context";
import { DomainError } from "../../../domain/shared/Result";
import { getPool } from "../../../infrastructure/persistence/postgresql/connection";
import { getRedis } from "../../../infrastructure/persistence/redis/connection";
import type { PostDTO } from "../../../application/content/use-cases/SearchPosts";
import type { UserDTO } from "../../../application/identity/use-cases/SearchUsers";
import { checkRateLimit, checkSpam, isContentCreation } from "../middleware/antiBotMiddleware";

function requireAuth(context: GraphQLContext): string {
  if (!context.userId) {
    throw new GraphQLError("Unauthorized", {
      extensions: { code: "UNAUTHORIZED" },
    });
  }
  return context.userId;
}

function getErrorCode(error: Error): string {
  if (error instanceof DomainError) {
    return error.code;
  }
  return "UNKNOWN_ERROR";
}

export const resolvers = {
  Query: {
    health: async () => {
      let dbHealthy = false;
      let redisHealthy = false;

      try {
        const pool = getPool();
        await pool.query("SELECT 1");
        dbHealthy = true;
      } catch {
        dbHealthy = false;
      }

      try {
        const redis = getRedis();
        await redis.ping();
        redisHealthy = true;
      } catch {
        redisHealthy = false;
      }

      return {
        status: dbHealthy && redisHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy,
          redis: redisHealthy,
        },
      };
    },

    me: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const userId = requireAuth(context);
      const result = await context.container.getUserProfile.execute({
        userId,
        currentUserId: userId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    user: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const result = await context.container.getUserProfile.execute({
        userId: id,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    userByUsername: async (
      _: unknown,
      { username }: { username: string },
      context: GraphQLContext
    ) => {
      const result = await context.container.getUserByUsername.execute({
        username,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    post: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const result = await context.container.getPost.execute({
        postId: id,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    feed: async (
      _: unknown,
      { limit, offset }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);
      const result = await context.container.getFeed.execute({
        userId,
        limit: limit ?? 20,
        offset: offset ?? 0,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    trending: async (
      _: unknown,
      { limit, offset, period }: { limit?: number; offset?: number; period?: string },
      context: GraphQLContext
    ) => {
      const periodMap: Record<string, "day" | "week" | "month"> = {
        DAY: "day",
        WEEK: "week",
        MONTH: "month",
      };

      const result = await context.container.getTrending.execute({
        limit: limit ?? 20,
        offset: offset ?? 0,
        period: period ? periodMap[period] ?? "week" : "week",
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    userPosts: async (
      _: unknown,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const { postRepository, userRepository, likeRepository, repostRepository } = context.container;
      const { UserId } = await import("../../../domain/identity");

      const userIdResult = UserId.create(userId);
      if (userIdResult.isFailure()) {
        return [];
      }

      const targetUserId = userIdResult.getValue();

      const wallPosts = await postRepository.findByWallOwnerId(
        targetUserId,
        (limit ?? 20) + 10,
        0
      );

      const reposts = await repostRepository.getRepostsByUser(
        targetUserId,
        (limit ?? 20) + 10,
        0
      );

      const repostedPosts = await Promise.all(
        reposts.map(async (repost) => {
          const post = await postRepository.findById(repost.postId);
          if (!post) return null;
          return { post, repost };
        })
      );

      const profileUser = await userRepository.findById(targetUserId);

      type FeedItem = {
        type: 'post' | 'repost';
        timestamp: Date;
        post: typeof wallPosts[0];
        repostInfo?: { quoteContent: string | null; repostedAt: Date; repostedById: string };
      };

      const feedItems: FeedItem[] = [
        ...wallPosts.map(post => ({
          type: 'post' as const,
          timestamp: post.createdAt,
          post,
        })),
        ...repostedPosts
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .map(({ post, repost }) => ({
            type: 'repost' as const,
            timestamp: repost.createdAt,
            post,
            repostInfo: {
              quoteContent: repost.quoteContent,
              repostedAt: repost.createdAt,
              repostedById: targetUserId.value,
            },
          })),
      ];

      feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const paginatedItems = feedItems.slice(offset ?? 0, (offset ?? 0) + (limit ?? 20));

      return Promise.all(
        paginatedItems.map(async (item) => {
          const post = item.post;
          const author = await userRepository.findById(post.authorId);
          const [likesCount, repostsCount] = await Promise.all([
            likeRepository.countByPost(post.id),
            repostRepository?.countByPost(post.id) ?? Promise.resolve(0),
          ]);
          let isLiked = false;
          let isReposted = false;

          if (context.userId) {
            const currentUserIdResult = UserId.create(context.userId);
            if (currentUserIdResult.isSuccess()) {
              [isLiked, isReposted] = await Promise.all([
                likeRepository.isLikedBy(currentUserIdResult.getValue(), post.id),
                repostRepository?.isRepostedBy(currentUserIdResult.getValue(), post.id) ?? Promise.resolve(false),
              ]);
            }
          }

          return {
            id: post.id.value,
            authorId: post.authorId.value,
            wallOwnerId: post.wallOwnerId?.value ?? null,
            authorUsername: author?.username.value ?? "unknown",
            authorDisplayName: author?.displayName ?? "Unknown",
            authorEmoji: author?.emoji ?? "😀",
            authorAvatarUrl: author?.avatarUrl ?? null,
            authorVerified: author?.verified ?? false,
            content: post.content.value,
            media: [],
            likesCount,
            commentsCount: post.commentsCount ?? 0,
            repostsCount,
            viewsCount: post.viewsCount ?? 0,
            isPinned: post.isPinned ?? false,
            pinnedAt: post.pinnedAt?.toISOString() ?? null,
            isLiked,
            isReposted,
            repostInfo: item.type === 'repost' && item.repostInfo ? {
              quoteContent: item.repostInfo.quoteContent,
              repostedAt: item.repostInfo.repostedAt.toISOString(),
              repostedById: item.repostInfo.repostedById,
              repostedByUsername: profileUser?.username.value,
              repostedByDisplayName: profileUser?.displayName,
              repostedByEmoji: profileUser?.emoji,
              repostedByAvatarUrl: profileUser?.avatarUrl,
              repostedByVerified: profileUser?.verified,
            } : null,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          };
        })
      );
    },

    comments: async (
      _: unknown,
      { postId, limit, offset, sortBy }: { postId: string; limit?: number; offset?: number; sortBy?: 'NEWEST' | 'POPULAR' },
      context: GraphQLContext
    ) => {
      const result = await context.container.getComments.execute({
        postId,
        limit: limit ?? 20,
        offset: offset ?? 0,
        sortBy: sortBy ?? 'NEWEST',
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    commentReplies: async (
      _: unknown,
      { commentId, limit, offset }: { commentId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const { CommentId } = await import("../../../domain/content");
      const commentIdResult = CommentId.create(commentId);
      if (commentIdResult.isFailure()) {
        throw new GraphQLError("Invalid comment ID", {
          extensions: { code: "INVALID_COMMENT_ID" },
        });
      }

      const replies = await context.container.commentRepository.findReplies(
        commentIdResult.getValue(),
        limit ?? 20,
        offset ?? 0
      );

      return replies.map((reply) => ({
        id: reply.id.value,
        postId: reply.postId.value,
        authorId: reply.authorId.value,
        parentCommentId: reply.parentCommentId?.value ?? null,
        content: reply.content,
        audioUrl: reply.audioUrl,
        audioDuration: reply.audioDuration,
        likesCount: reply.likesCount,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      }));
    },

    userReposts: async (
      _: unknown,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const { repostRepository, userRepository, postRepository, likeRepository } = context.container;
      const { UserId } = await import("../../../domain/identity");

      const userIdResult = UserId.create(userId);
      if (userIdResult.isFailure()) {
        return [];
      }

      const reposts = await repostRepository.getRepostsByUser(
        userIdResult.getValue(),
        limit ?? 20,
        offset ?? 0
      );

      return reposts.map((repost) => ({
        id: repost.id.value,
        userId: repost.userId.value,
        postId: repost.postId.value,
        quoteContent: repost.quoteContent,
        createdAt: repost.createdAt.toISOString(),
      }));
    },

    notifications: async (
      _: unknown,
      { limit, offset, unreadOnly }: { limit?: number; offset?: number; unreadOnly?: boolean },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const result = await context.container.getNotifications.execute({
        userId,
        limit: limit ?? 20,
        offset: offset ?? 0,
        unreadOnly: unreadOnly ?? false,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue().map((n) => ({
        id: n.id,
        userId: n.userId,
        actorId: n.actorId,
        type: n.type,
        postId: n.postId,
        commentId: n.commentId,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }));
    },

    unreadNotificationsCount: async (
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const result = await context.container.getUnreadCount.execute({ userId });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    postMedia: async (
      _: unknown,
      { postId }: { postId: string },
      context: GraphQLContext
    ) => {
      const result = await context.container.getMediaByPost.execute({ postId });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue().map((m) => ({
        id: m.id,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        width: m.width,
        height: m.height,
        type: m.type.toUpperCase(),
      }));
    },

    recommendedUsers: async (
      _: unknown,
      { limit }: { limit?: number },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const result = await context.container.getUserRecommendations.execute({
        userId,
        limit: limit ?? 10,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    recommendedPosts: async (
      _: unknown,
      { limit }: { limit?: number },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const result = await context.container.getPostRecommendations.execute({
        userId,
        limit: limit ?? 20,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    trendingHashtags: async (
      _: unknown,
      { period, limit }: { period?: string; limit?: number },
      context: GraphQLContext
    ) => {
      const result = await context.container.getTrendingHashtags.execute({
        period: (period as "day" | "week" | "all") ?? "week",
        limit: limit ?? 10,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue().map((h) => ({
        id: h.id,
        name: h.name,
        postsCount: h.postsCount,
        dailyCount: h.dailyCount,
        weeklyCount: h.weeklyCount,
      }));
    },

    searchHashtags: async (
      _: unknown,
      { query, limit }: { query: string; limit?: number },
      context: GraphQLContext
    ) => {
      const result = await context.container.searchHashtags.execute({
        query,
        limit: limit ?? 10,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    postsByHashtag: async (
      _: unknown,
      { hashtag, limit, offset }: { hashtag: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const result = await context.container.getPostsByHashtag.execute({
        hashtag,
        limit: limit ?? 20,
        offset: offset ?? 0,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const data = result.getValue();

      return {
        hashtag: data.hashtag,
        postsCount: data.postsCount,
        posts: data.posts.map((p) => ({
          id: p.id,
          authorId: p.authorId,
          authorUsername: p.authorUsername,
          authorDisplayName: p.authorDisplayName,
          authorEmoji: p.authorEmoji,
          content: p.content,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          repostsCount: p.repostsCount,
          viewsCount: p.viewsCount,
          isLiked: p.isLiked,
          isReposted: p.isReposted,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      };
    },

    clanStats: async (
      _: unknown,
      { limit }: { limit?: number },
      context: GraphQLContext
    ) => {
      const result = await context.container.getClanStats.execute({ limit });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    searchPosts: async (
      _: unknown,
      { query, limit, offset }: { query: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const result = await context.container.searchPosts.execute({
        query,
        limit: limit ?? 20,
        offset: offset ?? 0,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    searchUsers: async (
      _: unknown,
      { query, limit, offset }: { query: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const result = await context.container.searchUsers.execute({
        query,
        limit: limit ?? 20,
        offset: offset ?? 0,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    adminDashboardStats: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const userId = requireAuth(context);

      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
      const { UserId } = await import("../../../domain/identity");
      const currentUser = await context.container.userRepository.findById(
        UserId.create(userId).getValue()
      );

      if (!currentUser || !adminEmails.includes(currentUser.email.value.toLowerCase())) {
        throw new GraphQLError("Доступ запрещён", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await context.container.getDashboardStats.execute();
      return result;
    },

    adminUserActivity: async (
      _: unknown,
      { days }: { days?: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const result = await context.container.getUserActivityData.execute(days ?? 30);
      return result;
    },

    adminTopUsers: async (
      _: unknown,
      { limit }: { limit?: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const result = await context.container.getTopUsers.execute(limit ?? 10);
      return result;
    },

    adminHourlyActivity: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      const result = await context.container.getHourlyActivity.execute();
      return result;
    },

    adminGrowthMetrics: async (
      _: unknown,
      { days }: { days?: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const result = await context.container.getGrowthMetrics.execute(days ?? 30);
      return result;
    },

    adminCheckAccess: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const userId = requireAuth(context);

      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

      const user = await context.container.userRepository.findById(
        (await import("../../../domain/identity")).UserId.create(userId).getValue()
      );

      if (!user) return false;

      return adminEmails.includes(user.email.value.toLowerCase());
    },

    adminSearchUsers: async (
      _: unknown,
      { query, limit, offset }: { query: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
      const currentUser = await context.container.userRepository.findById(
        (await import("../../../domain/identity")).UserId.create(userId).getValue()
      );

      if (!currentUser || !adminEmails.includes(currentUser.email.value.toLowerCase())) {
        throw new GraphQLError("Доступ запрещён", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await context.container.searchUsers.execute({
        query,
        limit: limit ?? 20,
        offset: offset ?? 0,
        currentUserId: userId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const users = result.getValue();
      const { UserId } = await import("../../../domain/identity");

      const fullUsers = await Promise.all(
        users.map(async (u) => {
          const userEntity = await context.container.userRepository.findById(
            UserId.create(u.id).getValue()
          );
          return userEntity ? {
            id: userEntity.id.value,
            email: userEntity.email.value,
            username: userEntity.username.value,
            displayName: userEntity.displayName,
            emoji: userEntity.emoji,
            avatarUrl: userEntity.avatarUrl,
            bio: userEntity.bio,
            verified: userEntity.verified,
            followersCount: userEntity.followersCount,
            followingCount: userEntity.followingCount,
            postsCount: userEntity.postsCount,
            createdAt: userEntity.createdAt.toISOString(),
          } : null;
        })
      );

      return fullUsers.filter(Boolean);
    },

    adminGetAllUsers: async (
      _: unknown,
      { limit, offset }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
      const currentUser = await context.container.userRepository.findById(
        (await import("../../../domain/identity")).UserId.create(userId).getValue()
      );

      if (!currentUser || !adminEmails.includes(currentUser.email.value.toLowerCase())) {
        throw new GraphQLError("Доступ запрещён", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const { users, total } = await context.container.userRepository.findAllPaginated(
        limit ?? 20,
        offset ?? 0
      );

      return {
        users: users.map((u: import("../../../domain/identity").User) => ({
          id: u.id.value,
          email: u.email.value,
          username: u.username.value,
          displayName: u.displayName,
          emoji: u.emoji,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
          verified: u.verified,
          followersCount: u.followersCount,
          followingCount: u.followingCount,
          postsCount: u.postsCount,
          createdAt: u.createdAt.toISOString(),
        })),
        total,
      };
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      { input }: { input: { email: string; username: string; password: string; displayName?: string; emoji?: string } },
      context: GraphQLContext
    ) => {
      await checkRateLimit("register", context, context.container.rateLimiter);

      const result = await context.container.registerUser.execute(input);

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const user = result.getValue();

      const loginResult = await context.container.loginUser.execute({
        email: input.email,
        password: input.password,
      });

      if (loginResult.isFailure()) {
        throw new GraphQLError(loginResult.getError().message, {
          extensions: { code: getErrorCode(loginResult.getError()) },
        });
      }

      const loginData = loginResult.getValue();

      return {
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        user: {
          id: user.userId,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          bio: null,
          emoji: input.emoji || "😀",
          avatarUrl: null,
          verified: false,
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isFollowing: false,
          createdAt: new Date().toISOString(),
        },
      };
    },

    login: async (
      _: unknown,
      { input }: { input: { email: string; password: string } },
      context: GraphQLContext
    ) => {
      await checkRateLimit("login", context, context.container.rateLimiter);

      const result = await context.container.loginUser.execute(input);

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const data = result.getValue();

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          displayName: data.user.displayName,
          bio: data.user.bio || null,
          emoji: data.user.emoji || "😀",
          avatarUrl: data.user.avatarUrl || null,
          verified: data.user.verified || false,
          followersCount: data.user.followersCount || 0,
          followingCount: data.user.followingCount || 0,
          postsCount: data.user.postsCount || 0,
          isFollowing: false,
          createdAt: data.user.createdAt?.toISOString() || new Date().toISOString(),
        },
      };
    },

    refreshToken: async (
      _: unknown,
      { refreshToken }: { refreshToken: string },
      context: GraphQLContext
    ) => {
      const result = await context.container.refreshToken.execute({ refreshToken });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    updateProfile: async (
      _: unknown,
      { input }: { input: { displayName?: string; bio?: string; emoji?: string; avatarUrl?: string; coverUrl?: string } },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.updateProfile.execute({
        userId,
        ...input,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const updated = result.getValue();

      const profileResult = await context.container.getUserProfile.execute({
        userId,
        currentUserId: userId,
      });

      if (profileResult.isSuccess()) {
        return profileResult.getValue();
      }

      return {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        displayName: updated.displayName,
        bio: updated.bio,
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
        createdAt: updated.createdAt.toISOString(),
      };
    },

    changePassword: async (
      _: unknown,
      { input }: { input: { currentPassword: string; newPassword: string } },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.changePassword.execute({
        userId,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    updateEmail: async (
      _: unknown,
      { input }: { input: { newEmail: string; password: string } },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.updateEmail.execute({
        userId,
        newEmail: input.newEmail,
        password: input.password,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const profileResult = await context.container.getUserProfile.execute({
        userId,
        currentUserId: userId,
      });

      if (profileResult.isFailure()) {
        throw new GraphQLError(profileResult.getError().message, {
          extensions: { code: getErrorCode(profileResult.getError()) },
        });
      }

      return profileResult.getValue();
    },

    updateUsername: async (
      _: unknown,
      { input }: { input: { newUsername: string; password: string } },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.updateUsername.execute({
        userId,
        newUsername: input.newUsername,
        password: input.password,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const profileResult = await context.container.getUserProfile.execute({
        userId,
        currentUserId: userId,
      });

      if (profileResult.isFailure()) {
        throw new GraphQLError(profileResult.getError().message, {
          extensions: { code: getErrorCode(profileResult.getError()) },
        });
      }

      return profileResult.getValue();
    },

    createPost: async (
      _: unknown,
      { content, mediaIds, targetUserId }: { content: string; mediaIds?: string[]; targetUserId?: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      const hasContent = content && content.trim().length > 0;
      const hasMedia = mediaIds && mediaIds.length > 0;
      if (!hasContent && !hasMedia) {
        throw new GraphQLError("Post must have content or media", {
          extensions: { code: "EMPTY_POST" },
        });
      }

      await checkRateLimit("createPost", context, context.container.rateLimiter);

      if (hasContent && isContentCreation("createPost")) {
        await checkSpam(content, context.container.spamDetector);
      }

      const result = await context.container.createPost.execute({
        authorId: userId,
        content,
        targetUserId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const post = result.getValue();

      if (mediaIds && mediaIds.length > 0) {
        const attachResult = await context.container.attachMediaToPost.execute({
          mediaIds,
          postId: post.id,
          userId,
        });
        if (attachResult.isFailure()) {
          console.error(`[CreatePost] Failed to attach media:`, attachResult.getError());
        }
      }

      const mediaResult = await context.container.getMediaByPost.execute({
        postId: post.id,
      });
      const media = mediaResult.isSuccess()
        ? mediaResult.getValue().map((m) => ({
          id: m.id,
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          width: m.width,
          height: m.height,
          type: m.type.toUpperCase(),
        }))
        : [];

      const profileResult = await context.container.getUserProfile.execute({
        userId,
        currentUserId: userId,
      });

      const profile = profileResult.isSuccess() ? profileResult.getValue() : null;

      return {
        id: post.id,
        authorId: post.authorId,
        wallOwnerId: post.wallOwnerId,
        authorUsername: profile?.username ?? "unknown",
        authorDisplayName: profile?.displayName ?? "Unknown",
        content: post.content,
        media,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        viewsCount: 0,
        isLiked: false,
        isReposted: false,
        createdAt: post.createdAt,
        updatedAt: post.createdAt,
      };
    },

    updatePost: async (
      _: unknown,
      { id, content }: { id: string; content: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("updatePost", context, context.container.rateLimiter);

      if (isContentCreation("updatePost")) {
        await checkSpam(content, context.container.spamDetector);
      }

      const result = await context.container.updatePost.execute({
        postId: id,
        userId,
        content,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const post = result.getValue();

      const profileResult = await context.container.getUserProfile.execute({
        userId,
        currentUserId: userId,
      });

      const profile = profileResult.isSuccess() ? profileResult.getValue() : null;

      return {
        id: post.id,
        authorId: post.authorId,
        authorUsername: profile?.username ?? "unknown",
        authorDisplayName: profile?.displayName ?? "Unknown",
        content: post.content,
        media: [],
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        viewsCount: 0,
        isLiked: false,
        isReposted: false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    },

    deletePost: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.deletePost.execute({
        postId: id,
        userId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    viewPost: async (
      _: unknown,
      { postId, fingerprint }: { postId: string; fingerprint?: string },
      context: GraphQLContext
    ) => {
      const result = await context.container.viewPost.execute({
        postId,
        viewerId: context.userId ?? undefined,
        fingerprint,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return result.getValue();
    },

    createComment: async (
      _: unknown,
      { postId, content, audioUrl, audioDuration }: { postId: string; content?: string; audioUrl?: string; audioDuration?: number },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("comment", context, context.container.rateLimiter);

      if (isContentCreation("createComment") && content) {
        await checkSpam(content, context.container.spamDetector);
      }

      const result = await context.container.createComment.execute({
        postId,
        authorId: userId,
        content: content || "",
        audioUrl,
        audioDuration,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const comment = result.getValue();

      const profileResult = await context.container.getUserProfile.execute({
        userId,
        currentUserId: userId,
      });

      const profile = profileResult.isSuccess() ? profileResult.getValue() : null;

      return {
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorUsername: profile?.username ?? "unknown",
        authorDisplayName: profile?.displayName ?? "Unknown",
        content: comment.content,
        audioUrl: comment.audioUrl,
        audioDuration: comment.audioDuration,
        createdAt: comment.createdAt,
        updatedAt: comment.createdAt,
      };
    },

    deleteComment: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.deleteComment.execute({
        commentId: id,
        userId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    followUser: async (
      _: unknown,
      { userId: targetUserId }: { userId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("follow", context, context.container.rateLimiter);

      const result = await context.container.followUser.execute({
        followerId: userId,
        followingId: targetUserId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    unfollowUser: async (
      _: unknown,
      { userId: targetUserId }: { userId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("follow", context, context.container.rateLimiter);

      const result = await context.container.unfollowUser.execute({
        followerId: userId,
        followingId: targetUserId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    likePost: async (
      _: unknown,
      { postId }: { postId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("likePost", context, context.container.rateLimiter);

      const result = await context.container.likePost.execute({
        userId,
        postId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    unlikePost: async (
      _: unknown,
      { postId }: { postId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("likePost", context, context.container.rateLimiter);

      const result = await context.container.unlikePost.execute({
        userId,
        postId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    repostPost: async (
      _: unknown,
      { postId, quoteContent }: { postId: string; quoteContent?: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("repost", context, context.container.rateLimiter);

      if (quoteContent && isContentCreation("repost")) {
        await checkSpam(quoteContent, context.container.spamDetector);
      }

      const result = await context.container.repostPost.execute({
        userId,
        postId,
        quoteContent,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const repost = result.getValue();

      return {
        id: repost.id,
        userId: repost.userId,
        postId: repost.postId,
        quoteContent: repost.quoteContent,
        createdAt: repost.createdAt.toISOString(),
      };
    },

    unrepostPost: async (
      _: unknown,
      { postId }: { postId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.unrepostPost.execute({
        userId,
        postId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    markNotificationAsRead: async (
      _: unknown,
      { notificationId, postId }: { notificationId?: string; postId?: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.markNotificationAsRead.execute({
        notificationId,
        postId,
        userId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    markAllNotificationsAsRead: async (
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.markAllNotificationsAsRead.execute({
        userId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    replyToComment: async (
      _: unknown,
      { postId, parentCommentId, content, audioUrl, audioDuration }: { postId: string; parentCommentId: string; content?: string; audioUrl?: string; audioDuration?: number },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("comment", context, context.container.rateLimiter);

      if (isContentCreation("replyToComment") && content) {
        await checkSpam(content, context.container.spamDetector);
      }

      const result = await context.container.replyToComment.execute({
        postId,
        parentCommentId,
        authorId: userId,
        content: content || "",
        audioUrl,
        audioDuration,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      const reply = result.getValue();

      const profileResult = await context.container.getUserProfile.execute({
        userId,
        currentUserId: userId,
      });

      const profile = profileResult.isSuccess() ? profileResult.getValue() : null;

      return {
        id: reply.id,
        postId: reply.postId,
        authorId: reply.authorId,
        parentCommentId: reply.parentCommentId,
        authorUsername: profile?.username ?? "unknown",
        authorDisplayName: profile?.displayName ?? "Unknown",
        content: reply.content,
        audioUrl: reply.audioUrl,
        audioDuration: reply.audioDuration,
        likesCount: 0,
        createdAt: reply.createdAt,
        updatedAt: reply.createdAt,
      };
    },

    likeComment: async (
      _: unknown,
      { commentId }: { commentId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("likePost", context, context.container.rateLimiter);

      const result = await context.container.likeComment.execute({
        userId,
        commentId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    unlikeComment: async (
      _: unknown,
      { commentId }: { commentId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("likePost", context, context.container.rateLimiter);

      const result = await context.container.unlikeComment.execute({
        userId,
        commentId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    pinPost: async (
      _: unknown,
      { postId }: { postId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.pinPost.execute({
        postId,
        userId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },

    unpinPost: async (
      _: unknown,
      { postId }: { postId: string },
      context: GraphQLContext
    ) => {
      const userId = requireAuth(context);

      await checkRateLimit("global", context, context.container.rateLimiter);

      const result = await context.container.unpinPost.execute({
        postId,
        userId,
      });

      if (result.isFailure()) {
        throw new GraphQLError(result.getError().message, {
          extensions: { code: getErrorCode(result.getError()) },
        });
      }

      return true;
    },
  },

  Post: {
    author: async (parent: { authorId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getUserProfile.execute({
        userId: parent.authorId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    wallOwner: async (parent: { wallOwnerId?: string | null }, _: unknown, context: GraphQLContext) => {
      if (!parent.wallOwnerId) return null;

      const result = await context.container.getUserProfile.execute({
        userId: parent.wallOwnerId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    media: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getMediaByPost.execute({
        postId: parent.id,
      });

      if (result.isFailure()) {
        return [];
      }

      return result.getValue().map((m) => ({
        id: m.id,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        width: m.width,
        height: m.height,
        type: m.type.toUpperCase(),
      }));
    },

    comments: async (
      parent: { id: string },
      { limit, offset, sortBy }: { limit?: number; offset?: number; sortBy?: 'NEWEST' | 'POPULAR' },
      context: GraphQLContext
    ) => {
      const result = await context.container.getComments.execute({
        postId: parent.id,
        limit: limit ?? 10,
        offset: offset ?? 0,
        sortBy: sortBy ?? 'NEWEST',
      });

      if (result.isFailure()) {
        return [];
      }

      return result.getValue();
    },
  },

  Comment: {
    author: async (parent: { authorId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getUserProfile.execute({
        userId: parent.authorId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    post: async (parent: { postId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getPost.execute({
        postId: parent.postId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    parentComment: async (parent: { parentCommentId: string | null }, _: unknown, context: GraphQLContext) => {
      if (!parent.parentCommentId) return null;

      const { CommentId } = await import("../../../domain/content");
      const commentIdResult = CommentId.create(parent.parentCommentId);
      if (commentIdResult.isFailure()) return null;

      const comment = await context.container.commentRepository.findById(commentIdResult.getValue());
      if (!comment) return null;

      return {
        id: comment.id.value,
        postId: comment.postId.value,
        authorId: comment.authorId.value,
        parentCommentId: comment.parentCommentId?.value ?? null,
        content: comment.content,
        likesCount: comment.likesCount,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };
    },

    likesCount: (parent: { likesCount?: number }) => parent.likesCount ?? 0,

    repliesCount: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      const { CommentId } = await import("../../../domain/content");
      const commentIdResult = CommentId.create(parent.id);
      if (commentIdResult.isFailure()) return 0;

      return context.container.commentRepository.countReplies(commentIdResult.getValue());
    },

    isLiked: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      if (!context.userId) return false;

      const { UserId } = await import("../../../domain/identity");
      const { CommentId } = await import("../../../domain/content");

      const userIdResult = UserId.create(context.userId);
      const commentIdResult = CommentId.create(parent.id);

      if (userIdResult.isFailure() || commentIdResult.isFailure()) return false;

      return context.container.commentLikeRepository.isLikedBy(
        userIdResult.getValue(),
        commentIdResult.getValue()
      );
    },

    replies: async (
      parent: { id: string },
      { limit, offset }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const { CommentId } = await import("../../../domain/content");
      const commentIdResult = CommentId.create(parent.id);
      if (commentIdResult.isFailure()) return [];

      const replies = await context.container.commentRepository.findReplies(
        commentIdResult.getValue(),
        limit ?? 10,
        offset ?? 0
      );

      return replies.map((reply) => ({
        id: reply.id.value,
        postId: reply.postId.value,
        authorId: reply.authorId.value,
        parentCommentId: reply.parentCommentId?.value ?? null,
        content: reply.content,
        audioUrl: reply.audioUrl,
        audioDuration: reply.audioDuration,
        likesCount: reply.likesCount,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      }));
    },
  },

  Repost: {
    user: async (parent: { userId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getUserProfile.execute({
        userId: parent.userId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    post: async (parent: { postId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getPost.execute({
        postId: parent.postId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },
  },

  RecommendedPost: {
    author: async (parent: { authorId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getUserProfile.execute({
        userId: parent.authorId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },
  },

  TrendingPost: {
    author: async (parent: { authorId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getUserProfile.execute({
        userId: parent.authorId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    media: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getMediaByPost.execute({
        postId: parent.id,
      });

      if (result.isFailure()) {
        return [];
      }

      return result.getValue().map((m) => ({
        id: m.id,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        width: m.width,
        height: m.height,
        type: m.type.toUpperCase(),
      }));
    },
  },

  Notification: {
    user: async (parent: { userId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getUserProfile.execute({
        userId: parent.userId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    actor: async (parent: { actorId: string }, _: unknown, context: GraphQLContext) => {
      const result = await context.container.getUserProfile.execute({
        userId: parent.actorId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    post: async (parent: { postId: string | null }, _: unknown, context: GraphQLContext) => {
      if (!parent.postId) return null;

      const result = await context.container.getPost.execute({
        postId: parent.postId,
        currentUserId: context.userId ?? undefined,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue();
    },

    comment: async (parent: { commentId: string | null, postId: string | null }, _: unknown, context: GraphQLContext) => {
      if (!parent.commentId || !parent.postId) return null;

      const result = await context.container.getComments.execute({
        postId: parent.postId,
        limit: 100,
        offset: 0,
      });

      if (result.isFailure()) {
        return null;
      }

      return result.getValue().find((c) => c.id === parent.commentId) ?? null;
    },
  },

  User: {
    createdAt: (parent: { createdAt: Date | string }) => {
      if (parent.createdAt instanceof Date) {
        return parent.createdAt.toISOString();
      }
      return parent.createdAt;
    },

    wallPrivacy: (parent: { wallPrivacy?: string }) => {
      return parent.wallPrivacy ?? 'public';
    },

    canViewWall: async (parent: { id: string; wallPrivacy?: string }, _: unknown, context: GraphQLContext) => {
      const wallPrivacy = parent.wallPrivacy ?? 'public';

      if (wallPrivacy === 'public') return true;

      if (!context.userId) return false;

      if (parent.id === context.userId) return true;

      if (wallPrivacy === 'private') return false;

      if (wallPrivacy === 'followers') {
        const { UserId } = await import("../../../domain/identity");
        const userIdResult = UserId.create(parent.id);
        const currentUserIdResult = UserId.create(context.userId);

        if (userIdResult.isFailure() || currentUserIdResult.isFailure()) return false;

        return context.container.followRepository.isFollowing(
          currentUserIdResult.getValue(),
          userIdResult.getValue()
        );
      }

      return false;
    },

    followsMe: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      if (!context.userId) return false;
      if (parent.id === context.userId) return false;

      const { UserId } = await import("../../../domain/identity");
      const userIdResult = UserId.create(parent.id);
      const currentUserIdResult = UserId.create(context.userId);

      if (userIdResult.isFailure() || currentUserIdResult.isFailure()) return false;

      return context.container.followRepository.isFollowing(
        userIdResult.getValue(),
        currentUserIdResult.getValue()
      );
    },

    lastSeenAt: (parent: { lastSeenAt?: Date | string }) => {
      if (!parent.lastSeenAt) return null;
      if (parent.lastSeenAt instanceof Date) {
        return parent.lastSeenAt.toISOString();
      }
      return parent.lastSeenAt;
    },

    isOnline: (parent: { lastSeenAt?: Date | string }) => {
      if (!parent.lastSeenAt) return false;
      const lastSeen = parent.lastSeenAt instanceof Date
        ? parent.lastSeenAt
        : new Date(parent.lastSeenAt);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastSeen > fiveMinutesAgo;
    },
  },
};
