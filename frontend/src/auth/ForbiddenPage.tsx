import { Link } from 'react-router';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';

export function ForbiddenPage() {
  const { t } = useI18n();

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="forbidden-title">
        <div className="auth-toolbar">
          <LanguageSwitcher />
        </div>
        <p className="eyebrow">{t('auth.forbiddenEyebrow')}</p>
        <h1 id="forbidden-title">{t('auth.forbiddenTitle')}</h1>
        <p className="lede">{t('auth.forbiddenLede')}</p>
        <Link className="primary-button" to="/">{t('auth.goToPortal')}</Link>
      </section>
    </main>
  );
}
