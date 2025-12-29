# Implementation Plan: 3-PDF Resume Bundle System

**Status:** In Progress
**Priority:** P0 (Critical - Core Feature)
**Complexity:** High
**Estimated Changes:** 15+ files

---

## Overview

Transform Operation Hired from single civilian resume → 3-PDF bundle system:
1. **Military Resume** (preserves military language)
2. **Civilian Resume** (translates to civilian terms)
3. **Crosswalk Guide** (maps military → civilian with explanations)

---

## Phase 1: Backend - AI Prompt & TypeScript Types

### 1.1 Create New TypeScript Types

**File:** `services/worker/src/types/candidate.ts`

**Add new interfaces:**
```typescript
export interface ResumeArtifact {
  format: 'html';
  filename: string;
  content_html: string;
}

export interface ResumeArtifacts {
  resume_military: ResumeArtifact;
  resume_civilian: ResumeArtifact;
  resume_crosswalk: ResumeArtifact;
}

export interface RenderHints {
  page_size: 'LETTER';
  margins_in: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  font_stack: string;
}

export interface QAMetadata {
  target_role_used: string;
  bullets_translated_count: number;
  terms_mapped_count: number;
  placeholders_used: boolean;
  no_fabrication_confirmed: boolean;
}

export interface ThreePDFOutput {
  artifacts: ResumeArtifacts;
  render_hints: RenderHints;
  qa: QAMetadata;
  profile: CandidateProfile;  // Keep for backward compat
}
```

### 1.2 Update Vertex AI Prompt

**File:** `services/worker/src/services/vertex.ts`

**Complete prompt rewrite** combining:
- Jeremy's 3-artifact JSON structure
- Jeremy's HTML output requirements
- Jeremy's crosswalk requirements
- Our detail preservation rules
- Our bullet quality standards

