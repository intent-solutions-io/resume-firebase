// Vertex AI - 3-PDF Resume Bundle Generator
// Phase: Production v0.2.1
// Ultra-strict formatting enforcement - CENTERED HEADERS

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import type {
  ThreePDFGenerationInput,
  ThreePDFGenerationOutput,
} from '../types/threePdf.js';

// Configuration
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
// Use gemini-2.5-pro for 3-PDF generation - needs higher output token limit (65K max)
// gemini-2.5-flash maxes at 8192 tokens which isn't enough for 3 HTML docs
const MODEL_NAME = process.env.GEMINI_THREE_PDF_MODEL || 'gemini-2.5-pro';

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

RULE 1 - HEADER FORMAT (MANDATORY CENTERED LAYOUT):
┌─────────────────────────────────────────────────────────────────────────────┐
│                              JOHN SMITH                                     │
│                     john.smith@email.com | (480) 555-1234                   │
│                 Phoenix, AZ | linkedin.com/in/johnsmith                     │
└─────────────────────────────────────────────────────────────────────────────┘

HTML STRUCTURE (COPY EXACTLY):
<div class="header">
  <h1>CANDIDATE NAME</h1>
  <p>email@domain.com | (XXX) XXX-XXXX</p>
  <p>City, ST | <a href="https://linkedin.com/in/username">linkedin.com/in/username</a></p>
</div>

HEADER RULES:
- Name: UPPERCASE, bold, largest font (16pt)
- Line 2: Email + Phone separated by pipe
- Line 3: City, State + LinkedIn separated by pipe
- ALL text centered
- Border bottom after header

❌ WRONG - Split/Two-Column Layout (REJECT):
<div class="header-left">...</div>
<div class="header-right">...</div>

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
1. FIRST: Job Title + Dates (on same line)
2. SECOND: Organization + Location (italic)
3. THIRD: Bullet points

HTML STRUCTURE (COPY EXACTLY):
<div class="job">
  <p class="job-header"><strong>Operations Manager</strong><span class="dates">Jan 2020 - Dec 2023</span></p>
  <p class="job-org">U.S. Army, Fort Liberty, NC</p>
  <ul>
    <li>Led team of 45 personnel achieving 98% mission readiness...</li>
    <li>Managed $2.5M operational budget with zero audit findings...</li>
  </ul>
</div>

❌ WRONG - ORG BEFORE TITLE (REJECT):
<p>U.S. Army, Fort Liberty, NC</p>
<p>Operations Manager</p>

