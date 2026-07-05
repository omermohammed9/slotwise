import { apiRequest } from '@/api/client';
import type {
  ApiResponse,
  BookingDto,
  BookingInsightsQuery,
  BookingListQuery,
  BookingStatus,
  BookingStatusActionBody,
  BookingSuggestionBody,
  BookingSuggestionDto,
  CancellationNoShowInsightsDto,
  DashboardInsightsDto,
  RescheduleBookingBody,
  TimelineDayDto,
} from '@/api/types';

export type CreateBookingBody = Partial<BookingDto>;
export type UpdateBookingBody = Partial<Omit<BookingDto, '_id' | 'createdAt' | 'status' | 'updatedAt'>>;
export type CustomerBookingActionBody = {
  reason?: string;
};

export function listBookings(query?: BookingListQuery, token?: string): Promise<ApiResponse<BookingDto[]>> {
  return apiRequest<BookingDto[]>('/bookings', {
    method: 'GET',
    query,
    token,
  });
}

export function getBooking(id: string, token?: string): Promise<ApiResponse<BookingDto>> {
  return apiRequest<BookingDto>(`/bookings/${id}`, {
    method: 'GET',
    token,
  });
}

export function createBooking(body: CreateBookingBody): Promise<ApiResponse<BookingDto>> {
  return apiRequest<BookingDto>('/bookings', {
    method: 'POST',
    body,
  });
}

export function updateBooking(id: string, body: UpdateBookingBody, token?: string): Promise<ApiResponse<BookingDto>> {
  return apiRequest<BookingDto>(`/bookings/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export function deleteBooking(id: string, token?: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/bookings/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function updateBookingStatus(
  id: string,
  status: Extract<BookingStatus, 'approved' | 'cancelled' | 'completed' | 'no_show' | 'rejected'>,
  body: BookingStatusActionBody,
  token: string,
): Promise<ApiResponse<BookingDto>> {
  const statusPathByStatus: Record<typeof status, string> = {
    approved: 'approve',
    cancelled: 'cancel',
    completed: 'complete',
    no_show: 'no-show',
    rejected: 'reject',
  };

  return apiRequest<BookingDto>(`/bookings/${id}/${statusPathByStatus[status]}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export function rescheduleBooking(
  id: string,
  body: RescheduleBookingBody,
  token: string,
): Promise<ApiResponse<BookingDto>> {
  return apiRequest<BookingDto>(`/bookings/${id}/reschedule`, {
    method: 'PATCH',
    body,
    token,
  });
}

export function customerCancelBooking(
  id: string,
  body: CustomerBookingActionBody,
  token: string,
): Promise<ApiResponse<BookingDto>> {
  return apiRequest<BookingDto>(`/bookings/${id}/customer-cancel`, {
    method: 'POST',
    body,
    token,
  });
}

export function customerRescheduleBooking(
  id: string,
  body: RescheduleBookingBody,
  token: string,
): Promise<ApiResponse<BookingDto>> {
  return apiRequest<BookingDto>(`/bookings/${id}/customer-reschedule`, {
    method: 'POST',
    body,
    token,
  });
}

export function getBookingTimeline(query?: BookingListQuery, token?: string): Promise<ApiResponse<TimelineDayDto[]>> {
  return apiRequest<TimelineDayDto[]>('/bookings/timeline', {
    method: 'GET',
    query,
    token,
  });
}

export function getDashboardInsights(
  query?: BookingInsightsQuery,
  token?: string,
): Promise<ApiResponse<DashboardInsightsDto>> {
  return apiRequest<DashboardInsightsDto>('/bookings/insights/dashboard', {
    method: 'GET',
    query,
    token,
  });
}

export function getCancellationNoShowInsights(
  query?: BookingInsightsQuery,
  token?: string,
): Promise<ApiResponse<CancellationNoShowInsightsDto>> {
  return apiRequest<CancellationNoShowInsightsDto>('/bookings/insights/cancellation-no-show', {
    method: 'GET',
    query,
    token,
  });
}

export function getBookingSuggestions(body: BookingSuggestionBody): Promise<ApiResponse<BookingSuggestionDto[]>> {
  return apiRequest<BookingSuggestionDto[]>('/bookings/suggestions', {
    method: 'POST',
    body,
  });
}
