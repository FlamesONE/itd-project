import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type SettingsSection = 'general' | 'profile' | 'privacy' | 'notifications' | 'account';

interface SettingsContextValue {
  isOpen: boolean;
  activeSection: SettingsSection;
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  setActiveSection: (section: SettingsSection) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const openSettings = useCallback((section: SettingsSection = 'general') => {
    setActiveSection(section);
    setIsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        isOpen,
        activeSection,
        openSettings,
        closeSettings,
        setActiveSection,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
