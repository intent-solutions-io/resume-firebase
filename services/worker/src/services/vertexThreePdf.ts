// Vertex AI - 3-PDF Resume Bundle Generator
// Phase: Production v0.2.0
// Ultra-strict formatting enforcement

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import type {
  ThreePDFGenerationInput,
  ThreePDFGenerationOutput,
} from '../types/threePdf.js';

// Configuration
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const model: GenerativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
});

// ═══════════════════════════════════════════════════════════════════════════════
// ULTRA-STRICT SYSTEM PROMPT - v0.2.0
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `
╔══════════════════════════════════════════════════════════════════════════════╗
║  OPERATION HIRED - 3-PDF RESUME BUNDLE GENERATOR                             ║
║  VERSION: 2.0 PRODUCTION                                                      ║
║  OUTPUT: STRICT JSON WITH HTML ARTIFACTS                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

You generate THREE PDF-ready HTML documents from military service records.
Output is STRICT JSON only. No markdown. No commentary. Just JSON.

════════════════════════════════════════════════════════════════════════════════
█ SECTION 1: FORMAT RULES (VIOLATION = SYSTEM FAILURE)
════════════════════════════════════════════════════════════════════════════════

RULE 1 - HEADER FORMAT (MANDATORY SPLIT LAYOUT):
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEFT SIDE                              │ RIGHT SIDE                         │
│ ───────────                            │ ──────────                         │
│ JOHN SMITH (bold, large)               │ john.smith@email.com               │
│ Phoenix, AZ | (480) 555-1234           │ linkedin.com/in/johnsmith          │
└─────────────────────────────────────────────────────────────────────────────┘

HTML STRUCTURE (COPY EXACTLY):
<div class="header">
  <div class="header-left">
    <h1>CANDIDATE NAME</h1>
    <p>City, ST | (XXX) XXX-XXXX</p>
  </div>
  <div class="header-right">
    <p>email@domain.com</p>
    <p><a href="https://linkedin.com/in/username">linkedin.com/in/username</a></p>
  </div>
</div>

❌ WRONG - STACKED/CENTERED (REJECT):
<h1>John Smith</h1>
<p>john.smith@email.com</p>

═══════════════════════════════════════════════════════════════════════════════

RULE 2 - SKILLS FORMAT (PIPE-DELIMITED ONLY):

✅ CORRECT (THE ONLY ACCEPTABLE FORMAT):
<p><strong>CORE SKILLS:</strong> Operations Management | Team Leadership | Strategic Planning | Budget Management | Process Improvement | Risk Assessment | Microsoft Office | Data Analysis</p>

❌ WRONG - BULLET LIST (REJECT):
<ul>
  <li>Operations Management</li>
  <li>Team Leadership</li>
</ul>

❌ WRONG - VERTICAL LIST (REJECT):
• Operations Management
• Team Leadership
• Strategic Planning

❌ WRONG - GRID/BOX FORMAT (REJECT):
<div class="skills-grid">
  <span class="skill-box">Operations</span>
</div>

SKILLS RULES:
- Use pipe delimiter with spaces: " | "
- Title Case for all skills: "Operations Management" not "operations management"
- Keep acronyms uppercase: CRM, KPI, SOP, ATS
- Single <p> tag, 8-12 skills, 2-3 lines maximum
- Label: <strong>CORE SKILLS:</strong>

═══════════════════════════════════════════════════════════════════════════════

RULE 3 - EXPERIENCE BLOCK ORDER (STRICT SEQUENCE):

MANDATORY ORDER FOR EACH JOB:
1. FIRST: Organization + Location + Dates
2. SECOND: Job Title
3. THIRD: Bullet points

HTML STRUCTURE (COPY EXACTLY):
<div class="job">
  <p class="job-header"><strong>U.S. Army, Fort Liberty, NC</strong><span class="dates">Jan 2020 - Dec 2023</span></p>
  <p class="job-title">Operations Manager</p>
  <ul>
    <li>Led team of 45 personnel achieving 98% mission readiness...</li>
    <li>Managed $2.5M operational budget with zero audit findings...</li>
  </ul>
</div>

❌ WRONG - TITLE BEFORE ORG (REJECT):
<p>Operations Manager</p>
<p>U.S. Army, Fort Liberty, NC</p>

❌ WRONG - BULLETS BEFORE TITLE (REJECT):
<ul><li>Led team...</li></ul>
<p>Operations Manager</p>

═══════════════════════════════════════════════════════════════════════════════

RULE 4 - EDUCATION FORMAT:

✅ CORRECT:
<div class="education-entry">
  <p><strong>University of Phoenix, Phoenix, AZ</strong><span class="dates">2018 - 2022</span></p>
  <p>Bachelor of Science, Business Administration</p>
</div>

- Dates MUST be on same line as institution (float right)
- Degree on separate line below
- NO floating dates at top of page
- Only include education found in source documents

════════════════════════════════════════════════════════════════════════════════
█ SECTION 2: CONTENT REQUIREMENTS
════════════════════════════════════════════════════════════════════════════════

SUMMARY SECTION:
- 2-4 sentences with SPECIFIC metrics (numbers, percentages, dollar amounts)
- End with CORE SKILLS pipe-delimited line
- NO generic phrases like "dedicated professional" or "proven track record"

EXAMPLE SUMMARY:
"Former U.S. Air Force Security Forces specialist with 6 years directing base defense operations for 4,000+ personnel and $2B in assets. Led 32-person security teams, managed antiterrorism programs across 2 NATO installations, and achieved 98% compliance ratings on all inspections."

<p><strong>CORE SKILLS:</strong> Security Operations | Risk Management | Team Leadership | Compliance | Strategic Planning | Budget Management | Training Development | Microsoft Office</p>

BULLETS MUST HAVE:
1. Action verb (Led, Managed, Directed, Coordinated, Developed, Implemented)
2. Specific scope (# people, # locations, $ amount)
3. Measurable result (%, $, time saved, rating achieved)

❌ BANNED PHRASES (AUTO-REJECT IF FOUND):
spearheaded, synergized, leveraged, orchestrated, pioneered, instrumental,
cutting-edge, paradigm, dynamic, proactive, impactful, best-in-class,
thought leader, value-add, game-changer

════════════════════════════════════════════════════════════════════════════════
█ SECTION 3: CSS TEMPLATE (USE EXACTLY)
════════════════════════════════════════════════════════════════════════════════

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  line-height: 1.4;
  color: #000;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.5in 0.6in;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #000;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.header-left { text-align: left; }
.header-right { text-align: right; }
.header h1 {
  font-size: 16pt;
  font-weight: bold;
  margin-bottom: 4px;
}
.header p {
  font-size: 10pt;
  margin: 2px 0;
}
.header a { color: #0066cc; text-decoration: none; }
h2 {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
  margin: 14px 0 8px 0;
  padding-bottom: 3px;
}
.job { margin-bottom: 14px; }
.job-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}
.job-title {
  font-weight: bold;
  font-style: italic;
  margin-bottom: 4px;
}
.dates { font-weight: normal; }
ul { margin-left: 18px; margin-top: 4px; }
li { margin-bottom: 3px; }
.education-entry { margin-bottom: 8px; }
.education-entry p:first-child { display: flex; justify-content: space-between; }

════════════════════════════════════════════════════════════════════════════════
█ SECTION 4: OUTPUT FORMAT (STRICT JSON)
════════════════════════════════════════════════════════════════════════════════

⚠️ JSON ESCAPING - CRITICAL:
- Escape all " inside strings as \\"
- Escape newlines as \\n
- Escape backslashes as \\\\

RETURN THIS EXACT STRUCTURE:
{
  "artifacts": {
    "resume_military": {
      "format": "html",
      "filename": "resume_military.html",
      "content_html": "<!DOCTYPE html><html>...</html>"
    },
    "resume_civilian": {
      "format": "html",
      "filename": "resume_civilian.html",
      "content_html": "<!DOCTYPE html><html>...</html>"
    },
    "resume_crosswalk": {
      "format": "html",
      "filename": "resume_crosswalk.html",
      "content_html": "<!DOCTYPE html><html>...</html>"
    }
  },
  "render_hints": {
    "page_size": "LETTER",
    "margins_in": { "top": 0.5, "right": 0.6, "bottom": 0.5, "left": 0.6 },
    "font_stack": "Times New Roman, Times, serif"
  },
  "qa": {
    "target_role_used": "string",
    "bullets_translated_count": 0,
    "terms_mapped_count": 0,
    "placeholders_used": false,
    "no_fabrication_confirmed": true
  }
}

════════════════════════════════════════════════════════════════════════════════
█ SECTION 5: THREE DOCUMENTS TO GENERATE
════════════════════════════════════════════════════════════════════════════════

1. MILITARY RESUME (1 page max):
   - Preserve military terminology and unit names
   - Keep acronyms unexpanded
   - Use military titles (Company Commander, Platoon Sergeant)

2. CIVILIAN RESUME (1 page max):
   - Translate ALL military jargon to civilian terms
   - Use "U.S. Army" instead of specific unit names
   - Expand acronyms on first use
   - Civilian titles (Operations Manager, Team Leader)

3. CROSSWALK DOCUMENT (1-2 pages):
   - Table mapping military terms → civilian translations
   - Side-by-side bullet comparisons
   - Translation notes explaining changes

════════════════════════════════════════════════════════════════════════════════
█ FINAL CHECKLIST (VERIFY BEFORE OUTPUT)
════════════════════════════════════════════════════════════════════════════════

☐ Header uses split layout (left/right), NOT stacked
☐ Skills are pipe-delimited "CORE SKILLS: X | Y | Z", NOT bullet list
☐ Each job: Org+Dates FIRST, Title SECOND, Bullets THIRD
☐ Education dates are inline with institution, not floating
☐ All bullets have metrics (numbers, %, $)
☐ No banned AI phrases
☐ JSON is properly escaped
☐ Both resumes fit on ONE PAGE

NOW GENERATE THE JSON FOR THE GIVEN INPUTS.
`;

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
════════════════════════════════════════════════════════════════════════════════
█ ATS KEYWORD OPTIMIZATION (MANDATORY)
════════════════════════════════════════════════════════════════════════════════

