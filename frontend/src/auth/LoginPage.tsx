import { FormEvent, useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { createOperatorSession } from '../api/auth';
import { useSessionStore } from './sessionStore';

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { clearNotice, notice, session, setSession } = useSessionStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = (location.state as LoginLocationState | null)?.from?.pathname ?? '/admin';

  if (session && session.role !== 'customer') {
    return <Navigate replace to={destination} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    clearNotice();
    setIsSubmitting(true);

    const response = await createOperatorSession({
      password,
      username,
    }).catch((requestError: unknown) => ({
      error: {
        message: requestError instanceof Error ? requestError.message : 'Unable to reach Slotwise.',
      },
      success: false as const,
    }));

    setIsSubmitting(false);
    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSession(response.data);
    navigate(destination, { replace: true });
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="operator-login-title">
        <div className="auth-mark" aria-hidden="true">
          <ShieldCheck size={24} />
        </div>
        <p className="eyebrow">Operator access</p>
        <h1 id="operator-login-title">Sign in to Slotwise</h1>
        <p className="lede">Use your owner, admin, or staff credentials. Slotwise keeps your signed-in session in a secure browser cookie.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Username</span>
            <input
              autoComplete="username"
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              required
              type="text"
              value={username}
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {notice ? (
            <p className={`form-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
              {notice.message}
            </p>
          ) : null}
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
            <LockKeyhole size={17} aria-hidden="true" />
            {isSubmitting ? 'Signing in' : 'Sign in'}
          </button>
          <Link className="auth-inline-link" to="/operators/password-reset">
            Reset operator password
          </Link>
        </form>
      </section>
    </main>
  );
}
