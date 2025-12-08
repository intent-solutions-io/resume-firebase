# Phase 1 After Action Report - Public MVP Spine

**Document Type:** After Action Report (AA-AACR)
**Project:** Resume Generator
**Phase:** 1 - MVP Spine
**Date:** 2025-12-07 19:45 CST (America/Chicago)
**Status:** Code Complete / Verification Pending

---

## Evidence & Traceability

| Item | Value |
|------|-------|
| Repo | `/home/jeremy/000-projects/resume/generator` |
| Branch | `master` |
| Latest Commit | `481cd8f` (Enforce strict flat 000-docs rule) |
| PR(s) | None (direct commits) |
| Deployment Status | **Not Deployed** |

---

## Executive Summary

Phase 1 delivered the code for the public MVP spine of the Resume Generator. The implementation includes a React frontend scaffold, Cloud Run API and Worker service scaffolds, and shared TypeScript packages. The no-login model uses case IDs as access tokens with abuse prevention via App Check and rate limiting.

**Critical Note:** Build verification and tests have NOT been executed due to missing `node_modules`. Deployment has NOT occurred. This AAR documents code artifacts only.

---

## Objectives Status

| Objective | Status | Evidence |
|-----------|--------|----------|
| Build Firebase Hosting frontend | Code Complete | `frontend/src/` (10 .ts/.tsx files) |
| Build Cloud Run API service | Code Complete | `services/api/src/` (9 .ts files) |
| Build Cloud Run Worker service | Code Complete | `services/worker/src/` (8 .ts files) |
| Create shared packages | Code Complete | `packages/shared/src/` (3 .ts files) |
| Implement abuse controls | Code Complete | See Abuse Controls section |

---

## How to Verify (Executed)

### Terraform

| Command | Result |
|---------|--------|
| `terraform fmt -recursive -check` | **PASS** (exit code 0) |
| `terraform init -backend=false` (dev) | **PASS** |
| `terraform validate` (dev) | **PASS** ("Success! The configuration is valid.") |

### Frontend

| Command | Result |
|---------|--------|
| `npm run typecheck` | **NOT EXECUTED** - Dependencies not installed |
| `npm run build` | **NOT EXECUTED** - Dependencies not installed |
| `npm test` | **NOT EXECUTED** - Dependencies not installed |

### API Service

| Command | Result |
|---------|--------|
| `npm run typecheck` | **NOT EXECUTED** - Dependencies not installed |
| `npm run build` | **NOT EXECUTED** - Dependencies not installed |
| `npm test` | **NOT EXECUTED** - Dependencies not installed |

### Worker Service

| Command | Result |
|---------|--------|
| `npm run typecheck` | **NOT EXECUTED** - Dependencies not installed |
| `npm run build` | **NOT EXECUTED** - Dependencies not installed |
| `npm test` | **NOT EXECUTED** - Dependencies not installed |

### Shared Package

| Command | Result |
|---------|--------|
| `npm run typecheck` | **NOT EXECUTED** - Dependencies not installed (`tsc: not found`) |
| `npm run build` | **NOT EXECUTED** - Dependencies not installed |
| `npm test` | **NOT EXECUTED** - Dependencies not installed |

**Next Action Required:** Run `npm install` in each package directory, then re-execute all verification commands.

---

## Abuse Controls — Acceptance Criteria

### App Check

| Criteria | Implementation | File Reference |
|----------|----------------|----------------|
| Enforced endpoints | All `/v1/*` routes | `services/api/src/index.ts:17` |
| Failure behavior | HTTP 401 with `{"error":"Unauthorized","message":"App Check token required"}` | `services/api/src/middleware/appCheck.ts:21-25` |
| Dev bypass | Allowed when `ENVIRONMENT=dev` AND `APP_CHECK_DEBUG=true` | `services/api/src/middleware/appCheck.ts:12-16` |

### Rate Limiting

| Limiter | Window | Max Requests | Scope | File Reference |
|---------|--------|--------------|-------|----------------|
| Global | 15 min | 100 per IP | Per instance (in-memory) | `rateLimiter.ts:12-13` |
| Create case | 1 hour | 10 per IP | Per instance (in-memory) | `rateLimiter.ts:27-28` |
| Upload URLs | 15 min | 50 per IP | Per instance (in-memory) | `rateLimiter.ts:40-41` |

