import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LoginPage } from '../auth/LoginPage';
import { ForbiddenPage } from '../auth/ForbiddenPage';
import { OperatorInvitationPage } from '../auth/OperatorInvitationPage';
import { OperatorPasswordResetCompletePage } from '../auth/OperatorPasswordResetCompletePage';
import { OperatorPasswordResetRequestPage } from '../auth/OperatorPasswordResetRequestPage';
import { ProtectedAdminLayout } from '../auth/ProtectedAdminLayout';
import { HomePage } from './HomePage';
import { useSessionStore } from '../auth/sessionStore';
import { adminRoutes, surfaceRoutes } from './routeMap';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/operators/invitations/accept" element={<OperatorInvitationPage />} />
        <Route path="/operators/password-reset" element={<OperatorPasswordResetRequestPage />} />
        <Route path="/operators/password-reset/complete" element={<OperatorPasswordResetCompletePage />} />

        <Route element={<ProtectedAdminLayout />}>
          {adminRoutes.map((route) => (
            <Route element={route.element} key={route.path} path={route.path} />
          ))}
        </Route>

        {surfaceRoutes.map((route) => (
          <Route element={route.element} key={route.path} path={route.path} />
        ))}

        <Route path="*" element={<RoleHomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

function RoleHomeRedirect() {
  const { session } = useSessionStore();
  const role = session?.role;
  return <Navigate to={role === 'owner' ? '/owner' : role === 'staff' ? '/staff' : '/admin'} replace />;
}
