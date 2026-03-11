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
  url: z.string().url().optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  caption: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
  likes_count: z.number().int().min(0).default(0),
  is_liked: z.boolean().default(false),
});

export const ProjectSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? parseInt(v, 10) : v),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  category: z.enum(['Développement', 'Drone', 'Mélangé']),
  thumbnail: z.string().url(),
  created_at: z.string().or(z.date()).transform(v => typeof v === 'string' ? v : v.toISOString()),
  featured: z.boolean().default(false),
  is_active: z.boolean().optional().default(true),
  show_registration: z.boolean().optional().default(false),
  technologies: z.array(z.string()).optional().default([]),
  media: z.array(MediaItemSchema).transform(items => {
    const seenIds = new Set();
    return items.filter(item => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
  }).default([]),
  likes_count: z.number().int().min(0).default(0),
  views_count: z.number().int().min(0).default(0),
  is_liked: z.boolean().default(false),
});

export const SkillSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  category: z.string(),
  percentage: z.number().int().min(0).max(100),
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
  site_name: z.string().optional(),
  site_title: z.string().optional(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  site_description: z.string().optional(),
  
  // Theme Settings
  primary_color: z.string().default('#6366f1'),
  secondary_color: z.string().default('#8b5cf6'),
  accent_color: z.string().default('#ec4899'),
  background_color: z.string().default('#0a0a0a'),
  cursor_theme: z.string().default('default'),
  cursor_size: z.number().default(20),
  custom_cursor_color: z.string().default('#6366f1'),
  cursor_enabled_mobile: z.boolean().default(false),
  
  hero_title: z.string().default('ACTIVE'),
  hero_subtitle: z.string().default('THEORY'),
  hero_tagline: z.string().default('Digital Experiences & Aerial Visuals'),
  about_title: z.string().default('THE MIND BEHIND'),
  about_quote: z.string().optional(),
  profile_image: z.string().optional(),
  drone_image: z.string().optional(),
  drone_video_url: z.string().optional().or(z.null()).transform(v => v || ''),
  
  // Footer
  footer_text: z.string().optional(),
  copyright_year: z.number().default(2024),
  version: z.string().default('1.0.0'),
  designer_name: z.string().default('WAEL'),
  copyright_text: z.string().default('Your Name. All rights reserved.'),
  show_location: z.boolean().default(true),
  footer_background_video: z.string().optional().or(z.null()).transform(v => v || ''),
  location: z.string().optional(),
  latitude: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? parseFloat(v) : v).optional(),
  longitude: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? parseFloat(v) : v).optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  nav_work_label: z.string().default('Work'),
  nav_about_label: z.string().default('About'),
  nav_contact_label: z.string().default('Contact'),
  
  // CV Personal Info
  cv_full_name: z.string().optional(),
  cv_job_title: z.string().optional(),
  cv_email: z.string().email().optional().or(z.literal('')),
  cv_phone: z.string().optional(),
  cv_location: z.string().optional(),
  cv_profile_image: z.string().optional(),
  cv_summary: z.string().optional(),
  
  // Email Settings
  email_host: z.string().optional(),
  email_port: z.number().optional(),
  email_host_user: z.string().email().optional().or(z.literal('')),
  email_host_password: z.string().optional(),
  default_from_email: z.string().email().optional().or(z.literal('')),
  
   // Contact
   contact_email: z.string().email().optional().or(z.literal('')),
   contact_phone: z.string().optional(),
   contact_title: z.string().default('Créons Ensemble'),
   contact_subtitle: z.string().default('Que vous ayez besoin d\'un ingénieur full-stack ou d\'un cinéaste drone, je suis prêt pour le prochain défi.'),
   contact_form_placeholder_name: z.string().default('Votre Nom'),
   contact_form_placeholder_email: z.string().default('nom@email.com'),
   contact_form_placeholder_subject: z.string().default('Sujet'),
   contact_form_placeholder_message: z.string().default('Parlez-moi de votre vision...'),
   contact_form_button_text: z.string().default('Envoyer le Message'),
  
  // SEO
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  
  // OAuth Settings
  google_client_id: z.string().optional(),
  google_client_secret: z.string().optional(),
  facebook_app_id: z.string().optional(),
  facebook_app_secret: z.string().optional(),
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
  percentage: z.number().min(0).max(100),
});

export const CertificationSchema = z.object({
  id: z.number(),
  name: z.string(),
  issuing_organization: z.string(),
  issue_date: z.string(),
  expiration_date: z.string().nullable(),
  credential_id: z.string(),
  credential_url: z.string(),
});

export const CVProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  github_url: z.string().optional(),
  live_url: z.string().optional(),
  image_url: z.string().optional(),
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
  user: UserSchema,
});

export const RegisterResponseSchema = z.object({
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