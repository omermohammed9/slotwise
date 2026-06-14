import { afterEach, expect, vi } from 'vitest';
import { createOperatorSession } from './auth';
import { getBookingSuggestions, listBookings, updateBookingStatus } from './bookings';
import { apiRequest, buildApiPath, getApiBaseUrl } from './client';
import { getPublicWidgetConfig } from './publicSurfaces';

test('uses the local backend as the default API target', () => {
  expect(getApiBaseUrl()).toBe('http://localhost:3000');
});

afterEach(() => {
  vi.restoreAllMocks();
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
  await listBookings({ page: 1, status: 'pending' }, 'operator-token');
  await updateBookingStatus('bk_101', 'approved', { reason: 'Reviewed' }, 'operator-token');

  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    'http://localhost:3000/auth/session',
    expect.objectContaining({ method: 'POST' }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    'http://localhost:3000/bookings?page=1&status=pending',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    3,
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
