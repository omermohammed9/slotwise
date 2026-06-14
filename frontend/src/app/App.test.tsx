import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, vi } from 'vitest';
import { sessionStore } from '../auth/sessionStore';
import { App } from './App';

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
  sessionStore.clearSession();
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
              businessType: 'clinic',
              contactEmail: 'frontdesk@example.com',
              contactPhone: '+15550001111',
              name: 'North Clinic',
              slug: 'north-clinic',
              status: 'active',
              timezone: 'America/New_York',
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

  await user.clear(screen.getByLabelText(/^email$/i));
  await user.type(screen.getByLabelText(/^email$/i), 'frontdesk@example.com');
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
  expect(await screen.findByText(/settings saved/i)).toBeInTheDocument();
});

test('renders customer management with profile and booking history', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/customers/cus_101')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'cus_101',
              businessId: 'biz_101',
              fName: 'Maya',
              lName: 'Carter',
              email: 'maya@example.com',
              phone: '+15551234567',
              bookingCount: 3,
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
              fName: 'Maya',
              lName: 'Carter',
              email: 'maya@example.com',
              phone: '+15551234567',
              bookingCount: 3,
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

  await user.type(screen.getByLabelText(/^name$/i), 'Maya');
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/customers?customerName=Maya',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  await user.click(screen.getByRole('button', { name: /maya carter/i }));

  expect(await screen.findByText(/biz_101/i)).toBeInTheDocument();
  expect(await screen.findByText(/room_2/i)).toBeInTheDocument();
  expect(screen.getByText(/approved/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/bookings?customerId=cus_101&email=maya%40example.com&phone=%2B15551234567&limit=5&sortBy=startDate&sortOrder=desc',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('renders resources, creates a resource, and toggles active state', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
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

    if (url.includes('/service-resources/res_101') && init?.method === 'PATCH') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              _id: 'res_101',
              active: false,
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

  await user.type(screen.getByLabelText(/^business id$/i), 'biz_101');
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

  await user.click(screen.getByRole('button', { name: /deactivate/i }));
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/service-resources/res_101',
      expect.objectContaining({
        body: '{"active":false}',
        method: 'PATCH',
      }),
    );
  });
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

test('exposes public surface routes from the shell', async () => {
  const user = userEvent.setup();
  signInForTest();
  renderApp();

  await user.click(screen.getByRole('link', { name: /widget/i }));

  expect(screen.getByRole('heading', { name: /^widget$/i })).toBeInTheDocument();
  expect(screen.getByText(/iframe-first route/i)).toBeInTheDocument();
});

test('redirects protected admin routes to operator login', () => {
  window.history.pushState({}, '', '/admin/bookings');
  renderApp();

  expect(screen.getByRole('heading', { name: /sign in to slotwise/i })).toBeInTheDocument();
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
