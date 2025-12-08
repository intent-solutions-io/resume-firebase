/**
 * Shared Zod Schemas for Resume Generator
 * Validation schemas used by API and Worker
 */

import { z } from 'zod';

// Case status enum
export const caseStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
]);

// Review status enum (human-in-the-loop)
export const reviewStatusSchema = z.enum([
  'unreviewed',
  'approved',
  'rejected',
  'needs_fix',
]);

// Document status enum
export const documentStatusSchema = z.enum([
  'pending',
  'uploaded',
  'processed',
  'failed',
]);

// Extraction status enum (for tracking OCR needs)
export const extractionStatusSchema = z.enum([
  'pending',
  'completed',
  'needs_ocr',
  'failed',
]);

// Artifact type enum
export const artifactTypeSchema = z.enum(['resume_json', 'resume_pdf']);

/**
 * API Request Schemas
 */

export const createCaseSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  targetRole: z.string().max(200).optional(),
});

export const requestUploadUrlsSchema = z.object({
  fileNames: z
    .array(z.string().min(1).max(255))
    .min(1)
    .max(10, 'Maximum 10 files allowed'),
});

/**
 * Worker Payload Schemas
 */

export const processCasePayloadSchema = z.object({
  caseId: z.string().uuid(),
});

export const generateArtifactPayloadSchema = z.object({
  caseId: z.string().uuid(),
  artifactType: artifactTypeSchema,
});

/**
 * Reviewer Console Schemas (Human-in-the-Loop)
 */

export const reviewerUpdateSchema = z.object({
  status: reviewStatusSchema,
  notes: z.string().max(2000).optional(),
});

/**
 * Resume JSON Schema (federal_basic)
 */

export const experienceEntrySchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string(),
  achievements: z.array(z.string()),
});

export const educationEntrySchema = z.object({
  degree: z.string(),
  institution: z.string(),
  location: z.string().optional(),
  graduationDate: z.string().optional(),
  gpa: z.string().optional(),
  honors: z.array(z.string()).optional(),
});

export const skillsSectionSchema = z.object({
  technical: z.array(z.string()),
  soft: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
});

export const projectEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  url: z.string().url().optional(),
});

export const resumeJsonSchema = z.object({
  metadata: z.object({
    version: z.string(),
    generatedAt: z.string(),
    targetRole: z.string().optional(),
  }),
  contact: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }),
  summary: z.string(),
  experience: z.array(experienceEntrySchema),
  education: z.array(educationEntrySchema),
  skills: skillsSectionSchema,
  projects: z.array(projectEntrySchema).optional(),
});

/**
 * File validation
 */

// Document file extensions
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

// Image file extensions (prep for future OCR/Document AI)
export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.heic'];

// All allowed file extensions (documents + images)
export const ALLOWED_FILE_EXTENSIONS = [
  ...ALLOWED_DOCUMENT_EXTENSIONS,
  ...ALLOWED_IMAGE_EXTENSIONS,
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_CASE = 10;

/**
 * Check if file is an image (needs OCR)
 */
export function isImageFile(fileName: string): boolean {
  const ext = '.' + (fileName.toLowerCase().split('.').pop() || '');
  return ALLOWED_IMAGE_EXTENSIONS.includes(ext);
}

export function isValidFileName(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  return ALLOWED_FILE_EXTENSIONS.some((allowed) =>
    allowed.toLowerCase().endsWith(ext || '')
  );
}

export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Type exports from schemas
 * Note: ProcessCasePayload and GenerateArtifactPayload are exported from types/index.ts
 */
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type RequestUploadUrlsInput = z.infer<typeof requestUploadUrlsSchema>;
export type ResumeJsonInput = z.infer<typeof resumeJsonSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewerUpdateInput = z.infer<typeof reviewerUpdateSchema>;
export type ExtractionStatus = z.infer<typeof extractionStatusSchema>;
