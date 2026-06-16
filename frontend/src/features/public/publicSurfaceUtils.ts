import { format, parseISO } from 'date-fns';

type PublicDraftSeed = {
  date?: string;
  startTime?: string;
  endTime?: string;
  resourceId?: string;
  partySize?: number;
  fName?: string;
  lName?: string;
  email?: string;
  phone?: string;
};

type ValidatePublicBookingDraftInput = {
  draft?: {
    date: string;
    email: string;
    endTime: string;
    fName: string;
    lName: string;
    phone: string;
    resourceId?: string;
    startTime: string;
  };
  businessId?: string;
  date?: string;
  email?: string;
  endTime?: string;
  fName?: string;
  lName?: string;
  phone?: string;
  resourceId?: string;
  requireBusinessId?: boolean;
  maxPartySize?: number;
  minDate?: string;
  requireResource?: boolean;
  selectedResource?: {
    id?: string;
  } | null;
  showPartySize?: boolean;
  startTime?: string;
};

type CreatePortalLinkInput = {
  booking?: {
    _id?: string;
  } | null;
  bookingId?: string;
  businessId?: string;
  email?: string;
  slug?: string;
};

export function getInitialDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function formatInputDate(value: string): string {
  try {
    return format(parseISO(value), 'yyyy-MM-dd');
  } catch {
    return value.slice(0, 10);
  }
}

export function formatInputTime(value: string): string {
  try {
    return format(parseISO(value), 'HH:mm');
  } catch {
    return value.slice(11, 16);
  }
}

export function clampPartySize(value: number, maxPartySize?: number): number {
  const normalizedValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;

  if (!maxPartySize || maxPartySize < 1) {
    return normalizedValue;
  }

  return Math.max(1, Math.min(normalizedValue, Math.floor(maxPartySize)));
}

export function createPublicDraftFromSearchParams(searchParams: URLSearchParams): PublicDraftSeed {
  const partySizeValue = Number(searchParams.get('partySize') ?? '');
  const draft: PublicDraftSeed = {};

  const date = searchParams.get('date');
  const email = searchParams.get('email');
  const endTime = searchParams.get('end');
  const fName = searchParams.get('fName');
  const lName = searchParams.get('lName');
  const phone = searchParams.get('phone');
  const resourceId = searchParams.get('resourceId');
  const startTime = searchParams.get('start');

  if (date) {
    draft.date = date;
  }
  if (email) {
    draft.email = email;
  }
  if (endTime) {
    draft.endTime = endTime;
  }
  if (fName) {
    draft.fName = fName;
  }
  if (lName) {
    draft.lName = lName;
  }
  if (phone) {
    draft.phone = phone;
  }
  if (resourceId) {
    draft.resourceId = resourceId;
  }
  if (startTime) {
    draft.startTime = startTime;
  }
  if (Number.isFinite(partySizeValue) && partySizeValue > 0) {
    draft.partySize = partySizeValue;
  }

  return draft;
}

export function createPortalLink({ booking, bookingId, businessId, email, slug }: CreatePortalLinkInput): string {
  const searchParams = new URLSearchParams();
  const resolvedBookingId = bookingId ?? booking?._id;

  if (businessId) {
    searchParams.set('businessId', businessId);
  }

  if (email) {
    searchParams.set('email', email);
  }

  if (slug) {
    searchParams.set('slug', slug);
  }

  if (resolvedBookingId) {
    searchParams.set('bookingId', resolvedBookingId);
  }

  const query = searchParams.toString();
  return query ? `/portal?${query}` : '/portal';
}

export function validatePublicBookingDraft({
  draft,
  businessId,
  date,
  email,
  endTime,
  fName,
  lName,
  phone,
  resourceId,
  requireBusinessId = false,
  requireResource = false,
  startTime,
}: ValidatePublicBookingDraftInput): string | null {
  const resolvedDraft = draft ?? {
    date: date ?? '',
    email: email ?? '',
    endTime: endTime ?? '',
    fName: fName ?? '',
    lName: lName ?? '',
    phone: phone ?? '',
    resourceId,
    startTime: startTime ?? '',
  };

  if (requireBusinessId && !businessId?.trim()) {
    return 'Enter the business ID from your booking confirmation.';
  }

  if (requireResource && !resolvedDraft.resourceId?.trim()) {
    return 'Choose a resource to continue.';
  }

  if (!resolvedDraft.date || !resolvedDraft.startTime || !resolvedDraft.endTime) {
    return 'Choose a date, start time, and end time.';
  }

  if (!resolvedDraft.fName.trim() || !resolvedDraft.lName.trim()) {
    return 'Enter the guest first and last name.';
  }

  if (!resolvedDraft.email.trim()) {
    return 'Enter the guest email address.';
  }

  if (!resolvedDraft.phone.trim()) {
    return 'Enter the guest phone number.';
  }

  try {
    const start = new Date(`${resolvedDraft.date}T${resolvedDraft.startTime}:00`);
    const end = new Date(`${resolvedDraft.date}T${resolvedDraft.endTime}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Enter a valid booking date and time.';
    }

    if (end <= start) {
      return 'End time must be after the start time.';
    }
  } catch {
    return 'Enter a valid booking date and time.';
  }

  return null;
}
