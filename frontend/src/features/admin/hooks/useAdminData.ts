import { useQuery } from '@apollo/client/react';
import {
	ADMIN_DASHBOARD_STATS,
	ADMIN_USER_ACTIVITY,
	ADMIN_TOP_USERS,
	ADMIN_HOURLY_ACTIVITY,
	ADMIN_GROWTH_METRICS,
	ADMIN_CHECK_ACCESS,
	ADMIN_SEARCH_USERS,
	ADMIN_GET_ALL_USERS,
	DashboardStats,
	UserActivityData,
	TopUser,
	HourlyActivity,
	GrowthMetric,
	AdminUserInfo,
} from '@shared/api/admin';

export function useAdminCheckAccess() {
	const { data, loading, error } = useQuery(ADMIN_CHECK_ACCESS, {
		fetchPolicy: 'network-only',
	});

	return {
		isAdmin: data?.adminCheckAccess ?? false,
		loading,
		error,
	};
}

export function useAdminDashboardStats() {
	const { data, loading, error, refetch } = useQuery(ADMIN_DASHBOARD_STATS, {
		fetchPolicy: 'network-only',
		pollInterval: 30000,
	});

	return {
		stats: data?.adminDashboardStats as DashboardStats | undefined | null,
		loading,
		error,
		refetch,
	};
}

export function useAdminUserActivity(days: number = 30) {
	const { data, loading, error, refetch } = useQuery(ADMIN_USER_ACTIVITY, {
		variables: { days },
		fetchPolicy: 'network-only',
	});

	return {
		activityData: (data?.adminUserActivity ?? []) as UserActivityData[],
		loading,
		error,
		refetch,
	};
}

export function useAdminTopUsers(limit: number = 10) {
	const { data, loading, error, refetch } = useQuery(ADMIN_TOP_USERS, {
		variables: { limit },
		fetchPolicy: 'network-only',
	});

	const topUsers = ((data as any)?.adminTopUsers ?? []).map((user: any) => ({
		...user,

	})) as TopUser[];

	return {
		topUsers,
		loading,
		error,
		refetch,
	};
}

export function useAdminHourlyActivity() {
	const { data, loading, error, refetch } = useQuery(ADMIN_HOURLY_ACTIVITY, {
		fetchPolicy: 'network-only',
	});

	return {
		hourlyActivity: ((data as any)?.adminHourlyActivity ?? []) as HourlyActivity[],
		loading,
		error,
		refetch,
	};
}

export function useAdminGrowthMetrics(days: number = 30) {
	const { data, loading, error, refetch } = useQuery(ADMIN_GROWTH_METRICS, {
		variables: { days },
		fetchPolicy: 'network-only',
	});

	return {
		growthMetrics: ((data as any)?.adminGrowthMetrics ?? []) as GrowthMetric[],
		loading,
		error,
		refetch,
	};
}

export function useAdminSearchUsers(query: string, limit: number = 20, offset: number = 0) {
	const { data, loading, error, refetch } = useQuery(ADMIN_SEARCH_USERS, {
		variables: { query, limit, offset },
		fetchPolicy: 'network-only',
		skip: !query.trim(),
	});

	return {
		users: ((data as any)?.adminSearchUsers ?? []) as AdminUserInfo[],
		loading,
		error,
		refetch,
	};
}

export function useAdminGetAllUsers(limit: number = 20, offset: number = 0) {
	const { data, loading, error, refetch } = useQuery(ADMIN_GET_ALL_USERS, {
		variables: { limit, offset },
		fetchPolicy: 'network-only',
	});

	return {
		users: ((data as any)?.adminGetAllUsers?.users ?? []) as AdminUserInfo[],
		total: (data as any)?.adminGetAllUsers?.total ?? 0,
		loading,
		error,
		refetch,
	};
}
