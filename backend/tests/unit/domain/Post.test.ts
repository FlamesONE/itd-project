import { describe, test, expect } from "bun:test";
import { Post } from "../../../src/domain/content/entities/Post";
import { PostContent } from "../../../src/domain/content/value-objects/PostContent";
import { UserId } from "../../../src/domain/identity/value-objects/UserId";

describe("Post Entity", () => {
  const createValidPost = () => {
    const authorId = UserId.create().getValue();
    const content = PostContent.create("Hello, World!").getValue();

    return Post.create({ authorId, content });
  };

  test("should create a valid post", () => {
    const result = createValidPost();

    expect(result.isSuccess()).toBe(true);
    const post = result.getValue();
    expect(post.content.value).toBe("Hello, World!");
    expect(post.isDeleted).toBe(false);
  });

  test("should add PostCreated domain event on creation", () => {
    const result = createValidPost();

    expect(result.isSuccess()).toBe(true);
    const post = result.getValue();
    const events = post.domainEvents;

    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe("PostCreated");
  });

  test("should delete post", () => {
    const result = createValidPost();
    const post = result.getValue();

    const deleteResult = post.delete();

    expect(deleteResult.isSuccess()).toBe(true);
    expect(post.isDeleted).toBe(true);
  });

  test("should not delete already deleted post", () => {
    const result = createValidPost();
    const post = result.getValue();

    post.delete();
    const secondDeleteResult = post.delete();

    expect(secondDeleteResult.isFailure()).toBe(true);
  });

  test("should update content", () => {
    const result = createValidPost();
    const post = result.getValue();
    const newContent = PostContent.create("Updated content").getValue();

    const updateResult = post.updateContent(newContent);

    expect(updateResult.isSuccess()).toBe(true);
    expect(post.content.value).toBe("Updated content");
  });

  test("should not update content of deleted post", () => {
    const result = createValidPost();
    const post = result.getValue();

    post.delete();
    const newContent = PostContent.create("Updated content").getValue();
    const updateResult = post.updateContent(newContent);

    expect(updateResult.isFailure()).toBe(true);
  });
});

describe("PostContent Value Object", () => {
  test("should create valid content", () => {
    const result = PostContent.create("Hello, World!");

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().value).toBe("Hello, World!");
  });

  test("should reject empty content", () => {
    const result = PostContent.create("");

    expect(result.isFailure()).toBe(true);
  });

  test("should reject content exceeding 280 characters", () => {
    const result = PostContent.create("a".repeat(281));

    expect(result.isFailure()).toBe(true);
  });

  test("should trim whitespace", () => {
    const result = PostContent.create("  Hello, World!  ");

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().value).toBe("Hello, World!");
  });
});
