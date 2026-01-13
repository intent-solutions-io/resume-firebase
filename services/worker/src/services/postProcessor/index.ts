/**
 * Resume HTML Post-Processor
 *
 * Orchestrates HTML parsing, validation, fixing, and CSS hardening
 * for AI-generated resume HTML before PDF conversion.
 *
 * This layer ensures consistent formatting regardless of AI output variations.
 */

import { parseHtml, serializeHtml } from './htmlParser.js';
import {
  fixHeaderCentering,
  fixEducationSpacing,
  fixExperienceLayout,
  fixSkillsFormat,
} from './formatFixers.js';
import { injectHardenedCss } from './cssHardener.js';
import type {
  PostProcessorOptions,
  PostProcessorResult,
  ValidationIssue,
  FixerConfig,
} from './types.js';

// Configure which fixers to run
const FIXERS: FixerConfig[] = [
  { name: 'headerCentering', fn: fixHeaderCentering, enabled: true },
  { name: 'educationSpacing', fn: fixEducationSpacing, enabled: true },
  { name: 'experienceLayout', fn: fixExperienceLayout, enabled: true },
  { name: 'skillsFormat', fn: fixSkillsFormat, enabled: true },
];

/**
 * Post-process AI-generated resume HTML
 *
 * @param rawHtml - The HTML string from Vertex AI
 * @param options - Configuration options
 * @returns Processed HTML with fixes applied and CSS hardened
 */
export async function postProcessResumeHtml(
  rawHtml: string,
  options: PostProcessorOptions
): Promise<PostProcessorResult> {
  const issues: ValidationIssue[] = [];
  const fixesApplied: string[] = [];
  let cssInjected = false;

  // Step 1: Parse HTML
  let doc: Document;
  try {
    doc = parseHtml(rawHtml);
  } catch (parseError) {
    // If parsing fails, return original with error
    console.error('[postProcessor] Failed to parse HTML:', parseError);
    return {
      html: rawHtml,
      issues: [
        {
          severity: 'error',
          code: 'PARSE_FAILED',
          message: `Failed to parse HTML: ${parseError}`,
          fixed: false,
        },
      ],
      fixesApplied: [],
      cssInjected: false,
      parseSucceeded: false,
    };
  }

  console.log(`[postProcessor] Parsing succeeded for ${options.resumeType} resume`);

  // Step 2: Apply fixers (each wrapped in try-catch for resilience)
  for (const fixer of FIXERS) {
    if (!fixer.enabled) continue;

    try {
      fixer.fn(doc);
      fixesApplied.push(fixer.name);
      console.log(`[postProcessor] Applied fixer: ${fixer.name}`);
    } catch (fixError) {
      console.warn(`[postProcessor] Fixer ${fixer.name} failed:`, fixError);
      issues.push({
        severity: 'warning',
        code: `FIX_FAILED_${fixer.name.toUpperCase()}`,
        message: `Fixer ${fixer.name} failed: ${fixError}`,
        fixed: false,
      });
    }
  }

  // Step 3: Inject hardened CSS
  try {
    injectHardenedCss(doc);
    cssInjected = true;
    console.log('[postProcessor] CSS hardening applied');
  } catch (cssError) {
    console.warn('[postProcessor] CSS injection failed:', cssError);
    issues.push({
      severity: 'warning',
      code: 'CSS_INJECTION_FAILED',
      message: `CSS injection failed: ${cssError}`,
      fixed: false,
    });
  }

  // Step 4: Serialize back to HTML
  const processedHtml = serializeHtml(doc);

  console.log(
    `[postProcessor] Complete: ${fixesApplied.length} fixes applied, ` +
      `${issues.length} issues, CSS injected: ${cssInjected}`
  );

  return {
    html: processedHtml,
    issues,
    fixesApplied,
    cssInjected,
    parseSucceeded: true,
  };
}

// Re-export types for convenience
export type { PostProcessorOptions, PostProcessorResult, ValidationIssue } from './types.js';
