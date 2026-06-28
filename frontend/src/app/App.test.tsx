import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, vi } from 'vitest';
import { customerSessionStore, sessionStore } from '../auth/sessionStore';
import { App } from './App';

const localStorageMock = (() => {
  let store = new Map<string, string>();

  return {
    clear() {
      store = new Map<string, string>();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    get length() {
      return store.size;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  customerSessionStore.clearNotice();
  customerSessionStore.clearSession();
  sessionStore.clearNotice();
  sessionStore.clearSession();
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
});

function signInForTest() {
  sessionStore.setSession({
    actorId: 'operator-1',
    role: 'owner',
    token: 'memory-token',
  });
}

const dashboardInsightsResponse = {
  success: true,
  data: {
    summary: {
      totalBookings: 42,
      pendingBookings: 7,
      approvedBookings: 18,
      completedBookings: 12,
      cancelledBookings: 3,
      noShowBookings: 1,
      rejectedBookings: 1,
      approvalRate: 73,
      completionRate: 29,
      conversionRate: 29,
      utilizationMinutes: 540,
      averagePartySize: 2.5,
    },
    funnel: [
      { status: 'pending', count: 7 },
      { status: 'approved', count: 18 },
      { status: 'completed', count: 12 },
      { status: 'cancelled', count: 3 },
      { status: 'no_show', count: 1 },
      { status: 'rejected', count: 1 },
    ],
    utilization: {
      byWeekday: [
        { weekday: 'Sunday', bookings: 0, bookedMinutes: 0 },
        { weekday: 'Monday', bookings: 9, bookedMinutes: 240 },
        { weekday: 'Tuesday', bookings: 4, bookedMinutes: 120 },
      ],
      byResource: [
        { resourceId: 'room_2', bookings: 8, bookedMinutes: 360 },
        { resourceId: 'room_3', bookings: 3, bookedMinutes: 180 },
      ],
    },
    peaks: {
      busiestWeekday: 'Monday',
      busiestHour: '09:00',
      topTimeSlots: [
        { label: '09:00', bookings: 6 },
        { label: '11:00', bookings: 3 },
      ],
    },
  },
};

const cancellationInsightsResponse = {
  success: true,
  data: {
    summary: {
      totalBookings: 42,
      cancelledBookings: 3,
      noShowBookings: 1,
      completedBookings: 12,
      cancellationRate: 7,
      noShowRate: 2,
      serviceDeliveryRate: 29,
    },
    trends: {
      cancellationReasons: [{ reason: 'Travel delay', count: 2 }],
      noShowReasons: [{ reason: 'Forgot appointment', count: 1 }],
      byWeekday: [
        { weekday: 'Sunday', cancellations: 0, noShows: 0 },
        { weekday: 'Monday', cancellations: 2, noShows: 1 },
      ],
    },
  },
};

test('renders query-backed dashboard analytics', async () => {
  const fetchMock = vi.fn((url: string) => Promise.resolve({
    json: () => Promise.resolve(
      url.includes('/bookings/insights/cancellation-no-show')
        ? cancellationInsightsResponse
        : dashboardInsightsResponse,
    ),
    status: 200,
  }));
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin');
  renderApp();

  expect(screen.getByRole('heading', { name: /today at a glance/i })).toBeInTheDocument();
  expect(await screen.findByText(/total bookings/i)).toBeInTheDocument();
  expect(screen.getByText('42')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /booking funnel/i })).toBeInTheDocument();
  expect(screen.getByText(/peak booking times/i)).toBeInTheDocument();
  expect(screen.getByText(/room_2/i)).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: /cancellation and no-show insights/i })).toBeInTheDocument();
  expect(screen.getByText(/travel delay/i)).toBeInTheDocument();
  expect(screen.getByText(/forgot appointment/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /approved storage baseline/i })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings/insights/dashboard',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings/insights/cancellation-no-show',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('renders and saves business settings', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/businesses/templates/clinic')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              key: 'clinic',
              label: 'Clinic Appointments',
              description: 'Structured appointment slots.',
              availabilityRules: {
                slotIntervalMinutes: 30,
                minAdvanceMinutes: 120,
              },
              suggestedResources: [
                {
                  name: 'Consultation Rooms',
                  resourceType: 'room',
                  capacity: 1,
                },
              ],
            },
          }),
        status: 200,
      });
    }

    if (url.endsWith('/businesses/templates')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                key: 'clinic',
                label: 'Clinic Appointments',
                description: 'Structured appointment slots.',
              },
            ],
          }),
        status: 200,
      });
    }

    if (url.includes('/businesses/biz_101') && init?.method === 'PATCH') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'biz_101',
              blackoutDates: [
                {
                  endDate: '2030-12-24T23:59:59.999Z',
                  reason: 'Holiday closure',
                  startDate: '2030-12-24T00:00:00.000Z',
                },
              ],
              businessType: 'clinic',
              contactEmail: 'frontdesk@example.com',
              contactPhone: '+15550001111',
              name: 'North Clinic',
              slug: 'north-clinic',
              status: 'active',
              timezone: 'America/New_York',
              workingHours: [{ dayOfWeek: 1, startTime: '10:00', endTime: '18:00', closed: false }],
            },
          }),
        status: 200,
      });
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'biz_101',
              availabilityRules: { slotIntervalMinutes: 30 },
              blackoutDates: [],
              businessType: 'clinic',
              contactEmail: 'hello@example.com',
              contactPhone: '+15550001111',
              name: 'North Clinic',
              publicPageSettings: { enabled: true },
              slug: 'north-clinic',
              status: 'active',
              templateKey: 'clinic',
              timezone: 'America/New_York',
              widgetSettings: { enabled: true },
              workingHours: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
            },
          ],
        }),
      status: 200,
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/settings');

  renderApp();

  expect(await screen.findByRole('heading', { name: /^settings$/i })).toBeInTheDocument();
  expect(await screen.findByDisplayValue('North Clinic')).toBeInTheDocument();
  expect(screen.getByText(/operating setup/i)).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: /business template gallery/i })).toBeInTheDocument();
  expect(await screen.findByText(/structured appointment slots/i)).toBeInTheDocument();
  expect(screen.getByText(/consultation rooms/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /working hours/i })).toBeInTheDocument();

  await user.clear(screen.getByLabelText(/^email$/i));
  await user.type(screen.getByLabelText(/^email$/i), 'frontdesk@example.com');
  await user.click(screen.getByRole('button', { name: /add blackout range/i }));
  await user.type(screen.getByLabelText(/^reason$/i), 'Holiday closure');
  fireEvent.change(screen.getByLabelText(/^start date$/i), { target: { value: '2030-12-24' } });
  fireEvent.change(screen.getByLabelText(/^end date$/i), { target: { value: '2030-12-24' } });
  fireEvent.change(screen.getAllByLabelText(/^start$/i)[1], { target: { value: '10:00' } });
  fireEvent.change(screen.getAllByLabelText(/^end$/i)[1], { target: { value: '18:00' } });
  await user.click(screen.getByRole('button', { name: /save settings/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/businesses/biz_101',
      expect.objectContaining({
        body: expect.stringContaining('frontdesk@example.com'),
        method: 'PATCH',
      }),
    );
  });
  const updateCall = fetchMock.mock.calls.find(
    ([url, init]) => url === 'http://localhost:3000/businesses/biz_101' && init?.method === 'PATCH',
  );
  const updateBody = JSON.parse(String(updateCall?.[1]?.body));
  expect(updateBody.blackoutDates[0].reason).toBe('Holiday closure');
  expect(updateBody.workingHours).toEqual(
    expect.arrayContaining([{ dayOfWeek: 1, startTime: '10:00', endTime: '18:00', closed: false }]),
  );
  expect(await screen.findByText(/settings saved/i)).toBeInTheDocument();
});

