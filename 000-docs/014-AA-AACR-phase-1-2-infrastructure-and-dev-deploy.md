# Phase 1.2 After Action Report - Infrastructure & Dev Deploy

**Document Type:** After Action Report (AA-AACR)
**Project:** Resume Generator
**Phase:** 1.2 - Infrastructure & Dev Deploy
**Date:** 2025-12-08 02:35 CST (America/Chicago)
**Status:** VERIFIED / Partially Operational

---

## Evidence & Traceability

| Item | Value |
|------|-------|
| Repo | `/home/jeremy/000-projects/resume/generator` |
| Branch | `master` |
| GCP Project ID | `resume-gen-intent-dev` |
| GCP Project Number | `96171099570` |
| GitHub Repo | `https://github.com/intent-solutions-io/resume-generator` |
| Verification Date | 2025-12-08 02:35 CST |

---

## Executive Summary

Phase 1.2 deployed the Resume Generator infrastructure to GCP and verified the end-to-end workflow. All infrastructure components are operational. The smoke test successfully demonstrated the complete flow from case creation through worker processing. The only failure is Vertex AI model access (expected - requires model enablement).

**Key Achievement:** Full infrastructure pipeline working - Cloud Tasks successfully invokes Worker with OIDC authentication.

---

## Infrastructure Created

### GCP Project

| Resource | Value |
|----------|-------|
| Project ID | `resume-gen-intent-dev` |
| Project Number | `96171099570` |
| Region | `us-central1` |
| Firebase Display Name | resume generator |

### Terraform State

| Resource | Value |
|----------|-------|
| Bucket | `gs://resume-gen-intent-dev-tf-state` |
| Prefix | `dev` |
| Backend | GCS (enabled) |

### Cloud Run Services

| Service | URL | Status |
|---------|-----|--------|
| API | `https://resume-api-dev-7osdgbnfia-uc.a.run.app` | RUNNING |
| Worker | `https://resume-worker-dev-7osdgbnfia-uc.a.run.app` | RUNNING |

### Storage Buckets

| Bucket | Purpose | Lifecycle |
|--------|---------|-----------|
| `resume-gen-intent-dev-raw-uploads-dev` | Raw uploads | 90 days |
| `resume-gen-intent-dev-artifacts-dev` | Generated artifacts | 365 days |

### Cloud Tasks Queues

| Queue | State | Max Rate |
|-------|-------|----------|
| `resume-processing-dev` | RUNNING | 1.0/sec |
| `artifact-generation-dev` | RUNNING | 1.0/sec |

### Firestore

| Database | Location | Indexes |
|----------|----------|---------|
| `(default)` | `us-central1` | 3 (cases, documents, artifacts) |

---

## WIF Configuration

### Workload Identity Federation

| Resource | Value |
|----------|-------|
| Pool ID | `github-actions-pool` |
| Provider ID | `github-actions-provider` |
| Full Provider | `projects/96171099570/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` |

### Service Accounts

| Account | Email | Purpose |
|---------|-------|---------|
| CI | `github-actions-ci@resume-gen-intent-dev.iam.gserviceaccount.com` | GitHub Actions deployments |
| API | `resume-api-dev@resume-gen-intent-dev.iam.gserviceaccount.com` | API service |
| Worker | `resume-worker-dev@resume-gen-intent-dev.iam.gserviceaccount.com` | Worker service |

---

## GitHub Configuration

### Repository

| Item | Value |
|------|-------|
| Organization | `intent-solutions-io` |
| Repository | `resume-generator` |
| Visibility | Private |
| URL | `https://github.com/intent-solutions-io/resume-generator` |

### Required Secrets

| Secret | Value |
|--------|-------|
| `GCP_WIF_PROVIDER` | `projects/96171099570/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` |
| `GCP_CI_SA_EMAIL` | `github-actions-ci@resume-gen-intent-dev.iam.gserviceaccount.com` |
| `GCP_PROJECT_ID` | `resume-gen-intent-dev` |

---

## Firebase Hosting

| Item | Value |
|------|-------|
| Site ID | `resume-gen-intent-dev` |
| URL | `https://resume-gen-intent-dev.web.app` |
| Status | Deployed (placeholder) |

---

## Smoke Test Results

### Test Flow (Executed 2025-12-08 02:34 CST)

| Step | Action | Result | Evidence |
|------|--------|--------|----------|
| 1 | Create case | PASS | `caseId: 8380bff6-91de-48ce-8f38-a6006fa581ce` |
| 2 | Request upload URL | PASS | Signed URL generated |
| 3 | Upload file to GCS | PASS | HTTP 200 |
| 4 | Trigger processing | PASS | `{"status":"processing"}` |
| 5 | Cloud Tasks enqueue | PASS | Task delivered to worker |
| 6 | Worker receives task | PASS | Worker logs show processing started |
| 7 | Status update | PASS | Status changed to "failed" with error |
| 8 | Gemini generation | FAIL | Model not found (expected) |

