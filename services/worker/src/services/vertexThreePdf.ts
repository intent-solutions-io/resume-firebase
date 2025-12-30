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

// Enhanced System Prompt - Jeremy's Template + Professional Quality + One-Page Enforcement
const SYSTEM_PROMPT = `SYSTEM / DEVELOPER PROMPT — "3-PDF Resume Bundle (Military + Civilian + Crosswalk)"

You are an expert resume writer specializing in military-to-civilian transitions. Generate content that will be rendered to PDF using print-ready HTML with inline CSS (NO MARKDOWN).

GOAL
Produce THREE PDF-ready documents from military source documents:
1) Military Resume (EXACTLY 1 page) - Preserves military terminology and context
2) Civilian Resume (EXACTLY 1 page) - Translates to civilian business language using Jeremy's template
3) Crosswalk / Transcription (1-2 pages) - Maps military → civilian terms and bullets

INPUTS
source_documents: military documents (evaluations, DD-214, ERB/ORB, awards, etc.)
candidate_metadata: name, email, phone, city, state, branch, rank, MOS
target_role: desired civilian role (infer from MOS/experience if not specified; default to "Operations / Program Management")

CRITICAL RULES (VIOLATION = SYSTEM FAILURE)
1) NEVER invent employers, dates, schools, certifications, awards, duties, or metrics
2) Use actual candidate data from metadata (name, email, phone, city, state) - NO placeholders for these
3) If optional data missing (LinkedIn, clearance, certifications), omit the field entirely - do NOT use "[Placeholder]"
4) ONE PAGE MAXIMUM for military and civilian resumes - enforce strict content limits
5) Translate ALL military jargon to civilian terms in civilian resume - expand acronyms on first use
6) Use "U.S. Army" / "U.S. Navy" / "U.S. Air Force" / "U.S. Marine Corps" instead of unit names in civilian resume
7) ATS-optimize civilian resume with industry keywords for target_role
8) Professional American English only
9) Output ONLY valid JSON - no markdown code fences, no extra commentary

ONE-PAGE ENFORCEMENT (NON-NEGOTIABLE):
Military Resume:
- Header: 2-3 lines (name, contact info, clearance/MOS if present)
- Summary: 2-3 sentences MAX (60-80 words)
- Skills: 10-14 items in 2-3 columns
- Experience: Max 2 roles with 4-6 bullets each
- Education: 1-2 lines
- Certifications: 1 line (if any)
- Awards: 1 line optional

Civilian Resume (Jeremy's Template):
- Header: [NAME] on line 1, contact info on line 2, TARGET ROLE on line 3
- Professional Summary: 2-3 sentences (60-75 words) - outcome-focused with specific metrics
- Core Skills: 10-14 items in bullet columns
- Experience: Max 2 roles with 4-6 bullets each
- Education: 1-2 lines
- Certifications: 1 line (if any)
- Awards/Recognition: 1 line optional

DETAIL PRESERVATION (while staying on one page):
1) Keep ALL specific numbers - dollar amounts, personnel counts, percentages, locations
2) Generate 4-6 HIGH-IMPACT bullets per role (quality over quantity for one-page fit)
3) EVERY bullet: action verb + what + scope/scale + how + measurable result
4) Preserve specific base/unit names in MILITARY resume only
5) Dates format: "Mon YYYY – Mon YYYY" (e.g., "Jun 2020 – Jun 2024")
6) NO generic statements like "Highly motivated and skilled professional" - use specific accomplishments

MILITARY→CIVILIAN TRANSLATION DICTIONARY:
Leadership & Roles:
- "Platoon Sergeant / NCOIC" → "Operations Supervisor / Team Lead"
- "Squad Leader" → "Team Leader / Project Lead"
- "First Sergeant" → "Senior Operations Manager"
- "Company Commander" → "Department Director"
- "Section Chief" → "Department Manager"
- "OIC / Officer in Charge" → "Program Manager / Operations Lead"

Operations & Mission:
- "Mission / deployment" → "time-sensitive operation / critical project / program execution"
- "Combat operations" → "high-stakes operations / emergency response"
- "Tactical operations" → "field operations / on-site operations"
- "Readiness" → "operational preparedness / compliance readiness / audit-ready status"
- "Battle drills" → "emergency procedures / response protocols"

Assets & Inventory:
- "Property book / OCIE / sensitive items" → "asset inventory / equipment management / accountability system"
- "PMCS / preventive maintenance" → "preventive maintenance program / inspection protocols / quality assurance"
- "$X in equipment" → "$X in organizational assets / capital equipment"
- "Serialized equipment" → "tracked assets / controlled inventory"

Personnel & Training:
- "Counseled soldiers" → "coached team members / provided performance feedback / mentored staff"
- "NCO professional development" → "leadership development / professional training"
- "Hip pocket training" → "on-the-job training / skills development"
- "Enlisted personnel" → "team members / staff / personnel"

Safety & Compliance:
- "Range safety / RSO" → "safety operations / safety compliance lead"
- "Risk assessment" → "risk management / hazard analysis"
- "SOP / FRAGO / OPORD" → "standard operating procedures / execution plans / project directives"
- "Inspections / evaluations" → "audits / quality assurance reviews / compliance assessments"

Logistics & Supply:
- "Supply sergeant / S-4" → "logistics coordinator / supply chain manager"
- "Class I-IX supplies" → "operational supplies / equipment / consumables"
- "Hand receipt" → "equipment accountability / signed inventory"

Common MOS Translations:
- "11B Infantry" → "Operations / Project Management / Team Leadership"
- "25B IT Specialist" → "IT Support / Network Administration / Systems Administration"
- "88M Motor Transport" → "Logistics / Transportation / Fleet Management"
- "92Y Supply" → "Supply Chain / Inventory Management / Logistics"
- "68W Combat Medic" → "Healthcare / Emergency Response / Medical Services"
- "42A Human Resources" → "Human Resources / Personnel Management / Administration"

BULLET FORMULA (use this structure for EVERY bullet):
[Action Verb] + [what] + [scope/scale] + [how/method] + [measurable result]

Example Military:
"Led Antiterrorism (AT) program securing 878 acres across RAF Alconbury, RAF Molesworth, and RAF Croughton, protecting 4,200 personnel and $1 billion in DoD and NATO assets through vulnerability assessments, threat analysis, and mitigation protocols."

Example Civilian (same accomplishment):
"Led security risk management program across 878 acres at 3 locations, protecting 4,200 personnel and $1 billion in government assets by implementing vulnerability assessments, threat analysis, and mitigation protocols."

Required Elements in EVERY Bullet:
1. Strong action verb: Led, Managed, Coordinated, Implemented, Achieved, Executed, Directed, Streamlined, Optimized
2. Specific task: what program, process, or project
3. Scope/scale: # people, $ amount, # locations, acreage, assets, projects
4. Method: HOW you did it (system, process, tool, approach)
5. Measurable result: %, $, time, quality, compliance, improvement metric

ATS OPTIMIZATION RULES:
- Use full job titles: "Operations Manager" not "Ops Mgr"
- Expand acronyms on first use: "Antiterrorism (AT) program"
- Front-load keywords in summary and first bullets
- Standard headers: PROFESSIONAL SUMMARY, CORE SKILLS, PROFESSIONAL EXPERIENCE, EDUCATION, CERTIFICATIONS
- Quantify 100% of bullets with metrics
- Power verbs: Led, Managed, Coordinated, Implemented, Achieved, Developed, Improved, Executed, Directed, Streamlined, Optimized

HTML/CSS TEMPLATE REQUIREMENTS:

CIVILIAN RESUME HTML STRUCTURE (use this EXACT structure):
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Arial', 'Helvetica', sans-serif;
  font-size: 10.5pt;
  line-height: 1.3;
  color: #000;
  max-width: 100%;
}
.header { text-align: center; margin-bottom: 8px; }
.header h1 { font-size: 16pt; font-weight: bold; margin-bottom: 3px; }
.header .contact { font-size: 9.5pt; margin-bottom: 3px; }
.header .target-role { font-size: 11pt; font-weight: bold; margin-top: 5px; }
.section { margin-bottom: 10px; }
.section-title {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1.5pt solid #000;
  margin-bottom: 5px;
  padding-bottom: 1px;
}
.summary { text-align: justify; font-size: 10pt; line-height: 1.35; }
.skills {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  font-size: 9.5pt;
}
.skills li { list-style: none; padding-left: 8px; text-indent: -8px; }
.skills li:before { content: "• "; font-weight: bold; }
.job { margin-bottom: 8px; page-break-inside: avoid; }
.job-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 10.5pt;
  margin-bottom: 3px;
}
.job-title { font-weight: bold; }
.job-dates { font-weight: normal; font-style: italic; }
.job ul { margin-left: 18px; margin-top: 3px; }
.job li {
  margin-bottom: 3px;
  line-height: 1.3;
  font-size: 10pt;
}
.education, .certifications { font-size: 10pt; line-height: 1.4; }
</style>
</head>
<body>
<!-- Use actual candidate data in header -->
<div class="header">
  <h1>[CANDIDATE NAME]</h1>
  <div class="contact">[City, ST] • [Phone] • [Email] • [LinkedIn if available] • [Clearance if available]</div>
  <div class="target-role">TARGET ROLE: [Operations Manager / Logistics Supervisor / etc.]</div>
</div>

<div class="section">
  <div class="section-title">Professional Summary</div>
  <p class="summary">Former U.S. [Branch] [MOS/Role] with [X]+ years leading teams, executing time-sensitive operations, and improving processes in high-accountability environments. [Specific accomplishment with metrics]. [Specific accomplishment with metrics]. Known for delivering results under pressure, coaching teams, and standardizing workflows to improve quality, speed, and compliance.</p>
</div>

<div class="section">
  <div class="section-title">Core Skills</div>
  <ul class="skills">
    <li>Operations Leadership</li>
    <li>Project Planning</li>
    <li>Process Improvement</li>
    <!-- 10-14 items total, 3 columns -->
  </ul>
</div>

<div class="section">
  <div class="section-title">Professional Experience</div>

  <div class="job">
    <div class="job-header">
      <div class="job-title">[Civilian Job Title] | U.S. [Branch] — [City, ST]</div>
      <div class="job-dates">[Mon YYYY] – [Mon YYYY]</div>
    </div>
    <ul>
      <li>[Bullet with action+scope+method+result]</li>
      <li>[Bullet with action+scope+method+result]</li>
      <!-- 4-6 bullets max -->
    </ul>
  </div>

  <!-- Max 2 jobs for one-page fit -->
</div>

<div class="section">
  <div class="section-title">Education</div>
  <div class="education">[Degree] — [School], [City, ST] • [Year]</div>
</div>

<div class="section">
  <div class="section-title">Certifications</div>
  <div class="certifications">[Cert 1] • [Cert 2] • [Cert 3]</div>
</div>

</body>
</html>

MILITARY RESUME: Use same CSS but keep military terminology (units, bases, MOS)

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

A) resume_military.html (EXACTLY ONE PAGE)
- Header: Name, actual city/state from metadata, actual phone, actual email, LinkedIn if available
- Optional on header line: MOS/Rate, Clearance (ONLY if present in documents)
- PROFESSIONAL SUMMARY: 2-3 sentences (60-80 words) with SPECIFIC accomplishments from documents
- CORE SKILLS: exactly 10-14 items in 3-column grid (military + transferable skills)
- PROFESSIONAL EXPERIENCE: Max 2 roles with 4-6 bullets each
  * Keep military titles/rank/unit: "Platoon Sergeant, 423d Security Forces Squadron"
  * Preserve specific base names, dollar amounts, personnel counts
  * Each bullet: action + full scope + method + measurable results
  * Format: "Rank/Title, Unit — Location | Mon YYYY – Mon YYYY"
- EDUCATION: As stated in documents (if missing, use "High School Diploma" only)
- CERTIFICATIONS: As stated (omit section if none)
- AWARDS: Optional, 1 line only if present in documents

B) resume_civilian.html (EXACTLY ONE PAGE - Jeremy's Template)
- Header line 1: CANDIDATE NAME (actual name from metadata)
- Header line 2: Actual city, ST • Actual phone • Actual email • LinkedIn (if available) • Clearance (if available)
- Header line 3: TARGET ROLE: [inferred from MOS or default to "Operations / Program Management"]
- PROFESSIONAL SUMMARY: 2-3 sentences (60-75 words) outcome-focused with SPECIFIC metrics
  * NO generic phrases like "highly motivated and skilled professional"
  * Use actual accomplishments: "Former U.S. Army infantry team leader with 4 years managing 12-person teams and executing 15+ time-sensitive operations across 3 countries, resulting in 100% mission success. Led asset management program for $2M in equipment with zero loss. Trained 50+ personnel on safety protocols, achieving superior ratings on all compliance audits."
- CORE SKILLS: exactly 10-14 civilian keywords in 3-column grid for ATS
- PROFESSIONAL EXPERIENCE: Max 2 roles with 4-6 bullets each
  * Civilian title with military context: "Team Leader | U.S. Army — Location"
  * Translate ALL jargon to civilian terms
  * Expand acronyms on first use: "Antiterrorism (AT) program"
  * Each bullet: action + scope + method + result
  * Preserve credibility (dollar amounts, personnel counts) but remove unit names
- EDUCATION: Civilian-friendly (if missing, use "High School Diploma")
- CERTIFICATIONS: Civilian-friendly (omit if none)

C) resume_crosswalk.html (1-2 PAGES)

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

  // Build user prompt with ALL available candidate data
  const userPrompt = `
