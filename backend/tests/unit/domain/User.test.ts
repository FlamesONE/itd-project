import { describe, test, expect } from "bun:test";
import { User } from "../../../src/domain/identity/entities/User";
import { Email } from "../../../src/domain/identity/value-objects/Email";
import { Username } from "../../../src/domain/identity/value-objects/Username";
import { Password } from "../../../src/domain/identity/value-objects/Password";

describe("User Entity", () => {
  const createValidUser = () => {
    const email = Email.create("test@example.com").getValue();
    const username = Username.create("testuser").getValue();
    const password = Password.createHashed("hashedpassword123").getValue();

    return User.create({ email, username, password, displayName: "Test User" });
  };

  test("should create a valid user", () => {
    const result = createValidUser();

    expect(result.isSuccess()).toBe(true);
    const user = result.getValue();
    expect(user.email.value).toBe("test@example.com");
    expect(user.username.value).toBe("testuser");
    expect(user.displayName).toBe("Test User");
  });

  test("should use username as display name if not provided", () => {
    const email = Email.create("test@example.com").getValue();
    const username = Username.create("testuser").getValue();
    const password = Password.createHashed("hashedpassword123").getValue();

    const result = User.create({ email, username, password });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().displayName).toBe("testuser");
  });

  test("should add UserRegistered domain event on creation", () => {
    const result = createValidUser();

    expect(result.isSuccess()).toBe(true);
    const user = result.getValue();
    const events = user.domainEvents;

    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe("UserRegistered");
  });

  test("should update profile", () => {
    const result = createValidUser();
    const user = result.getValue();

    user.updateProfile({ displayName: "New Name", bio: "My bio" });

    expect(user.displayName).toBe("New Name");
    expect(user.bio).toBe("My bio");
  });

  test("should reconstitute user from stored data", () => {
    const email = Email.create("test@example.com").getValue();
    const username = Username.create("testuser").getValue();
    const password = Password.createHashed("hashedpassword123").getValue();
    const id = require("../../../src/domain/identity/value-objects/UserId").UserId.create().getValue();

    const user = User.reconstitute({
      id,
      email,
      username,
      password,
      displayName: "Test User",
      bio: "My bio",
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

    expect(user.email.value).toBe("test@example.com");
    expect(user.displayName).toBe("Test User");
    expect(user.bio).toBe("My bio");
  });
});

describe("Email Value Object", () => {
  test("should create valid email", () => {
    const result = Email.create("test@example.com");

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().value).toBe("test@example.com");
  });

  test("should reject invalid email", () => {
    const result = Email.create("invalid-email");

    expect(result.isFailure()).toBe(true);
  });

  test("should reject empty email", () => {
    const result = Email.create("");

    expect(result.isFailure()).toBe(true);
  });
});

describe("Username Value Object", () => {
  test("should create valid username", () => {
    const result = Username.create("validuser123");

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().value).toBe("validuser123");
  });

  test("should reject username that is too short", () => {
    const result = Username.create("ab");

    expect(result.isFailure()).toBe(true);
  });

  test("should reject username that is too long", () => {
    const result = Username.create("a".repeat(31));

    expect(result.isFailure()).toBe(true);
  });

  test("should reject username with invalid characters", () => {
    const result = Username.create("user@name");

    expect(result.isFailure()).toBe(true);
  });
});

describe("Password Value Object", () => {
  test("should create password with validation", () => {
    const result = Password.create("ValidPass123!");

    expect(result.isSuccess()).toBe(true);
  });

  test("should reject weak password", () => {
    const result = Password.create("weak");

    expect(result.isFailure()).toBe(true);
  });

  test("should create hashed password without validation", () => {
    const result = Password.createHashed("anyhash");

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().value).toBe("anyhash");
  });
});
