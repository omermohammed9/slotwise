import { apiRequest } from './client';
import type { ApiResponse, Role } from './types';

export type OperatorAccountDto = {
  id: string;
  actorId: string;
  username: string;
  role: Exclude<Role, 'customer'>;
  active: boolean;
  invitationAcceptedAt?: string;
};

export function listOperators(token?: string | null): Promise<ApiResponse<{ operators: OperatorAccountDto[] }>> {
  return apiRequest('/auth/operators', { method: 'GET', token });
}

export function inviteOperator(
  body: { username: string; role: Exclude<Role, 'customer'> },
  token?: string | null,
): Promise<ApiResponse<{ invited: true; token?: string; operatorId: string }>> {
  return apiRequest('/auth/operators/invitations', { method: 'POST', body, token });
}

export function updateOperatorRole(
  operatorId: string,
  role: Exclude<Role, 'customer'>,
  token?: string | null,
): Promise<ApiResponse<{ updated: true }>> {
  return apiRequest(`/auth/operators/${operatorId}/role`, { method: 'PATCH', body: { role }, token });
}

export function updateOperatorStatus(
  operatorId: string,
  active: boolean,
  token?: string | null,
): Promise<ApiResponse<{ updated: true }>> {
  return apiRequest(`/auth/operators/${operatorId}/status`, { method: 'PATCH', body: { active }, token });
}
