import { Link } from 'react-router';

export function ForbiddenPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="forbidden-title">
        <p className="eyebrow">Access denied</p>
        <h1 id="forbidden-title">This portal is not available for your role.</h1>
        <p className="lede">Use the portal assigned to your operator account.</p>
        <Link className="primary-button" to="/">Go to my portal</Link>
      </section>
    </main>
  );
}
