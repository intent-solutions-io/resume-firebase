# AI Resume Generation: Best Practices & Industry Analysis 2025

## Executive Summary

This document synthesizes research on AI-powered resume generation, analyzing approaches from leading platforms (Teal, Rezi, Kickresume, Resume.io, Jobscan) and current LLM best practices. The research identifies critical success factors for Operation Hired implementation.

**Key Finding**: ATS keyword optimization (99.7% of recruiters use keyword filters) matters more than sophisticated AI generation. Multi-step pipelines with structured JSON intermediates outperform single-step generation.

**Recommended Temperature**: 0.25 (consistency over creativity)
**Recommended Model**: Gemini 1.5 Flash or Claude Sonnet 4
**Recommended PDF Generator**: Puppeteer (already implemented)

---

## 1. Top AI Resume Companies & Their Approaches

### Teal
- **Focus**: Job search platform with resume integration
- **AI Model**: GPT-based
- **Key Features**: Keyword optimization, job tracking, guided achievement writing
- **ATS Strength**: Good
- **Design Focus**: Minimal (function over design)
- **Pricing**: Freemium
- **Tech Pattern**: Integrated platform with analytics feedback

### Rezi
- **Focus**: Content-rich, ATS-optimized resumes
- **AI Model**: GPT (early adopter, pre-ChatGPT)
- **Key Features**:
  - Multi-step keyword extraction (job → keywords → integration suggestions)
  - Resume scoring across 5 categories (Content, Format, Optimization, Best Practices, Application Ready)
  - AI Bullet Point Editor with iterative refinement
- **ATS Strength**: **BEST in class**
- **Pricing**: Premium subscription
- **Tech Pattern**:
  - Step 1: Extract keywords from job description
  - Step 2: Identify present keywords
  - Step 3: Suggest missing keyword integration points
  - Step 4: Validate against ATS rules

### Kickresume
- **Focus**: Visually appealing resumes + AI assistance
- **AI Model**: GPT-4
- **Key Features**: Template-driven design, LinkedIn import, pre-written examples
- **ATS Strength**: Good balance
- **Design Focus**: **Best in class**
- **Pricing**: Freemium
- **Tech Pattern**: Template-first (design templates with AI content insertion)

### Resume.io
- **Focus**: Professional templates at lowest price point
- **AI Model**: Unknown integration
- **Claims**: 39% more likely to get hired, 8% better pay
- **Pricing**: Lowest among competitors
- **Tech Pattern**: Template-driven quality

### Jobscan
- **Focus**: ATS compatibility checking and keyword optimization
- **AI Model**: Proprietary system
- **Key Features**: Company-specific ATS detection, keyword gap analysis
- **Key Stat**: Users see **3x more job interviews** after optimization
- **Tech Pattern**: Extract keywords → Compare → Recommend specific integration

---

## 2. Critical ATS Facts (2025)

### Adoption
- **97.8%** of Fortune 500 companies use ATS
- **75%** of all companies use ATS
- **99.7%** of recruiters use keyword filters to sort candidates

### Most Used ATS Systems
1. Workday (most common in Fortune 500)
2. Greenhouse
3. Lever
4. Taleo
5. iCIMS

### Key Statistics
- Users who optimize with Jobscan get **3x more interviews**
- Recommended keyword match rate: **75%** (65% also works)
- **3 minutes** is average recruiter scan time

---

## 3. LLM Best Practices

### 3.1 Multi-Step vs Single-Step Generation

**RECOMMENDATION: Multi-step generation**

Single-step (naive approach):
```
Military Documents → LLM → Complete Resume
```
Problems: Generic language, no validation, no ATS optimization

Multi-step (recommended):
```
Step 1: Extract structured profile from military documents (JSON)
Step 2: Generate resume sections optimized for job description (JSON)
Step 3: Optimize for ATS (add keywords, validate formatting) (JSON)
Step 4: Render to multiple formats (HTML → PDF, DOCX, TXT)
```

Advantages:
- Each step independently validatable
- Easy to inject keyword optimization
- Reduced token usage (smaller focused prompts)
- Better control over output quality
- Human review checkpoints available

### 3.2 Temperature Settings

**RECOMMENDATION: 0.25 for all resume generation**

| Temperature | Behavior | Resume Impact |
|-------------|----------|---------------|
| 0.0 | Always most likely word | Too robotic (detectable) |
| **0.25** | Minimal variation, confident | **Best for resumes** |
| 0.5 | Balanced | Acceptable |
| 1.0+ | "Normal" balance | Too creative, generic AI feel |