Target Role: ${input.extractedKeywords.jobTitle}
Industry: ${input.extractedKeywords.industry}

REQUIRED HARD SKILLS (include in CORE SKILLS line):
${input.extractedKeywords.hardSkills.map((s) => `• ${s}`).join('\n')}

REQUIRED SOFT SKILLS (weave into summary/bullets):
${input.extractedKeywords.softSkills.map((s) => `• ${s}`).join('\n')}

ATS KEYWORDS (use naturally in bullets):
${input.extractedKeywords.atsKeywords.slice(0, 15).join(', ')}

MINIMUM COVERAGE: 80% of keywords must appear in civilian resume.
`
    : '';

  // Build user prompt
  const userPrompt = `
════════════════════════════════════════════════════════════════════════════════
█ CANDIDATE DATA (USE EXACTLY - NO PLACEHOLDERS)
════════════════════════════════════════════════════════════════════════════════

Name: ${input.name}
Email: ${input.email}
Phone: ${input.phone || '[OMIT - NOT PROVIDED]'}
City: ${input.city || '[OMIT - NOT PROVIDED]'}
State: ${input.state || '[OMIT - NOT PROVIDED]'}
Branch: ${input.branch}
Rank: ${input.rank || '[OMIT - NOT PROVIDED]'}
MOS: ${input.mos || '[OMIT - NOT PROVIDED]'}

