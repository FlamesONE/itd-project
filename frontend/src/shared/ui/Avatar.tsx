import { motion } from 'framer-motion';
import clsx from 'clsx';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  emoji?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-20 h-20',
  xxl: 'w-32 h-32',
};

const emojiSizeClasses = {
  xs: 'text-sm',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
  xxl: 'text-6xl',
};

const textSizeClasses = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
  xxl: 'text-3xl',
};

export function Avatar({ src, alt = 'Avatar', emoji, size = 'md', className, onClick }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  let content;
  if (emoji) {
    content = (
      <div className={clsx(
        'w-full h-full flex items-center justify-center bg-surface-secondary rounded-full',
        emojiSizeClasses[size]
      )}>
        {emoji}
      </div>
    );
  } else if (src) {
    content = <img src={src} alt={alt} className="w-full h-full object-cover" />;
  } else {
    content = (
      <div className={clsx(
        'w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-semibold',
        textSizeClasses[size]
      )}>
        {initials || '?'}
      </div>
    );
  }

  if (onClick) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={clsx(
          'rounded-full overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-brand-primary transition-all',
          sizeClasses[size],
          className
        )}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full overflow-hidden flex-shrink-0',
        sizeClasses[size],
        className
      )}
    >
      {content}
    </div>
  );
}
