import { apiRequest } from './client';
import type { ApiResponse, BusinessProfileDto, BusinessTemplateDto } from './types';

export type CreateBusinessProfileBody = Partial<BusinessProfileDto>;
export type UpdateBusinessProfileBody = Partial<Omit<BusinessProfileDto, '_id' | 'createdAt' | 'updatedAt'>>;

export function listBusinesses(token: string): Promise<ApiResponse<BusinessProfileDto[]>> {
  return apiRequest<BusinessProfileDto[]>('/businesses', {
    method: 'GET',
    token,
  });
}

export function getBusiness(id: string, token: string): Promise<ApiResponse<BusinessProfileDto>> {
  return apiRequest<BusinessProfileDto>(`/businesses/${id}`, {
    method: 'GET',
    token,
  });
}

export function createBusiness(body: CreateBusinessProfileBody, token: string): Promise<ApiResponse<BusinessProfileDto>> {
  return apiRequest<BusinessProfileDto>('/businesses', {
    method: 'POST',
    body,
    token,
  });
}

export function updateBusiness(
  id: string,
  body: UpdateBusinessProfileBody,
  token: string,
): Promise<ApiResponse<BusinessProfileDto>> {
  return apiRequest<BusinessProfileDto>(`/businesses/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export function listBusinessTemplates(token: string): Promise<ApiResponse<BusinessTemplateDto[]>> {
  return apiRequest<BusinessTemplateDto[]>('/businesses/templates', {
    method: 'GET',
    token,
  });
}

export function getBusinessTemplate(key: string, token: string): Promise<ApiResponse<BusinessTemplateDto>> {
  return apiRequest<BusinessTemplateDto>(`/businesses/templates/${key}`, {
    method: 'GET',
    token,
  });
}