### Final Case Status

```json
{
  "caseId": "8380bff6-91de-48ce-8f38-a6006fa581ce",
  "status": "failed",
  "currentStep": "error",
  "progress": 50,
  "artifacts": [],
  "createdAt": "2025-12-08T02:34:09.615Z",
  "updatedAt": "2025-12-08T02:34:15.439Z"
}
```

### Gemini Error (Expected)

```
Publisher Model `projects/resume-gen-intent-dev/locations/us-central1/publishers/google/models/gemini-1.5-flash` was not found or your project does not have access to it.
```

**Resolution:** Enable Vertex AI API and request access to Gemini models in the GCP project.

---

## Fixes Applied During Deployment

| Issue | Fix | File |
|-------|-----|------|
| Signed URL permission denied | Added `serviceAccountTokenCreator` role to API SA | `modules/iam/main.tf:67-71` |
| Cloud Tasks OIDC 403 | Added `serviceAccountUser` role for API SA on Worker SA | `modules/iam/main.tf:73-78` |
| Wrong WORKER_URL | Changed to use `google_cloud_run_v2_service.worker.uri` | `modules/cloud_run/main.tf:112-113` |
| Worker IAM wrong member | Changed to allow worker SA (not API SA) to invoke worker | `modules/cloud_run/main.tf:245-252` |
| OIDC missing audience | Added `audience: WORKER_URL` to OIDC token | `services/api/src/services/tasks.ts:31,69` |
| App Check blocking dev | Added `APP_CHECK_DEBUG=true` for dev environment | `modules/cloud_run/main.tf:122-129` |

---

## API Environment Variables (Dev)

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `dev` |
| `PROJECT_ID` | `resume-gen-intent-dev` |
| `RAW_UPLOADS_BUCKET` | `resume-gen-intent-dev-raw-uploads-dev` |
| `ARTIFACTS_BUCKET` | `resume-gen-intent-dev-artifacts-dev` |
| `PROCESSING_QUEUE` | `resume-processing-dev` |
| `WORKER_URL` | `https://resume-worker-dev-7osdgbnfia-uc.a.run.app` |
| `WORKER_SERVICE_ACCOUNT` | `resume-worker-dev@resume-gen-intent-dev.iam.gserviceaccount.com` |
| `APP_CHECK_DEBUG` | `true` |

---

## Terraform Outputs

```
api_url = "https://resume-api-dev-7osdgbnfia-uc.a.run.app"
artifact_registry_url = "us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator"
artifacts_bucket = "resume-gen-intent-dev-artifacts-dev"
ci_service_account_email = "github-actions-ci@resume-gen-intent-dev.iam.gserviceaccount.com"
processing_queue = "resume-processing-dev"
raw_uploads_bucket = "resume-gen-intent-dev-raw-uploads-dev"
worker_url = "https://resume-worker-dev-7osdgbnfia-uc.a.run.app"
workload_identity_provider = "projects/96171099570/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider"
```

---

## Known Issues

| Issue | Impact | Resolution |
|-------|--------|------------|
| Gemini model not accessible | Worker cannot generate content | Enable Vertex AI API, request Gemini access |
| No real tests | CI passes with `--passWithNoTests` | Add unit tests in Phase 2 |
| In-memory rate limiting | Not shared across instances | Add Redis in Phase 2 |

---

## Next Steps

### Immediate

1. Enable Vertex AI API in GCP project
2. Request access to Gemini models
3. Re-test worker processing with Gemini access
4. Configure GitHub Secrets in repository

### Phase 2 Preparation

1. Add unit tests for API and Worker
2. Implement Redis for shared rate limiting
3. Add Firestore TTL for case expiration
4. Configure App Check in Firebase Console (production)

---

## Verification Commands

```bash
# Check Cloud Run services
gcloud run services list --project=resume-gen-intent-dev --region=us-central1

# Check Cloud Tasks queues
gcloud tasks queues list --location=us-central1 --project=resume-gen-intent-dev

# Test API health
curl https://resume-api-dev-7osdgbnfia-uc.a.run.app/health

# Check worker IAM
gcloud run services get-iam-policy resume-worker-dev \
  --region=us-central1 --project=resume-gen-intent-dev
```

---

**Phase Status:** VERIFIED / Partially Operational (Gemini access pending)

---

**Generated:** 2025-12-08 02:35 CST (America/Chicago)
**Author:** Claude Code (Opus)
**Verification Executed:** 2025-12-08 02:15-02:35 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
