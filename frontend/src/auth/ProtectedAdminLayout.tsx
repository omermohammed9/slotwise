import { Navigate, useLocation } from 'react-router';
import { AppShell } from '../app/AppShell';
import { adminNavItems, adminRoutes, surfaceNavItems } from '../app/routeMap';
import { useSessionStore } from './sessionStore';
import { useSessionRevalidation } from './useSessionRevalidation';
import type { Role } from '../api/types';

type OperatorRole = Exclude<Role, 'customer'>;

export function ProtectedAdminLayout() {
  const { clearSession, session, setNotice, setSession, token } = useSessionStore();
  const location = useLocation();
  const pathRole = location.pathname.startsWith('/owner')
    ? 'owner'
    : location.pathname.startsWith('/staff')
      ? 'staff'
      : location.pathname.startsWith('/admin')
        ? 'admin'
        : null;
  const shouldRevalidateSession = !session || Boolean(session.actorType || session.expiresAt || session.sessionId);
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
    if (isInitialCheckPending) {
      return (
        <main className="auth-page">
          <section className="auth-panel" aria-labelledby="operator-session-check-title">
            <p className="eyebrow">Operator access</p>
            <h1 id="operator-session-check-title">Checking your current session</h1>
            <p className="lede">Slotwise is checking for an active browser session before loading the admin workspace.</p>
          </section>
        </main>
      );
    }

    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (isInitialCheckPending) {
    return (
      <main className="auth-page">
        <section className="auth-panel" aria-labelledby="operator-session-check-title">
          <p className="eyebrow">Operator access</p>
          <h1 id="operator-session-check-title">Checking your current session</h1>
          <p className="lede">Slotwise is revalidating this browser session before loading the admin workspace.</p>
        </section>
      </main>
    );
  }

  const matchedRoute = adminRoutes.find((route) => route.path === location.pathname);
  if (pathRole === 'owner' && session.role !== 'owner') return <Navigate replace to="/forbidden" />;
  if (pathRole === 'staff' && session.role !== 'staff') return <Navigate replace to="/forbidden" />;
  if (pathRole === 'admin' && matchedRoute?.roles && !matchedRoute.roles.includes(session.role as OperatorRole)) {
    return <Navigate replace to="/forbidden" />;
  }

  const operatorRole = session.role as OperatorRole;
  const roleHome = operatorRole === 'owner' ? '/owner' : operatorRole === 'admin' ? '/admin' : '/staff';
  const navItems = adminNavItems.filter((route) => {
    if (!route.roles?.includes(operatorRole)) return false;
    if (operatorRole === 'owner') return route.path.startsWith('/owner') || route.path.startsWith('/admin');
    return route.path.startsWith(roleHome) || (operatorRole === 'staff' && route.path.startsWith('/admin') && route.roles.includes('staff'));
  });

  return <AppShell navItems={navItems.length > 0 ? navItems : adminNavItems.filter((route) => route.roles?.includes(operatorRole))} surfaceItems={surfaceNavItems} />;
}
