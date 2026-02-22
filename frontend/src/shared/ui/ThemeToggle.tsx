import { motion } from 'framer-motion';
import { useTheme } from '@app/providers/ThemeProvider';
import { SunIcon, MoonIcon } from './Icons';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2 rounded-full hover-highlight"
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5 text-muted hover:text-brand-primary" />
      ) : (
        <MoonIcon className="w-5 h-5 text-muted hover:text-brand-primary" />
      )}
    </motion.button>
  );
}
