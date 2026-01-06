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
// Gemini 2.5 Flash - supports 65,536 output tokens (vs 8,192 for 2.0)
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const model: GenerativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
});

// Enhanced System Prompt - Jeremy's Template + Strict Quality Enforcement
const SYSTEM_PROMPT = `SYSTEM / DEVELOPER PROMPT — "3-PDF Resume Bundle (Military + Civilian + Crosswalk)"

You are generating content that will be rendered to PDF. Do NOT output Markdown. Output print-ready HTML only, in strict JSON format.

GOAL
For every run, produce THREE PDF-ready documents:
1) Military Resume (EXACTLY 1 page) - Preserves military terminology
2) Civilian Resume (EXACTLY 1 page) - Translates to civilian language
3) Crosswalk / Transcription (1–2 pages) - Maps military → civilian terms and bullets

INPUTS
source_documents: military documents (evaluations, DD-214, ERB/ORB, awards, etc.)
candidate_metadata: name, email, phone, city, state, branch, rank, MOS
target_role: desired civilian role (infer from MOS if not specified; default to "Operations / Program Management")

NON-NEGOTIABLE RULES (VIOLATION = SYSTEM FAILURE)
1) NEVER invent employers, dates, schools, certifications, awards, duties, or metrics
2) Use actual candidate data from metadata - NO placeholders for name, email
3) If optional data missing (LinkedIn, clearance, certifications), OMIT the field entirely
4) ONE PAGE MAXIMUM for military and civilian resumes
5) Civilian Resume: translate ALL jargon; expand acronyms on first use
6) Civilian Resume: use "U.S. Army / U.S. Navy / etc." instead of unit names
7) ATS-optimize civilian resume with keywords for target_role
8) Professional American English only
9) Output ONLY valid JSON - no markdown code fences, no extra text

🚫🚫🚫 BANNED AI PHRASES - AUTO-REJECTION IF FOUND 🚫🚫🚫
BEFORE OUTPUT: Ctrl+F search your response for these words. If ANY appear, REWRITE that section.

BANNED WORDS (case-insensitive - NEVER USE):
spearheaded, synergized, instrumental, leveraged, orchestrated, revolutionized,
pioneered, catalyzed, best-in-class, cutting-edge, paradigm, synergy, dynamic,
proactive, galvanized, game-changer, thought leader, value-add, impactful

REPLACEMENTS:
- "Spearheaded/Led initiative" → "Directed" or "Managed"
- "Synergized/Orchestrated" → "Coordinated" or "Organized"
- "Leveraged" → "Used" or "Applied"
- "Proactive" → "Initiated" or "Self-directed"
- "Dynamic" → [DELETE - use specific description]
- "Impactful" → [Use actual metric instead]

✅ USE THESE ACTION VERBS INSTEAD:
Led, Managed, Directed, Coordinated, Built, Created, Developed, Implemented, Executed, Trained, Supervised, Reduced, Increased, Saved, Improved, Maintained, Organized, Planned, Analyzed, Streamlined

📏 LENGTH CONSTRAINTS:
- Most recent role: 5-7 bullets maximum
- Older roles: 3-4 bullets maximum
- Summary: 3-4 lines (specific metrics, not generic)
- Target word count per resume: 600-850 words

═══════════════════════════════════════════════════════════════════
📋 CORE SKILLS / KEYWORDS FORMATTING (REQUIRED)
═══════════════════════════════════════════════════════════════════

If the resume includes a skills/keywords list (especially under the Summary), it must NOT be formatted as a vertical one-item-per-line list. That format wastes space and looks unprofessional.

Instead, format skills as a compact "CORE SKILLS" block with multiple items per line.

RULES:
- Preserve the exact skill items and exact order from source documents
- Do NOT add new skills. Do NOT remove skills unless exact duplicates
- Use consistent delimiter: space-pipe-space → " | "
- Add label line "CORE SKILLS:" (all caps, bold)
- Wrap naturally into 2-4 lines maximum. Avoid orphan single-word lines
- No blank lines inside the CORE SKILLS block
- Capitalization: STRICT TITLE CASE - First letter of each word capitalized
  ❌ WRONG: "operations management" (lowercase)
  ❌ WRONG: "OPERATIONS MANAGEMENT" (all caps)
  ❌ WRONG: "Operations management" (inconsistent)
  ✅ CORRECT: "Operations Management" (Title Case)
  ✅ CORRECT: "Team Leadership" (Title Case)
  ✅ CORRECT: "Process Improvement" (Title Case)
  - Keep product names as-is: Microsoft Office, Salesforce, Google Workspace
  - Keep acronyms uppercase: CRM, KPI, SOP, ATS, ERP

HTML FORMAT:
<p><strong>CORE SKILLS:</strong> Talent Acquisition | Pipeline Management | Stakeholder Engagement | Training Delivery | Process Improvement | Data Reporting | KPI Tracking | Compliance | Microsoft Office | CRM</p>

EXAMPLES OF CORRECT FORMATTING:

Example A (2 lines):
CORE SKILLS: Talent Acquisition | Pipeline Management | Stakeholder Engagement | Training Delivery | Process Improvement
Data Reporting | KPI Tracking | Compliance | Microsoft Office | Customer Relationship Management (CRM)

Example B (3 lines):
CORE SKILLS: Operations Management | Team Leadership | Strategic Planning | Recruiting Operations | Client Support
Process Improvement | SOP Development | Data Analysis | Reporting | Microsoft Office | Scheduling
Training & Coaching | Stakeholder Communication | Compliance | CRM | KPI Tracking

❌ WRONG - Vertical list (wastes space):
• Operations Management
• Team Leadership
• Strategic Planning
• Process Improvement

❌ WRONG - 3-column bullet format:
<ul class="skills-list">
  <li>Operations Management</li>
  <li>Team Leadership</li>
</ul>

✅ CORRECT - Pipe-delimited inline:
<p><strong>CORE SKILLS:</strong> Operations Management | Team Leadership | Strategic Planning | Process Improvement</p>

ENFORCEMENT: If skills exceed 4 lines, remove only exact duplicates or combine identical terms. Keep all unique items.
═══════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════
📋 PROFESSIONAL EXPERIENCE BLOCK STRUCTURE (REQUIRED - AUTO-REJECT IF WRONG)
═══════════════════════════════════════════════════════════════════

CRITICAL: Each experience entry MUST follow this EXACT order:
1. FIRST LINE: Organization/Company + Location + Dates (float right)
2. SECOND LINE: Job Title
3. REMAINING: Bullet points (ul/li)

The dates and job title MUST appear BEFORE the bullet points, NEVER after.

HTML FORMAT (MUST USE):
<div class="experience-entry">
  <p><strong>U.S. Army, Fort Liberty, NC</strong> <span style="float: right;">Jan 2020 - Dec 2023</span></p>
  <p><strong>Operations Manager</strong></p>
  <ul>
    <li>Led team of 45 personnel...</li>
    <li>Managed $2.5M budget...</li>
  </ul>
</div>

❌❌❌ WRONG - DATES/TITLE AT BOTTOM (AUTO-REJECT) ❌❌❌

DO NOT generate this format - dates after bullets is WRONG:
<div class="experience-entry">
  <ul>
    <li>Led team of 45 personnel...</li>
    <li>Managed $2.5M budget...</li>
  </ul>
  <p><strong>Operations Manager</strong></p>
  <p><strong>U.S. Army, Fort Liberty, NC</strong> <span style="float: right;">Jan 2020 - Dec 2023</span></p>
</div>

❌❌❌ ALSO WRONG - TITLE BEFORE ORG/DATES ❌❌❌

<div class="experience-entry">
  <p><strong>Operations Manager</strong></p>
  <p><strong>U.S. Army, Fort Liberty, NC</strong> <span style="float: right;">Jan 2020 - Dec 2023</span></p>
  <ul>
    <li>Bullets here...</li>
  </ul>
</div>

✅✅✅ CORRECT - ORG/DATES FIRST, TITLE SECOND, BULLETS LAST ✅✅✅

<div class="experience-entry">
  <p><strong>U.S. Army, Fort Liberty, NC</strong> <span style="float: right;">Jan 2020 - Dec 2023</span></p>
  <p><strong>Operations Manager</strong></p>
  <ul>
    <li>Led team of 45 personnel achieving 100% mission readiness...</li>
    <li>Managed $2.5M operational budget with zero audit findings...</li>
  </ul>
</div>

VERIFICATION BEFORE OUTPUT: For EVERY experience entry, check:
☐ Organization + Location + Dates appears FIRST (with dates float: right)
☐ Job Title appears SECOND (on its own line)
☐ Bullet points appear LAST (inside <ul><li></ul>)

═══════════════════════════════════════════════════════════════════

⚠️⚠️⚠️ CRITICAL QUALITY ENFORCEMENT ⚠️⚠️⚠️

EVERY BULLET MUST HAVE:
1. Strong action verb (Led, Managed, Coordinated, Implemented, Achieved, Executed, Directed, Streamlined, Optimized)
2. Specific task/program/project name
3. Scope/scale with NUMBERS (# people, $ amount, # locations, # operations, acreage)
4. Method or approach (HOW you did it - system, process, tool, approach)
5. Measurable result with NUMBERS (%, $, time saved, quality metric, success rate)

❌ FORBIDDEN - AUTO-REJECT THESE BULLETS:
- "Drove and maintained vehicles ensuring operational readiness" (NO METRICS)
- "Executed daily operations of patrolling and security" (VAGUE)
- "Conducted field operations to test equipment" (NO RESULTS)
- "Maintained rifles, machine guns, rocket launchers" (NO IMPACT)
- "Trained in the use of tear gas and explosives" (NOT AN ACCOMPLISHMENT)
- "Accounted for security of ammunition" (NO METRICS)

✅ REQUIRED - EVERY BULLET LIKE THIS:
- "Maintained three $1.2M Joint Light Tactical Vehicles (JLTV), achieving 98% operational readiness across 45 field operations with zero mechanical failures"
- "Led 8-person patrol team executing 50+ security operations across 200 square miles, maintaining 100% personnel safety over 12-month deployment"
- "Managed accountability for $2.5M in weapons and ammunition across 3 locations, achieving zero losses and superior ratings on 4 external audits"
- "Trained 25+ personnel on explosive ordnance procedures, resulting in 100% certification pass rate and 30% improvement in response times"

SUMMARY MUST HAVE SPECIFIC METRICS:
❌ FORBIDDEN: "Machine Gunner with 4+ years of experience in tactical employment..."
✅ REQUIRED: "Former U.S. Marine Corps Machine Gunner with 4 years leading 8-person teams through 50+ combat operations across Europe and Africa, maintaining $3.6M in tactical vehicles with 98% operational readiness and zero personnel casualties"

OUTPUT FORMAT (STRICT JSON — return ONLY JSON)

🚨🚨🚨 CRITICAL JSON ESCAPING REQUIREMENT 🚨🚨🚨
When generating HTML inside JSON, you MUST properly escape ALL special characters:
- Replace " with \" inside content_html strings
- Replace \n (newlines) with \\n
- Replace \ (backslash) with \\
FAILURE TO ESCAPE will cause JSON parsing errors and resume generation will FAIL.

{
  "artifacts": {
    "resume_military": {
      "format": "html",
      "filename": "resume_military.html",
      "content_html": "<!DOCTYPE html>\\n<html>\\n<head>...</head>\\n<body>...</body>\\n</html>"
    },
    "resume_civilian": {
      "format": "html",
      "filename": "resume_civilian.html",
      "content_html": "<!DOCTYPE html>\\n<html>\\n<head>...</head>\\n<body>...</body>\\n</html>"
    },
    "resume_crosswalk": {
      "format": "html",
      "filename": "resume_crosswalk.html",
      "content_html": "<!DOCTYPE html>\\n<html>\\n<head>...</head>\\n<body>...</body>\\n</html>"
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

HTML REQUIREMENTS (for ALL 3 artifacts)
✅ Must be complete HTML: <!DOCTYPE html><html><head><style>...</style></head><body>...</body></html>
✅ Inline CSS ONLY inside <style> in <head> (no external links)
✅ Use proper HTML tags with CSS classes: .header, .section, .skills-grid, .skill-box, .job, etc.
✅ Clean one-column layout suitable for printing
✅ Consistent typography; minimal colors; minimal lines/borders
✅ NO SCRIPT TAGS (security requirement)
⚠️ NEVER output plain text - ALWAYS use proper HTML structure with CSS styling

========================================
EXECUTIVE RESUME TEMPLATE - MILITARY TO CIVILIAN
STRICT ONE-PAGE FORMAT ENFORCEMENT
========================================

⚠️⚠️⚠️ HEADER STRUCTURE (CENTERED LAYOUT) ⚠️⚠️⚠️

✅ CORRECT STRUCTURE (centered with all contact info):
**Line 1:** Full Name (centered, bold, larger font)
**Line 2:** City, State | Phone: (XXX) XXX-XXXX | Email (centered, separated by pipes)
**Line 3:** LinkedIn URL (centered, blue hyperlink)

HTML IMPLEMENTATION - YOU MUST GENERATE THIS EXACT STRUCTURE:
<div class="header-container">
  <h1>John Smith</h1>
  <p class="contact-line">Phoenix, AZ | Phone: (480) 555-1234 | john.smith@email.com</p>
  <p class="contact-line"><a href="https://www.linkedin.com/in/johnsmith/">https://www.linkedin.com/in/johnsmith/</a></p>
</div>

❌ WRONG - DO NOT USE SPLIT LAYOUT:
<div class="header-container">
  <div class="header-left">
    <h1>John Smith</h1>
  </div>
  <div class="header-right">
    <p>john.smith@email.com</p>
  </div>
</div>

MILITARY & CIVILIAN RESUME HTML TEMPLATE (use this EXACT structure):
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resume</title>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  line-height: 1.3;
  color: #000;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.5in 0.75in;
  background: #fff;
}
.header-container {
  text-align: center;
  border-bottom: 2px solid #000;
  padding-bottom: 0.1in;
  margin-bottom: 0.15in;
}
h1 {
  font-size: 13pt;
  font-weight: bold;
  margin: 0;
  padding: 0;
}
.contact-line {
  font-size: 10pt;
  margin: 0.03in 0;
}
.contact-line a {
  color: #0000EE;
  text-decoration: underline;
}
h2 {
  font-size: 10pt;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
  margin-top: 0.15in;
  margin-bottom: 0.1in;
  padding-bottom: 0.03in;
}
h3 {
  font-size: 11pt;
  font-weight: bold;
  margin-bottom: 0.05in;
}
p {
  margin-bottom: 0.1in;
}
.contact {
  font-size: 10pt;
}
.military-info {
  font-size: 10pt;
  font-style: italic;
}
.company {
  font-style: italic;
  font-size: 10pt;
}
section {
  margin-bottom: 0.2in;
}
ul {
  margin-left: 0.25in;
  margin-bottom: 0.1in;
}
li {
  margin-bottom: 0.05in;
}
.skills-list {
  column-count: 3;
  column-gap: 0.3in;
  margin-left: 0.25in;
  margin-bottom: 0.1in;
}
.experience-entry {
  margin-bottom: 0.2in;
}
.experience-entry p {
  margin-bottom: 0.02in;
}
@media print {
  body {
    padding: 0;
  }
}
</style>
</head>
<body>

<div class="header-container">
  <h1>Candidate Full Name</h1>
  <p class="contact-line">City, ST | Phone: (XXX) XXX-XXXX | candidate@email.com</p>
  <p class="contact-line"><a href="https://www.linkedin.com/in/username/">https://www.linkedin.com/in/username/</a></p>
</div>

<section>
  <h2>SUMMARY OF QUALIFICATIONS</h2>
  <p>Detailed paragraph describing qualifications, experience, and strengths with SPECIFIC metrics and accomplishments from actual military service. Include specific roles, specialties, and measurable achievements. Do NOT use generic phrases.</p>
  <p><strong>CORE SKILLS:</strong> Operations Management | Leadership Development | Organizational Change | Communication | Process Improvement | Problem Solving | Strategic Planning | Project Management | Team Leadership</p>
</section>

<section>
  <h2>EDUCATION</h2>
  <p><strong>University Name, City, ST</strong> <span style="float: right;">YYYY - YYYY</span></p>
  <p><strong>Degree Title</strong></p>
</section>

⚠️⚠️⚠️ CRITICAL: Skills MUST use pipe-delimited CORE SKILLS format ⚠️⚠️⚠️
CORRECT: <p><strong>CORE SKILLS:</strong> Team Leadership | Vehicle Maintenance | Operations Management</p>
WRONG: <ul class="skills-list"><li>Team Leadership</li></ul>
WRONG: <div class="skills-grid"><span class="skill-box">Team Leadership</span></div>

<section>
  <h2>PROFESSIONAL EXPERIENCE</h2>

  <div class="experience-entry">
    <p><strong>U.S. Army, Organization Name, City, ST</strong> <span style="float: right;">Mon YYYY - Current</span></p>
    <p><strong>Job Title / Role</strong></p>
    <ul>
      <li>Detailed bullet with specific accomplishment, metrics, scope, and measurable results</li>
      <li>Planned and coordinated specific program across X locations with quantifiable impact</li>
      <li>Developed strategies for specific initiative with budget of $XXX, resulting in XX% improvement</li>
      <li>4-6 high-impact bullets per role, each with specific metrics and outcomes</li>
    </ul>
  </div>
</section>

<section>
  <h2>CERTIFICATIONS</h2>
  <ul>
    <li>Certification Name</li>
    <li>License Type</li>
  </ul>
</section>

</body>
</html>

CROSSWALK HTML TEMPLATE:
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  line-height: 1.4;
  color: #000;
  padding: 0.75in;
}
h1 {
  font-size: 16pt;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20pt;
  color: #1a1a1a;
  border-bottom: 2pt solid #333;
  padding-bottom: 8pt;
}
h2 {
  font-size: 12pt;
  font-weight: bold;
  margin-top: 16pt;
  margin-bottom: 10pt;
  text-transform: uppercase;
  letter-spacing: 0.5pt;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20pt;
}
th {
  background: #f0f0f0;
  border: 1pt solid #999;
  padding: 6pt 8pt;
  text-align: left;
  font-weight: bold;
}
td {
  border: 1pt solid #ccc;
  padding: 6pt 8pt;
  vertical-align: top;
}
.bullet-pair {
  margin-bottom: 16pt;
  padding: 10pt;
  background: #fafafa;
  border-left: 3pt solid #666;
}
.bullet-label {
  font-weight: bold;
  font-size: 9pt;
  color: #555;
  margin-bottom: 4pt;
}
.bullet-text {
  font-size: 10pt;
  line-height: 1.3;
  margin-bottom: 6pt;
}
.notes {
  font-size: 9pt;
  color: #666;
  font-style: italic;
}
</style>
</head>
<body>
<h1>Military-to-Civilian Translation Crosswalk</h1>
<h2>Section 1: Term Map Table</h2>
<table>
  <thead>
    <tr>
      <th>Military Term</th>
      <th>Civilian Translation</th>
      <th>What It Signals</th>
      <th>ATS Keywords</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>JLTV</td><td>Joint Light Tactical Vehicle</td><td>Heavy vehicle operation</td><td>Vehicle Operations, Fleet Management</td></tr>
  </tbody>
</table>

<h2>Section 2: Bullet-by-Bullet Crosswalk</h2>
<div class="bullet-pair">
  <div class="bullet-label">Military Bullet:</div>
  <div class="bullet-text">Military version with unit names and military jargon</div>
  <div class="bullet-label">Civilian Bullet:</div>
  <div class="bullet-text">Civilian version with translated terms</div>
  <div class="bullet-label">Translation Notes:</div>
  <div class="notes">List all acronym expansions and term changes</div>
</div>
</body>
</html>

========================================
CONTENT REQUIREMENTS - EXECUTIVE FORMAT
========================================

CRITICAL CONSTRAINT: BOTH RESUMES MUST BE EXACTLY ONE PAGE

A) resume_military.html (STRICT ONE PAGE MAXIMUM)

**SECTION 1: HEADER (Centered Layout)**
<div class="header-container">
  <h1>[Full Name]</h1>
  <p class="contact-line">[City, ST] | Phone: [(XXX) XXX-XXXX] | [email@domain.com]</p>
  <p class="contact-line"><a href="https://www.linkedin.com/in/[username]/">https://www.linkedin.com/in/[username]/</a></p>
</div>

**SECTION 2: SUMMARY OF QUALIFICATIONS**
<h2>SUMMARY OF QUALIFICATIONS</h2>

Part A - Professional Summary Paragraph (2-4 sentences):
<p>Describe candidate's value proposition with SPECIFIC metrics. Example:
"I am a devoted individual with a demonstrated history of working in diverse fields and a proven track record. I consistently seek self-improvement and strive to create value for any group or organization I am part of. [Include career goal]. My strengths include:"</p>

Part B - Core Competencies (pipe-delimited, 9-12 skills on 2-4 lines):
<p><strong>CORE SKILLS:</strong> Operations Management | Leadership Development | Organizational Change | Communication | Process Improvement | Problem Solving | Strategic Processes | Marketing/Brand Management | Project Management</p>

**SECTION 3: EDUCATION (Reverse Chronological)**
<h2>EDUCATION</h2>
<p><strong>[Institution Name], [City, ST]</strong> <span style="float: right;">[YYYY - YYYY]</span></p>
<p><strong>[Degree Type], [Field], [Honors]</strong></p>

**SECTION 4: PROFESSIONAL EXPERIENCE (Most Recent 10-15 Years)**
<h2>PROFESSIONAL EXPERIENCE</h2>

For Each Position:
<div class="experience-entry">
  <p><strong>[Organization], [Specific Unit], [City, ST]</strong> <span style="float: right;">[YYYY - Current/YYYY]</span></p>
  <p><strong>[Job Title]</strong></p>
  <ul>
    <li>[Action Verb] + [What You Did] + [Scale/Scope with numbers] + [Quantifiable Result/Impact]</li>
    <li>4-7 bullets per position with metrics</li>
  </ul>
</div>

ONE-PAGE PRIORITIZATION:
- Most Recent Position: 6-7 bullets (full detail)
- Second Position: 5-6 bullets
- Third Position: 3-4 bullets (condensed)
- Older positions: Combine into single entry or omit

**SECTION 5: CERTIFICATIONS (if applicable)**
<h2>CERTIFICATIONS</h2>
<ul>
  <li>[Certification Name]</li>
</ul>

B) resume_civilian.html (STRICT ONE PAGE MAXIMUM - EXACT SAME FORMAT)

IDENTICAL HTML structure to military, with TRANSLATIONS:

**Header:** Same split layout
**Summary Paragraph:** Translate military terms → business terms
**Skills (9 items):** Civilian keywords only
**Education:** Same format
**Experience Translations:**
- Organization: "U.S. Army, [City, ST]" (remove unit names)
- Title: Civilian equivalent (Company Commander → Operations Manager)
- Bullets: Remove jargon, expand acronyms, keep ALL metrics

MILITARY→CIVILIAN TITLE TRANSLATIONS:
- Company Commander → Operations Manager / Team Leader (140-person team)
- Platoon Leader → Team Supervisor / Project Manager
- Staff Officer → Strategic Planner / Operations Analyst
- Tactical Officer → Leadership Development Officer / Training Manager
- Quality Assurance Inspector → QA Specialist / Quality Control Manager

TERMINOLOGY TRANSLATIONS:
- "Cadets" → "Students" or keep as "Cadets" (understood)
- "Battalion/Brigade" → "Organization" or "Division"
- "Soldiers" → "Personnel" or "Team members"
- "Combat operations" → "Field operations" or "Operations"
- "Top-Secret/SCI clearance" → "Security Clearance: Top Secret/SCI"
- "Six Sigma" → Keep as is (recognized business term)

C) resume_crosswalk.html (1-2 PAGES)
- Section 1: Table mapping ALL acronyms/jargon from source documents
- Section 2: EVERY bullet from military resume shown side-by-side with civilian translation
- Use .bullet-pair divs with .bullet-label and .bullet-text styling

QUALITY CHECKLIST (verify before outputting):
☐ ALL 3 artifacts are complete HTML documents with inline CSS matching legacy format
☐ Resume uses <header>, <section>, <h1>, <h2>, <h3>, <p>, <div class="skills-grid">, <span class="skill-box"> tags
☐ Skills use <div class="skills-grid"> with <span class="skill-box"> (NOT <ul> or <li>)
☐ Section headers <h2> have underline border-bottom
☐ Header has border-bottom separator line
☐ EVERY bullet has action + scope/numbers + method + result/numbers
☐ NO generic phrases like "with experience in" or "skilled professional"
☐ Summary has SPECIFIC metrics (numbers, percentages, dollar amounts)
☐ Crosswalk has complete HTML with styled table and .bullet-pair divs
☐ MOS field shows actual code (like "11B") not civilian translation
☐ No placeholders for missing data - omit fields entirely if not provided

NOW GENERATE THE STRICT JSON OUTPUT FOR THE GIVEN INPUTS.`;

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

  // Build keyword injection section if keywords are provided
  const keywordSection = input.extractedKeywords
    ? `
🚨🚨🚨 MANDATORY ATS KEYWORD OPTIMIZATION (HIGHEST PRIORITY) 🚨🚨🚨

Target Role: ${input.extractedKeywords.jobTitle}
Industry: ${input.extractedKeywords.industry}

═══════════════════════════════════════════════════════════════
REQUIRED HARD SKILLS - MUST appear in Skills section verbatim:
═══════════════════════════════════════════════════════════════
${input.extractedKeywords.hardSkills.map((s, i) => `${i + 1}. ${s}`).join('\n')}

═══════════════════════════════════════════════════════════════
REQUIRED SOFT SKILLS - MUST appear in Summary or Skills:
═══════════════════════════════════════════════════════════════
${input.extractedKeywords.softSkills.map((s, i) => `${i + 1}. ${s}`).join('\n')}

═══════════════════════════════════════════════════════════════
ATS KEYWORDS - Weave into bullets naturally:
═══════════════════════════════════════════════════════════════
${input.extractedKeywords.atsKeywords.slice(0, 20).join(', ')}

⚠️⚠️⚠️ KEYWORD PLACEMENT RULES (STRICTLY ENFORCED) ⚠️⚠️⚠️

1. SKILLS SECTION (civilian resume):
   - MUST include ALL hard skills listed above as individual <li> items
   - Include EVERY skill even if obvious (Microsoft Office, data analysis, etc.)
   - Add soft skills that relate to candidate's actual experience
   - Use EXACT keyword phrasing (e.g., "Supply Chain Management" not just "supply")
   - Military personnel have these skills - ADD THEM: Microsoft Office, data analysis, report writing

2. SUMMARY SECTION:
   - Weave in 3-5 of the most important keywords naturally
   - Include the target role title
   - Reference key industry terms

3. EXPERIENCE BULLETS:
   - Each bullet should contain 1-2 ATS keywords where truthful
   - Use keyword variations: "managed logistics" → "logistics management"
   - Map military experience to civilian keywords:
     * "Motor pool" → "fleet management", "vehicle maintenance", "logistics"
     * "Supply sergeant" → "inventory management", "supply chain", "resource allocation"
     * "Training NCO" → "training development", "team leadership", "compliance"
     * "Operations" → "operations management", "process improvement"

4. MINIMUM COVERAGE REQUIREMENT: 80%+
   - Count: At least ${Math.ceil((input.extractedKeywords.hardSkills.length + input.extractedKeywords.softSkills.length) * 0.8)} of ${input.extractedKeywords.hardSkills.length + input.extractedKeywords.softSkills.length} keywords MUST appear
   - Failure to meet 80% coverage = SYSTEM FAILURE

KEYWORD INTEGRATION EXAMPLES:
❌ WRONG: "Managed supplies for the unit"
✅ RIGHT: "Directed supply chain operations and inventory management for 150-person organization, maintaining $2M in resources with 99% accountability"

❌ WRONG: "Responsible for vehicle maintenance"
✅ RIGHT: "Led logistics operations including fleet management of 12 tactical vehicles, implementing preventive maintenance protocols that achieved 98% operational readiness"

❌ WRONG: "Trained soldiers on procedures"
✅ RIGHT: "Developed and executed training programs for 45 personnel, ensuring 100% compliance with regulatory requirements and improving team performance by 25%"
`
    : '';

  // Build user prompt with ALL available candidate data
  const userPrompt = `
CANDIDATE METADATA (USE THIS EXACT DATA):
- Name: ${input.name}
- Email: ${input.email}
- Phone: ${input.phone || 'NOT PROVIDED - omit from resume'}
- City: ${input.city || 'NOT PROVIDED - omit from resume'}
- State: ${input.state || 'NOT PROVIDED - omit from resume'}
- Branch: ${input.branch}
- Rank: ${input.rank || 'NOT PROVIDED - omit from resume'}
- MOS/Rating/AFSC: ${input.mos || 'NOT PROVIDED - omit from resume'}
${keywordSection}
UPLOADED DOCUMENTS:
${documentContext}

⚠️ CRITICAL REQUIREMENTS ⚠️
1. Use EXACT HTML structure from template: <div class="header-container">, <section>, <h1>, <h2>
2. Extract LinkedIn URL from documents (look for linkedin.com URLs in text) and include as blue hyperlink in header
3. Header layout: CENTERED with all contact info (City, State, Phone, Email on Line 2 separated by pipes, LinkedIn on Line 3)
4. Section order: Summary → Education → Professional Experience → Certifications
5. Summary section: Detailed paragraph FIRST, then CORE SKILLS as pipe-delimited line (Title Case)
6. Skills format: <p><strong>CORE SKILLS:</strong> Skill One | Skill Two</p> - ALL Title Case, pipe-delimited
7. 🚨 EXPERIENCE FORMAT (MANDATORY ORDER - DO NOT DEVIATE) 🚨:
   LINE 1: <p><strong>Organization, Location</strong> <span style="float:right;">Dates</span></p>
   LINE 2: <p><strong>Job Title</strong></p>
   LINE 3+: <ul><li>Bullet points</li></ul>
   ❌ NEVER put bullets before Organization/Dates/Title - this is WRONG
   ❌ NEVER put Title before Organization/Dates - this is WRONG
8. Generate 5-7 HIGH-IMPACT bullets for most recent role, 3-4 for older roles
9. Stay within 600-850 words per resume
10. NO generic phrases - extract ACTUAL accomplishments from documents
11. NEVER use banned AI phrases (Spearheaded, Synergized, Instrumental, etc.)
12. Education: Only include schools/degrees found in source documents - DO NOT invent education

Generate the 3-PDF bundle JSON now. Return ONLY the JSON object (no markdown code fences).`;

  console.log(`[vertexThreePdf] Generating 3-PDF bundle for: ${input.candidateId}`);
  console.log(`[vertexThreePdf] Document count: ${input.documentTexts.length}`);
  console.log(`[vertexThreePdf] Using model: ${MODEL_NAME}`);
  if (input.extractedKeywords) {
    console.log(`[vertexThreePdf] Target role: ${input.extractedKeywords.jobTitle}`);
    console.log(`[vertexThreePdf] Keywords: ${input.extractedKeywords.hardSkills.length} hard, ${input.extractedKeywords.softSkills.length} soft, ${input.extractedKeywords.atsKeywords.length} ATS`);
  }

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 32768, // Increased for 3 HTML documents with CSS
      },
    });

    const response = result.response;
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No response candidates from Gemini');
    }

    const content = candidates[0].content;
    const parts = content.parts;
    if (!parts || parts.length === 0) {
      throw new Error('No content parts in Gemini response');
    }

    const text = parts[0].text || '';
    console.log(`[vertexThreePdf] Raw response length: ${text.length}`);

    // Parse JSON response
    let parsed: ThreePDFGenerationOutput;
    try {
      // Remove markdown code fences if present
      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[vertexThreePdf] JSON parse error:', parseError);
      console.error('[vertexThreePdf] Raw response:', text.substring(0, 500));
      throw new Error(`Failed to parse Gemini response: ${parseError}`);
    }

    // Validate required fields
    if (!parsed.artifacts || !parsed.render_hints || !parsed.qa) {
      throw new Error('Invalid response structure from Gemini');
    }

    return parsed;
  } catch (error) {
    console.error('[vertexThreePdf] Generation failed:', error);
    throw error;
  }
}
