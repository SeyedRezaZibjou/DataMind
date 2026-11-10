'use client';

import { Globe, Check } from 'lucide-react';
import { useI18n } from '@/components/providers/i18n-provider';
import { LANGUAGES, type Language } from '@/lib/i18n/translations';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-2.5" aria-label={t.language.switch}>
          <Globe className="h-[18px] w-[18px]" />
          <span className="text-sm font-medium">
            {LANGUAGES.find((l) => l.code === lang)?.nativeLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code as Language)}
            className="gap-2"
          >
            <span className="flex-1">{l.nativeLabel}</span>
            {lang === l.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
