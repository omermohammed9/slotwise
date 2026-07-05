import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, MapPin, Sparkles, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { createBooking, getBookingSuggestions } from '@/api/bookings';
import { getPublicWidgetConfig } from '@/api/publicSurfaces';
import type { BookingDto, BookingSuggestionDto, PublicResourcePreviewDto, PublicWidgetConfigDto } from '@/api/types';
import { EmptyState } from '@/components/EmptyState';
import {
  clampPartySize,
  combineDateTime,
  createPortalLink,
  formatInputDate,
  formatInputTime,
  getInitialDate,
  validatePublicBookingDraft,
} from '@/features/public/publicSurfaceUtils';

type WidgetDraft = {
  date: string;
  email: string;
  endTime: string;
  fName: string;
  lName: string;
  notes: string;
  partySize: number;
  phone: string;
  resourceId: string;
  startTime: string;
};

function createInitialDraft(): WidgetDraft {
  return {
    date: getInitialDate(),
    email: '',
    endTime: '13:00',
    fName: '',
    lName: '',
    notes: '',
    partySize: 1,
    phone: '',
    resourceId: '',
    startTime: '12:00',
  };
}

function getResources(config?: PublicWidgetConfigDto): PublicResourcePreviewDto[] {
  return config?.availableResources ?? config?.resources ?? [];
}

function getBusinessName(config?: PublicWidgetConfigDto): string {
  return config?.name ?? config?.business?.name ?? 'Widget';
}

function getBusinessId(config?: PublicWidgetConfigDto): string {
  return config?.businessId ?? config?.business?._id ?? '';
}

function getSlug(config?: PublicWidgetConfigDto): string {
  return config?.slug ?? config?.business?.slug ?? '';
}

function getWidgetSettings(config?: PublicWidgetConfigDto): Record<string, unknown> {
  return config?.widgetSettings ?? {};
}

function getThemeColor(config?: PublicWidgetConfigDto): string {
  const candidate = getWidgetSettings(config).accentColor;
  return typeof candidate === 'string' && /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : '#7c3f19';
}

function buildBookingPayload(config: PublicWidgetConfigDto, draft: WidgetDraft) {
  const startDate = combineDateTime(draft.date, draft.startTime);
  const endDate = combineDateTime(draft.date, draft.endTime);
  const businessId = getBusinessId(config);

  return {
    businessId,
    email: draft.email.trim(),
    endDate,
    fName: draft.fName.trim(),
    lName: draft.lName.trim(),
    notes: draft.notes.trim() || undefined,
    partySize: draft.partySize,
    phone: draft.phone.trim(),
    serviceResourceId: draft.resourceId || undefined,
    startDate,
    status: 'pending' as const,
    timein: startDate,
    timeout: endDate,
    userId: businessId,
  };
}

function WidgetNotice({ message }: { message: string }) {
  return (
    <p className="form-success" role="status" aria-live="polite">
      <CheckCircle2 size={16} aria-hidden="true" />
      {message}
    </p>
  );
}

