import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './AppShell';
import { adminNavItems, appRoutes, surfaceNavItems } from './routeMap';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell navItems={adminNavItems} surfaceItems={surfaceNavItems} />}>
          <Route index element={<Navigate to="/admin" replace />} />
          {appRoutes.map((route) => (
            <Route element={route.element} key={route.path} path={route.path} />
          ))}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
