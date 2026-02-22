import { describe, test, expect, beforeEach, mock } from "bun:test";
import { RegisterUser } from "../../../src/application/identity/use-cases/RegisterUser";
import type { IUserRepository } from "../../../src/domain/identity/repositories/IUserRepository";
import type { IPasswordHasher } from "../../../src/application/identity/use-cases/RegisterUser";
import { User } from "../../../src/domain/identity/entities/User";
import { Email } from "../../../src/domain/identity/value-objects/Email";
import { Username } from "../../../src/domain/identity/value-objects/Username";

describe("RegisterUser Use Case", () => {
  let registerUser: RegisterUser;
  let mockUserRepository: IUserRepository;
  let mockPasswordHasher: IPasswordHasher;

  beforeEach(() => {
    mockUserRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByEmail: mock(() => Promise.resolve(null)),
      findByUsername: mock(() => Promise.resolve(null)),
      existsById: mock(() => Promise.resolve(false)),
      existsByEmail: mock(() => Promise.resolve(false)),
      existsByUsername: mock(() => Promise.resolve(false)),
      search: mock(() => Promise.resolve([])),
      findAllPaginated: mock(() => Promise.resolve({ users: [], total: 0 })),
    };

    mockPasswordHasher = {
      hash: mock(() => Promise.resolve("hashedpassword123")),
    };

    registerUser = new RegisterUser(mockUserRepository, mockPasswordHasher);
  });

  test("should register a new user successfully", async () => {
    const input = {
      email: "test@example.com",
      username: "testuser",
      password: "ValidPass123!",
      displayName: "Test User",
    };

    const result = await registerUser.execute(input);

    expect(result.isSuccess()).toBe(true);
    const output = result.getValue();
    expect(output.email).toBe("test@example.com");
    expect(output.username).toBe("testuser");
    expect(output.displayName).toBe("Test User");
  });

  test("should fail if email already exists", async () => {
    const existingEmail = Email.create("existing@example.com").getValue();
    const existingUsername = Username.create("existing").getValue();
    const existingUser = User.create({
      email: existingEmail,
      username: existingUsername,
      password: require("../../../src/domain/identity/value-objects/Password").Password.createHashed("hash").getValue(),
    }).getValue();

    mockUserRepository.findByEmail = mock(() => Promise.resolve(existingUser));

    const input = {
      email: "existing@example.com",
      username: "newuser",
      password: "ValidPass123!",
    };

    const result = await registerUser.execute(input);

    expect(result.isFailure()).toBe(true);
    expect((result.getError() as any).code).toBe("EMAIL_EXISTS");
  });

  test("should fail if username already exists", async () => {
    const existingEmail = Email.create("existing@example.com").getValue();
    const existingUsername = Username.create("existinguser").getValue();
    const existingUser = User.create({
      email: existingEmail,
      username: existingUsername,
      password: require("../../../src/domain/identity/value-objects/Password").Password.createHashed("hash").getValue(),
    }).getValue();

    mockUserRepository.findByUsername = mock(() => Promise.resolve(existingUser));

    const input = {
      email: "new@example.com",
      username: "existinguser",
      password: "ValidPass123!",
    };

    const result = await registerUser.execute(input);

    expect(result.isFailure()).toBe(true);
    expect((result.getError() as any).code).toBe("USERNAME_EXISTS");
  });

  test("should fail with invalid email", async () => {
    const input = {
      email: "invalid-email",
      username: "testuser",
      password: "ValidPass123!",
    };

    const result = await registerUser.execute(input);

    expect(result.isFailure()).toBe(true);
  });

  test("should fail with invalid username", async () => {
    const input = {
      email: "test@example.com",
      username: "ab",
      password: "ValidPass123!",
    };

    const result = await registerUser.execute(input);

    expect(result.isFailure()).toBe(true);
  });

  test("should fail with weak password", async () => {
    const input = {
      email: "test@example.com",
      username: "testuser",
      password: "weak",
    };

    const result = await registerUser.execute(input);

    expect(result.isFailure()).toBe(true);
  });
});
