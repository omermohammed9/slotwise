import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  RefreshCw,
  Search,
} from 'lucide-react';
import { getCancellationNoShowInsights, getDashboardInsights } from '../../api/bookings';
import { getApiBaseUrl } from '../../api/client';
import type { BookingInsightsQuery, BookingStatus, CancellationNoShowInsightsDto, DashboardInsightsDto } from '../../api/types';
import { useSessionStore } from '../../auth/sessionStore';
import { LoadingState } from '../../components/AdminState';
import { EmptyState } from '../../components/EmptyState';
import { MetricCard } from '../../components/MetricCard';
import { StatusChip } from '../../components/StatusChip';

function formatPercent(value?: number): string {
  return `${Number(value ?? 0).toFixed(0)}%`;
}

function formatHours(minutes?: number): string {
  return `${Math.round(Number(minutes ?? 0) / 60)}h`;
}

function getMaxCount(items: Array<{ bookings?: number; count?: number }>): number {
  return Math.max(1, ...items.map((item) => Number(item.bookings ?? item.count ?? 0)));
}

function getFunnelLabel(status: BookingStatus): string {
  return status.replace('_', ' ');
}

function DashboardLoadingState() {
  return <LoadingState label="Loading dashboard analytics" />;
}

function CancellationInsights({ insights }: { insights: CancellationNoShowInsightsDto }) {
  const maxWeekdayCount = Math.max(
    1,
    ...insights.trends.byWeekday.map((weekday) => weekday.cancellations + weekday.noShows),
  );

  return (
    <section className="content-grid dashboard-analytics-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Cancellation health</p>
            <h2>Cancellation and no-show insights</h2>
          </div>
          <CircleOff size={20} aria-hidden="true" />
        </div>
        <section className="metric-grid compact-metric-grid" aria-label="Cancellation metrics">
          <MetricCard
            label="Cancelled"
            value={String(insights.summary.cancelledBookings)}
            trend={`${formatPercent(insights.summary.cancellationRate)} cancellation rate`}
            tone="danger"
          />
          <MetricCard
            label="No-shows"
            value={String(insights.summary.noShowBookings)}
            trend={`${formatPercent(insights.summary.noShowRate)} no-show rate`}
            tone="warning"
          />
          <MetricCard
            label="Delivered"
            value={String(insights.summary.completedBookings)}
            trend={`${formatPercent(insights.summary.serviceDeliveryRate)} delivery rate`}
            tone="success"
          />
        </section>
        <div className="analytics-bar-list cancellation-weekdays">
          {insights.trends.byWeekday.map((weekday) => {
            const total = weekday.cancellations + weekday.noShows;

            return (
              <div className="analytics-bar-row" key={weekday.weekday}>
                <div className="analytics-bar-label">
                  <span>{weekday.weekday}</span>
                  <strong>{total}</strong>
                </div>
                <div className="analytics-bar-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, (total / maxWeekdayCount) * 100)}%` }} />
                </div>
                <small>{weekday.cancellations} cancellations · {weekday.noShows} no-shows</small>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Reason patterns</p>
            <h2>Top reasons</h2>
          </div>
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <div className="reason-grid">
          <div>
            <h3>Cancellations</h3>
            {insights.trends.cancellationReasons.length ? (
              insights.trends.cancellationReasons.slice(0, 4).map((reason) => (
                <div className="reason-row" key={reason.reason}>
                  <span>{reason.reason}</span>
                  <strong>{reason.count}</strong>
                </div>
              ))
            ) : (
              <p className="body-copy">No cancellation reasons in this range.</p>
            )}
          </div>
          <div>
            <h3>No-shows</h3>
            {insights.trends.noShowReasons.length ? (
              insights.trends.noShowReasons.slice(0, 4).map((reason) => (
                <div className="reason-row" key={reason.reason}>
                  <span>{reason.reason}</span>
                  <strong>{reason.count}</strong>
                </div>
              ))
            ) : (
              <p className="body-copy">No no-show reasons in this range.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardAnalytics({ insights }: { insights: DashboardInsightsDto }) {
  const maxFunnelCount = getMaxCount(insights.funnel);
  const maxWeekdayBookings = getMaxCount(insights.utilization.byWeekday);
  const maxPeakBookings = getMaxCount(insights.peaks.topTimeSlots);

  return (
    <>
      <section className="metric-grid" aria-label="Operational metrics">
        <MetricCard
          label="Total bookings"
          value={String(insights.summary.totalBookings)}
          trend={`${insights.summary.pendingBookings} pending review`}
          tone="info"
        />
        <MetricCard
          label="Approval rate"
          value={formatPercent(insights.summary.approvalRate)}
          trend={`${insights.summary.approvedBookings} approved bookings`}
          tone="success"
        />
        <MetricCard
          label="Completion rate"
          value={formatPercent(insights.summary.completionRate)}
          trend={`${insights.summary.completedBookings} completed bookings`}
          tone="warning"
        />
        <MetricCard
          label="Utilization"
          value={formatHours(insights.summary.utilizationMinutes)}
          trend={`${insights.summary.utilizationMinutes} booked minutes`}
          tone="danger"
        />
      </section>

      <section className="content-grid dashboard-analytics-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Lifecycle</p>
              <h2>Booking funnel</h2>
            </div>
            <BarChart3 size={20} aria-hidden="true" />
          </div>
          <div className="analytics-bar-list">
            {insights.funnel.map((item) => (
              <div className="analytics-bar-row" key={item.status}>
                <div className="analytics-bar-label">
                  <StatusChip status={item.status}>{getFunnelLabel(item.status)}</StatusChip>
                  <strong>{item.count}</strong>
                </div>
                <div className="analytics-bar-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, (item.count / maxFunnelCount) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Peaks</p>
              <h2>Peak booking times</h2>
            </div>
            <CalendarDays size={20} aria-hidden="true" />
          </div>
          <div className="peak-summary">
            <div>
              <span>Busiest weekday</span>
              <strong>{insights.peaks.busiestWeekday ?? 'Not enough data'}</strong>
            </div>
            <div>
              <span>Busiest hour</span>
              <strong>{insights.peaks.busiestHour ?? 'Not enough data'}</strong>
            </div>
          </div>
          <div className="analytics-bar-list">
            {insights.peaks.topTimeSlots.length ? (
              insights.peaks.topTimeSlots.map((slot) => (
                <div className="analytics-bar-row" key={slot.label}>
                  <div className="analytics-bar-label">
                    <span>{slot.label}</span>
                    <strong>{slot.bookings}</strong>
                  </div>
                  <div className="analytics-bar-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(4, (slot.bookings / maxPeakBookings) * 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="body-copy">No peak time slots in this range.</p>
            )}
          </div>
        </div>
      </section>

      <section className="content-grid secondary-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Weekday load</p>
              <h2>Utilization by day</h2>
            </div>
            <BarChart3 size={20} aria-hidden="true" />
          </div>
          <div className="analytics-bar-list">
            {insights.utilization.byWeekday.map((weekday) => (
              <div className="analytics-bar-row" key={weekday.weekday}>
                <div className="analytics-bar-label">
                  <span>{weekday.weekday}</span>
                  <strong>{weekday.bookings}</strong>
                </div>
                <div className="analytics-bar-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, (weekday.bookings / maxWeekdayBookings) * 100)}%` }} />
                </div>
                <small>{weekday.bookedMinutes} minutes</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Resources</p>
              <h2>Top resource load</h2>
            </div>
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          {insights.utilization.byResource.length ? (
            <div className="resource-load-list">
              {insights.utilization.byResource.slice(0, 5).map((resource) => (
                <div className="resource-load-row" key={resource.resourceId}>
                  <strong>{resource.resourceId}</strong>
                  <span>{resource.bookings} bookings</span>
                  <small>{resource.bookedMinutes} minutes</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="body-copy">No resource utilization data in this range.</p>
          )}
        </div>
      </section>
    </>
  );
}

export function DashboardPage() {
  const session = useSessionStore();
  const apiBaseUrl = getApiBaseUrl();
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [serviceResourceId, setServiceResourceId] = useState('');

  const query: BookingInsightsQuery = useMemo(
    () => ({
      ...(serviceResourceId.trim() ? { serviceResourceId: serviceResourceId.trim() } : {}),
      ...(startDateFrom ? { startDateFrom } : {}),
      ...(startDateTo ? { startDateTo } : {}),
    }),
    [serviceResourceId, startDateFrom, startDateTo],
  );

  const dashboardQuery = useQuery({
    queryFn: async () => {
      const response = await getDashboardInsights(query, session.token ?? undefined);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['dashboard-insights', query, session.token],
  });

  const cancellationQuery = useQuery({
    queryFn: async () => {
      const response = await getCancellationNoShowInsights(query, session.token ?? undefined);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['cancellation-no-show-insights', query, session.token],
  });

  return (
    <>
      <section className="workspace-header" aria-labelledby="dashboard-title">
        <div>
          <p className="eyebrow">Owner dashboard</p>
          <h1 id="dashboard-title">Today at a glance</h1>
          <p className="lede">Dashboard analytics from {apiBaseUrl}</p>
        </div>
        <div className="header-actions" aria-label="Dashboard actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Refresh dashboard"
            onClick={() => {
              dashboardQuery.refetch();
              cancellationQuery.refetch();
            }}
          >
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel dashboard-controls" aria-label="Dashboard filters">
        <label className="form-field">
          From
          <input type="date" value={startDateFrom} onChange={(event) => setStartDateFrom(event.target.value)} />
        </label>
        <label className="form-field">
          To
          <input type="date" value={startDateTo} onChange={(event) => setStartDateTo(event.target.value)} />
        </label>
        <label className="form-field">
          Resource
          <span className="input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input
              value={serviceResourceId}
              onChange={(event) => setServiceResourceId(event.target.value)}
              placeholder="Resource ID"
            />
          </span>
        </label>
      </section>

      {dashboardQuery.isLoading ? (
        <DashboardLoadingState />
      ) : dashboardQuery.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Dashboard analytics could not load"
          description={(dashboardQuery.error as Error).message}
        />
      ) : dashboardQuery.data?.summary ? (
        <DashboardAnalytics insights={dashboardQuery.data} />
      ) : (
        <EmptyState
          icon={Search}
          title="No dashboard analytics"
          description="Adjust the current filters or try a broader reporting range."
        />
      )}

      {cancellationQuery.isLoading ? (
        <LoadingState label="Loading cancellation insights" />
      ) : cancellationQuery.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Cancellation insights could not load"
          description={(cancellationQuery.error as Error).message}
        />
      ) : cancellationQuery.data?.summary ? (
        <CancellationInsights insights={cancellationQuery.data} />
      ) : null}

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
