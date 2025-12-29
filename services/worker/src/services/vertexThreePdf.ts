// Vertex AI - 3-PDF Resume Bundle Generator
// Phase: Prototype (Checkpoint 1)
// Merged Prompt: Jeremy's structure + Detail preservation + ATS optimization

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import type {
  ThreePDFGenerationInput,
  ThreePDFGenerationOutput,
} from '../types/threePdf.js';

// Configuration
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash-001';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const model: GenerativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
});

// Merged System Prompt - Jeremy's 3-PDF Structure + Our Detail Preservation
const SYSTEM_PROMPT = `SYSTEM / DEVELOPER PROMPT — "3-PDF Resume Bundle (Military + Civilian + Crosswalk)"

You are generating content that will be rendered to PDF. Do NOT output Markdown. Output print-ready HTML only, in strict JSON, so the application can render each HTML block to a PDF (US Letter).

GOAL
For every run, produce THREE PDF-ready documents from the same source input:
1) Military Resume (1 page) - Preserves military terminology and context
2) Civilian Resume (1 page) - Translates to civilian business language
3) Crosswalk / Transcription (1-2 pages) - Maps military → civilian terms and bullets

INPUTS
source_documents: military documents (evaluations, DD-214, ERB/ORB, awards, etc.)
candidate_metadata: name, email, branch, rank, MOS
target_role: desired civilian role (infer if not specified; default to "Operations / Program Management")

NON-NEGOTIABLE RULES
1) Do NOT invent employers, dates, schools, certifications, awards, duties, or metrics
2) If a value is missing but needed, use placeholders like "[X]", "[#]", "[$X]", "[Month YYYY]"
3) Military Resume must fit ONE PAGE. Civilian Resume must fit ONE PAGE. Crosswalk may be 1–2 pages
4) Civilian Resume: translate jargon to plain recruiting language; expand acronyms on first use
5) Civilian Resume: simplify unit identifiers; use "U.S. Army / U.S. Navy / etc." where appropriate
6) Ensure ATS alignment for target_role using relevant keywords naturally (Summary + Skills + bullets)
7) Output must be deterministic, professional American English
8) Output ONLY the JSON specified below. No extra text, no markdown code fences

DETAIL PRESERVATION RULES (CRITICAL - Prevents Over-Simplification):
1) PRESERVE ALL SPECIFIC NUMBERS from documents - exact dollar amounts, personnel counts, asset values, acreage, percentages, locations
2) Generate 6-8 strong bullets per experience entry (use ALL rich content available from evaluations)
3) EVERY bullet must include FULL CONTEXT: specific task + complete scope (all locations, all assets, all personnel) + method + measurable results
4) Include comprehensive scope statements using ALL available metrics from documents
5) Preserve specific base/unit names for credibility (e.g., "RAF Alconbury, England", "423d Security Forces Squadron" in MILITARY resume)
6) ALWAYS include both start and end dates: "Month YYYY – Month YYYY" (e.g., "Dec 2014 – Sep 2015")
7) Do NOT summarize or reduce details - if document says "$1 billion in DoD and NATO assets", preserve that EXACT phrasing in military resume

REQUIRED MILITARY→CIVILIAN TRANSLATION PATTERNS:
1. "Mission/deployment" → "time-sensitive operations/programs/projects"
2. "Platoon/Squad leader/NCOIC" → "Team Lead/Supervisor/Operations Lead"
3. "Property book/OCIE/sensitive items" → "asset/inventory management"
4. "PMCS" → "preventive maintenance/inspection program"
5. "Counseled soldiers" → "coached and developed staff"
6. "Range safety/weapons" → "safety/compliance leadership"
7. "SOP/FRAGO/OPORD" → "standard operating procedures/execution plans"
8. "Readiness/inspections" → "quality assurance/audit readiness"

ADDITIONAL TRANSLATION EXAMPLES:
- "Platoon Sergeant" → "Operations Manager" or "Department Supervisor"
- "First Sergeant" → "Senior Operations Manager"
- "Company Commander" → "Department Director"
- "$500K in equipment" → "$500,000 in organizational assets"
- "Platoon" → "30-40 person department"

BULLET POINT FORMULA (MANDATORY FOR EVERY BULLET):
Action verb + what you did + scale + how you did it + measurable result + why it mattered

Example:
"Led Antiterrorism program securing 878 acres across 3 air bases, protecting 4,200 personnel and $1 billion in DoD and NATO assets by implementing vulnerability assessments and threat mitigation strategies."

EVERY bullet must include:
- Strong action verb (Led, Managed, Coordinated, Implemented, Achieved, Executed, Directed)
- Scale/scope (# of people, locations, projects, budget amount, geographic coverage)
- Method (how you accomplished it - specific program, process, system, tool)
- Quantifiable result (%, $, time saved, improvement metric, completion rate)
- Multiple metrics per bullet when available

ATS OPTIMIZATION RULES:
- Use industry-standard job titles (Operations Manager, not Ops Mgr)
- Include spelled-out terms AND acronyms on first use: "Antiterrorism (AT) program"
- Front-load important keywords in summary and first bullets
- Use standard section headers: PROFESSIONAL SUMMARY, SKILLS, PROFESSIONAL EXPERIENCE, EDUCATION, CERTIFICATIONS
- Include quantifiable metrics in 100% of bullets
- Use common ATS keywords: managed, led, coordinated, implemented, achieved, developed, improved, executed, directed

OUTPUT FORMAT (STRICT JSON — return ONLY JSON)
{
  "artifacts": {
    "resume_military": {
      "format": "html",
      "filename": "resume_military.html",
      "content_html": "complete HTML document with inline CSS"
    },
    "resume_civilian": {
      "format": "html",
      "filename": "resume_civilian.html",
      "content_html": "complete HTML document with inline CSS"
    },
    "resume_crosswalk": {
      "format": "html",
      "filename": "resume_crosswalk.html",
      "content_html": "complete HTML document with inline CSS"
    }
  },
  "render_hints": {
    "page_size": "LETTER",
    "margins_in": { "top": 0.5, "right": 0.5, "bottom": 0.5, "left": 0.5 },
    "font_stack": "Inter, Arial, Helvetica, sans-serif"
  },
  "qa": {
    "target_role_used": "string",
    "bullets_translated_count": 0,
    "terms_mapped_count": 0,
    "placeholders_used": false,
    "no_fabrication_confirmed": true
  }
}

HTML REQUIREMENTS (for every artifact):
- Must be complete HTML: <html><head><style>...</style></head><body>...</body></html>
- Inline CSS ONLY inside <style> in <head> (no external links, no <link> tags)
- Use clean one-column layout suitable for printing
- Use consistent typography; minimal colors; minimal lines/borders
- Font: Inter, Arial, Helvetica, sans-serif
- NO SCRIPT TAGS (security requirement)
- Enforce one-page constraint for military and civilian resumes by keeping content concise

CONTENT REQUIREMENTS:

A) resume_military.html (ONE PAGE)
Header: Name, City/State, Phone, Email, LinkedIn
Optional: MOS/Rate, Clearance (only if present in source)
PROFESSIONAL SUMMARY: 2-3 sentences using military-acceptable phrasing with SPECIFIC accomplishments
SKILLS: 10-14 core competencies (military + transferable skills)
PROFESSIONAL EXPERIENCE:
  - Keep military titles/rank/unit references as present (e.g., "Platoon Sergeant, 423d Security Forces Squadron")
  - Generate 6-8 bullets per role when rich content available from evaluations
  - Each bullet: action + FULL scope (all locations/bases/assets/personnel) + method + multiple measurable results
  - Preserve ALL specific numbers from source documents
  - Format: "Title, Unit - Location | Month YYYY – Month YYYY"
EDUCATION: As stated in documents
CERTIFICATIONS: As stated in documents
AWARDS: (optional) As stated in documents

B) resume_civilian.html (ONE PAGE)
Header: Name, City/State, Phone, Email, LinkedIn, Clearance
TARGET ROLE: <target_role_used>
PROFESSIONAL SUMMARY: civilian, outcome-focused (2-3 sentences with SPECIFIC metrics from military experience)
SKILLS: 10-14 ATS keywords for target_role (translate military skills to civilian equivalents)
PROFESSIONAL EXPERIENCE:
  - Translate role title to civilian equivalent, show military context: "Operations Supervisor | U.S. Army"
  - Generate 6-8 bullets per role
  - Each bullet: action + scope + method + result
  - Translate jargon BUT preserve credibility context (specific locations, exact dollar amounts, personnel counts)
  - Expand acronyms on first use: "Led Antiterrorism (AT) program..."
  - Format: "Civilian Title | Branch - Location | Month YYYY – Month YYYY"
EDUCATION: civilian-friendly phrasing
CERTIFICATIONS: civilian-friendly phrasing

C) resume_crosswalk.html (1–2 PAGES)

SECTION 1: TERM MAP TABLE
Create HTML table with 4 columns: Military Term/Acronym | Civilian Translation | What It Signals | ATS Keywords
Include EVERY acronym/jargon term found in source documents and military resume.

Example rows:
| AT | Antiterrorism | Security risk management | Security, Risk Management, Threat Assessment |
| NCOIC | Team Lead/Supervisor | Leadership role | Leadership, Team Management, Supervision |
| PMCS | Preventive Maintenance | Quality assurance | Quality Assurance, Maintenance, Inspection |
| SOP | Standard Operating Procedure | Process documentation | Process Improvement, Documentation, Compliance |

SECTION 2: BULLET CROSSWALK
For EVERY bullet in resume_military, include:

Military Bullet: (verbatim from military resume)
Civilian Bullet: (exactly as used in civilian resume)
Translation Notes: (list acronym expansions, removed unit identifiers, clarified scope, placeholders used if any)

Example:
Military: "Led AT program securing 878 acres across 3 air bases, protecting 4,200 personnel and $1 billion in DoD and NATO assets."
Civilian: "Led Antiterrorism program securing 878 acres across 3 locations, protecting 4,200 personnel and $1 billion in government and partner assets."
Notes: Expanded "AT" to "Antiterrorism"; changed "air bases" to "locations"; changed "DoD and NATO" to "government and partner"

QUALITY CHECKS (update qa object):
- Count ALL bullets in military resume and ensure ALL appear in crosswalk section 2
- Count unique terms mapped in term table
- Confirm placeholders_used = true ONLY if placeholders appear (if data missing)
- Confirm no_fabrication_confirmed = true (MUST remain true)

CRITICAL FORMATTING RULES:
1. Return ONLY the JSON object, no markdown code fences, no extra text
2. Use exactly 2 experience entries maximum (one-page constraint)
3. Use 6-8 bullets per experience entry when rich evaluation content is available
4. Use exactly 10-14 skills
5. Every bullet MUST include rich context: specific task + full scope/scale + method + quantifiable results
6. Every bullet MUST include multiple quantifiable metrics - preserve ALL specific numbers from documents
7. Summary must use SPECIFIC details from candidate's actual experience (not generic statements like "10+ years")
8. Translate military job titles to civilian equivalents BUT preserve all credibility context`;

