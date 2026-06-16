import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';
import { listBookings } from '../../api/bookings';
import { listBusinesses } from '../../api/businesses';
import { createCustomer, getCustomer, listCustomers, updateCustomer } from '../../api/customers';
import type { BookingDto, BookingListQuery, BusinessProfileDto, CustomerDto, QueryParams } from '../../api/types';
import { useSessionStore } from '../../auth/sessionStore';
import { InlineNotice, LoadingState } from '../../components/AdminState';
import { EmptyState } from '../../components/EmptyState';
import { StatusChip } from '../../components/StatusChip';

type CustomerFormState = {
  businessId: string;
  email: string;
  firstName: string;
  lastName: string;
  notes: string;
  phone: string;
  preferredNotificationChannels: Array<'email' | 'sms'>;
};

const defaultCustomerFormState: CustomerFormState = {
  businessId: '',
  email: '',
  firstName: '',
  lastName: '',
  notes: '',
  phone: '',
  preferredNotificationChannels: ['email'],
};

function getCustomerFirstName(customer?: CustomerDto): string {
  return customer?.firstName ?? customer?.fName ?? '';
}

function getCustomerLastName(customer?: CustomerDto): string {
  return customer?.lastName ?? customer?.lName ?? '';
}

function getCustomerName(customer?: CustomerDto): string {
  return `${getCustomerFirstName(customer)} ${getCustomerLastName(customer)}`.trim() || 'Unnamed customer';
}

