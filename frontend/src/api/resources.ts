import { apiRequest } from './client';
import type { ApiResponse, QueryParams, ServiceResourceDto } from './types';

export type CreateServiceResourceBody = Partial<ServiceResourceDto>;
export type UpdateServiceResourceBody = Partial<Omit<ServiceResourceDto, '_id'>>;

export function listServiceResources(query: QueryParams | undefined, token: string): Promise<ApiResponse<ServiceResourceDto[]>> {
  return apiRequest<ServiceResourceDto[]>('/service-resources', {
    method: 'GET',
    query,
    token,
  });
}

export function getServiceResource(id: string, token: string): Promise<ApiResponse<ServiceResourceDto>> {
  return apiRequest<ServiceResourceDto>(`/service-resources/${id}`, {
    method: 'GET',
    token,
  });
}

export function createServiceResource(
  body: CreateServiceResourceBody,
  token: string,
): Promise<ApiResponse<ServiceResourceDto>> {
  return apiRequest<ServiceResourceDto>('/service-resources', {
    method: 'POST',
    body,
    token,
  });
}

export function updateServiceResource(
  id: string,
  body: UpdateServiceResourceBody,
  token: string,
): Promise<ApiResponse<ServiceResourceDto>> {
  return apiRequest<ServiceResourceDto>(`/service-resources/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}