/**
 * Generate 3-PDF resume bundle using Vertex AI Gemini
 */
export async function generateThreePdfResume(
  input: ThreePDFGenerationInput
): Promise<ThreePDFGenerationOutput> {
  // Build document context
  const documentContext = input.documentTexts
    .map(
      (doc) =>
        `=== ${doc.type.toUpperCase()}: ${doc.fileName} ===\n${doc.text}\n`
    )
    .join('\n\n');

  // Build user prompt
  const userPrompt = `
CANDIDATE METADATA:
- Name: ${input.name}
- Email: ${input.email}
- Branch: ${input.branch}
- Rank: ${input.rank || '[Not specified]'}
- MOS/Rating/AFSC: ${input.mos || '[Not specified]'}
- Candidate ID: ${input.candidateId}

UPLOADED DOCUMENTS:
${documentContext}

CRITICAL INSTRUCTIONS:
1. Read EVERY document completely before generating output
2. For evaluations (NCOERs, OERs, FITREPs, EPRs): Extract ALL bullet comments, metrics, and achievements
3. Generate THREE complete HTML documents following the exact specifications above
4. Preserve ALL specific numbers from documents (dollar amounts, personnel, acreage, percentages, locations)
5. Generate 6-8 bullets per experience entry with FULL CONTEXT
6. Include 10-14 skills in BOTH military and civilian resumes
7. Create comprehensive term mapping table in crosswalk
8. Map EVERY bullet from military → civilian in crosswalk section 2
9. Update qa object with accurate counts

Generate the 3-PDF bundle JSON now.`;

  console.log(`[vertexThreePdf] Generating 3-PDF bundle for: ${input.candidateId}`);
  console.log(`[vertexThreePdf] Document count: ${input.documentTexts.length}`);
  console.log(`[vertexThreePdf] Using model: ${MODEL_NAME}`);

  try {
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
        temperature: 0.3, // Balanced for structured output with natural language
        maxOutputTokens: 8192, // Max for Gemini 2.0 Flash (3 HTML documents)
      },
    });

    const response = result.response;
    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Empty response from Gemini');
    }

    // Parse and validate
    const output = parseThreePdfResponse(textContent);

    console.log(`[vertexThreePdf] Success! Generated 3 artifacts`);
    console.log(`[vertexThreePdf] QA: ${JSON.stringify(output.qa)}`);

    return output;
  } catch (error) {
    console.error('[vertexThreePdf] Generation failed:', error);
    throw error;
  }
}

