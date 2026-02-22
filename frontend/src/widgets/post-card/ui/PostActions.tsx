import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Post } from '@entities/post';
import { HeartIcon, CommentIcon, RepostIcon, ViewIcon } from '@shared/ui/Icons';

interface PostActionsProps {
  post: Post;
  onLike?: () => void;
  onRepost?: () => void;
  onComment?: () => void;
}

function formatCount(count: number): string {
  if (count === 0) return '';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function PostActions({ post, onLike, onRepost, onComment }: PostActionsProps) {
  return (
    <div className="flex items-center justify-between mt-3 max-w-md -ml-2">
      
      <ActionButton
        icon={<CommentIcon className="w-5 h-5" />}
        count={post.commentsCount}
        onClick={onComment}
        hoverColor="text-brand-primary"
        hoverBg="bg-brand-primary/10"
      />

      
      <ActionButton
        icon={<RepostIcon className="w-5 h-5" />}
        count={post.repostsCount}
        onClick={onRepost}
        active={post.isReposted}
        activeColor="text-brand-success"
        hoverColor="text-brand-success"
        hoverBg="bg-brand-success/10"
      />

      
      <ActionButton
        icon={<HeartIcon className="w-5 h-5" filled={post.isLiked} />}
        count={post.likesCount}
        onClick={onLike}
        active={post.isLiked}
        activeColor="text-brand-danger"
        hoverColor="text-brand-danger"
        hoverBg="bg-brand-danger/10"
      />

      
      <div className="flex items-center gap-1 text-muted">
        <div className="p-2">
          <ViewIcon className="w-5 h-5" />
        </div>
        <span className="text-sm">{formatCount(post.viewsCount)}</span>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  count: number;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  hoverColor?: string;
  hoverBg?: string;
}

function ActionButton({
  icon,
  count,
  onClick,
  active,
  activeColor = 'text-brand-primary',
  hoverColor = 'text-brand-primary',
  hoverBg = 'bg-brand-primary/10',
}: ActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      className={clsx(
        'flex items-center gap-1 group',
        'transition-colors duration-200',
        active ? activeColor : 'text-muted'
      )}
    >
      <div
        className={clsx(
          'p-2 rounded-full transition-all duration-200',
          `group-hover:${hoverBg}`,
          !active && `group-hover:${hoverColor}`
        )}
      >
        {icon}
      </div>
      <span className={clsx('text-sm transition-colors duration-200', !active && `group-hover:${hoverColor}`)}>
        {formatCount(count)}
      </span>
    </motion.button>
  );
}
