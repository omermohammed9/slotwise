import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CalendarDays, Mail, Phone, RefreshCw, Search, UserRound } from 'lucide-react';
import { listBookings } from '../../api/bookings';
import { getCustomer, listCustomers } from '../../api/customers';
import type { BookingDto, BookingListQuery, CustomerDto, QueryParams } from '../../api/types';
import { useSessionStore } from '../../auth/sessionStore';
import { LoadingState } from '../../components/AdminState';
import { EmptyState } from '../../components/EmptyState';
import { StatusChip } from '../../components/StatusChip';

function getCustomerName(customer?: CustomerDto): string {
  return `${customer?.fName ?? ''} ${customer?.lName ?? ''}`.trim() || 'Unnamed customer';
}

function formatDate(value?: string): string {
  if (!value) {
    return 'Not tracked';
  }

  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}

function formatTime(value?: string): string {
  if (!value) {
    return 'Not tracked';
  }

  try {
    return format(parseISO(value), 'h:mm a');
  } catch {
    return value;
  }
}

function buildBookingHistoryQuery(customer?: CustomerDto): BookingListQuery | undefined {
  if (!customer) {
    return undefined;
  }

  return {
    ...(customer._id ? { customerId: customer._id } : {}),
    ...(customer.email ? { email: customer.email } : {}),
    ...(customer.phone ? { phone: customer.phone } : {}),
    limit: 5,
    sortBy: 'startDate',
    sortOrder: 'desc',
  };
}

function DetailField({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value || 'Not set'}</strong>
    </div>
  );
}

function BookingHistory({ bookings }: { bookings: BookingDto[] }) {
  if (!bookings.length) {
    return <p className="body-copy">No booking history matched the existing customer fields.</p>;
  }

  return (
    <div className="customer-booking-list" aria-label="Customer booking history">
      {bookings.map((booking) => (
        <article className="customer-booking-row" key={booking._id}>
          <div>
            <h4>{formatDate(booking.startDate)}</h4>
            <p>
              {formatTime(booking.timein)} - {formatTime(booking.timeout)}
              {booking.serviceResourceId ? ` · ${booking.serviceResourceId}` : ''}
            </p>
          </div>
          <StatusChip status={booking.status}>{booking.status.replace('_', ' ')}</StatusChip>
        </article>
      ))}
    </div>
  );
}

