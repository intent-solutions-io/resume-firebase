// Structured Resume Data Types
// Architecture: AI outputs JSON → DOCX generator creates Word documents
// No HTML middleman - direct to printable format

/**
 * Contact information for resume header
 */
export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  linkedin?: string;
}

/**
 * Single work experience entry
 */
export interface ExperienceEntry {
  organization: string;      // "U.S. Army" or "423d Security Forces Squadron"
  location: string;          // "Fort Liberty, NC" or "RAF Alconbury, UK"
  title: string;             // "Operations Manager" or "Flight Chief"
  startDate: string;         // "Jan 2020"
  endDate: string;           // "Dec 2023" or "Present"
  bullets: string[];         // Achievement bullets with metrics
}

/**
 * Education entry
 */
export interface EducationEntry {
  institution: string;
  location?: string;
  degree: string;
  field?: string;
  graduationDate?: string;
  honors?: string;
}

/**
 * Certification or training
 */
export interface CertificationEntry {
  name: string;
  issuer?: string;
  date?: string;
}

/**
 * Single resume content (Military OR Civilian version)
 */
export interface ResumeContent {
  contact: ContactInfo;
  summary: string;           // 2-4 sentence professional summary
  skills: string[];          // Core skills list
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications?: CertificationEntry[];
  awards?: string[];
}

/**
 * Translation pair for crosswalk document
 */
export interface TranslationPair {
  military: string;
  civilian: string;
}

/**
 * Crosswalk section for a single role
 */
export interface CrosswalkRole {
  roleTitle: string;
  location: string;
  translations: TranslationPair[];
  metricsPreserved: string[];  // Numbers that stayed the same
}

/**
 * Crosswalk document content
 */
export interface CrosswalkContent {
  candidateName: string;
  roles: CrosswalkRole[];
  skillTranslations: TranslationPair[];
  acronymGlossary: Array<{ acronym: string; definition: string }>;
}

/**
 * Complete structured output from AI
 * This replaces the HTML-heavy ThreePDFGenerationOutput
 */
export interface StructuredResumeOutput {
  military: ResumeContent;
  civilian: ResumeContent;
  crosswalk: CrosswalkContent;
  metadata: {
    targetRole: string;
    bulletsTranslated: number;
    termsMapped: number;
    keywordsUsed: string[];
  };
}

/**
 * Output paths for generated DOCX files
 */
export interface ResumeDocxPaths {
  militaryDocxPath: string;
  civilianDocxPath: string;
  crosswalkDocxPath: string;
}
