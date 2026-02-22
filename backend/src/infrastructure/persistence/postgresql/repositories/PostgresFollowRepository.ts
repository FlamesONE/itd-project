import { query, queryOne, execute } from "../connection";
import { Follow, FollowId } from "../../../../domain/social";
import type { IFollowRepository, SimilarUserByFollows } from "../../../../domain/social";
import { UserId } from "../../../../domain/identity";

interface FollowRow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: Date;
}

export class PostgresFollowRepository implements IFollowRepository {
  async save(follow: Follow): Promise<void> {
    await execute(
      `INSERT INTO follows (id, follower_id, following_id, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [
        follow.id.value,
        follow.followerId.value,
        follow.followingId.value,
        follow.createdAt,
      ]
    );
  }

  async delete(followerId: UserId, followingId: UserId): Promise<void> {
    await execute(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId.value, followingId.value]
    );
  }

  async findByFollowerAndFollowing(
    followerId: UserId,
    followingId: UserId
  ): Promise<Follow | null> {
    const row = await queryOne<FollowRow>(
      "SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId.value, followingId.value]
    );

    if (!row) return null;

    return this.toDomain(row);
  }

  async getFollowers(
    userId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Follow[]> {
    const rows = await query<FollowRow>(
      `SELECT * FROM follows
       WHERE following_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async getFollowing(
    userId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Follow[]> {
    const rows = await query<FollowRow>(
      `SELECT * FROM follows
       WHERE follower_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId.value, limit, offset]
    );

    return rows.map((row) => this.toDomain(row));
  }

  async countFollowers(userId: UserId): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM follows WHERE following_id = $1",
      [userId.value]
    );

    return parseInt(row?.count ?? "0", 10);
  }

  async countFollowing(userId: UserId): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM follows WHERE follower_id = $1",
      [userId.value]
    );

    return parseInt(row?.count ?? "0", 10);
  }

  async isFollowing(followerId: UserId, followingId: UserId): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2) as exists",
      [followerId.value, followingId.value]
    );

    return row?.exists ?? false;
  }

  async getFollowingIds(userId: UserId): Promise<UserId[]> {
    const rows = await query<{ following_id: string }>(
      "SELECT following_id FROM follows WHERE follower_id = $1",
      [userId.value]
    );

    return rows.map((row) => UserId.create(row.following_id).getValue());
  }

  async getSimilarUsersByFollows(
    userId: UserId,
    limit = 20
  ): Promise<SimilarUserByFollows[]> {
    const sql = `
      WITH user_follows AS (
        SELECT following_id FROM follows WHERE follower_id = $1
      ),
      similar_users AS (
        SELECT
          f.follower_id AS user_id,
          COUNT(*) AS common_follows,
          (SELECT COUNT(*) FROM follows WHERE follower_id = f.follower_id) AS total_follows
        FROM follows f
        WHERE f.following_id IN (SELECT following_id FROM user_follows)
          AND f.follower_id != $1
          AND f.follower_id NOT IN (SELECT following_id FROM user_follows)
        GROUP BY f.follower_id
        HAVING COUNT(*) >= 2
      )
      SELECT
        user_id,
        common_follows,
        total_follows,
        common_follows::float / GREATEST(
          total_follows + (SELECT COUNT(*) FROM user_follows) - common_follows,
          1
        ) AS similarity_score
      FROM similar_users
      ORDER BY similarity_score DESC
      LIMIT $2
    `;

    const rows = await query<{
      user_id: string;
      common_follows: string;
      total_follows: string;
      similarity_score: number;
    }>(sql, [userId.value, limit]);

    return rows.map((row) => ({
      userId: row.user_id,
      commonFollows: parseInt(row.common_follows, 10),
      totalFollows: parseInt(row.total_follows, 10),
      similarityScore: row.similarity_score,
    }));
  }

  private toDomain(row: FollowRow): Follow {
    return Follow.reconstitute({
      id: FollowId.create(row.id).getValue(),
      followerId: UserId.create(row.follower_id).getValue(),
      followingId: UserId.create(row.following_id).getValue(),
      createdAt: row.created_at,
    });
  }
}