Why 0.25:
- Prevents repetitive AI patterns
- Maintains factual accuracy
- Professional, consistent language
- Still human-like (not perfectly robotic)
- Research shows temperature weakly correlates with novelty

### 3.3 Structured Output (JSON)

**RECOMMENDATION: Generate JSON intermediate, then convert**

Why JSON first:
- Forces structured thinking
- Easy to validate (required fields, constraints)
- Simple iteration (fix one field at a time)
- Easy format conversion (one source, multiple outputs)

Example structure:
```json
{
  "candidateProfile": {
    "militaryRole": "string",
    "yearsExperience": "number",
    "keyResponsibilities": ["string"],
    "coreSkills": ["string"],
    "achievements": [
      {
        "description": "string",
        "metrics": "string",
        "impact": "string"
      }
    ]
  },
  "generatedResume": {
    "summary": "string",
    "experience": [
      {
        "jobTitle": "string (civilian translation)",
        "company": "string",
        "achievements": [
          {
            "verb": "string",
            "description": "string",
            "metrics": "string"
          }
        ]
      }
    ],
    "skills": {
      "technical": ["string"],
      "leadership": ["string"],
      "atsOptimized": ["string"]
    }
  }
}
```

### 3.4 Token Limits & Long Documents

**For typical resumes** (not a concern):
- Military discharge summary: ~2K tokens
- Military records: ~3K tokens
- Job description: ~500 tokens
- System prompt: ~1K tokens
- **Total input: ~6.5K tokens** (far below limits)

**Model Recommendations**:

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| Claude Sonnet 4 | 1M (Tier 4+) | 4K | Best quality + reliability |
| Gemini 1.5 Flash | 1M | 64K | Fast, cheap, good quality |
| Gemini 3 Pro | 2M | 64K | Maximum context |
| GPT-4o | 128K | 4K | Expensive, good quality |

**Gemini 1.5 Flash recommended for Operation Hired**:
- Fast (critical for user experience)
- Cheap ($0.075/1M input tokens)
- 1M context (handles massive records)
- 64K output safety margin
- Already integrated in current stack

### 3.5 Avoiding AI-Detectable Language Patterns

**CRITICAL FINDING**: Recruiters detect **uniformity**, not AI itself

Key insight: "In 2025, using ChatGPT for resumes is just part of the noise. The GPT resume has become a tell."

What recruiters actually look for:
- Lack of personalization (same content across many applications)
- Generic buzzwords (overused power verbs)
- Overly polished language (mismatch with experience level)
- Identical structure (every bullet starts same way)

**Common AI Red Flags**:

❌ Overused phrases:
- "Spearheaded the development and execution of..."
- "Orchestrated cross-functional collaboration to..."
- "Leveraged synergies to drive..."

❌ Mismatch between seniority and language:
- 2-year employee: "Optimized multi-channel go-to-market strategy"
- Entry-level: "Drove enterprise digital transformation"

❌ Repetitive structure:
- Every bullet same length
- Every bullet same verb
- Identical punctuation patterns

**Strategies to Avoid Detection**:

1. **Human Editing**: Have real people rewrite 30-40% of content
2. **Vary Verb Selection**: Mix strong verbs with role-specific language
3. **Add Details**: Personal insights, specific metrics, company names
4. **Match Experience Level**: Junior = simpler language, Senior = strategic language
5. **Template Variation**: Don't use identical structure for each role
6. **Proactive Testing**: Run through GPTZero before submission

