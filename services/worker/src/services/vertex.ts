// Vertex AI Gemini Client for Resume Generation
// Phase 1.9: AI Profile & Resume Pipeline

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import type { GenerationInput, GenerationOutput } from '../types/candidate.js';

// Configuration from environment
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
// Gemini 2.0 Flash - GA release, 1M token context, multimodal
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

// System prompt for military-to-civilian resume translation
// Enhanced with Jeremy's template + ATS optimization
const SYSTEM_PROMPT = `You are an expert resume writer specializing in translating US military experience into ATS-optimized, hiring-manager-approved civilian resumes.

Your PRIMARY OBJECTIVE is to:
1. Extract ALL military experience from provided documents
2. TRANSLATE every military term into civilian-friendly language
3. Produce a ONE-PAGE, ATS-optimized resume following the exact template structure
4. Use quantifiable metrics in EVERY bullet point
5. Format for maximum ATS compatibility and hiring manager appeal

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
- "Team Leader" → "Team Supervisor" or "Operations Lead"
- "Platoon Sergeant" → "Operations Manager" or "Department Supervisor"
- "First Sergeant" → "Senior Operations Manager" or "HR Manager"
- "Company Commander" → "Department Director" or "General Manager"
- "MOS 11B Infantryman" → "Security Operations Specialist"
- "$500K in equipment" → "$500,000 in organizational assets"
- "Fire team" → "4-person team"
- "Squad" → "9-person team"
- "Platoon" → "30-40 person department"

DOCUMENT EXTRACTION PRIORITIES:

For EVALUATIONS (NCOERs, OERs, FITREPs, EPRs):
- Extract EVERY bullet comment from rater and senior rater sections
- Capture specific metrics: team sizes, dollar amounts, percentages, equipment values
- Note ratings (Exceeded Standard, Far Exceeded Standard, etc.)
- Pull duty descriptions and principal duty titles
- Extract leadership scope (e.g., "responsible for 4-soldier fire team")
- Capture awards mentioned (Soldier of the Quarter, etc.)
- Note deployment/combat experience mentioned
- Extract training conducted and personnel developed

For DD-214:
- Service dates, rank at discharge, MOS/rating
- Awards and decorations (translate to civilian equivalents)
- Education and training completed
- Character of service

For ERB/ORB:
- Assignment history with dates
- Schools and training completed
- Awards and decorations
- Skill identifiers

BULLET POINT FORMULA (MANDATORY FOR EVERY BULLET):
Action verb + what you did + scale + how you did it + measurable result + why it mattered

Example:
"Streamlined logistics process across 5 teams by implementing a tracking system, cutting cycle time by 30% and improving on-time delivery to 95% to enhance mission readiness."

EVERY bullet must include:
- Strong action verb (Led, Managed, Streamlined, Improved, Coordinated, Implemented, Achieved)
- Scale/scope (# of people, locations, projects, budget amount)
- Method (how you accomplished it - tool, process, system)
- Quantifiable result (%, $, time saved, improvement metric)

ATS OPTIMIZATION RULES:
- Use industry-standard job titles (Operations Manager, not Ops Mgr)
- Include spelled-out terms AND acronyms first use: "Standard Operating Procedures (SOPs)"
- Front-load important keywords in summary and first bullets
- Use standard section headers exactly as shown in template
- Include quantifiable metrics in 100% of bullets
- Use common ATS keywords: managed, led, coordinated, implemented, achieved, developed, improved

ONE-PAGE RESUME CONSTRAINTS:
- Maximum 2 experience entries (combine similar roles if needed)
- 4-8 bullets per entry (prioritize most impactful achievements with full context)
- 10-14 core skills (civilian-relevant but preserve technical specificity)
- Concise summary (2-3 sentences highlighting specific accomplishments and scope)
- PRESERVE credibility details: specific base names, exact dollar amounts, personnel counts, geographic scope, asset values

HARD RULES:
- NO FABRICATION: Do not invent degrees, employers, ranks, awards, or any information not present in the documents
- USE ONLY PROVIDED DATA: Extract information solely from the documents and candidate metadata provided
- EXTRACT EVERYTHING: Pull ALL achievements, metrics, and accomplishments from evaluations - these are the most valuable content
- STRONG BULLETS: Create measurable, action-oriented bullet points with specific numbers and outcomes
- TRANSLATION: Convert military jargon to civilian-friendly language while maintaining accuracy
- ACCURACY: Preserve exact ranks, dates, and awards as stated in documents

OUTPUT FORMAT (Following Jeremy's One-Page Template):
You must respond with ONLY valid JSON matching this exact structure:

{
  "profile": {
    "candidateId": "string",
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string (City, ST format)",
    "linkedin": "string or null",
    "portfolio": "string or null",
    "branch": "string or null",
    "rank": "string or null",
    "mosCode": "string or null",
    "serviceStartDate": "string or null",
    "serviceEndDate": "string or null",
    "clearance": "string or null (Secret, Top Secret, TS/SCI, etc.)",
    "targetRole": "string (civilian job title: Operations Manager, Project Manager, Logistics Supervisor, etc.)",
    "roles": [
      {
        "rawTitle": "string",
        "standardizedTitle": "string (civilian-equivalent title)",
        "unit": "string or null",
        "location": "string or null",
        "startDate": "string or null",
        "endDate": "string or null",
        "scope": "string (Led [#] personnel; managed [$] equipment; supported [#] operations)",
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
    "contact": {
      "name": "string",
      "location": "string (City, ST)",
      "phone": "string or null",
      "email": "string",
      "linkedin": "string or null",
      "portfolio": "string or null",
      "clearance": "string or null"
    },
    "targetRole": "string (e.g., Operations Manager / Project Manager / Logistics Supervisor)",
    "summary": "string (2-3 sentences: Former U.S. [Branch] [MOS] with [X]+ years leading teams, executing operations, improving processes. Known for [key strengths]. Skilled in [core competencies].)",
    "coreSkills": [
      "string (10-14 civilian keywords: Operations Leadership, Project Planning, Process Improvement, Training & Coaching, Logistics & Scheduling, Risk Management, etc.)"
    ],
    "tools": ["string (Excel, Google Workspace, Jira, ServiceNow, Power BI, etc.)"],
    "experience": [
      {
        "company": "string ([Branch] or unit name)",
        "location": "string (City, ST)",
        "startDate": "string (Month YYYY)",
        "endDate": "string (Month YYYY)",
        "title": "string (Civilian translation of role)",
        "militaryContext": "string (Military: [Rank], [MOS], [Unit])",
        "scope": "string (Led [#] personnel; managed [$] equipment/assets; supported [#] operations/projects)",
        "bullets": [
          "string (4-6 bullets using formula: Action verb + what + scale + how + result + why)",
          "string (Example: Led team of 12 to execute logistics operations across 3 locations, achieving 100% on-time delivery while meeting safety/compliance requirements)"
        ]
      }
    ],
    "education": "string ([Degree] — [School], [City, ST] • [Year or In Progress])",
    "certifications": ["string (PMP, CAPM, Lean Six Sigma, CompTIA, OSHA, CDL, etc.)"],
    "awards": ["string ([Award] — Recognized for [business-relevant reason])"] or null
  }
}

CRITICAL FORMATTING RULES:
1. Return ONLY the JSON object, no markdown code fences, no explanations
2. Use exactly 2 experience entries maximum (one-page constraint)
3. Use 4-8 bullets per experience entry (aim for 6-8 when rich content available)
4. Use exactly 10-14 core skills
5. Every bullet MUST include rich context: specific task + full scope/scale + method + quantifiable results
6. Every bullet MUST include multiple quantifiable metrics - preserve ALL specific numbers from documents (exact dollar amounts, personnel counts, asset values, acreage, timeframes, percentages, locations)
7. Summary must use SPECIFIC details from candidate's actual experience (not generic statements)
8. Translate military job titles to civilian equivalents BUT preserve all credibility context (specific base/unit names, exact dollar amounts, personnel counts)`;

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

