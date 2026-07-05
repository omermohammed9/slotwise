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
  Pencil,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import {
  deleteBooking,
  getBooking,
  getBookingSuggestions,
  listBookings,
  rescheduleBooking,
  updateBooking,
  updateBookingStatus,
} from '@/api/bookings';
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
} from '@/api/types';
import { useSessionStore } from '@/auth/sessionStore';
import { InlineNotice, LoadingState } from '@/components/AdminState';
import { EmptyState } from '@/components/EmptyState';
import { StatusChip } from '@/components/StatusChip';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

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
type BookingEditDraft = {
  email: string;
  endDate: string;
  fName: string;
  lName: string;
  notes: string;
  partySize: string;
  phone: string;
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
  confirmKey: TranslationKey;
  icon: typeof CheckCircle2;
  labelKey: TranslationKey;
  roles: Role[];
  targetStatus: LifecycleStatus;
};

const statusOptions: Array<{ labelKey: TranslationKey; value: BookingStatus | '' }> = [
  { labelKey: 'bookings.allStatuses', value: '' },
  { labelKey: 'status.pending', value: 'pending' },
  { labelKey: 'status.approved', value: 'approved' },
  { labelKey: 'status.completed', value: 'completed' },
  { labelKey: 'status.cancelled', value: 'cancelled' },
  { labelKey: 'status.rejected', value: 'rejected' },
  { labelKey: 'status.no_show', value: 'no_show' },
];

const riskOptions: Array<{ labelKey: TranslationKey; value: ConflictRiskLevel | '' }> = [
  { labelKey: 'risk.all', value: '' },
  { labelKey: 'risk.low', value: 'low' },
  { labelKey: 'risk.medium', value: 'medium' },
  { labelKey: 'risk.high', value: 'high' },
];

