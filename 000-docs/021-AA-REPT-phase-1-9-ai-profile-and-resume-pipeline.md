# Phase 1.9: AI Profile & Resume Pipeline (Vertex AI)

**Document ID**: 021-AA-REPT
**Phase**: 1.9
**Date**: 2025-12-08 20:15 CST (America/Chicago)
**Author**: Claude Opus 4.5

---

## Executive Summary

Phase 1.9 implements the AI-powered resume generation pipeline using Vertex AI (Gemini). Given a `candidateId` with uploaded documents from Phase 1.8, this phase:

1. Extracts text from uploaded military documents
2. Calls Gemini to produce a structured `CandidateProfile` and `GeneratedResume`
3. Persists results to Firestore and updates candidate status to `resume_ready`

## Scope

**In Scope:**
- Vertex AI (Gemini) client setup
- Text extraction from Cloud Storage files
- `processCandidate` orchestrator Cloud Function
- New Firestore collections: `candidateProfiles`, `resumes`
- Status transitions: `docs_uploaded` → `processing` → `resume_ready`
- Minimal frontend status indicator

**Out of Scope:**
- PDF/DOCX export (Phase 2)
- Advanced document parsing (OCR, complex PDFs)
- Admin review dashboard
- Email notifications

## Plan

1. Create Vertex AI client module in worker service
2. Implement text extraction from Storage
3. Build processCandidate orchestrator function
4. Add new Firestore collections and security rules
5. Wire minimal frontend status indicator
6. Test end-to-end pipeline
7. Update documentation

## Changes Made

| File | Change |
|------|--------|
| `services/worker/src/services/vertex.ts` | Vertex AI Gemini client with SYSTEM_PROMPT |
| `services/worker/src/services/textExtraction.ts` | Document text extraction (PDF, TXT, basic DOCX) |
| `services/worker/src/handlers/processCandidateHandler.ts` | Orchestrator + status endpoint |
| `services/worker/src/types/candidate.ts` | TypeScript types for all schemas |
| `services/worker/src/index.ts` | Registered new endpoints |
| `firestore.rules` | Rules for candidateProfiles + resumes |
| `frontend/src/lib/firestore.ts` | Real-time subscription support |
| `frontend/src/pages/IntakeCompletePage.tsx` | Status indicator + generate button |

## Firestore Schema (New Collections)

### candidateProfiles/{candidateId}
```typescript
type ServiceRole = {
  rawTitle: string;
  standardizedTitle?: string;
  unit?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  responsibilitiesRaw: string[];
  achievementsRaw: string[];
};

type CandidateProfile = {
  candidateId: string;
  name?: string;
  email?: string;
  branch?: string;
  rank?: string;
  mosCode?: string;
  serviceStartDate?: string;
  serviceEndDate?: string;
  clearance?: string;
  roles: ServiceRole[];
  education?: string[];
  certifications?: string[];
  awards?: string[];
  skillsRaw?: string[];
  createdAt: Timestamp;
  modelName: string;
  modelVersion: string;
};
```

### resumes/{candidateId}
```typescript
type ResumeExperience = {
  title: string;
  company: string;
  location?: string;
  dates?: string;
  bullets: string[];
};

type GeneratedResume = {
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education?: string;
  certifications?: string[];
  createdAt: Timestamp;
  modelName: string;
  modelVersion: string;
};
```

## Environment Variables

```
GCP_PROJECT_ID=resume-gen-intent-dev
VERTEX_LOCATION=us-central1
GEMINI_MODEL_NAME=gemini-1.5-flash
FIREBASE_STORAGE_BUCKET=resume-gen-intent-dev.firebasestorage.app
```

## Data Flow Overview

```
1. User clicks "Generate My Resume" on IntakeCompletePage
   │
2. Frontend calls POST /internal/processCandidate { candidateId }
   │
3. processCandidateHandler:
   ├── Validates candidateId
   ├── Updates status: "processing"
   ├── Calls extractDocumentTexts(candidateId)
   │   └── Fetches files from Cloud Storage (candidates/{id}/*)
   │   └── Extracts text from PDF/TXT/DOCX
   ├── Calls generateProfileAndResume(input)
   │   └── Builds SYSTEM_PROMPT + user prompt
   │   └── Calls Vertex AI Gemini 1.5 Flash
   │   └── Parses JSON response
   ├── Writes CandidateProfile → candidateProfiles/{candidateId}
   ├── Writes GeneratedResume → resumes/{candidateId}
   └── Updates status: "resume_ready"
   │
4. Frontend receives real-time status via onSnapshot
   └── Updates UI to show "Resume Ready!"
```

## Risks & Unknowns

1. **Text extraction limitations**: Basic extraction only; complex PDFs may not parse well
2. **Token limits**: Large documents may exceed Gemini context window
3. **Cost**: Vertex AI API calls have associated costs
4. **Parsing failures**: Malformed JSON from Gemini needs retry logic

## Test Results

| Test | Result | Notes |
|------|--------|-------|
| TypeScript build (worker) | PASS | All services compile cleanly |
| TypeScript build (api) | PASS | No errors |
| TypeScript build (frontend) | PASS | Status indicator compiles |
| Vertex AI client init | PENDING | Requires deployment |
| Text extraction | PENDING | Requires deployment |
| Profile generation | PENDING | Requires deployment |
| Resume generation | PENDING | Requires deployment |
| Status transitions | PENDING | Requires deployment |

## API Endpoints Added

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/internal/processCandidate` | POST | Process candidate docs and generate resume |
| `/internal/candidateStatus/:candidateId` | GET | Check processing status |

## Next Actions

- Phase 2.0: PDF/DOCX export
- Add admin review dashboard
- Implement retry queue for failed generations
- Add document OCR support

---

intent solutions io - confidential IP
Contact: jeremy@intentsolutions.io

---

**Phase 1.9 Started**: 2025-12-08 20:15 CST (America/Chicago)
**Phase 1.9 Code Complete**: 2025-12-08 21:30 CST (America/Chicago)
**Status**: Builds pass. Ready for deployment and E2E testing.