test('renders customer management with create, edit, and booking history flows', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/businesses')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                _id: 'biz_101',
                businessType: 'clinic',
                name: 'North Clinic',
                slug: 'north-clinic',
                timezone: 'America/New_York',
              },
            ],
          }),
        status: 200,
      });
    }

    if (url.endsWith('/customers') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'cus_202',
              businessId: 'biz_101',
              email: 'nina@example.com',
              firstName: 'Nina',
              lastName: 'Cole',
              phone: '+15550002222',
              preferredNotificationChannels: ['email', 'sms'],
              totalBookings: 0,
            },
          }),
        status: 201,
      });
    }

    if (url.includes('/customers/cus_101') && init?.method === 'PATCH') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'cus_101',
              businessId: 'biz_101',
              email: 'maya@example.com',
              firstName: 'Maya',
              lastName: 'Stone',
              notes: 'VIP seating',
              phone: '+15551234567',
              preferredNotificationChannels: ['email'],
              totalBookings: 3,
              updatedAt: '2030-01-01T00:00:00.000Z',
            },
          }),
        status: 200,
      });
    }

    if (url.includes('/customers/cus_101')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'cus_101',
              businessId: 'biz_101',
              firstName: 'Maya',
              lastName: 'Carter',
              email: 'maya@example.com',
              notes: 'Window seat preferred',
              phone: '+15551234567',
              preferredNotificationChannels: ['email'],
              totalBookings: 3,
              updatedAt: '2030-01-01T00:00:00.000Z',
            },
          }),
        status: 200,
      });
    }

    if (url.includes('/bookings')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                _id: 'bk_901',
                customerId: 'cus_101',
                fName: 'Maya',
                lName: 'Carter',
                email: 'maya@example.com',
                phone: '+15551234567',
                startDate: '2030-01-02T00:00:00.000Z',
                endDate: '2030-01-02T00:00:00.000Z',
                timein: '2030-01-02T09:00:00.000Z',
                timeout: '2030-01-02T10:00:00.000Z',
                status: 'approved',
                serviceResourceId: 'room_2',
              },
            ],
          }),
        status: 200,
      });
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'cus_101',
              businessId: 'biz_101',
              firstName: 'Maya',
              lastName: 'Carter',
              email: 'maya@example.com',
              phone: '+15551234567',
              totalBookings: 3,
            },
          ],
        }),
      status: 200,
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/customers');

  renderApp();

  expect(await screen.findByRole('heading', { name: /^customers$/i })).toBeInTheDocument();
  expect(await screen.findByText(/maya carter/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /new customer/i })).toBeInTheDocument();

  await user.selectOptions(screen.getAllByLabelText(/^business$/i)[1], 'biz_101');
  await user.type(screen.getByLabelText(/^first name$/i), 'Nina');
  await user.type(screen.getByLabelText(/^last name$/i), 'Cole');
  await user.type(screen.getAllByLabelText(/^email$/i)[1], 'nina@example.com');
  await user.type(screen.getAllByLabelText(/^phone$/i)[1], '+15550002222');
  await user.click(screen.getByRole('checkbox', { name: /^sms$/i }));
  await user.click(screen.getByRole('button', { name: /create customer/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/customers',
      expect.objectContaining({
        body: expect.stringContaining('"firstName":"Nina"'),
        method: 'POST',
      }),
    );
  });
  expect(await screen.findByText(/customer created/i)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/^name$/i), 'Maya');
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/customers?customerName=Maya',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  await user.click(screen.getByRole('button', { name: /maya carter/i }));

  expect(within(screen.getAllByLabelText(/customer profile/i)[0]).getAllByText(/north clinic/i).length).toBeGreaterThan(0);
  expect(await screen.findByText(/room_2/i)).toBeInTheDocument();
  expect(screen.getByText(/approved/i)).toBeInTheDocument();
  await user.clear(screen.getAllByLabelText(/^last name$/i)[1]);
  await user.type(screen.getAllByLabelText(/^last name$/i)[1], 'Stone');
  await user.clear(screen.getAllByLabelText(/^notes$/i)[1]);
  await user.type(screen.getAllByLabelText(/^notes$/i)[1], 'VIP seating');
  await user.click(screen.getByRole('button', { name: /save customer/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/customers/cus_101',
      expect.objectContaining({
        body: expect.stringContaining('"lastName":"Stone"'),
        method: 'PATCH',
      }),
    );
  });
  expect(await screen.findByText(/customer updated/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings?customerId=cus_101&email=maya%40example.com&phone=%2B15551234567&limit=5&sortBy=startDate&sortOrder=desc',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('renders resources with create and edit-drawer override flows', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/businesses')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                _id: 'biz_101',
                businessType: 'clinic',
                name: 'North Clinic',
                slug: 'north-clinic',
                timezone: 'America/New_York',
              },
            ],
          }),
        status: 200,
      });
    }

    if (url.endsWith('/service-resources') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'res_202',
              active: true,
              businessId: 'biz_101',
              capacity: 1,
              name: 'Consultation',
              resourceType: 'service',
            },
          }),
        status: 201,
      });
    }

    if (url.endsWith('/service-resources/res_101') && init?.method === 'GET') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'res_101',
              active: true,
              availabilityOverrides: {
                allowOverbooking: false,
                blackoutDates: [],
                slotIntervalMinutes: 15,
                workingHours: [{ dayOfWeek: 2, startTime: '08:00', endTime: '12:00', closed: false }],
              },
              businessId: 'biz_101',
              capacity: 4,
              durationMinutes: 45,
              name: 'Room A',
              resourceType: 'room',
              supportedRoles: ['staff'],
            },
          }),
        status: 200,
      });
    }

    if (url.includes('/service-resources/res_101') && init?.method === 'PATCH') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'res_101',
              active: true,
              availabilityOverrides: {
                allowOverbooking: true,
                blackoutDates: [
                  {
                    endDate: '2030-02-10T23:59:59.999Z',
                    reason: 'Deep clean',
                    startDate: '2030-02-10T00:00:00.000Z',
                  },
                ],
                slotIntervalMinutes: 20,
                workingHours: [{ dayOfWeek: 2, startTime: '08:00', endTime: '12:00', closed: false }],
              },
              businessId: 'biz_101',
              capacity: 4,
              name: 'Room A',
              resourceType: 'room',
            },
          }),
        status: 200,
      });
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'res_101',
              active: true,
              businessId: 'biz_101',
              capacity: 4,
              durationMinutes: 45,
              name: 'Room A',
              resourceType: 'room',
            },
          ],
        }),
      status: 200,
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/resources');

  renderApp();

  expect(await screen.findByRole('heading', { name: /^resources$/i })).toBeInTheDocument();
  expect(await screen.findByText(/room a/i)).toBeInTheDocument();

  await user.selectOptions(screen.getAllByLabelText(/^business$/i)[1], 'biz_101');
  await user.type(screen.getByLabelText(/^name$/i), 'Consultation');
  await user.click(screen.getByRole('button', { name: /create resource/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/service-resources',
      expect.objectContaining({
        body: expect.stringContaining('"name":"Consultation"'),
        method: 'POST',
      }),
    );
  });
  expect(await screen.findByText(/resource created/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /^edit$/i }));
  const resourceDialog = await screen.findByRole('dialog');
  expect(within(resourceDialog).getByRole('heading', { name: /room a/i })).toBeInTheDocument();
  await user.clear(within(resourceDialog).getByLabelText(/slot interval \(minutes\)/i));
  await user.type(within(resourceDialog).getByLabelText(/slot interval \(minutes\)/i), '20');
  await user.selectOptions(within(resourceDialog).getByLabelText(/overbooking/i), 'true');
  await user.click(within(resourceDialog).getByRole('button', { name: /add blackout override/i }));
  await user.type(within(resourceDialog).getByLabelText(/^reason$/i), 'Deep clean');
  fireEvent.change(within(resourceDialog).getByLabelText(/^start date$/i), { target: { value: '2030-02-10' } });
  fireEvent.change(within(resourceDialog).getByLabelText(/^end date$/i), { target: { value: '2030-02-10' } });
  await user.click(within(resourceDialog).getByRole('button', { name: /save resource/i }));
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/service-resources/res_101',
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
  });
  const updateCall = fetchMock.mock.calls.find(
    ([url, init]) => url === 'http://localhost:3000/service-resources/res_101' && init?.method === 'PATCH',
  );
  const updateBody = JSON.parse(String(updateCall?.[1]?.body));
  expect(updateBody.availabilityOverrides.slotIntervalMinutes).toBe(20);
  expect(updateBody.availabilityOverrides.allowOverbooking).toBe(true);
  expect(updateBody.availabilityOverrides.blackoutDates[0].reason).toBe('Deep clean');
  expect(await screen.findByText(/resource changes saved/i)).toBeInTheDocument();
});

test('navigates through the admin route map', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        success: true,
        data: [],
        meta: {
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          sort: { sortBy: 'createdAt', sortOrder: 'desc' },
        },
      }),
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin');
  renderApp();

  await user.click(screen.getByRole('link', { name: /bookings/i }));

  expect(screen.getByRole('heading', { name: /^bookings$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /bookings/i })).toHaveAttribute('aria-current', 'page');
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings?limit=10&page=1&sortBy=createdAt&sortOrder=desc',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

