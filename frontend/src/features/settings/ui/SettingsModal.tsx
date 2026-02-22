import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
  Settings,
  User,
  Shield,
  Bell,
  KeyRound,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

import { useSettings, SettingsSection } from '../model/SettingsContext';
import { useAuth } from '@app/providers/AuthProvider';
import { useTheme } from '@app/providers/ThemeProvider';
import { Button, Input, Select } from '@shared/ui';
import { ChangePasswordMutation, UpdateEmailMutation, UpdateUsernameMutation } from '@shared/api/graphql/auth';
import { UpdateProfileMutation } from '@shared/api/graphql/users';

const ease = [0.22, 1, 0.36, 1] as const;

const menuItems: { id: SettingsSection; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'Общее', icon: Settings },
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'privacy', label: 'Приватность', icon: Shield },
  { id: 'notifications', label: 'Уведомления', icon: Bell },
  { id: 'account', label: 'Учетная запись', icon: KeyRound },
];

export function SettingsModal() {
  const { isOpen, closeSettings, activeSection, setActiveSection } = useSettings();

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && closeSettings()}>
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease }}
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && closeSettings()}
              >
                <div
                  className="w-full max-w-[700px] h-[min(600px,85vh)] bg-surface border border-theme rounded-2xl shadow-2xl overflow-hidden flex"
                  onClick={(e) => e.stopPropagation()}
                >
                  
                  <div className="w-[200px] border-r border-theme flex flex-col">
                    <div className="p-4 flex items-center justify-between border-b border-theme">
                      <DialogPrimitive.Title className="font-semibold text-theme">
                        Настройки
                      </DialogPrimitive.Title>
                      <DialogPrimitive.Close asChild>
                        <button
                          onClick={closeSettings}
                          className="p-1.5 -m-1.5 rounded-full text-muted hover:text-theme hover:bg-surface-hover transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </DialogPrimitive.Close>
                    </div>
                    <nav className="flex-1 p-2 space-y-1">
                      {menuItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            activeSection === item.id
                              ? 'bg-brand-primary/10 text-brand-primary'
                              : 'text-muted hover:text-theme hover:bg-surface-hover'
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="h-full"
                      >
                        {activeSection === 'general' && <GeneralSection />}
                        {activeSection === 'profile' && <ProfileSection />}
                        {activeSection === 'privacy' && <PrivacySection />}
                        {activeSection === 'notifications' && <NotificationsSection />}
                        {activeSection === 'account' && <AccountSection />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-6 py-4 border-b border-theme">
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-theme last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="font-medium text-theme">{label}</p>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-brand-primary' : 'bg-surface-hover',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={clsx(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  );
}

function GeneralSection() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'system', label: 'Системная', icon: <Monitor className="w-4 h-4" /> },
    { value: 'light', label: 'Светлая', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Тёмная', icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <div>
      <SectionHeader title="Общее" />
      <div>
        <SettingRow label="Тема" description="Выберите тему оформления приложения">
          <Select
            value={theme}
            onChange={(value) => setTheme(value as 'system' | 'light' | 'dark')}
            options={themeOptions}
          />
        </SettingRow>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const [updateProfile] = useMutation(UpdateProfileMutation);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        variables: {
          input: {
            displayName: displayName.trim() || undefined,
            bio: bio.trim() || undefined,
          },
        },
      });
      await refreshUser?.();
      toast.success('Профиль обновлен');
    } catch (error) {
      toast.error('Ошибка при обновлении профиля');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    displayName !== (user?.displayName || '') || bio !== (user?.bio || '');

  return (
    <div>
      <SectionHeader title="Профиль" />
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-theme mb-1.5">
            Отображаемое имя
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ваше имя"
            maxLength={50}
          />
          <p className="text-xs text-muted mt-1">
            Это имя будет отображаться в вашем профиле
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme mb-1.5">
            О себе
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите о себе..."
            maxLength={160}
            rows={3}
            className="w-full bg-transparent border border-theme rounded-xl px-4 py-3 text-theme placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none"
          />
          <p className="text-xs text-muted mt-1">
            {bio.length}/160 символов
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const PRIVACY_STORAGE_KEY = 'itd_privacy_settings';

interface PrivacySettings {
  privateAccount: boolean;
  showOnlineStatus: boolean;
  messagePermission: 'everyone' | 'followers' | 'nobody';
}

function getPrivacySettings(): PrivacySettings {
  try {
    const stored = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {
    privateAccount: false,
    showOnlineStatus: true,
    messagePermission: 'everyone',
  };
}

function savePrivacySettings(settings: PrivacySettings) {
  localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(settings));
}

function PrivacySection() {
  const [settings, setSettings] = useState<PrivacySettings>(getPrivacySettings);

  const updateSetting = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    savePrivacySettings(newSettings);
  };

  return (
    <div>
      <SectionHeader title="Приватность" />
      <div>
        <SettingRow
          label="Закрытый аккаунт"
          description="Только подписчики смогут видеть ваши посты"
        >
          <Toggle
            checked={settings.privateAccount}
            onChange={(checked) => updateSetting('privateAccount', checked)}
          />
        </SettingRow>

        <SettingRow
          label="Показывать онлайн-статус"
          description="Другие пользователи увидят, когда вы в сети"
        >
          <Toggle
            checked={settings.showOnlineStatus}
            onChange={(checked) => updateSetting('showOnlineStatus', checked)}
          />
        </SettingRow>

        <SettingRow
          label="Кто может писать сообщения"
          description="Ограничьте, кто может отправлять вам сообщения"
        >
          <Select
            value={settings.messagePermission}
            onChange={(value) => updateSetting('messagePermission', value as PrivacySettings['messagePermission'])}
            options={[
              { value: 'everyone', label: 'Все' },
              { value: 'followers', label: 'Подписчики' },
              { value: 'nobody', label: 'Никто' },
            ]}
          />
        </SettingRow>
      </div>
    </div>
  );
}

const NOTIFICATIONS_STORAGE_KEY = 'itd_notification_settings';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  likesNotif: boolean;
  commentsNotif: boolean;
  followsNotif: boolean;
  mentionsNotif: boolean;
}

function getNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {
    pushEnabled: true,
    emailEnabled: false,
    likesNotif: true,
    commentsNotif: true,
    followsNotif: true,
    mentionsNotif: true,
  };
}

function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(settings));
}

function NotificationsSection() {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);

  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  return (
    <div>
      <SectionHeader title="Уведомления" />
      <div>
        <SettingRow
          label="Push-уведомления"
          description="Получать уведомления в браузере"
        >
          <Toggle
            checked={settings.pushEnabled}
            onChange={(checked) => updateSetting('pushEnabled', checked)}
          />
        </SettingRow>

        <SettingRow
          label="Email-уведомления"
          description="Получать уведомления на почту"
        >
          <Toggle
            checked={settings.emailEnabled}
            onChange={(checked) => updateSetting('emailEnabled', checked)}
          />
        </SettingRow>

        <div className="px-6 py-3 bg-surface-hover/50">
          <p className="text-sm font-medium text-muted">Типы уведомлений</p>
        </div>

        <SettingRow label="Лайки" description="Когда кто-то лайкает ваш пост">
          <Toggle
            checked={settings.likesNotif}
            onChange={(checked) => updateSetting('likesNotif', checked)}
          />
        </SettingRow>

        <SettingRow label="Комментарии" description="Новые комментарии к вашим постам">
          <Toggle
            checked={settings.commentsNotif}
            onChange={(checked) => updateSetting('commentsNotif', checked)}
          />
        </SettingRow>

        <SettingRow label="Подписки" description="Когда кто-то подписывается на вас">
          <Toggle
            checked={settings.followsNotif}
            onChange={(checked) => updateSetting('followsNotif', checked)}
          />
        </SettingRow>

        <SettingRow label="Упоминания" description="Когда вас упоминают в постах">
          <Toggle
            checked={settings.mentionsNotif}
            onChange={(checked) => updateSetting('mentionsNotif', checked)}
          />
        </SettingRow>
      </div>
    </div>
  );
}

