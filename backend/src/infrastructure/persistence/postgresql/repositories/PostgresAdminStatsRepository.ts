import { getPool } from "../connection";
import {
	IAdminStatsRepository,
	DashboardStats,
	UserActivityData,
	TopUser,
	HourlyActivity,
	GrowthMetric,
	ContentModeration,
} from "../../../../domain/admin/repositories/IAdminStatsRepository";
import { getRedis } from "../../redis/connection";

export class PostgresAdminStatsRepository implements IAdminStatsRepository {
	private readonly ONLINE_THRESHOLD_MINUTES = 5;

	async getDashboardStats(): Promise<DashboardStats> {
		const pool = getPool();

		const [usersResult, postsResult, commentsResult, likesResult] = await Promise.all([
			pool.query("SELECT COUNT(*) as count FROM users"),
			pool.query("SELECT COUNT(*) as count FROM posts"),
			pool.query("SELECT COUNT(*) as count FROM comments"),
			pool.query("SELECT COUNT(*) as count FROM likes"),
		]);

		const totalUsers = parseInt(usersResult.rows[0].count, 10);
		const totalPosts = parseInt(postsResult.rows[0].count, 10);
		const totalComments = parseInt(commentsResult.rows[0].count, 10);
		const totalLikes = parseInt(likesResult.rows[0].count, 10);

		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);

		const [newUsersResult, newPostsResult] = await Promise.all([
			pool.query(
				"SELECT COUNT(*) as count FROM users WHERE created_at >= $1",
				[todayStart]
			),
			pool.query(
				"SELECT COUNT(*) as count FROM posts WHERE created_at >= $1",
				[todayStart]
			),
		]);

		const newUsersToday = parseInt(newUsersResult.rows[0].count, 10);
		const newPostsToday = parseInt(newPostsResult.rows[0].count, 10);

		const onlineUsers = await this.getOnlineUsersCount();

		const engagementRate = totalPosts > 0
			? ((totalLikes + totalComments) / totalPosts) * 100
			: 0;

