import {
  CalendarDays,
  Clock3,
  ClipboardList,
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
import { BookingsPage } from '@/features/admin/BookingsPage';
import { CustomersPage } from '@/features/admin/CustomersPage';
import { DashboardPage } from '@/features/admin/DashboardPage';
import { AuditLogPage } from '@/features/admin/AuditLogPage';
import { ResourcesPage } from '@/features/admin/ResourcesPage';
import { SettingsPage } from '@/features/admin/SettingsPage';
import { TimelinePage } from '@/features/admin/TimelinePage';
import { UserAdminPage } from '@/features/admin/UserAdminPage';
import { CustomerPortalPage } from '@/features/public/CustomerPortalPage';
import { PublicBookingPage } from '@/features/public/PublicBookingPage';
import { WidgetPage } from '@/features/public/WidgetPage';
import type { TranslationKey } from '@/i18n/translations';

export type AppRoute = {
  path: string;
  label: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  element: ReactElement;
  nav: 'admin' | 'surface';
  roles?: Array<'owner' | 'admin' | 'staff'>;
  end?: boolean;
  navPath?: string;
};

export const appRoutes: readonly AppRoute[] = [
  {
    path: '/owner',
    label: 'Owner home',
    labelKey: 'nav.ownerHome',
    icon: LayoutDashboard,
    element: <DashboardPage />,
    nav: 'admin',
    roles: ['owner'],
    end: true,
  },
  {
    path: '/owner/users',
    label: 'Users',
    labelKey: 'nav.users',
    icon: UsersRound,
    element: <UserAdminPage />,
    nav: 'admin',
    roles: ['owner'],
  },
  {
    path: '/owner/audit',
    label: 'Audit',
    labelKey: 'nav.audit',
    icon: ClipboardList,
    element: <AuditLogPage />,
    nav: 'admin',
    roles: ['owner'],
  },
  {
    path: '/admin',
    label: 'Dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    element: <DashboardPage />,
    nav: 'admin',
    roles: ['owner', 'admin'],
    end: true,
  },
  {
    path: '/admin/bookings',
    label: 'Bookings',
    labelKey: 'nav.bookings',
    icon: CalendarDays,
    nav: 'admin',
    roles: ['owner', 'admin', 'staff'],
    element: <BookingsPage />,
  },
  {
    path: '/admin/timeline',
    label: 'Timeline',
    labelKey: 'nav.timeline',
    icon: Clock3,
    nav: 'admin',
    roles: ['owner', 'admin', 'staff'],
    element: <TimelinePage />,
  },
  {
    path: '/admin/customers',
    label: 'Customers',
    labelKey: 'nav.customers',
    icon: UsersRound,
    nav: 'admin',
    roles: ['owner', 'admin', 'staff'],
    element: <CustomersPage />,
  },
  {
    path: '/admin/resources',
    label: 'Resources',
    labelKey: 'nav.resources',
    icon: Wrench,
    nav: 'admin',
    roles: ['owner', 'admin'],
    element: <ResourcesPage />,
  },
  {
    path: '/admin/settings',
    label: 'Settings',
    labelKey: 'nav.settings',
    icon: Settings,
    nav: 'admin',
    roles: ['owner', 'admin'],
    element: <SettingsPage />,
  },
  {
    path: '/admin/audit',
    label: 'Audit',
    labelKey: 'nav.audit',
    icon: ClipboardList,
    element: <AuditLogPage />,
    nav: 'admin',
    roles: ['owner', 'admin'],
  },
  {
    path: '/staff',
    label: 'Bookings',
    labelKey: 'nav.bookings',
    icon: CalendarDays,
    nav: 'admin',
    element: <BookingsPage />,
    roles: ['staff'],
    end: true,
  },
  {
    path: '/staff/timeline',
    label: 'Timeline',
    labelKey: 'nav.timeline',
    icon: Clock3,
    nav: 'admin',
    element: <TimelinePage />,
    roles: ['staff'],
  },
  {
    path: '/staff/customers',
    label: 'Customers',
    labelKey: 'nav.customers',
    icon: UsersRound,
    nav: 'admin',
    element: <CustomersPage />,
    roles: ['staff'],
  },
  {
    path: '/portal',
    label: 'Portal',
    labelKey: 'nav.portal',
    icon: UserRoundCheck,
    nav: 'surface',
    element: <CustomerPortalPage />,
  },
  {
    path: '/book/:slug',
    label: 'Public page',
    labelKey: 'nav.publicPage',
    icon: Sparkles,
    nav: 'surface',
    navPath: '/book/demo-business',
    element: <PublicBookingPage />,
  },
  {
    path: '/widget/:slug',
    label: 'Widget',
    labelKey: 'nav.widget',
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
