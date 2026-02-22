import { query, queryOne } from "../connection";
import type { IClanRepository, ClanStats } from "../../../../domain/identity/repositories/IClanRepository";

export class PostgresClanRepository implements IClanRepository {
  async getClanStats(): Promise<ClanStats[]> {
    const totalUsers = await this.getTotalUsersCount();
    if (totalUsers === 0) return [];

    const rows = await query<{ emoji: string; count: string }>(
      `SELECT emoji, COUNT(*) as count
       FROM users
       WHERE emoji IS NOT NULL AND emoji != ''
       GROUP BY emoji
       ORDER BY count DESC`
    );

    return rows.map((row) => ({
      emoji: row.emoji,
      membersCount: parseInt(row.count, 10),
      percentage: Math.round((parseInt(row.count, 10) / totalUsers) * 100),
    }));
  }

  async getTopClans(limit: number): Promise<ClanStats[]> {
    const totalUsers = await this.getTotalUsersCount();
    if (totalUsers === 0) return [];

    const rows = await query<{ emoji: string; count: string }>(
      `SELECT emoji, COUNT(*) as count
       FROM users
       WHERE emoji IS NOT NULL AND emoji != ''
       GROUP BY emoji
       ORDER BY count DESC
       LIMIT $1`,
      [limit]
    );

    return rows.map((row) => ({
      emoji: row.emoji,
      membersCount: parseInt(row.count, 10),
      percentage: Math.round((parseInt(row.count, 10) / totalUsers) * 100),
    }));
  }

  async getClanByEmoji(emoji: string): Promise<ClanStats | null> {
    const totalUsers = await this.getTotalUsersCount();
    if (totalUsers === 0) return null;

    const row = await queryOne<{ emoji: string; count: string }>(
      `SELECT emoji, COUNT(*) as count
       FROM users
       WHERE emoji = $1
       GROUP BY emoji`,
      [emoji]
    );

    if (!row) return null;

    return {
      emoji: row.emoji,
      membersCount: parseInt(row.count, 10),
      percentage: Math.round((parseInt(row.count, 10) / totalUsers) * 100),
    };
  }

  async getTotalUsersCount(): Promise<number> {
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users"
    );

    return parseInt(row?.count ?? "0", 10);
  }
}
