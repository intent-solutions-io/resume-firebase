// TypeScript Types for 3-PDF Resume Bundle System
// Phase: Prototype (Checkpoint 1)
// Purpose: New types for 3-artifact output (Military, Civilian, Crosswalk PDFs)

/**
 * Single resume artifact (HTML document ready for PDF rendering)
 */
export interface ResumeArtifact {
  format: 'html';
  filename: string;
  content_html: string;
}

/**
 * Complete set of 3 resume artifacts
 */
export interface ResumeArtifacts {
  resume_military: ResumeArtifact;
  resume_civilian: ResumeArtifact;
  resume_crosswalk: ResumeArtifact;
}

/**
 * PDF rendering hints from Vertex AI
 */
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

/**
 * Extracted keywords from target job description
 */
export interface KeywordExtractionResult {
  hardSkills: string[];      // Top 5-10 technical/hard skills
  softSkills: string[];      // Top 5-10 soft skills
  atsKeywords: string[];     // All ATS-relevant keywords
  jobTitle: string;          // Extracted job title
  industry: string;          // Detected industry
}

/**
 * Keyword coverage validation result
 */
export interface KeywordValidationResult {
  coveragePercent: number;           // Target: 75%+
  foundKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

/**
 * Quality assurance metadata from resume generation
 */
export interface QAMetadata {
  target_role_used: string;
  bullets_translated_count: number;
  terms_mapped_count: number;
  placeholders_used: boolean;
  no_fabrication_confirmed: boolean;
  // New keyword-related fields
  keywordCoverage?: KeywordValidationResult;
  wordCount?: {
    military: number;
    civilian: number;
    crosswalk: number;
  };
}

/**
 * Complete output from 3-PDF generation (Vertex AI response)
 */
export interface ThreePDFGenerationOutput {
  artifacts: ResumeArtifacts;
  render_hints: RenderHints;
  qa: QAMetadata;
}

/**
 * Storage paths for exported PDFs
 */
export interface ThreePDFPaths {
  militaryPdfPath: string;
  civilianPdfPath: string;
  crosswalkPdfPath: string;
}

/**
 * Input for 3-PDF generation
 */
export interface ThreePDFGenerationInput {
  candidateId: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  branch: string;
  rank?: string;
  mos?: string;
  documentTexts: Array<{
    type: string;
    fileName: string;
    text: string;
  }>;
  // New: Target job for keyword optimization
  targetJobDescription?: string;
  extractedKeywords?: KeywordExtractionResult;
}
