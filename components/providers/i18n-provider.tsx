'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { dict, type Language, type Direction, dirFor } from '@/lib/i18n/translations';

type I18nContextValue = {
  lang: Language;
  dir: Direction;
  setLang: (lang: Language) => void;
  t: ReturnType<typeof makeTranslator>;
};

const STORAGE_KEY = 'datamind-lang';

function makeTranslator(lang: Language) {
  const d = dict[lang];
  const en = dict.en;
  const t = new Proxy(d, {
    get(target, prop: string) {
      const val = (target as Record<string, unknown>)[prop];
      if (val !== undefined) return val;
      return (en as Record<string, unknown>)[prop];
    },
  }) as unknown;
  return t as typeof d;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && stored in dict) setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = dirFor(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, dir: dirFor(lang), setLang, t: makeTranslator(lang) }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
