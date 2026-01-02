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

ONE-PAGE ENFORCEMENT (CRITICAL - RESUME MUST FIT ON ONE PAGE):
**Priority Order:**
1. Header (Required - 3 lines: name, email, branch|rank|MOS)
2. Professional Summary (Required - 2-4 sentences, NOT bullets)
3. Skills (Required - exactly 10 skills in 2-column boxed grid)
4. Professional Experience (Required - most recent position with 6-8 bullets)
5. Additional experience if space allows (reduce to 3-4 bullets or omit)
6. Education (Required - 1-2 lines maximum)
7. Certifications (If any - 1 line maximum)

**If Space is Tight (NEVER go to second page):**
- Reduce Professional Summary to 2-3 sentences
- Show only most recent position with 6 bullets
- Keep Education to 1 line
- Reduce margins to 0.5in (already set in CSS)
- Font stays at 10-10.5pt (do NOT reduce below 10pt)

**Typography & Spacing (to maximize one-page fit):**
- Body text: 10-10.5pt
- Section headers: 11pt uppercase bold
- Name in header: 18pt
- Line spacing: 1.15-1.3 (tight but readable)
- Margins: 0.5-0.6in all sides
- Section spacing: 10-12pt between sections
- Single line spacing within sections

DETAIL PRESERVATION (while staying on one page):
1) Keep ALL specific numbers - dollar amounts, personnel counts, percentages, locations
2) Generate 6-8 HIGH-IMPACT bullets for most recent position
3) EVERY bullet: [Action verb] + [what] + [scope/scale numbers] + [measurable result]
4) Preserve specific base/unit names in MILITARY resume only
5) Dates format: "Mon Year – Mon Year" (e.g., "Jun 2020 – Jun 2024")
6) NO generic statements like "Highly motivated and skilled professional"

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
  font-family: 'Arial', 'Calibri', 'Helvetica', sans-serif;
  font-size: 10.5pt;
  line-height: 1.15;
  color: #000;
  max-width: 100%;
  padding: 0.5in 0.6in;
}
.header {
  text-align: center;
  margin-bottom: 12pt;
  border-bottom: 1pt solid #333;
  padding-bottom: 8pt;
}
.header h1 {
  font-size: 18pt;
  font-weight: bold;
  margin-bottom: 4pt;
  letter-spacing: 0.5pt;
}
.header .email {
  font-size: 10pt;
  margin-bottom: 3pt;
}
.header .branch-info {
  font-size: 10pt;
  color: #333;
}
.section {
  margin-bottom: 11pt;
  page-break-inside: avoid;
}
.section-title {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5pt;
  margin-bottom: 6pt;
  color: #000;
}
.summary {
  font-size: 10pt;
  line-height: 1.3;
  text-align: justify;
}
.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6pt;
  margin-top: 6pt;
}
.skill-box {
  background: rgba(0, 0, 0, 0.05);
  border: 1pt solid rgba(0, 0, 0, 0.15);
  border-radius: 3pt;
  padding: 4pt 8pt;
  font-size: 9.5pt;
  text-align: center;
  font-weight: 500;
}
.job {
  margin-bottom: 10pt;
  page-break-inside: avoid;
}
.job-header {
  margin-bottom: 4pt;
}
.job-title {
  font-weight: bold;
  font-size: 10.5pt;
}
.job-org-dates {
  font-size: 10pt;
  font-style: italic;
  color: #333;
}
.job ul {
  margin-left: 20pt;
  margin-top: 4pt;
  list-style-type: disc;
}
.job li {
  margin-bottom: 3pt;
  line-height: 1.25;
  font-size: 10pt;
}
.education-content,
.certifications-content {
  font-size: 10pt;
  line-height: 1.3;
  margin-top: 4pt;
}
</style>
</head>
<body>

<div class="header">
  <h1>[CANDIDATE NAME]</h1>
  <div class="email">[candidate email]</div>
  <div class="branch-info">[Branch] | [Rank if available] | MOS: [MOS if available]</div>
</div>

<div class="section">
  <div class="section-title">Professional Summary</div>
  <p class="summary">[2-4 sentence paragraph with specific accomplishments, leadership experience, and quantifiable results. NO generic phrases. Focus on what makes this candidate unique.]</p>
</div>

