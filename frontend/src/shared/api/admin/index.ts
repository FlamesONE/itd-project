export {
	AdminDashboardStatsQuery as ADMIN_DASHBOARD_STATS,
	AdminUserActivityQuery as ADMIN_USER_ACTIVITY,
	AdminTopUsersQuery as ADMIN_TOP_USERS,
	AdminHourlyActivityQuery as ADMIN_HOURLY_ACTIVITY,
	AdminGrowthMetricsQuery as ADMIN_GROWTH_METRICS,
	AdminCheckAccessQuery as ADMIN_CHECK_ACCESS,
	AdminSearchUsersQuery as ADMIN_SEARCH_USERS,
	AdminGetAllUsersQuery as ADMIN_GET_ALL_USERS,
} from '../graphql/admin';

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

export interface AdminUserInfo {
	id: string;
	email: string;
	username: string;
	displayName: string;
	emoji: string;
	avatarUrl: string | null;
	bio: string | null;
	verified: boolean;
	followersCount: number;
	followingCount: number;
	postsCount: number;
	createdAt: string;
}
