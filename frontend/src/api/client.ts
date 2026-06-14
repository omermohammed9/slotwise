import type { ApiResponse, QueryParams } from './types';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  query?: QueryParams;
  token?: string | null;
};

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_SLOTWISE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export function buildApiPath(path: string, query?: QueryParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const search = searchParams.toString();
  return search ? `${path}?${search}` : path;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
  const { body, headers, query, token, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${buildApiPath(path, query)}`, {
    ...init,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...Object.fromEntries(requestHeaders.entries()),
    },
  });

  if (response.status === 204) {
    return { success: true, data: undefined as T };
  }

  return (await response.json()) as ApiResponse<T>;
}