		return {
			totalUsers,
			totalPosts,
			totalComments,
			totalLikes,
			onlineUsers,
			newUsersToday,
			newPostsToday,
			engagementRate: Math.round(engagementRate * 100) / 100,
		};
	}

	private async getOnlineUsersCount(): Promise<number> {
		try {
			const redis = getRedis();
			const keys = await redis.keys("user:online:*");
			return keys.length;
		} catch {
			return 0;
		}
	}

	async getUserActivityData(days: number): Promise<UserActivityData[]> {
		const pool = getPool();

		const result = await pool.query(
			`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days - 1} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      user_counts AS (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days - 1} days'
        GROUP BY DATE(created_at)
      ),
      post_counts AS (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM posts
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days - 1} days'
        GROUP BY DATE(created_at)
      ),
      comment_counts AS (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM comments
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days - 1} days'
        GROUP BY DATE(created_at)
      )
      SELECT
        d.date::text,
        COALESCE(u.count, 0)::int as users,
        COALESCE(p.count, 0)::int as posts,
        COALESCE(c.count, 0)::int as comments
      FROM dates d
      LEFT JOIN user_counts u ON d.date = u.date
      LEFT JOIN post_counts p ON d.date = p.date
      LEFT JOIN comment_counts c ON d.date = c.date
      ORDER BY d.date ASC
      `
		);

		return result.rows.map((row) => ({
			date: row.date,
			users: row.users,
			posts: row.posts,
			comments: row.comments,
		}));
	}

	async getTopUsers(limit: number): Promise<TopUser[]> {
		const pool = getPool();

		const result = await pool.query(
			`
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.emoji,
        u.avatar_url,
        u.followers_count,
        u.posts_count,
        (
          SELECT COUNT(*) FROM likes l
          JOIN posts p ON l.post_id = p.id
          WHERE p.author_id = u.id
        ) + (
          SELECT COUNT(*) FROM comments c
          JOIN posts p ON c.post_id = p.id
          WHERE p.author_id = u.id
        ) as engagement_score
      FROM users u
      WHERE u.posts_count > 0
      ORDER BY engagement_score DESC, u.followers_count DESC
      LIMIT $1
      `,
			[limit]
		);

		return result.rows.map((row) => ({
			id: row.id,
			username: row.username,
			displayName: row.display_name,
			emoji: row.emoji,
			avatarUrl: row.avatar_url,
			followersCount: row.followers_count,
			postsCount: row.posts_count,
			engagementScore: parseInt(row.engagement_score, 10),
		}));
	}

	async getHourlyActivity(): Promise<HourlyActivity[]> {
		const pool = getPool();

		const result = await pool.query(
			`
      WITH hours AS (
        SELECT generate_series(0, 23) as hour
      ),
      post_hours AS (
        SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) as count
        FROM posts
        WHERE created_at >= CURRENT_DATE
        GROUP BY EXTRACT(HOUR FROM created_at)
      ),
      comment_hours AS (
        SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) as count
        FROM comments
        WHERE created_at >= CURRENT_DATE
        GROUP BY EXTRACT(HOUR FROM created_at)
      ),
      like_hours AS (
        SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) as count
        FROM likes
        WHERE created_at >= CURRENT_DATE
        GROUP BY EXTRACT(HOUR FROM created_at)
      )
      SELECT
        h.hour,
        COALESCE(p.count, 0)::int as posts,
        COALESCE(c.count, 0)::int as comments,
        COALESCE(l.count, 0)::int as likes
      FROM hours h
      LEFT JOIN post_hours p ON h.hour = p.hour
      LEFT JOIN comment_hours c ON h.hour = c.hour
      LEFT JOIN like_hours l ON h.hour = l.hour
      ORDER BY h.hour ASC
      `
		);

		return result.rows.map((row) => ({
			hour: row.hour,
			posts: row.posts,
			comments: row.comments,
			likes: row.likes,
		}));
	}

	async getGrowthMetrics(days: number): Promise<GrowthMetric[]> {
		const pool = getPool();

		const result = await pool.query(
			`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days - 1} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      cumulative_users AS (
        SELECT
          d.date,
          (SELECT COUNT(*) FROM users WHERE DATE(created_at) <= d.date) as total_users
        FROM dates d
      ),
      cumulative_posts AS (
        SELECT
          d.date,
          (SELECT COUNT(*) FROM posts WHERE DATE(created_at) <= d.date) as total_posts
        FROM dates d
      ),
      daily_active AS (
        SELECT
          DATE(created_at) as date,
          COUNT(DISTINCT author_id) as dau
        FROM posts
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days - 1} days'
        GROUP BY DATE(created_at)
      )
      SELECT
        d.date::text,
        cu.total_users::int,
        cp.total_posts::int,
        COALESCE(da.dau, 0)::int as daily_active_users
      FROM dates d
      LEFT JOIN cumulative_users cu ON d.date = cu.date
      LEFT JOIN cumulative_posts cp ON d.date = cp.date
      LEFT JOIN daily_active da ON d.date = da.date
      ORDER BY d.date ASC
      `
		);

		return result.rows.map((row) => ({
			date: row.date,
			totalUsers: row.total_users,
			totalPosts: row.total_posts,
			dailyActiveUsers: row.daily_active_users,
		}));
	}

	async getContentForModeration(limit: number): Promise<ContentModeration[]> {
		const pool = getPool();

		const result = await pool.query(
			`
      SELECT
        p.id,
        'post' as type,
        p.content,
        p.author_id as author_id,
        u.username as author_username,
        0 as report_count,
        p.created_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1
      `,
			[limit]
		);

		return result.rows.map((row) => ({
			id: row.id,
			type: row.type,
			content: row.content,
			authorId: row.author_id,
			authorUsername: row.author_username,
			reportCount: row.report_count,
			createdAt: new Date(row.created_at),
		}));
	}
}
