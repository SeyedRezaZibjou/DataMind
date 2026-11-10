'use client';

import { ThemeProvider } from 'next-themes';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { DatasetProvider } from '@/components/providers/dataset-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <I18nProvider>
        <DatasetProvider>{children}</DatasetProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
