import { apiRequest, buildApiPath, COOKIE_SESSION_TOKEN, getApiBaseUrl } from '@/api/client';
import type { ApiMeta, ApiResponse, QueryParams, Role } from '@/api/types';

export type AuditLogDto = {
  _id: string;
  actorId: string;
  actorRole: Role | 'system';
  action: string;
  targetEntity: string;
  targetId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export function listAuditLogs(
  query: QueryParams,
  token?: string | null,
): Promise<ApiResponse<{ logs: AuditLogDto[] }> & { meta?: ApiMeta }> {
  return apiRequest('/audit-logs', { method: 'GET', query, token });
}

export async function exportAuditLogsCsv(query: QueryParams, token?: string | null): Promise<{ success: true; csv: string } | { success: false; message: string }> {
  const headers = new Headers();
  if (token && token !== COOKIE_SESSION_TOKEN) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${buildApiPath('/audit-logs/export', query)}`, {
    credentials: 'include',
    headers: Object.fromEntries(headers.entries()),
    method: 'GET',
  }).catch(() => null);

  if (!response) {
    return { success: false, message: 'Unable to export audit logs. Check your connection and try again.' };
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ApiResponse<unknown> | null;
    return {
      success: false,
      message: payload?.success === false ? payload.error.message : 'Slotwise could not export audit logs.',
    };
  }

  return { success: true, csv: await response.text() };
}
