import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { acceptOperatorInvitation } from '@/api/auth';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';

export function OperatorInvitationPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await acceptOperatorInvitation({ token, password });

    setIsSubmitting(false);
    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setAccepted(true);
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="operator-invitation-title">
        <div className="auth-toolbar">
          <LanguageSwitcher />
        </div>
        <div className="auth-mark" aria-hidden="true">
          {accepted ? <CheckCircle2 size={24} /> : <KeyRound size={24} />}
        </div>
        <p className="eyebrow">{t('auth.operatorInvitation')}</p>
        <h1 id="operator-invitation-title">{t('auth.invitationTitle')}</h1>
        <p className="lede">{t('auth.invitationLede')}</p>

        {accepted ? (
          <div className="auth-result" role="status">
            <p className="form-success">{t('auth.invitationAccepted')}</p>
            <Link className="primary-button auth-submit" to="/login">
              {t('home.signIn')}
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>{t('auth.invitationToken')}</span>
              <input
                autoComplete="one-time-code"
                name="token"
                onChange={(event) => setToken(event.target.value)}
                required
                type="text"
                value={token}
              />
            </label>

            <label className="form-field">
              <span>{t('auth.newPassword')}</span>
              <input
                autoComplete="new-password"
                minLength={8}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
              <KeyRound size={17} aria-hidden="true" />
              {isSubmitting ? t('auth.accepting') : t('auth.acceptInvitation')}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
