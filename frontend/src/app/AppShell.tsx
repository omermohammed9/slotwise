import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

type NavItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  end?: boolean;
};

type AppShellProps = {
  navItems: NavItem[];
  surfaceItems: NavItem[];
};

export function AppShell({ navItems, surfaceItems }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>
          <div>
            <p className="brand-name">Slotwise</p>
            <p className="brand-subtitle">Operations</p>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) => (isActive ? 'nav-item nav-item-active' : 'nav-item')}
                end={item.end}
                key={item.label}
                to={item.path}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <nav className="surface-nav" aria-label="Public surfaces">
          {surfaceItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) => (isActive ? 'surface-link surface-link-active' : 'surface-link')}
                key={item.label}
                to={item.path}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="main-surface">
        <Outlet />
      </main>
    </div>
  );
}
