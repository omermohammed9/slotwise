import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
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
import { listBookings } from '@/api/bookings';
import { listBusinesses } from '@/api/businesses';
import { createCustomer, getCustomer, listCustomers, updateCustomer } from '@/api/customers';
import type { BookingDto, BookingListQuery, BookingStatus, BusinessProfileDto, CustomerDto, QueryParams } from '@/api/types';
import { useSessionStore } from '@/auth/sessionStore';
import { InlineNotice, LoadingState } from '@/components/AdminState';
import { EmptyState } from '@/components/EmptyState';
import { StatusChip } from '@/components/StatusChip';
import { useI18n } from '@/i18n/I18nProvider';
import type { Locale, TranslationKey } from '@/i18n/translations';

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

function getCustomerName(customer: CustomerDto | undefined, fallback: string): string {
  return `${getCustomerFirstName(customer)} ${getCustomerLastName(customer)}`.trim() || fallback;
}

function getCustomerBookingCount(customer?: CustomerDto): number {
  return Number(customer?.totalBookings ?? customer?.bookingCount ?? 0);
}

function formatDate(value: string | undefined, locale: Locale, fallback: string): string {
  if (!value) {
    return fallback;
  }

  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(parseISO(value));
  } catch {
    return value;
  }
}

function formatTime(value: string | undefined, locale: Locale, fallback: string): string {
  if (!value) {
    return fallback;
  }

  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(parseISO(value));
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

function getBusinessName(businesses: BusinessProfileDto[], businessId: string | undefined, fallback: string): string {
  if (!businessId) {
    return fallback;
  }

  return businesses.find((business) => business._id === businessId)?.name ?? businessId;
}

function DetailField({ fallback, label, value }: { fallback: string; label: string; value?: number | string }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value || fallback}</strong>
    </div>
  );
}

function getStatusLabel(status: BookingStatus, t: (key: TranslationKey) => string): string {
  return t(`status.${status}` as TranslationKey);
}

function BookingHistory({
  bookings,
  locale,
  t,
}: {
  bookings: BookingDto[];
  locale: Locale;
  t: (key: TranslationKey) => string;
}) {
  if (!bookings.length) {
    return <p className="body-copy">{t('customers.bookingHistoryEmpty')}</p>;
  }

  return (
    <div className="customer-booking-list" aria-label={t('customers.bookingHistory')}>
      {bookings.map((booking) => (
        <article className="customer-booking-row" key={booking._id}>
          <div>
            <h4>{formatDate(booking.startDate, locale, t('customers.notTracked'))}</h4>
            <p>
              {formatTime(booking.timein, locale, t('customers.notTracked'))} - {formatTime(booking.timeout, locale, t('customers.notTracked'))}
              {booking.serviceResourceId ? ` · ${booking.serviceResourceId}` : ''}
            </p>
          </div>
          <StatusChip status={booking.status}>{getStatusLabel(booking.status, t)}</StatusChip>
        </article>
      ))}
    </div>
  );
}

