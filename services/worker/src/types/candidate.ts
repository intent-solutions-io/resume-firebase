// Operation Hired - Candidate Types for AI Pipeline
// Phase 1.9: AI Profile & Resume Generation

import { Timestamp } from '@google-cloud/firestore';

// ============================================
// Candidate Profile Types (AI Extraction)
// ============================================

export interface ServiceRole {
  rawTitle: string;
  standardizedTitle?: string;
  unit?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  responsibilitiesRaw: string[];
  achievementsRaw: string[];
}

export interface CandidateProfile {
  candidateId: string;
  name?: string;
  email?: string;
  branch?: string;
  rank?: string;
  mosCode?: string;
  serviceStartDate?: string;
  serviceEndDate?: string;
  clearance?: string;
  roles: ServiceRole[];
  education?: string[];
  certifications?: string[];
  awards?: string[];
  skillsRaw?: string[];
  createdAt: Timestamp | string;
  modelName: string;
  modelVersion: string;
}

// ============================================
// Generated Resume Types
// ============================================

export interface ResumeExperience {
  title: string;
  company: string;
  location?: string;
  dates?: string;
  bullets: string[];
}

export interface GeneratedResume {
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education?: string;
  certifications?: string[];
  createdAt: Timestamp | string;
  modelName: string;
  modelVersion: string;
  // Phase: 3-PDF Resume Bundle (Checkpoint 3)
  threePdfPaths?: ThreePDFPaths;
}

// ============================================
// 3-PDF Resume Bundle Types (Phase: Checkpoint 3)
// ============================================

export interface ThreePDFPaths {
  militaryPdfPath: string;
  civilianPdfPath: string;
  crosswalkPdfPath: string;
}

// ============================================
// Candidate Document Types (from Phase 1.8)
// ============================================

export type CandidateStatus =
  | 'created'
  | 'docs_uploaded'
  | 'processing'
  | 'resume_ready'
  | 'error';

export type MilitaryBranch =
  | 'Army'
  | 'Navy'
  | 'Air Force'
  | 'Marines'
  | 'Coast Guard'
  | 'Space Force';

export type DocumentType =
  | 'dd214'
  | 'erb_orb'
  | 'evaluation'
  | 'award'
  | 'training'
  | 'resume'
  | 'other';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  branch: MilitaryBranch;
  rank?: string;
  mos?: string;
  status: CandidateStatus;
  errorMessage?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  firstSlackNotifiedAt?: Timestamp | string; // Phase 2.1: de-duplication
}

export interface CandidateDocument {
  id: string;
  candidateId: string;
  type: DocumentType;
  fileName: string;
  storagePath: string;
  uploadedAt: Timestamp | string;
}

// ============================================
// Text Extraction Types
// ============================================

export interface ExtractedDocument {
  type: DocumentType;
  fileName: string;
  text: string;
}

// ============================================
// AI Generation Input/Output
// ============================================

export interface GenerationInput {
  candidateId: string;
  name: string;
  email: string;
  branch: string;
  rank?: string;
  mos?: string;
  documentTexts: ExtractedDocument[];
  targetRole?: string;
}

export interface GenerationOutput {
  profile: Omit<CandidateProfile, 'createdAt' | 'modelName' | 'modelVersion'>;
  resume: Omit<GeneratedResume, 'createdAt' | 'modelName' | 'modelVersion'>;
}

// ============================================
// 3-PDF Resume Bundle Types
// ============================================

export interface ResumeArtifact {
  format: 'html';
  filename: string;
  content_html: string;
}

export interface RenderHints {
  page_size: 'LETTER';
  margins_in: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  font_stack: string;
}

export interface BundleQA {
  target_role_used: string;
  bullets_translated_count: number;
  terms_mapped_count: number;
  placeholders_used: boolean;
  no_fabrication_confirmed: boolean;
}

export interface ResumeBundleOutput {
  artifacts: {
    resume_military: ResumeArtifact;
    resume_civilian: ResumeArtifact;
    resume_crosswalk: ResumeArtifact;
  };
  render_hints: RenderHints;
  qa: BundleQA;
}

export interface BundleGenerationOutput {
  profile: Omit<CandidateProfile, 'createdAt' | 'modelName' | 'modelVersion'>;
  bundle: ResumeBundleOutput;
}
