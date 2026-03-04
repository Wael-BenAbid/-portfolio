
import { z } from 'zod';
import { MediaItemSchema, ProjectSchema, SkillSchema } from './services/validations';

// Infer types directly from Zod schemas for consistency
export type MediaItem = z.infer<typeof MediaItemSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Category = 'Development' | 'Drone' | 'Mixed';

export interface AboutData {
  bio: string;
  profileImage: string;
  droneImage: string;
  email: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  socials: {
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface User {
  id: number;
  email: string;
  user_type: 'admin' | 'registered' | 'visitor';
  profile_image?: string;
  bio?: string;
  phone?: string;
  email_notifications: boolean;
  notify_new_projects: boolean;
  notify_updates: boolean;
  created_at: string;
  first_name?: string;
  last_name?: string;
  requires_password_change?: boolean;
}

export interface AuthUser {
  isAuthenticated: boolean;
  token?: string;
  user?: User;
}
