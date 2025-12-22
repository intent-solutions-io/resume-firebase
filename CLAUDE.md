# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Task Tracking (Beads / bd)
- Use `bd` for ALL tasks/issues (no markdown TODO lists).
- Start of session: `bd ready`
- Create work: `bd create "Title" -p 1 --description "Context + acceptance criteria"`
- Update status: `bd update <id> --status in_progress`
- Finish: `bd close <id> --reason "Done"`
- End of session: `bd sync` (flush/import/export + git sync)
- Manual testing safety:
  - Prefer `BEADS_DIR` to isolate a workspace if needed. (`BEADS_DB` exists but is deprecated.)
- After upgrading `bd`, run: `bd info --whats-new`
- If `bd info` warns about hooks, run: `bd hooks install`

## Docs Folder Rule (STRICT)

- **Keep `000-docs/` strictly flat (no subfolders).**
- Both NNN and 6767 files live directly in `000-docs/`.
- After every phase, create an AAR in `000-docs/` as: `NNN-AA-AACR-phase-<n>-short-description.md`

### Filename Patterns

**Project Docs:**
```
NNN-CC-ABCD-short-description.md
```
Example: `001-PP-PROD-mvp-requirements.md`

**Canonical Standards:**
```
6767-[TOPIC-]CC-ABCD-short-description.md
```
Example: `6767-DR-STND-document-filing-system-standard-v4.md`

**Important:** No numeric IDs after `6767-` in filenames (v3+ rule). Document IDs like `6767-120` may appear in headers only.

Reference: `000-docs/6767-DR-STND-document-filing-system-standard-v4.md`

---

## Project Overview

**Operation Hired** - AI-powered military-to-civilian resume generator helping veterans translate their military experience into civilian-friendly resumes.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- Backend: Cloud Run (Node.js 20 Express)
- Database: Firestore
- Storage: Firebase Storage
- AI: Vertex AI Gemini 1.5 Flash
- PDF Generation: Puppeteer with system Chromium
- DOCX Generation: `docx` library
- Deployment: Firebase Hosting + Cloud Run

**GCP Project:** `resume-gen-intent-dev`

---

## Architecture

This is a monorepo with three main components:

```
firebase-generator/
├── frontend/              # React SPA (Firebase Hosting)
├── services/
│   ├── worker/           # Cloud Run service (document processing, AI, exports)
│   └── api/              # (legacy, not currently used)
└── packages/
    └── shared/           # Shared types and Zod schemas
```

### Data Flow

1. **Candidate Intake** → Frontend collects candidate info (`/intake`)
2. **Document Upload** → Candidate uploads military docs (`/intake/:id/documents`)
3. **Worker Processing** → Cloud Run service:
   - Extracts text from PDFs/DOCX/TXT
   - Calls Vertex AI to generate `CandidateProfile` and `GeneratedResume`
   - Exports PDF and DOCX to Firebase Storage
   - Sends Slack notifications to `#operation-hired`
4. **Download** → Candidate downloads resume (`/intake/:id/complete`)

### Firestore Collections

| Collection | Purpose |
|------------|---------|
| `candidates` | Basic candidate info (name, email, branch, rank, MOS) |
| `candidateDocuments` | Uploaded document metadata |
| `candidateProfiles` | AI-generated structured profile data |
| `resumes` | AI-generated resume content and export paths |

### Storage Structure

```
candidates/{candidateId}/documents/{timestamp}-{filename}
candidates/{candidateId}/exports/{timestamp}-resume.pdf
candidates/{candidateId}/exports/{timestamp}-resume.docx
```

---

## Development Commands

### Frontend (React + Vite)

```bash
cd frontend

# Development
npm run dev              # Start dev server on http://localhost:3000
npm run build            # TypeScript compile + Vite build
npm run preview          # Preview production build

# Code Quality
npm run lint             # ESLint
npm run typecheck        # TypeScript type checking
npm test                 # Run Vitest tests
npm run test:watch       # Watch mode for tests
```

### Worker (Cloud Run Service)

```bash
cd services/worker

# Development
npm run dev              # Watch mode with tsx (hot reload)
npm run build            # TypeScript compile to dist/
npm start                # Run built code (node dist/index.js)

# Code Quality
npm run lint             # ESLint
npm run typecheck        # TypeScript type checking
npm test                 # Run Vitest tests
```

### Shared Package

