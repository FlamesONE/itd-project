interface OnlineStatusProps {
  isOnline?: boolean;
  lastSeenAt?: string | null;
  showText?: boolean;
  size?: 'sm' | 'md';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function OnlineStatus({ isOnline, lastSeenAt, showText = true, size = 'sm' }: OnlineStatusProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`${dotSize} rounded-full bg-green-500 flex-shrink-0`} />
        {showText && <span className="text-green-600 dark:text-green-400 text-xs">онлайн</span>}
      </div>
    );
  }

  if (!lastSeenAt) {
    return null;
  }

  const timeAgo = formatTimeAgo(lastSeenAt);

  return (
    <div className="flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full bg-gray-400 flex-shrink-0`} />
      {showText && <span className="text-muted text-xs">{timeAgo}</span>}
    </div>
  );
}

interface OnlineDotProps {
  isOnline?: boolean;
  className?: string;
}

export function OnlineDot({ isOnline, className = '' }: OnlineDotProps) {
  if (!isOnline) return null;

  return (
    <span
      className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface ${className}`}
    />
  );
}
