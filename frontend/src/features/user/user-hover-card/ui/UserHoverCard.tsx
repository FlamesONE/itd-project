import { useState } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import { useQuery } from '@apollo/client/react';
import { UserQuery } from '@shared/api/graphql';
import { Avatar, VerifiedBadge, OnlineStatus, OnlineDot } from '@shared/ui';
import { useFollowUser } from '../../follow-user/model/useFollowUser';
import { useAuth } from '@app/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { formatCount } from '@shared/lib/formatters';

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

export function UserHoverCard({ userId, children }: UserHoverCardProps) {
  const { user: currentUser } = useAuth();
  const [hasOpened, setHasOpened] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (open) setHasOpened(true);
  };

  const { data, loading } = useQuery(UserQuery, {
    variables: { id: userId },
    skip: !hasOpened,
  });

  const user = data?.user;
  const isOwnProfile = currentUser?.id === userId;

  const { toggle, isFollowing, loading: followLoading } = useFollowUser(
    userId,
    user?.isFollowing ?? false
  );

  return (
    <HoverCard.Root openDelay={400} closeDelay={150} onOpenChange={handleOpenChange}>
      <HoverCard.Trigger asChild>
        {children}
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="z-50 w-72 overflow-hidden card shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          sideOffset={8}
          align="start"
        >
          {loading && !user ? (
            <div className="flex flex-col gap-3 animate-pulse p-4">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-full bg-surface-hover" />
                <div className="w-24 h-8 rounded-full bg-surface-hover" />
              </div>
              <div className="space-y-2">
                <div className="w-32 h-4 rounded bg-surface-hover" />
                <div className="w-20 h-3 rounded bg-surface-hover" />
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-3 rounded bg-surface-hover" />
                <div className="w-20 h-3 rounded bg-surface-hover" />
              </div>
            </div>
          ) : user ? (
            <div className="flex flex-col">
              
              <div className="h-20 w-full bg-surface-hover relative">
                {user.coverUrl && (
                  <img
                    src={user.coverUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="px-4 pb-4">
                
                <div className="flex justify-between items-end relative -mt-8 mb-3">
                  <Link to={`/${user.username}`} className="transition-transform hover:scale-105">
                    <div className="ring-4 ring-surface rounded-full bg-surface relative">
                      <Avatar
                        src={user.avatarUrl}
                        emoji={user.emoji}
                        alt={user.displayName}
                        size="lg"
                      />
                      <OnlineDot isOnline={(user as { isOnline?: boolean }).isOnline} />
                    </div>
                  </Link>
                  {!isOwnProfile && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle();
                      }}
                      disabled={followLoading}
                      className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${isFollowing
                        ? 'border border-theme text-theme hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                        : 'bg-theme-inverse text-theme-inverse hover:opacity-90'
                        } disabled:opacity-50`}
                    >
                      {followLoading ? '...' : isFollowing ? 'Отписаться' : 'Подписаться'}
                    </button>
                  )}
                </div>

                
                <div>
                  <Link
                    to={`/${user.username}`}
                    className="font-bold text-[15px] text-theme hover:underline flex items-center gap-1"
                  >
                    {user.displayName}
                    {user.verified && <VerifiedBadge className="w-4 h-4 text-brand-primary" />}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-muted text-sm">@{user.username}</span>
                    <OnlineStatus
                      isOnline={(user as { isOnline?: boolean }).isOnline}
                      lastSeenAt={(user as { lastSeenAt?: string | null }).lastSeenAt}
                    />
                  </div>
                </div>

                
                {user.bio && (
                  <p className="text-sm text-theme leading-snug line-clamp-2">
                    {user.bio}
                  </p>
                )}

                
                <div className="flex gap-4 text-sm mt-3">
                  <Link
                    to={`/${user.username}`}
                    className="hover:underline"
                  >
                    <span className="font-bold text-theme">{formatCount(user.followingCount)}</span>
                    <span className="text-muted ml-1">в читаемых</span>
                  </Link>
                  <Link
                    to={`/${user.username}`}
                    className="hover:underline"
                  >
                    <span className="font-bold text-theme">{formatCount(user.followersCount)}</span>
                    <span className="text-muted ml-1">читателей</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