function getCustomerBookingCount(customer?: CustomerDto): number {
  return Number(customer?.totalBookings ?? customer?.bookingCount ?? 0);
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

function createCustomerFormState(customer?: CustomerDto): CustomerFormState {
  return {
    businessId: customer?.businessId ?? '',
    email: customer?.email ?? '',
    firstName: getCustomerFirstName(customer),
    lastName: getCustomerLastName(customer),
    notes: customer?.notes ?? '',
    phone: customer?.phone ?? '',
    preferredNotificationChannels: customer?.preferredNotificationChannels?.length
      ? customer.preferredNotificationChannels
      : ['email'],
  };
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

function getBusinessName(businesses: BusinessProfileDto[], businessId?: string): string {
  if (!businessId) {
    return 'Not set';
  }

  return businesses.find((business) => business._id === businessId)?.name ?? businessId;
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
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CustomerFormState>(defaultCustomerFormState);
  const [editForm, setEditForm] = useState<CustomerFormState>(defaultCustomerFormState);

  const businessesQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await listBusinesses(token ?? '');

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['businesses', token],
  });

  const businesses = businessesQuery.data ?? [];

  useEffect(() => {
    if (!createForm.businessId && businessId) {
      setCreateForm((currentForm) => ({ ...currentForm, businessId }));
    }
  }, [businessId, createForm.businessId]);

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

  useEffect(() => {
    if (!activeCustomer) {
      return;
    }

    setEditForm(createCustomerFormState(activeCustomer));
  }, [activeCustomer]);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Sign in before creating customers.');
      }

      const response = await createCustomer(
        {
          businessId: createForm.businessId.trim(),
          email: createForm.email.trim(),
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          ...(createForm.notes.trim() ? { notes: createForm.notes.trim() } : {}),
          phone: createForm.phone.trim(),
          preferredNotificationChannels: createForm.preferredNotificationChannels,
        },
        token,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (customer) => {
      setCreateForm({
        ...defaultCustomerFormState,
        businessId,
      });
      setSelectedCustomerId(customer._id);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.setQueryData(['customer-detail', customer._id, token], customer);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId || !token) {
        throw new Error('Select a customer before saving.');
      }

      const response = await updateCustomer(
        selectedCustomerId,
        {
          businessId: editForm.businessId.trim(),
          email: editForm.email.trim(),
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          notes: editForm.notes.trim(),
          phone: editForm.phone.trim(),
          preferredNotificationChannels: editForm.preferredNotificationChannels,
        },
        token,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.setQueryData(['customer-detail', customer._id, token], customer);
    },
  });

  function toggleNotificationChannel(channel: 'email' | 'sms', target: 'create' | 'edit') {
    const formState = target === 'create' ? createForm : editForm;
    const nextChannels = formState.preferredNotificationChannels.includes(channel)
      ? formState.preferredNotificationChannels.filter((entry) => entry !== channel)
      : [...formState.preferredNotificationChannels, channel];
    const normalizedChannels: Array<'email' | 'sms'> = nextChannels.length ? nextChannels : ['email'];

    if (target === 'create') {
      setCreateForm({ ...formState, preferredNotificationChannels: normalizedChannels });
      return;
    }

    setEditForm({ ...formState, preferredNotificationChannels: normalizedChannels });
  }

  return (
    <>
      <section className="workspace-header" aria-labelledby="customers-title">
        <div>
          <p className="eyebrow">Relationships</p>
          <h1 id="customers-title">Customers</h1>
          <p className="lede">Search customer records, create new profiles, and edit customer details with recent booking history.</p>
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
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
            <option value="">All businesses</option>
            {businesses.map((business) => (
              <option key={business._id} value={business._id}>
                {business.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="content-grid customer-grid">
        <div className="panel customer-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>New customer</h2>
            </div>
            <Plus size={20} aria-hidden="true" />
          </div>
          <form
            className="management-form"
            aria-label="Create customer form"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <label className="form-field">
              Business
              <select
                value={createForm.businessId}
                onChange={(event) => setCreateForm({ ...createForm, businessId: event.target.value })}
                required
              >
                <option value="">Select a business</option>
                {businesses.map((business) => (
                  <option key={business._id} value={business._id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="form-field">
                First name
                <input
                  value={createForm.firstName}
                  onChange={(event) => setCreateForm({ ...createForm, firstName: event.target.value })}
                  required
                />
              </label>
              <label className="form-field">
                Last name
                <input
                  value={createForm.lastName}
                  onChange={(event) => setCreateForm({ ...createForm, lastName: event.target.value })}
                  required
                />
              </label>
            </div>
            <label className="form-field">
              Email
              <input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
                required
              />
            </label>
            <label className="form-field">
              Phone
              <input value={createForm.phone} onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })} required />
            </label>
            <label className="form-field">
              Notes
              <textarea value={createForm.notes} onChange={(event) => setCreateForm({ ...createForm, notes: event.target.value })} />
            </label>
            <fieldset className="form-field">
              <legend>Preferred notifications</legend>
              <div className="checkbox-grid" role="group" aria-label="Create customer preferred notifications">
                {(['email', 'sms'] as const).map((channel) => (
                  <label className="toggle-field" key={channel}>
                    <input
                      checked={createForm.preferredNotificationChannels.includes(channel)}
                      type="checkbox"
                      onChange={() => toggleNotificationChannel(channel, 'create')}
                    />
                    {channel}
                  </label>
                ))}
              </div>
            </fieldset>
            {createMutation.isError ? (
              <InlineNotice tone="error" message={(createMutation.error as Error).message} icon={AlertTriangle} />
            ) : null}
            {createMutation.isSuccess ? (
              <InlineNotice tone="success" message="Customer created." icon={CheckCircle2} />
            ) : null}
            <button className="primary-button compact-button" type="submit" disabled={createMutation.isPending}>
              <Plus size={17} aria-hidden="true" />
              {createMutation.isPending ? 'Creating' : 'Create customer'}
            </button>
          </form>

          <div className="panel-heading customer-directory-heading">
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
              description="Adjust the current filters or create a customer for the selected business."
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
                    <small>{getCustomerBookingCount(customer)} bookings</small>
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
                <DetailField label="Business" value={getBusinessName(businesses, activeCustomer.businessId)} />
                <DetailField label="Bookings" value={getCustomerBookingCount(activeCustomer)} />
                <DetailField label="Customer ID" value={activeCustomer._id} />
                <DetailField label="Updated" value={formatDate(activeCustomer.updatedAt as string | undefined)} />
              </div>

              <section className="detail-section" aria-label="Edit customer profile">
                <div className="panel-heading inline-heading">
                  <div>
                    <p className="eyebrow">Edit</p>
                    <h3>Customer profile</h3>
                  </div>
                </div>
                <div className="form-grid">
                  <label className="form-field">
                    First name
                    <input value={editForm.firstName} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} />
                  </label>
                  <label className="form-field">
                    Last name
                    <input value={editForm.lastName} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} />
                  </label>
                </div>
                <label className="form-field">
                  Business
                  <select value={editForm.businessId} onChange={(event) => setEditForm({ ...editForm, businessId: event.target.value })}>
                    <option value="">Select a business</option>
                    {businesses.map((business) => (
                      <option key={business._id} value={business._id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  Email
                  <input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
                </label>
                <label className="form-field">
                  Phone
                  <input value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />
                </label>
                <label className="form-field">
                  Notes
                  <textarea value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} />
                </label>
                <fieldset className="form-field">
                  <legend>Preferred notifications</legend>
                  <div className="checkbox-grid" role="group" aria-label="Edit customer preferred notifications">
                    {(['email', 'sms'] as const).map((channel) => (
                      <label className="toggle-field" key={channel}>
                        <input
                          checked={editForm.preferredNotificationChannels.includes(channel)}
                          type="checkbox"
                          onChange={() => toggleNotificationChannel(channel, 'edit')}
                        />
                        {channel}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {updateMutation.isError ? (
                  <InlineNotice tone="error" message={(updateMutation.error as Error).message} icon={AlertTriangle} />
                ) : null}
                {updateMutation.isSuccess ? (
                  <InlineNotice tone="success" message="Customer updated." icon={CheckCircle2} />
                ) : null}
                <button className="primary-button compact-button" type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  {updateMutation.isPending ? 'Saving' : 'Save customer'}
                </button>
              </section>

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