test('renders the backend timeline feed with filters', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        success: true,
        data: [
          {
            date: '2030-05-03',
            summary: {
              totalBookings: 2,
              pendingBookings: 1,
              approvedBookings: 1,
              completedBookings: 0,
              cancelledBookings: 0,
              noShowBookings: 0,
              highRiskBookings: 1,
            },
            bookings: [
              {
                id: 'bk_t1',
                customerName: 'Maya Carter',
                startDate: '2030-05-03T00:00:00.000Z',
                endDate: '2030-05-03T00:00:00.000Z',
                timein: '2030-05-03T09:00:00.000Z',
                timeout: '2030-05-03T10:00:00.000Z',
                status: 'pending',
                serviceResourceId: 'room_2',
                durationMinutes: 60,
                isRescheduled: true,
                conflictRisk: {
                  evaluatedAt: '2030-05-02T00:00:00.000Z',
                  level: 'high',
                  score: 82,
                  signals: ['tight turnaround'],
                  summary: 'One risk signal',
                },
              },
              {
                id: 'bk_t2',
                customerName: 'Noah Rivera',
                startDate: '2030-05-03T00:00:00.000Z',
                endDate: '2030-05-03T00:00:00.000Z',
                timein: '2030-05-03T11:00:00.000Z',
                timeout: '2030-05-03T12:30:00.000Z',
                status: 'approved',
                serviceResourceId: 'room_3',
                durationMinutes: 90,
                isRescheduled: false,
              },
            ],
          },
        ],
      }),
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin');
  renderApp();

  await user.click(screen.getByRole('link', { name: /timeline/i }));

  expect(await screen.findByRole('heading', { name: /^timeline$/i })).toBeInTheDocument();
  expect(screen.getByText(/maya carter/i)).toBeInTheDocument();
  expect(screen.getByText(/noah rivera/i)).toBeInTheDocument();
  expect(screen.getByText(/high risk/i)).toBeInTheDocument();
  expect(screen.getByText(/rescheduled/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings/timeline',
    expect.objectContaining({ method: 'GET' }),
  );

  await user.selectOptions(screen.getByLabelText(/status/i), 'approved');

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings/timeline?status=approved',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

test('renders backend bookings with filters and pagination controls', async () => {
  const user = userEvent.setup();
  const listResponse = {
    success: true,
    data: [
      {
        _id: 'bk_201',
        fName: 'Maya',
        lName: 'Carter',
        email: 'maya@example.com',
        phone: '+15551234567',
        startDate: '2030-01-02T00:00:00.000Z',
        endDate: '2030-01-02T00:00:00.000Z',
        timein: '2030-01-02T09:00:00.000Z',
        timeout: '2030-01-02T10:00:00.000Z',
        status: 'pending',
        conflictRisk: {
          evaluatedAt: '2030-01-01T00:00:00.000Z',
          level: 'high',
          score: 85,
          signals: ['overlap'],
          summary: 'Possible overlap',
        },
      },
    ],
    meta: {
      pagination: { page: 1, limit: 10, total: 11, totalPages: 2 },
      sort: { sortBy: 'createdAt', sortOrder: 'desc' },
    },
  };
  const detailResponse = {
    success: true,
    data: {
      ...listResponse.data[0],
      businessId: 'biz_101',
      customerId: 'cus_101',
      notes: 'Needs a quiet room.',
      partySize: 3,
      serviceResourceId: 'room_2',
      statusHistory: [
        {
          changedAt: '2030-01-01T08:00:00.000Z',
          changedByRole: 'owner',
          reason: 'Initial review',
          toStatus: 'pending',
        },
      ],
    },
  };
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve({
      json: () =>
        Promise.resolve(
          url.includes('/bookings/bk_201')
            ? detailResponse
            : listResponse,
        ),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings');

  renderApp();

  expect(await screen.findByRole('heading', { name: /maya carter/i })).toBeInTheDocument();
  expect(screen.getByText(/high risk/i)).toBeInTheDocument();
  expect(screen.getByText(/11 total/i)).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText(/status/i), 'pending');
  await waitFor(() => {
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('status=pending'),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

test('hydrates bookings filters and pagination from URL search params', async () => {
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'bk_211',
              fName: 'Ari',
              lName: 'Park',
              email: 'ari@example.com',
              phone: '+15551112222',
              startDate: '2030-01-06T00:00:00.000Z',
              endDate: '2030-01-06T00:00:00.000Z',
              timein: '2030-01-06T13:00:00.000Z',
              timeout: '2030-01-06T14:00:00.000Z',
              status: 'approved',
            },
          ],
          meta: {
            pagination: { page: 2, limit: 10, total: 12, totalPages: 2 },
          },
        }),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings?customerName=Ari%20Park&status=approved&risk=high&page=2&sortBy=startDate&sortOrder=asc');

  renderApp();

  expect(await screen.findByDisplayValue('Ari Park')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /^status$/i })).toHaveValue('approved');
  expect(screen.getByRole('combobox', { name: /^risk$/i })).toHaveValue('high');
  expect(screen.getByRole('combobox', { name: /^sort$/i })).toHaveValue('startDate');
  expect(screen.getByRole('button', { name: /^ascending$/i })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings?customerName=Ari+Park&conflictRiskLevel=high&status=approved&limit=10&page=2&sortBy=startDate&sortOrder=asc',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('persists bookings filters in the URL and resets page on filter changes', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'bk_212',
              fName: 'Nina',
              lName: 'Cole',
              email: 'nina@example.com',
              phone: '+15553334444',
              startDate: '2030-01-08T00:00:00.000Z',
              endDate: '2030-01-08T00:00:00.000Z',
              timein: '2030-01-08T15:00:00.000Z',
              timeout: '2030-01-08T16:00:00.000Z',
              status: 'pending',
            },
          ],
          meta: {
            pagination: { page: 2, limit: 10, total: 30, totalPages: 3 },
          },
        }),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings?page=2');

  renderApp();

  expect(await screen.findByRole('heading', { name: /nina cole/i })).toBeInTheDocument();
  expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/customer/i), 'Nina');
  await waitFor(() => {
    expect(window.location.search).toBe('?customerName=Nina');
  });
  await waitFor(() => {
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:3000/bookings?customerName=Nina&limit=10&page=1&sortBy=createdAt&sortOrder=desc',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  await user.selectOptions(screen.getByLabelText(/risk/i), 'medium');
  await waitFor(() => {
    expect(window.location.search).toBe('?customerName=Nina&risk=medium');
  });

  await user.selectOptions(screen.getByLabelText(/sort/i), 'status');
  await waitFor(() => {
    expect(window.location.search).toBe('?customerName=Nina&risk=medium&sortBy=status');
  });

  await user.click(screen.getByRole('button', { name: /^descending$/i }));
  await waitFor(() => {
    expect(window.location.search).toBe('?customerName=Nina&risk=medium&sortBy=status&sortOrder=asc');
  });

  await user.click(screen.getByRole('button', { name: /next page/i }));
  await waitFor(() => {
    expect(window.location.search).toBe('?customerName=Nina&risk=medium&sortBy=status&sortOrder=asc&page=2');
  });
});

test('saves the current bookings view to browser storage', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'bk_213',
              fName: 'Ari',
              lName: 'Park',
              email: 'ari@example.com',
              phone: '+15551112222',
              startDate: '2030-01-06T00:00:00.000Z',
              endDate: '2030-01-06T00:00:00.000Z',
              timein: '2030-01-06T13:00:00.000Z',
              timeout: '2030-01-06T14:00:00.000Z',
              status: 'approved',
            },
          ],
          meta: {
            pagination: { page: 2, limit: 10, total: 12, totalPages: 2 },
          },
        }),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings?customerName=Ari%20Park&status=approved&risk=high&page=2&sortBy=startDate&sortOrder=asc');

  renderApp();

  expect(await screen.findByRole('heading', { name: /ari park/i })).toBeInTheDocument();

  await user.type(screen.getByLabelText(/view name/i), 'High priority approvals');
  await user.click(screen.getByRole('button', { name: /save current view/i }));

  expect(await screen.findByText(/saved view created/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'High priority approvals' })).toHaveAttribute('aria-pressed', 'true');

  expect(JSON.parse(window.localStorage.getItem('slotwise.admin.bookings.saved-views') ?? '[]')).toEqual([
    expect.objectContaining({
      name: 'High priority approvals',
      state: {
        customerName: 'Ari Park',
        page: 2,
        risk: 'high',
        sortBy: 'startDate',
        sortOrder: 'asc',
        status: 'approved',
      },
    }),
  ]);
});

