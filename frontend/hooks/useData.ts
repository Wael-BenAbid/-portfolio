/**
 * Custom React Hooks for Data Fetching
 * Provides loading states, error handling, and automatic data validation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, APIError } from '../services/api';
import { z } from 'zod';

// ============================================
// Types
// ============================================

interface UseQueryOptions<T> {
  enabled?: boolean;
  initialData?: T | null;
  fallbackData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: APIError) => void;
  schema?: z.ZodSchema<T>;
}

interface UseQueryResult<T> {
  data: T | null;
  error: APIError | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

interface UseMutationResult<T, P> {
  mutate: (params: P) => Promise<T | null>;
  data: T | null;
  error: APIError | null;
  loading: boolean;
  reset: () => void;
}

// ============================================
// useQuery Hook
// ============================================

/**
 * Hook for fetching data from an API endpoint
 */
export function useQuery<T>(
  endpoint: string | null,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const { enabled = true, initialData = null, fallbackData = null, onSuccess, onError, schema } = options;
  
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<APIError | null>(null);
  const [loading, setLoading] = useState(enabled);
  
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.get<T>(endpoint);
      
      // Validate with schema if provided
      const validatedData = schema ? schema.parse(result) : result;
      
      if (isMounted.current) {
        setData(validatedData);
        onSuccess?.(validatedData);
      }
    } catch (err) {
      if (isMounted.current) {
        const apiError = err instanceof APIError 
          ? err 
          : new APIError('An unexpected error occurred', 500, err);
        
        // Don't set error for network failures when we have fallback data
        if (apiError.status !== 0 || !fallbackData) {
          setError(apiError);
          onError?.(apiError);
        }
        
        // Use fallback data if available when API fails
        if (fallbackData) {
          setData(fallbackData);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [endpoint, schema, onSuccess, onError, fallbackData]);

  useEffect(() => {
    isMounted.current = true;
    
    if (enabled && endpoint) {
      fetchData();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [enabled, endpoint, fetchData]);

  return {
    data,
    error,
    loading,
    refetch: fetchData,
  };
}

// ============================================
// useMutation Hook
// ============================================

type MutationMethod = 'post' | 'put' | 'patch' | 'delete';

interface MutationConfig<T, P> {
  method?: MutationMethod;
  endpoint: string | ((params: P) => string);
  schema?: z.ZodSchema<T>;
  onSuccess?: (data: T, params: P) => void;
  onError?: (error: APIError, params: P) => void;
}

/**
 * Hook for mutating data (POST, PUT, PATCH, DELETE)
 */
export function useMutation<T, P = void>(
  config: MutationConfig<T, P>
): UseMutationResult<T, P> {
  const { method = 'post', endpoint, schema, onSuccess, onError } = config;
  
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<APIError | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const url = typeof endpoint === 'function' ? endpoint(params) : endpoint;
      
      let result: T;
      
      switch (method) {
        case 'post':
          result = await api.post<T>(url, params);
          break;
        case 'put':
          result = await api.put<T>(url, params);
          break;
        case 'patch':
          result = await api.patch<T>(url, params);
          break;
        case 'delete':
          result = await api.delete<T>(url);
          break;
        default:
          result = await api.post<T>(url, params);
      }
      
      // Validate with schema if provided
      const validatedData = schema ? schema.parse(result) : result;
      
      if (isMounted.current) {
        setData(validatedData);
        onSuccess?.(validatedData, params);
      }
      
      return validatedData;
    } catch (err) {
      const apiError = err instanceof APIError 
        ? err 
        : new APIError('An unexpected error occurred', 500, err);
      
      if (isMounted.current) {
        setError(apiError);
        onError?.(apiError, params);
      }
      
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [method, endpoint, schema, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    error,
    loading,
    reset,
  };
}

// ============================================
// useProjects Hook
// ============================================

import { ProjectSchema, SkillSchema } from '../services/validations';
import type { Project, Skill } from '../types';

interface ProjectsResponse {
  results: Project[];
  count: number;
}

// Fallback empty data when API is unavailable
const EMPTY_PROJECTS_RESPONSE: ProjectsResponse = { results: [], count: 0 };

export function useProjects() {
  return useQuery<ProjectsResponse>('/projects/', {
    fallbackData: EMPTY_PROJECTS_RESPONSE,
  });
}

export function useProject(slug: string | undefined) {
  return useQuery<Project>(
    slug ? `/projects/${slug}/` : null,
    {}
  );
}

export function useSkills() {
  return useQuery<Skill[]>('/projects/skills/', {
    fallbackData: [],
  });
}

// ============================================
// useSettings Hook
// ============================================

import { SiteSettingsSchema } from '../services/validations';

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

// Default settings when API is unavailable
const DEFAULT_SETTINGS: SiteSettings = {
  hero_title: 'ACTIVE',
  hero_subtitle: 'THEORY',
  hero_tagline: 'Digital Experiences & Aerial Visuals',
  about_title: 'THE MIND BEHIND',
};

export function useSettings() {
  return useQuery<SiteSettings>('/settings/', {
    fallbackData: DEFAULT_SETTINGS,
  });
}

// ============================================
// useCV Hook
// ============================================

import { CVDataSchema } from '../services/validations';

export type CVData = z.infer<typeof CVDataSchema>;

// Default empty CV data when API is unavailable
const DEFAULT_CV_DATA: CVData = {
  personal_info: {
    full_name: '',
    job_title: '',
    email: '',
    phone: '',
    location: '',
    profile_image: '',
    summary: '',
  },
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  interests: [],
};

export function useCV() {
  return useQuery<CVData>('/cv/', {
    fallbackData: DEFAULT_CV_DATA,
  });
}

// ============================================
// useAuth Hook
// ============================================

import { LoginResponseSchema, UserSchema } from '../services/validations';

export type User = z.infer<typeof UserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export function useLogin() {
  return useMutation<LoginResponse, LoginParams>({
    endpoint: '/auth/login/',
    schema: LoginResponseSchema,
  });
}

export function useRegister() {
  return useMutation<LoginResponse, RegisterParams>({
    endpoint: '/auth/register/',
    schema: LoginResponseSchema,
  });
}

export function useLogout() {
  return useMutation<void, void>({
    endpoint: '/auth/logout/',
  });
}
