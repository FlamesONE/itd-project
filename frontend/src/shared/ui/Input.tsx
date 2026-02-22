import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-theme mb-2 tracking-wide uppercase opacity-60">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full rounded-xl px-4 py-3 border bg-surface',
            'text-theme placeholder:text-muted',
            'transition-colors duration-200',
            'outline-none',
            error
              ? 'border-brand-danger'
              : 'border-theme hover:border-muted focus:border-brand-primary',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-brand-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
