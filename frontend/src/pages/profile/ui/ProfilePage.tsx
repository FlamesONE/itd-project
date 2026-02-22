import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_BY_USERNAME_QUERY, FOLLOW_USER_MUTATION, UNFOLLOW_USER_MUTATION } from '@shared/api/graphql/users';
import { USER_POSTS_QUERY } from '@shared/api/graphql/posts';
import { Avatar, Button, Tabs, VerifiedBadge, OnlineStatus, OnlineDot } from '@shared/ui';
import { PostCard } from '@widgets/post-card';
import { PostDialog } from '@widgets/post-dialog';
import { PostComposer } from '@widgets/post-composer';
import { useAuth } from '@app/providers/AuthProvider';
import { BannerEditor } from '@features/user/banner-editor/ui/BannerEditor';
import type { Post } from '@entities/post';
import type { User } from '@entities/user';
import { Calendar, Edit } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bannerEditorOpen, setBannerEditorOpen] = useState(false);
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

  const { data: userData, loading: userLoading } = useQuery(USER_BY_USERNAME_QUERY, {
    variables: { username: username! },
    skip: !username,
  });

  const user = (userData?.userByUsername ?? undefined) as User | undefined;

  const { data: postsData, loading: postsLoading } = useQuery(USER_POSTS_QUERY, {
    variables: { userId: user?.id ?? '', limit: 20, offset: 0 },
    skip: !user?.id,
  });

  const [followUser] = useMutation(FOLLOW_USER_MUTATION);
  const [unfollowUser] = useMutation(UNFOLLOW_USER_MUTATION);

  const rawPosts: Post[] = (postsData?.userPosts as any) || [];

  const posts = useMemo(() => {
    return [...rawPosts].sort((a, b) => {
      if (a.isPinned === b.isPinned) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.isPinned ? -1 : 1;
    });
  }, [rawPosts]);

  const isOwnProfile = currentUser?.username === username;

  const handleFollowToggle = async () => {
    if (!user) return;

    try {
      if (user.isFollowing) {
        await unfollowUser({
          variables: { userId: user.id },
          optimisticResponse: { unfollowUser: true },
          update: (cache) => {
            cache.modify({
              id: cache.identify({ __typename: 'User', id: user.id }),
              fields: {
                isFollowing: () => false,
                followersCount: (prev: number) => Math.max(0, prev - 1),
              },
            });
          },
        });
      } else {
        await followUser({
          variables: { userId: user.id },
          optimisticResponse: { followUser: true },
          update: (cache) => {
            cache.modify({
              id: cache.identify({ __typename: 'User', id: user.id }),
              fields: {
                isFollowing: () => true,
                followersCount: (prev: number) => prev + 1,
              },
            });
          },
        });
      }
    } catch (e) {
      console.error('Failed to toggle follow:', e);
    }
  };

  const tabs: any[] = useMemo(() => [
    {
      id: 'posts',
      label: 'Посты',
      content: (
        <div className="divide-y divide-theme min-h-[400px]">
          <AnimatePresence mode="wait" initial={false}>
            {postsLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
              </motion.div>
            ) : posts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="text-4xl mb-3">📝</div>
                <p className="text-muted text-sm">Пока нет постов</p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onOpenModal={handleOpenModal} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      id: 'likes',
      label: 'Понравившиеся',
      content: (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">❤️</div>
          <p className="text-muted">Функция в разработке</p>
        </div>
      ),
    },
  ], [postsLoading, posts, handleOpenModal]);

  return (
    <AnimatePresence mode="wait">
      {userLoading ? (
        <ProfileSkeleton key="skeleton" />
      ) : !user ? (
        <motion.div
          key="not-found"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease }}
          className="p-8 text-center"
        >
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-semibold text-theme">Пользователь не найден</h1>
          <p className="text-muted mt-2">@{username}</p>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          
          <div className="m-4 mb-0">
            <div className="card overflow-hidden">
              
              <div
                className={`h-64 bg-surface-hover relative group ${isOwnProfile ? 'cursor-pointer' : ''}`}
                onClick={() => isOwnProfile && setBannerEditorOpen(true)}
              >
                {user.coverUrl && (
                  <img
                    src={user.coverUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}

                
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <span className="text-white text-sm font-medium flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Edit className="w-4 h-4" />
                      Изменить обложку
                    </span>
                  </div>
                )}
              </div>

              
              <div className="px-4 pb-4">
                
                <div className="relative -mt-10 mb-3 flex justify-between items-end pointer-events-none z-20">
                  <div className="ring-4 ring-surface rounded-full pointer-events-auto relative">
                    <Avatar
                      emoji={user.emoji}
                      src={user.avatarUrl}
                      alt={user.displayName}
                      size="xl"
                    />
                    <OnlineDot isOnline={user.isOnline} className="w-4 h-4 border-4" />
                  </div>

                  <div className="pointer-events-auto">
                    {isOwnProfile ? (
                      <Button variant="outline" size="sm">
                        Редактировать
                      </Button>
                    ) : (
                      <Button
                        variant={user.isFollowing ? 'outline' : 'primary'}
                        size="sm"
                        onClick={handleFollowToggle}
                      >
                        {user.isFollowing ? 'Отписаться' : 'Подписаться'}
                      </Button>
                    )}
                  </div>
                </div>

                
                <div className="mb-2">
                  <h1 className="text-lg font-semibold text-theme flex items-center gap-1.5">
                    {user.displayName}
                    {user.verified && <VerifiedBadge className="w-4 h-4 text-brand-primary" />}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-muted">@{user.username}</p>
                    {!isOwnProfile && !!user.followsMe && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-muted">
                        Читает вас
                      </span>
                    )}
                    <OnlineStatus isOnline={user.isOnline} lastSeenAt={user.lastSeenAt} />
                  </div>
                </div>

                
                {user.bio && (
                  <p className="text-sm text-theme mb-3 leading-relaxed">{user.bio}</p>
                )}

                
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-theme">
                    <strong>{user.followingCount}</strong>{' '}
                    <span className="text-muted">подписок</span>
                  </span>
                  <span className="text-theme">
                    <strong>{user.followersCount}</strong>{' '}
                    <span className="text-muted">подписчиков</span>
                  </span>
                </div>

                
                <p className="text-xs text-muted mt-3 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  На платформе с {formatJoinDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>

          
          {currentUser && user.canViewWall && (
            <div className="m-4 mb-0">
              <div className="card">
                <PostComposer
                  placeholder={isOwnProfile ? "Что нового?" : `Написать на стену ${user.displayName}...`}
                  targetUserId={isOwnProfile ? undefined : user.id}
                />
              </div>
            </div>
          )}

          
          {!user.canViewWall && (
            <div className="m-4">
              <div className="card p-8 text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h2 className="text-lg font-semibold text-theme mb-2">
                  Это закрытая стена
                </h2>
                <p className="text-muted text-sm">
                  {user.wallPrivacy === 'private'
                    ? `${user.displayName} разрешает писать на стене только себе`
                    : `Подпишитесь на ${user.displayName}, чтобы писать на стене`}
                </p>
              </div>
            </div>
          )}

          
          {user.canViewWall && (
            <div className="m-4">
              <div className="card overflow-visible">
                <Tabs tabs={tabs} sticky />
              </div>
            </div>
          )}

          
          <PostDialog
            post={selectedPost}
            open={dialogOpen}
            onOpenChange={handleCloseModal}
          />

          
          <BannerEditor
            isOpen={bannerEditorOpen}
            onClose={() => setBannerEditorOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      
      <div className="m-4 mb-0 card overflow-hidden">
        <div className="h-64 bg-surface-hover" />
        <div className="px-4 pb-4">
          <div className="relative -mt-10 mb-3 flex justify-between items-end">
            <div className="w-20 h-20 rounded-full bg-surface-hover ring-4 ring-surface" />
            <div className="h-8 w-24 bg-surface-hover rounded" />
          </div>
          <div className="h-5 w-36 bg-surface-hover rounded mb-2" />
          <div className="h-4 w-24 bg-surface-hover rounded mb-4" />
          <div className="h-4 w-full bg-surface-hover rounded mb-2" />
          <div className="h-4 w-2/3 bg-surface-hover rounded" />
        </div>
      </div>

      
      <div className="m-4 card overflow-hidden">
        <div className="border-b border-theme px-4 py-3 flex gap-6">
          <div className="h-5 w-16 bg-surface-hover rounded" />
          <div className="h-5 w-24 bg-surface-hover rounded" />
        </div>
        <div className="divide-y divide-theme">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="p-4 flex gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-surface-hover flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-surface-hover rounded" />
          <div className="h-4 w-12 bg-surface-hover rounded opacity-50" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-surface-hover rounded" />
          <div className="h-4 w-4/5 bg-surface-hover rounded" />
        </div>
        <div className="flex justify-between w-3/4 pt-1">
          <div className="h-4 w-8 bg-surface-hover rounded" />
          <div className="h-4 w-8 bg-surface-hover rounded" />
          <div className="h-4 w-8 bg-surface-hover rounded" />
          <div className="h-4 w-8 bg-surface-hover rounded" />
        </div>
      </div>
    </div>
  );
}
