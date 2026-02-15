
import { Project, Skill, AboutData } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Aether Cloud',
    slug: 'aether-cloud',
    description: 'A cloud-native SaaS platform for managing aerial data and 3D terrain mapping.',
    category: 'Development',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    createdAt: '2024-01-15',
    featured: true,
    technologies: ['React', 'Django', 'PostgreSQL', 'Three.js'],
    media: [
      { id: 'm1', type: 'image', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop', order: 1 },
    ]
  },
  {
    id: '2',
    title: 'Glacial Flow',
    slug: 'glacial-flow',
    description: 'Cinematic drone exploration of the Icelandic Highlands captured in 4K.',
    category: 'Drone',
    thumbnail: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop',
    createdAt: '2023-11-20',
    featured: true,
    technologies: ['DJI Mavic 3 Pro', 'DaVinci Resolve'],
    media: [
      { id: 'm3', type: 'image', url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1920&auto=format&fit=crop', order: 1 },
    ]
  }
];

// Added PROJECTS export to fix import errors in Home.tsx and ProjectDetail.tsx
export const PROJECTS = INITIAL_PROJECTS;

export const SKILLS: Skill[] = [
  { id: 's1', name: 'React / TypeScript', level: 95, category: 'Frontend' },
  { id: 's2', name: 'Django / Python', level: 90, category: 'Backend' },
  { id: 's5', name: 'Drone Piloting (Part 107)', level: 98, category: 'Drone' },
];

export const INITIAL_ABOUT: AboutData = {
  bio: "I am a Full-Stack Engineer who finds rhythm in both code and flight. By day, I build scalable web architectures with a focus on immersive user experiences. By sunrise, I fly drones to capture the world from perspectives that remind us of our place in the universe.",
  profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
  droneImage: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop',
  email: 'hello@adrian.dev',
  location: 'Casablanca, Morocco',
  coordinates: {
    lat: 33.5731,
    lng: -7.5898
  },
  socials: {
    instagram: 'https://instagram.com/adrian.dev',
    linkedin: 'https://linkedin.com/in/adrian',
    github: 'https://github.com/adrian'
  }
};

// Added ABOUT export to fix import error in About.tsx
export const ABOUT = INITIAL_ABOUT;

// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api';

// Simulated persistence keys
export const STORAGE_KEYS = {
  PROJECTS: 'portfolio_projects',
  ABOUT: 'portfolio_about',
  AUTH: 'portfolio_auth'
};
