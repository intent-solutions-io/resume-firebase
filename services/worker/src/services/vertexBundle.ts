// Vertex AI Gemini Client for 3-PDF Resume Bundle Generation
// Generates: Military Resume + Civilian Resume + Crosswalk

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import type {
  GenerationInput,
  BundleGenerationOutput,
} from '../types/candidate.js';

// Configuration from environment
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash-001';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

// Get the generative model
const model: GenerativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
});

// 3-PDF Bundle System Prompt
const BUNDLE_SYSTEM_PROMPT = `You are generating content that will be rendered to PDF. Do NOT output Markdown. Output print-ready HTML only, in strict JSON, so the application can render each HTML block to a PDF (US Letter).

GOAL
For every run, produce THREE PDF-ready documents from the same source input:
1) Military Resume (1 page)
2) Civilian Resume (1 page)
3) Crosswalk / Transcription (1–2 pages) mapping military → civilian terms and bullets

NON-NEGOTIABLE RULES
1) Do NOT invent employers, dates, schools, certifications, awards, duties, or metrics.
2) If a value is missing but needed, use placeholders like "[X]", "[#]", "[$X]", "[Month YYYY]".
3) Military Resume must fit ONE PAGE. Civilian Resume must fit ONE PAGE. Crosswalk may be 1–2 pages.
4) Civilian Resume: translate jargon to plain recruiting language; expand acronyms on first use.
5) Civilian Resume: remove unit identifiers unless necessary; use "U.S. Army / U.S. Navy / etc." instead.
6) Ensure ATS alignment for target_role using relevant keywords naturally (Summary + Skills + bullets).
7) Output must be deterministic, professional American English.
8) Output ONLY the JSON specified below. No extra text.

MILITARY→CIVILIAN TRANSLATION PATTERNS:
- "Mission/deployment" → "time-sensitive operations/programs/projects"
- "Platoon/Squad leader/NCOIC" → "Team Lead/Supervisor/Operations Lead"
- "Property book/OCIE/sensitive items" → "asset/inventory management"
- "PMCS" → "preventive maintenance/inspection program"
- "Counseled soldiers" → "coached and developed staff"
- "Range safety/weapons" → "safety/compliance leadership"
- "SOP/FRAGO/OPORD" → "standard operating procedures/execution plans"
- "Readiness/inspections" → "quality assurance/audit readiness"
- "Team Leader" → "Team Supervisor" or "Operations Lead"
- "Platoon Sergeant" → "Operations Manager" or "Department Supervisor"
- "First Sergeant" → "Senior Operations Manager" or "HR Manager"
- "Company Commander" → "Department Director" or "General Manager"
- "Fire team" → "4-person team"
- "Squad" → "9-person team"
- "Platoon" → "30-40 person department"

OUTPUT FORMAT (STRICT JSON — return ONLY JSON)
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
  "bundle": {
    "artifacts": {
      "resume_military": {
        "format": "html",
        "filename": "resume_military.html",
        "content_html": "..."
      },
      "resume_civilian": {
        "format": "html",
        "filename": "resume_civilian.html",
        "content_html": "..."
      },
      "resume_crosswalk": {
        "format": "html",
        "filename": "resume_crosswalk.html",
        "content_html": "..."
      }
    },
    "render_hints": {
      "page_size": "LETTER",
      "margins_in": { "top": 0.5, "right": 0.5, "bottom": 0.5, "left": 0.5 },
      "font_stack": "Inter, Arial, Helvetica, sans-serif"
    },
    "qa": {
      "target_role_used": "",
      "bullets_translated_count": 0,
      "terms_mapped_count": 0,
      "placeholders_used": true,
      "no_fabrication_confirmed": true
    }
  }
}

HTML REQUIREMENTS (for every artifact)
- Must be complete HTML: <html><head>…</head><body>…</body></html>
- Inline CSS only inside <style> in <head> (no external links)
- Use a clean one-column layout suitable for printing
- Use consistent typography; avoid heavy colors; minimal lines/borders
- Enforce one-page constraint for resumes by keeping content concise (short bullets, limited sections)
- Use font-family: Inter, Arial, Helvetica, sans-serif
- Use font-size: 10pt for body, 12pt for headers
- Use margin: 0.5in on all sides

CONTENT REQUIREMENTS

A) resume_military.html (ONE PAGE)
- Header: Name, City/State, Phone, Email, LinkedIn
- Optional: MOS/Rate, Clearance (only if present in source)
- Summary (military-acceptable phrasing)
- Core Competencies (skills list)
- Experience: keep military titles/rank/unit references as present (format clean)
- Education/Certs
- Awards (optional)

B) resume_civilian.html (ONE PAGE)
- Header: same contact info
- Line: TARGET ROLE: <target_role_used>
- Summary: civilian, outcome-focused (2–3 lines)
- Skills: ATS keywords for target_role (10–14 items max)
- Experience: translate each role title to a civilian equivalent in brackets, e.g.:
  "Platoon Sergeant [Operations Supervisor]"
- Bullets: action + scope + method + result; translate jargon; expand acronyms on first use
- Education/Certs: civilian-friendly phrasing

C) resume_crosswalk.html (1–2 PAGES)
Section 1: Term Map table
Columns: Military term/acronym | Civilian translation | What it signals | ATS keywords
- Include EVERY acronym/jargon term found in source documents and/or resume_military.

Section 2: Bullet Crosswalk
For EVERY bullet in resume_military, include:
- Military bullet (verbatim)
- Civilian bullet (exactly as used in resume_civilian)
- Notes: acronym expansions, removed unit identifiers, clarified scope, placeholders used

QUALITY CHECKS (update qa)
- Count bullets in resume_military and ensure all appear in crosswalk section 2
- Count unique terms mapped in term table
- Confirm placeholders_used true if any placeholders appear
- Confirm no_fabrication_confirmed true (must remain true)

NOW GENERATE THE STRICT JSON OUTPUT FOR THE GIVEN INPUTS.`;

