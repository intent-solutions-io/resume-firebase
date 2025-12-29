# 3-PDF System Implementation Plan - Prototype First Approach

**Status:** Active
**Approach:** Option C - Minimal Prototype → Full Implementation
**Start Date:** 2025-12-29
**Engineer:** Claude (Senior Full-Stack)

---

## Executive Summary

Implement 3-PDF Resume Bundle system in **3 major checkpoints** with ability to resume at any step.

**Checkpoint 1:** Minimal Backend Prototype (No UI changes)
**Checkpoint 2:** Validate & Test Prototype
**Checkpoint 3:** Full Production Implementation

Each checkpoint is independently deployable and testable.

---

## CHECKPOINT 1: Minimal Backend Prototype

**Goal:** Get Vertex AI to generate 3 HTML documents and save as 3 PDFs
**No frontend changes** - test via Cloud Run logs and Storage browser
**Estimated Time:** 1-2 hours
**Risk:** Low (can rollback easily)

### Step 1.1: Create New TypeScript Types
**File:** `services/worker/src/types/threePdf.ts` (NEW FILE)
**Why new file:** Keeps existing types intact, easy to rollback

```typescript
// New types for 3-PDF system (won't break existing code)
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

export interface ThreePDFGenerationOutput {
  artifacts: ResumeArtifacts;
  render_hints: RenderHints;
  qa: QAMetadata;
}
```

**Checkpoint:** Types compile without errors
**Test:** `cd services/worker && npm run typecheck`

---

### Step 1.2: Create Prototype Vertex AI Function
**File:** `services/worker/src/services/vertexThreePdf.ts` (NEW FILE)
**Why new file:** Don't touch existing vertex.ts, can test in parallel

