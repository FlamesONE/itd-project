import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MainLayout } from '@widgets/layouts/MainLayout';
import { AuthLayout } from '@widgets/layouts/AuthLayout';
import { FeedPage } from '@pages/feed';
import { ExplorePage } from '@pages/explore';
import { NotificationsPage } from '@pages/notifications';
import { ProfilePage } from '@pages/profile';
import { PostDetailPage } from '@pages/post-detail';
import { LoginPage, RegisterPage } from '@pages/auth';
import { AdminPage } from '@pages/admin';
import { useAuth } from '@app/providers/AuthProvider';
import { useSettings } from '@features/settings';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-theme">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full"
        />
        <span className="text-3xl font-black text-theme">итд</span>
      </motion.div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function SettingsRedirect() {
  const navigate = useNavigate();
  const { openSettings } = useSettings();

  useEffect(() => {
    openSettings();
    navigate('/', { replace: true });
  }, [openSettings, navigate]);

  return null;
}

export function AppRouter() {
  return (
    <Routes>
      
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          </PublicRoute>
        }
      />

      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeedPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsRedirect />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path=":username" element={<ProfilePage />} />
        <Route path="post/:postId" element={<PostDetailPage />} />
      </Route>

      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
