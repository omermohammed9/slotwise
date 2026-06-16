import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { deleteSession } from '../api/auth';
import { useSessionStore } from '../auth/sessionStore';

type NavItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  end?: boolean;
  navPath?: string;
};

type AppShellProps = {
  navItems: NavItem[];
  surfaceItems: NavItem[];
};

export function AppShell({ navItems, surfaceItems }: AppShellProps) {
  const { clearNotice, clearSession, session, token } = useSessionStore();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      if (token) {
        await deleteSession(token);
      }
    } finally {
      clearNotice();
      clearSession();
      navigate('/login', { replace: true });
    }
  }

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
                to={item.navPath ?? item.path}
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
                to={item.navPath ?? item.path}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="account-panel" aria-label="Operator session">
          <div>
            <p className="eyebrow">{session?.role ?? 'Operator'}</p>
            <p className="account-id">{session?.actorId ?? 'Not signed in'}</p>
          </div>
          <button className="text-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-surface">
        <Outlet />
      </main>
    </div>
  );
}
