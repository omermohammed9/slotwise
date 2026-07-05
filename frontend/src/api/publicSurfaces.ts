import { apiRequest } from '@/api/client';
import type { ApiResponse, PublicBookingPageConfigDto, PublicWidgetConfigDto } from '@/api/types';

export function getPublicBookingPageConfig(slug: string): Promise<ApiResponse<PublicBookingPageConfigDto>> {
  return apiRequest<PublicBookingPageConfigDto>(`/businesses/public/${slug}/booking-page`, {
    method: 'GET',
  });
}

export function getPublicWidgetConfig(slug: string): Promise<ApiResponse<PublicWidgetConfigDto>> {
  return apiRequest<PublicWidgetConfigDto>(`/businesses/public/${slug}/widget`, {
    method: 'GET',
  });
}
