import { getApiBaseUrl } from './client';

test('uses the local backend as the default API target', () => {
  expect(getApiBaseUrl()).toBe('http://localhost:3000');
});
