import { Project, Skill, AboutData } from './types';

// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  LOGOUT: '/auth/logout/',
  PROFILE: '/auth/profile/',
  PROFILE_UPDATE: '/auth/profile/update/',
  PASSWORD_CHANGE: '/auth/password/change/',
  SOCIAL_AUTH: '/auth/social/',
  
  // Admin User Management
  ADMIN_USERS: '/auth/admin/users/',
  ADMIN_USER_DETAIL: (id: number) => `/auth/admin/users/${id}/`,
  
  // Projects
  PROJECTS: '/projects/',
  PROJECT_DETAIL: (slug: string) => `/projects/${slug}/`,
  SKILLS: '/projects/skills/',
  SKILL_DETAIL: (id: number) => `/projects/skills/${id}/`,
  
  // CV
  CV: '/cv/',
  CV_EXPERIENCES: '/cv/experiences/',
  CV_EDUCATION: '/cv/education/',
  CV_SKILLS: '/cv/skills/',
  CV_LANGUAGES: '/cv/languages/',
  CV_CERTIFICATIONS: '/cv/certifications/',
  CV_PROJECTS: '/cv/projects/',
  CV_INTERESTS: '/cv/interests/',
  
  // Settings & Content
  SETTINGS: '/settings/',
  ABOUT: '/settings/about/',
  CONTACT: '/settings/contact/',
  SUBSCRIBE: '/settings/subscribe/',
  UPLOAD: '/settings/upload/',
  
  // Interactions
  TOGGLE_LIKE: (contentType: string, contentId: number) => `/interactions/like/${contentType}/${contentId}/`,
  MY_LIKES: '/interactions/my-likes/',
  NOTIFICATIONS: '/interactions/notifications/',
  MARK_NOTIFICATION_READ: (id: number) => `/interactions/notifications/${id}/read/`,
};

// Storage keys for local caching
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  THEME: 'portfolio_theme',
};

// Default fallback data (used when API is unavailable)
export const DEFAULT_PROJECTS: Project[] = [];

export const DEFAULT_SKILLS: Skill[] = [];

export const DEFAULT_ABOUT: AboutData = {
  bio: '',
  profileImage: '',
  droneImage: '',
  email: '',
  location: '',
  coordinates: {
    lat: 0,
    lng: 0
  },
  socials: {}
};

// Image optimization helper
export const getOptimizedImageUrl = (url: string, width: number = 800): string => {
  if (!url) return '';
  
  // Handle Unsplash URLs with optimization parameters
  if (url.includes('unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=80&auto=format&fit=crop`;
  }
  
  // Return original URL for other sources
  return url;
};

// Animation variants for framer-motion
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  }
};

// Transition presets
export const TRANSITIONS = {
  default: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  slow: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 30 }
};