**Key sections:**
1. NON-NEGOTIABLE RULES (Jeremy's 8 rules)
2. DETAIL PRESERVATION RULES (our 7 rules to prevent over-simplification)
3. MILITARY→CIVILIAN TRANSLATION PATTERNS
4. OUTPUT FORMAT (3 artifacts + render_hints + qa + profile)
5. HTML REQUIREMENTS (complete HTML with inline CSS)
6. CONTENT REQUIREMENTS for each artifact

---

## Phase 2: Backend - PDF Generation

### 2.1 Create HTML Renderers for Each Document

**New file:** `services/worker/src/services/htmlRenderers.ts`

Functions needed:
- `renderMilitaryResumeHTML(profile, qa)` → string
- `renderCivilianResumeHTML(profile, qa)` → string
- `renderCrosswalkHTML(profile, qa)` → string

Each function:
- Takes structured data
- Returns complete HTML with inline CSS
- Enforces one-page layout (except crosswalk: 1-2 pages)
- Uses `render_hints` for consistent styling

### 2.2 Update PDF Export Service

**File:** `services/worker/src/services/exportResume.ts`

**Current function:**
```typescript
exportResumeAsPDF(resume, candidate) → saves 1 PDF
```

**New function:**
```typescript
exportThreePDFBundle(artifacts, candidateId) → saves 3 PDFs
```

**Changes:**
- Take `artifacts.resume_military.content_html` → Puppeteer → military.pdf
- Take `artifacts.resume_civilian.content_html` → Puppeteer → civilian.pdf
- Take `artifacts.resume_crosswalk.content_html` → Puppeteer → crosswalk.pdf
- Save to Storage:
  - `candidates/{id}/exports/{timestamp}-military.pdf`
  - `candidates/{id}/exports/{timestamp}-civilian.pdf`
  - `candidates/{id}/exports/{timestamp}-crosswalk.pdf`

### 2.3 Remove DOCX Generation

**File:** `services/worker/src/services/exportResume.ts`

- Delete `exportResumeAsDocx()` function
- Remove `docx` library dependency
- Update imports

---

## Phase 3: Backend - Database & API

### 3.1 Update Firestore Schema

**Collection:** `resumes`

**Add new fields:**
```typescript
{
  // ... existing fields ...

  // New 3-PDF paths
  militaryPdfPath: string;     // "candidates/{id}/exports/{ts}-military.pdf"
  civilianPdfPath: string;     // "candidates/{id}/exports/{ts}-civilian.pdf"
  crosswalkPdfPath: string;    // "candidates/{id}/exports/{ts}-crosswalk.pdf"

  // QA metadata
  qa: {
    target_role_used: string;
    bullets_translated_count: number;
    terms_mapped_count: number;
    placeholders_used: boolean;
    no_fabrication_confirmed: boolean;
  };

  // Deprecated (keep for backward compat, don't use)
  pdfPath?: string;
  docxPath?: string;
}
```

### 3.2 Update Download Endpoints

**File:** `services/worker/src/handlers/processCandidateHandler.ts`

**Current endpoint:**
```
GET /internal/resumeDownload/:candidateId/:format
  format: 'pdf' | 'docx'
```

**New endpoint:**
```
GET /internal/resumeDownload/:candidateId/:type
  type: 'military' | 'civilian' | 'crosswalk' | 'bundle'
```

**Behavior:**
- `type=military` → stream military.pdf
- `type=civilian` → stream civilian.pdf
- `type=crosswalk` → stream crosswalk.pdf
- `type=bundle` → create ZIP with all 3, stream ZIP

### 3.3 Add ZIP Generation

**New dependency:** `archiver` (Node.js ZIP library)

**New function:** `createResumeBundle(candidateId)`
- Fetch all 3 PDFs from Storage
- Create ZIP in-memory
- Stream to response as `{name}_resume_bundle.zip`

---

## Phase 4: Frontend - UI/UX

### 4.1 Update Download UI Component

**File:** `frontend/src/pages/IntakeCompletePage.tsx`

**Current UI:**
```
[Download PDF]  [Download DOCX]
```

**New UI:**
```
┌─────────────────────────────────────────────────┐
│  ✅ Your Resume Bundle is Ready!                │
├─────────────────────────────────────────────────┤
│                                                  │
│  📄 Military Resume                    [Download]│
│     Your experience in military terms            │
│                                                  │
│  �� Civilian Resume                    [Download]│
│     Translated for civilian recruiters           │
│                                                  │
│  📄 Recruiter Guide                    [Download]│
│     Translation key for interviews               │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  📦 Download All as ZIP                  │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Design Specs:**
- Card-based layout with subtle shadows
- Each document has:
  - Icon (📄 emoji or custom SVG)
  - Document name (bold, 16px)
  - Description (gray, 14px)
  - Download button (primary color, right-aligned)
- "Download All" button:
  - Full-width
  - Distinct style (outlined or secondary color)
  - Icon (📦 or download-cloud icon)
- Loading states: Spinner on clicked button
- Success feedback: Brief checkmark animation
- Mobile responsive: Stack vertically on small screens

### 4.2 Update Admin UI

**File:** `frontend/src/pages/AdminCandidateDetailPage.tsx`

Same UI pattern as IntakeCompletePage.

### 4.3 Add ZIP Download Logic

**File:** `frontend/src/pages/IntakeCompletePage.tsx`

```typescript
async function handleDownloadBundle() {
  setDownloading('bundle');
  try {
    const response = await fetch(
      `${WORKER_URL}/internal/resumeDownload/${candidateId}/bundle`
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidateName}_resume_bundle.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    setError('Failed to download bundle');
  } finally {
    setDownloading(null);
  }
}
```

---

## Phase 5: Testing & Deployment

### 5.1 Testing Checklist

**Backend:**
- [ ] Vertex AI returns 3-artifact JSON
- [ ] HTML content is valid and complete
- [ ] 3 PDFs generated correctly
- [ ] Firestore schema updated
- [ ] Download endpoints work for all types
- [ ] ZIP bundle generation works
- [ ] Skills section appears in all resumes

**Frontend:**
- [ ] UI displays 3 download buttons
- [ ] Individual downloads work
- [ ] ZIP download works
- [ ] Loading states show correctly
- [ ] Mobile responsive
- [ ] Error handling works

**Quality:**
- [ ] Military resume preserves military language
- [ ] Civilian resume translates properly
- [ ] Crosswalk maps all terms and bullets
- [ ] Skills section includes 10-14 items
- [ ] Bullets have 6-8 per role with full detail
- [ ] No fabrication - only source data
- [ ] Dates, locations, metrics preserved

### 5.2 Deployment Steps

1. Create feature branch: `feat/3-pdf-resume-bundle`
2. Implement Phase 1-4
3. Test locally
4. Create PR with comprehensive description
5. Review & merge
6. Deploy worker via Cloud Build
7. Deploy frontend via Firebase Hosting
8. Smoke test in production
9. Monitor logs for errors

---

## Risk Mitigation

**Risk:** Vertex AI doesn't generate valid HTML
**Mitigation:** Add HTML validation, fallback templates

**Risk:** PDF generation fails for one document
**Mitigation:** Graceful degradation - generate available PDFs

**Risk:** Users confused by 3 documents
**Mitigation:** Clear descriptions, tooltips, help text

**Risk:** Storage costs increase 3x
**Mitigation:** PDFs are small (50-200KB each), minimal cost impact

---

## Success Metrics

- [ ] 100% of resumes generate all 3 PDFs
- [ ] Skills section appears in 100% of resumes
- [ ] Average detail score (bullets with 2+ metrics) > 90%
- [ ] User downloads: 60% civilian, 30% military, 10% crosswalk (predicted)
- [ ] Bundle downloads: 20% of users
- [ ] No increase in error rate

---

## Next Steps

1. ✅ Create this implementation plan
2. ⏳ Update TypeScript types
3. ⏳ Update Vertex AI prompt
4. ⏳ Create HTML renderers
5. ⏳ Update PDF generation
6. ⏳ Update Firestore schema
7. ⏳ Update download endpoints
8. ⏳ Update frontend UI
9. ⏳ Test & deploy

