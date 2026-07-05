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
import { getCancellationNoShowInsights, getDashboardInsights } from '@/api/bookings';
import { getApiBaseUrl } from '@/api/client';
import type { BookingInsightsQuery, BookingStatus, CancellationNoShowInsightsDto, DashboardInsightsDto } from '@/api/types';
import { useSessionStore } from '@/auth/sessionStore';
import { LoadingState } from '@/components/AdminState';
import { EmptyState } from '@/components/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { StatusChip } from '@/components/StatusChip';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

function formatPercent(value: number | undefined, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0, style: 'percent' }).format(Number(value ?? 0) / 100);
}

function formatHours(minutes: number | undefined, formatNumber: (value: number) => string): string {
  return `${formatNumber(Math.round(Number(minutes ?? 0) / 60))}h`;
}

function getMaxCount(items: Array<{ bookings?: number; count?: number }>): number {
  return Math.max(1, ...items.map((item) => Number(item.bookings ?? item.count ?? 0)));
}

function getStatusLabel(status: BookingStatus, t: (key: TranslationKey) => string): string {
  return t(`status.${status}` as TranslationKey);
}

function getWeekdayLabel(weekday: string, t: (key: TranslationKey) => string): string {
  const key = `weekday.${weekday}` as TranslationKey;
  const translated = t(key);
  return translated === key ? weekday : translated;
}

