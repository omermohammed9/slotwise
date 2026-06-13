const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_SLOTWISE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  return (await response.json()) as ApiResponse<T>;
}
