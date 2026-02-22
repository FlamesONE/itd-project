import { useState } from 'react';
import { useAuth } from '@app/providers/AuthProvider';
import { Button } from '@shared/ui';
import { useMutation } from '@apollo/client/react';
import { UPDATE_PROFILE_MUTATION } from '@shared/api/graphql/users';
import type { User } from '@entities/user';

export function SettingsPage() {
  const { user: authUser, logout } = useAuth();
  const user = authUser as User | null;
  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION);
  const [wallPrivacy, setWallPrivacy] = useState<'public' | 'followers' | 'private'>(user?.wallPrivacy || 'public');

  const handleWallPrivacyChange = async (value: 'public' | 'followers' | 'private') => {
    setWallPrivacy(value);
    try {
      await updateProfile({
        variables: {
          input: {
            wallPrivacy: value,
          } as any,
        },
      });
    } catch (error) {
      console.error('Failed to update wall privacy:', error);
      setWallPrivacy(user?.wallPrivacy || 'public');
    }
  };

  return (
    <div>
      
      <header className="sticky top-0 z-10 bg-theme/80 backdrop-blur-md border-b border-theme">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Настройки</h1>
        </div>
      </header>

      
      <div className="divide-y divide-theme">
        
        <section className="p-4">
          <h2 className="text-lg font-bold mb-4">Аккаунт</h2>
          <div className="space-y-4">
            <SettingItem
              label="Email"
              value={user?.email || ''}
              description="Ваш email для входа"
            />
            <SettingItem
              label="Имя пользователя"
              value={`@${user?.username || ''}`}
              description="Ваш уникальный идентификатор"
            />
          </div>
        </section>

        
        <section className="p-4">
          <h2 className="text-lg font-bold mb-4">Профиль</h2>
          <Button variant="outline">Редактировать профиль</Button>
        </section>

        
        <section className="p-4">
          <h2 className="text-lg font-bold mb-4">Конфиденциальность</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Приватность стены</p>
              <p className="text-sm text-muted mb-3">Кто может писать на вашей стене</p>
              <div className="space-y-2">
                <WallPrivacyOption
                  value="public"
                  label="Все"
                  description="Любой может писать на вашей стене"
                  checked={wallPrivacy === 'public'}
                  onChange={() => handleWallPrivacyChange('public')}
                />
                <WallPrivacyOption
                  value="followers"
                  label="Подписчики"
                  description="Только ваши подписчики могут писать на стене"
                  checked={wallPrivacy === 'followers'}
                  onChange={() => handleWallPrivacyChange('followers')}
                />
                <WallPrivacyOption
                  value="private"
                  label="Только я"
                  description="Только вы можете писать на своей стене"
                  checked={wallPrivacy === 'private'}
                  onChange={() => handleWallPrivacyChange('private')}
                />
              </div>
            </div>
          </div>
        </section>

        
        <section className="p-4">
          <h2 className="text-lg font-bold mb-4">Уведомления</h2>
          <div className="space-y-4">
            <SettingToggle
              label="Push-уведомления"
              description="Получать уведомления в браузере"
              defaultChecked={true}
            />
            <SettingToggle
              label="Email-уведомления"
              description="Получать уведомления на email"
              defaultChecked={false}
            />
          </div>
        </section>

        
        <section className="p-4">
          <h2 className="text-lg font-bold mb-4 text-brand-danger">Опасная зона</h2>
          <div className="space-y-4">
            <Button variant="outline" onClick={logout}>
              Выйти из аккаунта
            </Button>
            <Button variant="ghost" className="text-brand-danger hover:text-brand-danger-hover">
              Удалить аккаунт
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

interface SettingItemProps {
  label: string;
  value: string;
  description?: string;
}

function SettingItem({ label, value, description }: SettingItemProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <span className="text-muted">{value}</span>
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  description?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

function SettingToggle({ label, description, defaultChecked, onChange }: SettingToggleProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          defaultChecked={defaultChecked}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
      </label>
    </div>
  );
}

interface WallPrivacyOptionProps {
  value: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function WallPrivacyOption({ label, description, checked, onChange }: WallPrivacyOptionProps) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-theme hover:bg-surface-hover cursor-pointer transition-colors">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-1 w-4 h-4 text-brand-primary focus:ring-2 focus:ring-brand-primary"
      />
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
    </label>
  );
}
