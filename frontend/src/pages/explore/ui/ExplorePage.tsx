import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, NavLink } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { POSTS_BY_HASHTAG_QUERY } from '@shared/api/graphql/hashtags';
import { SEARCH_POSTS_QUERY } from '@shared/api/graphql/posts';
import { SEARCH_USERS_QUERY } from '@shared/api/graphql/users';
import { TrendingHashtags } from '@widgets/right-rail/ui/TrendingHashtags';
import { WhoToFollow } from '@widgets/right-rail/ui/WhoToFollow';
import { PostCard } from '@widgets/post-card';
import { PostDialog } from '@widgets/post-dialog';
import { Avatar, Button } from '@shared/ui';
import type { Post } from '@entities/post';
import { Search } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

export function ExplorePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');
  const hashtag = searchParams.get('hashtag');
  const [searchInput, setSearchInput] = useState(query || '');
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div>
      
      <header className="sticky top-0 z-10 bg-theme/80 backdrop-blur-md border-b border-theme">
        <div className="px-4 py-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-hover rounded-full text-theme placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
              />
            </div>
          </form>
        </div>

        
        {query && (
          <div className="flex border-b border-theme">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'posts' ? 'text-theme' : 'text-muted hover:text-theme'
              }`}
            >
              Посты
              {activeTab === 'posts' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'users' ? 'text-theme' : 'text-muted hover:text-theme'
              }`}
            >
              Пользователи
              {activeTab === 'users' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                />
              )}
            </button>
          </div>
        )}
      </header>

      
      {hashtag ? (
        <HashtagResults hashtag={hashtag} />
      ) : query ? (
        activeTab === 'posts' ? (
          <PostSearchResults query={query} />
        ) : (
          <UserSearchResults query={query} />
        )
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease }}
          className="p-4 space-y-4"
        >
          <TrendingHashtags />
          <WhoToFollow />
        </motion.div>
      )}
    </div>
  );
}

interface HashtagResultsProps {
  hashtag: string;
}

function HashtagResults({ hashtag }: HashtagResultsProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const originalPathRef = useRef<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, loading, error, fetchMore } = useQuery(POSTS_BY_HASHTAG_QUERY, {
    variables: { hashtag, limit: 20, offset: 0 },
  });

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
    originalPathRef.current = window.location.pathname + window.location.search;
    setSelectedPost(post);
    setDialogOpen(true);
    window.history.pushState({ modal: true }, '', `/post/${post.id}`);
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

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon="😢"
        title="Не удалось загрузить посты"
        description={error.message}
      />
    );
  }

  const posts: Post[] = data?.postsByHashtag?.posts || [];
  const postsCount = data?.postsByHashtag?.postsCount || 0;

  if (posts.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title={`Нет постов с #${hashtag}`}
        description="Будьте первым, кто напишет пост с этим хештегом!"
      />
    );
  }

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: { offset: posts.length },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            ...prev,
            postsByHashtag: {
              ...prev.postsByHashtag,
              posts: [
                ...(prev.postsByHashtag?.posts || []),
                ...(fetchMoreResult.postsByHashtag?.posts || [])
              ]
            }
          };
        }
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="m-4">
      <div className="card overflow-visible">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease }}
          className="px-4 py-2 text-xs text-muted border-b border-theme"
        >
          {postsCount} {postsCount === 1 ? 'пост' : postsCount < 5 ? 'поста' : 'постов'}
        </motion.div>

        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.3, ease }}
          >
            <PostCard post={post} onOpenModal={handleOpenModal} />
          </motion.div>
        ))}

        {posts.length < postsCount && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm text-brand-primary hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        )}
      </div>

      <PostDialog
        post={selectedPost}
        open={dialogOpen}
        onOpenChange={handleCloseModal}
      />
    </div>
  );
}

interface PostSearchResultsProps {
  query: string;
}

function PostSearchResults({ query }: PostSearchResultsProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const originalPathRef = useRef<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, loading, error, fetchMore } = useQuery(SEARCH_POSTS_QUERY, {
    variables: { query, limit: 20, offset: 0 },
    skip: !query,
  });

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
    originalPathRef.current = window.location.pathname + window.location.search;
    setSelectedPost(post);
    setDialogOpen(true);
    window.history.pushState({ modal: true }, '', `/post/${post.id}`);
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

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon="😢"
        title="Не удалось выполнить поиск"
        description={error.message}
      />
    );
  }

  const posts: Post[] = data?.searchPosts || [];

  if (posts.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title={`Нет результатов для "${query}"`}
        description="Попробуйте изменить запрос"
      />
    );
  }

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: { offset: posts.length },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            ...prev,
            searchPosts: [
              ...(prev.searchPosts || []),
              ...(fetchMoreResult.searchPosts || [])
            ]
          };
        }
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="m-4">
      <div className="card overflow-visible">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.3, ease }}
          >
            <PostCard post={post} onOpenModal={handleOpenModal} />
          </motion.div>
        ))}

        {posts.length >= 20 && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm text-brand-primary hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        )}
      </div>

      <PostDialog
        post={selectedPost}
        open={dialogOpen}
        onOpenChange={handleCloseModal}
      />
    </div>
  );
}

interface UserSearchResultsProps {
  query: string;
}

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  emoji?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  followersCount: number;
  isFollowing: boolean;
}

function UserSearchResults({ query }: UserSearchResultsProps) {
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, loading, error, fetchMore } = useQuery(SEARCH_USERS_QUERY, {
    variables: { query, limit: 20, offset: 0 },
    skip: !query,
  });

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon="😢"
        title="Не удалось выполнить поиск"
        description={error.message}
      />
    );
  }

  const users: SearchUser[] = data?.searchUsers || [];

  if (users.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title={`Нет пользователей для "${query}"`}
        description="Попробуйте изменить запрос"
      />
    );
  }

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: { offset: users.length },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            ...prev,
            searchUsers: [
              ...(prev.searchUsers || []),
              ...(fetchMoreResult.searchUsers || [])
            ]
          };
        }
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="m-4">
      <div className="card overflow-visible">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.3, ease }}
          >
            <NavLink
              to={`/${user.username}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-theme hover:bg-surface-hover/50 transition-colors"
            >
              <Avatar
                emoji={user.emoji}
                src={user.avatarUrl}
                alt={user.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-theme truncate">{user.displayName}</p>
                <p className="text-sm text-muted">@{user.username}</p>
                {user.bio && (
                  <p className="text-sm text-muted mt-1 line-clamp-1">{user.bio}</p>
                )}
              </div>
              <Button variant="outline" size="sm">
                {user.isFollowing ? 'Подписка' : 'Подписаться'}
              </Button>
            </NavLink>
          </motion.div>
        ))}

        {users.length >= 20 && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm text-brand-primary hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="m-4">
      <div className="card overflow-hidden divide-y divide-theme">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease }}
            className="px-4 py-3"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-hover animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <div className="h-4 w-24 bg-surface-hover rounded animate-pulse" />
                  <div className="h-4 w-16 bg-surface-hover rounded animate-pulse" />
                </div>
                <div className="h-4 w-full bg-surface-hover rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-surface-hover rounded animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="m-4">
      <div className="card">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="p-8 text-center"
        >
          <div className="text-4xl mb-4">{icon}</div>
          <p className="text-theme font-medium">{title}</p>
          <p className="text-sm text-muted mt-2">{description}</p>
        </motion.div>
      </div>
    </div>
  );
}
