import { ReactNode } from 'react';
import { ApolloProvider } from './ApolloProvider';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { SettingsProvider, SettingsModal } from '@features/settings';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ApolloProvider>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <SettingsModal />
          </SettingsProvider>
        </AuthProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
}