test('applies and removes saved bookings views from browser storage', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'bk_214',
              fName: 'Maya',
              lName: 'Carter',
              email: 'maya@example.com',
              phone: '+15551234567',
              startDate: '2030-01-02T00:00:00.000Z',
              endDate: '2030-01-02T00:00:00.000Z',
              timein: '2030-01-02T09:00:00.000Z',
              timeout: '2030-01-02T10:00:00.000Z',
              status: 'pending',
            },
          ],
          meta: {
            pagination: { page: 1, limit: 10, total: 11, totalPages: 2 },
          },
        }),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  window.localStorage.setItem(
    'slotwise.admin.bookings.saved-views',
    JSON.stringify([
      {
        id: 'view-1',
        name: 'High priority approvals',
        state: {
          customerName: 'Ari Park',
          page: 2,
          risk: 'high',
          sortBy: 'startDate',
          sortOrder: 'asc',
          status: 'approved',
        },
      },
    ]),
  );
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings');

  renderApp();

  expect(await screen.findByRole('button', { name: 'High priority approvals' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'High priority approvals' }));
  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect(params.get('customerName')).toBe('Ari Park');
    expect(params.get('status')).toBe('approved');
    expect(params.get('risk')).toBe('high');
    expect(params.get('page')).toBe('2');
    expect(params.get('sortBy')).toBe('startDate');
    expect(params.get('sortOrder')).toBe('asc');
  });
  await waitFor(() => {
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:3000/bookings?customerName=Ari+Park&conflictRiskLevel=high&status=approved&limit=10&page=2&sortBy=startDate&sortOrder=asc',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  await user.click(screen.getByRole('button', { name: /remove high priority approvals saved view/i }));

  await waitFor(() => {
    expect(screen.queryByRole('button', { name: 'High priority approvals' })).not.toBeInTheDocument();
  });
  expect(window.localStorage.getItem('slotwise.admin.bookings.saved-views')).toBe('[]');
});

test('shows removable active booking filter chips and updates URL state when one is cleared', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'bk_215',
              fName: 'Ari',
              lName: 'Park',
              email: 'ari@example.com',
              phone: '+15551112222',
              startDate: '2030-01-06T00:00:00.000Z',
              endDate: '2030-01-06T00:00:00.000Z',
              timein: '2030-01-06T13:00:00.000Z',
              timeout: '2030-01-06T14:00:00.000Z',
              status: 'approved',
            },
          ],
          meta: {
            pagination: { page: 2, limit: 10, total: 12, totalPages: 2 },
          },
        }),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings?customerName=Ari%20Park&status=approved&risk=high&page=2&sortBy=startDate&sortOrder=asc');

  renderApp();

  expect(await screen.findByRole('button', { name: /remove customer: ari park/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /remove status: approved/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /remove risk: high/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /remove sort: start date ascending/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /remove page: 2/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /remove status: approved/i }));

  await waitFor(() => {
    expect(window.location.search).toBe('?customerName=Ari+Park&risk=high&sortBy=startDate&sortOrder=asc');
  });
  await waitFor(() => {
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:3000/bookings?customerName=Ari+Park&conflictRiskLevel=high&limit=10&page=1&sortBy=startDate&sortOrder=asc',
      expect.objectContaining({ method: 'GET' }),
    );
  });
  expect(screen.queryByRole('button', { name: /remove status: approved/i })).not.toBeInTheDocument();
});

test('clears all active booking filters back to the default clean URL and saved views still reapply', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              _id: 'bk_216',
              fName: 'Maya',
              lName: 'Carter',
              email: 'maya@example.com',
              phone: '+15551234567',
              startDate: '2030-01-02T00:00:00.000Z',
              endDate: '2030-01-02T00:00:00.000Z',
              timein: '2030-01-02T09:00:00.000Z',
              timeout: '2030-01-02T10:00:00.000Z',
              status: 'pending',
            },
          ],
          meta: {
            pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
          },
        }),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  window.localStorage.setItem(
    'slotwise.admin.bookings.saved-views',
    JSON.stringify([
      {
        id: 'view-2',
        name: 'High priority approvals',
        state: {
          customerName: 'Ari Park',
          page: 2,
          risk: 'high',
          sortBy: 'startDate',
          sortOrder: 'asc',
          status: 'approved',
        },
      },
    ]),
  );
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings?customerName=Ari%20Park&status=approved&risk=high&page=2&sortBy=startDate&sortOrder=asc');

  renderApp();

  expect(await screen.findByRole('button', { name: /clear all/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /clear all/i }));

  await waitFor(() => {
    expect(window.location.search).toBe('');
  });
  await waitFor(() => {
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:3000/bookings?limit=10&page=1&sortBy=createdAt&sortOrder=desc',
      expect.objectContaining({ method: 'GET' }),
    );
  });
  expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'High priority approvals' }));

  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect(params.get('customerName')).toBe('Ari Park');
    expect(params.get('status')).toBe('approved');
    expect(params.get('risk')).toBe('high');
    expect(params.get('page')).toBe('2');
    expect(params.get('sortBy')).toBe('startDate');
    expect(params.get('sortOrder')).toBe('asc');
  });
});

test('opens a booking detail panel from the bookings list', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve({
      json: () =>
        Promise.resolve(
          url.includes('/bookings/bk_201')
            ? {
                success: true,
                data: {
                  _id: 'bk_201',
                  businessId: 'biz_101',
                  customerId: 'cus_101',
                  fName: 'Maya',
                  lName: 'Carter',
                  email: 'maya@example.com',
                  phone: '+15551234567',
                  startDate: '2030-01-02T00:00:00.000Z',
                  endDate: '2030-01-02T00:00:00.000Z',
                  timein: '2030-01-02T09:00:00.000Z',
                  timeout: '2030-01-02T10:00:00.000Z',
                  status: 'pending',
                  notes: 'Needs a quiet room.',
                  partySize: 3,
                  serviceResourceId: 'room_2',
                  conflictRisk: {
                    evaluatedAt: '2030-01-01T00:00:00.000Z',
                    level: 'high',
                    score: 85,
                    signals: ['tight turnaround'],
                    summary: 'Possible overlap',
                  },
                  statusHistory: [
                    {
                      changedAt: '2030-01-01T08:00:00.000Z',
                      changedByRole: 'owner',
                      reason: 'Initial review',
                      toStatus: 'pending',
                    },
                  ],
                },
              }
            : {
                success: true,
                data: [
                  {
                    _id: 'bk_201',
                    fName: 'Maya',
                    lName: 'Carter',
                    email: 'maya@example.com',
                    phone: '+15551234567',
                    startDate: '2030-01-02T00:00:00.000Z',
                    endDate: '2030-01-02T00:00:00.000Z',
                    timein: '2030-01-02T09:00:00.000Z',
                    timeout: '2030-01-02T10:00:00.000Z',
                    status: 'pending',
                  },
                ],
                meta: {
                  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
                },
              },
        ),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings');

  renderApp();

  await user.click(await screen.findByRole('button', { name: /view details/i }));

  expect(await screen.findByRole('heading', { level: 2, name: /maya carter/i })).toBeInTheDocument();
  expect(screen.getByText(/needs a quiet room/i)).toBeInTheDocument();
  expect(screen.getByText(/tight turnaround/i)).toBeInTheDocument();
  expect(screen.getByText(/initial review/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings/bk_201',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('confirms and applies booking lifecycle actions from detail', async () => {
  const user = userEvent.setup();
  const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
  let detailStatus = 'pending';
  const baseBooking = {
    _id: 'bk_301',
    businessId: 'biz_101',
    customerId: 'cus_301',
    fName: 'Noah',
    lName: 'Rivera',
    email: 'noah@example.com',
    phone: '+15557654321',
    startDate: '2030-02-02T00:00:00.000Z',
    endDate: '2030-02-02T00:00:00.000Z',
    timein: '2030-02-02T09:00:00.000Z',
    timeout: '2030-02-02T10:00:00.000Z',
    partySize: 2,
    serviceResourceId: 'room_3',
  };
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.includes('/bookings/bk_301/approve') && init?.method === 'PATCH') {
      detailStatus = 'approved';
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              ...baseBooking,
              status: detailStatus,
              statusHistory: [
                {
                  changedAt: '2030-02-01T09:00:00.000Z',
                  changedByRole: 'owner',
                  toStatus: 'approved',
                },
              ],
            },
          }),
        status: 200,
      });
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve(
          url.includes('/bookings/bk_301')
            ? {
                success: true,
                data: {
                  ...baseBooking,
                  status: detailStatus,
                  statusHistory: [
                    {
                      changedAt: '2030-02-01T08:00:00.000Z',
                      changedByRole: 'system',
                      toStatus: detailStatus,
                    },
                  ],
                },
              }
            : {
                success: true,
                data: [
                  {
                    ...baseBooking,
                    status: detailStatus,
                  },
                ],
                meta: {
                  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
                },
              },
        ),
      status: 200,
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings');

  renderApp();

  await user.click(await screen.findByRole('button', { name: /view details/i }));
  await user.click(await screen.findByRole('button', { name: /approve/i }));

  expect(confirmMock).toHaveBeenCalledWith('Approve this booking?');
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings/bk_301/approve',
      expect.objectContaining({
        body: '{}',
        method: 'PATCH',
      }),
    );
  });
  expect(await screen.findByRole('button', { name: /no-show/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^approve$/i })).not.toBeInTheDocument();
});