/**
 * Parse and validate Gemini response
 * Security: Validates structure, sanitizes HTML
 */
function parseThreePdfResponse(text: string): ThreePDFGenerationOutput {
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
    if (!parsed.artifacts) {
      throw new Error('Response missing artifacts object');
    }
    if (!parsed.artifacts.resume_military?.content_html) {
      throw new Error('Missing military resume HTML');
    }
    if (!parsed.artifacts.resume_civilian?.content_html) {
      throw new Error('Missing civilian resume HTML');
    }
    if (!parsed.artifacts.resume_crosswalk?.content_html) {
      throw new Error('Missing crosswalk HTML');
    }

    // Security: Check for script tags
    const htmlContents = [
      parsed.artifacts.resume_military.content_html,
      parsed.artifacts.resume_civilian.content_html,
      parsed.artifacts.resume_crosswalk.content_html,
    ];

    for (const html of htmlContents) {
      if (html.toLowerCase().includes('<script')) {
        throw new Error('Security: Generated HTML contains script tags');
      }
    }

    // Ensure render_hints defaults
    if (!parsed.render_hints) {
      parsed.render_hints = {
        page_size: 'LETTER',
        margins_in: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        font_stack: 'Inter, Arial, Helvetica, sans-serif',
      };
    }

    // Ensure qa defaults
    if (!parsed.qa) {
      parsed.qa = {
        target_role_used: 'Not specified',
        bullets_translated_count: 0,
        terms_mapped_count: 0,
        placeholders_used: false,
        no_fabrication_confirmed: true,
      };
    }

    return parsed as ThreePDFGenerationOutput;
  } catch (parseError) {
    console.error('[vertexThreePdf] JSON parse error:', parseError);
    console.error('[vertexThreePdf] Raw response:', text.substring(0, 500));
    throw new Error(`Failed to parse Gemini response: ${parseError}`);
  }
}
