import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LoginPage } from '../auth/LoginPage';
import { ProtectedAdminLayout } from '../auth/ProtectedAdminLayout';
import { adminRoutes, surfaceRoutes } from './routeMap';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedAdminLayout />}>
          {adminRoutes.map((route) => (
            <Route element={route.element} key={route.path} path={route.path} />
          ))}
        </Route>

        {surfaceRoutes.map((route) => (
          <Route element={route.element} key={route.path} path={route.path} />
        ))}

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
