import { apiRequest } from './client';
import type { ApiResponse, CurrentSessionDto, SessionDto } from './types';

export type OperatorLoginBody = {
  username: string;
  password: string;
};

export type CustomerMagicLinkBody = {
  businessId: string;
  email: string;
};

export type CustomerVerifyBody = {
  token: string;
};

export function createOperatorSession(body: OperatorLoginBody): Promise<ApiResponse<SessionDto>> {
  return apiRequest<SessionDto>('/auth/session', {
    method: 'POST',
    body,
  });
}

export function getCurrentSession(token: string): Promise<ApiResponse<CurrentSessionDto>> {
  return apiRequest<CurrentSessionDto>('/auth/session', {
    method: 'GET',
    token,
  });
}

export function deleteSession(token: string): Promise<ApiResponse<{ revoked: boolean }>> {
  return apiRequest<{ revoked: boolean }>('/auth/session', {
    method: 'DELETE',
    token,
  });
}

export function requestCustomerMagicLink(body: CustomerMagicLinkBody): Promise<ApiResponse<{ accepted: boolean }>> {
  return apiRequest<{ accepted: boolean }>('/auth/customer/magic-link', {
    method: 'POST',
    body,
  });
}

export function verifyCustomerMagicLink(body: CustomerVerifyBody): Promise<ApiResponse<SessionDto>> {
  return apiRequest<SessionDto>('/auth/customer/verify', {
    method: 'POST',
    body,
  });
}