export function CustomersPage() {
  const { token } = useSessionStore();
  const [businessId, setBusinessId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const query: QueryParams = useMemo(
    () => ({
      ...(businessId.trim() ? { businessId: businessId.trim() } : {}),
      ...(customerName.trim() ? { customerName: customerName.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    }),
    [businessId, customerName, email, phone],
  );

  const customersQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await listCustomers(query, token ?? '');

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['customers', query, token],
  });

  const customers = customersQuery.data ?? [];
  const selectedCustomer = customers.find((customer) => customer._id === selectedCustomerId);

  const customerDetailQuery = useQuery({
    enabled: Boolean(selectedCustomerId && token),
    queryFn: async () => {
      if (!selectedCustomerId || !token) {
        throw new Error('Select a customer before loading details.');
      }

      const response = await getCustomer(selectedCustomerId, token);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['customer-detail', selectedCustomerId, token],
  });

  const activeCustomer = customerDetailQuery.data ?? selectedCustomer;
  const bookingHistoryQuery = useQuery({
    enabled: Boolean(activeCustomer),
    queryFn: async () => {
      const response = await listBookings(buildBookingHistoryQuery(activeCustomer), token ?? undefined);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['customer-booking-history', activeCustomer?._id, activeCustomer?.email, activeCustomer?.phone, token],
  });

  return (
    <>
      <section className="workspace-header" aria-labelledby="customers-title">
        <div>
          <p className="eyebrow">Relationships</p>
          <h1 id="customers-title">Customers</h1>
          <p className="lede">Search customer records, review profile details, and inspect linked booking history.</p>
        </div>
        <div className="header-actions" aria-label="Customer actions">
          <button className="icon-button" type="button" aria-label="Refresh customers" onClick={() => customersQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel customer-controls" aria-label="Customer filters">
        <label className="form-field">
          Name
          <span className="input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Search by name" />
          </span>
        </label>
        <label className="form-field">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@example.com" />
        </label>
        <label className="form-field">
          Phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+15550001111" />
        </label>
        <label className="form-field">
          Business
          <input value={businessId} onChange={(event) => setBusinessId(event.target.value)} placeholder="Business ID" />
        </label>
      </section>

      <section className="content-grid customer-grid">
        <div className="panel customer-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Directory</p>
              <h2>Customer list</h2>
            </div>
            <p className="result-count">{customersQuery.isFetching ? 'Refreshing' : `${customers.length} shown`}</p>
          </div>

          {customersQuery.isLoading ? (
            <LoadingState label="Loading customers" />
          ) : customersQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Customers could not load"
              description={(customersQuery.error as Error).message}
            />
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No customers found"
              description="Adjust the current filters or try a broader customer search."
            />
          ) : (
            <div className="customer-list" aria-label="Customers">
              {customers.map((customer) => {
                const isSelected = customer._id === selectedCustomerId;

                return (
                  <button
                    className={`customer-row ${isSelected ? 'customer-row-selected' : ''}`}
                    key={customer._id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCustomerId(customer._id)}
                  >
                    <span className="customer-avatar" aria-hidden="true">
                      {getCustomerName(customer).slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <strong>{getCustomerName(customer)}</strong>
                      <small>{customer.email}</small>
                    </span>
                    <small>{customer.bookingCount ?? 0} bookings</small>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="panel customer-profile-panel" aria-label="Customer profile">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>{activeCustomer ? getCustomerName(activeCustomer) : 'Customer details'}</h2>
            </div>
            <UserRound size={20} aria-hidden="true" />
          </div>

          {!selectedCustomerId ? (
            <EmptyState
              icon={UserRound}
              title="Select a customer"
              description="Choose a customer from the directory to load profile details."
            />
          ) : customerDetailQuery.isLoading ? (
            <LoadingState label="Loading customer profile" />
          ) : customerDetailQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Customer profile could not load"
              description={(customerDetailQuery.error as Error).message}
            />
          ) : activeCustomer ? (
            <div className="detail-content compact-detail-content">
              <section className="detail-section" aria-label="Customer contact">
                <h3>Contact</h3>
                <p className="detail-line">
                  <Mail size={16} aria-hidden="true" />
                  {activeCustomer.email}
                </p>
                <p className="detail-line">
                  <Phone size={16} aria-hidden="true" />
                  {activeCustomer.phone ?? 'No phone recorded'}
                </p>
              </section>

              <div className="detail-grid">
                <DetailField label="Business" value={activeCustomer.businessId} />
                <DetailField label="Bookings" value={activeCustomer.bookingCount ?? 0} />
                <DetailField label="Customer ID" value={activeCustomer._id} />
                <DetailField label="Updated" value={formatDate(activeCustomer.updatedAt as string | undefined)} />
              </div>

              <section className="detail-section" aria-label="Customer booking history">
                <div className="panel-heading inline-heading">
                  <div>
                    <p className="eyebrow">History</p>
                    <h3>Recent bookings</h3>
                  </div>
                  <CalendarDays size={18} aria-hidden="true" />
                </div>
                {bookingHistoryQuery.isLoading ? (
                  <LoadingState label="Loading booking history" />
                ) : bookingHistoryQuery.isError ? (
                  <EmptyState
                    icon={AlertTriangle}
                    title="Booking history could not load"
                    description={(bookingHistoryQuery.error as Error).message}
                  />
                ) : (
                  <BookingHistory bookings={bookingHistoryQuery.data ?? []} />
                )}
              </section>
            </div>
          ) : null}
        </aside>
      </section>
    </>
  );
}
