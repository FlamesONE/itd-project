import { motion } from 'framer-motion';
import clsx from 'clsx';
import { HeartIcon, CommentIcon, RepostIcon, ViewIcon } from '@shared/ui/Icons';
import { formatCount } from '@shared/lib/formatters';

interface PostActionsBarProps {
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  isLiked: boolean;
  isReposted: boolean;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  likeLoading?: boolean;
  repostLoading?: boolean;
}

export function PostActionsBar({
  likesCount,
  commentsCount,
  repostsCount,
  viewsCount,
  isLiked,
  isReposted,
  onLike,
  onComment,
  onRepost,
  likeLoading,
  repostLoading,
}: PostActionsBarProps) {
  return (
    <div className="flex items-center justify-between mb-2 mt-1">
      <div className="flex items-center gap-2">
        
        <ActionButton
          icon={<HeartIcon className="w-[17px] h-[17px]" filled={isLiked} />}
          count={likesCount}
          onClick={onLike}
          active={isLiked}
          activeClass="text-brand-danger"
          colorClass="hover:text-brand-danger"
          bgClass="hover:bg-brand-danger/10"
          disabled={likeLoading}
        />

        
        <ActionButton
          icon={<CommentIcon className="w-[17px] h-[17px]" />}
          count={commentsCount}
          onClick={onComment}
          colorClass="hover:text-brand-primary"
          bgClass="hover:bg-brand-primary/10"
        />

        
        <ActionButton
          icon={<RepostIcon className="w-[17px] h-[17px]" />}
          count={repostsCount}
          onClick={onRepost}
          active={isReposted}
          activeClass="text-brand-success"
          colorClass="hover:text-brand-success"
          bgClass="hover:bg-brand-success/10"
          disabled={repostLoading}
        />
      </div>

      
      <div className="flex items-center gap-1 text-muted text-sm">
        <ViewIcon className="w-4 h-4" />
        <span>{formatCount(viewsCount)}</span>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  count: number;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  colorClass?: string;
  bgClass?: string;
  disabled?: boolean;
}

function ActionButton({
  icon,
  count,
  onClick,
  active,
  activeClass = 'text-brand-primary',
  colorClass = 'hover:text-brand-primary',
  bgClass = 'hover:bg-brand-primary/10',
  disabled,
}: ActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-1 text-muted transition-colors',
        active && activeClass,
        !active && colorClass,
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className={clsx('p-1.5 rounded-full transition-colors', !active && bgClass)}>
        {icon}
      </span>
      {count > 0 && (
        <span className="text-xs font-medium pr-2">
          {formatCount(count)}
        </span>
      )}
    </motion.button>
  );
}
