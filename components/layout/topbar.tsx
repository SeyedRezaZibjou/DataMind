'use client';

import { usePathname } from 'next/navigation';
import { Menu, User } from 'lucide-react';
import { useI18n } from '@/components/providers/i18n-provider';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TITLE_KEYS: Record<string, string> = {
  '/': 'dashboard',
  '/upload': 'upload',
  '/overview': 'overview',
  '/quality': 'quality',
  '/visualization': 'visualization',
  '/assistant': 'assistant',
  '/reports': 'reports',
  '/settings': 'settings',
  '/about': 'about',
};

export function TopBar({ onMenuClick, ...rest }: { onMenuClick: () => void } & React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { t } = useI18n();
  const titleKey = TITLE_KEYS[pathname] ?? 'dashboard';
  const rawTitle = t.nav[titleKey as keyof typeof t.nav];
  const title = typeof rawTitle === 'string' ? rawTitle : t.nav.dashboard;

  return (
    <header {...rest} className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 lg:hidden"
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuLabel>
              <p className="text-xs text-muted-foreground">{t.topbar.signedInAs}</p>
              <p className="text-sm font-medium">{t.topbar.analyst}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-sm">{t.topbar.profile}</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-sm">{t.topbar.account}</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-sm">{t.topbar.preferences}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
