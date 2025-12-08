/**
 * Shared Types for Resume Generator
 * Used by API, Worker, and Frontend
 */

// Case status enum
export type CaseStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Document status enum
export type DocumentStatus = 'pending' | 'uploaded' | 'processed' | 'failed';

// Artifact types
export type ArtifactType = 'resume_json' | 'resume_pdf';

/**
 * Case entity
 */
export interface Case {
  id: string;
  name: string;
  email: string;
  targetRole?: string;
  status: CaseStatus;
  currentStep?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Case document entity
 */
export interface CaseDocument {
  id: string;
  caseId: string;
  fileName: string;
  contentType?: string;
  size?: number;
  status: DocumentStatus;
  uploadedAt: string;
  processedAt?: string;
}

/**
 * Case artifact entity
 */
export interface CaseArtifact {
  id: string;
  caseId: string;
  name: string;
  fileName: string;
  type: ArtifactType;
  size: number;
  createdAt: string;
}

/**
 * Case event entity (for audit trail)
 */
export interface CaseEvent {
  id: string;
  caseId: string;
  type: string;
  status?: CaseStatus;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Resume JSON structure (federal_basic schema)
 */
export interface ResumeJson {
  metadata: {
    version: string;
    generatedAt: string;
    targetRole?: string;
  };
  contact: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillsSection;
  projects?: ProjectEntry[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  location?: string;
  graduationDate?: string;
  gpa?: string;
  honors?: string[];
}

export interface SkillsSection {
  technical: string[];
  soft: string[];
  certifications: string[];
  languages: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

/**
 * API request/response types
 */
export interface CreateCaseRequest {
  name: string;
  email: string;
  targetRole?: string;
}

export interface CreateCaseResponse {
  caseId: string;
  status: CaseStatus;
}

export interface RequestUploadUrlsRequest {
  fileNames: string[];
}

export interface RequestUploadUrlsResponse {
  urls: Array<{
    fileName: string;
    uploadUrl: string;
    documentId: string;
  }>;
}

export interface GetCaseStatusResponse {
  caseId: string;
  status: CaseStatus;
  currentStep?: string;
  progress?: number;
  artifacts: Array<{
    id: string;
    name: string;
    type: ArtifactType;
    size: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface GetDownloadUrlResponse {
  downloadUrl: string;
}

/**
 * Worker task payloads
 */
export interface ProcessCasePayload {
  caseId: string;
}

export interface GenerateArtifactPayload {
  caseId: string;
  artifactType: ArtifactType;
}
