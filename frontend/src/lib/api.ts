/**
 * Type-safe API client for communicating with the backend.
 *
 * Uses the shared ApiResponse and ApiErrorResponse types to ensure
 * type safety across the frontend-backend boundary.
 */

import type { ApiResponse, ApiErrorResponse, PaginatedResponse } from '@shared/types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('Critical Configuration Error: NEXT_PUBLIC_API_URL environment variable is missing.');
}

/** Error thrown when an API request fails */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  params?: Record<string, string | number | undefined>;
}

/**
 * Build a URL with query parameters, filtering out undefined values.
 */
function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Core fetch wrapper with error handling and type safety.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers: customHeaders, ...fetchOptions } = options;

  const url = buildUrl(path, params);

  const headers: HeadersInit = {
    ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...customHeaders,
  };

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse;

    try {
      errorData = (await response.json()) as ApiErrorResponse;
    } catch {
      throw new ApiError(
        response.status,
        'UNKNOWN_ERROR',
        `Request failed with status ${response.status}`,
      );
    }

    throw new ApiError(
      response.status,
      errorData.error.code,
      errorData.error.message,
    );
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * API client with typed methods for each HTTP verb.
 */
export const api = {
  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, { method: 'GET', params });
  },

  getList<T>(path: string, params?: Record<string, string | number | undefined>): Promise<PaginatedResponse<T>> {
    return request<PaginatedResponse<T>>(path, { method: 'GET', params });
  },

  post<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, { method: 'POST', body });
  },

  put<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, { method: 'PUT', body });
  },

  patch<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    return request<ApiResponse<T>>(path, { method: 'PATCH', body });
  },

  delete<T = void>(path: string): Promise<T extends void ? void : ApiResponse<T>> {
    return request<T extends void ? void : ApiResponse<T>>(path, { method: 'DELETE' });
  },
};