function AccountSection() {
  const { user, logout, refreshUser } = useAuth();
  const { closeSettings } = useSettings();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [changePassword] = useMutation(ChangePasswordMutation);
  const [updateEmail] = useMutation(UpdateEmailMutation);
  const [updateUsername] = useMutation(UpdateUsernameMutation);

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Введите новый email');
      return;
    }

    setIsChangingEmail(true);
    try {
      await (updateEmail as any)({
        variables: {
          input: {
            newEmail: newEmail.trim(),
            password: emailPassword,
          },
        },
      });
      await refreshUser?.();
      toast.success('Email успешно изменен');
      setShowEmailForm(false);
      setNewEmail('');
      setEmailPassword('');
    } catch (error: any) {
      const message = error?.graphQLErrors?.[0]?.message || 'Ошибка при смене email';
      toast.error(message);
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      toast.error('Введите новое имя пользователя');
      return;
    }

    setIsChangingUsername(true);
    try {
      await (updateUsername as any)({
        variables: {
          input: {
            newUsername: newUsername.trim(),
            password: usernamePassword,
          },
        },
      });
      await refreshUser?.();
      toast.success('Имя пользователя успешно изменено');
      setShowUsernameForm(false);
      setNewUsername('');
      setUsernamePassword('');
    } catch (error: any) {
      const message = error?.graphQLErrors?.[0]?.message || 'Ошибка при смене имени пользователя';
      toast.error(message);
    } finally {
      setIsChangingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }

    setIsChangingPassword(true);
    try {
      await (changePassword as any)({
        variables: {
          input: {
            currentPassword,
            newPassword,
          },
        },
      });
      toast.success('Пароль успешно изменен');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error?.graphQLErrors?.[0]?.message || 'Ошибка при смене пароля';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    closeSettings();
    logout();
  };

  return (
    <div>
      <SectionHeader title="Учётная запись" />
      <div>
        
        <div className="px-6 py-4 border-b border-theme">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-theme">Email</p>
              <p className="text-sm text-muted">{user?.email}</p>
            </div>
            {!showEmailForm && (
              <Button variant="outline" size="sm" onClick={() => setShowEmailForm(true)}>
                Изменить
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showEmailForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2"
              >
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Новый email"
                />
                <Input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Текущий пароль для подтверждения"
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleChangeEmail}
                    disabled={!newEmail || !emailPassword || isChangingEmail}
                    isLoading={isChangingEmail}
                    size="sm"
                  >
                    Сохранить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEmailForm(false);
                      setNewEmail('');
                      setEmailPassword('');
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        
        <div className="px-6 py-4 border-b border-theme">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-theme">Имя пользователя</p>
              <p className="text-sm text-muted">@{user?.username}</p>
            </div>
            {!showUsernameForm && (
              <Button variant="outline" size="sm" onClick={() => setShowUsernameForm(true)}>
                Изменить
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showUsernameForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2"
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">@</span>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="новое_имя"
                    className="pl-7"
                    maxLength={20}
                  />
                </div>
                <Input
                  type="password"
                  value={usernamePassword}
                  onChange={(e) => setUsernamePassword(e.target.value)}
                  placeholder="Текущий пароль для подтверждения"
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleChangeUsername}
                    disabled={!newUsername || !usernamePassword || isChangingUsername}
                    isLoading={isChangingUsername}
                    size="sm"
                  >
                    Сохранить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowUsernameForm(false);
                      setNewUsername('');
                      setUsernamePassword('');
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        
        <div className="px-6 py-4 border-b border-theme">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-theme">Пароль</p>
              <p className="text-sm text-muted">Изменить пароль для входа</p>
            </div>
            {!showPasswordForm && (
              <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                Изменить
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showPasswordForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2"
              >
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Текущий пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-theme"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-theme"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Подтвердите новый пароль"
                />

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleChangePassword}
                    disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                    isLoading={isChangingPassword}
                    size="sm"
                  >
                    Сохранить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 py-3 bg-surface-hover/50">
          <p className="text-sm font-medium text-brand-danger">Опасная зона</p>
        </div>

        <div className="px-6 py-4 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти из аккаунта
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-brand-danger hover:text-brand-danger hover:bg-brand-danger/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить аккаунт
          </Button>
        </div>
      </div>
    </div>
  );
}
