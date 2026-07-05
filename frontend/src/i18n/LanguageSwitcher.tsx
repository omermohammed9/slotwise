import { Languages } from 'lucide-react';
import { supportedLocales } from '@/i18n/translations';
import { useI18n } from '@/i18n/I18nProvider';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="language-switcher">
      <Languages size={16} aria-hidden="true" />
      <span>{t('app.language')}</span>
      <select
        aria-label={t('app.language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
      >
        {supportedLocales.map((supportedLocale) => (
          <option key={supportedLocale.code} value={supportedLocale.code}>
            {t(supportedLocale.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}

