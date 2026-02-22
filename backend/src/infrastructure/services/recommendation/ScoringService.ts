export interface ScoredPost {
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  createdAt: Date;
  baseScore: number;
  freshnessScore: number;
  viralBoost: number;
  qualityScore: number;
  finalScore: number;
}

export interface ScoredUser {
  userId: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  mutualFollowersCount: number;
  baseScore: number;
  similarityBoost: number;
  activityBoost: number;
  finalScore: number;
}

export interface PostMetrics {
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  createdAt: Date;
}

export interface UserMetrics {
  userId: string;
  username: string;
  displayName: string;
  emoji: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  mutualFollowersCount: number;
  similarityScore?: number;
  recentActivityCount?: number;
}

export class ScoringService {
  calculatePostScore(post: PostMetrics): ScoredPost {

    const baseScore =
      post.likesCount +
      post.commentsCount * 2 +
      post.repostsCount * 3 +
      post.viewsCount * 0.1;

    const hoursSinceCreation =
      (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
    const freshnessScore = 1 / Math.pow(hoursSinceCreation + 2, 1.2);

    const viralBoost = Math.log10(Math.max(post.repostsCount, 1) + 1) * 0.5;

    const quality = Math.min(
      post.commentsCount / Math.max(post.likesCount, 1),
      2
    );
    const qualityScore = 1 + quality * 0.2;

    const finalScore = baseScore * freshnessScore * (1 + viralBoost) * qualityScore;

    return {
      postId: post.postId,
      authorId: post.authorId,
      content: post.content,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      repostsCount: post.repostsCount,
      viewsCount: post.viewsCount,
      createdAt: post.createdAt,
      baseScore,
      freshnessScore,
      viralBoost,
      qualityScore,
      finalScore,
    };
  }

  calculateUserScore(user: UserMetrics): ScoredUser {

    const baseScore = Math.log10(user.followersCount + 10) * 20;

    const similarityBoost = (user.similarityScore ?? 0) * 50;

    const activityBoost = Math.min((user.recentActivityCount ?? 0) * 2, 20);

    const mutualBoost = user.mutualFollowersCount * 10;

    const finalScore = baseScore + similarityBoost + activityBoost + mutualBoost;

    return {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      emoji: user.emoji,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      followersCount: user.followersCount,
      mutualFollowersCount: user.mutualFollowersCount,
      baseScore,
      similarityBoost,
      activityBoost,
      finalScore,
    };
  }

  applyDiversityFilter<T extends { authorId: string }>(
    recommendations: T[],
    maxPostsPerAuthor = 2
  ): T[] {
    const authorCounts = new Map<string, number>();

    return recommendations.filter((rec) => {
      const count = authorCounts.get(rec.authorId) || 0;
      if (count < maxPostsPerAuthor) {
        authorCounts.set(rec.authorId, count + 1);
        return true;
      }
      return false;
    });
  }

  weightedRandomSample<T extends { finalScore: number }>(
    items: T[],
    count: number,
    temperature = 1.0
  ): T[] {
    if (items.length <= count) {
      return [...items];
    }

    const adjustedScores = items.map((item) => ({
      item,
      weight: Math.pow(Math.max(item.finalScore, 0.001), 1 / temperature),
    }));

    const totalWeight = adjustedScores.reduce((sum, s) => sum + s.weight, 0);

    const selected: T[] = [];
    const remaining = [...adjustedScores];

    while (selected.length < count && remaining.length > 0) {
      const rand = Math.random() * remaining.reduce((sum, s) => sum + s.weight, 0);
      let cumulative = 0;

      for (let i = 0; i < remaining.length; i++) {
        cumulative += remaining[i].weight;
        if (rand <= cumulative) {
          selected.push(remaining[i].item);
          remaining.splice(i, 1);
          break;
        }
      }
    }

    return selected;
  }

  processPostRecommendations(
    posts: PostMetrics[],
    options: {
      limit?: number;
      maxPostsPerAuthor?: number;
      temperature?: number;
      useWeightedSampling?: boolean;
    } = {}
  ): ScoredPost[] {
    const {
      limit = 20,
      maxPostsPerAuthor = 2,
      temperature = 1.0,
      useWeightedSampling = true,
    } = options;

    const scoredPosts = posts.map((p) => this.calculatePostScore(p));

    scoredPosts.sort((a, b) => b.finalScore - a.finalScore);

    const diversePosts = this.applyDiversityFilter(scoredPosts, maxPostsPerAuthor);

    if (useWeightedSampling && diversePosts.length > limit) {
      return this.weightedRandomSample(diversePosts, limit, temperature);
    }

    return diversePosts.slice(0, limit);
  }

  processUserRecommendations(
    users: UserMetrics[],
    options: {
      limit?: number;
      temperature?: number;
      useWeightedSampling?: boolean;
    } = {}
  ): ScoredUser[] {
    const {
      limit = 10,
      temperature = 1.2,
      useWeightedSampling = true,
    } = options;

    const scoredUsers = users.map((u) => this.calculateUserScore(u));

    scoredUsers.sort((a, b) => b.finalScore - a.finalScore);

    if (useWeightedSampling && scoredUsers.length > limit) {
      return this.weightedRandomSample(scoredUsers, limit, temperature);
    }

    return scoredUsers.slice(0, limit);
  }

  normalizeScores<T extends { finalScore: number }>(items: T[]): T[] {
    if (items.length === 0) return items;

    const maxScore = Math.max(...items.map((i) => i.finalScore));
    const minScore = Math.min(...items.map((i) => i.finalScore));
    const range = maxScore - minScore || 1;

    return items.map((item) => ({
      ...item,
      finalScore: ((item.finalScore - minScore) / range) * 100,
    }));
  }
}
