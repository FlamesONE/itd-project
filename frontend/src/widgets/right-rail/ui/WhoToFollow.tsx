import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RECOMMENDED_USERS_QUERY, FOLLOW_USER_MUTATION, UNFOLLOW_USER_MUTATION } from '@shared/api/graphql/users';
import { Avatar } from '@shared/ui';
import { UserHoverCard } from '@features/user/user-hover-card';
import type { RecommendedUser } from '@entities/user';

interface RecommendedUsersData {
  recommendedUsers: RecommendedUser[];
}

export function WhoToFollow() {
  const { data, loading, error } = useQuery<RecommendedUsersData>(RECOMMENDED_USERS_QUERY, {
    variables: { limit: 4 },
  });

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Кого читать
        </h2>
        <div className="p-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-hover rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-hover rounded w-3/4" />
                <div className="h-3 bg-surface-hover rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Кого читать
        </h2>
        <p className="p-4 text-muted">Не удалось загрузить рекомендации</p>
      </div>
    );
  }

  const users = data?.recommendedUsers ?? [];

  if (users.length === 0) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Кого читать
        </h2>
        <p className="p-4 text-muted">Пока нет рекомендаций</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <h2 className="text-lg font-bold p-4 border-b border-theme">
        Кого читать
      </h2>
      <ul>
        {users.map((user, index) => (
          <motion.li
            key={user.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <RecommendedUserItem user={user} />
          </motion.li>
        ))}
      </ul>
      <NavLink
        to="/explore"
        className="block px-4 py-3 text-sm text-brand-primary hover:bg-surface-hover transition-colors"
      >
        Показать больше
      </NavLink>
    </div>
  );
}

function RecommendedUserItem({ user }: { user: RecommendedUser }) {
  const [isFollowing, setIsFollowing] = useState(false);

  const [followUser, { loading: followLoading }] = useMutation(FOLLOW_USER_MUTATION, {
    variables: { userId: user.userId },
  });

  const [unfollowUser, { loading: unfollowLoading }] = useMutation(UNFOLLOW_USER_MUTATION, {
    variables: { userId: user.userId },
  });

  const loading = followLoading || unfollowLoading;

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        await unfollowUser();
      } else {
        await followUser();
      }
    } catch {
      setIsFollowing(wasFollowing);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover-highlight">
      <UserHoverCard userId={user.userId}>
        <NavLink to={`/${user.username}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
          <Avatar emoji={user.emoji} src={user.avatarUrl} alt={user.displayName} size="sm" />
        </NavLink>
      </UserHoverCard>
      <div className="flex-1 min-w-0">
        <UserHoverCard userId={user.userId}>
          <NavLink to={`/${user.username}`} className="inline-block max-w-full">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-theme text-sm truncate hover:underline">{user.displayName}</span>
            </div>
            <p className="text-xs text-muted truncate">@{user.username}</p>
          </NavLink>
        </UserHoverCard>
      </div>
      <button
        onClick={handleToggleFollow}
        disabled={loading}
        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
          isFollowing
            ? 'border border-theme text-theme hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
            : 'bg-theme-inverse text-theme-inverse hover:opacity-90'
        } disabled:opacity-50`}
      >
        {loading ? '...' : isFollowing ? 'Отписаться' : 'Подписаться'}
      </button>
    </div>
  );
}
