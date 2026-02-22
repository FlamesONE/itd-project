import { describe, test, expect } from "bun:test";
import { Like } from "../../../src/domain/social/entities/Like";
import { UserId } from "../../../src/domain/identity/value-objects/UserId";
import { PostId } from "../../../src/domain/content/value-objects/PostId";

describe("Like Entity", () => {
  test("should create a valid like", () => {
    const userId = UserId.create().getValue();
    const postId = PostId.create().getValue();

    const result = Like.create({
      userId,
      postId,
    });

    expect(result.isSuccess()).toBe(true);
    const like = result.getValue();
    expect(like.userId.value).toBe(userId.value);
    expect(like.postId.value).toBe(postId.value);
  });

  test("should reconstitute from stored data", () => {
    const userId = UserId.create().getValue();
    const postId = PostId.create().getValue();
    const { LikeId } = require("../../../src/domain/social/value-objects/LikeId");
    const id = LikeId.create().getValue();
    const createdAt = new Date();

    const like = Like.reconstitute({
      id,
      userId,
      postId,
      createdAt,
    });

    expect(like.id.value).toBe(id.value);
    expect(like.userId.value).toBe(userId.value);
    expect(like.postId.value).toBe(postId.value);
    expect(like.createdAt).toBe(createdAt);
  });
});
