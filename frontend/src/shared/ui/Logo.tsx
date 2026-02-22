import { motion } from 'framer-motion';
import clsx from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  animated?: boolean;
}

const sizeConfig = {
  sm: { fontSize: 'text-xl', step: 3, gap: -2 },
  md: { fontSize: 'text-2xl', step: 4, gap: -2 },
  lg: { fontSize: 'text-3xl', step: 5, gap: -3 },
  xl: { fontSize: 'text-4xl', step: 6, gap: -4 },
  hero: { fontSize: 'text-8xl', step: 14, gap: -8 },
};

export function Logo({ size = 'md', className, animated = false }: LogoProps) {
  const { fontSize, step, gap } = sizeConfig[size];
  const letters = ['и', 'т', 'д'];

  const content = (
    <div
      className={clsx('inline-flex items-start select-none', className)}
      style={{ gap: `${gap}px` }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className={clsx(
            'font-semibold text-theme inline-block leading-none',
            fontSize
          )}
          style={{
            marginTop: `${index * step}px`,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

export function HeroLogo({ className }: { className?: string }) {
  const letters = ['и', 'т', 'д'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1
      }}
      className={clsx('relative inline-flex items-start select-none', className)}
      style={{ gap: '-8px' }}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2 + index * 0.1
          }}
          className="font-semibold text-[120px] leading-none text-theme"
          style={{ marginTop: `${index * 20}px` }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
}

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  const letters = ['и', 'т', 'д'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={clsx('inline-flex items-start justify-center select-none', className)}
      style={{ gap: '-3px' }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className="font-semibold text-4xl leading-none text-brand-primary"
          style={{ marginTop: `${index * 6}px` }}
        >
          {letter}
        </span>
      ))}
    </motion.div>
  );
}

export function TextLogo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: { fontSize: 'text-xl', step: 3, gap: -2 },
    md: { fontSize: 'text-2xl', step: 4, gap: -2 },
    lg: { fontSize: 'text-4xl', step: 6, gap: -4 },
    xl: { fontSize: 'text-5xl', step: 8, gap: -5 },
  };

  const { fontSize, step, gap } = sizeClasses[size];
  const letters = ['и', 'т', 'д'];

  return (
    <span
      className={clsx('inline-flex items-start select-none', className)}
      style={{ gap: `${gap}px` }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className={clsx('font-semibold text-theme leading-none', fontSize)}
          style={{ marginTop: `${index * step}px` }}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}
