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

export type OperatorInvitationAcceptBody = {
  token: string;
  password: string;
};

export type OperatorPasswordResetRequestBody = {
  username: string;
};

export type OperatorPasswordResetCompleteBody = {
  token: string;
  password: string;
};

export type CustomerMagicLinkResult = {
  accepted?: boolean;
  requested?: boolean;
};

export type OperatorInvitationAcceptResult = {
  accepted: true;
};

export type OperatorPasswordResetRequestResult = {
  requested: true;
  token?: string;
};

export type OperatorPasswordResetCompleteResult = {
  reset: true;
};

export function createOperatorSession(body: OperatorLoginBody): Promise<ApiResponse<SessionDto>> {
  return apiRequest<SessionDto>('/auth/session', {
    method: 'POST',
    body,
  });
}

export function getCurrentSession(token?: string | null): Promise<ApiResponse<CurrentSessionDto>> {
  return apiRequest<CurrentSessionDto>('/auth/session', {
    method: 'GET',
    token,
  });
}

export function deleteSession(token?: string | null): Promise<ApiResponse<{ revoked: boolean }>> {
  return apiRequest<{ revoked: boolean }>('/auth/session', {
    method: 'DELETE',
    token,
  });
}

export function acceptOperatorInvitation(
  body: OperatorInvitationAcceptBody,
): Promise<ApiResponse<OperatorInvitationAcceptResult>> {
  return apiRequest<OperatorInvitationAcceptResult>('/auth/operators/invitations/accept', {
    method: 'POST',
    body,
  });
}

export function requestOperatorPasswordReset(
  body: OperatorPasswordResetRequestBody,
): Promise<ApiResponse<OperatorPasswordResetRequestResult>> {
  return apiRequest<OperatorPasswordResetRequestResult>('/auth/operators/password-reset', {
    method: 'POST',
    body,
  });
}

export function completeOperatorPasswordReset(
  body: OperatorPasswordResetCompleteBody,
): Promise<ApiResponse<OperatorPasswordResetCompleteResult>> {
  return apiRequest<OperatorPasswordResetCompleteResult>('/auth/operators/password-reset/complete', {
    method: 'POST',
    body,
  });
}

export function requestCustomerMagicLink(body: CustomerMagicLinkBody): Promise<ApiResponse<CustomerMagicLinkResult>> {
  return apiRequest<CustomerMagicLinkResult>('/auth/customer/magic-link', {
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