test('limits booking lifecycle actions by operator role', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve({
      json: () =>
        Promise.resolve(
          url.includes('/bookings/bk_401')
            ? {
                success: true,
                data: {
                  _id: 'bk_401',
                  businessId: 'biz_101',
                  customerId: 'cus_401',
                  fName: 'Iris',
                  lName: 'Lane',
                  email: 'iris@example.com',
                  phone: '+15550001111',
                  startDate: '2030-03-02T00:00:00.000Z',
                  endDate: '2030-03-02T00:00:00.000Z',
                  timein: '2030-03-02T09:00:00.000Z',
                  timeout: '2030-03-02T10:00:00.000Z',
                  status: 'pending',
                },
              }
            : {
                success: true,
                data: [
                  {
                    _id: 'bk_401',
                    fName: 'Iris',
                    lName: 'Lane',
                    email: 'iris@example.com',
                    phone: '+15550001111',
                    startDate: '2030-03-02T00:00:00.000Z',
                    endDate: '2030-03-02T00:00:00.000Z',
                    timein: '2030-03-02T09:00:00.000Z',
                    timeout: '2030-03-02T10:00:00.000Z',
                    status: 'pending',
                  },
                ],
                meta: {
                  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
                },
              },
        ),
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  sessionStore.setSession({
    actorId: 'staff-1',
    role: 'staff',
    token: 'staff-token',
  });
  window.history.pushState({}, '', '/admin/bookings');

  renderApp();

  await user.click(await screen.findByRole('button', { name: /view details/i }));

  expect(await screen.findByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^approve$/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
});

test('finds suggestions and reschedules from booking detail', async () => {
  const user = userEvent.setup();
  const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
  const baseBooking = {
    _id: 'bk_501',
    businessId: 'biz_101',
    customerId: 'cus_501',
    fName: 'Leah',
    lName: 'Stone',
    email: 'leah@example.com',
    phone: '+15558889999',
    startDate: '2030-04-02T00:00:00.000Z',
    endDate: '2030-04-02T00:00:00.000Z',
    timein: '2030-04-02T09:00:00.000Z',
    timeout: '2030-04-02T10:00:00.000Z',
    partySize: 4,
    serviceResourceId: 'room_5',
    status: 'approved',
  };
  const suggestedSlot = {
    startDate: '2030-04-03T00:00:00.000Z',
    endDate: '2030-04-03T00:00:00.000Z',
    timein: '2030-04-03T11:00:00.000Z',
    timeout: '2030-04-03T12:00:00.000Z',
    score: 96,
    summary: 'Available one day later.',
  };
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/bookings/suggestions') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [suggestedSlot],
          }),
        status: 200,
      });
    }

    if (url.includes('/bookings/bk_501/reschedule') && init?.method === 'PATCH') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              ...baseBooking,
              ...suggestedSlot,
              statusHistory: [
                {
                  changedAt: '2030-04-01T08:00:00.000Z',
                  changedByRole: 'owner',
                  reason: 'Customer request',
                  toStatus: 'approved',
                },
              ],
            },
          }),
        status: 200,
      });
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve(
          url.includes('/bookings/bk_501')
            ? {
                success: true,
                data: baseBooking,
              }
            : {
                success: true,
                data: [baseBooking],
                meta: {
                  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
                },
              },
        ),
      status: 200,
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin/bookings');

  renderApp();

  await user.click(await screen.findByRole('button', { name: /view details/i }));
  await user.clear(await screen.findByLabelText(/^reason$/i));
  await user.type(screen.getByLabelText(/^reason$/i), 'Customer request');
  await user.click(screen.getByRole('button', { name: /find suggestions/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings/suggestions',
      expect.objectContaining({
        body: expect.stringContaining('"maxSuggestions":3'),
        method: 'POST',
      }),
    );
  });
  expect(await screen.findByText(/available one day later/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /available one day later/i }));
  await user.click(screen.getByRole('button', { name: /^reschedule$/i }));

  expect(confirmMock).toHaveBeenCalledWith('Reschedule this booking?');
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings/bk_501/reschedule',
      expect.objectContaining({
        body: expect.stringContaining('"reason":"Customer request"'),
        method: 'PATCH',
      }),
    );
  });
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings/bk_501/reschedule',
    expect.objectContaining({
      body: expect.stringContaining('"timein":"2030-04-03T11:00:00.000Z"'),
      method: 'PATCH',
    }),
  );
});

test('renders public booking page, checks suggestions, and submits a booking request', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/bookings/suggestions') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                startDate: '2030-06-03T00:00:00.000Z',
                endDate: '2030-06-03T00:00:00.000Z',
                timein: '2030-06-03T11:00:00.000Z',
                timeout: '2030-06-03T12:00:00.000Z',
                score: 94,
                summary: 'Available two hours later.',
              },
            ],
          }),
        status: 200,
      });
    }

    if (url.endsWith('/bookings') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'bk_public_1',
              businessId: '507f1f77bcf86cd799439011',
              fName: 'Ari',
              lName: 'Park',
              email: 'ari@example.com',
              phone: '+15551112222',
              startDate: '2030-06-03T11:00:00.000Z',
              endDate: '2030-06-03T12:00:00.000Z',
              timein: '2030-06-03T11:00:00.000Z',
              timeout: '2030-06-03T12:00:00.000Z',
              status: 'pending',
            },
          }),
        status: 201,
      });
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            businessId: '507f1f77bcf86cd799439011',
            businessType: 'restaurant',
            contactDetails: {
              email: 'hello@demo.test',
              phone: '+15550001111',
            },
            description: 'Reserve a table or private room.',
            name: 'Demo Bistro',
            publicPageSettings: {
              brandColor: '#386fa4',
              enabled: true,
            },
            slug: 'demo-business',
            timezone: 'America/New_York',
            availableResources: [
              {
                id: '507f1f77bcf86cd799439012',
                name: 'Patio Table',
                resourceType: 'table',
                capacity: 4,
                durationMinutes: 60,
              },
            ],
            bookingEndpoints: {
              createBooking: '/bookings',
              suggestions: '/bookings/suggestions',
            },
          },
        }),
      status: 200,
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState({}, '', '/book/demo-business');

  renderApp();

  expect(await screen.findByRole('heading', { name: /demo bistro/i })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /patio table/i }));
  await user.clear(screen.getByLabelText(/^date$/i));
  await user.type(screen.getByLabelText(/^date$/i), '2030-06-03');
  await user.clear(screen.getByLabelText(/^first name$/i));
  await user.type(screen.getByLabelText(/^first name$/i), 'Ari');
  await user.type(screen.getByLabelText(/^last name$/i), 'Park');
  await user.type(screen.getByLabelText(/^email$/i), 'ari@example.com');
  await user.type(screen.getByLabelText(/^phone$/i), '+15551112222');
  await user.click(screen.getByRole('button', { name: /check availability/i }));

  expect(await screen.findByText(/available two hours later/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /available two hours later/i }));
  await user.click(screen.getByRole('button', { name: /request booking/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings',
      expect.objectContaining({
        body: expect.stringContaining('"serviceResourceId":"507f1f77bcf86cd799439012"'),
        method: 'POST',
      }),
    );
  });
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/businesses/public/demo-business/booking-page',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings/suggestions',
    expect.objectContaining({
      body: expect.stringContaining('"maxSuggestions":3'),
      method: 'POST',
    }),
  );
  expect(await screen.findByText(/booking request sent/i)).toBeInTheDocument();
  expect(screen.getByText(/booking reference: bk_public_1/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /track or manage this booking in the portal/i })).toHaveAttribute(
    'href',
    '/portal?businessId=507f1f77bcf86cd799439011&email=ari%40example.com&slug=demo-business&bookingId=bk_public_1',
  );
});

