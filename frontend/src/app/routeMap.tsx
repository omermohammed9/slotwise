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
import { DashboardPage } from '../features/admin/DashboardPage';

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
    element: (
      <RoutePlaceholder
        eyebrow="Admin workspace"
        title="Bookings"
        summary="Booking records, saved views, filters, and detail review share one operational route."
        icon={CalendarDays}
        checkpoints={['Filters and sorting', 'Responsive booking list', 'Detail drawer entry']}
      />
    ),
  },
  {
    path: '/admin/timeline',
    label: 'Timeline',
    icon: Clock3,
    nav: 'admin',
    element: (
      <RoutePlaceholder
        eyebrow="Schedule"
        title="Timeline"
        summary="Day and resource views will use the backend timeline feed as the source of truth."
        icon={Clock3}
        checkpoints={['Day and week modes', 'Resource lanes', 'Conflict-risk markers']}
      />
    ),
  },
  {
    path: '/admin/customers',
    label: 'Customers',
    icon: UsersRound,
    nav: 'admin',
    element: (
      <RoutePlaceholder
        eyebrow="Relationships"
        title="Customers"
        summary="Customer records and booking history stay scoped to the operator view."
        icon={UsersRound}
        checkpoints={['Customer list', 'Profile summary', 'Booking history']}
      />
    ),
  },
  {
    path: '/admin/resources',
    label: 'Resources',
    icon: Wrench,
    nav: 'admin',
    element: (
      <RoutePlaceholder
        eyebrow="Inventory"
        title="Resources"
        summary="Services, staff, rooms, equipment, and bookable inventory use a shared management route."
        icon={Wrench}
        checkpoints={['Resource list', 'Create and edit forms', 'Capacity and availability']}
      />
    ),
  },
  {
    path: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    nav: 'admin',
    element: (
      <RoutePlaceholder
        eyebrow="Business setup"
        title="Settings"
        summary="Business profile, working hours, templates, public page, and widget settings live together."
        icon={Settings}
        checkpoints={['Business profile', 'Template selection', 'Widget and public page settings']}
      />
    ),
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
    element: (
      <RoutePlaceholder
        eyebrow="Public booking"
        title="Book a time"
        summary="Hosted booking pages consume business branding, resources, and booking-page settings by slug."
        icon={Sparkles}
        checkpoints={['Business branding', 'Resource choice', 'Availability and details']}
      />
    ),
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
