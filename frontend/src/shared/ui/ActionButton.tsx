import clsx from 'clsx';
import { formatCount } from '@shared/lib';

interface ActionButtonProps {
  icon: React.ReactNode;
  count: number;
  active?: boolean;
  activeColor?: string;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}

export function ActionButton({
  icon,
  count,
  active,
  activeColor = 'text-brand-primary',
  onClick,
  disabled,
  label,
}: ActionButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={label}
      className={clsx(
        'flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors',
        active ? activeColor : 'text-muted hover:text-theme hover:bg-surface-hover',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className="w-5 h-5">{icon}</span>
      {count > 0 && <span className="text-xs">{formatCount(count)}</span>}
    </button>
  );
}