export function WidgetPage() {
  const { slug = '' } = useParams();
  const [draft, setDraft] = useState<WidgetDraft>(createInitialDraft);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingDto | null>(null);
  const [suggestions, setSuggestions] = useState<BookingSuggestionDto[]>([]);

  const configQuery = useQuery({
    enabled: Boolean(slug),
    queryFn: async () => {
      const response = await getPublicWidgetConfig(slug);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['public-widget', slug],
  });

  const config = configQuery.data;
  const resources = useMemo(() => getResources(config), [config]);
  const selectedResource = resources.find((resource) => resource.id === draft.resourceId);
  const maxPartySize = selectedResource?.capacity ? Number(selectedResource.capacity) : undefined;
  const widgetSettings = getWidgetSettings(config);
  const heading = typeof widgetSettings.embedTitle === 'string' ? widgetSettings.embedTitle : 'Quick booking';
  const actionLabel = typeof widgetSettings.primaryActionLabel === 'string' ? widgetSettings.primaryActionLabel : 'Send request';
  const showNotes = widgetSettings.showNotes !== false;
  const showPartySize = widgetSettings.showPartySize !== false;
  const themeColor = getThemeColor(config);

  useEffect(() => {
    if (resources.length === 1 && !draft.resourceId) {
      setDraft((current) => ({
        ...current,
        resourceId: resources[0].id,
      }));
    }
  }, [draft.resourceId, resources]);

  useEffect(() => {
    if (!showPartySize) {
      return;
    }

    const clamped = clampPartySize(draft.partySize, maxPartySize);
    if (clamped !== draft.partySize) {
      setDraft((current) => ({
        ...current,
        partySize: clamped,
      }));
    }
  }, [draft.partySize, maxPartySize, showPartySize]);

  const suggestionMutation = useMutation({
    mutationFn: async () => {
      if (!config) {
        throw new Error('Widget config is still loading.');
      }

      const payload = buildBookingPayload(config, draft);
      const response = await getBookingSuggestions({
        businessId: payload.businessId,
        endDate: payload.endDate,
        maxSuggestions: 3,
        partySize: showPartySize ? payload.partySize : undefined,
        serviceResourceId: payload.serviceResourceId,
        startDate: payload.startDate,
        timein: payload.timein,
        timeout: payload.timeout,
      });

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (nextSuggestions) => {
      setSuggestions(nextSuggestions);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!config) {
        throw new Error('Widget config is still loading.');
      }

      const response = await createBooking(buildBookingPayload(config, draft));

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (booking) => {
      setCreatedBooking(booking);
    },
  });

  function updateDraft<Key extends keyof WidgetDraft>(key: Key, value: WidgetDraft[Key]) {
    setCreatedBooking(null);
    setValidationMessage(null);
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleCheckNearby() {
    if (!config) {
      return;
    }

    const nextValidationMessage = validatePublicBookingDraft({
      businessId: getBusinessId(config),
      date: draft.date,
      email: draft.email,
      endTime: draft.endTime,
      fName: draft.fName,
      lName: draft.lName,
      phone: draft.phone,
      resourceId: draft.resourceId,
      requireBusinessId: true,
      requireResource: false,
      startTime: draft.startTime,
    });

    if (nextValidationMessage) {
      setValidationMessage(nextValidationMessage);
      return;
    }

    setValidationMessage(null);
    suggestionMutation.mutate();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!config) {
      return;
    }

    const nextValidationMessage = validatePublicBookingDraft({
      businessId: getBusinessId(config),
      date: draft.date,
      email: draft.email,
      endTime: draft.endTime,
      fName: draft.fName,
      lName: draft.lName,
      phone: draft.phone,
      resourceId: draft.resourceId,
      requireBusinessId: true,
      requireResource: false,
      startTime: draft.startTime,
    });

    if (nextValidationMessage) {
      setValidationMessage(nextValidationMessage);
      return;
    }

    setValidationMessage(null);
    createMutation.mutate();
  }

  function applySuggestion(suggestion: BookingSuggestionDto) {
    setDraft((current) => ({
      ...current,
      date: formatInputDate(suggestion.startDate),
      endTime: formatInputTime(suggestion.timeout),
      startTime: formatInputTime(suggestion.timein),
    }));
  }

  const pageStyle = {
    '--widget-accent': themeColor,
  } as CSSProperties;

  return (
    <main className="widget-page" style={pageStyle}>
      <section className="widget-shell">
        <article className="widget-card widget-hero">
          <div className="widget-hero-copy">
            <p className="eyebrow">Embedded booking</p>
            <h1>{heading}</h1>
            <p>{config?.description ?? `Quick requests for ${getBusinessName(config)}.`}</p>
          </div>
          <div className="widget-hero-badge">
            <strong>{getBusinessName(config)}</strong>
            <span>{resources.length ? `${resources.length} resource option${resources.length === 1 ? '' : 's'}` : 'No listed resources'}</span>
          </div>
        </article>

        {configQuery.isLoading ? <p>Loading widget...</p> : null}
        {configQuery.isError ? (
          <p className="form-error" role="alert">
            {configQuery.error instanceof Error ? configQuery.error.message : 'Unable to load this widget.'}
          </p>
        ) : null}

        <article className="widget-card">
          <form className="widget-form" onSubmit={handleSubmit} noValidate>
            <fieldset className="widget-resource-fieldset">
              <legend>Choose a resource</legend>
              {resources.length ? (
                <div className="widget-resource-grid">
                  {resources.map((resource) => (
                    <button
                      key={resource.id}
                      type="button"
                      className="widget-resource-option"
                      aria-pressed={draft.resourceId === resource.id}
                      onClick={() => updateDraft('resourceId', resource.id)}
                    >
                      <strong>{resource.name}</strong>
                      <span>{resource.capacity ? `Capacity ${resource.capacity}` : resource.resourceType ?? resource.type ?? 'General request'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="General requests"
                  description="No public resources are listed, so this widget will submit a general request."
                />
              )}
            </fieldset>

            <div className="widget-form-grid">
              <label>
                Date
                <input type="date" value={draft.date} min={getInitialDate()} onChange={(event) => updateDraft('date', event.target.value)} />
              </label>
              <label>
                Start
                <input type="time" value={draft.startTime} onChange={(event) => updateDraft('startTime', event.target.value)} />
              </label>
              <label>
                End
                <input type="time" value={draft.endTime} onChange={(event) => updateDraft('endTime', event.target.value)} />
              </label>
              {showPartySize ? (
                <label>
                  Party size
                  <input
                    type="number"
                    min="1"
                    max={maxPartySize ? String(maxPartySize) : undefined}
                    value={draft.partySize}
                    onChange={(event) => updateDraft('partySize', clampPartySize(Number(event.target.value), maxPartySize))}
                  />
                </label>
              ) : null}
              <label>
                First name
                <input value={draft.fName} onChange={(event) => updateDraft('fName', event.target.value)} />
              </label>
              <label>
                Last name
                <input value={draft.lName} onChange={(event) => updateDraft('lName', event.target.value)} />
              </label>
              <label>
                Email
                <input type="email" value={draft.email} onChange={(event) => updateDraft('email', event.target.value)} />
              </label>
              <label>
                Phone
                <input value={draft.phone} onChange={(event) => updateDraft('phone', event.target.value)} />
              </label>
              {showNotes ? (
                <label>
                  Notes
                  <textarea value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} rows={3} />
                </label>
              ) : null}
            </div>

            {validationMessage ? (
              <p className="form-error" role="alert">
                {validationMessage}
              </p>
            ) : null}

            <div className="widget-action-row">
              <button className="secondary-button compact-button" type="button" onClick={handleCheckNearby} disabled={suggestionMutation.isPending}>
                Check nearby
              </button>
              <button className="primary-button compact-button" type="submit" disabled={createMutation.isPending}>
                {actionLabel}
              </button>
            </div>
          </form>
        </article>

        {suggestions.length ? (
          <article className="widget-card widget-feedback">
            <h2>Nearby options</h2>
            <div className="widget-suggestion-list">
              {suggestions.map((suggestion) => (
                <button key={`${suggestion.startDate}-${suggestion.timein}`} className="suggestion-option" type="button" onClick={() => applySuggestion(suggestion)}>
                  <strong>{suggestion.summary}</strong>
                  <span>
                    <Clock3 size={14} aria-hidden="true" /> {formatInputDate(suggestion.startDate)} {formatInputTime(suggestion.timein)} - {formatInputTime(suggestion.timeout)}
                  </span>
                </button>
              ))}
            </div>
          </article>
        ) : null}

        {createdBooking ? (
          <article className="widget-card widget-success-card">
            <WidgetNotice message="Booking request sent." />
            <p>Booking reference: {createdBooking._id}</p>
            <div className="widget-link-list">
              <Link
                className="widget-inline-link"
                to={`/book/${getSlug(config)}?date=${encodeURIComponent(draft.date)}&start=${encodeURIComponent(draft.startTime)}&end=${encodeURIComponent(draft.endTime)}&resourceId=${encodeURIComponent(draft.resourceId)}&partySize=${draft.partySize}&fName=${encodeURIComponent(draft.fName)}&lName=${encodeURIComponent(draft.lName)}&email=${encodeURIComponent(draft.email)}&phone=${encodeURIComponent(draft.phone)}`}
              >
                Continue on the full booking page
              </Link>
              <Link
                className="widget-inline-link"
                to={createPortalLink({
                  bookingId: createdBooking._id,
                  businessId: getBusinessId(config),
                  email: draft.email,
                  slug: getSlug(config),
                })}
              >
                Track or manage this booking
              </Link>
            </div>
          </article>
        ) : null}

        <article className="widget-card widget-summary">
          <p>
            <MapPin size={16} aria-hidden="true" /> {getBusinessName(config)}
          </p>
          <p>
            <UsersRound size={16} aria-hidden="true" /> {showPartySize ? `Party size set to ${draft.partySize}` : 'Compact request mode'}
          </p>
          <p>
            <Sparkles size={16} aria-hidden="true" /> Memory-only handoff into the hosted booking page or customer portal.
          </p>
        </article>
      </section>
    </main>
  );
}
