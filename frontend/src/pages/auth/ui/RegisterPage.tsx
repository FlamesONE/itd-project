import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { REGISTER_MUTATION } from '@shared/api/graphql/auth';
import { useAuth } from '@app/providers/AuthProvider';
import { Button, Input, AppLogo, EmojiPicker } from '@shared/ui';

const ease = [0.22, 1, 0.36, 1] as const;

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'credentials' | 'otp' | 'profile'>('credentials');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const [emoji, setEmoji] = useState('😊');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const [registerMutation, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      login(data.register.accessToken, data.register.refreshToken);
      navigate('/');
    },
    onError: (err) => {
      setError(err.message || 'Ошибка регистрации');
    },
  });

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Введите email');
      return;
    }

    if (!email.includes('@')) {
      setError('Введите корректный email');
      return;
    }

    if (!password || password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Пароль должен содержать минимум одну заглавную букву');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Пароль должен содержать минимум одну строчную букву');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Пароль должен содержать минимум одну цифру');
      return;
    }

    alert(`Код подтверждения отправлен на ${email}\n\nКорректный код: 111111`);
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Введите полный код');
      return;
    }

    if (otpValue !== '111111') {
      setError('Неверный код подтверждения');
      return;
    }

    setStep('profile');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Введите ваше имя');
      return;
    }

    if (displayName.length < 2) {
      setError('Имя слишком короткое');
      return;
    }

    await registerMutation({
      variables: {
        input: {
          email,
          username: username || displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
          password,
          displayName,
          emoji,
        },
      },
    });
  };

  if (step === 'credentials') {
    return (
      <motion.div
        key="credentials-step"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-sm mx-auto"
      >
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease }}
          className="flex justify-center mb-10"
        >
          <AppLogo />
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-semibold text-theme mb-2">Создать аккаунт</h1>
          <p className="text-sm text-muted">Присоединяйтесь к сообществу</p>
        </motion.div>

        
        <motion.form
          onSubmit={handleCredentialsSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease }}
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
            <p className="mt-1.5 text-xs text-muted">
              Используется для входа и восстановления пароля
            </p>
          </div>

          <div>
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="h-12"
            />
            <p className="mt-1.5 text-xs text-muted">
              Минимум 8 символов, заглавная, строчная буквы и цифра
            </p>
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
          >
            Продолжить
          </Button>
        </motion.form>

        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex justify-center gap-2 mt-6"
        >
          <div className="w-6 h-1 rounded-full bg-brand-primary" />
          <div className="w-6 h-1 rounded-full bg-border" />
          <div className="w-6 h-1 rounded-full bg-border" />
        </motion.div>

        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-8 text-center text-muted text-sm"
        >
          Уже есть аккаунт?{' '}
          <NavLink to="/login" className="text-brand-primary hover:underline">
            Войти
          </NavLink>
        </motion.p>
      </motion.div>
    );
  }

  if (step === 'otp') {
    return (
      <motion.div
        key="otp-step"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-sm mx-auto"
      >
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease }}
          className="flex justify-center mb-10"
        >
          <AppLogo />
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-semibold text-theme mb-2">Подтверждение email</h1>
          <p className="text-sm text-muted">
            Введите код из письма, отправленного на
            <br />
            <span className="text-theme font-medium">{email}</span>
          </p>
        </motion.div>

        
        <motion.form
          onSubmit={handleOtpSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease }}
          className="space-y-6"
        >
          
          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <motion.input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value) {
                    const newOtp = [...otp];
                    newOtp[idx] = value;
                    setOtp(newOtp);
                    setError('');

                    if (idx < 5) {
                      const nextInput = e.target.parentElement?.children[idx + 1] as HTMLInputElement;
                      nextInput?.focus();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                    const prevInput = e.currentTarget.parentElement?.children[idx - 1] as HTMLInputElement;
                    prevInput?.focus();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                  const newOtp = [...otp];
                  pastedData.split('').forEach((char, i) => {
                    if (i < 6) newOtp[i] = char;
                  });
                  setOtp(newOtp);
                  setError('');
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.05, duration: 0.3, ease }}
                className="w-12 h-14 text-center text-xl font-semibold text-theme rounded-lg border-2 border-theme bg-surface focus:border-brand-primary focus:outline-none transition-colors"
              />
            ))}
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => {
                setStep('credentials');
                setOtp(['', '', '', '', '', '']);
                setError('');
              }}
            >
              Назад
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 font-medium"
            >
              Подтвердить
            </Button>
          </div>

          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-center"
          >
            <button
              type="button"
              onClick={() => alert(`Код отправлен повторно на ${email}\n\nКорректный код: 111111`)}
              className="text-sm text-muted hover:text-brand-primary transition-colors"
            >
              Отправить код повторно
            </button>
          </motion.div>
        </motion.form>

        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex justify-center gap-2 mt-6"
        >
          <div className="w-6 h-1 rounded-full bg-brand-primary" />
          <div className="w-6 h-1 rounded-full bg-brand-primary" />
          <div className="w-6 h-1 rounded-full bg-border" />
        </motion.div>

        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8 text-center text-muted text-sm"
        >
          Уже есть аккаунт?{' '}
          <NavLink to="/login" className="text-brand-primary hover:underline">
            Войти
          </NavLink>
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="profile-step"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.5, ease }}
      className="w-full max-w-sm mx-auto"
    >
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease }}
        className="flex justify-center mb-8"
      >
        <AppLogo />
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-semibold text-theme mb-2">
          Настройка профиля
        </h1>
        <p className="text-muted text-sm">
          Последний шаг — расскажите о себе
        </p>
      </motion.div>

      
      <motion.form
        onSubmit={handleProfileSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease }}
        className="space-y-6"
      >
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease }}
          className="flex flex-col items-center gap-4"
        >
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <div className="text-center">
            <p className="text-sm text-theme font-medium">Ваш эмоджи</p>
            <p className="text-xs text-muted mt-1">
              Заменяет аватарку в профиле
            </p>
          </div>
          
          <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-warning/10 border border-brand-warning/20 max-w-[280px]">
            <span className="text-base">⚠️</span>
            <p className="text-xs text-brand-warning leading-relaxed">
              Эмоджи нельзя будет изменить после регистрации. Выбирайте внимательно!
            </p>
          </div>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease }}
        >
          <Input
            type="text"
            placeholder="Имя"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            className="h-12"
          />
          <p className="mt-1.5 text-xs text-muted">
            Отображается в профиле и постах
          </p>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease }}
        >
          <Input
            type="text"
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
            autoComplete="username"
            className="h-12"
          />
          <p className="mt-1.5 text-xs text-muted">
            Необязательно. Только латиница и цифры
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: 1,
                y: 0,
                x: [0, -8, 8, -4, 4, 0]
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                opacity: { duration: 0.2 },
                y: { duration: 0.2 },
                x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
              }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg bg-brand-danger/10 border border-brand-danger/20">
                <p className="text-brand-danger text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease }}
          className="flex gap-3 pt-2"
        >
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            onClick={() => setStep('otp')}
          >
            Назад
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 font-medium"
            isLoading={loading}
            disabled={loading}
          >
            Создать
          </Button>
        </motion.div>
      </motion.form>

      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="flex justify-center gap-2 mt-6"
      >
        <div className="w-6 h-1 rounded-full bg-brand-primary" />
        <div className="w-6 h-1 rounded-full bg-brand-primary" />
        <div className="w-6 h-1 rounded-full bg-brand-primary" />
      </motion.div>

      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-xs text-muted mt-6 text-center leading-relaxed"
      >
        Нажимая «Создать», вы соглашаетесь с{' '}
        <a href="#" className="text-brand-primary hover:underline">условиями</a> и{' '}
        <a href="#" className="text-brand-primary hover:underline">политикой конфиденциальности</a>
      </motion.p>
    </motion.div>
  );
}
