import { FormEvent, useState } from 'react';
import { MailCheck, Send } from 'lucide-react';
import { Link } from 'react-router';
import { requestOperatorPasswordReset } from '../api/auth';

export function OperatorPasswordResetRequestPage() {
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
        <div className="auth-mark" aria-hidden="true">
          <MailCheck size={24} />
        </div>
        <p className="eyebrow">Password reset</p>
        <h1 id="operator-reset-title">Reset operator access</h1>
        <p className="lede">Enter your operator username. If the account is active, Slotwise will send a reset token.</p>

        {requested ? (
          <div className="auth-result" role="status">
            <p className="form-success">If that operator account is active, a reset message is on the way.</p>
            <Link className="secondary-button auth-submit" to="/operators/password-reset/complete">
              Enter reset token
            </Link>
          </div>
        ) : (
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

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
              <Send size={17} aria-hidden="true" />
              {isSubmitting ? 'Sending' : 'Send reset token'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
