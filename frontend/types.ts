
export type Category = 'Development' | 'Drone' | 'Mixed';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string | null | undefined;
  thumbnail_url?: string | null;
  caption?: string | null;
  order: number;
  likes_count: number;
  is_liked?: boolean;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: Category;
  thumbnail: string;
  created_at: string;
  featured: boolean;
  is_active: boolean;
  show_registration: boolean;
  media: MediaItem[];
  technologies: string[];
  likes_count: number;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  category: 'Frontend' | 'Backend' | 'DevOps' | 'Drone' | 'Editing';
}

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
