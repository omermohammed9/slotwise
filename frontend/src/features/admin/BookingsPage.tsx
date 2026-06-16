import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router';
import {
  AlertTriangle,
  ArrowDownUp,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import { getBooking, getBookingSuggestions, listBookings, rescheduleBooking, updateBookingStatus } from '../../api/bookings';
import type {
  ApiMeta,
  BookingDto,
  BookingListQuery,
  BookingStatus,
  BookingSuggestionDto,
  ConflictRiskLevel,
  RescheduleBookingBody,
  Role,
  SortOrder,
} from '../../api/types';
import { useSessionStore } from '../../auth/sessionStore';
import { InlineNotice, LoadingState } from '../../components/AdminState';
import { EmptyState } from '../../components/EmptyState';
import { StatusChip } from '../../components/StatusChip';

type BookingPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type LifecycleStatus = Extract<BookingStatus, 'approved' | 'cancelled' | 'completed' | 'no_show' | 'rejected'>;
type BookingSortField = NonNullable<BookingListQuery['sortBy']>;
type BookingSearchState = {
  customerName: string;
  page: number;
  risk: ConflictRiskLevel | '';
  sortBy: BookingSortField;
  sortOrder: SortOrder;
  status: BookingStatus | '';
};
type RescheduleDraft = {
  endDate: string;
  reason: string;
  startDate: string;
  timein: string;
  timeout: string;
};
type SavedBookingsView = {
  id: string;
  name: string;
  state: BookingSearchState;
};
type SavedViewFeedback = {
  message: string;
  tone: 'error' | 'success';
};
type ActiveFilterChip = {
  id: 'customerName' | 'page' | 'risk' | 'sort' | 'status';
  label: string;
  onRemove: () => void;
};

type LifecycleAction = {
  confirmMessage: string;
  icon: typeof CheckCircle2;
  label: string;
  roles: Role[];
  targetStatus: LifecycleStatus;
};

const statusOptions: Array<{ label: string; value: BookingStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'No-show', value: 'no_show' },
];

