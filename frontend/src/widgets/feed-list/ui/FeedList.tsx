import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FEED_QUERY, TRENDING_QUERY } from '@shared/api/graphql/posts';
import { PostCard } from '@widgets/post-card';
import { PostDialog } from '@widgets/post-dialog';
import { Button, Spinner } from '@shared/ui';
import { useAuth } from '@app/providers/AuthProvider';
import type { Post } from '@entities/post';

interface FeedListProps {
  type: 'feed' | 'trending';
}

const ease = [0.22, 1, 0.36, 1] as const;
const LIMIT = 20;

export function FeedList({ type }: FeedListProps) {
  const query = type === 'feed' ? FEED_QUERY : TRENDING_QUERY;
  const { user, isLoading: authLoading } = useAuth();
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastPostIdRef = useRef<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const originalPathRef = useRef<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      if (dialogOpen) {
        setDialogOpen(false);
        setSelectedPost(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [dialogOpen]);

  const handleOpenModal = (post: Post) => {
    originalPathRef.current = window.location.pathname;
    setSelectedPost(post);
    setDialogOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      if (originalPathRef.current) {
        window.history.pushState(null, '', originalPathRef.current);
      }
      setDialogOpen(false);
      setSelectedPost(null);
    }
  };

  const { data, loading, error, fetchMore, refetch } = useQuery(query, {
    variables: { limit: LIMIT, offset: 0 },
    notifyOnNetworkStatusChange: true,
    skip: type === 'feed' && !user,
  });

  const rawPosts: Post[] = type === 'feed' ? (data as any)?.feed : (data as any)?.trending;

  const posts = useMemo(() => {
    if (!rawPosts) return rawPosts;
    if (type === 'feed' && user?.id) {
      return rawPosts.filter(post => post.author.id !== user.id);
    }
    return rawPosts;
  }, [rawPosts, type, user?.id]);

  useEffect(() => {
    if (posts?.length && posts[0]?.id !== lastPostIdRef.current) {
      if (lastPostIdRef.current !== null) {
        const oldFirstIndex = posts.findIndex(p => p.id === lastPostIdRef.current);
        if (oldFirstIndex > 0) {
          const newPosts = posts.slice(0, oldFirstIndex);
          const postsFromOthers = newPosts.filter(p => p.author.id !== user?.id);
          if (postsFromOthers.length > 0) {
            setNewPostsCount(prev => prev + postsFromOthers.length);
          }
        }
      }
      lastPostIdRef.current = posts[0]?.id;
    }
  }, [posts, user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (loading || !posts?.length || !hasMore || isFetchingRef.current) return;

    isFetchingRef.current = true;

    fetchMore({
      variables: {
        offset: posts.length,
      },

      updateQuery: (prev: any, { fetchMoreResult }: any) => {
        isFetchingRef.current = false;

        if (!fetchMoreResult) return prev;

        const newPosts = type === 'feed' ? fetchMoreResult.feed : fetchMoreResult.trending;
        const existingPosts = type === 'feed' ? prev.feed : prev.trending;

        if (!newPosts?.length || newPosts.length < LIMIT) {
          setHasMore(false);
        }

        if (!newPosts?.length) return prev;

        const existingIds = new Set(existingPosts.map((p: Post) => p.id));
        const uniqueNewPosts = newPosts.filter((p: Post) => !existingIds.has(p.id));

        if (!uniqueNewPosts.length) {
          setHasMore(false);
          return prev;
        }

        if (type === 'feed') {
          return { feed: [...existingPosts, ...uniqueNewPosts] };
        }
        return { trending: [...existingPosts, ...uniqueNewPosts] };
      },
    }).catch(() => {
      isFetchingRef.current = false;
    });
  }, [loading, posts?.length, fetchMore, type, hasMore]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore && !isFetchingRef.current) {
          handleLoadMore();
        }
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 600px 0px'
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore, loading, hasMore]);

  const handleShowNewPosts = () => {
    setNewPostsCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refetch();
  };

  if ((loading && !posts) || (type === 'feed' && authLoading)) {
    return <FeedSkeleton />;
  }

  if (type === 'feed' && !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="p-8 text-center"
      >
        <div className="text-4xl mb-4">🔒</div>
        <p className="text-theme font-medium">Войдите, чтобы видеть ленту подписок</p>
        <p className="text-sm text-muted mt-2">
          Авторизуйтесь, чтобы видеть посты от людей, на которых вы подписаны
        </p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="p-8 text-center"
      >
        <div className="text-4xl mb-4">😢</div>
        <p className="text-theme font-medium">Не удалось загрузить ленту</p>
        <p className="text-sm text-muted mt-2">{error.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Попробовать снова
        </Button>
      </motion.div>
    );
  }

  if (!posts?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="p-8 text-center"
      >
        <div className="text-4xl mb-4">📝</div>
        <p className="text-theme font-medium">Пока нет постов</p>
        <p className="text-sm text-muted mt-2">
          {type === 'feed'
            ? 'Подпишитесь на интересных авторов'
            : 'Скоро здесь появятся популярные посты'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      
      <AnimatePresence>
        {newPostsCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease }}
            onClick={handleShowNewPosts}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-brand-primary text-white font-medium text-center cursor-pointer hover:bg-brand-primary-hover transition-colors duration-200 rounded-full shadow-lg"
          >
            {newPostsCount === 1
              ? 'Показать 1 новый пост'
              : `Показать ${newPostsCount} новых постов`}
          </motion.button>
        )}
      </AnimatePresence>

      
      <div>
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: Math.min(index * 0.03, 0.3),
              duration: 0.4,
              ease
            }}
          >
            <PostCard post={post} onOpenModal={handleOpenModal} />
          </motion.div>
        ))}
      </div>

      
      <PostDialog
        post={selectedPost}
        open={dialogOpen}
        onOpenChange={handleCloseModal}
      />

      
      <div ref={loadMoreRef} className="h-1" />

      
      {loading && hasMore && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease }}
          className="px-4 py-4 border-b border-theme"
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-hover animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-4 w-24 bg-surface-hover rounded-lg animate-pulse" />
                <div className="h-4 w-16 bg-surface-hover rounded-lg animate-pulse" />
              </div>
              <div className="h-4 w-full bg-surface-hover rounded-lg animate-pulse" />
              <div className="h-4 w-3/4 bg-surface-hover rounded-lg animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
