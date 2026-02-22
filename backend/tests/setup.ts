
import { beforeAll, afterAll } from "bun:test";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-must-be-at-least-32-chars-long";
  process.env.BCRYPT_ROUNDS = "4";
});

afterAll(() => {
});