**Implementation:**
1. Copy existing `vertex.ts` structure
2. Replace SYSTEM_PROMPT with merged prompt (Jeremy's + our rules)
3. Update return type to `ThreePDFGenerationOutput`
4. Update parser to expect `artifacts` structure

**Key Security Considerations:**
- Validate HTML content for XSS (use DOMPurify or sanitize)
- Ensure no script tags in generated HTML
- Validate JSON structure before parsing
- Handle malformed responses gracefully

**Checkpoint:** Function compiles
**Test:** `npm run typecheck`

---

### Step 1.3: Create HTML-to-PDF Converter
**File:** `services/worker/src/services/htmlToPdf.ts` (NEW FILE)

```typescript
import puppeteer from 'puppeteer';

interface PDFOptions {
  margins_in: { top: number; right: number; bottom: number; left: number };
  page_size: 'LETTER';
}

export async function convertHtmlToPdf(
  html: string,
  options: PDFOptions
): Promise<Buffer> {
  // Security: Validate HTML doesn't contain dangerous scripts
  if (html.includes('<script')) {
    throw new Error('Security: HTML contains script tags');
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: `${options.margins_in.top}in`,
        right: `${options.margins_in.right}in`,
        bottom: `${options.margins_in.bottom}in`,
        left: `${options.margins_in.left}in`,
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
```

**Checkpoint:** Function compiles and exports
**Test:** `npm run build`

---

### Step 1.4: Create 3-PDF Export Function
**File:** `services/worker/src/services/exportThreePdf.ts` (NEW FILE)

```typescript
import { Storage } from '@google-cloud/storage';
import { convertHtmlToPdf } from './htmlToPdf.js';
import type { ThreePDFGenerationOutput } from '../types/threePdf.js';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev',
});

export async function exportThreePdfBundle(
  candidateId: string,
  generationOutput: ThreePDFGenerationOutput
): Promise<{
  militaryPdfPath: string;
  civilianPdfPath: string;
  crosswalkPdfPath: string;
}> {
  const timestamp = Date.now();
  const bucket = storage.bucket(
    process.env.FIREBASE_STORAGE_BUCKET || 'resume-gen-intent-dev.firebasestorage.app'
  );

  // Convert each HTML to PDF
  const [militaryPdf, civilianPdf, crosswalkPdf] = await Promise.all([
    convertHtmlToPdf(
      generationOutput.artifacts.resume_military.content_html,
      generationOutput.render_hints
    ),
    convertHtmlToPdf(
      generationOutput.artifacts.resume_civilian.content_html,
      generationOutput.render_hints
    ),
    convertHtmlToPdf(
      generationOutput.artifacts.resume_crosswalk.content_html,
      generationOutput.render_hints
    ),
  ]);

  // Define storage paths
  const militaryPath = `candidates/${candidateId}/exports/${timestamp}-military.pdf`;
  const civilianPath = `candidates/${candidateId}/exports/${timestamp}-civilian.pdf`;
  const crosswalkPath = `candidates/${candidateId}/exports/${timestamp}-crosswalk.pdf`;

  // Upload to Storage in parallel (efficient)
  await Promise.all([
    bucket.file(militaryPath).save(militaryPdf, {
      metadata: { contentType: 'application/pdf' },
    }),
    bucket.file(civilianPath).save(civilianPdf, {
      metadata: { contentType: 'application/pdf' },
    }),
    bucket.file(crosswalkPath).save(crosswalkPdf, {
      metadata: { contentType: 'application/pdf' },
    }),
  ]);

  console.log(`[exportThreePdf] Saved 3 PDFs for candidate: ${candidateId}`);

  return {
    militaryPdfPath: militaryPath,
    civilianPdfPath: civilianPath,
    crosswalkPdfPath: crosswalkPath,
  };
}
```

**Checkpoint:** Compiles without errors
**Test:** `npm run build`

---

### Step 1.5: Create Prototype Test Endpoint
**File:** `services/worker/src/handlers/prototypeHandler.ts` (NEW FILE)

```typescript
import { Request, Response } from 'express';
import { generateThreePdfResume } from '../services/vertexThreePdf.js';
import { exportThreePdfBundle } from '../services/exportThreePdf.js';

/**
 * PROTOTYPE ENDPOINT - Test 3-PDF generation
 * POST /internal/prototype/threePdf
 * Body: { candidateId: string }
 */
export async function prototypeThreePdfHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      res.status(400).json({ error: 'candidateId required' });
      return;
    }

    console.log(`[prototype] Testing 3-PDF generation for: ${candidateId}`);

    // Fetch candidate and documents from Firestore
    // (Use existing fetching logic)

    // Generate 3 PDFs
    const output = await generateThreePdfResume({
      candidateId,
      // ... other required fields
    });

    // Export to storage
    const paths = await exportThreePdfBundle(candidateId, output);

    console.log(`[prototype] Success! Paths:`, paths);

    res.json({
      success: true,
      paths,
      qa: output.qa,
    });
  } catch (error) {
    console.error('[prototype] Error:', error);
    res.status(500).json({
      error: 'Prototype failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

**Checkpoint:** Endpoint registered in Express app
**Test:** Server starts without errors

---

### Step 1.6: Register Prototype Endpoint
**File:** `services/worker/src/index.ts`

```typescript
// Add import
import { prototypeThreePdfHandler } from './handlers/prototypeHandler.js';

// Add route (AFTER existing routes, before error handler)
app.post('/internal/prototype/threePdf', prototypeThreePdfHandler);
```

**Checkpoint:** Server compiles and starts
**Test:** `npm run dev` - no errors

---

### Step 1.7: Build and Deploy Prototype
**Commands:**
```bash
cd services/worker
npm run build
# Build Docker
cd ../..
gcloud builds submit --config=cloudbuild.yaml --substitutions=SHORT_SHA=$(git rev-parse --short HEAD) --project resume-gen-intent-dev .
# Deploy
gcloud run deploy resume-worker-dev --image us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator/worker:latest --region us-central1 --project resume-gen-intent-dev
```

**Checkpoint:** Deployment succeeds, health check passes
**Test:** `curl https://resume-worker-dev-96171099570.us-central1.run.app/health`

---

## CHECKPOINT 2: Validate Prototype

**Goal:** Test that Vertex AI generates valid HTML and PDFs are created correctly

### Step 2.1: Test with Real Data

**Test via Postman or curl:**
```bash
curl -X POST https://resume-worker-dev-96171099570.us-central1.run.app/internal/prototype/threePdf \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "EXISTING_CANDIDATE_ID"}'
```

**Expected Response:**
```json
{
  "success": true,
  "paths": {
    "militaryPdfPath": "candidates/xxx/exports/123-military.pdf",
    "civilianPdfPath": "candidates/xxx/exports/123-civilian.pdf",
    "crosswalkPdfPath": "candidates/xxx/exports/123-crosswalk.pdf"
  },
  "qa": {
    "target_role_used": "Operations Manager",
    "bullets_translated_count": 14,
    "terms_mapped_count": 25,
    "placeholders_used": false,
    "no_fabrication_confirmed": true
  }
}
```

**Checkpoint:** All 3 PDFs created in Storage
**Verification:** Check Firebase Storage console

---

### Step 2.2: Download and Inspect PDFs

1. Download all 3 PDFs from Storage
2. **Verify Military Resume:**
   - Contains military titles (e.g., "Platoon Sergeant")
   - Contains unit names (e.g., "423d Security Forces Squadron")
   - Contains military terminology
   - Skills section has 10-14 items ✓
   - 6-8 bullets per experience ✓

3. **Verify Civilian Resume:**
   - Translates titles (e.g., "Operations Supervisor [Platoon Sergeant]")
   - Expands acronyms
   - Uses civilian-friendly language
   - Skills section has 10-14 items ✓
   - 6-8 bullets per experience ✓

4. **Verify Crosswalk:**
   - Section 1: Term mapping table
   - Section 2: Bullet-by-bullet comparison
   - All acronyms explained

**Checkpoint:** Quality meets standards (6-8 bullets, skills present, detail preserved)

---

### Step 2.3: Iterate on Prompt if Needed

**If quality is poor:**
1. Adjust prompt in `vertexThreePdf.ts`
2. Rebuild and redeploy
3. Test again
4. Repeat until quality is acceptable

**Don't proceed to Checkpoint 3 until prototype quality is excellent.**

---

## CHECKPOINT 3: Full Production Implementation

**Only proceed after Checkpoint 2 validates approach**

### Step 3.1: Replace Existing System

**Changes:**
1. Update `processCandidateHandler.ts` to use new 3-PDF functions
2. Update Firestore writes to include new paths
3. Add download endpoints for 3 PDFs
4. Add ZIP bundle endpoint
5. Update frontend UI

### Step 3.2: Frontend Implementation

**File:** `frontend/src/pages/IntakeCompletePage.tsx`

Beautiful 3-PDF download UI with:
- Individual download buttons
- "Download All as ZIP" button
- Loading states
- Success animations
- Mobile responsive

### Step 3.3: Full Testing

- End-to-end workflow
- All 3 documents quality check
- ZIP download works
- Mobile experience
- Error handling

### Step 3.4: Production Deployment

- Create PR
- Review
- Merge
- Deploy
- Monitor

---

## Rollback Plan

**If anything goes wrong at any checkpoint:**

### From Checkpoint 1:
- Delete new files (`vertexThreePdf.ts`, `htmlToPdf.ts`, etc.)
- Remove prototype endpoint
- Redeploy - back to working state

### From Checkpoint 2:
- Keep prototype endpoint but don't integrate
- Continue using existing single-resume system
- Debug prototype separately

### From Checkpoint 3:
- Revert PR
- Redeploy previous version
- System back to single resume

---

## Security Checklist

- [ ] HTML sanitization (no script tags)
- [ ] Input validation on all endpoints
- [ ] Firestore security rules updated
- [ ] Storage access controls verified
- [ ] No sensitive data in logs
- [ ] Error messages don't leak implementation details
- [ ] Rate limiting on endpoints
- [ ] CORS configured correctly
- [ ] Authentication on admin endpoints

---

## Code Quality Standards

**TypeScript:**
- Strict mode enabled
- No `any` types
- Proper error handling with typed errors
- Async/await (no callback hell)
- Proper null checks

**Testing:**
- Unit tests for pure functions
- Integration tests for API endpoints
- Manual QA before production

**Documentation:**
- JSDoc comments on all exported functions
- README updates
- API documentation

**Git Hygiene:**
- Atomic commits
- Clear commit messages
- Feature branch per checkpoint
- PR per major change

---

## Progress Tracking

### Checkpoint 1: Minimal Backend Prototype
- [ ] Step 1.1: TypeScript types created
- [ ] Step 1.2: vertexThreePdf.ts implemented
- [ ] Step 1.3: htmlToPdf.ts implemented
- [ ] Step 1.4: exportThreePdf.ts implemented
- [ ] Step 1.5: Prototype endpoint created
- [ ] Step 1.6: Endpoint registered
- [ ] Step 1.7: Deployed to Cloud Run

### Checkpoint 2: Validation
- [ ] Step 2.1: Tested with real data
- [ ] Step 2.2: PDFs downloaded and inspected
- [ ] Step 2.3: Quality verified (6-8 bullets, skills present)

### Checkpoint 3: Full Implementation
- [ ] Step 3.1: Integrated with main system
- [ ] Step 3.2: Frontend UI implemented
- [ ] Step 3.3: Full testing complete
- [ ] Step 3.4: Deployed to production

---

## Current Status

**Checkpoint:** Ready to start Checkpoint 1
**Next Action:** Create TypeScript types file (Step 1.1)
**Blockers:** None
**Risk Level:** Low (prototype in isolated files)

