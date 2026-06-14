import { Navigate, useLocation } from 'react-router';
import { AppShell } from '../app/AppShell';
import { adminNavItems, surfaceNavItems } from '../app/routeMap';
import { useSessionStore } from './sessionStore';

export function ProtectedAdminLayout() {
  const { session } = useSessionStore();
  const location = useLocation();

  if (!session || session.role === 'customer') {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <AppShell navItems={adminNavItems} surfaceItems={surfaceNavItems} />;
}
