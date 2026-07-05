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
import { getBookingTimeline } from '@/api/bookings';
import type { BookingListQuery, BookingStatus, ConflictRiskLevel, TimelineDayDto, TimelineEntryDto } from '@/api/types';
import { useSessionStore } from '@/auth/sessionStore';
import { LoadingState } from '@/components/AdminState';
import { EmptyState } from '@/components/EmptyState';
import { StatusChip } from '@/components/StatusChip';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

const statusOptions: Array<{ labelKey: TranslationKey; value: BookingStatus | '' }> = [
  { labelKey: 'bookings.allStatuses', value: '' },
  { labelKey: 'status.pending', value: 'pending' },
  { labelKey: 'status.approved', value: 'approved' },
  { labelKey: 'status.completed', value: 'completed' },
  { labelKey: 'status.cancelled', value: 'cancelled' },
  { labelKey: 'status.rejected', value: 'rejected' },
  { labelKey: 'status.no_show', value: 'no_show' },
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

function getStatusLabel(status: BookingStatus, t: (key: TranslationKey) => string): string {
  return t(`status.${status}` as TranslationKey);
}

function getRiskLabel(risk: ConflictRiskLevel, t: (key: TranslationKey) => string): string {
  return t(`risk.${risk}` as TranslationKey);
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
  const { session, token } = useSessionStore();
  const { formatNumber, t } = useI18n();
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [serviceResourceId, setServiceResourceId] = useState('');

  const query: BookingListQuery = useMemo(
    () => ({
      ...(session?.role !== 'owner' && session?.businessId ? { businessId: session.businessId } : {}),
      ...(serviceResourceId.trim() ? { serviceResourceId: serviceResourceId.trim() } : {}),
      ...(startDateFrom ? { startDateFrom } : {}),
      ...(startDateTo ? { startDateTo } : {}),
      ...(status ? { status } : {}),
    }),
    [serviceResourceId, session?.businessId, session?.role, startDateFrom, startDateTo, status],
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
          <p className="eyebrow">{t('timeline.schedule')}</p>
          <h1 id="timeline-title">{t('timeline.title')}</h1>
          <p className="lede">{t('timeline.lede')}</p>
        </div>
        <div className="header-actions" aria-label={t('timeline.actions')}>
          <button className="icon-button" type="button" aria-label={t('timeline.refresh')} onClick={() => timelineQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel timeline-controls" aria-label={t('timeline.filters')}>
        <label className="form-field">
          {t('dashboard.from')}
          <input type="date" value={startDateFrom} onChange={(event) => setStartDateFrom(event.target.value)} />
        </label>
        <label className="form-field">
          {t('dashboard.to')}
          <input type="date" value={startDateTo} onChange={(event) => setStartDateTo(event.target.value)} />
        </label>
        <label className="form-field">
          {t('bookings.status')}
          <select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus | '')}>
            {statusOptions.map((option) => (
              <option key={option.labelKey} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          {t('dashboard.resource')}
          <span className="input-with-icon">
            <Filter size={17} aria-hidden="true" />
            <input
              value={serviceResourceId}
              onChange={(event) => setServiceResourceId(event.target.value)}
              placeholder={t('dashboard.resourcePlaceholder')}
            />
          </span>
        </label>
      </section>

      <section className="metric-grid timeline-metrics" aria-label={t('timeline.summary')}>
        <div className="metric-card metric-info">
          <p>{t('timeline.totalBookings')}</p>
          <strong>{timelineQuery.isFetching ? '...' : formatNumber(totalBookings)}</strong>
          <span>{formatNumber(timelineDays.length)} {t('timeline.timelineDays')}</span>
        </div>
        <div className="metric-card metric-warning">
          <p>{t('timeline.highRiskBookings')}</p>
          <strong>{timelineQuery.isFetching ? '...' : formatNumber(highRiskBookings)}</strong>
          <span>{t('timeline.conflictRiskMarkers')}</span>
        </div>
        <div className="metric-card metric-success">
          <p>{t('timeline.bookedTime')}</p>
          <strong>{timelineQuery.isFetching ? '...' : `${formatNumber(Math.round(totalMinutes / 60))}h`}</strong>
          <span>{formatNumber(totalMinutes)} {t('timeline.scheduledMinutes')}</span>
        </div>
        <div className="metric-card metric-danger">
          <p>{t('timeline.activeFilters')}</p>
          <strong>{formatNumber([status, startDateFrom, startDateTo, serviceResourceId.trim()].filter(Boolean).length)}</strong>
          <span>{t('timeline.filterSummary')}</span>
        </div>
      </section>

      <section className="panel timeline-feed-panel" aria-labelledby="timeline-feed-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t('timeline.backendFeed')}</p>
            <h2 id="timeline-feed-title">{t('timeline.bookingFlow')}</h2>
          </div>
          <Clock3 size={20} aria-hidden="true" />
        </div>

        {timelineQuery.isLoading ? (
          <LoadingState label={t('timeline.loading')} />
        ) : timelineQuery.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title={t('timeline.loadError')}
            description={(timelineQuery.error as Error).message}
          />
        ) : timelineDays.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('timeline.empty')}
            description={t('timeline.emptyDescription')}
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
                  <span>{formatNumber(day.summary.totalBookings)} {t('timeline.bookings')}</span>
                </div>
                <div className="timeline-entry-list">
                  {day.bookings.map((entry) => {
                    const riskLevel = getRiskLevel(entry);

                    return (
                      <div className={`timeline-entry timeline-entry-${riskLevel}`} key={entry.id}>
                        <div className="timeline-entry-time">
                          <strong>{formatTime(entry.timein)}</strong>
                          <span>{formatNumber(entry.durationMinutes)} {t('timeline.minutesShort')}</span>
                        </div>
                        <div className="timeline-entry-main">
                          <h4>{entry.customerName || t('timeline.unnamedCustomer')}</h4>
                          <p>
                            {formatTime(entry.timein)} - {formatTime(entry.timeout)}
                            {entry.serviceResourceId ? ` · ${entry.serviceResourceId}` : ''}
                          </p>
                        </div>
                        <div className="timeline-entry-meta">
                          <StatusChip status={entry.status}>{getStatusLabel(entry.status, t)}</StatusChip>
                          <span className={`risk-chip risk-${riskLevel}`}>{getRiskLabel(riskLevel, t)} {t('risk.label')}</span>
                          {entry.isRescheduled ? <span className="rescheduled-chip">{t('timeline.rescheduled')}</span> : null}
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
