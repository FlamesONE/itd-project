import { useEffect } from 'react';
import { toast } from 'sonner';
import { sseClient } from '@shared/api/sse/client';
import { Avatar } from '@shared/ui';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, UserPlus, Zap } from 'lucide-react';

interface NotificationPayload {
	id: string;
	actorId: string;
	actorUsername: string;
	actorDisplayName: string;
	actorAvatarUrl: string | null;
	actorEmoji: string | null;
	type: string;
	postId: string | null;
	commentId: string | null;
	message: string;
	createdAt: string;
}

export function NotificationToast() {
	const navigate = useNavigate();

	useEffect(() => {
		const handleNotification = (data: unknown) => {
			const notification = data as NotificationPayload;

			toast.custom((t) => (
				<div
					className={clsx(
						'group flex items-start gap-3 w-full max-w-[340px] rounded-2xl p-3',
						'bg-[#171a1e]/90 backdrop-blur-xl border border-[#2a2f36]',
						'shadow-[0_8px_30px_rgb(0,0,0,0.2)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]',
						'hover:bg-[#1e2227]/90 hover:border-[#1d9bf0]/20 cursor-pointer transition-all duration-300'
					)}
					onClick={() => {
						if (notification.type === 'follow') {
							navigate(`/${notification.actorUsername}`);
						} else if (notification.postId) {
							navigate(`/post/${notification.postId}`);
						} else {
							navigate('/notifications');
						}
						toast.dismiss(t);
					}}
				>
					
					<div className="relative flex-shrink-0 mt-0.5">
						<Avatar
							src={null}
							alt={notification.actorDisplayName}
							emoji={notification.actorEmoji || '👤'}
							size="md"
							className="ring-2 ring-transparent group-hover:ring-[#1d9bf0]/20 transition-all"
						/>
						<div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#171a1e] border-[1.5px] border-[#171a1e] shadow-sm">
							<NotificationIcon type={notification.type} className="w-3 h-3" />
						</div>
					</div>

					
					<div className="flex-1 min-w-0 flex flex-col justify-center">
						<div className="flex items-center justify-between gap-2">
							<p className="text-sm font-bold text-[#e8ebee] truncate leading-none">
								{notification.actorDisplayName}
							</p>
							<span className="text-[10px] font-medium text-[#1d9bf0] uppercase tracking-wide bg-[#1d9bf0]/10 px-1.5 py-0.5 rounded-full">New</span>
						</div>

						<p className="text-[13px] text-[#98a0aa] leading-snug mt-1.5 line-clamp-2">
							{notification.message}
						</p>
					</div>
				</div>
			), { duration: 5000 });
		};

		sseClient.on('onNotification', handleNotification);

		return () => {
			sseClient.off('onNotification');
		};
	}, [navigate]);

	return null;
}

function NotificationIcon({ type, className }: { type: string; className?: string }) {
	switch (type) {
		case 'like':
			return <Heart className={clsx("text-brand-danger fill-brand-danger", className)} />;
		case 'repost':
			return <Repeat2 className={clsx("text-brand-success", className)} />;
		case 'follow':
			return <UserPlus className={clsx("text-brand-primary", className)} />;
		case 'comment':
		case 'reply':
		case 'mention':
			return <MessageCircle className={clsx("text-brand-accent fill-brand-accent", className)} />;
		default:
			return <Zap className={clsx("text-muted", className)} />;
	}
}
