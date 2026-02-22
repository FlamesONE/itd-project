import { describe, test, expect, beforeEach, mock } from "bun:test";
import { CreatePost } from "../../../src/application/content/use-cases/CreatePost";
import type { IPostRepository } from "../../../src/domain/content/repositories/IPostRepository";
import type { IUserRepository } from "../../../src/domain/identity/repositories/IUserRepository";
import type { INotificationRepository } from "../../../src/domain/notification/repositories/INotificationRepository";
import { User } from "../../../src/domain/identity/entities/User";
import { Email } from "../../../src/domain/identity/value-objects/Email";
import { Username } from "../../../src/domain/identity/value-objects/Username";
import { Password } from "../../../src/domain/identity/value-objects/Password";
import { UserId } from "../../../src/domain/identity/value-objects/UserId";

describe("CreatePost Use Case", () => {
  let createPost: CreatePost;
  let mockPostRepository: IPostRepository;
  let mockUserRepository: IUserRepository;
  let mockNotificationRepository: INotificationRepository;
  let testUser: User;
  let testUserId: UserId;

  beforeEach(() => {
    testUserId = UserId.create().getValue();
    const email = Email.create("test@example.com").getValue();
    const username = Username.create("testuser").getValue();
    const password = Password.createHashed("hashedpassword").getValue();

    testUser = User.reconstitute({
      id: testUserId,
      email,
      username,
      password,
      displayName: "Test User",
      bio: null,
      emoji: "😀",
      avatarUrl: null,
      coverUrl: null,
      verified: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPostRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByAuthorId: mock(() => Promise.resolve([])),
      findByWallOwnerId: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      existsById: mock(() => Promise.resolve(false)),
      getFeed: mock(() => Promise.resolve([])),
      getTrending: mock(() => Promise.resolve([])),
      updateEngagementScores: mock(() => Promise.resolve()),
      incrementViewCount: mock(() => Promise.resolve(1)),
      search: mock(() => Promise.resolve([])),
      pinPost: mock(() => Promise.resolve()),
      unpinPost: mock(() => Promise.resolve()),
      findPinnedPost: mock(() => Promise.resolve(null)),
    };

    mockUserRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock((id: UserId) => {
        if (id.value === testUserId.value) {
          return Promise.resolve(testUser);
        }
        return Promise.resolve(null);
      }),
      findByEmail: mock(() => Promise.resolve(null)),
      findByUsername: mock(() => Promise.resolve(null)),
      existsById: mock(() => Promise.resolve(true)),
      existsByEmail: mock(() => Promise.resolve(false)),
      existsByUsername: mock(() => Promise.resolve(false)),
      search: mock(() => Promise.resolve([])),
      findAllPaginated: mock(() => Promise.resolve({ users: [], total: 0 })),
    };

    mockNotificationRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve([])),
      findUnreadByUserId: mock(() => Promise.resolve([])),
      countUnreadByUserId: mock(() => Promise.resolve(0)),
      markAsRead: mock(() => Promise.resolve()),
      markAllAsRead: mock(() => Promise.resolve()),
      markPostNotificationsAsRead: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
    };

    createPost = new CreatePost(mockPostRepository, mockUserRepository, mockNotificationRepository);
  });

  test("should create a post successfully", async () => {
    const input = {
      authorId: testUserId.value,
      content: "Hello, World!",
    };

    const result = await createPost.execute(input);

    expect(result.isSuccess()).toBe(true);
    const post = result.getValue();
    expect(post.content).toBe("Hello, World!");
    expect(post.authorId).toBe(testUserId.value);
  });

  test("should fail if author does not exist", async () => {
    const nonExistentId = UserId.create().getValue();

    const input = {
      authorId: nonExistentId.value,
      content: "Hello, World!",
    };

    const result = await createPost.execute(input);

    expect(result.isFailure()).toBe(true);
    expect((result.getError() as any).code).toBe("AUTHOR_NOT_FOUND");
  });

  test("should fail with empty content", async () => {
    const input = {
      authorId: testUserId.value,
      content: "",
    };

    const result = await createPost.execute(input);

    expect(result.isFailure()).toBe(true);
  });

  test("should fail with content exceeding 280 characters", async () => {
    const input = {
      authorId: testUserId.value,
      content: "a".repeat(281),
    };

    const result = await createPost.execute(input);

    expect(result.isFailure()).toBe(true);
  });

  test("should fail with invalid author ID", async () => {
    const input = {
      authorId: "invalid-uuid",
      content: "Hello, World!",
    };

    const result = await createPost.execute(input);

    expect(result.isFailure()).toBe(true);
  });
});
