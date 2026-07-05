import { FormEvent, useState } from 'react';
import { MailCheck, Send } from 'lucide-react';
import { Link } from 'react-router';
import { requestOperatorPasswordReset } from '@/api/auth';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';

export function OperatorPasswordResetRequestPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await requestOperatorPasswordReset({ username });

    setIsSubmitting(false);
    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setRequested(true);
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="operator-reset-title">
        <div className="auth-toolbar">
          <LanguageSwitcher />
        </div>
        <div className="auth-mark" aria-hidden="true">
          <MailCheck size={24} />
        </div>
        <p className="eyebrow">{t('auth.passwordReset')}</p>
        <h1 id="operator-reset-title">{t('auth.resetRequestTitle')}</h1>
        <p className="lede">{t('auth.resetRequestLede')}</p>

        {requested ? (
          <div className="auth-result" role="status">
            <p className="form-success">{t('auth.resetRequested')}</p>
            <Link className="secondary-button auth-submit" to="/operators/password-reset/complete">
              {t('auth.enterResetToken')}
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>{t('auth.username')}</span>
              <input
                autoComplete="username"
                name="username"
                onChange={(event) => setUsername(event.target.value)}
                required
                type="text"
                value={username}
              />
            </label>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
              <Send size={17} aria-hidden="true" />
              {isSubmitting ? t('auth.sending') : t('auth.sendResetToken')}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
