import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { HeroLogo } from '@shared/ui';

interface AuthLayoutProps {
  children: ReactNode;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-theme flex">
      
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 relative overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5" />
        <HeroLogo />
      </div>

      
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 md:p-12 lg:p-16">
        <div className="flex-1 flex flex-col justify-center max-w-[440px] mx-auto w-full">
          
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="rounded-3xl border border-theme bg-surface p-8 md:p-10"
          >
            {children}
          </motion.div>
        </div>

        
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 text-xs text-muted"
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1 max-w-[400px] mx-auto justify-center">
            <a href="#" className="hover:underline hover:text-theme transition-colors duration-200">О нас</a>
            <a href="#" className="hover:underline hover:text-theme transition-colors duration-200">Справка</a>
            <a href="#" className="hover:underline hover:text-theme transition-colors duration-200">Условия</a>
            <a href="#" className="hover:underline hover:text-theme transition-colors duration-200">Конфиденциальность</a>
          </div>
          <p className="mt-4 max-w-[440px] mx-auto text-center opacity-50">2026 итд</p>
        </motion.footer>
      </div>
    </div>
  );
}
