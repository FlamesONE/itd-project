import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { UNREAD_NOTIFICATIONS_COUNT_QUERY } from '@shared/api/graphql/notifications';
import { sseClient } from '@shared/api/sse/client';

export function useUnreadNotifications() {
	const { data, loading, refetch, updateQuery } = useQuery(UNREAD_NOTIFICATIONS_COUNT_QUERY, {
		fetchPolicy: 'cache-and-network',
	});

	const count = data?.unreadNotificationsCount ?? 0;

	useEffect(() => {

		const handleCounterUpdate = (payload: { unreadCount: number }) => {
			updateQuery((prev) => ({
				...prev,
				unreadNotificationsCount: payload.unreadCount,
			}));
		};

		sseClient.on('onCounterUpdate', handleCounterUpdate);

		return () => {
			sseClient.off('onCounterUpdate');
		};
	}, [updateQuery]);

	return {
		count,
		loading,
		refetch,
	};
}