const riskOptions: Array<{ label: string; value: ConflictRiskLevel | '' }> = [
  { label: 'All risk', value: '' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const sortFieldOptions: Array<{ label: string; value: BookingSortField }> = [
  { label: 'Created', value: 'createdAt' },
  { label: 'Start date', value: 'startDate' },
  { label: 'End date', value: 'endDate' },
  { label: 'Status', value: 'status' },
  { label: 'Updated', value: 'updatedAt' },
];

const allowedLifecycleTargets: Record<BookingStatus, LifecycleStatus[]> = {
  approved: ['completed', 'cancelled', 'no_show'],
  cancelled: [],
  completed: [],
  no_show: [],
  pending: ['approved', 'rejected', 'cancelled'],
  rejected: [],
};

const lifecycleActions: LifecycleAction[] = [
  {
    confirmMessage: 'Approve this booking?',
    icon: CheckCircle2,
    label: 'Approve',
    roles: ['admin', 'owner'],
    targetStatus: 'approved',
  },
  {
    confirmMessage: 'Reject this booking?',
    icon: XCircle,
    label: 'Reject',
    roles: ['admin', 'owner'],
    targetStatus: 'rejected',
  },
  {
    confirmMessage: 'Cancel this booking?',
    icon: Ban,
    label: 'Cancel',
    roles: ['admin', 'owner', 'staff'],
    targetStatus: 'cancelled',
  },
  {
    confirmMessage: 'Complete this booking?',
    icon: CheckCircle2,
    label: 'Complete',
    roles: ['admin', 'owner', 'staff'],
    targetStatus: 'completed',
  },
  {
    confirmMessage: 'Mark this booking as no-show?',
    icon: UserX,
    label: 'No-show',
    roles: ['admin', 'owner', 'staff'],
    targetStatus: 'no_show',
  },
];

const validStatuses = new Set<BookingStatus>(statusOptions.flatMap((option) => (option.value ? [option.value] : [])));
const validRiskLevels = new Set<ConflictRiskLevel>(riskOptions.flatMap((option) => (option.value ? [option.value] : [])));
const validSortFields = new Set<BookingSortField>(sortFieldOptions.map((option) => option.value));
const validSortOrders = new Set<SortOrder>(['asc', 'desc']);
const savedViewsStorageKey = 'slotwise.admin.bookings.saved-views';
const defaultBookingSearchState: BookingSearchState = {
  customerName: '',
  page: 1,
  risk: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  status: '',
};

function getPagination(meta?: ApiMeta): BookingPaginationMeta {
  const pagination = meta?.pagination as Partial<BookingPaginationMeta> | undefined;

  return {
    limit: Number(pagination?.limit ?? 20),
    page: Number(pagination?.page ?? 1),
    total: Number(pagination?.total ?? 0),
    totalPages: Math.max(1, Number(pagination?.totalPages ?? 1)),
  };
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

function formatInputDateTime(value?: string): string {
  if (!value) {
    return '';
  }

  try {
    return format(parseISO(value), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

function toIsoDateTime(value: string): string {
  return new Date(value).toISOString();
}

function getCustomerName(booking: BookingDto): string {
  return `${booking.fName} ${booking.lName}`.trim();
}

function getRiskLevel(booking: BookingDto): ConflictRiskLevel {
  return booking.conflictRisk?.level ?? 'low';
}

function formatStatusLabel(status: BookingStatus): string {
  return status.replace('_', ' ');
}

function getAvailableLifecycleActions(status: BookingStatus, role?: Role): LifecycleAction[] {
  if (!role) {
    return [];
  }

  const allowedTargets = allowedLifecycleTargets[status];
  return lifecycleActions.filter((action) => allowedTargets.includes(action.targetStatus) && action.roles.includes(role));
}

function canRescheduleBooking(status: BookingStatus, role?: Role): boolean {
  return Boolean(role && ['admin', 'owner', 'staff'].includes(role) && ['approved', 'pending'].includes(status));
}

function createRescheduleDraft(booking?: BookingDto): RescheduleDraft {
  return {
    endDate: formatInputDateTime(booking?.endDate),
    reason: '',
    startDate: formatInputDateTime(booking?.startDate),
    timein: formatInputDateTime(booking?.timein),
    timeout: formatInputDateTime(booking?.timeout),
  };
}

function parsePageValue(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseStatusValue(value: string | null): BookingStatus | '' {
  return value && validStatuses.has(value as BookingStatus) ? (value as BookingStatus) : '';
}

function parseRiskValue(value: string | null): ConflictRiskLevel | '' {
  return value && validRiskLevels.has(value as ConflictRiskLevel) ? (value as ConflictRiskLevel) : '';
}

function parseSortFieldValue(value: string | null): BookingSortField {
  return value && validSortFields.has(value as BookingSortField) ? (value as BookingSortField) : 'createdAt';
}

function parseSortOrderValue(value: string | null): SortOrder {
  return value && validSortOrders.has(value as SortOrder) ? (value as SortOrder) : 'desc';
}

function buildRescheduleBody(draft: RescheduleDraft): RescheduleBookingBody {
  return {
    endDate: toIsoDateTime(draft.endDate),
    startDate: toIsoDateTime(draft.startDate),
    timein: toIsoDateTime(draft.timein),
    timeout: toIsoDateTime(draft.timeout),
    ...(draft.reason.trim() ? { reason: draft.reason.trim() } : {}),
  };
}

function normalizeBookingSearchState(state: Partial<BookingSearchState>): BookingSearchState {
  return {
    customerName: typeof state.customerName === 'string' ? state.customerName.trim() : defaultBookingSearchState.customerName,
    page: Number.isInteger(state.page) && Number(state.page) > 0 ? Number(state.page) : defaultBookingSearchState.page,
    risk: state.risk && validRiskLevels.has(state.risk) ? state.risk : defaultBookingSearchState.risk,
    sortBy: state.sortBy && validSortFields.has(state.sortBy) ? state.sortBy : defaultBookingSearchState.sortBy,
    sortOrder: state.sortOrder && validSortOrders.has(state.sortOrder) ? state.sortOrder : defaultBookingSearchState.sortOrder,
    status: state.status && validStatuses.has(state.status) ? state.status : defaultBookingSearchState.status,
  };
}

function areSearchStatesEqual(left: BookingSearchState, right: BookingSearchState): boolean {
  return (
    left.customerName === right.customerName &&
    left.page === right.page &&
    left.risk === right.risk &&
    left.sortBy === right.sortBy &&
    left.sortOrder === right.sortOrder &&
    left.status === right.status
  );
}

function describeSearchState(state: BookingSearchState): string {
  const parts = [];

  if (state.customerName) {
    parts.push(state.customerName);
  }

  if (state.status) {
    const option = statusOptions.find((entry) => entry.value === state.status);
    parts.push(option?.label ?? formatStatusLabel(state.status));
  }

  if (state.risk) {
    const option = riskOptions.find((entry) => entry.value === state.risk);
    parts.push(option?.label ?? `${state.risk} risk`);
  }

  const sortField = sortFieldOptions.find((entry) => entry.value === state.sortBy);
  parts.push(`${sortField?.label ?? state.sortBy} ${state.sortOrder === 'asc' ? 'ascending' : 'descending'}`);

  if (state.page > 1) {
    parts.push(`Page ${state.page}`);
  }

  return parts.join(' · ');
}

function readSavedViews(): SavedBookingsView[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(savedViewsStorageKey);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') {
        return [];
      }

      const candidate = entry as Partial<SavedBookingsView>;
      const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
      const id = typeof candidate.id === 'string' ? candidate.id : '';

      if (!id || !name) {
        return [];
      }

      return [
        {
          id,
          name,
          state: normalizeBookingSearchState(candidate.state ?? {}),
        },
      ];
    });
  } catch {
    return [];
  }
}

function DetailField({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value || 'Not set'}</strong>
    </div>
  );
}

export function BookingsPage() {
  const queryClient = useQueryClient();
  const { session, token } = useSessionStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [rescheduleDraft, setRescheduleDraft] = useState<RescheduleDraft>(createRescheduleDraft());
  const [suggestions, setSuggestions] = useState<BookingSuggestionDto[]>([]);
  const [savedViewName, setSavedViewName] = useState('');
  const [savedViews, setSavedViews] = useState<SavedBookingsView[]>(() => readSavedViews());
  const [savedViewFeedback, setSavedViewFeedback] = useState<SavedViewFeedback | null>(null);
  const status = parseStatusValue(searchParams.get('status'));
  const risk = parseRiskValue(searchParams.get('risk'));
  const customerName = searchParams.get('customerName') ?? '';
  const page = parsePageValue(searchParams.get('page'));
  const sortBy = parseSortFieldValue(searchParams.get('sortBy'));
  const sortOrder = parseSortOrderValue(searchParams.get('sortOrder'));
  const currentViewState = useMemo<BookingSearchState>(
    () => ({
      customerName,
      page,
      risk,
      sortBy,
      sortOrder,
      status,
    }),
    [customerName, page, risk, sortBy, sortOrder, status],
  );
  const activeSavedViewId = useMemo(
    () => savedViews.find((view) => areSearchStatesEqual(view.state, currentViewState))?.id ?? null,
    [currentViewState, savedViews],
  );
  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (customerName.trim()) {
      chips.push({
        id: 'customerName',
        label: `Customer: ${customerName.trim()}`,
        onRemove: () => updateSearchParams({ customerName: defaultBookingSearchState.customerName, page: defaultBookingSearchState.page }),
      });
    }

    if (status) {
      const option = statusOptions.find((entry) => entry.value === status);
      chips.push({
        id: 'status',
        label: `Status: ${option?.label ?? formatStatusLabel(status)}`,
        onRemove: () => updateSearchParams({ page: defaultBookingSearchState.page, status: defaultBookingSearchState.status }),
      });
    }

    if (risk) {
      const option = riskOptions.find((entry) => entry.value === risk);
      chips.push({
        id: 'risk',
        label: `Risk: ${option?.label ?? `${risk} risk`}`,
        onRemove: () => updateSearchParams({ page: defaultBookingSearchState.page, risk: defaultBookingSearchState.risk }),
      });
    }

    if (sortBy !== defaultBookingSearchState.sortBy || sortOrder !== defaultBookingSearchState.sortOrder) {
      const option = sortFieldOptions.find((entry) => entry.value === sortBy);
      chips.push({
        id: 'sort',
        label: `Sort: ${option?.label ?? sortBy} ${sortOrder === 'asc' ? 'ascending' : 'descending'}`,
        onRemove: () =>
          updateSearchParams({
            page: defaultBookingSearchState.page,
            sortBy: defaultBookingSearchState.sortBy,
            sortOrder: defaultBookingSearchState.sortOrder,
          }),
      });
    }

    if (page > defaultBookingSearchState.page) {
      chips.push({
        id: 'page',
        label: `Page: ${page}`,
        onRemove: () => updateSearchParams({ page: defaultBookingSearchState.page }),
      });
    }

    return chips;
  }, [customerName, page, risk, sortBy, sortOrder, status]);
  const hasActiveFilters = activeFilterChips.length > 0;

  const query: BookingListQuery = useMemo(
    () => ({
      ...(customerName.trim() ? { customerName: customerName.trim() } : {}),
      ...(risk ? { conflictRiskLevel: risk } : {}),
      ...(status ? { status } : {}),
      limit: 10,
      page,
      sortBy,
      sortOrder,
    }),
    [customerName, page, risk, sortBy, sortOrder, status],
  );

  function updateSearchParams(
    updates: Partial<BookingSearchState>,
  ) {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const normalizedValue = typeof value === 'string' ? value.trim() : value;

      if (
        normalizedValue === undefined ||
        normalizedValue === null ||
        normalizedValue === '' ||
        (key === 'page' && normalizedValue === 1) ||
        (key === 'sortBy' && normalizedValue === 'createdAt') ||
        (key === 'sortOrder' && normalizedValue === 'desc')
      ) {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, String(normalizedValue));
    });

    setSearchParams(nextParams, { replace: true });
  }

  function persistSavedViews(nextViews: SavedBookingsView[]) {
    try {
      window.localStorage.setItem(savedViewsStorageKey, JSON.stringify(nextViews));
      return true;
    } catch {
      return false;
    }
  }

  function handleSaveView() {
    const name = savedViewName.trim();

    if (!name) {
      setSavedViewFeedback({
        message: 'Enter a name before saving this view.',
        tone: 'error',
      });
      return;
    }

    const existingView = savedViews.find((view) => view.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const nextViews = existingView
      ? savedViews.map((view) => (view.id === existingView.id ? { ...view, name, state: currentViewState } : view))
      : [
          ...savedViews,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            state: currentViewState,
          },
        ];

    setSavedViews(nextViews);
    setSavedViewName('');
    const saved = persistSavedViews(nextViews);
    setSavedViewFeedback({
      message: saved
        ? existingView
          ? 'Saved view updated.'
          : 'Saved view created.'
        : 'Saved view changed here, but browser storage was unavailable.',
      tone: saved ? 'success' : 'error',
    });
  }

  function handleApplySavedView(view: SavedBookingsView) {
    updateSearchParams(view.state);
    setSavedViewFeedback({
      message: `"${view.name}" applied.`,
      tone: 'success',
    });
  }

  function handleRemoveSavedView(viewId: string) {
    const nextViews = savedViews.filter((view) => view.id !== viewId);
    setSavedViews(nextViews);
    const saved = persistSavedViews(nextViews);
    setSavedViewFeedback({
      message: saved ? 'Saved view removed.' : 'Saved view changed here, but browser storage was unavailable.',
      tone: saved ? 'success' : 'error',
    });
  }

  const bookingsQuery = useQuery({
    queryFn: async () => {
      const response = await listBookings(query, token ?? undefined);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response;
    },
    queryKey: ['bookings', query, token],
  });

  const bookings = bookingsQuery.data?.data ?? [];
  const pagination = getPagination(bookingsQuery.data?.meta);

  const bookingDetailQuery = useQuery({
    enabled: Boolean(selectedBookingId),
    queryFn: async () => {
      if (!selectedBookingId) {
        throw new Error('Booking selection is required.');
      }

      const response = await getBooking(selectedBookingId, token ?? undefined);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    queryKey: ['booking-detail', selectedBookingId, token],
  });

  const selectedBooking = bookingDetailQuery.data;
  const availableLifecycleActions = selectedBooking
    ? getAvailableLifecycleActions(selectedBooking.status, session?.role)
    : [];
  const rescheduleAvailable = selectedBooking ? canRescheduleBooking(selectedBooking.status, session?.role) : false;

  useEffect(() => {
    setSuggestions([]);
    setRescheduleDraft(createRescheduleDraft(selectedBooking));
  }, [selectedBooking?._id, selectedBooking?.startDate, selectedBooking?.endDate, selectedBooking?.timein, selectedBooking?.timeout]);

  const lifecycleMutation = useMutation({
    mutationFn: async (targetStatus: LifecycleStatus) => {
      if (!selectedBookingId || !token) {
        throw new Error('An active operator session is required.');
      }

      const response = await updateBookingStatus(selectedBookingId, targetStatus, {}, token);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(['booking-detail', updatedBooking._id, token], updatedBooking);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking-detail', updatedBooking._id, token] });
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) {
        throw new Error('Booking selection is required.');
      }

      const response = await getBookingSuggestions({
        ...(selectedBooking.businessId ? { businessId: selectedBooking.businessId } : {}),
        ...(selectedBooking.serviceResourceId ? { serviceResourceId: selectedBooking.serviceResourceId } : {}),
        ...(selectedBooking.partySize ? { partySize: selectedBooking.partySize } : {}),
        endDate: toIsoDateTime(rescheduleDraft.endDate),
        maxSuggestions: 3,
        startDate: toIsoDateTime(rescheduleDraft.startDate),
        timein: toIsoDateTime(rescheduleDraft.timein),
        timeout: toIsoDateTime(rescheduleDraft.timeout),
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

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBookingId || !token) {
        throw new Error('An active operator session is required.');
      }

      const response = await rescheduleBooking(selectedBookingId, buildRescheduleBody(rescheduleDraft), token);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (updatedBooking) => {
      setSuggestions([]);
      queryClient.setQueryData(['booking-detail', updatedBooking._id, token], updatedBooking);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking-detail', updatedBooking._id, token] });
    },
  });

  function handleLifecycleAction(action: LifecycleAction) {
    if (lifecycleMutation.isPending || !window.confirm(action.confirmMessage)) {
      return;
    }

    lifecycleMutation.mutate(action.targetStatus);
  }

  function handleDraftChange(field: keyof RescheduleDraft, value: string) {
    setRescheduleDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSuggestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    suggestionMutation.mutate();
  }

  function handleRescheduleSubmit() {
    if (rescheduleMutation.isPending || !window.confirm('Reschedule this booking?')) {
      return;
    }

    rescheduleMutation.mutate();
  }

  function applySuggestion(suggestion: BookingSuggestionDto) {
    setRescheduleDraft((current) => ({
      ...current,
      endDate: formatInputDateTime(suggestion.endDate),
      startDate: formatInputDateTime(suggestion.startDate),
      timein: formatInputDateTime(suggestion.timein),
      timeout: formatInputDateTime(suggestion.timeout),
    }));
  }

  return (
    <>
      <section className="workspace-header" aria-labelledby="bookings-title">
        <div>
          <p className="eyebrow">Booking operations</p>
          <h1 id="bookings-title">Bookings</h1>
          <p className="lede">Search, filter, sort, and page through backend booking records.</p>
        </div>
        <div className="header-actions" aria-label="Booking list actions">
          <button className="icon-button" type="button" aria-label="Refresh bookings" onClick={() => bookingsQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel booking-controls" aria-label="Booking filters">
        <label className="form-field">
          Customer
          <span className="input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input
              value={customerName}
              onChange={(event) => {
                updateSearchParams({
                  customerName: event.target.value,
                  page: 1,
                });
              }}
              placeholder="Search by name"
            />
          </span>
        </label>

        <label className="form-field">
          Status
          <select
            value={status}
            onChange={(event) => {
              updateSearchParams({
                page: 1,
                status: event.target.value as BookingStatus | '',
              });
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          Risk
          <select
            value={risk}
            onChange={(event) => {
              updateSearchParams({
                page: 1,
                risk: event.target.value as ConflictRiskLevel | '',
              });
            }}
          >
            {riskOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          Sort
          <select
            value={sortBy}
            onChange={(event) => {
              updateSearchParams({
                page: 1,
                sortBy: event.target.value as BookingSortField,
              });
            }}
          >
            {sortFieldOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="secondary-button compact-button"
          type="button"
          onClick={() => {
            updateSearchParams({
              page: 1,
              sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
            });
          }}
        >
          <ArrowDownUp size={17} aria-hidden="true" />
          {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </button>
      </section>

      {hasActiveFilters ? (
        <section className="panel booking-active-filters" aria-labelledby="booking-active-filters-title">
          <div className="panel-heading booking-active-filters-heading">
            <div>
              <p className="eyebrow">Current workspace</p>
              <h2 id="booking-active-filters-title">Active filters</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => updateSearchParams(defaultBookingSearchState)}
            >
              Clear all
            </button>
          </div>
          <div className="active-filter-chip-list" aria-label="Active booking filters">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.id}
                className="active-filter-chip"
                type="button"
                aria-label={`Remove ${chip.label}`}
                onClick={chip.onRemove}
              >
                <span>{chip.label}</span>
                <X size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel saved-view-panel" aria-labelledby="booking-saved-views-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Workspace memory</p>
            <h2 id="booking-saved-views-title">Saved views</h2>
          </div>
          <p className="result-count">Browser only</p>
        </div>
        <p className="body-copy">Save the current bookings filters, sorting, and page so you can reapply them quickly on this device.</p>
        <div className="saved-view-toolbar">
          <label className="form-field">
            View name
            <input
              value={savedViewName}
              maxLength={60}
              onChange={(event) => setSavedViewName(event.target.value)}
              placeholder="Ex: High-risk approvals"
            />
          </label>
          <button className="secondary-button compact-button" type="button" onClick={handleSaveView}>
            Save current view
          </button>
        </div>
        {savedViewFeedback ? <InlineNotice tone={savedViewFeedback.tone} message={savedViewFeedback.message} /> : null}
        {savedViews.length ? (
          <div className="saved-view-list" aria-label="Saved booking views">
            {savedViews.map((view) => {
              const isActive = view.id === activeSavedViewId;

              return (
                <div className={`saved-view-card${isActive ? ' saved-view-card-active' : ''}`} key={view.id}>
                  <button
                    aria-pressed={isActive}
                    className="text-button saved-view-apply"
                    type="button"
                    onClick={() => handleApplySavedView(view)}
                  >
                    {view.name}
                  </button>
                  <p className="saved-view-summary">{describeSearchState(view.state)}</p>
                  <button
                    className="icon-button saved-view-remove"
                    type="button"
                    aria-label={`Remove ${view.name} saved view`}
                    onClick={() => handleRemoveSavedView(view.id)}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="body-copy">No saved views yet.</p>
        )}
      </section>

      <section className="panel booking-list-panel" aria-labelledby="booking-list-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Records</p>
            <h2 id="booking-list-title">Booking list</h2>
          </div>
          <p className="result-count">
            {bookingsQuery.isFetching ? 'Refreshing' : `${pagination.total} total`}
          </p>
        </div>

        {bookingsQuery.isLoading ? (
          <LoadingState label="Loading bookings" />
        ) : bookingsQuery.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Bookings could not load"
            description={(bookingsQuery.error as Error).message}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No bookings found"
            description="Adjust the current filters or try a broader search."
          />
        ) : (
          <div className="booking-table" role="table" aria-label="Bookings">
            <div className="booking-table-row booking-table-head" role="row">
              <span role="columnheader">Customer</span>
              <span role="columnheader">Date</span>
              <span role="columnheader">Time</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Risk</span>
              <span role="columnheader">Detail</span>
            </div>
            {bookings.map((booking) => {
              const riskLevel = getRiskLevel(booking);

              return (
                <article className="booking-table-row" key={booking._id} role="row">
                  <div className="booking-main" role="cell">
                    <h3>{getCustomerName(booking)}</h3>
                    <p>{booking.email}</p>
                  </div>
                  <span role="cell">{formatDateTime(booking.startDate)}</span>
                  <span role="cell">
                    {formatTime(booking.timein)} - {formatTime(booking.timeout)}
                  </span>
                  <span role="cell">
                    <StatusChip status={booking.status}>{booking.status.replace('_', ' ')}</StatusChip>
                  </span>
                  <span role="cell">
                    <span className={`risk-chip risk-${riskLevel}`}>{riskLevel} risk</span>
                  </span>
                  <span role="cell">
                    <button className="text-button table-action" type="button" onClick={() => setSelectedBookingId(booking._id)}>
                      View details
                    </button>
                  </span>
                </article>
              );
            })}
          </div>
        )}

        <div className="pagination-bar" aria-label="Booking pagination">
          <button
            className="icon-button"
            type="button"
            aria-label="Previous page"
            disabled={pagination.page <= 1 || bookingsQuery.isFetching}
            onClick={() => updateSearchParams({ page: Math.max(1, page - 1) })}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label="Next page"
            disabled={pagination.page >= pagination.totalPages || bookingsQuery.isFetching}
            onClick={() => updateSearchParams({ page: page + 1 })}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      {selectedBookingId ? (
        <aside className="detail-drawer" aria-labelledby="booking-detail-title" aria-modal="true" role="dialog">
          <div className="detail-drawer-header">
            <div>
              <p className="eyebrow">Booking detail</p>
              <h2 id="booking-detail-title">
                {selectedBooking ? getCustomerName(selectedBooking) : 'Loading booking'}
              </h2>
            </div>
            <button className="icon-button" type="button" aria-label="Close booking detail" onClick={() => setSelectedBookingId(null)}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {bookingDetailQuery.isLoading ? (
            <LoadingState label="Loading booking detail" />
          ) : bookingDetailQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Booking detail could not load"
              description={(bookingDetailQuery.error as Error).message}
            />
          ) : selectedBooking ? (
            <div className="detail-content">
              <div className="detail-summary">
                <StatusChip status={selectedBooking.status}>{formatStatusLabel(selectedBooking.status)}</StatusChip>
                <span className={`risk-chip risk-${getRiskLevel(selectedBooking)}`}>
                  {getRiskLevel(selectedBooking)} risk
                </span>
              </div>

              <section className="detail-section" aria-label="Customer contact">
                <h3>Customer</h3>
                <p className="detail-line">
                  <Mail size={16} aria-hidden="true" />
                  {selectedBooking.email}
                </p>
                <p className="detail-line">
                  <Phone size={16} aria-hidden="true" />
                  {selectedBooking.phone}
                </p>
              </section>

              <section className="detail-section" aria-label="Booking schedule">
                <h3>Schedule</h3>
                <p className="detail-line">
                  <CalendarClock size={16} aria-hidden="true" />
                  {formatDateTime(selectedBooking.startDate)} from {formatTime(selectedBooking.timein)} to{' '}
                  {formatTime(selectedBooking.timeout)}
                </p>
                <div className="detail-grid">
                  <DetailField label="Party size" value={selectedBooking.partySize} />
                  <DetailField label="Resource" value={selectedBooking.serviceResourceId} />
                  <DetailField label="Business" value={selectedBooking.businessId} />
                  <DetailField label="Customer ID" value={selectedBooking.customerId} />
                </div>
              </section>

              {selectedBooking.notes ? (
                <section className="detail-section" aria-label="Booking notes">
                  <h3>Notes</h3>
                  <p className="body-copy">{selectedBooking.notes}</p>
                </section>
              ) : null}

              {selectedBooking.conflictRisk ? (
                <section className="detail-section" aria-label="Conflict risk">
                  <h3>Risk signals</h3>
                  <p className="body-copy">{selectedBooking.conflictRisk.summary}</p>
                  <div className="signal-list">
                    {selectedBooking.conflictRisk.signals.map((signal) => (
                      <span key={signal}>{signal}</span>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="detail-section" aria-label="Lifecycle actions">
                <h3>Lifecycle actions</h3>
                {lifecycleMutation.isError ? (
                  <InlineNotice tone="error" message={(lifecycleMutation.error as Error).message} icon={AlertTriangle} />
                ) : null}
                {availableLifecycleActions.length ? (
                  <div className="lifecycle-action-grid">
                    {availableLifecycleActions.map((action) => {
                      const ActionIcon = action.icon;
                      const isCurrentMutation = lifecycleMutation.variables === action.targetStatus;

                      return (
                        <button
                          className={`secondary-button lifecycle-action lifecycle-action-${action.targetStatus}`}
                          disabled={lifecycleMutation.isPending}
                          key={action.targetStatus}
                          type="button"
                          onClick={() => handleLifecycleAction(action)}
                        >
                          <ActionIcon size={17} aria-hidden="true" />
                          {lifecycleMutation.isPending && isCurrentMutation ? 'Saving' : action.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="body-copy">No lifecycle actions are available for this status and role.</p>
                )}
              </section>

              <section className="detail-section" aria-label="Reschedule booking">
                <h3>Reschedule</h3>
                {rescheduleAvailable ? (
                  <form className="reschedule-form" onSubmit={handleSuggestionSubmit}>
                    <div className="reschedule-grid">
                      <label className="form-field">
                        Start
                        <input
                          required
                          type="datetime-local"
                          value={rescheduleDraft.startDate}
                          onChange={(event) => handleDraftChange('startDate', event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        End
                        <input
                          required
                          type="datetime-local"
                          value={rescheduleDraft.endDate}
                          onChange={(event) => handleDraftChange('endDate', event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        Time in
                        <input
                          required
                          type="datetime-local"
                          value={rescheduleDraft.timein}
                          onChange={(event) => handleDraftChange('timein', event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        Time out
                        <input
                          required
                          type="datetime-local"
                          value={rescheduleDraft.timeout}
                          onChange={(event) => handleDraftChange('timeout', event.target.value)}
                        />
                      </label>
                    </div>
                    <label className="form-field">
                      Reason
                      <input
                        value={rescheduleDraft.reason}
                        onChange={(event) => handleDraftChange('reason', event.target.value)}
                        placeholder="Optional audit note"
                      />
                    </label>
                    {suggestionMutation.isError ? (
                      <InlineNotice tone="error" message={(suggestionMutation.error as Error).message} icon={AlertTriangle} />
                    ) : null}
                    {rescheduleMutation.isError ? (
                      <InlineNotice tone="error" message={(rescheduleMutation.error as Error).message} icon={AlertTriangle} />
                    ) : null}
                    <div className="reschedule-actions">
                      <button
                        className="secondary-button compact-button"
                        disabled={suggestionMutation.isPending || rescheduleMutation.isPending}
                        type="submit"
                      >
                        <Sparkles size={17} aria-hidden="true" />
                        {suggestionMutation.isPending ? 'Checking' : 'Find suggestions'}
                      </button>
                      <button
                        className="primary-button compact-button"
                        disabled={rescheduleMutation.isPending || suggestionMutation.isPending}
                        type="button"
                        onClick={handleRescheduleSubmit}
                      >
                        <CalendarClock size={17} aria-hidden="true" />
                        {rescheduleMutation.isPending ? 'Saving' : 'Reschedule'}
                      </button>
                    </div>
                    {suggestions.length ? (
                      <div className="suggestion-list" aria-label="Suggested booking slots">
                        {suggestions.map((suggestion) => (
                          <button
                            className="suggestion-option"
                            key={`${suggestion.timein}-${suggestion.timeout}`}
                            type="button"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            <span>
                              {formatDateTime(suggestion.startDate)} · {formatTime(suggestion.timein)} -{' '}
                              {formatTime(suggestion.timeout)}
                            </span>
                            <strong>{suggestion.score}/100</strong>
                            <small>{suggestion.summary}</small>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </form>
                ) : (
                  <p className="body-copy">Reschedule is available for pending or approved bookings handled by operator roles.</p>
                )}
              </section>

              <section className="detail-section" aria-label="Status history">
                <h3>Status history</h3>
                {selectedBooking.statusHistory?.length ? (
                  <div className="history-list">
                    {selectedBooking.statusHistory.map((entry) => (
                      <div className="history-entry" key={`${entry.toStatus}-${entry.changedAt}`}>
                        <strong>{formatStatusLabel(entry.toStatus)}</strong>
                        <span>
                          {formatDateTime(entry.changedAt)} · {entry.changedByRole}
                          {entry.reason ? ` · ${entry.reason}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="body-copy">No status history recorded.</p>
                )}
              </section>
            </div>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}