function CancellationInsights({ insights }: { insights: CancellationNoShowInsightsDto }) {
  const { formatNumber, locale, t } = useI18n();
  const maxWeekdayCount = Math.max(
    1,
    ...insights.trends.byWeekday.map((weekday) => weekday.cancellations + weekday.noShows),
  );

  return (
    <section className="content-grid dashboard-analytics-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t('dashboard.cancellationHealth')}</p>
            <h2>{t('dashboard.cancellationInsights')}</h2>
          </div>
          <CircleOff size={20} aria-hidden="true" />
        </div>
        <section className="metric-grid compact-metric-grid" aria-label={t('dashboard.cancellationMetrics')}>
          <MetricCard
            label={t('dashboard.cancelled')}
            value={formatNumber(insights.summary.cancelledBookings)}
            trend={`${formatPercent(insights.summary.cancellationRate, locale)} ${t('dashboard.cancellationRate')}`}
            tone="danger"
          />
          <MetricCard
            label={t('dashboard.noShows')}
            value={formatNumber(insights.summary.noShowBookings)}
            trend={`${formatPercent(insights.summary.noShowRate, locale)} ${t('dashboard.noShowRate')}`}
            tone="warning"
          />
          <MetricCard
            label={t('dashboard.delivered')}
            value={formatNumber(insights.summary.completedBookings)}
            trend={`${formatPercent(insights.summary.serviceDeliveryRate, locale)} ${t('dashboard.deliveryRate')}`}
            tone="success"
          />
        </section>
        <div className="analytics-bar-list cancellation-weekdays">
          {insights.trends.byWeekday.map((weekday) => {
            const total = weekday.cancellations + weekday.noShows;

            return (
              <div className="analytics-bar-row" key={weekday.weekday}>
                <div className="analytics-bar-label">
                  <span>{getWeekdayLabel(weekday.weekday, t)}</span>
                  <strong>{formatNumber(total)}</strong>
                </div>
                <div className="analytics-bar-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, (total / maxWeekdayCount) * 100)}%` }} />
                </div>
                <small>
                  {formatNumber(weekday.cancellations)} {t('dashboard.cancellations')} · {formatNumber(weekday.noShows)}{' '}
                  {t('dashboard.noShows')}
                </small>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t('dashboard.reasonPatterns')}</p>
            <h2>{t('dashboard.topReasons')}</h2>
          </div>
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <div className="reason-grid">
          <div>
            <h3>{t('dashboard.cancellations')}</h3>
            {insights.trends.cancellationReasons.length ? (
              insights.trends.cancellationReasons.slice(0, 4).map((reason) => (
                <div className="reason-row" key={reason.reason}>
                  <span>{reason.reason}</span>
                  <strong>{formatNumber(reason.count)}</strong>
                </div>
              ))
            ) : (
              <p className="body-copy">{t('dashboard.noCancellationReasons')}</p>
            )}
          </div>
          <div>
            <h3>{t('dashboard.noShows')}</h3>
            {insights.trends.noShowReasons.length ? (
              insights.trends.noShowReasons.slice(0, 4).map((reason) => (
                <div className="reason-row" key={reason.reason}>
                  <span>{reason.reason}</span>
                  <strong>{formatNumber(reason.count)}</strong>
                </div>
              ))
            ) : (
              <p className="body-copy">{t('dashboard.noNoShowReasons')}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardAnalytics({ insights }: { insights: DashboardInsightsDto }) {
  const { formatNumber, locale, t } = useI18n();
  const maxFunnelCount = getMaxCount(insights.funnel);
  const maxWeekdayBookings = getMaxCount(insights.utilization.byWeekday);
  const maxPeakBookings = getMaxCount(insights.peaks.topTimeSlots);

  return (
    <>
      <section className="metric-grid" aria-label={t('dashboard.operationalMetrics')}>
        <MetricCard
          label={t('dashboard.totalBookings')}
          value={formatNumber(insights.summary.totalBookings)}
          trend={`${formatNumber(insights.summary.pendingBookings)} ${t('dashboard.pendingReview')}`}
          tone="info"
        />
        <MetricCard
          label={t('dashboard.approvalRate')}
          value={formatPercent(insights.summary.approvalRate, locale)}
          trend={`${formatNumber(insights.summary.approvedBookings)} ${t('dashboard.approvedBookings')}`}
          tone="success"
        />
        <MetricCard
          label={t('dashboard.completionRate')}
          value={formatPercent(insights.summary.completionRate, locale)}
          trend={`${formatNumber(insights.summary.completedBookings)} ${t('dashboard.completedBookings')}`}
          tone="warning"
        />
        <MetricCard
          label={t('dashboard.utilization')}
          value={formatHours(insights.summary.utilizationMinutes, formatNumber)}
          trend={`${formatNumber(insights.summary.utilizationMinutes)} ${t('dashboard.bookedMinutes')}`}
          tone="danger"
        />
      </section>

      <section className="content-grid dashboard-analytics-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('dashboard.lifecycle')}</p>
              <h2>{t('dashboard.bookingFunnel')}</h2>
            </div>
            <BarChart3 size={20} aria-hidden="true" />
          </div>
          <div className="analytics-bar-list">
            {insights.funnel.map((item) => (
              <div className="analytics-bar-row" key={item.status}>
                <div className="analytics-bar-label">
                  <StatusChip status={item.status}>{getStatusLabel(item.status, t)}</StatusChip>
                  <strong>{formatNumber(item.count)}</strong>
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
              <p className="eyebrow">{t('dashboard.peaks')}</p>
              <h2>{t('dashboard.peakBookingTimes')}</h2>
            </div>
            <CalendarDays size={20} aria-hidden="true" />
          </div>
          <div className="peak-summary">
            <div>
              <span>{t('dashboard.busiestWeekday')}</span>
              <strong>
                {insights.peaks.busiestWeekday ? getWeekdayLabel(insights.peaks.busiestWeekday, t) : t('dashboard.notEnoughData')}
              </strong>
            </div>
            <div>
              <span>{t('dashboard.busiestHour')}</span>
              <strong>{insights.peaks.busiestHour ?? t('dashboard.notEnoughData')}</strong>
            </div>
          </div>
          <div className="analytics-bar-list">
            {insights.peaks.topTimeSlots.length ? (
              insights.peaks.topTimeSlots.map((slot) => (
                <div className="analytics-bar-row" key={slot.label}>
                  <div className="analytics-bar-label">
                    <span>{slot.label}</span>
                    <strong>{formatNumber(slot.bookings)}</strong>
                  </div>
                  <div className="analytics-bar-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(4, (slot.bookings / maxPeakBookings) * 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="body-copy">{t('dashboard.noPeakSlots')}</p>
            )}
          </div>
        </div>
      </section>

      <section className="content-grid secondary-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('dashboard.weekdayLoad')}</p>
              <h2>{t('dashboard.utilizationByDay')}</h2>
            </div>
            <BarChart3 size={20} aria-hidden="true" />
          </div>
          <div className="analytics-bar-list">
            {insights.utilization.byWeekday.map((weekday) => (
              <div className="analytics-bar-row" key={weekday.weekday}>
                <div className="analytics-bar-label">
                  <span>{getWeekdayLabel(weekday.weekday, t)}</span>
                  <strong>{formatNumber(weekday.bookings)}</strong>
                </div>
                <div className="analytics-bar-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, (weekday.bookings / maxWeekdayBookings) * 100)}%` }} />
                </div>
                <small>{formatNumber(weekday.bookedMinutes)} {t('dashboard.minutes')}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('dashboard.resources')}</p>
              <h2>{t('dashboard.topResourceLoad')}</h2>
            </div>
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          {insights.utilization.byResource.length ? (
            <div className="resource-load-list">
              {insights.utilization.byResource.slice(0, 5).map((resource) => (
                <div className="resource-load-row" key={resource.resourceId}>
                  <strong>{resource.resourceId}</strong>
                  <span>{formatNumber(resource.bookings)} {t('dashboard.bookings')}</span>
                  <small>{formatNumber(resource.bookedMinutes)} {t('dashboard.minutes')}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="body-copy">{t('dashboard.noResourceData')}</p>
          )}
        </div>
      </section>
    </>
  );
}

export function DashboardPage() {
  const session = useSessionStore();
  const { t } = useI18n();
  const apiBaseUrl = getApiBaseUrl();
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [serviceResourceId, setServiceResourceId] = useState('');

  const query: BookingInsightsQuery = useMemo(
    () => ({
      ...(session.session?.role !== 'owner' && session.session?.businessId ? { businessId: session.session.businessId } : {}),
      ...(serviceResourceId.trim() ? { serviceResourceId: serviceResourceId.trim() } : {}),
      ...(startDateFrom ? { startDateFrom } : {}),
      ...(startDateTo ? { startDateTo } : {}),
    }),
    [serviceResourceId, session.session?.businessId, session.session?.role, startDateFrom, startDateTo],
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
          <p className="eyebrow">{t('dashboard.ownerEyebrow')}</p>
          <h1 id="dashboard-title">{t('dashboard.title')}</h1>
          <p className="lede">{t('dashboard.analyticsFrom')} {apiBaseUrl}</p>
        </div>
        <div className="header-actions" aria-label={t('dashboard.actions')}>
          <button
            className="icon-button"
            type="button"
            aria-label={t('dashboard.refresh')}
            onClick={() => {
              dashboardQuery.refetch();
              cancellationQuery.refetch();
            }}
          >
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel dashboard-controls" aria-label={t('dashboard.filters')}>
        <label className="form-field">
          {t('dashboard.from')}
          <input type="date" value={startDateFrom} onChange={(event) => setStartDateFrom(event.target.value)} />
        </label>
        <label className="form-field">
          {t('dashboard.to')}
          <input type="date" value={startDateTo} onChange={(event) => setStartDateTo(event.target.value)} />
        </label>
        <label className="form-field">
          {t('dashboard.resource')}
          <span className="input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input
              value={serviceResourceId}
              onChange={(event) => setServiceResourceId(event.target.value)}
              placeholder={t('dashboard.resourcePlaceholder')}
            />
          </span>
        </label>
      </section>

      {dashboardQuery.isLoading ? (
        <LoadingState label={t('dashboard.loadingAnalytics')} />
      ) : dashboardQuery.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t('dashboard.analyticsLoadError')}
          description={(dashboardQuery.error as Error).message}
        />
      ) : dashboardQuery.data?.summary ? (
        <DashboardAnalytics insights={dashboardQuery.data} />
      ) : (
        <EmptyState
          icon={Search}
          title={t('dashboard.noAnalytics')}
          description={t('dashboard.noAnalyticsDescription')}
        />
      )}

      {cancellationQuery.isLoading ? (
        <LoadingState label={t('dashboard.loadingCancellations')} />
      ) : cancellationQuery.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t('dashboard.cancellationLoadError')}
          description={(cancellationQuery.error as Error).message}
        />
      ) : cancellationQuery.data?.summary ? (
        <CancellationInsights insights={cancellationQuery.data} />
      ) : null}

      <section className="content-grid secondary-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('dashboard.sessionPosture')}</p>
              <h2>{t('dashboard.storageBaseline')}</h2>
            </div>
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <p className="body-copy">
            {t('dashboard.storageCopy')}
          </p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => session.setToken('demo-memory-token')}
          >
            {t('dashboard.storeDemoToken')}
          </button>
          <p className="session-note">
            {t('dashboard.tokenStatus')}: {session.token ? t('dashboard.tokenStored') : t('dashboard.tokenNotStored')}
          </p>
        </div>

        <EmptyState
          icon={AlertTriangle}
          title={t('dashboard.widgetIsolation')}
          description={t('dashboard.widgetIsolationDescription')}
        />
      </section>
    </>
  );
}
