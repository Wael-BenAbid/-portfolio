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
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Build full URL with query parameters
 */
const buildURL = (endpoint: string, params?: Record<string, string | number>): string => {
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
    
    throw new APIError(
      errorData?.message || errorData?.detail || `HTTP Error: ${response.status}`,
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
 * Main fetch wrapper with error handling
 */
export const api = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number>, options?: RequestOptions): Promise<T> {
    const response = await fetch(buildURL(endpoint, params), {
      method: 'GET',
      headers: getDefaultHeaders(options?.token),
      ...options,
    });
    
    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getDefaultHeaders(options?.token),
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    
    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getDefaultHeaders(options?.token),
      body: body ? JSON.stringify(body) : undefined,
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
      ...options,
    });
    
    return handleResponse<T>(response);
  },
};

export default api;
