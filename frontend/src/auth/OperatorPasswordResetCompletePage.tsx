import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { completeOperatorPasswordReset } from '../api/auth';

export function OperatorPasswordResetCompletePage() {
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await completeOperatorPasswordReset({ token, password });

    setIsSubmitting(false);
    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCompleted(true);
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="operator-reset-complete-title">
        <div className="auth-mark" aria-hidden="true">
          {completed ? <CheckCircle2 size={24} /> : <KeyRound size={24} />}
        </div>
        <p className="eyebrow">Password reset</p>
        <h1 id="operator-reset-complete-title">Create a new password</h1>
        <p className="lede">Use the reset token from your operator password reset message.</p>

        {completed ? (
          <div className="auth-result" role="status">
            <p className="form-success">Password reset complete. You can now sign in.</p>
            <Link className="primary-button auth-submit" to="/login">
              Sign in
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Reset token</span>
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
              <span>New password</span>
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
              {isSubmitting ? 'Saving' : 'Reset password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