**Limitation:** Rate limits use in-memory store and are NOT shared across Cloud Run instances. Production requires Redis or equivalent.

### File Limits

| Limit | Value | Enforcement Location |
|-------|-------|---------------------|
| Max file size | 10 MB (10,485,760 bytes) | `packages/shared/src/schemas/index.ts:121` |
| Max files per case | 10 | `packages/shared/src/schemas/index.ts:122` |
| Allowed extensions | `.pdf`, `.doc`, `.docx`, `.txt` | `packages/shared/src/schemas/index.ts:120` |
| GCS enforcement | `x-goog-content-length-range: 0,10485760` | `services/api/src/services/storage.ts:43-45` |

### Case ID Access Model

| Aspect | Current State | Risk | Mitigation |
|--------|---------------|------|------------|
| Access token | UUID v4 (122 bits entropy) | Unguessable via brute force | Acceptable for MVP |
| Leakage risk | Anyone with case ID has full access | Medium | User education; short retention |
| Enumeration | Rate limiting prevents bulk guessing | Low | Rate limits in place |
| Sharing | Intentional sharing enabled | By design | N/A |

### Case Expiration / Retention

| Data Type | Retention | Enforcement | File Reference |
|-----------|-----------|-------------|----------------|
| Raw uploads (GCS) | 90 days | GCS lifecycle rule | `infra/terraform/modules/storage/main.tf:37-42` |
| Artifacts (GCS) | 365 days | GCS lifecycle rule | `infra/terraform/modules/storage/main.tf:76-81` |
| Case records (Firestore) | **Indefinite** | **NOT IMPLEMENTED** | N/A |

**Gap:** Firestore case records have no automatic expiration. Requires TTL policy or scheduled cleanup function in Phase 2.

---

## Data Model Snapshot

### Firestore Collections

| Collection | Key Fields | Status Enum |
|------------|------------|-------------|
| `cases` | `id`, `name`, `email`, `targetRole`, `status`, `currentStep`, `progress`, `createdAt`, `updatedAt` | `pending` \| `processing` \| `completed` \| `failed` |
| `case_documents` | `id`, `caseId`, `fileName`, `status`, `uploadedAt`, `processedAt` | `pending` \| `uploaded` \| `processed` \| `failed` |
| `case_artifacts` | `id`, `caseId`, `name`, `fileName`, `type`, `size`, `createdAt` | N/A |
| `case_events` | `id`, `caseId`, `type`, `status`, `timestamp`, `details` | N/A |

**Source:** `services/api/src/services/firestore.ts:36-38`, `packages/shared/src/types/index.ts:7-10`

---

## Storage Layout Snapshot

### Raw Uploads Bucket

```
gs://{project}-raw-uploads-{env}/
└── cases/{caseId}/raw/{documentId}/{fileName}
```

| Property | Value |
|----------|-------|
| Access | Private (signed URLs only) |
| Upload URL TTL | 15 minutes |
| Lifecycle | Delete after 90 days |

### Artifacts Bucket

```
gs://{project}-artifacts-{env}/
└── cases/{caseId}/artifacts/{artifactId}/{fileName}
```

| Property | Value |
|----------|-------|
| Access | Private (signed URLs only) |
| Download URL TTL | 1 hour |
| Lifecycle | Delete after 365 days |

**Source:** `services/api/src/services/storage.ts:29,54`, `infra/terraform/modules/storage/main.tf:37-42,76-81`

---

## Deliverables

### File Inventory (Verified)

| Component | Path | File Count |
|-----------|------|------------|
| Frontend | `frontend/src/` | 10 |
| API Service | `services/api/src/` | 9 |
| Worker Service | `services/worker/src/` | 8 |
| Shared Package | `packages/shared/src/` | 3 |
| **Total** | | **30** |

### Key Files

