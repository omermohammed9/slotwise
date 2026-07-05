import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLocale, supportedLocales, translations } from '@/i18n/translations';
import type { Locale, TranslationKey } from '@/i18n/translations';

const localeStorageKey = 'slotwise-locale';

type I18nContextValue = {
  dir: 'ltr' | 'rtl';
  formatNumber: (value: number) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function normalizeLocale(value: string | null): Locale {
  return supportedLocales.some((locale) => locale.code === value) ? (value as Locale) : defaultLocale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => normalizeLocale(window.localStorage.getItem(localeStorageKey)));

  const dir = supportedLocales.find((supportedLocale) => supportedLocale.code === locale)?.dir ?? 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.documentElement.dataset.locale = locale;
    window.localStorage.setItem(localeStorageKey, locale);
  }, [dir, locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      dir,
      formatNumber: (value) => new Intl.NumberFormat(locale).format(value),
      locale,
      setLocale: setLocaleState,
      t: (key) => translations[locale][key] ?? translations[defaultLocale][key] ?? key,
    }),
    [dir, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error('useI18n must be used inside I18nProvider.');
  }

  return value;
}