```bash
cd packages/shared

# Build shared types/schemas
npm run build            # Must run before using in other packages
npm run lint
npm run typecheck
npm test
```

---

## Deployment

### Deploy Frontend to Firebase Hosting

```bash
cd frontend
npm run build
firebase deploy --only hosting --project resume-gen-intent-dev
```

**Live URL:** https://resume-gen-intent-dev.web.app

### Deploy Worker to Cloud Run

```bash
cd services/worker

# Build and push Docker image
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator/worker:latest \
  --project resume-gen-intent-dev \
  ../..

# Deploy to Cloud Run
gcloud run deploy resume-worker-dev \
  --image us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator/worker:latest \
  --platform managed \
  --region us-central1 \
  --project resume-gen-intent-dev \
  --allow-unauthenticated \
  --ingress all \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "GCP_PROJECT_ID=resume-gen-intent-dev,VERTEX_LOCATION=us-central1,GEMINI_MODEL_NAME=gemini-1.5-flash,FIREBASE_STORAGE_BUCKET=resume-gen-intent-dev.firebasestorage.app,APP_BASE_URL=https://resume-gen-intent-dev.web.app"
```

**Live Worker URL:** https://resume-worker-dev-96171099570.us-central1.run.app

**Note:** Worker uses multi-stage Docker build with system Chromium for Puppeteer PDF generation (requires 2Gi memory).

### Deploy Firestore/Storage Rules

```bash
firebase deploy --only firestore:rules,storage --project resume-gen-intent-dev
```

---

## Environment Variables

### Frontend (.env)

```bash
VITE_WORKER_URL=https://resume-worker-dev-96171099570.us-central1.run.app
```

### Worker (Cloud Run)

Set via `--set-env-vars` in deployment:

```bash
GCP_PROJECT_ID=resume-gen-intent-dev
VERTEX_LOCATION=us-central1
GEMINI_MODEL_NAME=gemini-1.5-flash
FIREBASE_STORAGE_BUCKET=resume-gen-intent-dev.firebasestorage.app
APP_BASE_URL=https://resume-gen-intent-dev.web.app
SLACK_OPERATION_HIRED_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

---

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Landing page |
| `/intake` | IntakePage | Candidate info form (step 1 of 3) |
| `/intake/:id/documents` | IntakeDocumentsPage | Document upload (step 2 of 3) |
| `/intake/:id/complete` | IntakeCompletePage | Status + resume download (step 3 of 3) |
| `/candidate/:id` | CandidatePage | Canonical shareable URL (redirects to `/intake/:id/complete`) |
| `/admin` | Redirect | Redirects to `/admin/candidates` |
| `/admin/candidates` | AdminCandidatesPage | List all candidates with filtering |
| `/admin/candidates/:id` | AdminCandidateDetailPage | Candidate detail view |

**Note:** Admin pages are publicly accessible in dev. Production should add Firebase Auth.

---

## Worker API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/internal/processCandidate` | POST | Process docs + generate resume + export PDF/DOCX |
| `/internal/candidateStatus/:id` | GET | Check processing status |
| `/internal/resumeDownload/:id/:format` | GET | Get signed download URL (format: pdf or docx) |

---

## Key Implementation Details

### PDF Generation (Puppeteer)

- Uses system Chromium (`/usr/bin/chromium`) in Docker
- Renders HTML template to PDF via headless browser
- Cloud Run memory requirement: 2Gi (for Chromium)
- Template location: `services/worker/src/services/resumeRender.ts`

### DOCX Generation (docx library)

- Native DOCX generation (no Word required)
- Creates structured document with sections
- Export location: `services/worker/src/services/exportResume.ts`

### Vertex AI Integration

- Model: Gemini 1.5 Flash
- Two-step generation:
  1. Extract structured `CandidateProfile` from military docs
  2. Generate civilian `GeneratedResume` from profile
- Service location: `services/worker/src/services/vertex.ts`

### Slack Notifications

- Channel: `#operation-hired`
- De-duplication via Firestore timestamps:
  - `candidates/{id}.firstSlackNotifiedAt` - New candidate intake
  - `resumes/{id}.resumeSlackNotifiedAt` - Resume ready
- Service location: `services/worker/src/services/slackNotifier.ts`

### Text Extraction

- Supports: PDF, DOCX, TXT
- Libraries: `pdf-parse` for PDFs
- Service location: `services/worker/src/services/textExtraction.ts`

