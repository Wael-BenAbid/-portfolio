
export type Category = 'Development' | 'Drone' | 'Mixed';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: Category;
  thumbnail: string;
  createdAt: string;
  featured: boolean;
  media: MediaItem[];
  technologies: string[];
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

export interface AuthUser {
  isAuthenticated: boolean;
  token?: string;
}
