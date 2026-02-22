import { describe, test, expect } from "bun:test";
import { Follow } from "../../../src/domain/social/entities/Follow";
import { UserId } from "../../../src/domain/identity/value-objects/UserId";

describe("Follow Entity", () => {
  test("should create a valid follow", () => {
    const followerId = UserId.create().getValue();
    const followingId = UserId.create().getValue();

    const result = Follow.create({
      followerId,
      followingId,
    });

    expect(result.isSuccess()).toBe(true);
    const follow = result.getValue();
    expect(follow.followerId.value).toBe(followerId.value);
    expect(follow.followingId.value).toBe(followingId.value);
  });

  test("should not allow following yourself", () => {
    const userId = UserId.create().getValue();

    const result = Follow.create({
      followerId: userId,
      followingId: userId,
    });

    expect(result.isFailure()).toBe(true);
    expect((result.getError() as any).code).toBe("CANNOT_FOLLOW_SELF");
  });

  test("should reconstitute from stored data", () => {
    const followerId = UserId.create().getValue();
    const followingId = UserId.create().getValue();
    const { FollowId } = require("../../../src/domain/social/value-objects/FollowId");
    const id = FollowId.create().getValue();
    const createdAt = new Date();

    const follow = Follow.reconstitute({
      id,
      followerId,
      followingId,
      createdAt,
    });

    expect(follow.id.value).toBe(id.value);
    expect(follow.followerId.value).toBe(followerId.value);
    expect(follow.followingId.value).toBe(followingId.value);
    expect(follow.createdAt).toBe(createdAt);
  });
});
