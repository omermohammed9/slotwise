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
import { RoutePlaceholder } from '../components/RoutePlaceholder';
import { BookingsPage } from '../features/admin/BookingsPage';
import { CustomersPage } from '../features/admin/CustomersPage';
import { DashboardPage } from '../features/admin/DashboardPage';
import { ResourcesPage } from '../features/admin/ResourcesPage';
import { SettingsPage } from '../features/admin/SettingsPage';
import { TimelinePage } from '../features/admin/TimelinePage';
import { PublicBookingPage } from '../features/public/PublicBookingPage';

export type AppRoute = {
  path: string;
  label: string;
  icon: LucideIcon;
  element: ReactElement;
  nav: 'admin' | 'surface';
  end?: boolean;
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
    element: (
      <RoutePlaceholder
        eyebrow="Customer portal"
        title="Manage booking"
        summary="Customer booking management starts from the passwordless magic-link route."
        icon={UserRoundCheck}
        checkpoints={['Magic-link entry', 'Booking status', 'Reschedule and cancellation']}
      />
    ),
  },
  {
    path: '/book/:slug',
    label: 'Public page',
    icon: Sparkles,
    nav: 'surface',
    element: <PublicBookingPage />,
  },
  {
    path: '/widget/:slug',
    label: 'Widget',
    icon: MonitorSmartphone,
    nav: 'surface',
    element: (
      <RoutePlaceholder
        eyebrow="Embedded booking"
        title="Widget"
        summary="The iframe-first route keeps compact booking flows isolated from host pages."
        icon={MonitorSmartphone}
        checkpoints={['Compact layout', 'Host-safe sizing', 'Public widget config']}
      />
    ),
  },
];

export const adminNavItems = appRoutes.filter((route) => route.nav === 'admin');
export const surfaceNavItems = appRoutes.filter((route) => route.nav === 'surface');
export const adminRoutes = appRoutes.filter((route) => route.nav === 'admin');
export const surfaceRoutes = appRoutes.filter((route) => route.nav === 'surface');
