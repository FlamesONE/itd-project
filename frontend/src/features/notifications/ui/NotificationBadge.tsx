import { clsx } from 'clsx';
import { useUnreadNotifications } from '../model/useUnreadNotifications';

interface NotificationBadgeProps {
	className?: string;
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
	const { count } = useUnreadNotifications();

	if (count <= 0) return null;

	return (
		<span
			className={clsx(
				'absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-danger px-1 text-[10px] font-bold text-white ring-2 ring-[var(--nav-bg)]',
				className
			)}
		>
			{count > 99 ? '99+' : count}
		</span>
	);
}
