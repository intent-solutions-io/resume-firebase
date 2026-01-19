import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';

// Use GCP_PROJECT_ID (set in Cloud Run) or fallback
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || process.env.VERTEX_AI_LOCATION || 'us-central1';
// Use gemini-2.0-flash (stable) - gemini-1.5-flash was retired Jan 2026
const MODEL = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';

/**
 * Resume JSON Schema (federal_basic)
 * Structured output format for generated resumes
 */
export interface ResumeJson {
  metadata: {
    version: string;
    generatedAt: string;
    targetRole?: string;
  };
  contact: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
    honors?: string[];
  }>;
  skills: {
    technical: string[];
    soft: string[];
    certifications: string[];
    languages: string[];
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
}

class GeminiService {
  private vertexAI: VertexAI;
  private model: GenerativeModel;

  constructor() {
    this.vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });
    this.model = this.vertexAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Generate a structured resume from extracted text
   */
  async generateResume(
    extractedText: string,
    targetRole?: string
  ): Promise<ResumeJson> {
    const prompt = this.buildPrompt(extractedText, targetRole);

    // Log prompt length (no PII)
    console.log(`Generating resume, input length: ${extractedText.length}`);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;

      if (!text) {
        throw new Error('No response from Gemini');
      }

      // Parse JSON from response
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      const resume = JSON.parse(jsonText) as ResumeJson;

      // Add metadata
      resume.metadata = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        targetRole,
      };

      console.log('Resume generated successfully');
      return resume;
    } catch (error) {
      console.error('Gemini generation failed');
      throw error;
    }
  }

  /**
   * Build the prompt for resume generation
   */
  private buildPrompt(extractedText: string, targetRole?: string): string {
    const roleContext = targetRole
      ? `The target role is: ${targetRole}. Tailor the resume to highlight relevant experience.`
      : 'Generate a general professional resume.';

    return `You are a professional resume writer. Analyze the following text extracted from documents and create a structured resume in JSON format.

${roleContext}

IMPORTANT INSTRUCTIONS:
1. Extract all relevant professional information
2. Write concise, impactful achievement statements using action verbs
3. Quantify achievements where possible (numbers, percentages, dollar amounts)
4. Organize experience in reverse chronological order
5. Identify and categorize skills appropriately
6. Maintain professional tone throughout
7. If information is unclear or missing, make reasonable inferences but don't fabricate
8. DO NOT include any PII that wasn't in the original text
9. Return ONLY valid JSON, no additional text

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "contact": {
    "name": "string",
    "email": "string (optional)",
    "phone": "string (optional)",
    "location": "string (optional)",
    "linkedin": "string (optional)",
    "portfolio": "string (optional)"
  },
  "summary": "2-3 sentence professional summary",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State (optional)",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "current": true/false,
      "description": "Brief role description",
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "location": "City, State (optional)",
      "graduationDate": "YYYY-MM (optional)",
      "gpa": "X.XX (optional)",
      "honors": ["Honor 1"]
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2"],
    "soft": ["Skill 1", "Skill 2"],
    "certifications": ["Cert 1"],
    "languages": ["Language 1"]
  },
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["Tech 1"],
      "url": "optional"
    }
  ]
}

---
EXTRACTED TEXT:
${extractedText}
---

Generate the resume JSON now:`;
  }
}

export const geminiService = new GeminiService();
