/**
 * Post-Processor Types
 * Defines interfaces for the resume HTML post-processing pipeline
 */

export type ResumeType = 'military' | 'civilian' | 'crosswalk';

export interface PostProcessorOptions {
  resumeType: ResumeType;
  strictMode?: boolean; // Throw on validation failures (default: false)
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  element?: string; // CSS selector of affected element
  fixed: boolean;
}

export interface PostProcessorResult {
  html: string;
  issues: ValidationIssue[];
  fixesApplied: string[];
  cssInjected: boolean;
  parseSucceeded: boolean;
}

export interface FixerFunction {
  (doc: Document): void;
}

export interface FixerConfig {
  name: string;
  fn: FixerFunction;
  enabled: boolean;
}
