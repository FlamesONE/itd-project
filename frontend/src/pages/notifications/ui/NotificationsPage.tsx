import { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  NOTIFICATIONS_QUERY,
  MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION,
} from '@shared/api/graphql/notifications';
import { sseClient } from '@shared/api/sse/client';
import { Avatar, Button } from '@shared/ui';
import type { Notification, NotificationType } from '@entities/notification';
import { Heart, MessageCircle, Repeat2, UserPlus, Zap } from 'lucide-react';
import clsx from 'clsx';

const ease = [0.22, 1, 0.36, 1] as const;

export function NotificationsPage() {
  const { data, loading, error, refetch } = useQuery(NOTIFICATIONS_QUERY, {
    variables: { limit: 50, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    const handleNotification = () => {
      refetch();
    };

    sseClient.on('onNotification', handleNotification);

    return () => {
      sseClient.off('onNotification');
    };
  }, [refetch]);

  const [markAllAsRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION, {
    refetchQueries: [{ query: NOTIFICATIONS_QUERY }],
  });

  const notifications: Notification[] = data?.notifications || [];

  return (
    <div>
      
      <header className="sticky top-0 z-10 bg-theme/80 backdrop-blur-md border-b border-theme">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-theme">Уведомления</h1>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
              Прочитать все
            </Button>
          )}
        </div>
      </header>

      
      {loading ? (
        <div className="m-4">
          <div className="card overflow-hidden">
            <NotificationsSkeleton />
          </div>
        </div>
      ) : error ? (
        <div className="m-4">
          <div className="card">
            <div className="p-8 text-center text-muted">
              <p>Не удалось загрузить уведомления</p>
            </div>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="m-4">
          <div className="card">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="py-16 text-center"
            >
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-theme font-medium">Нет уведомлений</p>
              <p className="text-sm text-muted mt-1">Здесь появятся ваши уведомления</p>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="m-4">
          <div className="card overflow-hidden">
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  index: number;
}

function NotificationItem({ notification, index }: NotificationItemProps) {
  const { actor, type, post, isRead, createdAt } = notification;

  const link = type === 'follow' ? `/${actor.username}` : post ? `/post/${post.id}` : '#';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.3, ease }}
    >
      <NavLink
        to={link}
        className={clsx(
          "flex gap-3 px-4 py-3 border-b border-theme hover:bg-surface-hover/50 transition-colors",
          !isRead && "bg-brand-primary/5"
        )}
      >
        
        <div className="flex-shrink-0 pt-1">
          <NotificationIcon type={type} />
        </div>

        
        <div className="flex-shrink-0">
          <Avatar
            emoji={actor.emoji}
            src={actor.avatarUrl}
            alt={actor.displayName}
            size="sm"
          />
        </div>

        
        <div className="flex-1 min-w-0">
          <p className="text-[15px] leading-snug">
            <span className="font-semibold text-theme">
              {actor.displayName}
            </span>
            <span className="text-muted ml-1">
              {getMessageText(type)}
            </span>
          </p>

          {post && (
            <p className="text-sm text-muted mt-1 line-clamp-2">
              {post.content}
            </p>
          )}

          <span className="text-xs text-muted mt-1 block">
            {formatTimeAgo(createdAt)}
          </span>
        </div>

        
        {!isRead && (
          <div className="flex-shrink-0 self-center">
            <span className="w-2 h-2 rounded-full bg-brand-primary block" />
          </div>
        )}
      </NavLink>
    </motion.div>
  );
}

function getMessageText(type: NotificationType): string {
  switch (type) {
    case 'like': return 'понравился ваш пост';
    case 'comment': return 'прокомментировал ваш пост';
    case 'repost': return 'сделал репост';
    case 'follow': return 'подписался на вас';
    case 'mention': return 'упомянул вас';
    case 'reply': return 'ответил вам';
    default: return 'взаимодействовал';
  }
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const iconClass = "w-4 h-4";

  switch (type) {
    case 'like':
      return <Heart className={clsx(iconClass, "text-red-500 fill-red-500")} />;
    case 'repost':
      return <Repeat2 className={clsx(iconClass, "text-green-500")} />;
    case 'follow':
      return <UserPlus className={clsx(iconClass, "text-brand-primary")} />;
    case 'comment':
    case 'reply':
    case 'mention':
      return <MessageCircle className={clsx(iconClass, "text-brand-primary fill-brand-primary")} />;
    default:
      return <Zap className={clsx(iconClass, "text-muted")} />;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'сейчас';
  if (diffMins < 60) return `${diffMins}м`;
  if (diffHours < 24) return `${diffHours}ч`;
  if (diffDays < 7) return `${diffDays}д`;

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function NotificationsSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3 px-4 py-3 border-b border-theme animate-pulse">
          <div className="w-4 h-4 rounded bg-surface-hover mt-1" />
          <div className="w-8 h-8 rounded-full bg-surface-hover" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-surface-hover rounded" />
            <div className="h-3 w-1/2 bg-surface-hover rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
