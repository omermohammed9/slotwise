import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Clock3,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { getBookingTimeline } from '../../api/bookings';
import type { BookingListQuery, BookingStatus, ConflictRiskLevel, TimelineDayDto, TimelineEntryDto } from '../../api/types';
import { useSessionStore } from '../../auth/sessionStore';
import { LoadingState } from '../../components/AdminState';
import { EmptyState } from '../../components/EmptyState';
import { StatusChip } from '../../components/StatusChip';

const statusOptions: Array<{ label: string; value: BookingStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'No-show', value: 'no_show' },
];

function formatDay(value: string): string {
  try {
    return format(parseISO(`${value}T00:00:00.000Z`), 'EEEE, MMM d');
  } catch {
    return value;
  }
}

function formatDateTime(value: string): string {
  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}

function formatTime(value: string): string {
  try {
    return format(parseISO(value), 'h:mm a');
  } catch {
    return value;
  }
}

function getRiskLevel(entry: TimelineEntryDto): ConflictRiskLevel {
  return entry.conflictRisk?.level ?? 'low';
}

function getTotalBookings(days: TimelineDayDto[]): number {
  return days.reduce((total, day) => total + day.summary.totalBookings, 0);
}

function getHighRiskBookings(days: TimelineDayDto[]): number {
  return days.reduce((total, day) => total + day.summary.highRiskBookings, 0);
}

function getTotalMinutes(days: TimelineDayDto[]): number {
  return days.reduce(
    (dayTotal, day) => dayTotal + day.bookings.reduce((bookingTotal, booking) => bookingTotal + booking.durationMinutes, 0),
    0,
  );
}

export function TimelinePage() {
  const { token } = useSessionStore();
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [serviceResourceId, setServiceResourceId] = useState('');

  const query: BookingListQuery = useMemo(
    () => ({
      ...(serviceResourceId.trim() ? { serviceResourceId: serviceResourceId.trim() } : {}),
      ...(startDateFrom ? { startDateFrom } : {}),
      ...(startDateTo ? { startDateTo } : {}),
      ...(status ? { status } : {}),
    }),
    [serviceResourceId, startDateFrom, startDateTo, status],
  );

  const timelineQuery = useQuery({
    queryFn: async () => {
      const response = await getBookingTimeline(query, token ?? undefined);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['booking-timeline', query, token],
  });

  const timelineDays = timelineQuery.data ?? [];
  const totalBookings = getTotalBookings(timelineDays);
  const highRiskBookings = getHighRiskBookings(timelineDays);
  const totalMinutes = getTotalMinutes(timelineDays);

  return (
    <>
      <section className="workspace-header" aria-labelledby="timeline-title">
        <div>
          <p className="eyebrow">Schedule</p>
          <h1 id="timeline-title">Timeline</h1>
          <p className="lede">Scan day-grouped booking flow, resource load, and conflict-risk markers.</p>
        </div>
        <div className="header-actions" aria-label="Timeline actions">
          <button className="icon-button" type="button" aria-label="Refresh timeline" onClick={() => timelineQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel timeline-controls" aria-label="Timeline filters">
        <label className="form-field">
          From
          <input type="date" value={startDateFrom} onChange={(event) => setStartDateFrom(event.target.value)} />
        </label>
        <label className="form-field">
          To
          <input type="date" value={startDateTo} onChange={(event) => setStartDateTo(event.target.value)} />
        </label>
        <label className="form-field">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus | '')}>
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Resource
          <span className="input-with-icon">
            <Filter size={17} aria-hidden="true" />
            <input
              value={serviceResourceId}
              onChange={(event) => setServiceResourceId(event.target.value)}
              placeholder="Resource ID"
            />
          </span>
        </label>
      </section>

      <section className="metric-grid timeline-metrics" aria-label="Timeline summary">
        <div className="metric-card metric-info">
          <p>Total bookings</p>
          <strong>{timelineQuery.isFetching ? '...' : totalBookings}</strong>
          <span>{timelineDays.length} timeline days</span>
        </div>
        <div className="metric-card metric-warning">
          <p>High-risk bookings</p>
          <strong>{timelineQuery.isFetching ? '...' : highRiskBookings}</strong>
          <span>Conflict-risk markers</span>
        </div>
        <div className="metric-card metric-success">
          <p>Booked time</p>
          <strong>{timelineQuery.isFetching ? '...' : `${Math.round(totalMinutes / 60)}h`}</strong>
          <span>{totalMinutes} scheduled minutes</span>
        </div>
        <div className="metric-card metric-danger">
          <p>Active filters</p>
          <strong>{[status, startDateFrom, startDateTo, serviceResourceId.trim()].filter(Boolean).length}</strong>
          <span>Status, date, and resource</span>
        </div>
      </section>

      <section className="panel timeline-feed-panel" aria-labelledby="timeline-feed-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Backend feed</p>
            <h2 id="timeline-feed-title">Booking flow</h2>
          </div>
          <Clock3 size={20} aria-hidden="true" />
        </div>

        {timelineQuery.isLoading ? (
          <LoadingState label="Loading timeline" />
        ) : timelineQuery.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Timeline could not load"
            description={(timelineQuery.error as Error).message}
          />
        ) : timelineDays.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No timeline entries"
            description="Adjust the date, status, or resource filters to broaden the schedule feed."
          />
        ) : (
          <div className="timeline-day-list">
            {timelineDays.map((day) => (
              <article className="timeline-day" key={day.date}>
                <div className="timeline-day-header">
                  <div>
                    <p className="eyebrow">{formatDateTime(`${day.date}T00:00:00.000Z`)}</p>
                    <h3>{formatDay(day.date)}</h3>
                  </div>
                  <span>{day.summary.totalBookings} bookings</span>
                </div>
                <div className="timeline-entry-list">
                  {day.bookings.map((entry) => {
                    const riskLevel = getRiskLevel(entry);

                    return (
                      <div className={`timeline-entry timeline-entry-${riskLevel}`} key={entry.id}>
                        <div className="timeline-entry-time">
                          <strong>{formatTime(entry.timein)}</strong>
                          <span>{entry.durationMinutes} min</span>
                        </div>
                        <div className="timeline-entry-main">
                          <h4>{entry.customerName || 'Unnamed customer'}</h4>
                          <p>
                            {formatTime(entry.timein)} - {formatTime(entry.timeout)}
                            {entry.serviceResourceId ? ` · ${entry.serviceResourceId}` : ''}
                          </p>
                        </div>
                        <div className="timeline-entry-meta">
                          <StatusChip status={entry.status}>{entry.status.replace('_', ' ')}</StatusChip>
                          <span className={`risk-chip risk-${riskLevel}`}>{riskLevel} risk</span>
                          {entry.isRescheduled ? <span className="rescheduled-chip">Rescheduled</span> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
