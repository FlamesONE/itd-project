import { describe, it, expect } from "bun:test";
import { ScoringService } from "../../src/infrastructure/services/recommendation/ScoringService";

describe("ScoringService", () => {
  const scoringService = new ScoringService();

  describe("calculatePostScore", () => {
    it("should calculate higher score for posts with more engagement", () => {
      const lowEngagement = scoringService.calculatePostScore({
        postId: "1",
        authorId: "author1",
        content: "test",
        likesCount: 5,
        commentsCount: 1,
        repostsCount: 0,
        viewsCount: 100,
        createdAt: new Date(),
      });

      const highEngagement = scoringService.calculatePostScore({
        postId: "2",
        authorId: "author1",
        content: "test",
        likesCount: 100,
        commentsCount: 50,
        repostsCount: 20,
        viewsCount: 1000,
        createdAt: new Date(),
      });

      expect(highEngagement.finalScore).toBeGreaterThan(lowEngagement.finalScore);
    });

    it("should apply freshness decay to older posts", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const freshPost = scoringService.calculatePostScore({
        postId: "1",
        authorId: "author1",
        content: "test",
        likesCount: 100,
        commentsCount: 10,
        repostsCount: 5,
        viewsCount: 500,
        createdAt: now,
      });

      const dayOldPost = scoringService.calculatePostScore({
        postId: "2",
        authorId: "author1",
        content: "test",
        likesCount: 100,
        commentsCount: 10,
        repostsCount: 5,
        viewsCount: 500,
        createdAt: yesterday,
      });

      const weekOldPost = scoringService.calculatePostScore({
        postId: "3",
        authorId: "author1",
        content: "test",
        likesCount: 100,
        commentsCount: 10,
        repostsCount: 5,
        viewsCount: 500,
        createdAt: weekAgo,
      });

      expect(freshPost.finalScore).toBeGreaterThan(dayOldPost.finalScore);
      expect(dayOldPost.finalScore).toBeGreaterThan(weekOldPost.finalScore);
    });

    it("should give viral boost for posts with many reposts", () => {
      const noReposts = scoringService.calculatePostScore({
        postId: "1",
        authorId: "author1",
        content: "test",
        likesCount: 100,
        commentsCount: 10,
        repostsCount: 0,
        viewsCount: 500,
        createdAt: new Date(),
      });

      const manyReposts = scoringService.calculatePostScore({
        postId: "2",
        authorId: "author1",
        content: "test",
        likesCount: 100,
        commentsCount: 10,
        repostsCount: 50,
        viewsCount: 500,
        createdAt: new Date(),
      });

      expect(manyReposts.viralBoost).toBeGreaterThan(noReposts.viralBoost);
      expect(manyReposts.finalScore).toBeGreaterThan(noReposts.finalScore);
    });

    it("should give quality boost for posts with high comment-to-like ratio", () => {
      const lowDiscussion = scoringService.calculatePostScore({
        postId: "1",
        authorId: "author1",
        content: "test",
        likesCount: 100,
        commentsCount: 1,
        repostsCount: 5,
        viewsCount: 500,
        createdAt: new Date(),
      });

      const highDiscussion = scoringService.calculatePostScore({
        postId: "2",
        authorId: "author1",
        content: "test",
        likesCount: 100,
        commentsCount: 100,
        repostsCount: 5,
        viewsCount: 500,
        createdAt: new Date(),
      });

      expect(highDiscussion.qualityScore).toBeGreaterThan(lowDiscussion.qualityScore);
    });
  });

  describe("calculateUserScore", () => {
    it("should calculate higher score for users with more followers", () => {
      const fewFollowers = scoringService.calculateUserScore({
        userId: "1",
        username: "user1",
        displayName: "User 1",
        emoji: "👤",
        avatarUrl: null,
        bio: null,
        followersCount: 10,
        mutualFollowersCount: 0,
      });

      const manyFollowers = scoringService.calculateUserScore({
        userId: "2",
        username: "user2",
        displayName: "User 2",
        emoji: "👤",
        avatarUrl: null,
        bio: null,
        followersCount: 10000,
        mutualFollowersCount: 0,
      });

      expect(manyFollowers.finalScore).toBeGreaterThan(fewFollowers.finalScore);
    });

    it("should boost score for users with mutual followers", () => {
      const noMutual = scoringService.calculateUserScore({
        userId: "1",
        username: "user1",
        displayName: "User 1",
        emoji: "👤",
        avatarUrl: null,
        bio: null,
        followersCount: 100,
        mutualFollowersCount: 0,
      });

      const withMutual = scoringService.calculateUserScore({
        userId: "2",
        username: "user2",
        displayName: "User 2",
        emoji: "👤",
        avatarUrl: null,
        bio: null,
        followersCount: 100,
        mutualFollowersCount: 5,
      });

      expect(withMutual.finalScore).toBeGreaterThan(noMutual.finalScore);
    });

    it("should boost score for users with high similarity", () => {
      const lowSimilarity = scoringService.calculateUserScore({
        userId: "1",
        username: "user1",
        displayName: "User 1",
        emoji: "👤",
        avatarUrl: null,
        bio: null,
        followersCount: 100,
        mutualFollowersCount: 0,
        similarityScore: 0.1,
      });

      const highSimilarity = scoringService.calculateUserScore({
        userId: "2",
        username: "user2",
        displayName: "User 2",
        emoji: "👤",
        avatarUrl: null,
        bio: null,
        followersCount: 100,
        mutualFollowersCount: 0,
        similarityScore: 0.9,
      });

      expect(highSimilarity.similarityBoost).toBeGreaterThan(lowSimilarity.similarityBoost);
      expect(highSimilarity.finalScore).toBeGreaterThan(lowSimilarity.finalScore);
    });
  });

  describe("applyDiversityFilter", () => {
    it("should limit posts per author", () => {
      const posts = [
        { authorId: "author1", postId: "1", finalScore: 100 },
        { authorId: "author1", postId: "2", finalScore: 90 },
        { authorId: "author1", postId: "3", finalScore: 80 },
        { authorId: "author2", postId: "4", finalScore: 70 },
        { authorId: "author1", postId: "5", finalScore: 60 },
      ];

      const filtered = scoringService.applyDiversityFilter(posts, 2);

      const author1Posts = filtered.filter((p) => p.authorId === "author1");
      expect(author1Posts.length).toBe(2);
      expect(filtered.length).toBe(3);
    });

    it("should keep all posts if under limit", () => {
      const posts = [
        { authorId: "author1", postId: "1", finalScore: 100 },
        { authorId: "author2", postId: "2", finalScore: 90 },
        { authorId: "author3", postId: "3", finalScore: 80 },
      ];

      const filtered = scoringService.applyDiversityFilter(posts, 2);

      expect(filtered.length).toBe(3);
    });
  });

  describe("weightedRandomSample", () => {
    it("should return all items if count >= items.length", () => {
      const items = [
        { id: "1", finalScore: 100 },
        { id: "2", finalScore: 50 },
      ];

      const sampled = scoringService.weightedRandomSample(items, 5);

      expect(sampled.length).toBe(2);
    });

    it("should return requested count of items", () => {
      const items = [
        { id: "1", finalScore: 100 },
        { id: "2", finalScore: 90 },
        { id: "3", finalScore: 80 },
        { id: "4", finalScore: 70 },
        { id: "5", finalScore: 60 },
      ];

      const sampled = scoringService.weightedRandomSample(items, 3);

      expect(sampled.length).toBe(3);
    });

    it("should favor higher scored items", () => {
      const items = [
        { id: "high", finalScore: 1000 },
        { id: "low", finalScore: 1 },
      ];

      let highCount = 0;
      for (let i = 0; i < 100; i++) {
        const sampled = scoringService.weightedRandomSample(items, 1, 1.0);
        if (sampled[0].id === "high") highCount++;
      }

      expect(highCount).toBeGreaterThan(80);
    });
  });

  describe("normalizeScores", () => {
    it("should normalize scores to 0-100 range", () => {
      const items = [
        { id: "1", finalScore: 1000 },
        { id: "2", finalScore: 500 },
        { id: "3", finalScore: 0 },
      ];

      const normalized = scoringService.normalizeScores(items);

      expect(normalized[0].finalScore).toBe(100);
      expect(normalized[1].finalScore).toBe(50);
      expect(normalized[2].finalScore).toBe(0);
    });

    it("should handle empty array", () => {
      const normalized = scoringService.normalizeScores([]);
      expect(normalized.length).toBe(0);
    });
  });
});