| Component | File | Purpose |
|-----------|------|---------|
| Frontend | `pages/CreateCasePage.tsx` | Case creation form |
| Frontend | `pages/UploadPage.tsx` | Multi-file upload |
| Frontend | `pages/StatusPage.tsx` | Polling status display |
| Frontend | `services/api.ts` | API client |
| API | `routes/cases.ts` | Case CRUD endpoints |
| API | `middleware/appCheck.ts` | App Check enforcement |
| API | `middleware/rateLimiter.ts` | Rate limiting |
| API | `services/storage.ts` | Signed URL generation |
| Worker | `handlers/processCase.ts` | Main processing pipeline |
| Worker | `services/gemini.ts` | Vertex AI integration |
| Worker | `services/extraction.ts` | Text extraction |
| Shared | `types/index.ts` | Type definitions |
| Shared | `schemas/index.ts` | Zod validators |

---

## Technical Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Case ID as access token | No auth infrastructure needed | Anyone with link has access |
| App Check (strict mode) | Prevents automated abuse | Requires frontend integration |
| In-memory rate limiting | Simple for MVP | Not shared across instances |
| pdf-parse for extraction | No external dependencies | Limited DOCX support |
| Gemini 1.5 Flash | Fast, cost-effective | May need Pro for complex docs |

---

## Rollback Plan (Phase 1)

### If deployment fails

1. **Cloud Run:** `gcloud run services delete resume-api-{env} resume-worker-{env}`
2. **Firestore:** Delete collections via console (no data yet)
3. **Storage:** Delete buckets via console (no data yet)
4. **Terraform:** `terraform destroy` from `infra/terraform/envs/{env}`

### If code issues found post-deployment

1. Revert commit: `git revert HEAD`
2. Re-deploy previous version via CI/CD
3. Document issue in incident report

### Impact Assessment

| Component | Rollback Impact |
|-----------|-----------------|
| Frontend | Zero (no users yet) |
| API | Zero (no users yet) |
| Worker | Zero (no users yet) |
| Data | None (no production data) |

---

## Known Limitations

| Limitation | Impact | Planned Fix |
|------------|--------|-------------|
| DOCX parsing is basic | Poor text extraction | Phase 2: Add mammoth.js |
| No PDF generation | JSON only output | Phase 2: Add pdf-lib |
| In-memory rate limits | Not shared across instances | Phase 2: Redis store |
| No Firestore TTL | Case records never expire | Phase 2: TTL policy |
| No email notifications | Users must poll | Phase 2: SendGrid integration |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation | Status |
|------|------------|--------|------------|--------|
| Abuse without login | Medium | High | App Check + rate limiting | Implemented |
| Case ID guessing | Low | High | UUID v4 (122 bits) | Implemented |
| Large file uploads | Medium | Medium | 10MB limit, signed URLs | Implemented |
| LLM hallucination | Medium | Medium | Temperature 0.3 | Implemented |
| Rate limit bypass (multi-instance) | Medium | Medium | Redis in Phase 2 | Planned |

---

## Metrics

| Metric | Value | Source |
|--------|-------|--------|
| Frontend files | 10 | `find frontend/src -name "*.ts*" \| wc -l` |
| API service files | 9 | `find services/api/src -name "*.ts" \| wc -l` |
| Worker service files | 8 | `find services/worker/src -name "*.ts" \| wc -l` |
| Shared package files | 3 | `find packages/shared/src -name "*.ts" \| wc -l` |
| Total TypeScript files | 30 | Sum of above |
| API endpoints | 5 | Manual count from routes/cases.ts |
| Worker endpoints | 2 | Manual count from handlers/ |

---

## Next Steps

### Immediate (Before Deployment)

1. Run `npm install` in all packages
2. Execute all verification commands
3. Fix any typecheck or test failures
4. Update this AAR with pass/fail results

### Pre-Production

1. Configure App Check in Firebase Console
2. Set GitHub Secrets for WIF
3. Run Terraform apply
4. Deploy via CI/CD
5. Execute end-to-end test

---

**Phase Status:** Code Complete / Verification Pending

---

**Generated:** 2025-12-07 19:45 CST (America/Chicago)
**Author:** Claude Code (Opus)
**Evidence Gathered:** 2025-12-07 19:34 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
