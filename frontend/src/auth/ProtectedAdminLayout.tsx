import { Navigate, useLocation } from 'react-router';
import { AppShell } from '../app/AppShell';
import { adminNavItems, surfaceNavItems } from '../app/routeMap';
import { useSessionStore } from './sessionStore';
import { useSessionRevalidation } from './useSessionRevalidation';

export function ProtectedAdminLayout() {
  const { clearSession, session, setNotice, setSession, token } = useSessionStore();
  const location = useLocation();
  const shouldRevalidateSession = Boolean(token && session && (session.actorType || session.expiresAt || session.sessionId));
  const { isInitialCheckPending } = useSessionRevalidation({
    clearSession,
    enabled: shouldRevalidateSession,
    invalidMessage: 'Your operator session expired. Sign in again to keep working.',
    session,
    setNotice,
    setSession,
    token,
  });

  if (!session || session.role === 'customer') {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (isInitialCheckPending) {
    return (
      <main className="auth-page">
        <section className="auth-panel" aria-labelledby="operator-session-check-title">
          <p className="eyebrow">Operator access</p>
          <h1 id="operator-session-check-title">Checking your current session</h1>
          <p className="lede">Slotwise is revalidating this memory-only session before loading the admin workspace.</p>
        </section>
      </main>
    );
  }

  return <AppShell navItems={adminNavItems} surfaceItems={surfaceNavItems} />;
}
