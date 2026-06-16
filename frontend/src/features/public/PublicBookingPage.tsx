import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useSearchParams } from 'react-router';
import { createBooking, getBookingSuggestions } from '../../api/bookings';
import { getPublicBookingPageConfig } from '../../api/publicSurfaces';
import type { BookingDto, BookingSuggestionDto, PublicBookingPageConfigDto, PublicResourcePreviewDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import {
  clampPartySize,
  combineDateTime,
  createPortalLink,
  createPublicDraftFromSearchParams,
  formatInputDate,
  formatInputTime,
  getInitialDate,
  validatePublicBookingDraft,
} from './publicSurfaceUtils';

type BookingDraft = {
  date: string;
  email: string;
  endTime: string;
  fName: string;
  gender: string;
  lName: string;
  notes: string;
  partySize: number;
  phone: string;
  resourceId: string;
  startTime: string;
};

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function createInitialDraft(): BookingDraft {
  return {
    date: getInitialDate(),
    email: '',
    endTime: '10:00',
    fName: '',
    gender: 'not_specified',
    lName: '',
    notes: '',
    partySize: 1,
    phone: '',
    resourceId: '',
    startTime: '09:00',
  };
}

function getResources(config?: PublicBookingPageConfigDto): PublicResourcePreviewDto[] {
  return config?.availableResources ?? config?.resources ?? [];
}

function getBusinessName(config?: PublicBookingPageConfigDto): string {
  return config?.name ?? config?.business?.name ?? 'Booking page';
}

function getBusinessId(config?: PublicBookingPageConfigDto): string {
  return config?.businessId ?? config?.business?._id ?? '';
}

function getBusinessType(config?: PublicBookingPageConfigDto): string {
  return config?.businessType ?? config?.business?.businessType ?? 'service';
}

function getTimezone(config?: PublicBookingPageConfigDto): string {
  return config?.timezone ?? config?.business?.timezone ?? 'Local time';
}

function getResourceType(resource: PublicResourcePreviewDto): string {
  return resource.resourceType ?? resource.type ?? 'service';
}

function getResourceLabel(resource?: PublicResourcePreviewDto): string {
  if (!resource) {
    return 'General booking';
  }

  const type = getResourceType(resource);
  const details = [
    type,
    resource.durationMinutes ? `${resource.durationMinutes} min` : '',
    resource.capacity ? `up to ${resource.capacity}` : '',
  ].filter(Boolean);

  return details.length ? `${resource.name} · ${details.join(' · ')}` : resource.name;
}

function formatSlotDate(value: string): string {
  try {
    return format(parseISO(value), 'EEE, MMM d');
  } catch {
    return value;
  }
}

function formatSlotTime(value: string): string {
  try {
    return format(parseISO(value), 'h:mm a');
  } catch {
    return value;
  }
}

function isPartySizeRelevant(config: PublicBookingPageConfigDto, resources: PublicResourcePreviewDto[]): boolean {
  const businessType = getBusinessType(config).toLowerCase();
  return businessType.includes('restaurant') || resources.some((resource) => Number(resource.capacity ?? 0) > 1);
}

function getThemeColor(config?: PublicBookingPageConfigDto): string {
  const settings = config?.publicPageSettings ?? config?.pageSettings ?? {};
  const candidate = settings.brandColor ?? settings.primaryColor ?? settings.accentColor;
  return typeof candidate === 'string' && /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : '#0f766e';
}

function buildBookingPayload(config: PublicBookingPageConfigDto, draft: BookingDraft) {
  const startDate = combineDateTime(draft.date, draft.startTime);
  const endDate = combineDateTime(draft.date, draft.endTime);
  const businessId = getBusinessId(config);

  return {
    businessId,
    email: draft.email.trim(),
    endDate,
    fName: draft.fName.trim(),
    gender: draft.gender,
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

function PublicNotice({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  const Icon = tone === 'error' ? AlertTriangle : CheckCircle2;

  return (
    <p className={`form-${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <Icon size={16} aria-hidden="true" />
      {message}
    </p>
  );
}

export function PublicBookingPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    ...createInitialDraft(),
    ...createPublicDraftFromSearchParams(searchParams),
  }));
  const [createdBooking, setCreatedBooking] = useState<BookingDto | null>(null);
  const [suggestions, setSuggestions] = useState<BookingSuggestionDto[]>([]);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const configQuery = useQuery({
    enabled: Boolean(slug),
    queryFn: async () => {
      const response = await getPublicBookingPageConfig(slug);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['public-booking-page', slug],
  });

  const config = configQuery.data;
  const resources = useMemo(() => getResources(config), [config]);
  const selectedResource = resources.find((resource) => resource.id === draft.resourceId);
  const showPartySize = config ? isPartySizeRelevant(config, resources) : true;
  const themeColor = getThemeColor(config);
  const minDate = getInitialDate();
  const maxPartySize = selectedResource?.capacity ? Number(selectedResource.capacity) : undefined;

  useEffect(() => {
    if (!resources.length) {
      if (draft.resourceId) {
        setDraft((current) => ({
          ...current,
          resourceId: '',
        }));
      }
      return;
    }

    if (resources.length === 1 && !draft.resourceId) {
      setDraft((current) => ({
        ...current,
        resourceId: resources[0].id,
      }));
      return;
    }

    if (draft.resourceId && !resources.some((resource) => resource.id === draft.resourceId)) {
      setDraft((current) => ({
        ...current,
        resourceId: '',
      }));
    }
  }, [draft.resourceId, resources]);

  useEffect(() => {
    if (!showPartySize) {
      return;
    }

    const clampedPartySize = clampPartySize(draft.partySize, maxPartySize);
    if (clampedPartySize !== draft.partySize) {
      setDraft((current) => ({
        ...current,
        partySize: clampedPartySize,
      }));
    }
  }, [draft.partySize, maxPartySize, showPartySize]);

  const suggestionMutation = useMutation({
    mutationFn: async () => {
      if (!config) {
        throw new Error('Booking page is still loading.');
      }

      const payload = buildBookingPayload(config, draft);
      const response = await getBookingSuggestions({
        businessId: payload.businessId,
        ...(payload.serviceResourceId ? { serviceResourceId: payload.serviceResourceId } : {}),
        endDate: payload.endDate,
        maxSuggestions: 3,
        partySize: showPartySize ? payload.partySize : undefined,
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
        throw new Error('Booking page is still loading.');
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

  function updateDraft<Key extends keyof BookingDraft>(key: Key, value: BookingDraft[Key]) {
    setValidationMessage(null);
    setCreatedBooking(null);
    createMutation.reset();
    suggestionMutation.reset();
    setSuggestions([]);
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSuggestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextValidationMessage = validatePublicBookingDraft({
      draft,
      maxPartySize,
      minDate,
      requireResource: resources.length > 0,
      selectedResource,
      showPartySize,
    });

    if (nextValidationMessage) {
      setValidationMessage(nextValidationMessage);
      return;
    }

    setValidationMessage(null);
    suggestionMutation.mutate();
  }

  function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextValidationMessage = validatePublicBookingDraft({
      draft,
      maxPartySize,
      minDate,
      requireResource: resources.length > 0,
      selectedResource,
      showPartySize,
    });

    if (nextValidationMessage) {
      setValidationMessage(nextValidationMessage);
      return;
    }

    setValidationMessage(null);
    createMutation.mutate();
  }

  function applySuggestion(suggestion: BookingSuggestionDto) {
    setValidationMessage(null);
    setCreatedBooking(null);
    createMutation.reset();
    setDraft((current) => ({
      ...current,
      date: formatInputDate(suggestion.startDate),
      endTime: formatInputTime(suggestion.timeout),
      startTime: formatInputTime(suggestion.timein),
    }));
  }

  if (configQuery.isLoading) {
    return (
      <main className="public-booking-page">
        <div className="public-booking-shell">
          <div className="table-state" role="status" aria-live="polite">
            Loading booking page
          </div>
        </div>
      </main>
    );
  }

  if (configQuery.isError || !config) {
    return (
      <main className="public-booking-page">
        <div className="public-booking-shell">
          <EmptyState
            icon={AlertTriangle}
            title="Booking page unavailable"
            description={configQuery.isError ? (configQuery.error as Error).message : 'This booking page could not be found.'}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="public-booking-page" style={{ '--public-accent': themeColor } as CSSProperties}>
      <div className="public-booking-shell">
        <section className="public-booking-hero" aria-labelledby="public-booking-title">
          <div>
            <p className="eyebrow">{getBusinessType(config)} booking</p>
            <h1 id="public-booking-title">{getBusinessName(config)}</h1>
            {config.description ? <p className="lede">{config.description}</p> : null}
          </div>
          <div className="public-brand-panel" aria-label="Booking page details">
            <span className="public-brand-mark">{getBusinessName(config).slice(0, 2).toUpperCase()}</span>
            <strong>{getTimezone(config)}</strong>
            <span>{resources.length ? `${resources.length} bookable options` : 'General requests only'}</span>
          </div>
        </section>

        <section className="public-booking-layout">
          <form className="panel public-booking-form" noValidate onSubmit={handleBookingSubmit}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Request a time</p>
                <h2>Booking details</h2>
              </div>
              <CalendarClock size={20} aria-hidden="true" />
            </div>

            {resources.length ? (
              <fieldset className="public-resource-fieldset">
                <legend>Service or resource</legend>
                <div className="public-resource-grid">
                  {resources.map((resource) => (
                    <button
                      aria-pressed={draft.resourceId === resource.id}
                      className="public-resource-option"
                      key={resource.id}
                      type="button"
                      onClick={() => updateDraft('resourceId', resource.id)}
                    >
                      <strong>{resource.name}</strong>
                      <span>{getResourceLabel(resource).replace(`${resource.name} · `, '')}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <div className="public-inline-empty" role="status">
                <Sparkles size={18} aria-hidden="true" />
                <span>No public resources are listed. Your request will be sent as a general booking.</span>
              </div>
            )}

            <div className="public-form-grid">
              <label className="form-field">
                Date
                <input
                  min={minDate}
                  required
                  type="date"
                  value={draft.date}
                  onChange={(event) => updateDraft('date', event.target.value)}
                />
              </label>
              <label className="form-field">
                Start
                <input
                  aria-describedby="public-booking-time-help"
                  required
                  type="time"
                  value={draft.startTime}
                  onChange={(event) => updateDraft('startTime', event.target.value)}
                />
              </label>
              <label className="form-field">
                End
                <input
                  aria-describedby="public-booking-time-help"
                  required
                  type="time"
                  value={draft.endTime}
                  onChange={(event) => updateDraft('endTime', event.target.value)}
                />
              </label>
              {showPartySize ? (
                <label className="form-field">
                  Party size
                  <input
                    max={maxPartySize ? String(maxPartySize) : undefined}
                    min="1"
                    required
                    type="number"
                    value={draft.partySize}
                    onChange={(event) => updateDraft('partySize', clampPartySize(Number(event.target.value), maxPartySize))}
                  />
                </label>
              ) : null}
            </div>
            <p className="field-note" id="public-booking-time-help">
              Requests stay on the same day and the end time must be after the start time.
            </p>

            <div className="public-form-grid">
              <label className="form-field">
                First name
                <input
                  autoComplete="given-name"
                  required
                  value={draft.fName}
                  onChange={(event) => updateDraft('fName', event.target.value)}
                />
              </label>
              <label className="form-field">
                Last name
                <input
                  autoComplete="family-name"
                  required
                  value={draft.lName}
                  onChange={(event) => updateDraft('lName', event.target.value)}
                />
              </label>
              <label className="form-field">
                Email
                <input
                  autoComplete="email"
                  required
                  type="email"
                  value={draft.email}
                  onChange={(event) => updateDraft('email', event.target.value)}
                />
              </label>
              <label className="form-field">
                Phone
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  type="tel"
                  value={draft.phone}
                  onChange={(event) => updateDraft('phone', event.target.value)}
                />
              </label>
              <label className="form-field">
                Gender
                <select value={draft.gender} onChange={(event) => updateDraft('gender', event.target.value)}>
                  <option value="not_specified">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non_binary">Non-binary</option>
                </select>
              </label>
            </div>

            <label className="form-field">
              Notes
              <textarea
                maxLength={500}
                placeholder="Accessibility, seating, or arrival details"
                value={draft.notes}
                onChange={(event) => updateDraft('notes', event.target.value)}
              />
            </label>

            {validationMessage ? <PublicNotice tone="error" message={validationMessage} /> : null}
            {createMutation.isError ? <PublicNotice tone="error" message={(createMutation.error as Error).message} /> : null}
            {createdBooking ? (
              <div className="public-success-stack">
                <PublicNotice tone="success" message="Booking request sent. The team will review and follow up if needed." />
                <p className="field-note">Booking reference: {createdBooking._id}</p>
                <Link
                  className="portal-inline-link"
                  to={createPortalLink({
                    booking: createdBooking,
                    businessId: getBusinessId(config),
                    email: draft.email.trim(),
                    slug,
                  })}
                >
                  Track or manage this booking in the portal
                </Link>
              </div>
            ) : null}

            <div className="public-action-row">
              <button className="primary-button" disabled={createMutation.isPending || suggestionMutation.isPending} type="submit">
                <CheckCircle2 size={17} aria-hidden="true" />
                {createMutation.isPending ? 'Sending' : 'Request booking'}
              </button>
            </div>
          </form>

          <aside className="public-side-panel">
            <form className="panel public-suggestion-panel" noValidate onSubmit={handleSuggestionSubmit}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Availability</p>
                  <h2>Nearby options</h2>
                </div>
                <Sparkles size={20} aria-hidden="true" />
              </div>
              <p className="body-copy">
                Check nearby slots before sending the request. Suggestions use the existing booking suggestion service.
              </p>
              {validationMessage ? <PublicNotice tone="error" message={validationMessage} /> : null}
              {suggestionMutation.isError ? <PublicNotice tone="error" message={(suggestionMutation.error as Error).message} /> : null}
              <button
                className="secondary-button compact-button"
                disabled={suggestionMutation.isPending || createMutation.isPending}
                type="submit"
              >
                <Clock3 size={17} aria-hidden="true" />
                {suggestionMutation.isPending ? 'Checking' : 'Check availability'}
              </button>
              {suggestionMutation.isSuccess && suggestions.length === 0 ? (
                <PublicNotice tone="success" message="No better nearby alternatives were returned for this request." />
              ) : null}
              {suggestions.length ? (
                <div className="suggestion-list" aria-label="Suggested public booking slots">
                  {suggestions.map((suggestion) => (
                    <button
                      className="suggestion-option"
                      key={`${suggestion.timein}-${suggestion.timeout}`}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <span>
                        {formatSlotDate(suggestion.startDate)} · {formatSlotTime(suggestion.timein)} - {formatSlotTime(suggestion.timeout)}
                      </span>
                      <strong>{suggestion.score}/100</strong>
                      <small>{suggestion.summary}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </form>

            <section className="panel public-summary-panel" aria-label="Selected booking summary">
              <h2>Summary</h2>
              <p className="detail-line">
                <Sparkles size={16} aria-hidden="true" />
                {getResourceLabel(selectedResource)}
              </p>
              <p className="detail-line">
                <CalendarClock size={16} aria-hidden="true" />
                {draft.date} from {draft.startTime} to {draft.endTime}
              </p>
              {showPartySize ? (
                <p className="detail-line">
                  <UsersRound size={16} aria-hidden="true" />
                  {draft.partySize} guest{draft.partySize === 1 ? '' : 's'}
                </p>
              ) : null}
              {config.contactDetails?.email ? (
                <p className="detail-line">
                  <Mail size={16} aria-hidden="true" />
                  {config.contactDetails.email}
                </p>
              ) : null}
              {config.contactDetails?.phone ? (
                <p className="detail-line">
                  <Phone size={16} aria-hidden="true" />
                  {config.contactDetails.phone}
                </p>
              ) : null}
              {config.workingHours?.length ? (
                <div className="public-hours-list">
                  {config.workingHours.map((hours) => (
                    <span key={`${hours.dayOfWeek}-${hours.startTime}`}>
                      <MapPin size={14} aria-hidden="true" />
                      {dayLabels[hours.dayOfWeek] ?? 'Day'} {hours.closed ? 'Closed' : `${hours.startTime} - ${hours.endTime}`}
                    </span>
                  ))}
                </div>
              ) : null}
              {draft.notes.trim() ? (
                <p className="detail-line">
                  <MessageSquareText size={16} aria-hidden="true" />
                  {draft.notes}
                </p>
              ) : null}
              <Link
                className="portal-inline-link"
                to={createPortalLink({
                  booking: createdBooking,
                  businessId: getBusinessId(config),
                  email: draft.email.trim(),
                  slug,
                })}
              >
                Already booked? Request a portal magic link
              </Link>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
