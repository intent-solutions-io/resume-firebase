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

HTML REQUIREMENTS (for ALL 3 artifacts)
✅ Must be complete HTML: <!DOCTYPE html><html><head><style>...</style></head><body>...</body></html>
✅ Inline CSS ONLY inside <style> in <head> (no external links)
✅ Use proper HTML tags with CSS classes: .header, .section, .skills-grid, .skill-box, .job, etc.
✅ Clean one-column layout suitable for printing
✅ Consistent typography; minimal colors; minimal lines/borders
✅ NO SCRIPT TAGS (security requirement)
⚠️ NEVER output plain text - ALWAYS use proper HTML structure with CSS styling

MILITARY & CIVILIAN RESUME HTML TEMPLATE (use this EXACT structure from working legacy PDF):
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
  line-height: 1.4;
  color: #000;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.5in;
  background: #fff;
}
header {
  text-align: center;
  margin-bottom: 0.5in;
  border-bottom: 1px solid #333;
  padding-bottom: 0.25in;
}
h1 {
  font-size: 18pt;
  font-weight: bold;
  margin-bottom: 0.1in;
}
h2 {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #666;
  margin-top: 0.25in;
  margin-bottom: 0.15in;
  padding-bottom: 0.05in;
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
  column-count: 2;
  column-gap: 0.5in;
}
.experience-entry {
  margin-bottom: 0.2in;
}
@media print {
  body {
    padding: 0;
  }
}
</style>
</head>
<body>

<header>
  <h1>CANDIDATE NAME</h1>
  <p class="contact">candidate@email.com</p>
  <p class="military-info">Branch | Rank | MOS: CODE</p>
</header>

<section>
  <h2>Professional Summary</h2>
  <p>2-4 sentences with SPECIFIC accomplishments and QUANTIFIABLE metrics. NO generic phrases.</p>
</section>

<section>
  <h2>Skills</h2>
  <ul class="skills-list">
    <li>Skill 1</li>
    <li>Skill 2</li>
    <li>Skill 3</li>
    <li>Skill 4</li>
    <li>Skill 5</li>
    <li>Skill 6</li>
    <li>Skill 7</li>
    <li>Skill 8</li>
    <li>Skill 9</li>
    <li>Skill 10</li>
  </ul>
</section>

<section>
  <h2>Professional Experience</h2>

  <div class="experience-entry">
    <h3>Job Title</h3>
    <p class="company">Organization, Location | Mon YYYY – Mon YYYY</p>
    <ul>
      <li>Verb + task + scope with numbers + method + measurable result with numbers</li>
      <li>Verb + task + scope with numbers + method + measurable result with numbers</li>
      <li>6-8 bullets per position, EACH with quantifiable metrics</li>
    </ul>
  </div>
</section>

<section>
  <h2>Education</h2>
  <p>Degree or High School Diploma</p>
</section>

<section>
  <h2>Certifications</h2>
  <ul>
    <li>Cert 1</li>
    <li>Cert 2</li>
    <li>Cert 3</li>
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

CONTENT REQUIREMENTS:

A) resume_military.html (EXACTLY ONE PAGE)
Use <header> tag with:
- <h1> for name
- <p class="contact"> for email
- <p class="military-info"> for "Branch | Rank | MOS: CODE"

Use <section> tags with <h2> for section titles:
- Professional Summary: <p> with SPECIFIC metrics from documents
- Skills: <ul class="skills-list"> with exactly 10 <li> items (will display in 2 columns via CSS)
- Professional Experience: <div class="experience-entry"> with <h3> for job title, <p class="company"> for org/dates, <ul> for 6-8 bullets
  * Keep military titles/rank/unit
  * Each bullet: verb + task + scope/numbers + method + result/numbers
- Education: <p> with degree or "High School Diploma"
- Certifications: <ul> with <li> items (only if present in documents)

B) resume_civilian.html (EXACTLY ONE PAGE)
Use EXACT SAME HTML structure as military, but:
- Header: "Branch | Rank | MOS: [ACTUAL MOS CODE like 11B, NOT civilian translation]"
- Professional Summary: <p> with SPECIFIC metrics, translate military terms
- Skills: <ul class="skills-list"> with exactly 10 <li> items (civilian-translated)
- Professional Experience: <div class="experience-entry"> for each role
  * <h3> with civilian job title translation
  * <p class="company"> with "U.S. Army" or "U.S. Navy" (not unit names), Location | Dates
  * <ul> with 6-8 <li> bullets, each with: verb + task + scope/numbers + method + result/numbers
  * Translate ALL military jargon; expand acronyms on first use
- Education: <p> with civilian-friendly phrasing
- Certifications: <ul> with <li> items (only if present)

C) resume_crosswalk.html (1-2 PAGES)
- Section 1: Table mapping ALL acronyms/jargon from source documents
- Section 2: EVERY bullet from military resume shown side-by-side with civilian translation
- Use .bullet-pair divs with .bullet-label and .bullet-text styling

QUALITY CHECKLIST (verify before outputting):
☐ ALL 3 artifacts are complete HTML documents with inline CSS matching legacy format
☐ Resume uses <header>, <section>, <h1>, <h2>, <h3>, <p>, <ul>, <li> tags (NOT divs)
☐ Skills use <ul class="skills-list"> with <li> items (will display in 2 columns)
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

UPLOADED DOCUMENTS:
${documentContext}

⚠️ CRITICAL REQUIREMENTS ⚠️
1. Use EXACT HTML structure from legacy template: <header>, <section>, <h1>, <h2>, <h3>, <p>, <ul>, <li>
2. Extract REAL accomplishments with SPECIFIC numbers from the documents above
3. EVERY bullet must have: verb + task + scope/numbers + method + result/numbers
4. NO generic phrases - use ACTUAL metrics from documents
5. Skills MUST use <ul class="skills-list"> with <li> items (NOT divs, will auto-format to 2 columns)
6. Generate 6-8 HIGH-IMPACT bullets per role (not weak statements)
7. Summary must have SPECIFIC metrics from documents (not "4+ years of experience")
8. Use Times New Roman font (already in CSS template)

Generate the 3-PDF bundle JSON now. Return ONLY the JSON object (no markdown code fences).`;

  console.log(`[vertexThreePdf] Generating 3-PDF bundle for: ${input.candidateId}`);
  console.log(`[vertexThreePdf] Document count: ${input.documentTexts.length}`);
  console.log(`[vertexThreePdf] Using model: ${MODEL_NAME}`);

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
        maxOutputTokens: 8192,
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
