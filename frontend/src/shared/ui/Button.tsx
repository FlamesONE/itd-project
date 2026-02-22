import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';
import { Spinner } from './Spinner';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
}

const variants = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover active:bg-brand-primary-active',
  outline: 'border border-theme text-theme hover:bg-surface-hover',
  ghost: 'text-muted hover:text-theme hover:bg-surface-hover',
  danger: 'bg-brand-danger text-white hover:bg-brand-danger-hover',
};

const sizes = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" className="text-current" />
          {children}
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
