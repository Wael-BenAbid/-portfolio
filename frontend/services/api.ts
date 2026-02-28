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
interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Check if user is authenticated (has user data in sessionStorage)
 * Note: The actual authentication is done via HttpOnly cookie set by backend
 * We do NOT store or retrieve the auth token from sessionStorage for security
 */
export const getAuthToken = (): string | null => {
  // Token is stored in HttpOnly cookie only - not accessible to JavaScript
  // Return null to indicate we rely on cookie-based authentication
  return null;
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
const getDefaultHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const authToken = token || getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

/**
 * Handle API response
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
 * Retry logic for API calls
 */
const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (maxRetries <= 0) {
      throw error;
    }
    
    // Wait with exponential backoff
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
  async get<T>(endpoint: string, params?: Record<string, string | number>, options?: RequestOptions & { maxRetries?: number }): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    
    return retryWithExponentialBackoff(async () => {
      try {
        const response = await fetch(buildURL(endpoint, params), {
          method: 'GET',
          headers: getDefaultHeaders(options?.token),
          credentials: 'include',  // Include HttpOnly cookies for authentication
          ...options,
        });
        
        return handleResponse<T>(response);
      } catch (error) {
        // Silently handle network errors - return empty response
        // This allows the app to work offline or when backend is unavailable
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new APIError('Network error - backend unavailable', 0, { networkError: true });
        }
        throw error;
      }
    }, maxRetries);
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions & { maxRetries?: number }): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    
    return retryWithExponentialBackoff(async () => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getDefaultHeaders(options?.token),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',  // Include HttpOnly cookies for authentication
        ...options,
      });
      
      return handleResponse<T>(response);
    }, maxRetries);
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getDefaultHeaders(options?.token),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',  // Include HttpOnly cookies for authentication
      ...options,
    });
    
    return handleResponse<T>(response);
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getDefaultHeaders(options?.token),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',  // Include HttpOnly cookies for authentication
      ...options,
    });
    
    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(options?.token),
      credentials: 'include',  // Include HttpOnly cookies for authentication
      ...options,
    });
    
    return handleResponse<T>(response);
  },

  /**
   * Upload file with multipart/form-data
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const headers: HeadersInit = {};
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
