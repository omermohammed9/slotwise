export type ApiMeta = Record<string, unknown>;

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  status?: number;
  error: {
    code?: 'csrf' | 'forbidden' | 'network' | 'rate_limited' | 'unauthorized' | 'unknown';
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type QueryParams = Record<string, boolean | null | number | string | undefined>;

export type Role = 'admin' | 'customer' | 'owner' | 'staff';

export type SessionDto = {
  token?: string;
  csrfToken?: string;
  role: Role;
  actorId: string;
  actorType?: 'customer' | 'operator';
  businessId?: string;
  email?: string;
  expiresAt?: string;
  lastSeenAt?: string;
  sessionId?: string;
  username?: string;
};

export type CurrentSessionDto = Omit<SessionDto, 'token'>;

export type BookingStatus = 'approved' | 'cancelled' | 'completed' | 'no_show' | 'pending' | 'rejected';
export type ConflictRiskLevel = 'high' | 'low' | 'medium';
export type SortOrder = 'asc' | 'desc';

export type ConflictRiskDto = {
  level: ConflictRiskLevel;
  score: number;
  summary: string;
  evaluatedAt: string;
  signals: string[];
};

export type StatusHistoryDto = {
  fromStatus?: BookingStatus;
  toStatus: BookingStatus;
  changedAt: string;
  changedByRole: Role | 'system';
  changedBy?: string;
  reason?: string;
};

export type RescheduleHistoryDto = {
  previousStartDate: string;
  previousEndDate: string;
  previousTimein: string;
  previousTimeout: string;
  newStartDate: string;
  newEndDate: string;
  newTimein: string;
  newTimeout: string;
  rescheduledAt: string;
  rescheduledByRole: Role | 'system';
  rescheduledBy?: string;
  reason?: string;
};

export type BookingDto = {
  _id: string;
  businessId?: string;
  customerId?: string;
  serviceResourceId?: string;
  userId?: string;
  fName: string;
  lName: string;
  gender?: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  timein: string;
  timeout: string;
  status: BookingStatus;
  partySize?: number;
  notes?: string;
  conflictRisk?: ConflictRiskDto;
  statusHistory?: StatusHistoryDto[];
  rescheduleHistory?: RescheduleHistoryDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type BookingListQuery = {
  status?: BookingStatus;
  startDateFrom?: string;
  startDateTo?: string;
  businessId?: string;
  customerId?: string;
  serviceResourceId?: string;
  email?: string;
  phone?: string;
  customerName?: string;
  conflictRiskLevel?: ConflictRiskLevel;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'endDate' | 'startDate' | 'status' | 'updatedAt';
  sortOrder?: SortOrder;
};

export type BookingInsightsQuery = Pick<
  BookingListQuery,
  'businessId' | 'serviceResourceId' | 'startDateFrom' | 'startDateTo'
>;

export type BookingStatusActionBody = {
  reason?: string;
};

export type RescheduleBookingBody = {
  startDate: string;
  endDate: string;
  timein: string;
  timeout: string;
  reason?: string;
};

export type BookingSuggestionBody = {
  businessId?: string;
  serviceResourceId?: string;
  startDate: string;
  endDate: string;
  timein: string;
  timeout: string;
  maxSuggestions?: number;
  partySize?: number;
};

export type BookingSuggestionDto = {
  startDate: string;
  endDate: string;
  timein: string;
  timeout: string;
  score: number;
  summary: string;
  conflictRisk?: ConflictRiskDto;
};

export type TimelineEntryDto = {
  id: string;
  startDate: string;
  endDate: string;
  timein: string;
  timeout: string;
  status: BookingStatus;
  customerName: string;
  businessId?: string;
  customerId?: string;
  serviceResourceId?: string;
  partySize?: number;
  conflictRisk?: ConflictRiskDto;
  durationMinutes: number;
  isRescheduled: boolean;
};

export type TimelineDayDto = {
  date: string;
  bookings: TimelineEntryDto[];
  summary: {
    totalBookings: number;
    pendingBookings: number;
    approvedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    highRiskBookings: number;
  };
};

export type DashboardInsightsDto = {
  summary: {
    totalBookings: number;
    pendingBookings: number;
    approvedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    rejectedBookings: number;
    approvalRate: number;
    completionRate: number;
    conversionRate: number;
    utilizationMinutes: number;
    averagePartySize: number;
  };
  funnel: Array<{
    status: BookingStatus;
    count: number;
  }>;
  utilization: {
    byWeekday: Array<{
      weekday: string;
      bookings: number;
      bookedMinutes: number;
    }>;
    byResource: Array<{
      resourceId: string;
      bookings: number;
      bookedMinutes: number;
    }>;
  };
  peaks: {
    busiestWeekday?: string;
    busiestHour?: string;
    topTimeSlots: Array<{
      label: string;
      bookings: number;
    }>;
  };
};

export type CancellationNoShowInsightsDto = {
  summary: {
    totalBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    completedBookings: number;
    cancellationRate: number;
    noShowRate: number;
    serviceDeliveryRate: number;
  };
  trends: {
    cancellationReasons: Array<{
      reason: string;
      count: number;
    }>;
    noShowReasons: Array<{
      reason: string;
      count: number;
    }>;
    byWeekday: Array<{
      weekday: string;
      cancellations: number;
      noShows: number;
    }>;
  };
};

export type BusinessProfileDto = {
  _id: string;
  name: string;
  slug: string;
  businessType: string;
  timezone: string;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  templateKey?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  availabilityRules?: {
    slotIntervalMinutes?: number;
    minAdvanceMinutes?: number;
    maxAdvanceDays?: number;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    allowOverbooking?: boolean;
  };
  workingHours?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    closed?: boolean;
  }>;
  blackoutDates?: Array<{
    startDate: string;
    endDate: string;
    reason?: string;
  }>;
  publicPageSettings?: Record<string, unknown>;
  widgetSettings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type BusinessTemplateDto = {
  key: string;
  label: string;
  description?: string;
  [key: string]: unknown;
};

export type ServiceResourceDto = {
  _id: string;
  businessId: string;
  name: string;
  type: string;
  resourceType?: string;
  isActive?: boolean;
  active?: boolean;
  capacity?: number;
  description?: string;
  durationMinutes?: number;
  requiresApproval?: boolean;
  supportedRoles?: Role[];
  availabilityOverrides?: {
    slotIntervalMinutes?: number;
    minAdvanceMinutes?: number;
    maxAdvanceDays?: number;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    allowOverbooking?: boolean;
    workingHours?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      closed?: boolean;
    }>;
    blackoutDates?: Array<{
      startDate: string;
      endDate: string;
      reason?: string;
    }>;
  };
  [key: string]: unknown;
};

export type CustomerDto = {
  _id: string;
  businessId: string;
  firstName?: string;
  lastName?: string;
  fName?: string;
  lName?: string;
  email: string;
  phone?: string;
  notes?: string;
  preferredNotificationChannels?: Array<'email' | 'sms'>;
  totalBookings?: number;
  bookingCount?: number;
  [key: string]: unknown;
};

export type PublicResourcePreviewDto = {
  id: string;
  name: string;
  type?: string;
  resourceType?: string;
  durationMinutes?: number;
  capacity?: number;
  requiresApproval?: boolean;
};

export type PublicBookingPageConfigDto = {
  availableResources: PublicResourcePreviewDto[];
  bookingEndpoints: {
    createBooking: string;
    suggestions: string;
  };
  businessId: string;
  businessType: string;
  contactDetails?: {
    email?: string;
    phone?: string;
  };
  description?: string;
  name: string;
  publicPageSettings?: Record<string, unknown>;
  slug: string;
  timezone: string;
  widgetSettings?: Record<string, unknown>;
  workingHours?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    closed?: boolean;
  }>;
  business?: Pick<BusinessProfileDto, '_id' | 'businessType' | 'name' | 'slug' | 'timezone'>;
  pageSettings?: Record<string, unknown>;
  resources?: PublicResourcePreviewDto[];
  endpoints?: Record<string, string>;
  [key: string]: unknown;
};

export type PublicWidgetConfigDto = {
  businessId?: string;
  name?: string;
  slug?: string;
  businessType?: string;
  timezone?: string;
  description?: string;
  widgetSettings?: Record<string, unknown>;
  availableResources?: PublicResourcePreviewDto[];
  bookingEndpoints?: Record<string, string>;
  business?: Pick<BusinessProfileDto, '_id' | 'businessType' | 'name' | 'slug' | 'timezone'>;
  resources?: PublicResourcePreviewDto[];
  endpoints?: Record<string, string>;
  [key: string]: unknown;
};