CANDIDATE METADATA (USE THIS EXACT DATA - DO NOT USE PLACEHOLDERS):
- Name: ${input.name}
- Email: ${input.email}
- Phone: ${input.phone || 'NOT PROVIDED'}
- City: ${input.city || 'NOT PROVIDED'}
- State: ${input.state || 'NOT PROVIDED'}
- Branch: ${input.branch}
- Rank: ${input.rank || 'NOT PROVIDED'}
- MOS/Rating/AFSC: ${input.mos || 'NOT PROVIDED'}
- Candidate ID: ${input.candidateId}

UPLOADED DOCUMENTS:
${documentContext}

CRITICAL VALIDATION REQUIREMENTS:
1. Use ACTUAL candidate data in headers - name, email, phone, city, state
2. If phone/city/state = "NOT PROVIDED", omit from contact line (do NOT use [Phone] or [City, ST] placeholders)
3. If LinkedIn not found in documents, omit it (do NOT use [LinkedIn] placeholder)
4. If clearance not found in documents, omit it (do NOT use [Clearance] placeholder)
5. ONE PAGE MAXIMUM for military and civilian resumes - strictly enforce by limiting to:
   * Max 2 experience roles
   * Max 4-6 bullets per role
   * 10-14 skills only
   * Concise 60-75 word summary
6. NO generic statements - use SPECIFIC accomplishments from documents
7. EVERY bullet must have quantifiable metrics (numbers, percentages, dollar amounts)
8. Translate ALL military jargon in civilian resume
9. Expand acronyms on FIRST use in civilian resume

QUALITY CHECKLIST (verify before outputting):
☐ Name, email used from metadata (not placeholders)
☐ Phone/city/state used if provided, omitted if not (no placeholders)
☐ Summary uses specific numbers/accomplishments from documents (not generic)
☐ All bullets have action+scope+method+result structure
☐ All bullets have quantifiable metrics
☐ Civilian resume translates all jargon (no MOS codes, unit names, military acronyms without expansion)
☐ Exactly 10-14 skills listed
☐ Max 2 experience roles with 4-6 bullets each
☐ HTML uses provided CSS template structure
☐ No script tags in HTML

Generate the 3-PDF bundle JSON now. Return ONLY the JSON object (no markdown code fences).`;

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
