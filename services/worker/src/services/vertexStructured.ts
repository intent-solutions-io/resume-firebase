// Vertex AI - Structured Resume Generator
// Outputs JSON data, not HTML - DOCX generator handles formatting
// Much smaller output tokens, more reliable

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import type { StructuredResumeOutput } from '../types/resumeData.js';
import type { ThreePDFGenerationInput } from '../types/threePdf.js';

// Configuration
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
// Use gemini-2.5-pro for resume generation - supports 65K output tokens
// gemini-2.5-flash only has 8K which can truncate with 3 full resumes
const MODEL_NAME = 'gemini-2.5-pro';

const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const model: GenerativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
});

// =============================================================================
// SYSTEM PROMPT - Structured JSON Output
// =============================================================================

const SYSTEM_PROMPT = `You are a military-to-civilian resume translator. You generate structured JSON data for three resume versions.

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:

{
  "military": {
    "contact": {
      "name": "FULL NAME",
      "email": "email@domain.com",
      "phone": "(XXX) XXX-XXXX",
      "city": "City",
      "state": "ST",
      "linkedin": "linkedin.com/in/username"
    },
    "summary": "2-4 sentence professional summary with metrics...",
    "skills": ["Skill 1", "Skill 2", "Skill 3", "...8-12 total skills"],
    "experience": [
      {
        "organization": "Full Unit Name",
        "location": "Base, State/Country",
        "title": "Military Job Title",
        "startDate": "Mon YYYY",
        "endDate": "Mon YYYY",
        "bullets": [
          "Action verb + scope + measurable result (3-5 bullets per job)"
        ]
      }
    ],
    "education": [
      {
        "institution": "School Name",
        "location": "City, ST",
        "degree": "Degree Type",
        "field": "Field of Study",
        "graduationDate": "YYYY"
      }
    ],
    "certifications": [
      {"name": "Certification Name", "date": "YYYY"}
    ]
  },
  "civilian": {
    "contact": { ...same as military... },
    "summary": "...translated to civilian language...",
    "skills": ["...civilian equivalents..."],
    "experience": [
      {
        "organization": "U.S. [Branch]",
        "location": "City, State",
        "title": "Civilian-Equivalent Title",
        "startDate": "Mon YYYY",
        "endDate": "Mon YYYY",
        "bullets": ["...translated to civilian language..."]
      }
    ],
    "education": [...],
    "certifications": [...]
  },
  "crosswalk": {
    "candidateName": "FULL NAME",
    "roles": [
      {
        "roleTitle": "Job Title",
        "location": "Location",
        "translations": [
          {"military": "Military Term", "civilian": "Civilian Term"},
          {"military": "Another Term", "civilian": "Its Translation"}
        ],
        "metricsPreserved": ["45 personnel", "$2.5M budget", "98% rate"]
      }
    ],
    "skillTranslations": [
      {"military": "MOS 11B", "civilian": "Infantry Operations Specialist"},
      {"military": "NCO Leadership", "civilian": "Supervisory Experience"}
    ],
    "acronymGlossary": [
      {"acronym": "NCO", "definition": "Non-Commissioned Officer"},
      {"acronym": "MOS", "definition": "Military Occupational Specialty"}
    ]
  },
  "metadata": {
    "targetRole": "Target job title if provided",
    "bulletsTranslated": 15,
    "termsMapped": 25,
    "keywordsUsed": ["keyword1", "keyword2"]
  }
}

RULES:
1. MILITARY version: Keep military terminology, unit names, acronyms
2. CIVILIAN version: Translate ALL military jargon to civilian language
3. CROSSWALK: Show every translation made between versions
4. All bullets MUST have: action verb + scope (numbers) + result
5. Skills: 8-12 items, Title Case
6. Summary: 2-4 sentences with specific metrics
7. NO fabrication - only use information from source documents
8. NO banned phrases: spearheaded, synergized, leveraged, orchestrated, cutting-edge, paradigm

TRANSLATION EXAMPLES:
- "SSgt" → "Staff Sergeant (E-5 Supervisor)"
- "423d SFS" → "Security Forces Squadron"
- "Led flight of 35" → "Managed team of 35"
- "AT/FP program" → "Antiterrorism Program"
- "CONUS operations" → "Domestic Operations"
- "NCO" → "Supervisor"
- "MOS 11B" → "Infantry Operations"`;

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

