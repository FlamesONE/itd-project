import { query, queryOne, execute } from "../connection";
import { User, UserId, Email, Username, Password, WallPrivacy } from "../../../../domain/identity";
import type { IUserRepository } from "../../../../domain/identity";

interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  display_name: string;
  bio: string | null;
  emoji: string;
  avatar_url: string | null;
  cover_url: string | null;
  verified: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  wall_privacy: WallPrivacy;
  last_seen_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class PostgresUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    const existingUser = await this.findById(user.id);

    if (existingUser) {
      await execute(
        `UPDATE users
         SET email = $1, username = $2, password_hash = $3, display_name = $4, bio = $5,
             emoji = $6, avatar_url = $7, cover_url = $8, wall_privacy = $9, updated_at = $10
         WHERE id = $11`,
        [
          user.email.value,
          user.username.value,
          user.password.value,
          user.displayName,
          user.bio,
          user.emoji,
          user.avatarUrl,
          user.coverUrl,
          user.wallPrivacy,
          new Date(),
          user.id.value,
        ]
      );
    } else {
      await execute(
        `INSERT INTO users (id, email, username, password_hash, display_name, bio, emoji, avatar_url, cover_url, wall_privacy, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          user.id.value,
          user.email.value,
          user.username.value,
          user.password.value,
          user.displayName,
          user.bio,
          user.emoji,
          user.avatarUrl,
          user.coverUrl,
          user.wallPrivacy,
          user.createdAt,
          user.updatedAt,
        ]
      );
    }
  }

  async findById(id: UserId): Promise<User | null> {
    const row = await queryOne<UserRow>(
      "SELECT * FROM users WHERE id = $1",
      [id.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await queryOne<UserRow>(
      "SELECT * FROM users WHERE email = $1",
      [email.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async findByUsername(username: Username): Promise<User | null> {
    const row = await queryOne<UserRow>(
      "SELECT * FROM users WHERE username = $1",
      [username.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async existsById(id: UserId): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1) as exists",
      [id.value]
    );

    return row?.exists ?? false;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists",
      [email.value]
    );

    return row?.exists ?? false;
  }

  async existsByUsername(username: Username): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) as exists",
      [username.value]
    );

    return row?.exists ?? false;
  }

  async search(searchQuery: string, limit = 20, offset = 0): Promise<User[]> {
    const rows = await query<UserRow>(
      `SELECT * FROM users
       WHERE username ILIKE $1
          OR display_name ILIKE $1
          OR bio ILIKE $1
       ORDER BY followers_count DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${searchQuery}%`, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async findAllPaginated(limit: number, offset: number): Promise<{ users: User[]; total: number }> {
    const countResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users"
    );
    const total = parseInt(countResult?.count || "0", 10);

    const rows = await query<UserRow>(
      `SELECT * FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      users: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  private toDomain(row: UserRow): User {
    return User.reconstitute({
      id: UserId.create(row.id).getValue(),
      email: Email.create(row.email).getValue(),
      username: Username.create(row.username).getValue(),
      password: Password.createHashed(row.password_hash).getValue(),
      displayName: row.display_name,
      bio: row.bio,
      emoji: row.emoji || "😀",
      avatarUrl: row.avatar_url,
      coverUrl: row.cover_url,
      verified: row.verified,
      followersCount: row.followers_count,
      followingCount: row.following_count,
      postsCount: row.posts_count,
      wallPrivacy: row.wall_privacy ?? 'public',
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async updateLastSeen(userId: string): Promise<void> {
    await execute(
      "UPDATE users SET last_seen_at = NOW() WHERE id = $1",
      [userId]
    );
  }
}
