import { NavLink } from 'react-router-dom';
import { Avatar, VerifiedBadge } from '@shared/ui';
import { formatTimeAgo, parseContent } from '@shared/lib';
import type { Post } from '@entities/post';

interface EmbeddedPostProps {
  post: Post;
  onClick?: () => void;
}

export function EmbeddedPost({ post, onClick }: EmbeddedPostProps) {
  const hasMedia = post.media && post.media.length > 0;
  const firstMedia = hasMedia ? post.media[0] : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="border border-theme rounded-2xl overflow-hidden cursor-pointer hover:bg-surface-hover/30 transition-colors"
    >
      
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <NavLink
          to={`/${post.author.username}`}
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            emoji={post.author.emoji}
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            size="xs"
          />
        </NavLink>

        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <NavLink
            to={`/${post.author.username}`}
            className="font-semibold text-theme text-[13px] hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {post.author.displayName}
          </NavLink>
          {post.author.verified && (
            <VerifiedBadge className="w-3 h-3 text-brand-primary flex-shrink-0" />
          )}
          <span className="text-muted text-[12px]">@{post.author.username}</span>
          <span className="text-muted text-[12px]">·</span>
          <span className="text-muted text-[12px] truncate">
            {formatTimeAgo(post.createdAt)}
          </span>
        </div>
      </div>

      
      {post.content && (
        <div className="px-3 pb-2">
          <p className="text-theme text-[14px] leading-relaxed whitespace-pre-wrap break-words line-clamp-3">
            {parseContent(post.content)}
          </p>
        </div>
      )}

      
      {firstMedia && (
        <div className="relative">
          <img
            src={firstMedia.thumbnailUrl || firstMedia.url}
            alt=""
            className="w-full h-[150px] object-cover"
          />
          {post.media.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              +{post.media.length - 1}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