export async function generateStructuredResume(
  input: ThreePDFGenerationInput
): Promise<StructuredResumeOutput> {
  // Build document context
  const documentContext = input.documentTexts
    .map(doc => `=== ${doc.type.toUpperCase()}: ${doc.fileName} ===\n${doc.text}`)
    .join('\n\n');

  // Build keyword section if provided
  const keywordSection = input.extractedKeywords
    ? `
TARGET JOB OPTIMIZATION:
- Target Role: ${input.extractedKeywords.jobTitle}
- Industry: ${input.extractedKeywords.industry}
- Required Hard Skills: ${input.extractedKeywords.hardSkills.join(', ')}
- Required Soft Skills: ${input.extractedKeywords.softSkills.join(', ')}
- ATS Keywords to include: ${input.extractedKeywords.atsKeywords.slice(0, 15).join(', ')}

Include as many of these keywords naturally in the civilian resume.`
    : '';

  // Build user prompt
  const userPrompt = `
CANDIDATE INFORMATION:
- Name: ${input.name}
- Email: ${input.email}
- Phone: ${input.phone || 'Not provided'}
- City: ${input.city || 'Not provided'}
- State: ${input.state || 'Not provided'}
- Branch: ${input.branch}
- Rank: ${input.rank || 'Not provided'}
- MOS: ${input.mos || 'Not provided'}

${keywordSection}

SOURCE DOCUMENTS:
${documentContext}

Generate the structured JSON for all three resume versions (military, civilian, crosswalk).
Return ONLY valid JSON, no markdown code fences or commentary.`;

  console.log(`[vertexStructured] Generating structured resume for: ${input.candidateId}`);
  console.log(`[vertexStructured] Document count: ${input.documentTexts.length}`);
  console.log(`[vertexStructured] Using model: ${MODEL_NAME}`);

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent structure
        maxOutputTokens: 16384, // gemini-2.5-pro supports up to 65K
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
    console.log(`[vertexStructured] Raw response length: ${text.length} chars`);

    // Parse JSON response with repair logic
    let parsed: StructuredResumeOutput;
    try {
      // Remove markdown code fences if present
      let cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      // Try to extract just the JSON object if there's extra text
      const jsonStartIndex = cleanedText.indexOf('{');
      const jsonEndIndex = cleanedText.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        cleanedText = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
      }

      // Fix common JSON issues from LLM output
      cleanedText = cleanedText
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .replace(/\n/g, ' ')     // Remove newlines that might break strings
        .replace(/\t/g, ' ');    // Remove tabs

      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[vertexStructured] JSON parse error:', parseError);
      console.error('[vertexStructured] Raw response length:', text.length);
      console.error('[vertexStructured] Raw response (first 500 chars):', text.substring(0, 500));
      console.error('[vertexStructured] Raw response (last 500 chars):', text.substring(text.length - 500));
      throw new Error(`Failed to parse Gemini response: ${parseError}`);
    }

    // Validate required fields
    if (!parsed.military || !parsed.civilian || !parsed.crosswalk) {
      throw new Error('Invalid response structure - missing military, civilian, or crosswalk');
    }

    console.log(`[vertexStructured] Successfully parsed structured resume`);
    console.log(`[vertexStructured] Experience entries: ${parsed.military.experience.length}`);
    console.log(`[vertexStructured] Skills count: ${parsed.civilian.skills.length}`);
    console.log(`[vertexStructured] Translations: ${parsed.crosswalk.skillTranslations.length}`);

    return parsed;
  } catch (error) {
    console.error('[vertexStructured] Generation failed:', error);
    throw error;
  }
}
