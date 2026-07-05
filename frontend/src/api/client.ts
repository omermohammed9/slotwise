import type { ApiResponse, QueryParams } from '@/api/types';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  query?: QueryParams;
  token?: string | null;
};

export const COOKIE_SESSION_TOKEN = '__slotwise_cookie_session__';
const CSRF_COOKIE_NAME = import.meta.env.VITE_SLOTWISE_CSRF_COOKIE_NAME ?? 'slotwise_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const unsafeMethods = new Set(['DELETE', 'PATCH', 'POST', 'PUT']);

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

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(encodedName));

  return cookie ? decodeURIComponent(cookie.slice(encodedName.length)) : null;
}

function errorCodeForStatus(status: number): 'csrf' | 'forbidden' | 'rate_limited' | 'unauthorized' | 'unknown' {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 419) return 'csrf';
  if (status === 429) return 'rate_limited';
  return 'unknown';
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
  const { body, headers, query, token, ...init } = options;
  const requestHeaders = new Headers(headers);
  const method = (init.method ?? 'GET').toUpperCase();

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token && token !== COOKIE_SESSION_TOKEN) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (unsafeMethods.has(method) && !requestHeaders.has(CSRF_HEADER_NAME)) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      requestHeaders.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${buildApiPath(path, query)}`, {
      ...init,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      headers: {
        ...Object.fromEntries(requestHeaders.entries()),
      },
      method,
    });
  } catch {
    return {
      success: false,
      status: 0,
      error: {
        code: 'network',
        message: 'Unable to reach Slotwise. Check your connection and try again.',
      },
    };
  }

  if (response.status === 204) {
    return { success: true, data: undefined as T };
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (response.status >= 400) {
    return {
      success: false,
      status: response.status,
      error: {
        code: errorCodeForStatus(response.status),
        message: payload?.success === false ? payload.error.message : 'Slotwise could not complete the request.',
      },
    };
  }

  return payload ?? {
    success: false,
    status: response.status,
    error: {
      code: 'unknown',
      message: 'Slotwise returned an empty response.',
    },
  };
}
