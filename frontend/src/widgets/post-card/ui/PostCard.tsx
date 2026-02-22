import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, MoreIcon, VerifiedBadge, RepostIcon } from '@shared/ui';
import { formatTimeAgo, parseContent } from '@shared/lib';
import { PostMedia } from './PostMedia';
import { PostActionsBar } from './PostActionsBar';
import { EmbeddedPost } from './EmbeddedPost';
import { useViewPost } from '@features/post/view-post';
import { useLikePost } from '@features/post/like-post';
import { useRepost, RepostModal } from '@features/post/repost';
import { UserHoverCard } from '@features/user/user-hover-card';
import { PostActionsMenu } from '@features/post/post-actions-menu';
import { useAuth } from '@app/providers/AuthProvider';
import { Pin } from 'lucide-react';
import type { Post } from '@entities/post';

interface PostCardProps {
  post: Post;
  onOpenModal?: (post: Post) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function PostCard({ post, onOpenModal }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { viewPost } = useViewPost();
  const { toggle: toggleLike, isLiked, likesCount, loading: likeLoading } = useLikePost(post);
  const { isReposted, repostsCount, loading: repostLoading } = useRepost(post);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    const article = articleRef.current;
    if (!article || hasTrackedView.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasTrackedView.current) {
          hasTrackedView.current = true;
          viewPost(post.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(article);
    return () => observer.disconnect();
  }, [post.id, viewPost]);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) return;

    if (onOpenModal) {
      onOpenModal(post);
      window.history.pushState({ modal: true, from: location.pathname }, '', `/post/${post.id}`);
    } else {
      navigate(`/post/${post.id}`);
    }
  };

  const handleCommentClick = () => {
    if (onOpenModal) {
      onOpenModal(post);
      window.history.pushState({ modal: true, from: location.pathname }, '', `/post/${post.id}`);
    } else {
      navigate(`/post/${post.id}`);
    }
  };

  const handleRepostClick = () => {
    setRepostModalOpen(true);
  };

  const hasMedia = post.media && post.media.length > 0;
  const isRepostWithEmbed = !!post.repostInfo;

  const displayAuthor = isRepostWithEmbed
    ? {
        id: post.repostInfo?.repostedById || post.author.id,
        username: post.repostInfo?.repostedByUsername || post.author.username,
        displayName: post.repostInfo?.repostedByDisplayName || post.author.displayName,
        emoji: post.repostInfo?.repostedByEmoji || post.author.emoji,
        avatarUrl: post.repostInfo?.repostedByAvatarUrl || post.author.avatarUrl,
        verified: post.repostInfo?.repostedByVerified || false,
      }
    : post.author;

  const displayContent = isRepostWithEmbed ? post.repostInfo?.quoteContent : post.content;
  const displayTime = isRepostWithEmbed ? post.repostInfo?.repostedAt : post.createdAt;

  return (
    <>
      <motion.article
        ref={articleRef as React.RefObject<HTMLElement>}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease }}
        onClick={handleClick}
        className={`group border-b border-theme cursor-pointer transition-colors`}
      >
        
        {post.isPinned && (
          <div className="flex items-center gap-2 pt-3 pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 ml-6">
              <Pin className="w-3.5 h-3.5 text-brand-primary fill-current" />
              <span className="text-brand-primary text-xs font-semibold">Закреплено</span>
            </div>
          </div>
        )}

        
        {isRepostWithEmbed && (
          <div className="flex items-center gap-2 pt-3 pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 ml-6">
              <RepostIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
              <span className="text-green-600 dark:text-green-500 text-xs font-medium">Репост</span>
            </div>
          </div>
        )}

        
        <div className={`flex items-center gap-2 px-4 pb-2 ${post.isPinned || isRepostWithEmbed ? 'pt-1' : 'pt-3'}`}>
          <UserHoverCard userId={displayAuthor.id}>
            <NavLink to={`/${displayAuthor.username}`} className="flex-shrink-0">
              <Avatar
                emoji={displayAuthor.emoji}
                src={displayAuthor.avatarUrl}
                alt={displayAuthor.displayName}
                size="sm"
              />
            </NavLink>
          </UserHoverCard>

          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <UserHoverCard userId={displayAuthor.id}>
              <NavLink
                to={`/${displayAuthor.username}`}
                className="font-semibold text-theme text-[14px] hover:underline truncate"
              >
                {displayAuthor.displayName}
              </NavLink>
            </UserHoverCard>
            {displayAuthor.verified && (
              <VerifiedBadge className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
            )}
            <span className="text-muted text-[13px]">·</span>
            <span className="text-muted text-[13px] truncate">
              {formatTimeAgo(displayTime || post.createdAt)}
            </span>
          </div>

          <PostActionsMenu
            trigger={
              <button className="p-1.5 -m-1.5 rounded-full text-muted hover:text-theme hover:bg-surface-hover transition-colors md:opacity-0 md:group-hover:opacity-100">
                <MoreIcon className="w-4 h-4" />
              </button>
            }
            postId={post.id}
            authorId={post.author.id}
            authorName={post.author.displayName}
            currentUserId={user?.id}
            isPinned={post.isPinned}
            isOwnPost={user?.id === post.author.id}
            wallOwnerId={post.wallOwner?.id}
          />
        </div>

        
        {displayContent && (
          <div className="px-4 pb-2">
            <p className="text-theme text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {parseContent(displayContent)}
            </p>
          </div>
        )}

        
        {isRepostWithEmbed && (
          <div className="mx-4 mb-3">
            <EmbeddedPost post={post} onClick={handleCommentClick} />
          </div>
        )}

        
        {!isRepostWithEmbed && hasMedia && (
          <div className="mt-3 mx-4 rounded-2xl overflow-hidden">
            <PostMedia media={post.media} onImageClick={handleCommentClick} />
          </div>
        )}

        
        <div className="px-4 py-1">
          <PostActionsBar
            likesCount={likesCount}
            commentsCount={post.commentsCount}
            repostsCount={repostsCount}
            viewsCount={post.viewsCount}
            isLiked={isLiked}
            isReposted={isReposted}
            onLike={toggleLike}
            onComment={handleCommentClick}
            onRepost={handleRepostClick}
            likeLoading={likeLoading}
            repostLoading={repostLoading}
          />
        </div>
      </motion.article>

      <RepostModal
        post={post}
        open={repostModalOpen}
        onOpenChange={setRepostModalOpen}
      />
    </>
  );
}
