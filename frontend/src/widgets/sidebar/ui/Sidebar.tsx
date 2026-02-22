import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { useAuth } from '@app/providers/AuthProvider';
import { useTheme } from '@app/providers/ThemeProvider';
import {
  Avatar,
  Logo,
  HomeIcon,
  SearchIcon,
  BellIcon,
  UserIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
  SettingsIcon
} from '@shared/ui';
import clsx from 'clsx';
import { User, Shield } from 'lucide-react';
import { NotificationBadge } from '@features/notifications';
import { useAdminCheckAccess } from '@features/admin/hooks/useAdminData';
import { useSettings } from '@features/settings';

const navItems = [
  { path: '/', label: 'Лента', icon: HomeIcon },
  { path: '/explore', label: 'Поиск', icon: SearchIcon },
  { path: '/notifications', label: 'Уведомления', icon: BellIcon },
];

const ease = [0.22, 1, 0.36, 1] as const;

function NavTooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={16}
            className="z-50 px-3 py-1.5 text-sm font-medium rounded-xl bg-dark-text text-dark-bg shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-left-2"
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-dark-text" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { openSettings } = useSettings();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isDark = resolvedTheme === 'dark';
  const { isAdmin } = useAdminCheckAccess();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleProfileClick = () => {
    if (user) {
      navigate(`/${user.username}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  return (
    <div className="h-full flex flex-col items-center py-6">
      
      <div className="flex flex-col items-center">
        
        <NavLink to="/" className="mb-4 hover:opacity-80 transition-opacity">
          <Logo size="md" />
        </NavLink>

        
        <nav
          className="rounded-[28px] p-2"
          style={{ backgroundColor: 'var(--nav-bg)' }}
        >
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.3, ease }}
              >
                <NavTooltip label={item.label}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className="relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? 'var(--nav-active)' : 'transparent',
                      color: isActive ? 'var(--nav-active-text)' : 'var(--nav-text)',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="w-5 h-5" filled={isActive} />
                        {item.path === '/notifications' && <NotificationBadge />}
                      </>
                    )}
                  </NavLink>
                </NavTooltip>
              </motion.li>
            ))}

            {isAdmin && (
              <motion.li
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + navItems.length * 0.05, duration: 0.3, ease }}
              >
                <NavTooltip label="Админка">
                  <NavLink
                    to="/admin"
                    className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? 'var(--nav-active)' : 'transparent',
                      color: isActive ? 'var(--nav-active-text)' : 'var(--nav-text)',
                    })}
                  >
                    {({ isActive }) => (
                      <Shield className="w-5 h-5" fill={isActive ? 'var(--nav-active)' : 'transparent'} />
                    )}
                  </NavLink>
                </NavTooltip>
              </motion.li>
            )}

            
            <motion.li
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + (navItems.length + (isAdmin ? 1 : 0)) * 0.05, duration: 0.3, ease }}
            >
              <NavTooltip label="Мой профиль">
                <NavLink
                  to={`/${user?.username}`}
                  className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200"
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--nav-active)' : 'transparent',
                    color: isActive ? 'var(--nav-active-text)' : 'var(--nav-text)',
                  })}
                >
                  {({ isActive }) => (
                    <User className="w-5 h-5" fill={isActive ? 'var(--nav-active)' : 'transparent'} />
                  )}
                </NavLink>
              </NavTooltip>
            </motion.li>
          </ul>
        </nav>
      </div>

      
      <div className="flex-1" />

      
      <div className="flex flex-col items-center gap-3">
        
        <NavTooltip label={isDark ? 'Светлая тема' : 'Тёмная тема'}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-surface border border-theme hover:bg-surface-hover transition-colors"
          >
            {isDark ? (
              <SunIcon className="w-5 h-5 text-muted" />
            ) : (
              <MoonIcon className="w-5 h-5 text-muted" />
            )}
          </motion.button>
        </NavTooltip>

        
        {user && (
          <div className="relative" ref={menuRef}>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 bg-surface border border-theme rounded-2xl shadow-xl overflow-hidden"
                  style={{ zIndex: 9999 }}
                >
                    <div className="px-4 py-3 border-b border-theme">
                      <p className="font-semibold text-theme text-sm truncate">{user.displayName}</p>
                      <p className="text-xs text-muted">@{user.username}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleProfileClick();
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-surface-hover transition-colors flex items-center gap-3 text-sm text-theme"
                      >
                        <UserIcon className="w-4 h-4 text-muted" />
                        <span>Мой профиль</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          openSettings();
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-surface-hover transition-colors flex items-center gap-3 text-sm text-theme"
                      >
                        <SettingsIcon className="w-4 h-4 text-muted" />
                        <span>Настройки</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-surface-hover transition-colors flex items-center gap-3 text-sm text-brand-danger"
                      >
                        <LogoutIcon className="w-4 h-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>

            <NavTooltip label={user.displayName}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={clsx(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 overflow-hidden border border-theme',
                  showUserMenu ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-[var(--bg)]' : ''
                )}
              >
                <Avatar emoji={user.emoji} src={user.avatarUrl} alt={user.displayName} size="sm" />
              </motion.button>
            </NavTooltip>
          </div>
        )}
      </div>
    </div>
  );
}
