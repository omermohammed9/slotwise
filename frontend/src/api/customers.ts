import { apiRequest } from './client';
import type { ApiResponse, CustomerDto, QueryParams } from './types';

export type CreateCustomerBody = Partial<CustomerDto>;
export type UpdateCustomerBody = Partial<Omit<CustomerDto, '_id'>>;

export function listCustomers(query: QueryParams | undefined, token: string): Promise<ApiResponse<CustomerDto[]>> {
  return apiRequest<CustomerDto[]>('/customers', {
    method: 'GET',
    query,
    token,
  });
}

export function getCustomer(id: string, token: string): Promise<ApiResponse<CustomerDto>> {
  return apiRequest<CustomerDto>(`/customers/${id}`, {
    method: 'GET',
    token,
  });
}

export function createCustomer(body: CreateCustomerBody, token: string): Promise<ApiResponse<CustomerDto>> {
  return apiRequest<CustomerDto>('/customers', {
    method: 'POST',
    body,
    token,
  });
}

export function updateCustomer(id: string, body: UpdateCustomerBody, token: string): Promise<ApiResponse<CustomerDto>> {
  return apiRequest<CustomerDto>(`/customers/${id}`, {
    method: 'PATCH',
    body,
    token,
  });
}