---

## Shared Package (`@resume-generator/shared`)

All TypeScript types and Zod schemas shared between frontend and worker.

**Key exports:**
- `packages/shared/src/types/` - TypeScript interfaces
- `packages/shared/src/schemas/` - Zod validation schemas

**Building:** Must run `npm run build` in `packages/shared/` before using in other packages.

**Import examples:**
```typescript
import { CandidateProfile, GeneratedResume } from '@resume-generator/shared/types';
import { candidateSchema, resumeSchema } from '@resume-generator/shared/schemas';
```

---

## UI Theme & Branding

**Operation Hired brand colors:**
- Primary Gold: `#C59141`
- Dark Header/Footer: `#1a1a1a`
- Success Green: `#38a169`
- Error Red: `#e53e3e`
- Info Blue: `#3182ce`

**Fonts:** Roboto + Roboto Slab

**Components:**
- `frontend/src/components/Layout.tsx` - Branded nav + footer
- `frontend/src/index.css` - CSS variables for theme

---

## Testing

### Health Checks

```bash
# Worker health
curl https://resume-worker-dev-96171099570.us-central1.run.app/health

# Expected response:
# {"status":"healthy","service":"worker","timestamp":"...","version":"0.1.0"}
```

### Manual Testing Flow

1. Open https://resume-gen-intent-dev.web.app/intake
2. Fill candidate info, click Continue
3. Upload military document (DD-214, ERB, etc.)
4. Click "Generate My Resume"
5. Wait for processing (up to 30s for AI)
6. Download PDF/DOCX from complete page

---

## Common Development Tasks

### Add a new route to frontend

1. Create page component in `frontend/src/pages/`
2. Add route to `frontend/src/App.tsx`
3. Update Layout navigation if needed

### Modify AI prompts

Edit `services/worker/src/services/vertex.ts` - look for `generateCandidateProfile()` and `generateResume()` functions.

### Change resume template styling

Edit `services/worker/src/services/resumeRender.ts` - HTML template with inline CSS for PDF rendering.

### Add new Firestore collection

1. Add TypeScript types to `packages/shared/src/types/`
2. Add Zod schemas to `packages/shared/src/schemas/`
3. Update `firestore.rules` for security
4. Rebuild shared package: `cd packages/shared && npm run build`

### Debug Cloud Run service locally

```bash
cd services/worker

# Set environment variables
export GCP_PROJECT_ID=resume-gen-intent-dev
export VERTEX_LOCATION=us-central1
export GEMINI_MODEL_NAME=gemini-1.5-flash
export FIREBASE_STORAGE_BUCKET=resume-gen-intent-dev.firebasestorage.app

# Run in dev mode
npm run dev

# Test endpoint
curl http://localhost:8080/health
```

---

## Troubleshooting

### Frontend build fails with TypeScript errors

```bash
cd packages/shared && npm run build
cd frontend && npm run typecheck
```

### Worker fails to generate PDF

- Check Cloud Run logs: `gcloud run services logs read resume-worker-dev --project resume-gen-intent-dev`
- Verify memory allocation (must be 2Gi for Chromium)
- Check Chromium installation in Dockerfile

### Vertex AI quota errors

- Check quotas: https://console.cloud.google.com/iam-admin/quotas?project=resume-gen-intent-dev
- Gemini 1.5 Flash has generous free tier limits

### Storage upload fails

- Verify Firebase Storage rules allow writes to `candidates/{candidateId}/`
- Check service account permissions for Cloud Run service

---

## Production Deployment (Future)

**Changes needed for production:**

1. **Authentication:** Add Firebase Auth to admin routes
2. **Environment:** Create new GCP project `resume-gen-intent-prod`
3. **Domain:** Configure custom domain for Firebase Hosting
4. **Monitoring:** Set up Cloud Monitoring alerts
5. **Backup:** Enable Firestore backups
6. **Rate Limiting:** Add rate limiting to worker endpoints
7. **Secrets:** Use Secret Manager for Slack webhook URL

---

## Related Documentation

- Full project phases: See README.md sections on Phase 1.9, 2.0, 2.1, 2.2, 2.3, 2.4
- QA testing scripts: `000-docs/032-QA-TEST-ope-veteran-flow-test-script.md`
- Document filing standards: `000-docs/6767-DR-STND-document-filing-system-standard-v4.md`
