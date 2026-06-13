import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { addMinutes, format } from 'date-fns';
import { StatusChip } from '../../components/StatusChip';
import { MetricCard } from '../../components/MetricCard';
import { EmptyState } from '../../components/EmptyState';
import { BookingTimeline } from './BookingTimeline';
import { BookingQueue } from './BookingQueue';
import { useSessionStore } from '../../auth/sessionStore';
import { getApiBaseUrl } from '../../api/client';

const now = new Date('2030-01-02T09:00:00.000Z');

const bookings = [
  {
    id: 'bk_101',
    customerName: 'Maya Carter',
    service: 'Consultation',
    resource: 'Room 2',
    status: 'pending',
    risk: 'high',
    startAt: now,
    endAt: addMinutes(now, 45),
  },
  {
    id: 'bk_102',
    customerName: 'Omar Nasser',
    service: 'Table for 4',
    resource: 'Dining Floor',
    status: 'approved',
    risk: 'low',
    startAt: addMinutes(now, 60),
    endAt: addMinutes(now, 150),
  },
  {
    id: 'bk_103',
    customerName: 'Lena Holt',
    service: 'Equipment rental',
    resource: 'Camera Kit A',
    status: 'reschedule',
    risk: 'medium',
    startAt: addMinutes(now, 180),
    endAt: addMinutes(now, 300),
  },
] as const;

export function DashboardPage() {
  const session = useSessionStore();
  const apiBaseUrl = getApiBaseUrl();

  return (
    <>
      <section className="workspace-header" aria-labelledby="dashboard-title">
        <div>
          <p className="eyebrow">Owner dashboard</p>
          <h1 id="dashboard-title">Today at a glance</h1>
          <p className="lede">
            {format(now, 'EEEE, MMM d')} · API target: {apiBaseUrl}
          </p>
        </div>
        <div className="header-actions" aria-label="Dashboard actions">
          <button className="icon-button" type="button" aria-label="Search bookings">
            <Search size={18} aria-hidden="true" />
          </button>
          <button className="primary-button" type="button">
            <CalendarDays size={17} aria-hidden="true" />
            New booking
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Operational metrics">
        <MetricCard label="Pending approvals" value="12" trend="+3 since yesterday" tone="warning" />
        <MetricCard label="Approved today" value="38" trend="82% confirmation rate" tone="success" />
        <MetricCard label="At-risk bookings" value="4" trend="2 need action soon" tone="danger" />
        <MetricCard label="Utilization" value="71%" trend="Peak load at 2 PM" tone="info" />
      </section>

      <section className="content-grid">
        <div className="panel queue-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Needs attention</p>
              <h2>Booking queue</h2>
            </div>
            <StatusChip status="pending">Pending</StatusChip>
          </div>
          <BookingQueue bookings={bookings} />
        </div>

        <div className="panel timeline-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>Resource flow</h2>
            </div>
            <BarChart3 size={20} aria-hidden="true" />
          </div>
          <BookingTimeline bookings={bookings} />
        </div>
      </section>

      <section className="content-grid secondary-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Session posture</p>
              <h2>Approved storage baseline</h2>
            </div>
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <p className="body-copy">
            Session tokens are held in memory for the first frontend slice. Refreshing the page requires sign-in again,
            and persistent login remains a later backend cookie-session review.
          </p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => session.setToken('demo-memory-token')}
          >
            Store demo memory token
          </button>
          <p className="session-note">Token status: {session.token ? 'Stored in memory' : 'Not stored'}</p>
        </div>

        <EmptyState
          icon={AlertTriangle}
          title="Public widget isolation"
          description="Third-party embeds will use iframe isolation first, keeping host page styles away from booking flows."
        />
      </section>
    </>
  );
}
