import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

test('renders the Slotwise operational dashboard', () => {
  renderApp();

  expect(screen.getByRole('heading', { name: /today at a glance/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /booking queue/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /approved storage baseline/i })).toBeInTheDocument();
});

test('navigates through the admin route map', async () => {
  const user = userEvent.setup();
  renderApp();

  await user.click(screen.getByRole('link', { name: /bookings/i }));

  expect(screen.getByRole('heading', { name: /^bookings$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /bookings/i })).toHaveAttribute('aria-current', 'page');
});

test('exposes public surface routes from the shell', async () => {
  const user = userEvent.setup();
  renderApp();

  await user.click(screen.getByRole('link', { name: /widget/i }));

  expect(screen.getByRole('heading', { name: /^widget$/i })).toBeInTheDocument();
  expect(screen.getByText(/iframe-first route/i)).toBeInTheDocument();
});