test('renders public booking empty resource state', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        success: true,
        data: {
          businessId: '507f1f77bcf86cd799439011',
          businessType: 'clinic',
          name: 'Solo Clinic',
          publicPageSettings: { enabled: true },
          slug: 'solo-clinic',
          timezone: 'America/New_York',
          availableResources: [],
          bookingEndpoints: {
            createBooking: '/bookings',
            suggestions: '/bookings/suggestions',
          },
        },
      }),
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState({}, '', '/book/solo-clinic');

  renderApp();

  expect(await screen.findByRole('heading', { name: /solo clinic/i })).toBeInTheDocument();
  expect(screen.getByText(/no public resources are listed/i)).toBeInTheDocument();
});

test('prefills the public booking page from widget handoff query params', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        success: true,
        data: {
          businessId: '507f1f77bcf86cd799439011',
          businessType: 'restaurant',
          name: 'Demo Bistro',
          publicPageSettings: { enabled: true },
          slug: 'demo-business',
          timezone: 'America/New_York',
          availableResources: [
            {
              id: '507f1f77bcf86cd799439012',
              name: 'Patio Table',
              resourceType: 'table',
              capacity: 4,
              durationMinutes: 60,
            },
          ],
          bookingEndpoints: {
            createBooking: '/bookings',
            suggestions: '/bookings/suggestions',
          },
        },
      }),
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState(
    {},
    '',
    '/book/demo-business?date=2030-06-07&start=12:30&end=13:30&resourceId=507f1f77bcf86cd799439012&partySize=3&fName=Ari&lName=Park&email=ari%40example.com&phone=%2B15551112222',
  );

  renderApp();

  expect(await screen.findByRole('heading', { name: /demo bistro/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/^date$/i)).toHaveValue('2030-06-07');
  expect(screen.getByLabelText(/^start$/i)).toHaveValue('12:30');
  expect(screen.getByLabelText(/^end$/i)).toHaveValue('13:30');
  expect(screen.getByLabelText(/^party size$/i)).toHaveValue(3);
  expect(screen.getByLabelText(/^first name$/i)).toHaveValue('Ari');
  expect(screen.getByLabelText(/^last name$/i)).toHaveValue('Park');
  expect(screen.getByLabelText(/^email$/i)).toHaveValue('ari@example.com');
  expect(screen.getByLabelText(/^phone$/i)).toHaveValue('+15551112222');
});

test('requests a customer magic link, verifies the token, and cancels a booking from the portal', async () => {
  const user = userEvent.setup();
  const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
  let bookingStatus = 'approved';
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/customer/magic-link') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: { requested: true },
          }),
        status: 202,
      });
    }

    if (url.endsWith('/auth/customer/verify') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              actorId: 'cus_portal_1',
              businessId: '507f1f77bcf86cd799439011',
              email: 'maya@example.com',
              expiresAt: '2030-07-01T00:00:00.000Z',
              role: 'customer',
              token: 'customer-token',
            },
          }),
        status: 201,
      });
    }

    if (url.includes('/bookings/bk_portal_1/customer-cancel') && init?.method === 'POST') {
      bookingStatus = 'cancelled';
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'bk_portal_1',
              businessId: '507f1f77bcf86cd799439011',
              customerId: 'cus_portal_1',
              email: 'maya@example.com',
              endDate: '2030-07-03T00:00:00.000Z',
              fName: 'Maya',
              lName: 'Carter',
              phone: '+15551234567',
              reason: 'Travel delay',
              startDate: '2030-07-03T00:00:00.000Z',
              status: bookingStatus,
              timein: '2030-07-03T09:00:00.000Z',
              timeout: '2030-07-03T10:00:00.000Z',
            },
          }),
        status: 200,
      });
    }

    if (url.includes('/bookings?')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                _id: 'bk_portal_1',
                businessId: '507f1f77bcf86cd799439011',
                customerId: 'cus_portal_1',
                email: 'maya@example.com',
                endDate: '2030-07-03T00:00:00.000Z',
                fName: 'Maya',
                lName: 'Carter',
                notes: 'Window seat preferred.',
                partySize: 2,
                phone: '+15551234567',
                startDate: '2030-07-03T00:00:00.000Z',
                status: bookingStatus,
                statusHistory: [
                  {
                    changedAt: '2030-07-01T09:00:00.000Z',
                    changedByRole: 'customer',
                    reason: 'Travel delay',
                    toStatus: bookingStatus,
                  },
                ],
                timein: '2030-07-03T09:00:00.000Z',
                timeout: '2030-07-03T10:00:00.000Z',
              },
            ],
          }),
        status: 200,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState({}, '', '/portal?businessId=507f1f77bcf86cd799439011&email=maya@example.com');

  renderApp();

  expect(await screen.findByRole('heading', { name: /manage your booking/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /send magic link/i }));
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/auth/customer/magic-link',
      expect.objectContaining({
        body: expect.stringContaining('"businessId":"507f1f77bcf86cd799439011"'),
        method: 'POST',
      }),
    );
  });

  await user.type(screen.getByLabelText(/magic-link token/i), 'portal-token-1');
  await user.click(screen.getByRole('button', { name: /verify token/i }));

  expect(await screen.findByText(/customer session verified/i)).toBeInTheDocument();
  expect(await screen.findByText(/window seat preferred/i)).toBeInTheDocument();
  expect(customerSessionStore.getSnapshot()?.token).toBe('customer-token');
  expect(screen.getByRole('button', { name: /bk_portal_1/i })).toHaveClass('portal-booking-row-selected');

  await user.type(screen.getAllByLabelText(/^reason$/i)[0], 'Travel delay');
  await user.click(screen.getByRole('button', { name: /cancel booking/i }));

  expect(confirmMock).toHaveBeenCalledWith('Cancel this booking?');
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings/bk_portal_1/customer-cancel',
      expect.objectContaining({
        body: expect.stringContaining('"reason":"Travel delay"'),
        method: 'POST',
      }),
    );
  });
  expect(await screen.findByText(/already in a final state/i)).toBeInTheDocument();
  expect(screen.getAllByText(/cancelled/i).length).toBeGreaterThan(0);
});

