# Phase 1.7: Dev Deploy and E2E Verification

**Document ID**: 019-AA-AACR
**Phase**: 1.7
**Date**: 2025-12-08 00:06 CST (America/Chicago)
**Author**: Claude Opus 4.5

---

## Executive Summary

Phase 1.7 successfully deployed v0.1.7 to the dev environment with critical Docker fixes for shared package module resolution. Both Cloud Run services are healthy and passing guardrail checks. GitHub Actions billing issue blocked automated deployment; manual deployment via Docker/gcloud completed instead.

## What Changed

### Docker Fixes (Critical)
1. **Build Order**: Added shared package build step before service builds
2. **Zod Dependency**: Copied zod from shared/node_modules into container
3. **Permissions**: Added chmod to fix package.json read permissions for node user

### Deployments
- `resume-api-dev` → revision `resume-api-dev-00013-d6n` (image: api:v0.1.7)
- `resume-worker-dev` → revision `resume-worker-dev-00008-7wv` (image: worker:v0.1.7)

### Commits
- `021e292` - feat(phase-1.6): HITL reviewer console, image upload support, 96-test spine
- `298c3c4` - fix(docker): build shared package before service packages
- `06b8293` - fix(docker): add zod dependency and fix permissions for shared package

## Why

The original Docker images failed at runtime due to:
1. Shared package not built before service compilation
2. Missing zod runtime dependency (not in service node_modules)
3. package.json copied with root-only permissions (node user couldn't read exports map)

## Evidence & Traceability

| Item | Value |
|------|-------|
| Repo | intent-solutions-io/resume-generator |
| Branch | master |
| Commit | 06b82930e0142b065a7cb09160ec9962e28b0296 |
| PR | N/A (direct to master) |
| GH Actions | Blocked (billing issue) |

### Image Digests
- API: `sha256:00013bd8a3b860fba8931d7297c858090f8d3c636edcd11bacb9794d86c5bfa1`
- Worker: `sha256:b3649066b0f874ab63aecd67eedeb29adefe61774598f8a5257fb9d6e7e6f1d1`

## Verification

### Pre-flight (Local)
| Check | Result |
|-------|--------|
| terraform fmt | PASS |
| terraform validate (dev) | PASS |
| shared: typecheck/build/test (41 tests) | PASS |
| api: typecheck/build/test (29 tests) | PASS |
| worker: typecheck/build/test (26 tests) | PASS |
| frontend: typecheck/build | PASS |

### Deployment
| Check | Result |
|-------|--------|
| Docker build (api) | PASS |
| Docker build (worker) | PASS |
| Docker push (api:v0.1.7) | PASS |
| Docker push (worker:v0.1.7) | PASS |
| Cloud Run update (api) | PASS |
| Cloud Run update (worker) | PASS |

### Health Checks
```bash
$ curl https://resume-api-dev-7osdgbnfia-uc.a.run.app/health
{"status":"healthy","timestamp":"2025-12-08T06:05:18.496Z","version":"0.1.0"}

# Worker health (from Cloud Run logs):
STARTUP HTTP probe succeeded after 1 attempt for container "worker-1" on port 8080 path "/health"
```

### NO-SPRAWL CHECK
| Resource | Expected | Actual | Status |
|----------|----------|--------|--------|
| Cloud Run services | 2 | 2 | PASS |
| Data buckets | 2 | 2 | PASS |
| Cloud Tasks queues | 2 | 2 | PASS |

## E2E Verification Status

**API endpoints require App Check authentication** configured in the frontend. Full E2E testing (case creation, upload, processing) requires:
1. Frontend deployed with App Check configured
2. Browser-based testing via the frontend UI

The API health endpoint (no auth) confirms the service is running and can process requests.

## Risks & Gotchas

1. **GitHub Actions Billing**: Organization billing issue blocks automated deployments
2. **App Check**: API routes under `/v1/*` require Firebase App Check tokens
3. **Worker Access**: Worker is internal-only (correct for Cloud Tasks)

## Rollback Plan

```bash
# Rollback to previous revisions
gcloud run services update-traffic resume-api-dev \
  --to-revisions=resume-api-dev-00012-42k=100 \
  --region=us-central1

gcloud run services update-traffic resume-worker-dev \
  --to-revisions=resume-worker-dev-00007-s5j=100 \
  --region=us-central1
```

## Known Limitations

1. **OCR not implemented**: Image files marked as `needs_ocr`, not processed
2. **Reviewer console no auth**: /review endpoints publicly accessible (dev only)
3. **Frontend not deployed**: Firebase Hosting update pending

## Next Steps (Phase 2)

1. Deploy frontend to Firebase Hosting (dev)
2. Full E2E smoke test via browser
3. OCR/Document AI integration for image processing
4. Reviewer console authentication strategy
5. Resolve GitHub Actions billing for automated CI/CD

---

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io

---

**Phase 1.7 Complete**: 2025-12-08 00:06 CST (America/Chicago)