export function CustomersPage() {
  const { formatNumber, locale, t } = useI18n();
  const { session, token } = useSessionStore();
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState(session?.role !== 'owner' && session?.businessId ? session.businessId : '');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CustomerFormState>(defaultCustomerFormState);
  const [editForm, setEditForm] = useState<CustomerFormState>(defaultCustomerFormState);

  const businessesQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await listBusinesses(
        token ?? '',
        session?.role !== 'owner' && session?.businessId ? { businessId: session.businessId } : undefined,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['businesses', session?.businessId, session?.role, token],
  });

  const businesses = businessesQuery.data ?? [];

  useEffect(() => {
    if (session?.role !== 'owner' && session?.businessId && businessId !== session.businessId) {
      setBusinessId(session.businessId);
    }
  }, [businessId, session?.businessId, session?.role]);

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
        throw new Error(t('customers.selectBeforeLoading'));
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
        throw new Error(t('customers.signInBeforeCreating'));
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
        throw new Error(t('customers.selectBeforeSaving'));
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
          <p className="eyebrow">{t('customers.relationships')}</p>
          <h1 id="customers-title">{t('customers.title')}</h1>
          <p className="lede">{t('customers.lede')}</p>
        </div>
        <div className="header-actions" aria-label={t('customers.actions')}>
          <button className="icon-button" type="button" aria-label={t('customers.refresh')} onClick={() => customersQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel customer-controls" aria-label={t('customers.filters')}>
        <label className="form-field">
          {t('customers.name')}
          <span className="input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder={t('customers.searchByName')} />
          </span>
        </label>
        <label className="form-field">
          {t('customers.email')}
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('customers.emailPlaceholder')} />
        </label>
        <label className="form-field">
          {t('customers.phone')}
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t('customers.phonePlaceholder')} />
        </label>
        <label className="form-field">
          {t('customers.business')}
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
            <option value="">{t('customers.allBusinesses')}</option>
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
              <p className="eyebrow">{t('customers.create')}</p>
              <h2>{t('customers.newCustomer')}</h2>
            </div>
            <Plus size={20} aria-hidden="true" />
          </div>
          <form
            className="management-form"
            aria-label={t('customers.createForm')}
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <label className="form-field">
              {t('customers.business')}
              <select
                value={createForm.businessId}
                onChange={(event) => setCreateForm({ ...createForm, businessId: event.target.value })}
                required
              >
                <option value="">{t('customers.selectBusiness')}</option>
                {businesses.map((business) => (
                  <option key={business._id} value={business._id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="form-field">
                {t('customers.firstName')}
                <input
                  value={createForm.firstName}
                  onChange={(event) => setCreateForm({ ...createForm, firstName: event.target.value })}
                  required
                />
              </label>
              <label className="form-field">
                {t('customers.lastName')}
                <input
                  value={createForm.lastName}
                  onChange={(event) => setCreateForm({ ...createForm, lastName: event.target.value })}
                  required
                />
              </label>
            </div>
            <label className="form-field">
              {t('customers.email')}
              <input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
                required
              />
            </label>
            <label className="form-field">
              {t('customers.phone')}
              <input value={createForm.phone} onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })} required />
            </label>
            <label className="form-field">
              {t('customers.notes')}
              <textarea value={createForm.notes} onChange={(event) => setCreateForm({ ...createForm, notes: event.target.value })} />
            </label>
            <fieldset className="form-field">
              <legend>{t('customers.preferredNotifications')}</legend>
              <div className="checkbox-grid" role="group" aria-label={t('customers.createNotifications')}>
                {(['email', 'sms'] as const).map((channel) => (
                  <label className="toggle-field" key={channel}>
                    <input
                      checked={createForm.preferredNotificationChannels.includes(channel)}
                      type="checkbox"
                      onChange={() => toggleNotificationChannel(channel, 'create')}
                    />
                    {t(`customers.channel.${channel}` as TranslationKey)}
                  </label>
                ))}
              </div>
            </fieldset>
            {createMutation.isError ? (
              <InlineNotice tone="error" message={(createMutation.error as Error).message} icon={AlertTriangle} />
            ) : null}
            {createMutation.isSuccess ? (
              <InlineNotice tone="success" message={t('customers.created')} icon={CheckCircle2} />
            ) : null}
            <button className="primary-button compact-button" type="submit" disabled={createMutation.isPending}>
              <Plus size={17} aria-hidden="true" />
              {createMutation.isPending ? t('customers.creating') : t('customers.createCustomer')}
            </button>
          </form>

          <div className="panel-heading customer-directory-heading">
            <div>
              <p className="eyebrow">{t('customers.directory')}</p>
              <h2>{t('customers.customerList')}</h2>
            </div>
            <p className="result-count">
              {customersQuery.isFetching
                ? t('customers.refreshing')
                : `${formatNumber(customers.length)} ${t('customers.shown')}`}
            </p>
          </div>

          {customersQuery.isLoading ? (
            <LoadingState label={t('customers.loading')} />
          ) : customersQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title={t('customers.loadError')}
              description={(customersQuery.error as Error).message}
            />
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t('customers.empty')}
              description={t('customers.emptyDescription')}
            />
          ) : (
            <div className="customer-list" aria-label={t('customers.title')}>
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
                      {getCustomerName(customer, t('customers.unnamed')).slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <strong>{getCustomerName(customer, t('customers.unnamed'))}</strong>
                      <small>{customer.email}</small>
                    </span>
                    <small>
                      {formatNumber(getCustomerBookingCount(customer))} {t('customers.bookings')}
                    </small>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="panel customer-profile-panel" aria-label={t('customers.profile')}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('customers.profileEyebrow')}</p>
              <h2>{activeCustomer ? getCustomerName(activeCustomer, t('customers.unnamed')) : t('customers.details')}</h2>
            </div>
            <UserRound size={20} aria-hidden="true" />
          </div>

          {!selectedCustomerId ? (
            <EmptyState
              icon={UserRound}
              title={t('customers.selectCustomer')}
              description={t('customers.selectCustomerDescription')}
            />
          ) : customerDetailQuery.isLoading ? (
            <LoadingState label={t('customers.loadingProfile')} />
          ) : customerDetailQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title={t('customers.profileLoadError')}
              description={(customerDetailQuery.error as Error).message}
            />
          ) : activeCustomer ? (
            <div className="detail-content compact-detail-content">
              <section className="detail-section" aria-label={t('customers.contact')}>
                <h3>{t('customers.contact')}</h3>
                <p className="detail-line">
                  <Mail size={16} aria-hidden="true" />
                  {activeCustomer.email}
                </p>
                <p className="detail-line">
                  <Phone size={16} aria-hidden="true" />
                  {activeCustomer.phone ?? t('customers.noPhone')}
                </p>
              </section>

              <div className="detail-grid">
                <DetailField fallback={t('customers.notSet')} label={t('customers.business')} value={getBusinessName(businesses, activeCustomer.businessId, t('customers.notSet'))} />
                <DetailField fallback={t('customers.notSet')} label={t('customers.bookings')} value={formatNumber(getCustomerBookingCount(activeCustomer))} />
                <DetailField fallback={t('customers.notSet')} label={t('customers.customerId')} value={activeCustomer._id} />
                <DetailField fallback={t('customers.notSet')} label={t('customers.updated')} value={formatDate(activeCustomer.updatedAt as string | undefined, locale, t('customers.notTracked'))} />
              </div>

              <section className="detail-section" aria-label={t('customers.editProfile')}>
                <div className="panel-heading inline-heading">
                  <div>
                    <p className="eyebrow">{t('customers.edit')}</p>
                    <h3>{t('customers.profile')}</h3>
                  </div>
                </div>
                <div className="form-grid">
                  <label className="form-field">
                    {t('customers.firstName')}
                    <input value={editForm.firstName} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} />
                  </label>
                  <label className="form-field">
                    {t('customers.lastName')}
                    <input value={editForm.lastName} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} />
                  </label>
                </div>
                <label className="form-field">
                  {t('customers.business')}
                  <select value={editForm.businessId} onChange={(event) => setEditForm({ ...editForm, businessId: event.target.value })}>
                    <option value="">{t('customers.selectBusiness')}</option>
                    {businesses.map((business) => (
                      <option key={business._id} value={business._id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  {t('customers.email')}
                  <input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
                </label>
                <label className="form-field">
                  {t('customers.phone')}
                  <input value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />
                </label>
                <label className="form-field">
                  {t('customers.notes')}
                  <textarea value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} />
                </label>
                <fieldset className="form-field">
                  <legend>{t('customers.preferredNotifications')}</legend>
                  <div className="checkbox-grid" role="group" aria-label={t('customers.editNotifications')}>
                    {(['email', 'sms'] as const).map((channel) => (
                      <label className="toggle-field" key={channel}>
                        <input
                          checked={editForm.preferredNotificationChannels.includes(channel)}
                          type="checkbox"
                          onChange={() => toggleNotificationChannel(channel, 'edit')}
                        />
                        {t(`customers.channel.${channel}` as TranslationKey)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {updateMutation.isError ? (
                  <InlineNotice tone="error" message={(updateMutation.error as Error).message} icon={AlertTriangle} />
                ) : null}
                {updateMutation.isSuccess ? (
                  <InlineNotice tone="success" message={t('customers.updatedSuccess')} icon={CheckCircle2} />
                ) : null}
                <button className="primary-button compact-button" type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  {updateMutation.isPending ? t('customers.saving') : t('customers.saveCustomer')}
                </button>
              </section>

              <section className="detail-section" aria-label={t('customers.bookingHistory')}>
                <div className="panel-heading inline-heading">
                  <div>
                    <p className="eyebrow">{t('customers.history')}</p>
                    <h3>{t('customers.recentBookings')}</h3>
                  </div>
                  <CalendarDays size={18} aria-hidden="true" />
                </div>
                {bookingHistoryQuery.isLoading ? (
                  <LoadingState label={t('customers.loadingBookingHistory')} />
                ) : bookingHistoryQuery.isError ? (
                  <EmptyState
                    icon={AlertTriangle}
                    title={t('customers.bookingHistoryLoadError')}
                    description={(bookingHistoryQuery.error as Error).message}
                  />
                ) : (
                  <BookingHistory bookings={bookingHistoryQuery.data ?? []} locale={locale} t={t} />
                )}
              </section>
            </div>
          ) : null}
        </aside>
      </section>
    </>
  );
}