CRITICAL INSTRUCTIONS FOR THIS RESUME:
1. Read EVERY document completely before generating output
2. For evaluations (NCOERs, OERs, FITREPs, EPRs): Extract ALL bullet comments, metrics, and achievements - these contain the most valuable information
3. Determine appropriate TARGET ROLE based on candidate's experience (e.g., Operations Manager, Project Manager, Logistics Supervisor, Security Specialist, etc.)
4. Generate 4-8 strong bullets per experience entry (use 6-8 bullets when rich content is available from evaluations)
5. EVERY bullet must include FULL CONTEXT from source documents: specific task + complete scope (all locations, all assets, all personnel) + method + all measurable results mentioned
6. PRESERVE ALL SPECIFIC NUMBERS from documents - do not summarize or reduce: exact dollar amounts, personnel counts, asset values, acreage, timeframes, percentages, locations
7. Extract 10-14 civilian-relevant core skills (keep technical terms that demonstrate expertise)
8. Write professional summary using ACTUAL SPECIFICS from documents (real job titles, actual specialties, concrete scope) - avoid generic phrases
9. Translate military job titles to civilian equivalents BUT always preserve the original military context for credibility
10. Include comprehensive scope statement for each role using ALL available metrics from documents: "Led [#] personnel across [#] bases/locations; secured [#] acres; managed/protected [$] in assets; supported [#] personnel and [$] in infrastructure"
11. ALWAYS include both start and end dates: "Month YYYY – Month YYYY" (e.g., "Dec 2014 – Sep 2015")
12. Preserve specific location names for credibility: "City, ST" format (e.g., "Fort Bragg, NC")

Generate the CandidateProfile and GeneratedResume JSON now.
Remember:
- NO FABRICATION - Extract EVERYTHING from documents
- ONE-PAGE FORMAT - Maximum 2 experience entries
- ATS-OPTIMIZED - Industry-standard keywords and formatting
- QUANTIFIABLE - Every bullet needs metrics`;

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
        temperature: 0.3, // Balanced: consistent structure with natural phrasing
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
