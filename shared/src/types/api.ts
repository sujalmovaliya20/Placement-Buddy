/**
 * API response types — standardized envelope for all backend responses.
 *
 * Used by the frontend API client to type-check responses and
 * by the backend to ensure consistent response shapes.
 */

/** Successful API response wrapping data of type T */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Error detail within an API error response */
export interface ApiErrorDetail {
  /** Machine-readable error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND') */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Field-level errors for validation failures */
  field?: string;
}

/** Failed API response */
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

/** Paginated API response with cursor or offset metadata */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    /** Current page number (1-indexed) */
    page: number;

    /** Items per page */
    limit: number;

    /** Total items across all pages */
    total: number;

    /** Total number of pages */
    totalPages: number;

    /** Whether there are more pages */
    hasMore: boolean;
  };
}

/** Sort direction */
export type SortOrder = 'asc' | 'desc';

/** Common query parameters for list endpoints */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
}
