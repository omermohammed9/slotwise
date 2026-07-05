import type { LucideIcon } from 'lucide-react';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { deleteSession } from '@/api/auth';
import { useSessionStore } from '@/auth/sessionStore';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

type NavItem = {
  label: string;
  labelKey: TranslationKey;
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
  const { t } = useI18n();
  const [theme, setTheme] = useState(() => window.localStorage.getItem('slotwise-theme') ?? 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('slotwise-theme', theme);
  }, [theme]);

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
            <p className="brand-subtitle">{t('app.brand.operations')}</p>
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
                <span>{t(item.labelKey)}</span>
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
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="account-panel" aria-label="Operator session">
          <div>
            <p className="eyebrow">{session?.role ?? t('app.session.operatorFallback')}</p>
            <p className="account-id">{session?.actorId ?? t('app.session.notSignedIn')}</p>
          </div>
          <button className="text-button" type="button" onClick={handleSignOut}>
            {t('app.session.signOut')}
          </button>
          <LanguageSwitcher />
          <button
            className="icon-button"
            type="button"
            aria-label={theme === 'dark' ? t('app.theme.light') : t('app.theme.dark')}
            title={theme === 'dark' ? t('app.theme.light') : t('app.theme.dark')}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </div>
      </aside>

      <main className="main-surface">
        <Outlet />
      </main>
    </div>
  );
}
