# Phase 0 Scope - WIF and Infrastructure Bootstrap

**Document Type:** Product & Project (PP-PROD)
**Project:** Resume Generator
**Phase:** 0 - Foundation
**Created:** 2025-12-07 19:30 CST

---

## Overview

Phase 0 establishes the foundational infrastructure for the Resume Generator project using Google Cloud Platform with GitHub Actions CI/CD via Workload Identity Federation (WIF).

## Objectives

1. Create GCP project and enable required APIs
2. Set up Terraform infrastructure with modular design
3. Configure Workload Identity Federation for keyless GitHub Actions
4. Create GitHub Actions CI/CD workflows
5. Set up Firebase project and Hosting scaffold

## Deliverables

### A) Terraform Infrastructure (`infra/terraform/`)

| Module | Purpose |
|--------|---------|
| `project_apis` | Enable required GCP APIs |
| `wif_ci` | Workload Identity Federation for GitHub Actions |
| `artifact_registry` | Container image storage |
| `storage` | GCS buckets (raw uploads, artifacts) |
| `firestore` | Native mode database |
| `cloud_tasks` | Async processing queues |
| `cloud_run` | API and Worker services |
| `secrets` | Secret Manager placeholders |
| `iam` | Service accounts and role bindings |

### B) GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR to main | Terraform validate, lint, test, build |
| `deploy.yml` | Push to main | Terraform apply, build images, deploy |

### C) Firebase Configuration

- `firebase.json` - Hosting and Firestore config
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Database indexes
- `storage.rules` - Cloud Storage rules

## Technical Constraints

1. **No service account keys** - All CI/CD via WIF
2. **No Cloud Build** - GitHub Actions only
3. **Terraform state** - GCS backend (manual setup required)
4. **Environments** - dev and prod isolation

## Success Criteria

- [ ] Terraform validates successfully
- [ ] GitHub Actions authenticate via WIF
- [ ] Firebase Hosting scaffold deploys
- [ ] All infrastructure modules created
- [ ] Documentation complete

---

**Generated:** 2025-12-07 19:30 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
