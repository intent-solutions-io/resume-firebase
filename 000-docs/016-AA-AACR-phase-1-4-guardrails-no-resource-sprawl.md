# Phase 1.4 After Action Report — Guardrails: No Resource Sprawl

**Document Type:** After Action Report (AA-AACR)
**Project:** Resume Generator
**Phase:** 1.4 — Guardrails Implementation
**Date:** 2025-12-08 03:55 CST (America/Chicago)
**Status:** VERIFIED / GUARDRAILS ACTIVE

---

## Evidence & Traceability

| Item | Value |
|------|-------|
| Repo | `/home/jeremy/000-projects/resume/generator` |
| Branch | `master` |
| GCP Project ID | `resume-gen-intent-dev` |
| GCP Project Number | `96171099570` |
| Verification Date | 2025-12-08 03:55 CST |

---

## Executive Summary

Phase 1.4 implemented strict guardrails to prevent resource sprawl in Terraform and CI/CD. These guardrails enforce the resource manifest and will fail builds if unexpected resources are detected.

**Key Achievement:** CI pipeline now includes NO-SPRAWL CHECK that verifies Cloud Run, Storage, and Cloud Tasks resource counts match the manifest exactly.

---

## Resource Manifest (Source of Truth)

| Resource Type | Name | Count |
|--------------|------|-------|
| **GCP Project** | `resume-gen-intent-dev` | 1 |
| **Region** | `us-central1` | 1 |
| **Cloud Run Services** | `resume-api-dev`, `resume-worker-dev` | 2 |
| **Storage Buckets** | `resume-gen-intent-dev-raw-uploads-dev`, `resume-gen-intent-dev-artifacts-dev` | 2 |
| **Cloud Tasks Queues** | `resume-processing-dev`, `artifact-generation-dev` | 2 |
| **Artifact Registry** | `us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator` | 1 |

---

## Guardrails Implemented

### Terraform Guardrails

**File:** `infra/terraform/envs/dev/guardrails.tf`

| Guardrail | Enforcement |
|-----------|-------------|
| Environment lock | Only `dev` allowed; others fail validation |
| Project ID lock | Must be `resume-gen-intent-dev` |
| Region lock | Must be `us-central1` |

**Variable Validations Added:**

```hcl
# project_id validation
validation {
  condition     = var.project_id == "resume-gen-intent-dev"
  error_message = "GUARDRAIL: project_id must be 'resume-gen-intent-dev'"
}

# region validation
validation {
  condition     = var.region == "us-central1"
  error_message = "GUARDRAIL: region must be 'us-central1'"
}
```

### CI Guardrails

**File:** `.github/workflows/deploy.yml`

| Guardrail | Enforcement |
|-----------|-------------|
| Environment lock | Workflow dispatch locked to `dev` only (prod commented) |
| NO-SPRAWL CHECK job | Verifies resource counts after deployment |
| Frontend depends on check | `deploy-frontend` requires `no-sprawl-check` to pass |

**NO-SPRAWL CHECK Verifications:**

1. **Cloud Run Services:** Expects exactly 2 (`resume-api-dev`, `resume-worker-dev`)
2. **Storage Buckets:** Expects exactly 2 data buckets matching pattern
3. **Cloud Tasks Queues:** Expects exactly 2 (`resume-processing-dev`, `artifact-generation-dev`)

---

## Changes Made

### Files Created

| File | Purpose |
|------|---------|
| `infra/terraform/envs/dev/guardrails.tf` | Resource manifest and validation rules |

### Files Modified

| File | Change |
|------|--------|
| `infra/terraform/envs/dev/main.tf` | Added variable validation for project_id and region |
| `.github/workflows/deploy.yml` | Added NO-SPRAWL CHECK job, locked to dev environment |

---

## Verification Results

### Terraform Validation

```bash
$ terraform validate
Success! The configuration is valid.
```

### NO-SPRAWL CHECK (Local Execution)

```
Cloud Run Services:
- resume-api-dev
- resume-worker-dev
Count: 2 ✓

Storage Buckets:
- gs://resume-gen-intent-dev-artifacts-dev/
- gs://resume-gen-intent-dev-raw-uploads-dev/
Count: 2 ✓

Cloud Tasks Queues:
- artifact-generation-dev
- resume-processing-dev
Count: 2 ✓
```

### GitHub Actions YAML Validation

```bash
$ python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"
YAML syntax valid ✓
```

---

## CI Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOY WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│  1. setup           → Determine environment (dev only)      │
│  2. terraform       → Apply infrastructure                  │
│  3. build-images    → Build & push Docker images            │
│  4. deploy-services → Update Cloud Run revisions            │
│  5. no-sprawl-check → VERIFY RESOURCE COUNTS ← NEW          │
│  6. deploy-frontend → Firebase Hosting (depends on 5)       │
│  7. verify          → Health checks                         │
└─────────────────────────────────────────────────────────────┘
```

---

## What Guardrails Prevent

| Scenario | Prevention |
|----------|------------|
| Accidental new Cloud Run service | NO-SPRAWL CHECK fails if count > 2 |
| Accidental new bucket | NO-SPRAWL CHECK fails if count > 2 |
| Accidental new queue | NO-SPRAWL CHECK fails if count > 2 |
| Wrong project deployment | Terraform validation fails |
| Wrong region deployment | Terraform validation fails |
| Prod deployment (unauthorized) | Workflow dispatch only allows dev |

---

## Commits

| SHA | Message |
|-----|---------|
| `1bd39de` | `chore(terraform): add guardrails to prevent resource sprawl` |
| `c083a95` | `ci(deploy): add NO-SPRAWL CHECK job and lock to dev only` |

---

## Next Steps

### When Adding Production

1. Update `guardrails.tf` to add `prod` to `allowed_environments`
2. Uncomment `prod` in `deploy.yml` workflow dispatch options
3. Update NO-SPRAWL CHECK to handle environment-specific resource names
4. Create `infra/terraform/envs/prod/` with separate tfvars

### Required Approvals

New resources require explicit approval from Jeremy:
- New Cloud Run services
- New Storage buckets
- New Cloud Tasks queues
- New environments (staging, prod, etc.)

---

## Verification Commands

```bash
# Verify Cloud Run services (expect 2)
gcloud run services list --region=us-central1 --project=resume-gen-intent-dev

# Verify buckets (expect 2 data buckets)
gsutil ls -p resume-gen-intent-dev | grep -E "(raw-uploads|artifacts)-dev"

# Verify queues (expect 2)
gcloud tasks queues list --location=us-central1 --project=resume-gen-intent-dev

# Terraform validate
cd infra/terraform/envs/dev && terraform validate
```

---

**Phase Status:** VERIFIED / GUARDRAILS ACTIVE

---

**Generated:** 2025-12-08 03:55 CST (America/Chicago)
**Author:** Claude Code (Opus)
**Verification Executed:** 2025-12-08 03:50-03:55 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