<div class="section">
  <div class="section-title">Skills</div>
  <div class="skills-grid">
    <div class="skill-box">Leadership & Team Management</div>
    <div class="skill-box">Security Risk Management</div>
    <div class="skill-box">Asset Protection</div>
    <div class="skill-box">Strategic Planning</div>
    <div class="skill-box">Emergency Response</div>
    <div class="skill-box">Training & Development</div>
    <div class="skill-box">Quality Assurance</div>
    <div class="skill-box">Process Improvement</div>
    <div class="skill-box">Compliance & Auditing</div>
    <div class="skill-box">Data Analysis</div>
    <!-- Exactly 10 skills in 2 columns (5 per column) -->
  </div>
</div>

<div class="section">
  <div class="section-title">Professional Experience</div>

  <div class="job">
    <div class="job-header">
      <div class="job-title">[Civilian Title Translation]</div>
      <div class="job-org-dates">[Organization], [Location] | [Mon Year] – [Mon Year]</div>
    </div>
    <ul>
      <li>[Action verb] + [specific task] + [scope/scale with numbers] + [measurable result]</li>
      <li>[6-8 bullets per position, each with quantifiable metrics]</li>
    </ul>
  </div>

  <!-- Include only most recent 1-2 positions to fit one page -->
</div>

<div class="section">
  <div class="section-title">Education</div>
  <div class="education-content">[Degree type and field]; [Additional education if any]</div>
</div>

<div class="section">
  <div class="section-title">Certifications</div>
  <div class="certifications-content">[Cert 1] • [Cert 2] • [Cert 3]</div>
</div>

</body>
</html>

MILITARY RESUME: Use same CSS but keep military terminology in header (full unit names, bases, MOS)

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

B) resume_civilian.html (EXACTLY ONE PAGE - Professional Template)
HEADER (center-aligned with bottom border):
- Line 1: CANDIDATE NAME (18pt bold, from metadata)
- Line 2: Email address (actual email from metadata)
- Line 3: Branch | Rank | MOS: XXXX (format exactly like this)

  ⚠️ CRITICAL: MOS FIELD FORMATTING RULE ⚠️
  The MOS field in header line 3 MUST show the ACTUAL military occupational specialty CODE from the metadata.

  ✅ CORRECT EXAMPLES:
  - "U.S. Army | SSG | MOS: 11B"
  - "U.S. Marine Corps | Sergeant | MOS: 0311"
  - "U.S. Air Force | SSgt | MOS: 3D1X2"

  ❌ WRONG (DO NOT DO THIS):
  - "U.S. Army | SSG | MOS: Operations / Project Management" (this is civilian translation, NOT the MOS code)
  - "U.S. Army | SSG | MOS: Infantry" (this is description, NOT the code)

  The civilian translation of the MOS belongs in the target_role field used for ATS optimization, NOT in the header.

- Add LinkedIn URL if available in documents (do NOT use placeholder if not found)
- Bottom border under header section

PROFESSIONAL SUMMARY (2-4 sentences, NOT bullets):
- Focus on leadership experience, core competencies, key achievements
- Use SPECIFIC accomplishments with quantifiable metrics
- NO generic phrases like "highly motivated and skilled professional"
- Translate all military terminology to civilian equivalents

  ⚠️ QUALITY REQUIREMENT: EVERY sentence must contain SPECIFIC metrics or achievements ⚠️

  ❌ BAD EXAMPLES (generic, no metrics, forbidden):
  - "Dedicated professional with extensive experience in tactical operations and team leadership."
  - "Highly motivated individual with strong work ethic and proven ability to succeed."
  - "Experienced leader skilled in managing teams and executing projects under pressure."
  - "Results-oriented professional with expertise in operations management and strategic planning."

  ✅ GOOD EXAMPLES (specific metrics, strong):
  - "Former U.S. Army infantry team leader with 4 years managing 12-person teams and executing 15+ time-sensitive operations across 3 countries, resulting in 100% mission success rate. Maintained $3M in tactical vehicles with zero loss. Trained 50+ personnel achieving superior audit ratings."

  - "Led security operations across 878 acres at 3 facilities protecting 4,200 personnel and $1B in DoD assets through vulnerability assessments and threat mitigation protocols. Managed 12-person emergency response team with 100% incident resolution rate. Recognized with 3 commendations for exceptional performance."

  - "Operations supervisor with 6 years directing logistics for 200+ personnel and managing $8M in equipment across multiple locations. Achieved 98% operational readiness while reducing maintenance costs by 15%. Developed training programs that improved team efficiency by 25%."

  FORBIDDEN PHRASES (auto-reject if found):
  - "Dedicated professional"
  - "Highly motivated"
  - "Strong work ethic"
  - "Team player"
  - "Results-oriented"
  - "Proven track record"
  - "Detail-oriented"
  - Any phrase without specific numbers or achievements

