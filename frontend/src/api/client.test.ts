import { afterEach, expect, vi } from 'vitest';
import { createOperatorSession } from '@/api/auth';
import { getBookingSuggestions, listBookings, updateBookingStatus } from '@/api/bookings';
import { listBusinesses } from '@/api/businesses';
import { apiRequest, buildApiPath, getApiBaseUrl } from '@/api/client';
import { getPublicWidgetConfig } from '@/api/publicSurfaces';

test('uses the local backend as the default API target', () => {
  expect(getApiBaseUrl()).toBe('http://localhost:3000');
});

afterEach(() => {
  vi.restoreAllMocks();
  document.cookie = 'slotwise_csrf=; Max-Age=0; Path=/';
});

test('builds API paths with clean query parameters', () => {
  expect(
    buildApiPath('/bookings', {
      customerName: 'Maya',
      limit: 25,
      page: 2,
      status: undefined,
    }),
  ).toBe('/bookings?customerName=Maya&limit=25&page=2');
});

test('sends JSON bodies and bearer tokens through the shared client', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data: { ok: true } }),
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);

  await apiRequest('/example', {
    body: { name: 'Slotwise' },
    method: 'POST',
    token: 'memory-token',
  });

  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/example',
    expect.objectContaining({
      body: JSON.stringify({ name: 'Slotwise' }),
      method: 'POST',
      headers: expect.objectContaining({
        authorization: 'Bearer memory-token',
        'content-type': 'application/json',
      }),
    }),
  );
});

test('sends CSRF tokens from cookies on unsafe cookie-session requests', async () => {
  document.cookie = 'slotwise_csrf=csrf-cookie-token; Path=/';
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data: { revoked: true } }),
    ok: true,
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);

  await apiRequest('/auth/session', {
    method: 'DELETE',
  });

  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/auth/session',
    expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({
        'x-csrf-token': 'csrf-cookie-token',
      }),
      method: 'DELETE',
    }),
  );
});

test('normalizes CSRF, rate-limit, and network failures', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: { message: 'CSRF token is missing or invalid' } }),
        ok: false,
        status: 419,
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: { message: 'Too many requests. Please try again later.' } }),
        ok: false,
        status: 429,
      })
      .mockRejectedValueOnce(new Error('offline')),
  );

  await expect(apiRequest('/bookings/1', { method: 'PATCH' })).resolves.toEqual({
    success: false,
    status: 419,
    error: {
      code: 'csrf',
      message: 'CSRF token is missing or invalid',
    },
  });
  await expect(apiRequest('/auth/session', { method: 'POST' })).resolves.toEqual({
    success: false,
    status: 429,
    error: {
      code: 'rate_limited',
      message: 'Too many requests. Please try again later.',
    },
  });
  await expect(apiRequest('/auth/session', { method: 'GET' })).resolves.toEqual({
    success: false,
    status: 0,
    error: {
      code: 'network',
      message: 'Unable to reach Slotwise. Check your connection and try again.',
    },
  });
});

test('normalizes unauthorized and forbidden responses', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: { message: 'Authenticated session is required' } }),
        ok: false,
        status: 401,
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: { message: 'Business access is denied' } }),
        ok: false,
        status: 403,
      }),
  );

  await expect(apiRequest('/auth/session')).resolves.toEqual({
    success: false,
    status: 401,
    error: {
      code: 'unauthorized',
      message: 'Authenticated session is required',
    },
  });
  await expect(apiRequest('/admin-only')).resolves.toEqual({
    success: false,
    status: 403,
    error: {
      code: 'forbidden',
      message: 'Business access is denied',
    },
  });
});

test('handles no-content responses without parsing JSON', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: vi.fn(),
    status: 204,
  });
  vi.stubGlobal('fetch', fetchMock);

  await expect(apiRequest<void>('/bookings/bk_101', { method: 'DELETE' })).resolves.toEqual({
    success: true,
    data: undefined,
  });
});

test('wraps operator auth and booking endpoint paths', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data: {} }),
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);

  await createOperatorSession({ username: 'owner', password: 'secret' });
  await listBusinesses('operator-token', { businessId: 'business-1' });
  await listBookings({ page: 1, status: 'pending' }, 'operator-token');
  await updateBookingStatus('bk_101', 'approved', { reason: 'Reviewed' }, 'operator-token');

  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    'http://localhost:3000/auth/session',
    expect.objectContaining({ method: 'POST' }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    'http://localhost:3000/businesses?businessId=business-1',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    3,
    'http://localhost:3000/bookings?page=1&status=pending',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    4,
    'http://localhost:3000/bookings/bk_101/approve',
    expect.objectContaining({ method: 'PATCH' }),
  );
});

test('wraps public and suggestion endpoint paths', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data: [] }),
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);

  await getPublicWidgetConfig('north-studio');
  await getBookingSuggestions({
    startDate: '2030-01-02T00:00:00.000Z',
    endDate: '2030-01-02T00:00:00.000Z',
    timein: '2030-01-02T09:00:00.000Z',
    timeout: '2030-01-02T10:00:00.000Z',
  });

  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    'http://localhost:3000/businesses/public/north-studio/widget',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    'http://localhost:3000/bookings/suggestions',
    expect.objectContaining({ method: 'POST' }),
  );
});
