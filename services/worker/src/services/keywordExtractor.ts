// Keyword Extraction Service for Target Job Descriptions
// Purpose: Extract hard skills, soft skills, and ATS keywords from job postings
// Used to optimize resume generation for specific roles

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import type { KeywordExtractionResult } from '../types/threePdf.js';

// Configuration
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
// Use fast model for keyword extraction (simpler task)
const MODEL_NAME = 'gemini-2.0-flash-001';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const model: GenerativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
});

// Focused prompt for keyword extraction
const EXTRACTION_PROMPT = `You are an ATS (Applicant Tracking System) keyword extraction expert.

Analyze the provided job description and extract:
1. Top 5-10 HARD SKILLS (technical skills, tools, certifications, software)
2. Top 5-10 SOFT SKILLS (leadership, communication, teamwork, etc.)
3. All ATS-relevant KEYWORDS (terms that would trigger ATS matching)
4. The exact JOB TITLE from the posting
5. The INDUSTRY sector

RULES:
- Extract ONLY keywords explicitly mentioned or clearly implied in the job description
- Prioritize skills that appear multiple times (high importance)
- Include both spelled-out terms AND acronyms (e.g., "Project Management Professional" AND "PMP")
- For hard skills, include specific tools, technologies, and certifications
- For soft skills, include leadership, communication, and behavioral competencies
- ATS keywords should include action verbs, metrics expectations, and industry terms

OUTPUT FORMAT (strict JSON, no markdown):
{
  "hardSkills": ["skill1", "skill2", ...],
  "softSkills": ["skill1", "skill2", ...],
  "atsKeywords": ["keyword1", "keyword2", ...],
  "jobTitle": "Extracted Job Title",
  "industry": "Industry Sector"
}

Return ONLY the JSON object, no explanations.`;

/**
 * Extract keywords from a job description for ATS optimization
 */
export async function extractJobKeywords(
  jobDescription: string
): Promise<KeywordExtractionResult> {
  if (!jobDescription || jobDescription.trim().length < 50) {
    console.log('[keywordExtractor] Job description too short or empty, returning defaults');
    return getDefaultKeywords();
  }

  console.log(`[keywordExtractor] Extracting keywords from job description (${jobDescription.length} chars)`);

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: EXTRACTION_PROMPT },
            { text: `\n\nJOB DESCRIPTION:\n${jobDescription}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent extraction
        maxOutputTokens: 2048,
      },
    });

    const response = result.response;
    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.warn('[keywordExtractor] Empty response from Gemini, using defaults');
      return getDefaultKeywords();
    }

    // Parse JSON response
    const parsed = parseKeywordResponse(textContent);

    console.log(`[keywordExtractor] Extracted ${parsed.hardSkills.length} hard skills, ${parsed.softSkills.length} soft skills, ${parsed.atsKeywords.length} ATS keywords`);
    console.log(`[keywordExtractor] Target role: ${parsed.jobTitle} (${parsed.industry})`);

    return parsed;
  } catch (error) {
    console.error('[keywordExtractor] Extraction failed:', error);
    return getDefaultKeywords();
  }
}

/**
 * Parse and validate keyword extraction response
 */
function parseKeywordResponse(text: string): KeywordExtractionResult {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Validate and normalize
    return {
      hardSkills: Array.isArray(parsed.hardSkills)
        ? parsed.hardSkills.slice(0, 10).map((s: string) => s.trim())
        : [],
      softSkills: Array.isArray(parsed.softSkills)
        ? parsed.softSkills.slice(0, 10).map((s: string) => s.trim())
        : [],
      atsKeywords: Array.isArray(parsed.atsKeywords)
        ? parsed.atsKeywords.slice(0, 30).map((s: string) => s.trim())
        : [],
      jobTitle: typeof parsed.jobTitle === 'string'
        ? parsed.jobTitle.trim()
        : 'Operations Manager',
      industry: typeof parsed.industry === 'string'
        ? parsed.industry.trim()
        : 'General',
    };
  } catch (parseError) {
    console.error('[keywordExtractor] JSON parse error:', parseError);
    console.error('[keywordExtractor] Raw response:', text.substring(0, 300));
    return getDefaultKeywords();
  }
}

/**
 * Default keywords for military-to-civilian transitions when no job description provided
 */
function getDefaultKeywords(): KeywordExtractionResult {
  return {
    hardSkills: [
      'Project Management',
      'Operations Management',
      'Logistics',
      'Risk Management',
      'Budget Management',
      'Process Improvement',
      'Microsoft Office',
      'Data Analysis',
    ],
    softSkills: [
      'Leadership',
      'Team Management',
      'Communication',
      'Problem Solving',
      'Decision Making',
      'Adaptability',
      'Time Management',
      'Conflict Resolution',
    ],
    atsKeywords: [
      'managed',
      'led',
      'coordinated',
      'implemented',
      'developed',
      'trained',
      'supervised',
      'operations',
      'logistics',
      'security',
      'compliance',
      'strategic planning',
    ],
    jobTitle: 'Operations Manager',
    industry: 'General',
  };
}

/**
 * Merge extracted keywords with defaults (for comprehensive coverage)
 */
export function mergeWithDefaults(
  extracted: KeywordExtractionResult
): KeywordExtractionResult {
  const defaults = getDefaultKeywords();

  return {
    hardSkills: [...new Set([...extracted.hardSkills, ...defaults.hardSkills])].slice(0, 12),
    softSkills: [...new Set([...extracted.softSkills, ...defaults.softSkills])].slice(0, 10),
    atsKeywords: [...new Set([...extracted.atsKeywords, ...defaults.atsKeywords])].slice(0, 40),
    jobTitle: extracted.jobTitle || defaults.jobTitle,
    industry: extracted.industry || defaults.industry,
  };
}