❌ WRONG - BULLETS BEFORE ORG (REJECT):
<ul><li>Led team...</li></ul>
<p>U.S. Army, Fort Liberty, NC</p>

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
  text-align: center;
  border-bottom: 2px solid #000;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.header h1 {
  font-size: 16pt;
  font-weight: bold;
  text-transform: uppercase;
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
.job-org {
  font-style: italic;
  margin-bottom: 4px;
}
.dates { font-weight: normal; }
ul { margin-left: 18px; margin-top: 4px; }
li { margin-bottom: 3px; }
.education-entry { margin-bottom: 8px; }
.education-entry p:first-child { display: flex; justify-content: space-between; }
/* Crosswalk Document Styles - Enhanced v2.0 */
.crosswalk-section { border: 2px solid #333; margin-bottom: 16px; padding: 12px; page-break-inside: avoid; }
.crosswalk-section h3 { font-size: 12pt; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase; background: #f0f0f0; padding: 8px; margin: -12px -12px 12px -12px; }
.role-translation { margin-bottom: 16px; padding: 10px; background: #fafafa; border-radius: 4px; }
.role-translation h4 { font-size: 11pt; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
.translation-row { display: flex; align-items: center; margin: 6px 0; padding: 6px 0; border-bottom: 1px dotted #ddd; }
.military-term { flex: 1; color: #555; font-style: italic; padding-right: 8px; }
.arrow { width: 30px; text-align: center; color: #C59141; font-weight: bold; font-size: 14pt; }
.civilian-term { flex: 1; font-weight: bold; color: #000; padding-left: 8px; }
.metrics-preserved { background: #e8f5e9; padding: 10px 14px; margin-top: 14px; border-left: 4px solid #38a169; border-radius: 0 4px 4px 0; }
.metrics-preserved strong { display: block; margin-bottom: 6px; color: #2d6a4f; }
.metrics-preserved ul { margin-left: 20px; margin-bottom: 0; }
.metrics-preserved li { color: #2d6a4f; margin-bottom: 3px; }
.acronym-glossary { margin-top: 8px; }
.acronym-glossary dt { font-weight: bold; float: left; width: 100px; clear: left; color: #333; }
.acronym-glossary dd { margin-left: 110px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #eee; }

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
   ════════════════════════════════════════════════════════════════════════════
   █ CROSSWALK = TRANSLATION REFERENCE GUIDE
   █ Shows every military term translated to civilian language
   ════════════════════════════════════════════════════════════════════════════

   ⚠️⚠️⚠️ CRITICAL: CROSSWALK MUST CONTAIN ACTUAL TRANSLATION CONTENT ⚠️⚠️⚠️

   The crosswalk COMPARES the military resume with the civilian resume.
   For EVERY term you changed, list it as: MILITARY TERM → CIVILIAN TERM

   FORMAT: Use simple paragraphs with arrow (→) separator. Our post-processor
   will handle CSS styling. Focus on CONTENT, not formatting.

   CROSSWALK HTML STRUCTURE:
   <!DOCTYPE html><html><head><style>
   body { font-family: Arial, sans-serif; font-size: 11pt; padding: 0.5in; }
   h2 { border-bottom: 2px solid #333; margin-top: 20px; }
   h3 { color: #333; margin-top: 16px; }
   p { margin: 6px 0; }
   </style></head><body>

   <h2>EXPERIENCE TRANSLATIONS</h2>

   <h3>Role: [Job Title from Resume] at [Location]</h3>
   <p>U.S. Air Force, Lackland AFB → U.S. Air Force, San Antonio, TX</p>
   <p>TSgt → Technical Sergeant (E-6 Supervisor)</p>
   <p>Led flight of 35 → Led team of 35</p>
   <p>AT/FP program manager → Antiterrorism Program Manager</p>
   <p>Conducted ORE/ORI inspections → Conducted Readiness Inspections</p>

   <p><strong>Key Metrics Preserved (numbers unchanged):</strong></p>
   <p>• 35 personnel managed</p>
   <p>• $2.1M equipment inventory</p>
   <p>• 98% inspection pass rate</p>

   <h3>Role: [Next Job Title] at [Location]</h3>
   [Repeat pattern for each job in resume]

   <h2>SKILLS TRANSLATIONS</h2>
   <p>AFSC 3P0X1 → Security Management</p>
   <p>NCO Leadership → Supervisory Experience</p>
   <p>Mission Planning → Strategic Planning</p>
   <p>Force Protection → Physical Security</p>
   <p>Personnel Security → Background Investigations</p>
   <p>Information Security → Data Protection</p>
   <p>Combat Arms Training → Weapons Qualification</p>
   <p>Anti-terrorism → Threat Assessment</p>

   <h2>ACRONYM GLOSSARY</h2>
   <p>AFB - Air Force Base</p>
   <p>AFSC - Air Force Specialty Code</p>
   <p>AT/FP - Antiterrorism/Force Protection</p>
   <p>NCO - Non-Commissioned Officer</p>
   <p>ORE - Operational Readiness Exercise</p>
   <p>ORI - Operational Readiness Inspection</p>
   <p>TSgt - Technical Sergeant</p>

   </body></html>

   ═══════════════════════════════════════════════════════════════════════════
   █ MANDATORY CROSSWALK CONTENT REQUIREMENTS
   ═══════════════════════════════════════════════════════════════════════════

   1. EXPERIENCE TRANSLATIONS (MANDATORY - for EACH job):
      - Section header with role title and location
      - 5-10 translation pairs showing: MILITARY → CIVILIAN
      - Include: unit name changes, rank translations, terminology changes
      - MUST include metrics preserved section with actual numbers

   2. SKILLS TRANSLATIONS (MANDATORY - minimum 8 items):
      - List each military skill and its civilian equivalent
      - Format: Military Term → Civilian Term
      - Include MOS/AFSC codes, acronyms, military phrases

   3. ACRONYM GLOSSARY (MANDATORY - ALL acronyms):
      - List EVERY acronym from the military resume
      - Format: ACRONYM - Full Expansion
      - Include ranks, unit types, program names

   ⚠️ FAILURE MODE: Listing only section headers without content
   ⚠️ If your crosswalk has empty sections, it has FAILED
   ⚠️ MINIMUM: 20 total translation pairs + 10 acronym definitions

════════════════════════════════════════════════════════════════════════════════
█ FINAL CHECKLIST (VERIFY BEFORE OUTPUT)
════════════════════════════════════════════════════════════════════════════════

RESUMES:
☐ Header is CENTERED (name top, contact info below, all centered)
☐ Skills are pipe-delimited "CORE SKILLS: X | Y | Z", NOT bullet list
☐ Each job: Title+Dates FIRST, Org+Location SECOND (italic), Bullets THIRD
☐ Education dates are inline with institution, not floating
☐ All bullets have metrics (numbers, %, $)
☐ No banned AI phrases
☐ Both resumes fit on ONE PAGE

CROSSWALK (CRITICAL - DO NOT SKIP):
☐ EXPERIENCE section has 5+ translation pairs per job (Military Term → Civilian Term)
☐ EXPERIENCE section has metrics preserved for each job (actual numbers!)
☐ SKILLS section has 8+ translation pairs
☐ ACRONYM section has ALL acronyms from military resume (10+ entries)
☐ Total: 20+ translation pairs and 10+ acronym definitions

JSON:
☐ JSON is properly escaped (\\" for quotes, \\n for newlines)

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
1. Header = CENTERED (name on top, contact info centered below)
2. Skills = PIPE-DELIMITED (<p><strong>CORE SKILLS:</strong> X | Y | Z</p>)
3. Jobs = TITLE+DATES first, ORG+LOCATION second (italic), BULLETS third
4. Education dates = SAME LINE as institution
5. CROSSWALK = MUST CONTAIN ACTUAL TRANSLATION CONTENT:
   - EXPERIENCE: 5+ translations per job using format "Military Term → Civilian Term"
   - EXPERIENCE: Include Key Metrics Preserved with actual numbers for each role
   - SKILLS: 8+ translation pairs
   - ACRONYMS: 10+ definitions using format "ACRONYM - Full Name"
   - ⚠️ MINIMUM: 20 translation pairs + 10 acronym definitions TOTAL
6. Escape JSON properly (\\" for quotes, \\n for newlines)
`;

  console.log(`[vertexThreePdf] Generating 3-PDF bundle for: ${input.candidateId}`);
  console.log(`[vertexThreePdf] Document count: ${input.documentTexts.length}`);
  console.log(`[vertexThreePdf] Using model: ${MODEL_NAME} (maxOutputTokens: 16384)`);
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
        maxOutputTokens: 16384, // Higher limit for gemini-1.5-pro (3 HTML docs need ~12-15k tokens)
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
