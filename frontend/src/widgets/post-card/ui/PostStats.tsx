import { motion } from 'framer-motion';
import clsx from 'clsx';
import { HeartIcon, CommentIcon, RepostIcon, ViewIcon } from '@shared/ui/Icons';
import { formatCount } from '@shared/lib/formatters';

interface PostStatsProps {
	likesCount: number;
	commentsCount: number;
	repostsCount: number;
	viewsCount: number;
	isLiked?: boolean;
	isReposted?: boolean;
	onLikeClick?: () => void;
	onCommentClick?: () => void;
	onRepostClick?: () => void;
	className?: string;
}

export function PostStats({
	likesCount,
	commentsCount,
	repostsCount,
	viewsCount,
	isLiked = false,
	isReposted = false,
	onLikeClick,
	onCommentClick,
	onRepostClick,
	className,
}: PostStatsProps) {
	return (
		<div className={clsx('flex items-center gap-6', className)}>
			
			<StatItem
				icon={<HeartIcon className="w-[17px] h-[17px]" filled={isLiked} />}
				count={likesCount}
				isActive={isLiked}
				activeColor="text-brand-danger"
				hoverColor="hover:text-brand-danger"
				onClick={onLikeClick}
			/>

			
			<StatItem
				icon={<CommentIcon className="w-[17px] h-[17px]" />}
				count={commentsCount}
				hoverColor="hover:text-brand-primary"
				onClick={onCommentClick}
			/>

			
			<StatItem
				icon={<RepostIcon className="w-[17px] h-[17px]" />}
				count={repostsCount}
				isActive={isReposted}
				activeColor="text-brand-success"
				hoverColor="hover:text-brand-success"
				onClick={onRepostClick}
			/>

			
			<StatItem
				icon={<ViewIcon className="w-[17px] h-[17px]" />}
				count={viewsCount}
				hoverColor="hover:text-muted"
				interactive={false}
			/>
		</div>
	);
}

interface StatItemProps {
	icon: React.ReactNode;
	count: number;
	isActive?: boolean;
	activeColor?: string;
	hoverColor?: string;
	onClick?: () => void;
	interactive?: boolean;
}

function StatItem({
	icon,
	count,
	isActive = false,
	activeColor = 'text-brand-primary',
	hoverColor = 'hover:text-brand-primary',
	onClick,
	interactive = true,
}: StatItemProps) {
	const content = (
		<div
			className={clsx(
				'flex items-center gap-1.5 text-muted transition-colors duration-200',
				isActive && activeColor,
				interactive && !isActive && hoverColor,
				interactive && 'cursor-pointer'
			)}
		>
			{icon}
			<span className="text-sm font-medium tabular-nums">
				{formatCount(count)}
			</span>
		</div>
	);

	if (!interactive || !onClick) {
		return content;
	}

	return (
		<motion.button
			whileTap={{ scale: 0.95 }}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onClick();
			}}
			className="focus:outline-none"
		>
			{content}
		</motion.button>
	);
}
