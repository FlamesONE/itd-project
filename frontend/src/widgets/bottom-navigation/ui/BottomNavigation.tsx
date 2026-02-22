import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@app/providers/AuthProvider';
import { useAdminCheckAccess } from '@features/admin/hooks/useAdminData';
import {
  Avatar,
  HomeIcon,
  SearchIcon,
  BellIcon,
  UserIcon,
} from '@shared/ui';
import { Shield } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: 'Лента', icon: HomeIcon },
  { path: '/explore', label: 'Поиск', icon: SearchIcon },
  { path: '/notifications', label: 'Уведомления', icon: BellIcon },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function BottomNavigation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheckAccess();

  const handleProfileClick = () => {
    if (user) {
      navigate(`/${user.username}`);
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-theme backdrop-blur-xl bg-opacity-95 md:hidden"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.3, ease }}
            className="flex-1"
          >
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-brand-primary'
                    : 'text-muted hover:text-theme'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-6 h-6" filled={isActive} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}

        
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * navItems.length, duration: 0.3, ease }}
            className="flex-1"
          >
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-brand-primary'
                    : 'text-muted hover:text-theme'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Shield className="w-6 h-6" fill={isActive ? 'currentColor' : 'none'} />
                  <span className="text-[10px] font-medium">Админ</span>
                </>
              )}
            </NavLink>
          </motion.div>
        )}

        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * (navItems.length + (isAdmin ? 1 : 0)), duration: 0.3, ease }}
          className="flex-1"
        >
          <button
            onClick={handleProfileClick}
            className="flex flex-col items-center justify-center gap-1 py-1.5 w-full rounded-xl transition-all duration-200 text-muted hover:text-theme"
          >
            {user ? (
              <>
                <Avatar
                  emoji={user.emoji}
                  src={user.avatarUrl}
                  alt={user.displayName}
                  size="xs"
                />
                <span className="text-[10px] font-medium">Профиль</span>
              </>
            ) : (
              <>
                <UserIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">Профиль</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </motion.nav>
  );
}
