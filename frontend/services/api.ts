/**
 * API Service Layer
 * Centralized API handling with error management, loading states, and request interceptors
 */

import { API_BASE_URL } from '../constants';

// Custom error class for API errors
export class APIError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Response wrapper type
export interface APIResponse<T> {
  data: T | null;
  error: APIError | null;
  loading: boolean;
}

// Request options type
interface RequestOptions {
  token?: string;
  [key: string]: any;
}

/**
 * Get the access token for API authentication.
 * Stored in localStorage (persists across browser sessions).
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/** Persist access token (called after login/register/social-auth). */
export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

/**
 * Drop-in replacement for native fetch() that automatically injects
 * the Authorization: Bearer header when a token exists in localStorage.
 * Use this instead of raw fetch() for all API calls that need auth.
 */
export const authFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, credentials: 'include', headers });
};

/**
 * Build full URL with query parameters
 */
export const buildURL = (endpoint: string, params?: Record<string, string | number>): string => {
  const url = `${API_BASE_URL}${endpoint}`;
  if (!params) return url;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  
  return `${url}?${searchParams.toString()}`;
};

/**
 * Default headers including auth token if available
 */
const getDefaultHeaders = (token?: string): any => {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  const authToken = token || getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

/**
 * Attempt to refresh the access token using the refresh_token cookie.
 * Returns the new token string, or null if refresh fails.
 */
let _isRefreshing = false;
let _refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  // Deduplicate concurrent refresh calls
  if (_isRefreshing && _refreshPromise) return _refreshPromise;
  
  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          setAuthToken(data.access_token);
          return data.access_token as string;
        }
      }
      return null;
    } catch {
      return null;
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
};

/**
 * Handle API response — on 401, signal that a token refresh is needed.
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    // Create user-friendly error message
    let errorMessage = 'An unexpected error occurred';
    if (errorData?.message) {
      errorMessage = errorData.message;
    } else if (errorData?.detail) {
      errorMessage = errorData.detail;
    } else if (response.status === 401) {
      errorMessage = 'Authentication required. Please log in.';
    } else if (response.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (response.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (response.status === 500) {
      errorMessage = 'Internal server error. Please try again later.';
    }
    
    throw new APIError(
      errorMessage,
      response.status,
      errorData
    );
  }
  
  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
};

/**
 * Execute a fetch call, and if it returns 401, refresh the token and retry once.
 */
const fetchWithAutoRefresh = async <T>(
  buildRequest: (token: string | null) => Promise<Response>
): Promise<T> => {
  const response = await buildRequest(getAuthToken());
  
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry once with the new token
      const retryResponse = await buildRequest(newToken);
      return handleResponse<T>(retryResponse);
    }
    // Refresh failed — clear stale token
    setAuthToken(null);
  }
  
  return handleResponse<T>(response);
};

/**
 * Retry logic for API calls
 */
const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 3000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (maxRetries <= 0) {
      throw error;
    }
    
    // Never retry client errors (4xx) — they won't succeed on retry
    if (error instanceof APIError && error.status >= 400 && error.status < 500) {
      throw error;
    }
    
    // Wait with exponential backoff before retrying network/server errors
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithExponentialBackoff(fn, maxRetries - 1, delay * 2);
  }
};

/**
 * Main fetch wrapper with error handling
 */
export const api = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number>, options?: RequestOptions & { maxRetries?: number; timeoutMs?: number }): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const timeoutMs = options?.timeoutMs ?? 90000; // 90s default to survive cold starts
    
    return retryWithExponentialBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetchWithAutoRefresh<T>(token => fetch(buildURL(endpoint, params), {
          method: 'GET',
          headers: getDefaultHeaders(options?.token ?? token ?? undefined),
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        }));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new APIError('Request timed out - backend may be starting up', 0, { networkError: true, timeout: true });
        }
        // Handle network errors (backend unavailable / cold start)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new APIError('Network error - backend unavailable', 0, { networkError: true });
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }, maxRetries);
  },

  /**
   * POST request
   */
   async post<T>(endpoint: string, body?: unknown, options?: RequestOptions & { maxRetries?: number }): Promise<T> {
    const maxRetries = options?.maxRetries ?? 0; // Don't retry POST by default to avoid duplicates
    
    return retryWithExponentialBackoff(() =>
      fetchWithAutoRefresh<T>(token => fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getDefaultHeaders(options?.token ?? token ?? undefined),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      }))
    , maxRetries);
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return fetchWithAutoRefresh<T>(token => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getDefaultHeaders(options?.token ?? token ?? undefined),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    }));
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return fetchWithAutoRefresh<T>(token => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getDefaultHeaders(options?.token ?? token ?? undefined),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    }));
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return fetchWithAutoRefresh<T>(token => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(options?.token ?? token ?? undefined),
      credentials: 'include',
    }));
  },

  /**
   * Upload file with multipart/form-data
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const headers: any = {};
    const authToken = options?.token || getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',  // Include HttpOnly cookies for authentication
      ...options,
    });
    
    return handleResponse<T>(response);
  },
};

export default api;