const sortFieldOptions: Array<{ labelKey: TranslationKey; value: BookingSortField }> = [
  { labelKey: 'sort.createdAt', value: 'createdAt' },
  { labelKey: 'sort.startDate', value: 'startDate' },
  { labelKey: 'sort.endDate', value: 'endDate' },
  { labelKey: 'sort.status', value: 'status' },
  { labelKey: 'sort.updatedAt', value: 'updatedAt' },
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
    confirmKey: 'bookings.confirmApprove',
    icon: CheckCircle2,
    labelKey: 'bookings.approve',
    roles: ['admin', 'owner'],
    targetStatus: 'approved',
  },
  {
    confirmKey: 'bookings.confirmReject',
    icon: XCircle,
    labelKey: 'bookings.reject',
    roles: ['admin', 'owner'],
    targetStatus: 'rejected',
  },
  {
    confirmKey: 'bookings.confirmCancel',
    icon: Ban,
    labelKey: 'bookings.cancel',
    roles: ['admin', 'owner', 'staff'],
    targetStatus: 'cancelled',
  },
  {
    confirmKey: 'bookings.confirmComplete',
    icon: CheckCircle2,
    labelKey: 'bookings.complete',
    roles: ['admin', 'owner', 'staff'],
    targetStatus: 'completed',
  },
  {
    confirmKey: 'bookings.confirmNoShow',
    icon: UserX,
    labelKey: 'bookings.noShow',
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

function getStatusLabel(status: BookingStatus, t: (key: TranslationKey) => string): string {
  return t(`status.${status}` as TranslationKey);
}

function getRiskLabel(risk: ConflictRiskLevel, t: (key: TranslationKey) => string): string {
  return t(`risk.${risk}` as TranslationKey);
}

function getSortFieldLabel(sortField: BookingSortField, t: (key: TranslationKey) => string): string {
  return t(`sort.${sortField}` as TranslationKey);
}

function getSortOrderLabel(sortOrder: SortOrder, t: (key: TranslationKey) => string): string {
  return t(sortOrder === 'asc' ? 'sort.ascending' : 'sort.descending');
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

function createBookingEditDraft(booking?: BookingDto): BookingEditDraft {
  return {
    email: booking?.email ?? '',
    endDate: formatInputDateTime(booking?.endDate),
    fName: booking?.fName ?? '',
    lName: booking?.lName ?? '',
    notes: booking?.notes ?? '',
    partySize: booking?.partySize ? String(booking.partySize) : '1',
    phone: booking?.phone ?? '',
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

function buildBookingUpdateBody(draft: BookingEditDraft) {
  return {
    email: draft.email.trim(),
    endDate: toIsoDateTime(draft.endDate),
    fName: draft.fName.trim(),
    lName: draft.lName.trim(),
    notes: draft.notes.trim() || undefined,
    partySize: Number(draft.partySize),
    phone: draft.phone.trim(),
    startDate: toIsoDateTime(draft.startDate),
    timein: toIsoDateTime(draft.timein),
    timeout: toIsoDateTime(draft.timeout),
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

function describeSearchState(state: BookingSearchState, t: (key: TranslationKey) => string): string {
  const parts = [];

  if (state.customerName) {
    parts.push(state.customerName);
  }

  if (state.status) {
    parts.push(getStatusLabel(state.status, t));
  }

  if (state.risk) {
    parts.push(`${getRiskLabel(state.risk, t)} ${t('risk.label')}`);
  }

  parts.push(`${getSortFieldLabel(state.sortBy, t)} ${getSortOrderLabel(state.sortOrder, t)}`);

  if (state.page > 1) {
    parts.push(`${t('bookings.filterPage')} ${state.page}`);
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

function DetailField({ label, notSetLabel, value }: { label: string; notSetLabel: string; value?: number | string }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value || notSetLabel}</strong>
    </div>
  );
}

export function BookingsPage() {
  const queryClient = useQueryClient();
  const { session, token } = useSessionStore();
  const { formatNumber, t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<BookingEditDraft>(createBookingEditDraft());
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [lifecycleReason, setLifecycleReason] = useState('');
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
        label: `${t('bookings.filterCustomer')}: ${customerName.trim()}`,
        onRemove: () => updateSearchParams({ customerName: defaultBookingSearchState.customerName, page: defaultBookingSearchState.page }),
      });
    }

    if (status) {
      chips.push({
        id: 'status',
        label: `${t('bookings.filterStatus')}: ${getStatusLabel(status, t)}`,
        onRemove: () => updateSearchParams({ page: defaultBookingSearchState.page, status: defaultBookingSearchState.status }),
      });
    }

    if (risk) {
      chips.push({
        id: 'risk',
        label: `${t('bookings.filterRisk')}: ${getRiskLabel(risk, t)} ${t('risk.label')}`,
        onRemove: () => updateSearchParams({ page: defaultBookingSearchState.page, risk: defaultBookingSearchState.risk }),
      });
    }

    if (sortBy !== defaultBookingSearchState.sortBy || sortOrder !== defaultBookingSearchState.sortOrder) {
      chips.push({
        id: 'sort',
        label: `${t('bookings.filterSort')}: ${getSortFieldLabel(sortBy, t)} ${getSortOrderLabel(sortOrder, t)}`,
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
        label: `${t('bookings.filterPage')}: ${formatNumber(page)}`,
        onRemove: () => updateSearchParams({ page: defaultBookingSearchState.page }),
      });
    }

    return chips;
  }, [customerName, formatNumber, page, risk, sortBy, sortOrder, status, t]);
  const hasActiveFilters = activeFilterChips.length > 0;

  const query: BookingListQuery = useMemo(
    () => ({
      ...(session?.role !== 'owner' && session?.businessId ? { businessId: session.businessId } : {}),
      ...(customerName.trim() ? { customerName: customerName.trim() } : {}),
      ...(risk ? { conflictRiskLevel: risk } : {}),
      ...(status ? { status } : {}),
      limit: 10,
      page,
      sortBy,
      sortOrder,
    }),
    [customerName, page, risk, session?.businessId, session?.role, sortBy, sortOrder, status],
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
        message: t('bookings.savedViewRequired'),
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
          ? t('bookings.savedViewUpdated')
          : t('bookings.savedViewCreated')
        : t('bookings.savedViewStorageUnavailable'),
      tone: saved ? 'success' : 'error',
    });
  }

  function handleApplySavedView(view: SavedBookingsView) {
    updateSearchParams(view.state);
    setSavedViewFeedback({
      message: `"${view.name}" ${t('bookings.savedViewApplied')}`,
      tone: 'success',
    });
  }

  function handleRemoveSavedView(viewId: string) {
    const nextViews = savedViews.filter((view) => view.id !== viewId);
    setSavedViews(nextViews);
    const saved = persistSavedViews(nextViews);
    setSavedViewFeedback({
      message: saved ? t('bookings.savedViewRemoved') : t('bookings.savedViewStorageUnavailable'),
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
        throw new Error(t('bookings.selectionRequired'));
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
    setEditDraft(createBookingEditDraft(selectedBooking));
    setIsEditingBooking(false);
    setLifecycleReason('');
    setSuggestions([]);
    setRescheduleDraft(createRescheduleDraft(selectedBooking));
  }, [selectedBooking?._id, selectedBooking?.startDate, selectedBooking?.endDate, selectedBooking?.timein, selectedBooking?.timeout]);

  const lifecycleMutation = useMutation({
    mutationFn: async (targetStatus: LifecycleStatus) => {
      if (!selectedBookingId || !token) {
        throw new Error(t('bookings.activeSessionRequired'));
      }

      const response = await updateBookingStatus(
        selectedBookingId,
        targetStatus,
        lifecycleReason.trim() ? { reason: lifecycleReason.trim() } : {},
        token,
      );

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (updatedBooking) => {
      setLifecycleReason('');
      queryClient.setQueryData(['booking-detail', updatedBooking._id, token], updatedBooking);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking-detail', updatedBooking._id, token] });
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBookingId || !token) {
        throw new Error(t('bookings.activeSessionRequired'));
      }

      const response = await updateBooking(selectedBookingId, buildBookingUpdateBody(editDraft), token);

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (updatedBooking) => {
      setIsEditingBooking(false);
      queryClient.setQueryData(['booking-detail', updatedBooking._id, token], updatedBooking);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking-detail', updatedBooking._id, token] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBookingId || !token) {
        throw new Error(t('bookings.activeSessionRequired'));
      }

      const response = await deleteBooking(selectedBookingId, token);

      if (!response.success) {
        throw new Error(response.error.message);
      }
    },
    onSuccess: () => {
      setSelectedBookingId(null);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) {
        throw new Error(t('bookings.selectionRequired'));
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
        throw new Error(t('bookings.activeSessionRequired'));
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
    if (lifecycleMutation.isPending || !window.confirm(t(action.confirmKey))) {
      return;
    }

    lifecycleMutation.mutate(action.targetStatus);
  }

  function handleEditDraftChange(field: keyof BookingEditDraft, value: string) {
    setEditDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleBookingEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    editMutation.mutate();
  }

  function handleDeleteBooking() {
    if (deleteMutation.isPending || !window.confirm('Delete this booking? This cannot be undone.')) {
      return;
    }

    deleteMutation.mutate();
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
    if (rescheduleMutation.isPending || !window.confirm(t('bookings.confirmReschedule'))) {
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
          <p className="eyebrow">{t('bookings.operations')}</p>
          <h1 id="bookings-title">{t('bookings.title')}</h1>
          <p className="lede">{t('bookings.lede')}</p>
        </div>
        <div className="header-actions" aria-label={t('bookings.actions')}>
          <button className="icon-button" type="button" aria-label={t('bookings.refresh')} onClick={() => bookingsQuery.refetch()}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="panel booking-controls" aria-label={t('bookings.filters')}>
        <label className="form-field">
          {t('bookings.customer')}
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
              placeholder={t('bookings.searchByName')}
            />
          </span>
        </label>

        <label className="form-field">
          {t('bookings.status')}
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
              <option key={option.labelKey} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          {t('bookings.risk')}
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
              <option key={option.labelKey} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          {t('bookings.sort')}
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
                {t(option.labelKey)}
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
          {getSortOrderLabel(sortOrder, t)}
        </button>
      </section>

      {hasActiveFilters ? (
        <section className="panel booking-active-filters" aria-labelledby="booking-active-filters-title">
          <div className="panel-heading booking-active-filters-heading">
            <div>
              <p className="eyebrow">{t('bookings.currentWorkspace')}</p>
              <h2 id="booking-active-filters-title">{t('bookings.activeFilters')}</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => updateSearchParams(defaultBookingSearchState)}
            >
              {t('bookings.clearAll')}
            </button>
          </div>
          <div className="active-filter-chip-list" aria-label={t('bookings.activeFilterList')}>
            {activeFilterChips.map((chip) => (
              <button
                key={chip.id}
                className="active-filter-chip"
                type="button"
                aria-label={`${t('bookings.removeFilter')} ${chip.label}`}
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
            <p className="eyebrow">{t('bookings.workspaceMemory')}</p>
            <h2 id="booking-saved-views-title">{t('bookings.savedViews')}</h2>
          </div>
          <p className="result-count">{t('bookings.browserOnly')}</p>
        </div>
        <p className="body-copy">{t('bookings.savedViewsCopy')}</p>
        <div className="saved-view-toolbar">
          <label className="form-field">
            {t('bookings.viewName')}
            <input
              value={savedViewName}
              maxLength={60}
              onChange={(event) => setSavedViewName(event.target.value)}
              placeholder={t('bookings.viewNamePlaceholder')}
            />
          </label>
          <button className="secondary-button compact-button" type="button" onClick={handleSaveView}>
            {t('bookings.saveCurrentView')}
          </button>
        </div>
        {savedViewFeedback ? <InlineNotice tone={savedViewFeedback.tone} message={savedViewFeedback.message} /> : null}
        {savedViews.length ? (
          <div className="saved-view-list" aria-label={t('bookings.savedViewList')}>
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
                  <p className="saved-view-summary">{describeSearchState(view.state, t)}</p>
                  <button
                    className="icon-button saved-view-remove"
                    type="button"
                    aria-label={`${t('bookings.removeSavedView')} ${view.name} ${t('bookings.savedViewSingular')}`}
                    onClick={() => handleRemoveSavedView(view.id)}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="body-copy">{t('bookings.noSavedViews')}</p>
        )}
      </section>

      <section className="panel booking-list-panel" aria-labelledby="booking-list-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t('bookings.records')}</p>
            <h2 id="booking-list-title">{t('bookings.bookingList')}</h2>
          </div>
          <p className="result-count">
            {bookingsQuery.isFetching ? t('bookings.refreshing') : `${formatNumber(pagination.total)} ${t('bookings.total')}`}
          </p>
        </div>

        {bookingsQuery.isLoading ? (
          <LoadingState label={t('bookings.loading')} />
        ) : bookingsQuery.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title={t('bookings.loadError')}
            description={(bookingsQuery.error as Error).message}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('bookings.empty')}
            description={t('bookings.emptyDescription')}
          />
        ) : (
          <div className="booking-table" role="table" aria-label={t('bookings.table')}>
            <div className="booking-table-row booking-table-head" role="row">
              <span role="columnheader">{t('bookings.customer')}</span>
              <span role="columnheader">{t('bookings.date')}</span>
              <span role="columnheader">{t('bookings.time')}</span>
              <span role="columnheader">{t('bookings.status')}</span>
              <span role="columnheader">{t('bookings.risk')}</span>
              <span role="columnheader">{t('bookings.detail')}</span>
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
                    <StatusChip status={booking.status}>{getStatusLabel(booking.status, t)}</StatusChip>
                  </span>
                  <span role="cell">
                    <span className={`risk-chip risk-${riskLevel}`}>{getRiskLabel(riskLevel, t)} {t('risk.label')}</span>
                  </span>
                  <span role="cell">
                    <button className="text-button table-action" type="button" onClick={() => setSelectedBookingId(booking._id)}>
                      {t('bookings.viewDetails')}
                    </button>
                  </span>
                </article>
              );
            })}
          </div>
        )}

        <div className="pagination-bar" aria-label={t('bookings.pagination')}>
          <button
            className="icon-button"
            type="button"
            aria-label={t('bookings.previousPage')}
            disabled={pagination.page <= 1 || bookingsQuery.isFetching}
            onClick={() => updateSearchParams({ page: Math.max(1, page - 1) })}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span>
            {t('bookings.pageOf')} {formatNumber(pagination.page)} {t('bookings.of')} {formatNumber(pagination.totalPages)}
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label={t('bookings.nextPage')}
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
              <p className="eyebrow">{t('bookings.detailEyebrow')}</p>
              <h2 id="booking-detail-title">
                {selectedBooking ? getCustomerName(selectedBooking) : t('bookings.loadingBooking')}
              </h2>
            </div>
            <button className="icon-button" type="button" aria-label={t('bookings.closeDetail')} onClick={() => setSelectedBookingId(null)}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {bookingDetailQuery.isLoading ? (
            <LoadingState label={t('bookings.loadingDetail')} />
          ) : bookingDetailQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title={t('bookings.detailLoadError')}
              description={(bookingDetailQuery.error as Error).message}
            />
          ) : selectedBooking ? (
            <div className="detail-content">
              <div className="detail-summary">
                <StatusChip status={selectedBooking.status}>{getStatusLabel(selectedBooking.status, t)}</StatusChip>
                <span className={`risk-chip risk-${getRiskLevel(selectedBooking)}`}>
                  {getRiskLabel(getRiskLevel(selectedBooking), t)} {t('risk.label')}
                </span>
              </div>

              <section className="detail-section" aria-label="Booking record actions">
                <div className="action-row">
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={() => {
                      setEditDraft(createBookingEditDraft(selectedBooking));
                      setIsEditingBooking((current) => !current);
                    }}
                  >
                    <Pencil size={17} aria-hidden="true" />
                    {isEditingBooking ? 'Cancel edit' : 'Edit booking'}
                  </button>
                  {session?.role === 'owner' || session?.role === 'admin' ? (
                    <button
                      className="secondary-button compact-button danger-button"
                      disabled={deleteMutation.isPending}
                      type="button"
                      onClick={handleDeleteBooking}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                      {deleteMutation.isPending ? 'Deleting' : 'Delete'}
                    </button>
                  ) : null}
                </div>
                {deleteMutation.isError ? (
                  <InlineNotice tone="error" message={(deleteMutation.error as Error).message} icon={AlertTriangle} />
                ) : null}
              </section>

              {isEditingBooking ? (
                <form className="detail-section management-form" aria-label="Edit booking" onSubmit={handleBookingEditSubmit}>
                  <h3>Edit booking</h3>
                  <div className="form-grid">
                    <label className="form-field">
                      First name
                      <input required value={editDraft.fName} onChange={(event) => handleEditDraftChange('fName', event.target.value)} />
                    </label>
                    <label className="form-field">
                      Last name
                      <input required value={editDraft.lName} onChange={(event) => handleEditDraftChange('lName', event.target.value)} />
                    </label>
                    <label className="form-field">
                      Email
                      <input required type="email" value={editDraft.email} onChange={(event) => handleEditDraftChange('email', event.target.value)} />
                    </label>
                    <label className="form-field">
                      Phone
                      <input required value={editDraft.phone} onChange={(event) => handleEditDraftChange('phone', event.target.value)} />
                    </label>
                    <label className="form-field">
                      Party size
                      <input
                        min={1}
                        required
                        type="number"
                        value={editDraft.partySize}
                        onChange={(event) => handleEditDraftChange('partySize', event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="reschedule-grid">
                    <label className="form-field">
                      {t('bookings.start')}
                      <input required type="datetime-local" value={editDraft.startDate} onChange={(event) => handleEditDraftChange('startDate', event.target.value)} />
                    </label>
                    <label className="form-field">
                      {t('bookings.end')}
                      <input required type="datetime-local" value={editDraft.endDate} onChange={(event) => handleEditDraftChange('endDate', event.target.value)} />
                    </label>
                    <label className="form-field">
                      {t('bookings.timeIn')}
                      <input required type="datetime-local" value={editDraft.timein} onChange={(event) => handleEditDraftChange('timein', event.target.value)} />
                    </label>
                    <label className="form-field">
                      {t('bookings.timeOut')}
                      <input required type="datetime-local" value={editDraft.timeout} onChange={(event) => handleEditDraftChange('timeout', event.target.value)} />
                    </label>
                  </div>
                  <label className="form-field">
                    {t('bookings.notes')}
                    <textarea value={editDraft.notes} onChange={(event) => handleEditDraftChange('notes', event.target.value)} />
                  </label>
                  {editMutation.isError ? (
                    <InlineNotice tone="error" message={(editMutation.error as Error).message} icon={AlertTriangle} />
                  ) : null}
                  <button className="primary-button compact-button" disabled={editMutation.isPending} type="submit">
                    <Save size={17} aria-hidden="true" />
                    {editMutation.isPending ? t('bookings.saving') : 'Save booking'}
                  </button>
                </form>
              ) : null}

              <section className="detail-section" aria-label={t('bookings.customerContact')}>
                <h3>{t('bookings.customer')}</h3>
                <p className="detail-line">
                  <Mail size={16} aria-hidden="true" />
                  {selectedBooking.email}
                </p>
                <p className="detail-line">
                  <Phone size={16} aria-hidden="true" />
                  {selectedBooking.phone}
                </p>
              </section>

              <section className="detail-section" aria-label={t('bookings.schedule')}>
                <h3>{t('bookings.schedule')}</h3>
                <p className="detail-line">
                  <CalendarClock size={16} aria-hidden="true" />
                  {formatDateTime(selectedBooking.startDate)} {t('bookings.scheduleFromTo')} {formatTime(selectedBooking.timein)} -{' '}
                  {formatTime(selectedBooking.timeout)}
                </p>
                <div className="detail-grid">
                  <DetailField label={t('bookings.partySize')} notSetLabel={t('bookings.notSet')} value={selectedBooking.partySize} />
                  <DetailField label={t('bookings.resource')} notSetLabel={t('bookings.notSet')} value={selectedBooking.serviceResourceId} />
                  <DetailField label={t('bookings.business')} notSetLabel={t('bookings.notSet')} value={selectedBooking.businessId} />
                  <DetailField label={t('bookings.customerId')} notSetLabel={t('bookings.notSet')} value={selectedBooking.customerId} />
                </div>
              </section>

              {selectedBooking.notes ? (
                <section className="detail-section" aria-label={t('bookings.notes')}>
                  <h3>{t('bookings.notes')}</h3>
                  <p className="body-copy">{selectedBooking.notes}</p>
                </section>
              ) : null}

              {selectedBooking.conflictRisk ? (
                <section className="detail-section" aria-label={t('bookings.conflictRisk')}>
                  <h3>{t('bookings.riskSignals')}</h3>
                  <p className="body-copy">{selectedBooking.conflictRisk.summary}</p>
                  <div className="signal-list">
                    {selectedBooking.conflictRisk.signals.map((signal) => (
                      <span key={signal}>{signal}</span>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="detail-section" aria-label={t('bookings.lifecycleActions')}>
                <h3>{t('bookings.lifecycleActions')}</h3>
                {lifecycleMutation.isError ? (
                  <InlineNotice tone="error" message={(lifecycleMutation.error as Error).message} icon={AlertTriangle} />
                ) : null}
                {availableLifecycleActions.length ? (
                  <>
                    <label className="form-field">
                      Status reason
                      <input
                        value={lifecycleReason}
                        onChange={(event) => setLifecycleReason(event.target.value)}
                        placeholder={t('bookings.optionalAuditNote')}
                      />
                    </label>
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
                            {lifecycleMutation.isPending && isCurrentMutation ? t('bookings.saving') : t(action.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="body-copy">{t('bookings.noLifecycleActions')}</p>
                )}
              </section>

              <section className="detail-section" aria-label={t('bookings.reschedule')}>
                <h3>{t('bookings.reschedule')}</h3>
                {rescheduleAvailable ? (
                  <form className="reschedule-form" onSubmit={handleSuggestionSubmit}>
                    <div className="reschedule-grid">
                      <label className="form-field">
                        {t('bookings.start')}
                        <input
                          required
                          type="datetime-local"
                          value={rescheduleDraft.startDate}
                          onChange={(event) => handleDraftChange('startDate', event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        {t('bookings.end')}
                        <input
                          required
                          type="datetime-local"
                          value={rescheduleDraft.endDate}
                          onChange={(event) => handleDraftChange('endDate', event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        {t('bookings.timeIn')}
                        <input
                          required
                          type="datetime-local"
                          value={rescheduleDraft.timein}
                          onChange={(event) => handleDraftChange('timein', event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        {t('bookings.timeOut')}
                        <input
                          required
                          type="datetime-local"
                          value={rescheduleDraft.timeout}
                          onChange={(event) => handleDraftChange('timeout', event.target.value)}
                        />
                      </label>
                    </div>
                    <label className="form-field">
                      {t('bookings.reason')}
                      <input
                        value={rescheduleDraft.reason}
                        onChange={(event) => handleDraftChange('reason', event.target.value)}
                        placeholder={t('bookings.optionalAuditNote')}
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
                        {suggestionMutation.isPending ? t('bookings.checking') : t('bookings.findSuggestions')}
                      </button>
                      <button
                        className="primary-button compact-button"
                        disabled={rescheduleMutation.isPending || suggestionMutation.isPending}
                        type="button"
                        onClick={handleRescheduleSubmit}
                      >
                        <CalendarClock size={17} aria-hidden="true" />
                        {rescheduleMutation.isPending ? t('bookings.saving') : t('bookings.reschedule')}
                      </button>
                    </div>
                    {suggestions.length ? (
                      <div className="suggestion-list" aria-label={t('bookings.suggestedSlots')}>
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
                  <p className="body-copy">{t('bookings.rescheduleUnavailable')}</p>
                )}
              </section>

              <section className="detail-section" aria-label={t('bookings.statusHistory')}>
                <h3>{t('bookings.statusHistory')}</h3>
                {selectedBooking.statusHistory?.length ? (
                  <div className="history-list">
                    {selectedBooking.statusHistory.map((entry) => (
                      <div className="history-entry" key={`${entry.toStatus}-${entry.changedAt}`}>
                        <strong>{getStatusLabel(entry.toStatus, t)}</strong>
                        <span>
                          {formatDateTime(entry.changedAt)} · {entry.changedByRole}
                          {entry.reason ? ` · ${entry.reason}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="body-copy">{t('bookings.noStatusHistory')}</p>
                )}
              </section>
            </div>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}
