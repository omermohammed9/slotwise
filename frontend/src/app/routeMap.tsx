import {
  CalendarDays,
  Clock3,
  LayoutDashboard,
  MonitorSmartphone,
  Settings,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { BookingsPage } from '../features/admin/BookingsPage';
import { CustomersPage } from '../features/admin/CustomersPage';
import { DashboardPage } from '../features/admin/DashboardPage';
import { ResourcesPage } from '../features/admin/ResourcesPage';
import { SettingsPage } from '../features/admin/SettingsPage';
import { TimelinePage } from '../features/admin/TimelinePage';
import { CustomerPortalPage } from '../features/public/CustomerPortalPage';
import { PublicBookingPage } from '../features/public/PublicBookingPage';
import { WidgetPage } from '../features/public/WidgetPage';

export type AppRoute = {
  path: string;
  label: string;
  icon: LucideIcon;
  element: ReactElement;
  nav: 'admin' | 'surface';
  end?: boolean;
  navPath?: string;
};

export const appRoutes: readonly AppRoute[] = [
  {
    path: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    element: <DashboardPage />,
    nav: 'admin',
    end: true,
  },
  {
    path: '/admin/bookings',
    label: 'Bookings',
    icon: CalendarDays,
    nav: 'admin',
    element: <BookingsPage />,
  },
  {
    path: '/admin/timeline',
    label: 'Timeline',
    icon: Clock3,
    nav: 'admin',
    element: <TimelinePage />,
  },
  {
    path: '/admin/customers',
    label: 'Customers',
    icon: UsersRound,
    nav: 'admin',
    element: <CustomersPage />,
  },
  {
    path: '/admin/resources',
    label: 'Resources',
    icon: Wrench,
    nav: 'admin',
    element: <ResourcesPage />,
  },
  {
    path: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    nav: 'admin',
    element: <SettingsPage />,
  },
  {
    path: '/portal',
    label: 'Portal',
    icon: UserRoundCheck,
    nav: 'surface',
    element: <CustomerPortalPage />,
  },
  {
    path: '/book/:slug',
    label: 'Public page',
    icon: Sparkles,
    nav: 'surface',
    navPath: '/book/demo-business',
    element: <PublicBookingPage />,
  },
  {
    path: '/widget/:slug',
    label: 'Widget',
    icon: MonitorSmartphone,
    nav: 'surface',
    navPath: '/widget/demo-widget',
    element: <WidgetPage />,
  },
];

export const adminNavItems = appRoutes.filter((route) => route.nav === 'admin');
export const surfaceNavItems = appRoutes.filter((route) => route.nav === 'surface');
export const adminRoutes = appRoutes.filter((route) => route.nav === 'admin');
export const surfaceRoutes = appRoutes.filter((route) => route.nav === 'surface');
