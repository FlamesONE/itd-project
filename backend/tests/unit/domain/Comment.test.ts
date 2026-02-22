import { describe, test, expect } from "bun:test";
import { Comment } from "../../../src/domain/content/entities/Comment";
import { PostId } from "../../../src/domain/content/value-objects/PostId";
import { UserId } from "../../../src/domain/identity/value-objects/UserId";

describe("Comment Entity", () => {
  const createValidComment = () => {
    const postId = PostId.create().getValue();
    const authorId = UserId.create().getValue();

    return Comment.create({
      postId,
      authorId,
      content: "This is a test comment",
    });
  };

  test("should create a valid comment", () => {
    const result = createValidComment();

    expect(result.isSuccess()).toBe(true);
    const comment = result.getValue();
    expect(comment.content).toBe("This is a test comment");
    expect(comment.isDeleted).toBe(false);
  });

  test("should reject empty content", () => {
    const postId = PostId.create().getValue();
    const authorId = UserId.create().getValue();

    const result = Comment.create({
      postId,
      authorId,
      content: "",
    });

    expect(result.isFailure()).toBe(true);
  });

  test("should reject content exceeding 500 characters", () => {
    const postId = PostId.create().getValue();
    const authorId = UserId.create().getValue();

    const result = Comment.create({
      postId,
      authorId,
      content: "a".repeat(501),
    });

    expect(result.isFailure()).toBe(true);
  });

  test("should delete comment", () => {
    const result = createValidComment();
    const comment = result.getValue();

    const deleteResult = comment.delete();

    expect(deleteResult.isSuccess()).toBe(true);
    expect(comment.isDeleted).toBe(true);
  });

  test("should not delete already deleted comment", () => {
    const result = createValidComment();
    const comment = result.getValue();

    comment.delete();
    const secondDeleteResult = comment.delete();

    expect(secondDeleteResult.isFailure()).toBe(true);
  });

  test("should trim whitespace from content", () => {
    const postId = PostId.create().getValue();
    const authorId = UserId.create().getValue();

    const result = Comment.create({
      postId,
      authorId,
      content: "  Test comment  ",
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().content).toBe("Test comment");
  });
});