**What NOT to do**:
- ❌ Invisible keyword stuffing (white text, tiny font, hidden metadata) - unethical and ATS-detectable
- ❌ Try to completely avoid AI (waste of time)
- ❌ Assume uniform prompts = undetectable (they're not)

---

## 4. ATS Optimization Requirements

### 4.1 Format Rules (Mandatory)

**File Format**:
- ✅ DOCX (preferred)
- ✅ PDF (text-based only)
- ❌ Scanned images
- ❌ Canva exports
- ❌ Design tool PDFs

**Layout**:
- ✅ Single column
- ✅ Simple bullets
- ❌ Tables, columns, text boxes
- ❌ Graphics, images, skill bars
- ❌ Headers/footers (content gets lost)

**Fonts**:
- ✅ Arial, Calibri, Garamond, Georgia, Helvetica
- ✅ Size 10-12pt
- ✅ Dark text on light background
- ❌ Custom/decorative fonts
- ❌ Colored text or backgrounds

**Section Headers**:
- ✅ Use: "Work Experience", "Skills", "Education"
- ❌ Creative: "Professional Journey" instead of "Work Experience"
- Must be consistent and standard names

**Dates**:
- ✅ MM/YYYY or "Month YYYY" (e.g., "01/2020" or "January 2020")
- ❌ Just years
- ❌ Season/month abbreviations

### 4.2 Keyword Optimization Strategy

**CRITICAL**: 99.7% of recruiters use keyword filters

**Process**:
1. Extract keywords from job description
   - Hard skills (tools, software, languages)
   - Certifications mentioned
   - Job titles and synonyms
   - Industry terminology
   - Words appearing multiple times

2. Include both forms
   - Full: "Search Engine Optimization"
   - Short: "SEO"
   - ATS searches for both

3. Integrate naturally (not keyword stuffing)
   - Add to Summary
   - Add to Skills section (moved toward top in 2025)
   - Weave into Experience bullets
   - Avoid unnatural clustering

4. Measure coverage
   - Target: 75% keyword coverage
   - 65% also achieves success
   - Track missing keywords

**Recent Change (2025)**: Skills section moved toward top
- Skills-based hiring dominates 2025
- Place skills right below Summary, before Experience
- ATS scans top-to-bottom

### 4.3 Reverse Chronological Format

Why: 99% of recruiters prefer it, easiest for ATS to parse

```
Your Name
Email | Phone | LinkedIn URL

Professional Summary (2-3 sentences)

Work Experience
Job Title | Company Name | MM/YYYY - MM/YYYY
- Achievement with quantifiable metric
- Another achievement with impact

Skills
Skill 1, Skill 2, Skill 3

Education
Degree | University | Date
```

### 4.4 What ATS Systems Check

Jobscan analysis shows ATS evaluates:
1. Hard skills (tools, languages)
2. Soft skills (leadership, communication)
3. Keywords from job description
4. Repetition of important words
5. Years of experience match
6. Job title match
7. Education level match
8. Spelling and grammar
9. Measurable achievements
10. Certification matches

---

## 5. Technical Implementation

### 5.1 PDF Generation: Puppeteer (Current)

**CURRENT STATUS**: Correctly using Puppeteer ✅

Puppeteer advantages:
- 3x faster than wkhtmltopdf
- Excellent CSS support (Flexbox, Grid, variables)
- Full rendering control
- Modern Chromium browser
- Better PDF quality

Puppeteer trade-offs:
- Higher memory (2Gi appropriate for your setup)
- Larger PDF files
- Higher CPU usage

Alternative (wkhtmltopdf):
- Lower memory
- Smaller files
- No JavaScript support
- Outdated rendering engine
- **Not recommended** for military resumes (too complex)

**Verdict**: Your current Puppeteer implementation is the right choice ✅

### 5.2 Recommended Pipeline Architecture

```
Military Documents (PDF/DOCX/TXT)
    ↓
Text Extraction (existing code)
    ↓
Phase 1: LLM Profile Extraction
  Input: Military docs + job description
  Output: CandidateProfile (JSON)
  Temperature: 0.25
    ↓
Phase 2: LLM Resume Generation
  Input: CandidateProfile + job description
  Output: ResumeContent (JSON)
  Temperature: 0.25
    ↓
Phase 3: ATS Optimization (Rule-based)
  Input: ResumeContent + job description
  Output: OptimizedResume (JSON) + keyword suggestions
    ↓
Phase 4: Format Generation
  ├─ HTML Template (React component)
  ├─ PDF via Puppeteer → Firebase Storage
  ├─ DOCX via docx library → Firebase Storage
  └─ Plain text → Optional
    ↓
Download URLs → User
```

### 5.3 HTML → DOCX Conversion

**Current approach**: `docx` library (good)
- Native DOCX generation
- No external dependencies
- Works well for structured documents

**Alternative options**:
- `html2docx` (Python) - if HTML → DOCX conversion needed
- `html-for-docx` (actively maintained, MIT licensed)
- Aspose.Words (commercial, professional)
- Pandoc (extremely versatile, external dependency)

Current implementation is appropriate ✅

### 5.4 Plain Text Export

Why needed:
- Some ATS require plain text upload
- Web form paste operations
- Email-friendly format

Format (ATS-friendly):
```
JOHN DOE
john@email.com | (555) 123-4567 | LinkedIn URL

PROFESSIONAL SUMMARY
2-3 sentences of compelling introduction.

PROFESSIONAL EXPERIENCE

Operations Manager
ABC Corporation | Seattle, WA | January 2020 - Present
- Achievement with metric
- Another achievement with quantifiable result

CORE SKILLS
Skill1, Skill2, Skill3, Skill4, Skill5

CERTIFICATIONS
Certificate Name
Security Clearance (Active/Inactive)

EDUCATION
Degree | University | Date
```

### 5.5 Format-Agnostic Architecture

**Best practice**: Generate once, export many

```
Resume Data (JSON)
    ├─→ HTML Template → Puppeteer → PDF
    ├─→ DOCX Builder → DOCX
    ├─→ Plain Text Generator → TXT
    └─→ React Component → Web Display
```

Benefits:
- Single source of truth (JSON)
- Consistent content across formats
- Easy template updates
- Reduces LLM calls

---

## 6. Prompt Engineering Strategy

### 6.1 Phase 1: Profile Extraction Prompt

```
System: "You are a military-to-civilian resume expert specializing in
translating military experience to civilian context. Extract structured
career data from military documents, providing civilian equivalents for
all military terminology."

User Input: "
Military Documents:
{military_documents_text}

Target Job Description:
{job_description}

Extract and respond with JSON:
{
  militaryRank: '...',
  yearsOfService: number,
  primaryMOS: '...',
  civilianJobTitle: '...',
  keyResponsibilities: ['...', '...'],
  hardSkills: ['...', '...'],
  softSkills: ['...', '...'],
  quantifiedAchievements: [
    { description: '...', metrics: '...', impact: '...' }
  ],
  militaryCertifications: ['...'],
  securityClearances: ['...']
}"

Temperature: 0.25
```

### 6.2 Phase 2: Resume Generation Prompt

```
System: "You are an expert resume writer specializing in military-to-
civilian translation. Generate compelling, ATS-optimized resume content
that emphasizes quantified achievements and uses civilian language that
resonates with non-military hiring managers."

User Input: "
Candidate Profile (from Phase 1):
{candidate_profile_json}

Target Job Description:
{job_description}

Generate resume sections as JSON (be specific, quantitative, action-oriented):
{
  professionalSummary: 'string (2-3 sentences, include 2-3 key keywords)',
  experience: [
    {
      jobTitle: '...',
      company: '...',
      location: '...',
      dates: 'MM/YYYY - MM/YYYY',
      achievements: [
        {
          actionVerb: 'string (strong but varied)',
          description: 'string',
          metrics: 'string (if quantifiable)',
          jobDescriptionAlignment: ['keyword1', 'keyword2']
        }
      ]
    }
  ],
  skills: {
    technical: ['skill1', 'skill2'],
    leadership: ['skill1', 'skill2'],
    atsOptimized: ['keyword1', 'keyword2'] // from job description
  },
  certifications: ['...'],
  securityClearances: ['...'],
  education: [
    {
      degree: '...',
      institution: '...',
      graduationDate: 'MM/YYYY'
    }
  ]
}"

Temperature: 0.25
```

### 6.3 Phase 3: ATS Optimization (Rule-Based, No LLM)

```typescript
const optimizeForATS = (resumeData, jobDescription) => {
  // Extract keywords from job description
  const keywords = nlp.extractKeywords(jobDescription);

  // Check keyword coverage
  const coverage = calculateCoverage(resumeData, keywords);

  // Suggest additions (don't rewrite)
  const suggestions = {
    missingKeywords: keywords.filter(k => !coverage.includes(k)),
    suggestedAdditions: [
      { keyword: 'Python', section: 'skills', position: 'add to technical' },
      { keyword: 'AWS', section: 'experience', position: 'add to achievement bullet 2' }
    ]
  };

  // Validate formatting
  const formatIssues = [];
  if (hasImages) formatIssues.push('Remove images from template');
  if (hasHeaders) formatIssues.push('Remove header/footer content');
  if (!isReverseChronological) formatIssues.push('Reorder experience newest first');

  return {
    optimized: resumeData,
    coverage: { coverage: '68%', target: '75%' },
    suggestions,
    formatIssues,
    readyForSubmit: formatIssues.length === 0 && coverage >= 0.75
  };
};
```

---

## 7. Operation Hired Specific Considerations

### 7.1 Military-to-Civilian Mapping

**Unique value proposition**:
1. Automatic rank → civilian title translation
2. Military jargon → plain English
3. Security clearance handling
4. MOS → skill translation
5. Military certification recognition

**Example mapping**:
- Military: "O-5 in Joint Operations"
  → Civilian: "Senior Program Manager in Cross-Functional Coordination"

- Military: "Secret security clearance (active)"
  → Civilian: "Secret security clearance (eligible for active status)"

### 7.2 Multi-Document Handling

Support these military documents:
- DD-214 (Discharge Summary)
- ERB (Enlisted Record Brief)
- OER (Officer Evaluation Report)
- Award Summaries
- Certification Records

Each provides unique content for resume generation.

### 7.3 Veteran-Specific Keywords

Pre-load keyword dictionaries for:
- Veteran-friendly employers
- Military cultural fit
- OFCCP compliance (federal contractor requirements)
- Veteran hiring programs (VEVRAA, etc.)

### 7.4 Slack Integration

Current implementation appropriate:
- #operation-hired channel updates
- De-duplication via Firestore timestamps
- New candidate intake notification
- Resume ready notification

---

## 8. Model Comparison Summary

### For Resume Generation (2025)

**Claude Opus 4.5** (Best quality)
- Most natural writing
- Best keyword integration
- Exceptional at structured reasoning
- Cost: $$ (expensive)
- Token limit: 1M input (Tier 4+)

**Gemini 1.5 Flash** (Best value)
- Fast (critical for user experience)
- Cheap ($0.075/1M input tokens)
- 1M input context
- 64K output capacity
- Good quality for structured generation
- **RECOMMENDED for Operation Hired**

**Gemini 3 Pro** (Maximum context)
- 2M input tokens
- 64K output
- Better than Flash, more expensive
- Overkill for resume generation

**GPT-4o** (Good balance)
- 128K context
- Good quality
- Expensive
- Well-integrated OpenAI ecosystem

**Claude Haiku** (Fast, cheap)
- Not recommended (lower quality)

**Verdict**: Stick with Gemini 1.5 Flash ✅

---

## 9. Implementation Checklist

### Phase 1 (Core)
- ✅ Multi-step LLM generation
- ✅ JSON intermediate format
- ✅ Puppeteer PDF generation
- ✅ DOCX export
- ✅ Firebase Storage integration

### Phase 2 (ATS Optimization)
- ⬜ Keyword extraction from job descriptions
- ⬜ Keyword coverage checking
- ⬜ Missing keyword suggestions
- ⬜ Format validation (reverse chronological, no images, etc.)
- ⬜ Warning system for ATS issues
- ⬜ Coverage score display (e.g., "68% keyword match")

### Phase 3 (Humanization)
- ⬜ Verb variation templates
- ⬜ Sentence structure variation
- ⬜ Plain text export option
- ⬜ Optional human editing workflow

### Phase 4 (Advanced)
- ⬜ Company-specific ATS detection
- ⬜ Industry keyword dictionaries
- ⬜ A/B testing prompt variations
- ⬜ User feedback loop (interview success tracking)

---

## 10. Key Metrics to Track

1. **Keyword Coverage**: Target 75%+ (compare resume to job description)
2. **ATS Format Validation**: Target 100% (no images, single column, proper fonts)
3. **Generation Success Rate**: Target 95%+
4. **User Satisfaction**: Track via survey
5. **Interview Success Rate**: Future - via user feedback

---

## Sources

This research synthesizes findings from:

- [Teal Resume Builder Analysis](https://www.tealhq.com/post/best-ai-resume-builders)
- [Rezi.ai Technical Approaches](https://www.rezi.ai/posts/rezi-vs-teal)
- [Jobscan ATS Optimization Research](https://www.jobscan.co/blog/ats-resume/)
- [The Interview Guys - ATS Format 2025](https://blog.theinterviewguys.com/best-ats-format-resume-for-2025/)
- [Resume Optimization Best Practices](https://www.resumeadapter.com/blog/ats-compatibility-what-it-means-and-how-to-pass-in-2025/)
- [Chain-of-Thought Prompting Research](https://dl.acm.org/doi/10.1145/3690635)
- [Claude vs Gemini vs ChatGPT Resume Comparison](https://www.tomsguide.com/ai/i-asked-chatgpt-vs-gemini-vs-claude-to-write-a-resume)
- [LLM Temperature Control Guide](https://medium.com/@tahirbalarabe2/%EF%B8%8Funderstanding-llm-temperature-creativity-vs-consistency-ce2e8194ed7c)
- [Puppeteer vs wkhtmltopdf Benchmark](https://www.kyotutechnology.com/pdf-generation-libraries-performance-wkhtmltopdf-vs-puppeteer/)
- [Token Limits Comparison 2025](https://www.bleepingcomputer.com/news/artificial-intelligence/claude-gets-1m-tokens-support-via-api-to-take-on-gemini-2-5-pro/)
- [Python HTML to DOCX Libraries](https://blog.finxter.com/5-best-ways-to-convert-html-to-docx-in-python/)
- [AI Detection and Resume Red Flags](https://natesnewsletter.substack.com/p/the-ai-resume-survival-guide-for-72f)

---

## Document Information

- **Type**: Research & Best Practices
- **Created**: January 4, 2026
- **Project**: Operation Hired - AI Resume Generator
- **Status**: Complete Analysis
- **Applicability**: Multi-step resume generation pipeline
