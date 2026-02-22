import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGIN_MUTATION } from '@shared/api/graphql/auth';
import { useAuth } from '@app/providers/AuthProvider';
import { Button, Input, Logo } from '@shared/ui';

const ease = [0.22, 1, 0.36, 1] as const;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      login(data.login.accessToken, data.login.refreshToken);
      navigate('/');
    },
    onError: (err) => {
      setError(err.message || 'Ошибка входа');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    await loginMutation({
      variables: {
        input: { email, password },
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      className="w-full max-w-sm mx-auto"
    >
      
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        className="flex justify-center mb-10"
      >
        <Logo size="xl" />
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-semibold text-theme mb-2">С возвращением</h1>
        <p className="text-sm text-muted">Войдите чтобы продолжить</p>
      </motion.div>

      
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease }}
        className="space-y-4"
      >
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-12"
          />
        </div>

        <div>
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="h-12"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="text-xs text-muted hover:text-brand-primary transition-colors"
            >
              Забыли пароль?
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: 1,
                y: 0,
                x: [0, -4, 4, -2, 2, 0]
              }}
              exit={{ opacity: 0, y: -5 }}
              transition={{
                opacity: { duration: 0.2 },
                y: { duration: 0.2 },
                x: { duration: 0.4, ease: "easeInOut" }
              }}
              className="p-3 rounded-lg bg-brand-danger/10 border border-brand-danger/20"
            >
              <p className="text-brand-danger text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          className="w-full h-12 font-medium"
          isLoading={loading}
          disabled={loading}
        >
          Войти
        </Button>
      </motion.form>

      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease }}
        className="text-center"
      >
        <p className="text-sm text-muted mb-3 mt-5">Ещё нет аккаунта?</p>
        <NavLink
          to="/register"
          className="inline-block w-full py-3 px-4 rounded-xl border border-theme text-theme font-medium hover:bg-surface-hover transition-colors"
        >
          Создать аккаунт
        </NavLink>
      </motion.div>

      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease }}
        className="text-xs text-muted text-center mt-8 leading-relaxed"
      >
        Входя в аккаунт, вы соглашаетесь с{' '}
        <a href="#" className="text-brand-primary hover:underline">условиями</a> и{' '}
        <a href="#" className="text-brand-primary hover:underline">политикой</a>
      </motion.p>
    </motion.div>
  );
}
