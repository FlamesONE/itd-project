import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { Sidebar } from '@widgets/sidebar';
import { RightRail } from '@widgets/right-rail';
import { BottomNavigation } from '@widgets/bottom-navigation';
import { NotificationToast } from '@features/notifications';

const ease = [0.22, 1, 0.36, 1] as const;

export function MainLayout() {
  return (
    <div className="min-h-screen bg-theme flex justify-center">
      <Toaster position="bottom-right" theme="system" />
      <NotificationToast />

      <div className="flex w-full max-w-[1280px]">
        
        <div className="hidden md:block w-[88px] flex-shrink-0">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
            className="sticky top-0 h-screen flex items-center justify-center"
          >
            <Sidebar />
          </motion.aside>
        </div>

        
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="flex-1 min-w-0 md:border-l md:border-r border-theme pb-16 md:pb-0"
        >
          <Outlet />
        </motion.main>

        
        <div className="hidden lg:block w-[350px] flex-shrink-0">
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
            className="sticky top-0 h-screen overflow-y-auto"
          >
            <RightRail />
          </motion.aside>
        </div>
      </div>

      
      <BottomNavigation />
    </div>
  );
}
