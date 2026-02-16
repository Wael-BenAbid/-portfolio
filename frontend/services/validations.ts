/**
 * Data Validation Schemas using Zod
 * Validates API responses to ensure type safety and data integrity
 */

import { z } from 'zod';

// ============================================
// Base Schemas
// ============================================

export const MediaItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  type: z.enum(['image', 'video']),
  url: z.string().url(),
  order: z.number().int().min(0).default(0),
});

export const ProjectSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  category: z.enum(['Development', 'Drone', 'Mixed']),
  thumbnail: z.string().url(),
  created_at: z.string().or(z.date()).transform(v => typeof v === 'string' ? v : v.toISOString()),
  featured: z.boolean().default(false),
  technologies: z.array(z.string()).default([]),
  media: z.array(MediaItemSchema).default([]),
});

export const SkillSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string().min(1),
  level: z.number().int().min(0).max(100),
  category: z.enum(['Frontend', 'Backend', 'DevOps', 'Drone', 'Editing']),
});

export const AboutDataSchema = z.object({
  bio: z.string(),
  profile_image: z.string().url().or(z.string()),
  drone_image: z.string().url().or(z.string()),
  email: z.string().email(),
  location: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  socials: z.object({
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
});

// ============================================
// Settings Schema
// ============================================

export const SiteSettingsSchema = z.object({
  hero_title: z.string().default('ACTIVE'),
  hero_subtitle: z.string().default('THEORY'),
  hero_tagline: z.string().default('Digital Experiences & Aerial Visuals'),
  about_title: z.string().default('THE MIND BEHIND'),
  about_quote: z.string().optional(),
  profile_image: z.string().optional(),
  drone_image: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  footer_text: z.string().optional(),
  copyright_year: z.number().optional(),
  version: z.string().optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
});

// ============================================
// CV Data Schemas
// ============================================

export const ExperienceSchema = z.object({
  id: z.number(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  is_current: z.boolean(),
  description: z.string(),
});

export const EducationSchema = z.object({
  id: z.number(),
  degree: z.string(),
  institution: z.string(),
  location: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  is_current: z.boolean(),
  description: z.string(),
  gpa: z.string().optional(),
});

export const CVSkillSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: z.string(),
  category: z.string(),
  percentage: z.number().min(0).max(100),
});

export const LanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: z.string(),
});

export const CertificationSchema = z.object({
  id: z.number(),
  name: z.string(),
  issuer: z.string(),
  issue_date: z.string(),
  expiry_date: z.string().nullable(),
  credential_id: z.string(),
  credential_url: z.string(),
});

export const CVProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  technologies: z.string(),
  url: z.string().optional(),
  github_url: z.string().optional(),
  is_ongoing: z.boolean(),
});

export const InterestSchema = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string(),
  description: z.string(),
});

export const PersonalInfoSchema = z.object({
  full_name: z.string(),
  job_title: z.string(),
  email: z.string().email(),
  phone: z.string(),
  location: z.string(),
  profile_image: z.string(),
  summary: z.string(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

export const CVDataSchema = z.object({
  personal_info: PersonalInfoSchema,
  experiences: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(CVSkillSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  projects: z.array(CVProjectSchema).default([]),
  interests: z.array(InterestSchema).default([]),
});

// ============================================
// Auth Schemas
// ============================================

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  user_type: z.enum(['admin', 'registered', 'visitor']),
  first_name: z.string(),
  last_name: z.string(),
  profile_image: z.string().nullable(),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
});

export const RegisterResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
});

// ============================================
// Pagination Schema
// ============================================

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => 
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(itemSchema),
  });

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validate data against a schema, returning the data or throwing an error
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate data, returning either the validated data or null
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn('Validation failed:', result.error.errors);
  return null;
}

/**
 * Validate an array of items
 */
export function validateArray<T>(schema: z.ZodSchema<T>, data: unknown[]): T[] {
  return data.map(item => schema.parse(item));
}