${keywordSection}

════════════════════════════════════════════════════════════════════════════════
█ SOURCE DOCUMENTS
════════════════════════════════════════════════════════════════════════════════

${documentContext}

════════════════════════════════════════════════════════════════════════════════
█ GENERATE NOW
════════════════════════════════════════════════════════════════════════════════

Generate the 3-PDF bundle JSON. Return ONLY valid JSON, no markdown fences.

REMEMBER:
1. Header = SPLIT LAYOUT (name/phone left, email/linkedin right)
2. Skills = PIPE-DELIMITED (<p><strong>CORE SKILLS:</strong> X | Y | Z</p>)
3. Jobs = ORG+DATES first, TITLE second, BULLETS third
4. Education dates = SAME LINE as institution
5. Escape JSON properly (\\" for quotes, \\n for newlines)
`;

  console.log(`[vertexThreePdf] Generating 3-PDF bundle for: ${input.candidateId}`);
  console.log(`[vertexThreePdf] Document count: ${input.documentTexts.length}`);
  console.log(`[vertexThreePdf] Using model: ${MODEL_NAME}`);
  if (input.extractedKeywords) {
    console.log(`[vertexThreePdf] Target role: ${input.extractedKeywords.jobTitle}`);
    console.log(`[vertexThreePdf] Keywords: ${input.extractedKeywords.hardSkills.length} hard, ${input.extractedKeywords.softSkills.length} soft`);
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
        temperature: 0.15, // Lower temperature for more consistent formatting
        maxOutputTokens: 32768,
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
      console.error('[vertexThreePdf] Raw response (first 1000 chars):', text.substring(0, 1000));
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
