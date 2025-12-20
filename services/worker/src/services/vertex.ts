// Vertex AI Gemini Client for Resume Generation
// Phase 1.9: AI Profile & Resume Pipeline

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import type { GenerationInput, GenerationOutput } from '../types/candidate.js';

// Configuration from environment
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

// Get the generative model
const model: GenerativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
});

// System prompt for military-to-civilian resume translation
const SYSTEM_PROMPT = `You are an expert in translating US military experience into compelling civilian job language.

Your task is to analyze military documents and candidate information to produce:
1. A structured CandidateProfile capturing all relevant military experience
2. A polished GeneratedResume optimized for civilian employers

HARD RULES:
- NO FABRICATION: Do not invent degrees, employers, ranks, awards, or any information not present in the documents
- USE ONLY PROVIDED DATA: Extract information solely from the documents and candidate metadata provided
- STRONG BULLETS: Create measurable, action-oriented bullet points where possible (use metrics when available)
- TRANSLATION: Convert military jargon to civilian-friendly language while maintaining accuracy
- ACCURACY: Preserve exact ranks, dates, and awards as stated in documents

OUTPUT FORMAT:
You must respond with ONLY valid JSON matching this exact structure:

{
  "profile": {
    "candidateId": "string",
    "name": "string or null",
    "email": "string or null",
    "branch": "string or null",
    "rank": "string or null",
    "mosCode": "string or null",
    "serviceStartDate": "string or null",
    "serviceEndDate": "string or null",
    "clearance": "string or null",
    "roles": [
      {
        "rawTitle": "string",
        "standardizedTitle": "string or null",
        "unit": "string or null",
        "location": "string or null",
        "startDate": "string or null",
        "endDate": "string or null",
        "responsibilitiesRaw": ["string"],
        "achievementsRaw": ["string"]
      }
    ],
    "education": ["string"] or null,
    "certifications": ["string"] or null,
    "awards": ["string"] or null,
    "skillsRaw": ["string"] or null
  },
  "resume": {
    "summary": "string (2-4 sentences, professional summary)",
    "skills": ["string (civilian-friendly skills)"],
    "experience": [
      {
        "title": "string (civilian-equivalent title)",
        "company": "string (branch/unit as employer)",
        "location": "string or null",
        "dates": "string or null",
        "bullets": ["string (action-oriented achievements)"]
      }
    ],
    "education": "string or null",
    "certifications": ["string"] or null
  }
}

IMPORTANT: Return ONLY the JSON object, no markdown code fences, no explanations.`;

/**
 * Generate profile and resume from candidate documents
 */
export async function generateProfileAndResume(
  input: GenerationInput
): Promise<GenerationOutput> {
  // Build the document context
  const documentContext = input.documentTexts
    .map(
      (doc) =>
        `=== ${doc.type.toUpperCase()}: ${doc.fileName} ===\n${doc.text}\n`
    )
    .join('\n\n');

  // Build the user prompt
  const userPrompt = `
CANDIDATE METADATA:
- Name: ${input.name}
- Email: ${input.email}
- Branch: ${input.branch}
- Rank: ${input.rank || 'Not specified'}
- MOS/Rating/AFSC: ${input.mos || 'Not specified'}
- Candidate ID: ${input.candidateId}

UPLOADED DOCUMENTS:
${documentContext}

Based on the above documents and metadata, generate the CandidateProfile and GeneratedResume JSON.
Remember: NO FABRICATION. Only use information from the documents provided.`;

  console.log(`[vertex] Generating profile and resume for candidate: ${input.candidateId}`);
  console.log(`[vertex] Document count: ${input.documentTexts.length}`);
  console.log(`[vertex] Using model: ${MODEL_NAME}`);

  try {
    // Generate content
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            { text: userPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2, // Lower temperature for more consistent JSON
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;
    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Empty response from Gemini');
    }

    // Parse the JSON response
    const output = parseGeminiResponse(textContent, input.candidateId);

    console.log(`[vertex] Successfully generated profile with ${output.profile.roles?.length || 0} roles`);
    console.log(`[vertex] Resume has ${output.resume.experience?.length || 0} experience entries`);

    return output;
  } catch (error) {
    console.error('[vertex] Generation failed:', error);
    throw error;
  }
}

/**
 * Parse and validate Gemini response
 */
function parseGeminiResponse(text: string, candidateId: string): GenerationOutput {
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

    // Validate required structure
    if (!parsed.profile || !parsed.resume) {
      throw new Error('Response missing profile or resume object');
    }

    // Ensure candidateId is set
    parsed.profile.candidateId = candidateId;

    // Validate profile has roles array
    if (!Array.isArray(parsed.profile.roles)) {
      parsed.profile.roles = [];
    }

    // Validate resume has required fields
    if (!parsed.resume.summary) {
      parsed.resume.summary = '';
    }
    if (!Array.isArray(parsed.resume.skills)) {
      parsed.resume.skills = [];
    }
    if (!Array.isArray(parsed.resume.experience)) {
      parsed.resume.experience = [];
    }

    return parsed as GenerationOutput;
  } catch (parseError) {
    console.error('[vertex] JSON parse error:', parseError);
    console.error('[vertex] Raw response:', text.substring(0, 500));
    throw new Error(`Failed to parse Gemini response: ${parseError}`);
  }
}

/**
 * Get model info for metadata
 */
export function getModelInfo(): { modelName: string; modelVersion: string } {
  return {
    modelName: MODEL_NAME,
    modelVersion: '1.0', // Could extract from API if needed
  };
}
