# Phase 2.0: Resume Export (PDF/DOCX) + Download UX

**Document ID**: 022-AA-REPT
**Phase**: 2.0
**Date**: 2025-12-08 22:00 CST (America/Chicago)
**Author**: Claude Opus 4.5
**Status**: Code Complete

---

## Executive Summary

Phase 2.0 extends the AI resume pipeline (Phase 1.9) with export capabilities. Given a `candidateId` with a generated resume, this phase:

1. Renders `GeneratedResume` JSON into ATS-friendly HTML
2. Exports HTML to PDF and DOCX formats
3. Stores exports in Cloud Storage with structured paths
4. Provides frontend download UX for candidates

## Scope

**In Scope:**
- Resume HTML renderer (JSON → HTML)
- PDF generation using puppeteer/html-pdf
- DOCX generation using `docx` npm package
- Storage paths helper for export locations
- Export service integration with processCandidate
- Frontend download buttons for PDF/DOCX
- Firestore schema updates (pdfPath, docxPath, exportGeneratedAt)

**Out of Scope:**
- Admin dashboard
- OCR improvements
- Email notifications
- Custom styling/theming

## Plan

1. [x] Create Phase 2.0 AAR document
2. [ ] Create storage paths helper module
3. [ ] Create resume HTML renderer module
4. [ ] Add PDF/DOCX dependencies to worker
5. [ ] Create export service (PDF + DOCX generation)
6. [ ] Hook export into processCandidate pipeline
7. [ ] Update frontend download UX
8. [ ] Update README with Phase 2.0 section
9. [ ] Test end-to-end flow
10. [ ] Update AAR with results

## Storage Path Convention

```
candidates/{candidateId}/exports/{timestamp}-resume.pdf
candidates/{candidateId}/exports/{timestamp}-resume.docx
```

Helper module: `services/worker/src/services/storagePaths.ts`

## Changes Made

| File | Change |
|------|--------|
| `000-docs/022-AA-REPT-phase-2-0-resume-export-and-download-ux.md` | This AAR |
| `services/worker/src/services/storagePaths.ts` | Export path helper |
| `services/worker/src/services/resumeRender.ts` | HTML renderer |
| `services/worker/src/services/exportResume.ts` | PDF/DOCX export service |
| `services/worker/src/handlers/processCandidateHandler.ts` | Hook export after resume generation |
| `frontend/src/pages/IntakeCompletePage.tsx` | Download UX |
| `README.md` | Phase 2.0 documentation |

## Firestore Schema Updates

### resumes/{candidateId} (additions)

```typescript
{
  // ... existing GeneratedResume fields ...
  pdfPath?: string;           // Storage path to PDF
  docxPath?: string;          // Storage path to DOCX
  exportGeneratedAt?: Timestamp;
  exportError?: string;       // Error message if export failed
}
```

## Library Choices

| Format | Library | Rationale |
|--------|---------|-----------|
| PDF | `puppeteer` | Full HTML/CSS rendering, widely used in Cloud Run |
| DOCX | `docx` | Native DOCX generation, no Word required |

## Risks & Unknowns

1. **Puppeteer in Cloud Run**: May need additional Chrome dependencies
2. **Memory usage**: PDF rendering can be memory-intensive
3. **Cold start time**: Puppeteer adds startup latency

## Test Results

| Test | Result | Notes |
|------|--------|-------|
| TypeScript build (worker) | PASS | All Phase 2.0 code compiles |
| TypeScript build (frontend) | PASS | Download UX compiles |
| Storage paths helper | PASS | getResumeExportPaths works |
| HTML render | PASS | renderResumeToHtml generates valid HTML |
| PDF generation | PENDING | Requires deployment with Chrome |
| DOCX generation | PENDING | Requires deployment |
| Frontend download | PENDING | Requires deployed worker |

## Next Actions

- Phase 2.1: Email notifications when resume ready
- Phase 2.2: Custom resume templates/themes
- Phase 2.3: Admin review dashboard

---

intent solutions io - confidential IP
Contact: jeremy@intentsolutions.io

---

**Phase 2.0 Started**: 2025-12-08 22:00 CST (America/Chicago)
**Phase 2.0 Code Complete**: 2025-12-08 22:45 CST (America/Chicago)
**Deployment Status**: Ready - requires Puppeteer Chrome dependencies in Docker
