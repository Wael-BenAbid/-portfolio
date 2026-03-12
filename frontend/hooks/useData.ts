/**
 * Custom React Hooks for Data Fetching
 * Provides loading states, error handling, and automatic data validation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  schema?: z.ZodSchema<any>;
  maxRetries?: number;
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
  const { enabled = true, initialData = null, fallbackData = null, onSuccess, onError, schema, maxRetries } = options;
  
  // Memoize validated initial and fallback data to prevent infinite loops
  const validatedInitialData = React.useMemo(() => {
    return initialData && schema ? schema.parse(initialData) : initialData;
  }, [initialData, schema]);
  
  const validatedFallbackData = React.useMemo(() => {
    return fallbackData && schema ? schema.parse(fallbackData) : fallbackData;
  }, [fallbackData, schema]);
  
  const [data, setData] = useState<T | null>(validatedInitialData);
  const [error, setError] = useState<APIError | null>(null);
  const [loading, setLoading] = useState(enabled);
  
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.get<T>(endpoint, undefined, { maxRetries });
      
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
        // This prevents showing error UI when the backend is just waking up
        if (apiError.status !== 0 || !validatedFallbackData) {
          setError(apiError);
          onError?.(apiError);
        }
        
        // Use fallback data if available when API fails
        if (validatedFallbackData) {
          setData(validatedFallbackData);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [endpoint, schema, onSuccess, onError, validatedFallbackData, maxRetries]);

  useEffect(() => {
    isMounted.current = true;
    
    // Only fetch once on mount
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

import { ProjectSchema, SkillSchema, SiteSettingsSchema, MediaItemSchema } from '../services/validations';

// Infer all types directly from Zod schemas for 100% type consistency
export type Project = z.infer<typeof ProjectSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type MediaItem = z.infer<typeof MediaItemSchema>;
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

const ProjectsResponseSchema = z.object({
  results: z.array(ProjectSchema),
  count: z.number(),
});

type ProjectsResponse = z.infer<typeof ProjectsResponseSchema>;

// Fallback empty data when API is unavailable
const EMPTY_PROJECTS_RESPONSE: ProjectsResponse = { results: [], count: 0 };

// Cache key for localStorage
const PROJECTS_CACHE_KEY = 'portfolio_projects_cache';

// Get cached projects from localStorage
const getCachedProjects = (): ProjectsResponse | null => {
  try {
    const cached = localStorage.getItem(PROJECTS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

// Store projects in localStorage cache
const setCachedProjects = (data: ProjectsResponse): void => {
  try {
    localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if localStorage is unavailable
  }
};

export function useProjects() {
  // Initialize with cached data if available, otherwise empty
  const cachedData = getCachedProjects();
  
  const { data, error, loading, refetch } = useQuery<ProjectsResponse>('/projects/', {
    initialData: cachedData || undefined,
    fallbackData: cachedData || EMPTY_PROJECTS_RESPONSE, // Use cache as fallback, not empty
    schema: ProjectsResponseSchema,
    maxRetries: 2, // Reduced from 5 to prevent browser resource exhaustion on slow backends
    onSuccess: (data) => {
      // Cache projects when successfully loaded
      setCachedProjects(data);
    },
  });

  return { data, error, loading, refetch };
}

export function useProject(slug: string | undefined) {
  return useQuery<Project>(
    slug ? `/projects/${slug}/` : null,
    {
      schema: ProjectSchema,
    }
  );
}

export function useSkills() {
  return useQuery<Skill[]>('/projects/skills/', {
    fallbackData: [],
  });
}

// Default settings when API is unavailable
const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Portfolio',
  site_title: 'WAEL',
  logo_url: '',
  favicon_url: '',
  site_description: '',
  
  // Theme Settings
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  accent_color: '#ec4899',
  background_color: '#0a0a0a',
  cursor_theme: 'default',
  cursor_size: 20,
  custom_cursor_color: '#6366f1',
  cursor_enabled_mobile: false,
  
  hero_title: 'ACTIVE',
  hero_subtitle: 'THEORY',
  hero_tagline: 'Digital Experiences & Aerial Visuals',
  about_title: 'THE MIND BEHIND',
  about_quote: '"Technology is the vessel, but storytelling is the destination. I create digital landmarks that bridge the gap between imagination and reality."',
  profile_image: '',
  drone_image: '',
  drone_video_url: '',
  location: 'Bizerte, Tunisia',
  latitude: 33.5731,
  longitude: -7.5898,
  footer_text: 'DESIGNED BY wael',
  footer_background_video: '',
  copyright_year: 2026,
  version: '1.0',
  instagram_url: '',
  linkedin_url: '',
  github_url: '',
  twitter_url: '',
  nav_work_label: 'Work',
  nav_about_label: 'About',
  nav_contact_label: 'Contact',
  
  // CV Personal Info
  cv_full_name: '',
  cv_job_title: '',
  cv_email: '',
  cv_phone: '',
  cv_location: '',
  cv_profile_image: '',
  cv_summary: '',
  
  // Email Settings
  email_host: '',
  email_port: 587,
  email_host_user: '',
  email_host_password: '',
  default_from_email: '',
  
  // Contact
  contact_email: '',
  contact_phone: '',
  
  // Footer
  designer_name: 'WAEL',
  copyright_text: 'Your Name. All rights reserved.',
  show_location: true,
  
  // SEO
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  
  // OAuth Settings
  google_client_id: '',
  google_client_secret: '',
  facebook_app_id: '',
  facebook_app_secret: '',
};

export function useSettings() {
  const { data, ...rest } = useQuery<SiteSettings>('/settings/', {
    fallbackData: DEFAULT_SETTINGS,
    schema: SiteSettingsSchema,
    maxRetries: 5,
  });

  // Dynamically update browser title and favicon when settings change
  useEffect(() => {
    if (data?.site_title) {
      document.title = data.site_title;
    }

    if (data?.favicon_url) {
      let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link') as HTMLLinkElement;
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = data.favicon_url;
    }
  }, [data?.site_title, data?.favicon_url]);

  return { data, ...rest };
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
    maxRetries: 5, // More retries to survive Render free-tier cold starts (~50s)
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
