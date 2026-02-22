import { motion } from 'framer-motion';
import clsx from 'clsx';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const borderWidthClasses = {
  xs: 'border-[1.5px]',
  sm: 'border-2',
  md: 'border-2',
  lg: 'border-[3px]',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className={clsx(
          'rounded-full',
          sizeClasses[size],
          borderWidthClasses[size],
          'border-brand-primary/20 border-t-brand-primary'
        )}
      />
    </div>
  );
}