test('shows client-side portal validation before sending customer auth requests', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState({}, '', '/portal');

  renderApp();

  expect(await screen.findByRole('heading', { name: /manage your booking/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /send magic link/i }));
  expect(await screen.findByText(/enter the business id from your booking confirmation/i)).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();

  await user.type(screen.getByLabelText(/magic-link token/i), '123');
  await user.click(screen.getByRole('button', { name: /verify token/i }));
  expect(await screen.findByText(/paste the full magic-link token/i)).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('keeps operator and customer memory sessions isolated while rescheduling from an auto-verified portal link', async () => {
  const user = userEvent.setup();
  const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
  signInForTest();

  let bookingTime = {
    endDate: '2030-08-04T00:00:00.000Z',
    startDate: '2030-08-04T00:00:00.000Z',
    timein: '2030-08-04T11:00:00.000Z',
    timeout: '2030-08-04T12:00:00.000Z',
  };

  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/customer/verify') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              actorId: 'cus_portal_2',
              businessId: '507f1f77bcf86cd799439099',
              email: 'leah@example.com',
              expiresAt: '2030-08-01T00:00:00.000Z',
              role: 'customer',
              token: 'portal-customer-token',
            },
          }),
        status: 201,
      });
    }

    if (url.includes('/bookings/bk_portal_2/customer-reschedule') && init?.method === 'POST') {
      bookingTime = {
        endDate: '2030-08-05T00:00:00.000Z',
        startDate: '2030-08-05T00:00:00.000Z',
        timein: '2030-08-05T13:00:00.000Z',
        timeout: '2030-08-05T14:30:00.000Z',
      };

      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'bk_portal_2',
              businessId: '507f1f77bcf86cd799439099',
              customerId: 'cus_portal_2',
              email: 'leah@example.com',
              fName: 'Leah',
              lName: 'Stone',
              phone: '+15558889999',
              serviceResourceId: 'room_5',
              status: 'pending',
              ...bookingTime,
            },
          }),
        status: 200,
      });
    }

    if (url.includes('/bookings?')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                _id: 'bk_portal_2',
                businessId: '507f1f77bcf86cd799439099',
                customerId: 'cus_portal_2',
                email: 'leah@example.com',
                fName: 'Leah',
                lName: 'Stone',
                phone: '+15558889999',
                serviceResourceId: 'room_5',
                status: 'pending',
                ...bookingTime,
              },
            ],
          }),
        status: 200,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState(
    {},
    '',
    '/portal?token=portal-token-2&businessId=507f1f77bcf86cd799439099&email=leah@example.com',
  );

  renderApp();

  expect(await screen.findByText(/customer session verified/i)).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: /bk_portal_2/i })).toBeInTheDocument();
  expect(sessionStore.getSnapshot()?.role).toBe('owner');
  expect(customerSessionStore.getSnapshot()?.token).toBe('portal-customer-token');

  fireEvent.change(screen.getByLabelText(/^date$/i), { target: { value: '2030-08-05' } });
  fireEvent.change(screen.getByLabelText(/^start$/i), { target: { value: '13:00' } });
  fireEvent.change(screen.getByLabelText(/^end$/i), { target: { value: '14:30' } });
  await user.type(screen.getAllByLabelText(/^reason$/i)[1], 'Need a later arrival');
  await user.click(screen.getByRole('button', { name: /reschedule booking/i }));

  expect(confirmMock).toHaveBeenCalledWith('Reschedule this booking?');
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings/bk_portal_2/customer-reschedule',
      expect.objectContaining({
        body: expect.stringContaining('"reason":"Need a later arrival"'),
        method: 'POST',
      }),
    );
  });
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings/bk_portal_2/customer-reschedule',
    expect.objectContaining({
      body: expect.stringContaining('"timein":"2030-08-05T10:00:00.000Z"'),
      method: 'POST',
    }),
  );
  expect(await screen.findByText(/reschedule request sent/i)).toBeInTheDocument();
});

test('renders widget config, checks nearby options, and submits a compact booking request', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/bookings/suggestions') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                startDate: '2030-09-11T00:00:00.000Z',
                endDate: '2030-09-11T00:00:00.000Z',
                timein: '2030-09-11T12:00:00.000Z',
                timeout: '2030-09-11T13:00:00.000Z',
                score: 92,
                summary: 'Open one hour later.',
              },
            ],
          }),
        status: 200,
      });
    }

    if (url.endsWith('/bookings') && init?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'bk_widget_1',
              businessId: '507f1f77bcf86cd799439021',
              email: 'jules@example.com',
              endDate: '2030-09-11T13:00:00.000Z',
              fName: 'Jules',
              lName: 'Hale',
              phone: '+15552223333',
              startDate: '2030-09-11T12:00:00.000Z',
              status: 'pending',
              timein: '2030-09-11T12:00:00.000Z',
              timeout: '2030-09-11T13:00:00.000Z',
            },
          }),
        status: 201,
      });
    }

    if (url.endsWith('/businesses/public/demo-widget/widget')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              businessId: '507f1f77bcf86cd799439021',
              businessType: 'restaurant',
              description: 'Quick table requests for the dining room.',
              name: 'Widget Bistro',
              slug: 'demo-widget',
              timezone: 'America/New_York',
              widgetSettings: {
                accentColor: '#a44d24',
                embedTitle: 'Reserve in minutes',
                enabled: true,
                primaryActionLabel: 'Send request',
                showBusinessDescription: true,
                showNotes: true,
                showPartySize: true,
                showServiceSelector: true,
              },
              availableResources: [
                {
                  id: '507f1f77bcf86cd799439022',
                  name: 'Dining Table',
                  resourceType: 'table',
                  capacity: 4,
                  durationMinutes: 60,
                },
              ],
              bookingEndpoints: {
                createBooking: '/bookings',
                suggestions: '/bookings/suggestions',
              },
            },
          }),
        status: 200,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState({}, '', '/widget/demo-widget');

  renderApp();

  expect(await screen.findByRole('heading', { name: /reserve in minutes/i })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /dining table/i }));
  await user.clear(screen.getByLabelText(/^date$/i));
  await user.type(screen.getByLabelText(/^date$/i), '2030-09-11');
  await user.type(screen.getByLabelText(/^first name$/i), 'Jules');
  await user.type(screen.getByLabelText(/^last name$/i), 'Hale');
  await user.type(screen.getByLabelText(/^email$/i), 'jules@example.com');
  await user.type(screen.getByLabelText(/^phone$/i), '+15552223333');
  await user.type(screen.getByLabelText(/^notes$/i), 'Booth if possible');
  await user.click(screen.getByRole('button', { name: /check nearby/i }));

  expect(await screen.findByText(/open one hour later/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /open one hour later/i }));
  await user.click(screen.getByRole('button', { name: /send request/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/bookings',
      expect.objectContaining({
        body: expect.stringContaining('"serviceResourceId":"507f1f77bcf86cd799439022"'),
        method: 'POST',
      }),
    );
  });
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/businesses/public/demo-widget/widget',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings/suggestions',
    expect.objectContaining({
      body: expect.stringContaining('"maxSuggestions":3'),
      method: 'POST',
    }),
  );
  expect(await screen.findByText(/booking request sent/i)).toBeInTheDocument();
  expect(screen.getByText(/booking reference: bk_widget_1/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /continue on the full booking page/i })).toHaveAttribute(
    'href',
    '/book/demo-widget?date=2030-09-11&start=15%3A00&end=16%3A00&resourceId=507f1f77bcf86cd799439022&partySize=1&fName=Jules&lName=Hale&email=jules%40example.com&phone=%2B15552223333',
  );
  expect(screen.getByRole('link', { name: /track or manage this booking/i })).toHaveAttribute(
    'href',
    '/portal?businessId=507f1f77bcf86cd799439021&email=jules%40example.com&slug=demo-widget&bookingId=bk_widget_1',
  );
});

test('exposes the widget surface route from the shell', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith('/businesses/public/demo-widget/widget')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              businessId: '507f1f77bcf86cd799439021',
              businessType: 'salon',
              name: 'Demo Widget',
              slug: 'demo-widget',
              timezone: 'America/New_York',
              widgetSettings: {
                enabled: true,
                embedTitle: 'Quick booking',
              },
              availableResources: [],
              bookingEndpoints: {
                createBooking: '/bookings',
                suggestions: '/bookings/suggestions',
              },
            },
          }),
        status: 200,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/admin');
  renderApp();

  await user.click(screen.getByRole('link', { name: /widget/i }));

  expect(await screen.findByRole('heading', { name: /quick booking/i })).toBeInTheDocument();
  expect(screen.getByText(/general requests/i)).toBeInTheDocument();
});

test('renders the production homepage entry points without self-signup', () => {
  renderApp();

  expect(screen.getByRole('heading', { name: /slotwise booking operations/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  expect(screen.getByRole('link', { name: /customer portal/i })).toHaveAttribute('href', '/portal');
  expect(screen.getByRole('link', { name: /\/book\/demo-business/i })).toHaveAttribute('href', '/book/demo-business');
  expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
});

test('accepts an operator invitation token', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data: { accepted: true } }),
    status: 200,
  });
  vi.stubGlobal('fetch', fetchMock);

  window.history.pushState({}, '', '/operators/invitations/accept?token=invite-token-1');
  renderApp();

  expect(screen.getByLabelText(/invitation token/i)).toHaveValue('invite-token-1');
  await user.type(screen.getByLabelText(/new password/i), 'strong-pass');
  await user.click(screen.getByRole('button', { name: /accept invitation/i }));

  expect(await screen.findByText(/invitation accepted/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/auth/operators/invitations/accept',
    expect.objectContaining({
      body: JSON.stringify({ token: 'invite-token-1', password: 'strong-pass' }),
      method: 'POST',
    }),
  );
});

