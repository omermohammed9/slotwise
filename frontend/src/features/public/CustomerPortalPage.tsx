import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CalendarClock, Link2, Mail, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { requestCustomerMagicLink, verifyCustomerMagicLink } from '../../api/auth';
import { customerCancelBooking, customerRescheduleBooking, listBookings } from '../../api/bookings';
import type { BookingDto } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { useCustomerSessionStore } from '../../auth/sessionStore';
import { useSessionRevalidation } from '../../auth/useSessionRevalidation';
import { combineDateTime, formatInputDate, formatInputTime } from './publicSurfaceUtils';

function formatBookingWindow(booking: BookingDto): string {
  try {
    return `${format(parseISO(booking.timein), 'MMM d, yyyy h:mm a')} - ${format(parseISO(booking.timeout), 'h:mm a')}`;
  } catch {
    return `${booking.startDate} ${booking.timein}`;
  }
}

function isFinalStatus(status: BookingDto['status']): boolean {
  return ['cancelled', 'completed', 'no_show', 'rejected'].includes(status);
}

function getBookingName(booking: BookingDto): string {
  return `${booking.fName} ${booking.lName}`.trim() || booking.email;
}

function PortalNotice({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  return (
    <p className={`form-${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      {message}
    </p>
  );
}

export function CustomerPortalPage() {
  const [searchParams] = useSearchParams();
  const initialBusinessId = searchParams.get('businessId') ?? '';
  const initialEmail = searchParams.get('email') ?? '';
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [businessId, setBusinessId] = useState(initialBusinessId);
  const [email, setEmail] = useState(initialEmail);
  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(searchParams.get('bookingId'));
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [portalMessage, setPortalMessage] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const { clearSession, notice, session, setNotice, setSession, token } = useCustomerSessionStore();
  const shouldRevalidateSession = Boolean(token && session && (session.actorType || session.expiresAt || session.sessionId));
  const { isInitialCheckPending } = useSessionRevalidation({
    clearSession,
    enabled: shouldRevalidateSession,
    invalidMessage: 'Your customer session expired. Customer sign-in required to continue.',
    session,
    setNotice,
    setSession,
    token,
  });

  const magicLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await requestCustomerMagicLink({
        businessId: businessId.trim(),
        email: email.trim(),
      });

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      setRequestError(null);
      setRequestMessage('Magic link requested. Check your email for the portal token.');
    },
    onError: (error) => {
      setRequestMessage(null);
      setRequestError(error instanceof Error ? error.message : 'Unable to request a magic link.');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (rawToken: string) => {
      const response = await verifyCustomerMagicLink({
        token: rawToken.trim(),
      });

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (nextSession) => {
      setPortalError(null);
      setPortalMessage('Customer session verified.');
      setSession(nextSession);
      setBusinessId(nextSession.businessId ?? businessId);
      setEmail(nextSession.email ?? email);
      setTokenInput('');
    },
    onError: (error) => {
      setPortalMessage(null);
      setPortalError(error instanceof Error ? error.message : 'Unable to verify this token.');
    },
  });

  const bookingsQuery = useQuery({
    enabled: Boolean(token && businessId && email),
    queryFn: async () => {
      const response = await listBookings(
        {
          businessId,
          email,
        },
        token ?? undefined,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['customer-portal-bookings', businessId, email, token],
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await customerCancelBooking(
        bookingId,
        {
          reason: cancelReason.trim() || undefined,
        },
        token ?? '',
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      setPortalError(null);
      setPortalMessage('Booking cancelled.');
      void bookingsQuery.refetch();
    },
    onError: (error) => {
      setPortalMessage(null);
      setPortalError(error instanceof Error ? error.message : 'Unable to cancel this booking.');
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const startDate = combineDateTime(rescheduleDate, rescheduleStart);
      const endDate = combineDateTime(rescheduleDate, rescheduleEnd);
      const response = await customerRescheduleBooking(
        bookingId,
        {
          endDate,
          reason: rescheduleReason.trim() || undefined,
          startDate,
          timein: startDate,
          timeout: endDate,
        },
        token ?? '',
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      setPortalError(null);
      setPortalMessage('Reschedule request sent.');
      void bookingsQuery.refetch();
    },
    onError: (error) => {
      setPortalMessage(null);
      setPortalError(error instanceof Error ? error.message : 'Unable to reschedule this booking.');
    },
  });

  useEffect(() => {
    if (!tokenFromUrl || session || verifyMutation.isPending) {
      return;
    }

    void verifyMutation.mutateAsync(tokenFromUrl);
  }, [session, tokenFromUrl, verifyMutation]);

  useEffect(() => {
    const bookings = bookingsQuery.data ?? [];

    if (!bookings.length) {
      setSelectedBookingId(null);
      return;
    }

    if (selectedBookingId && bookings.some((booking) => booking._id === selectedBookingId)) {
      return;
    }

    setSelectedBookingId(searchParams.get('bookingId') ?? bookings[0]._id);
  }, [bookingsQuery.data, searchParams, selectedBookingId]);

  const selectedBooking = useMemo(
    () => (bookingsQuery.data ?? []).find((booking) => booking._id === selectedBookingId) ?? null,
    [bookingsQuery.data, selectedBookingId],
  );

  useEffect(() => {
    if (!selectedBooking) {
      return;
    }

    setRescheduleDate(formatInputDate(selectedBooking.startDate));
    setRescheduleStart(formatInputTime(selectedBooking.timein));
    setRescheduleEnd(formatInputTime(selectedBooking.timeout));
  }, [selectedBooking?._id]);

  function handleMagicLinkRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    setRequestMessage(null);

    if (!businessId.trim()) {
      setRequestError('Enter the business ID from your booking confirmation.');
      return;
    }

    if (!email.trim()) {
      setRequestError('Enter the email address used for the booking.');
      return;
    }

    magicLinkMutation.mutate();
  }

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPortalError(null);
    setPortalMessage(null);

    if (tokenInput.trim().length < 8) {
      setPortalError('Paste the full magic-link token from your email.');
      return;
    }

    verifyMutation.mutate(tokenInput);
  }

  async function handleCancelBooking() {
    if (!selectedBooking || !window.confirm('Cancel this booking?')) {
      return;
    }

    await cancelMutation.mutateAsync(selectedBooking._id);
  }

  async function handleRescheduleBooking() {
    if (!selectedBooking) {
      return;
    }

    if (!rescheduleDate || !rescheduleStart || !rescheduleEnd) {
      setPortalError('Choose a date, start time, and end time for the new request.');
      return;
    }

    if (!window.confirm('Reschedule this booking?')) {
      return;
    }

    await rescheduleMutation.mutateAsync(selectedBooking._id);
  }

  if (isInitialCheckPending) {
    return (
      <main className="portal-page">
        <section className="portal-shell">
          <div className="portal-hero-card">
            <h1>Checking your customer session</h1>
            <p>Slotwise is revalidating this memory-only portal session before loading your bookings.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-hero">
          <div className="portal-hero-card">
            <span className="portal-hero-mark">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <p className="eyebrow">Customer portal</p>
            <h1>Manage your booking</h1>
            <p>Request a magic link, verify the portal token, and manage existing bookings without changing operator sessions.</p>
            <div className="portal-hero-links">
              <span>{businessId || 'Business ID ready when you are'}</span>
              <span>{email || 'Email lookup available after verification'}</span>
            </div>
          </div>
        </header>

        {notice ? <PortalNotice message={notice.message} tone={notice.tone} /> : null}
        {requestError ? <PortalNotice message={requestError} tone="error" /> : null}
        {requestMessage ? <PortalNotice message={requestMessage} tone="success" /> : null}
        {portalError ? <PortalNotice message={portalError} tone="error" /> : null}
        {portalMessage ? <PortalNotice message={portalMessage} tone="success" /> : null}

        <section className="portal-grid">
          <article className="portal-auth-panel portal-stack">
            <div className="portal-section-heading">
              <h3>Portal access</h3>
              <p>Use the same email from your booking confirmation to request a portal token.</p>
            </div>

            <form className="portal-form" onSubmit={handleMagicLinkRequest} noValidate>
              <label>
                Business ID
                <input value={businessId} onChange={(event) => setBusinessId(event.target.value)} />
              </label>
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <button className="primary-button compact-button" type="submit" disabled={magicLinkMutation.isPending}>
                Send magic link
              </button>
            </form>

            <form className="portal-form" onSubmit={handleVerify} noValidate>
              <label>
                Magic-link token
                <input value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} />
              </label>
              <button className="secondary-button compact-button" type="submit" disabled={verifyMutation.isPending}>
                Verify token
              </button>
            </form>
          </article>

          <article className="portal-session-panel portal-stack">
            <div className="portal-section-heading">
              <h3>Session status</h3>
              <p>{session ? 'Portal access is active.' : 'Verify a token to unlock booking details.'}</p>
            </div>

            <div className="portal-session-details">
              <p>
                <Mail size={16} aria-hidden="true" /> {(session?.email ?? email) || 'No customer email yet'}
              </p>
              <p>
                <Link2 size={16} aria-hidden="true" /> {(session?.businessId ?? businessId) || 'Business ID required'}
              </p>
            </div>
          </article>
        </section>

        <section className="portal-grid">
          <article className="portal-booking-panel portal-stack">
            <div className="portal-section-heading">
              <h3>Bookings</h3>
              <p>Choose a booking to inspect details or send a cancellation/reschedule request.</p>
            </div>

            {bookingsQuery.isLoading ? <p>Loading bookings...</p> : null}
            {bookingsQuery.isError ? (
              <PortalNotice
                message={bookingsQuery.error instanceof Error ? bookingsQuery.error.message : 'Unable to load bookings.'}
                tone="error"
              />
            ) : null}
            {!bookingsQuery.isLoading && !bookingsQuery.data?.length ? (
              <EmptyState
                icon={CalendarClock}
                title="No bookings yet"
                description="Verified customers will see current bookings here once the backend returns matching records."
              />
            ) : null}

            <div className="portal-booking-list">
              {(bookingsQuery.data ?? []).map((booking) => (
                <button
                  key={booking._id}
                  type="button"
                  className={booking._id === selectedBookingId ? 'portal-booking-row portal-booking-row-selected' : 'portal-booking-row'}
                  onClick={() => setSelectedBookingId(booking._id)}
                >
                  <div>
                    <strong>{booking._id}</strong>
                    <p>{getBookingName(booking)}</p>
                    <small>{formatBookingWindow(booking)}</small>
                  </div>
                  <span className={`status-chip status-chip-${booking.status}`}>{booking.status}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="portal-detail-panel portal-stack">
            <div className="portal-section-heading">
              <h3>Booking detail</h3>
              <p>Review the selected booking before requesting changes.</p>
            </div>

            {selectedBooking ? (
              <div className="portal-detail-content">
                <div className="portal-detail-grid">
                  <div>
                    <strong>Guest</strong>
                    <p>{getBookingName(selectedBooking)}</p>
                  </div>
                  <div>
                    <strong>Status</strong>
                    <p>{selectedBooking.status}</p>
                  </div>
                  <div>
                    <strong>Window</strong>
                    <p>{formatBookingWindow(selectedBooking)}</p>
                  </div>
                  <div>
                    <strong>Phone</strong>
                    <p>{selectedBooking.phone || 'No phone supplied'}</p>
                  </div>
                </div>

                {selectedBooking.notes ? (
                  <p className="field-note">{selectedBooking.notes}</p>
                ) : null}

                {isFinalStatus(selectedBooking.status) ? (
                  <PortalNotice message="Already in a final state." tone="success" />
                ) : null}

                <div className="portal-actions-stack">
                  <label className="portal-lookup-field">
                    Reason
                    <input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
                  </label>
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={() => void handleCancelBooking()}
                    disabled={cancelMutation.isPending || isFinalStatus(selectedBooking.status)}
                  >
                    Cancel booking
                  </button>

                  <div className="portal-detail-grid">
                    <label>
                      Date
                      <input type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} />
                    </label>
                    <label>
                      Start
                      <input type="time" value={rescheduleStart} onChange={(event) => setRescheduleStart(event.target.value)} />
                    </label>
                    <label>
                      End
                      <input type="time" value={rescheduleEnd} onChange={(event) => setRescheduleEnd(event.target.value)} />
                    </label>
                    <label>
                      Reason
                      <input value={rescheduleReason} onChange={(event) => setRescheduleReason(event.target.value)} />
                    </label>
                  </div>

                  <button
                    className="primary-button compact-button"
                    type="button"
                    onClick={() => void handleRescheduleBooking()}
                    disabled={rescheduleMutation.isPending}
                  >
                    Reschedule booking
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="Choose a booking"
                description="Booking detail appears here once a verified customer selects an entry."
              />
            )}
          </article>
        </section>
      </section>
    </main>
  );
}
