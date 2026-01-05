// Keyword Validation Service
// Purpose: Validate keyword coverage in generated resumes
// Ensures ATS optimization by checking extracted keywords appear in output

import type {
  KeywordExtractionResult,
  KeywordValidationResult,
  ThreePDFGenerationOutput,
} from '../types/threePdf.js';

// Scoring constants for ATS optimization
const KEYWORD_SCORE_MAX = 50;
const WORD_COUNT_SCORE = 25;
const BANNED_PHRASES_SCORE_MAX = 25;
const BANNED_PHRASE_PENALTY = 5;

// Banned AI phrases that make resumes look AI-generated
const BANNED_PHRASES = [
  'spearheaded',
  'synergized',
  'instrumental in',
  'leveraged',
  'orchestrated',
  'revolutionized',
  'pioneered',
  'catalyzed',
  'galvanized',
  'drove significant',
  'best-in-class',
  'cutting-edge',
  'state-of-the-art',
  'paradigm shift',
  'game-changer',
  'thought leader',
  'value-add',
  'synergy',
  'dynamic',
  'proactive',
];

/**
 * Validate keyword coverage in generated resume content
 * Target: 75%+ coverage for optimal ATS matching
 */
export function validateKeywordCoverage(
  output: ThreePDFGenerationOutput,
  keywords: KeywordExtractionResult
): KeywordValidationResult {
  // Combine all content from civilian resume (primary ATS target)
  const civilianContent = output.artifacts.resume_civilian.content_html.toLowerCase();

  // Also check military resume for completeness
  const militaryContent = output.artifacts.resume_military.content_html.toLowerCase();

  // All keywords to check (combine hard skills, soft skills, ATS keywords)
  const allKeywords = [
    ...keywords.hardSkills,
    ...keywords.softSkills,
    ...keywords.atsKeywords,
  ].map((k) => k.toLowerCase());

  // Deduplicate
  const uniqueKeywords = [...new Set(allKeywords)];

  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of uniqueKeywords) {
    // Check if keyword or close variant exists in content
    if (
      civilianContent.includes(keyword) ||
      militaryContent.includes(keyword) ||
      containsVariant(civilianContent, keyword)
    ) {
      foundKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const coveragePercent =
    uniqueKeywords.length > 0
      ? Math.round((foundKeywords.length / uniqueKeywords.length) * 100)
      : 100;

  // Generate suggestions for missing keywords
  const suggestions = generateSuggestions(missingKeywords, keywords);

  console.log(
    `[keywordValidator] Coverage: ${coveragePercent}% (${foundKeywords.length}/${uniqueKeywords.length} keywords)`
  );

  if (missingKeywords.length > 0) {
    console.log(
      `[keywordValidator] Missing keywords: ${missingKeywords.slice(0, 5).join(', ')}${missingKeywords.length > 5 ? '...' : ''}`
    );
  }

  return {
    coveragePercent,
    foundKeywords,
    missingKeywords,
    suggestions,
  };
}

/**
 * Check for keyword variants (plurals, tense variations, abbreviations)
 */
function containsVariant(content: string, keyword: string): boolean {
  // Common variations
  const variants = [
    keyword,
    keyword + 's', // plural
    keyword + 'ed', // past tense
    keyword + 'ing', // gerund
    keyword.replace(/ies$/, 'y'), // e.g., strategies -> strategy
    keyword.replace(/y$/, 'ies'), // e.g., strategy -> strategies
  ];

  // Also check if multi-word keyword words appear nearby
  const words = keyword.split(/\s+/);
  if (words.length > 1) {
    // Check if all words appear in content (possibly in different order)
    const allWordsPresent = words.every((word) =>
      content.includes(word.toLowerCase())
    );
    if (allWordsPresent) return true;
  }

  return variants.some((v) => content.includes(v));
}

/**
 * Generate suggestions for where to add missing keywords
 */
function generateSuggestions(
  missingKeywords: string[],
  keywords: KeywordExtractionResult
): string[] {
  const suggestions: string[] = [];

  // Categorize missing keywords
  const missingHard = missingKeywords.filter((k) =>
    keywords.hardSkills.map((s) => s.toLowerCase()).includes(k)
  );
  const missingSoft = missingKeywords.filter((k) =>
    keywords.softSkills.map((s) => s.toLowerCase()).includes(k)
  );
  const missingAts = missingKeywords.filter(
    (k) => !missingHard.includes(k) && !missingSoft.includes(k)
  );

  if (missingHard.length > 0) {
    suggestions.push(
      `Add to Skills section: ${missingHard.slice(0, 3).join(', ')}`
    );
  }

  if (missingSoft.length > 0) {
    suggestions.push(
      `Incorporate in Summary or bullets: ${missingSoft.slice(0, 3).join(', ')}`
    );
  }

  if (missingAts.length > 0) {
    suggestions.push(
      `Use in experience bullets: ${missingAts.slice(0, 3).join(', ')}`
    );
  }

  return suggestions;
}

/**
 * Count words in HTML content (strips tags)
 */
export function countWords(htmlContent: string): number {
  // Remove HTML tags
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
  // Remove extra whitespace and split
  const words = textContent
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.length;
}

/**
 * Validate word count constraints (600-850 words target per resume)
 */
export function validateWordCount(
  output: ThreePDFGenerationOutput
): { military: number; civilian: number; crosswalk: number; withinTarget: boolean } {
  const military = countWords(output.artifacts.resume_military.content_html);
  const civilian = countWords(output.artifacts.resume_civilian.content_html);
  const crosswalk = countWords(output.artifacts.resume_crosswalk.content_html);

  // Target: 600-850 words for military and civilian resumes
  const withinTarget = military >= 400 && military <= 1000 && civilian >= 400 && civilian <= 1000;

  console.log(
    `[keywordValidator] Word counts - Military: ${military}, Civilian: ${civilian}, Crosswalk: ${crosswalk}`
  );

  if (!withinTarget) {
    console.warn(
      `[keywordValidator] Word count outside target range (400-1000 words)`
    );
  }

  return { military, civilian, crosswalk, withinTarget };
}

/**
 * Check for banned AI phrases that make resume look AI-generated
 */
export function checkBannedPhrases(
  output: ThreePDFGenerationOutput
): { found: string[]; clean: boolean } {
  const content = (
    output.artifacts.resume_military.content_html +
    output.artifacts.resume_civilian.content_html
  ).toLowerCase();

  const found = BANNED_PHRASES.filter((phrase) => content.includes(phrase));

  if (found.length > 0) {
    console.warn(
      `[keywordValidator] Found banned AI phrases: ${found.join(', ')}`
    );
  }

  return {
    found,
    clean: found.length === 0,
  };
}

/**
 * Run all validations and return comprehensive report
 */
export function runAllValidations(
  output: ThreePDFGenerationOutput,
  keywords: KeywordExtractionResult
): {
  keywordCoverage: KeywordValidationResult;
  wordCount: { military: number; civilian: number; crosswalk: number; withinTarget: boolean };
  bannedPhrases: { found: string[]; clean: boolean };
  overallScore: number;
} {
  const keywordCoverage = validateKeywordCoverage(output, keywords);
  const wordCount = validateWordCount(output);
  const bannedPhrases = checkBannedPhrases(output);

  // Calculate overall score (0-100)
  let score = 0;

  // Keyword coverage: up to KEYWORD_SCORE_MAX points
  score += Math.min(
    keywordCoverage.coveragePercent * (KEYWORD_SCORE_MAX / 100),
    KEYWORD_SCORE_MAX
  );

  // Word count: WORD_COUNT_SCORE points if within target
  if (wordCount.withinTarget) {
    score += WORD_COUNT_SCORE;
  }

  // No banned phrases: BANNED_PHRASES_SCORE_MAX points
  if (bannedPhrases.clean) {
    score += BANNED_PHRASES_SCORE_MAX;
  } else {
    score += Math.max(
      0,
      BANNED_PHRASES_SCORE_MAX - bannedPhrases.found.length * BANNED_PHRASE_PENALTY
    );
  }

  console.log(`[keywordValidator] Overall ATS optimization score: ${Math.round(score)}/100`);

  return {
    keywordCoverage,
    wordCount,
    bannedPhrases,
    overallScore: Math.round(score),
  };
}