test('requests and completes operator password reset', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string) => Promise.resolve({
    json: () =>
      Promise.resolve(
        url.endsWith('/auth/operators/password-reset/complete')
          ? { success: true, data: { reset: true } }
          : { success: true, data: { requested: true } },
      ),
    status: url.endsWith('/auth/operators/password-reset/complete') ? 200 : 202,
  }));
  vi.stubGlobal('fetch', fetchMock);

  window.history.pushState({}, '', '/operators/password-reset');
  renderApp();

  await user.type(screen.getByLabelText(/username/i), 'owner@example.com');
  await user.click(screen.getByRole('button', { name: /send reset token/i }));

  expect(await screen.findByText(/reset message is on the way/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/auth/operators/password-reset',
    expect.objectContaining({
      body: JSON.stringify({ username: 'owner@example.com' }),
      method: 'POST',
    }),
  );

  cleanup();
  window.history.pushState({}, '', '/operators/password-reset/complete?token=reset-token-1');
  renderApp();

  expect(screen.getByLabelText(/reset token/i)).toHaveValue('reset-token-1');
  await user.type(screen.getByLabelText(/new password/i, { selector: 'input' }), 'new-strong-pass');
  await user.click(screen.getByRole('button', { name: /reset password/i }));

  expect(await screen.findByText(/password reset complete/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/auth/operators/password-reset/complete',
    expect.objectContaining({
      body: JSON.stringify({ token: 'reset-token-1', password: 'new-strong-pass' }),
      method: 'POST',
    }),
  );
});

test('owner user administration shows loading, empty, and one-time setup token states', async () => {
  const user = userEvent.setup();
  let operatorListCount = 0;
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith('/auth/operators') && operatorListCount === 0) {
      operatorListCount += 1;
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { operators: [] } }),
        status: 200,
      });
    }

    if (url.endsWith('/auth/operators') && operatorListCount > 0) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              operators: [
                {
                  id: 'operator-id-2',
                  actorId: 'operator-2',
                  username: 'staff@example.com',
                  role: 'staff',
                  active: false,
                },
              ],
            },
          }),
        status: 200,
      });
    }

    if (url.endsWith('/auth/operators/invitations')) {
      operatorListCount += 1;
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { invited: true, operatorId: 'operator-id-2', token: 'setup-token-2' } }),
        status: 201,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/owner/users');
  renderApp();

  expect(await screen.findByText(/no operators found/i)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/username/i), 'staff@example.com');
  await user.click(screen.getByRole('button', { name: /invite/i }));

  expect(await screen.findByText(/share this setup token/i)).toBeInTheDocument();
  expect(screen.getByText('setup-token-2')).toBeInTheDocument();
  expect(await screen.findByText('staff@example.com')).toBeInTheDocument();
});

test('audit log page applies filters deliberately and handles empty results', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/audit-logs/export')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('createdAt,actorRole,actorId\n'),
      });
    }

    if (url.includes('/audit-logs')) {
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: { logs: [] }, meta: { page: 1, limit: 50, total: 0, totalPages: 1 } }),
        status: 200,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  signInForTest();
  window.history.pushState({}, '', '/owner/audit');
  renderApp();

  expect(await screen.findByText(/no audit events found/i)).toBeInTheDocument();
  expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/action/i), 'operator.invited');
  await user.click(screen.getByRole('button', { name: /apply filters/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/audit-logs?action=operator.invited'),
      expect.any(Object),
    );
  });

  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:audit-export');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  await user.click(screen.getByRole('button', { name: /export csv/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/audit-logs/export?action=operator.invited'),
      expect.any(Object),
    );
  });
});

test('redirects protected admin routes to operator login', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        success: false,
        error: {
          message: 'Authenticated session is required',
        },
      }),
    status: 401,
  });
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState({}, '', '/admin/bookings');
  renderApp();

  expect(screen.getByRole('heading', { name: /checking your current session/i })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: /sign in to slotwise/i })).toBeInTheDocument();
});

test('stores operator sessions in memory after login', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        success: true,
        data: {
          actorId: 'operator-1',
          role: 'owner',
          token: 'signed-token',
        },
      }),
    status: 201,
  });
  vi.stubGlobal('fetch', fetchMock);

  window.history.pushState({}, '', '/login');
  renderApp();

  await user.type(screen.getByLabelText(/username/i), 'owner');
  await user.type(screen.getByLabelText(/password/i), 'correct-password');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /today at a glance/i })).toBeInTheDocument();
  });

  expect(sessionStore.getSnapshot()?.token).toBe('signed-token');
  expect(sessionStore.getSnapshot()?.role).toBe('owner');
});

test('revalidates the current operator session before loading admin routes', async () => {
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith('/auth/session')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              actorId: 'operator-1',
              actorType: 'operator',
              role: 'owner',
              sessionId: 'session-1',
              username: 'owner',
            },
          }),
        status: 200,
      });
    }

    if (url.includes('/bookings/insights/cancellation-no-show')) {
      return Promise.resolve({
        json: () => Promise.resolve(cancellationInsightsResponse),
        status: 200,
      });
    }

    if (url.includes('/bookings/insights/dashboard')) {
      return Promise.resolve({
        json: () => Promise.resolve(dashboardInsightsResponse),
        status: 200,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  sessionStore.setSession({
    actorId: 'operator-1',
    actorType: 'operator',
    role: 'owner',
    sessionId: 'stale-session-1',
    token: 'memory-token',
  });
  window.history.pushState({}, '', '/admin');
  renderApp();

  expect(await screen.findByRole('heading', { name: /today at a glance/i })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/auth/session',
    expect.objectContaining({
      headers: expect.objectContaining({
        authorization: 'Bearer memory-token',
      }),
      method: 'GET',
    }),
  );
  expect(sessionStore.getSnapshot()).toMatchObject({
    actorId: 'operator-1',
    actorType: 'operator',
    role: 'owner',
    sessionId: 'session-1',
    token: 'memory-token',
  });
});

test('clears invalid operator sessions and redirects back to login with a notice', async () => {
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith('/auth/session')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              message: 'Authenticated session is required',
            },
          }),
        status: 401,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  sessionStore.setSession({
    actorId: 'operator-1',
    actorType: 'operator',
    role: 'owner',
    sessionId: 'expired-session-1',
    token: 'memory-token',
  });
  window.history.pushState({}, '', '/admin');
  renderApp();

  expect(await screen.findByRole('heading', { name: /sign in to slotwise/i })).toBeInTheDocument();
  expect(screen.getByText(/your operator session expired/i)).toBeInTheDocument();
  expect(sessionStore.getSnapshot()).toBeNull();
});

test('revalidates portal sessions on window focus and clears them when the backend rejects the token', async () => {
  let sessionCheckCount = 0;
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith('/auth/session')) {
      sessionCheckCount += 1;

      return Promise.resolve({
        json: () =>
          Promise.resolve(
            sessionCheckCount === 1
              ? {
                  success: true,
                  data: {
                    actorId: 'cus_portal_1',
                    actorType: 'customer',
                    businessId: 'business-1',
                    email: 'maya@example.com',
                    role: 'customer',
                    sessionId: 'portal-session-1',
                  },
                }
              : {
                  success: false,
                  error: {
                    message: 'Authenticated session is required',
                  },
                },
          ),
        status: sessionCheckCount === 1 ? 200 : 401,
      });
    }

    if (url.includes('/bookings?')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                _id: 'bk_portal_1',
                businessId: 'business-1',
                customerId: 'cus_portal_1',
                email: 'maya@example.com',
                phone: '555-0123',
                fName: 'Maya',
                lName: 'Stone',
                startDate: '2030-01-01T10:00:00.000Z',
                endDate: '2030-01-01T11:00:00.000Z',
                timein: '2030-01-01T10:00:00.000Z',
                timeout: '2030-01-01T11:00:00.000Z',
                status: 'approved',
              },
            ],
          }),
        status: 200,
      });
    }

    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  customerSessionStore.setSession({
    actorId: 'cus_portal_1',
    actorType: 'customer',
    businessId: 'business-1',
    email: 'maya@example.com',
    role: 'customer',
    sessionId: 'portal-session-1',
    token: 'portal-customer-token',
  });
  window.history.pushState({}, '', '/portal?businessId=business-1&email=maya@example.com');
  renderApp();

  expect(await screen.findByRole('button', { name: /bk_portal_1/i })).toBeInTheDocument();

  window.dispatchEvent(new Event('focus'));

  await waitFor(() => {
    expect(customerSessionStore.getSnapshot()).toBeNull();
  });
  expect(screen.getByText(/your customer session expired/i)).toBeInTheDocument();
  expect(screen.getByText(/customer sign-in required/i)).toBeInTheDocument();
});
