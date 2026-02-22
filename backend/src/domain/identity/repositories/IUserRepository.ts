import type { User } from "../entities/User";
import type { UserId } from "../value-objects/UserId";
import type { Email } from "../value-objects/Email";
import type { Username } from "../value-objects/Username";

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByUsername(username: Username): Promise<User | null>;
  save(user: User): Promise<void>;
  existsById(id: UserId): Promise<boolean>;
  existsByEmail(email: Email): Promise<boolean>;
  existsByUsername(username: Username): Promise<boolean>;
  search(query: string, limit?: number, offset?: number): Promise<User[]>;
  findAllPaginated(limit: number, offset: number): Promise<{ users: User[]; total: number }>;
  updateLastSeen(userId: string): Promise<void>;
}