/**
 * Generate 3-PDF bundle from candidate documents
 */
export async function generateResumeBundle(
  input: GenerationInput
): Promise<BundleGenerationOutput> {
  // Build the document context
  const documentContext = input.documentTexts
    .map(
      (doc) =>
        `=== ${doc.type.toUpperCase()}: ${doc.fileName} ===\n${doc.text}\n`
    )
    .join('\n\n');

  // Build the user prompt
  const userPrompt = `
INPUTS:
- source_resume_text: See UPLOADED DOCUMENTS below
- target_role: "${input.targetRole || 'Operations / Program Management'}"
- candidate_name: ${input.name}
- candidate_email: ${input.email}
- candidate_branch: ${input.branch}
- candidate_rank: ${input.rank || 'Not specified'}
- candidate_mos: ${input.mos || 'Not specified'}
- candidate_id: ${input.candidateId}

UPLOADED DOCUMENTS:
${documentContext}

Generate the complete JSON output with profile and 3-PDF bundle (resume_military, resume_civilian, resume_crosswalk).
Remember: NO FABRICATION. Use placeholders for missing data. All three HTML documents must be complete and print-ready.`;

  console.log(`[vertexBundle] Generating 3-PDF bundle for candidate: ${input.candidateId}`);
  console.log(`[vertexBundle] Document count: ${input.documentTexts.length}`);
  console.log(`[vertexBundle] Target role: ${input.targetRole || 'Operations / Program Management'}`);
  console.log(`[vertexBundle] Using model: ${MODEL_NAME}`);

  try {
    // Generate content
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: BUNDLE_SYSTEM_PROMPT },
            { text: userPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2, // Lower temperature for consistent JSON
        maxOutputTokens: 8192, // Max for gemini-2.x-flash models
      },
    });

    const response = result.response;
    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Empty response from Gemini');
    }

    // Parse the JSON response
    const output = parseBundleResponse(textContent, input.candidateId);

    console.log(`[vertexBundle] Successfully generated bundle`);
    console.log(`[vertexBundle] Profile roles: ${output.profile.roles?.length || 0}`);
    console.log(`[vertexBundle] Terms mapped: ${output.bundle.qa.terms_mapped_count}`);
    console.log(`[vertexBundle] Bullets translated: ${output.bundle.qa.bullets_translated_count}`);

    return output;
  } catch (error) {
    console.error('[vertexBundle] Generation failed:', error);
    throw error;
  }
}

/**
 * Parse and validate bundle response
 */
function parseBundleResponse(text: string, candidateId: string): BundleGenerationOutput {
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
    if (!parsed.profile || !parsed.bundle) {
      throw new Error('Response missing profile or bundle object');
    }

    if (!parsed.bundle.artifacts) {
      throw new Error('Response missing bundle.artifacts');
    }

    const { resume_military, resume_civilian, resume_crosswalk } = parsed.bundle.artifacts;

    if (!resume_military?.content_html || !resume_civilian?.content_html || !resume_crosswalk?.content_html) {
      throw new Error('Response missing one or more HTML artifacts');
    }

    // Ensure candidateId is set
    parsed.profile.candidateId = candidateId;

    // Validate profile has roles array
    if (!Array.isArray(parsed.profile.roles)) {
      parsed.profile.roles = [];
    }

    // Ensure render_hints exists
    if (!parsed.bundle.render_hints) {
      parsed.bundle.render_hints = {
        page_size: 'LETTER',
        margins_in: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        font_stack: 'Inter, Arial, Helvetica, sans-serif'
      };
    }

    // Ensure qa exists
    if (!parsed.bundle.qa) {
      parsed.bundle.qa = {
        target_role_used: '',
        bullets_translated_count: 0,
        terms_mapped_count: 0,
        placeholders_used: false,
        no_fabrication_confirmed: true
      };
    }

    return parsed as BundleGenerationOutput;
  } catch (parseError) {
    console.error('[vertexBundle] JSON parse error:', parseError);
    console.error('[vertexBundle] Raw response (first 1000 chars):', text.substring(0, 1000));
    throw new Error(`Failed to parse bundle response: ${parseError}`);
  }
}

/**
 * Get model info for metadata
 */
export function getBundleModelInfo(): { modelName: string; modelVersion: string } {
  return {
    modelName: MODEL_NAME,
    modelVersion: '3-pdf-bundle-v1',
  };
}