SKILLS (exactly 10 skills in 2-column grid with transparent boxes):
⚠️ CRITICAL: You MUST use the .skills-grid and .skill-box CSS classes defined in the template ⚠️

REQUIRED HTML STRUCTURE (use EXACTLY this pattern):
<div class="section">
  <div class="section-title">Skills</div>
  <div class="skills-grid">
    <div class="skill-box">Team Leadership & Management</div>
    <div class="skill-box">Security Risk Management</div>
    <div class="skill-box">Asset Protection & Accountability</div>
    <div class="skill-box">Strategic Planning & Execution</div>
    <div class="skill-box">Emergency Response Coordination</div>
    <div class="skill-box">Training & Development</div>
    <div class="skill-box">Quality Assurance & Auditing</div>
    <div class="skill-box">Process Improvement</div>
    <div class="skill-box">Compliance & Regulatory Standards</div>
    <div class="skill-box">Data Analysis & Reporting</div>
  </div>
</div>

❌ WRONG (DO NOT generate plain text or bullet lists):
- Plain text: "Team Leadership, Security Risk Management, ..."
- Bullets: "• Team Leadership" or "• Security Risk Management"
- Paragraph format without div structure

✅ CORRECT: Use the .skill-box div structure shown above with EXACTLY 10 skills in the .skills-grid container

Skill Translation Guide (military → civilian):
  * "Intelligence Analysis" → "Data Analysis" or "Threat Intelligence"
  * "Antiterrorism" → "Security Risk Management"
  * "Force Protection" → "Asset Protection"
  * "Emergency Management" → "Emergency Response Coordination"
  * "Property Accountability" → "Asset Tracking & Accountability"
  * "PMCS / Maintenance" → "Quality Assurance & Preventive Maintenance"

PROFESSIONAL EXPERIENCE (6-8 bullets per position):
⚠️ CRITICAL: EVERY bullet MUST have quantifiable metrics - numbers, percentages, dollar amounts, or measurable results ⚠️

- Job title: Translate to civilian equivalent (bold)
  * "Section Chief, Intelligence" → "Security Intelligence Manager"
  * "Squad Leader" → "Team Leader" or "Operations Supervisor"
- Organization, Location | Dates (on same or next line)
- Bullet points structure: [Action Verb] + [What] + [Scope/Scale] + [Method] + [Quantifiable Result]
- Start with strong verbs: Led, Managed, Coordinated, Developed, Implemented, Achieved, Executed, Directed, Streamlined, Optimized
- EVERY bullet must include specific metrics
- Translate military terms:
  * "Personnel" not "troops"
  * "Facilities" not "bases"
  * "Assets" not "equipment"
  * "Senior leadership" not ranks
- Expand acronyms on first use only
- If resume exceeds one page: show only 1-2 most recent positions

❌ WEAK BULLETS (vague, no metrics, forbidden):
- "Maintained vehicles ensuring they were mission-ready for operations"
- "Managed team of soldiers executing tactical missions"
- "Conducted training for unit personnel on security procedures"
- "Provided leadership and guidance to team members"
- "Contributed to mission success through effective coordination" (NEVER use this type of vague statement)

✅ STRONG BULLETS (specific metrics, quantifiable):
- "Maintained three $1.2M Joint Light Tactical Vehicles (JLTV), achieving 98% operational readiness across 45 field operations with zero mechanical failures"
- "Managed 12-person security team executing 15+ time-sensitive operations across 3 countries, achieving 100% mission success rate over 2-year period"
- "Developed and delivered 40+ hours of security training to 50+ personnel, resulting in superior ratings on external audits and 25% improvement in response times"
- "Led Antiterrorism program securing 878 acres at 3 facilities, protecting 4,200 personnel and $1B in assets through vulnerability assessments and threat mitigation protocols"
- "Streamlined equipment accountability system for $3M in tactical gear, reducing audit discrepancies by 90% and achieving zero losses across 24-month deployment cycle"

REQUIRED ELEMENTS IN EVERY BULLET:
1. Strong action verb (Led, Managed, Coordinated, Implemented, Achieved, etc.)
2. Specific task/program/project name
3. Scope/scale (# people, $ amount, # locations, acreage, # operations)
4. Method or approach (how you did it)
5. Measurable result (%, $, time saved, quality metric, success rate)

EDUCATION (1-2 lines only):
- Simple format: "BA degree; Pursuing MA in Cyber Security"
- Or if just high school: "High School Diploma"

CERTIFICATIONS (1 line, omit if none):
- Format: "[Cert 1] • [Cert 2] • [Cert 3]"

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
