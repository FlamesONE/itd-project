export interface DashboardStats {
	totalUsers: number;
	totalPosts: number;
	totalComments: number;
	totalLikes: number;
	onlineUsers: number;
	newUsersToday: number;
	newPostsToday: number;
	engagementRate: number;
}

export interface UserActivityData {
	date: string;
	users: number;
	posts: number;
	comments: number;
}

export interface TopUser {
	id: string;
	username: string;
	displayName: string;
	emoji: string;
	avatarUrl: string | null;
	followersCount: number;
	postsCount: number;
	engagementScore: number;
}

export interface ContentModeration {
	id: string;
	type: 'post' | 'comment';
	content: string;
	authorId: string;
	authorUsername: string;
	reportCount: number;
	createdAt: Date;
}

export interface HourlyActivity {
	hour: number;
	posts: number;
	comments: number;
	likes: number;
}

export interface GrowthMetric {
	date: string;
	totalUsers: number;
	totalPosts: number;
	dailyActiveUsers: number;
}

export interface IAdminStatsRepository {
	getDashboardStats(): Promise<DashboardStats>;
	getUserActivityData(days: number): Promise<UserActivityData[]>;
	getTopUsers(limit: number): Promise<TopUser[]>;
	getHourlyActivity(): Promise<HourlyActivity[]>;
	getGrowthMetrics(days: number): Promise<GrowthMetric[]>;
	getContentForModeration(limit: number): Promise<ContentModeration[]>;
}
