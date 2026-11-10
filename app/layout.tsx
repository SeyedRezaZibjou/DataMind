import type { Metadata } from 'next';
import { Inter, Vazirmatn } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const vazirmatn = Vazirmatn({ subsets: ['arabic', 'latin'], variable: '--font-vazirmatn', display: 'swap' });

export const metadata: Metadata = {
  title: 'DataMind — Turn Your Data into Actionable Insights',
  description:
    'DataMind is an intelligent data analysis assistant. Upload Excel and CSV datasets, explore data, evaluate quality, and visualize patterns.',
  openGraph: {
    title: 'DataMind — Turn Your Data into Actionable Insights',
    description: 'Upload, explore, evaluate, and visualize your datasets.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${vazirmatn.variable} font-sans antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
