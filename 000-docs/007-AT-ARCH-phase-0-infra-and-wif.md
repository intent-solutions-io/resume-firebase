# Phase 0 Architecture - Infrastructure and WIF

**Document Type:** Architecture & Technical (AT-ARCH)
**Project:** Resume Generator
**Phase:** 0 - Foundation
**Created:** 2025-12-07 19:35 CST

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions CI/CD                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Authenticate via WIF (no service account keys)              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │   │
│  │  │ ci.yml     │  │ deploy.yml │  │ Workload Identity      │ │   │
│  │  │ (PR)       │  │ (main)     │  │ Federation             │ │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Google Cloud Platform                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Terraform-managed Infrastructure                             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │   │
│  │  │ Artifact        │  │ Cloud Run       │  │ Cloud Tasks  │  │   │
│  │  │ Registry        │  │ (API + Worker)  │  │ (Queues)     │  │   │
│  │  └─────────────────┘  └─────────────────┘  └──────────────┘  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │   │
│  │  │ Firestore       │  │ Cloud Storage   │  │ Secret       │  │   │
│  │  │ (Native)        │  │ (Buckets)       │  │ Manager      │  │   │
│  │  └─────────────────┘  └─────────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Firebase                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                    │   │
│  │  │ Hosting         │  │ App Check       │                    │   │
│  │  │ (Frontend)      │  │ (reCAPTCHA)     │                    │   │
│  │  └─────────────────┘  └─────────────────┘                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Workload Identity Federation (WIF)

### How WIF Works

1. GitHub Actions requests OIDC token from GitHub
2. Token exchanged with GCP for short-lived credentials
3. Credentials impersonate CI service account
4. No long-lived keys stored in GitHub Secrets

### WIF Configuration

```
Workload Identity Pool: github-actions-pool
  └── Provider: github-actions-provider
       └── OIDC Issuer: https://token.actions.githubusercontent.com
       └── Attribute Mapping:
           - google.subject = assertion.sub
           - attribute.repository = assertion.repository
       └── Attribute Condition:
           - assertion.repository_owner == 'intent-solutions-io'
```

### Service Account Binding

```
CI Service Account: github-actions-ci@{project}.iam.gserviceaccount.com
  └── Bound to: principalSet://...attribute.repository/intent-solutions-io/resume-generator
  └── Roles:
      - roles/run.admin
      - roles/storage.admin
      - roles/artifactregistry.writer
      - roles/iam.serviceAccountUser
      - roles/firebase.admin
```

## Terraform Module Structure

```
infra/terraform/
├── envs/
│   ├── dev/
│   │   ├── main.tf           # Dev environment config
│   │   └── terraform.tfvars  # Dev variables (gitignored)
│   └── prod/
│       ├── main.tf           # Prod environment config
│       └── terraform.tfvars  # Prod variables (gitignored)
└── modules/
    ├── project_apis/         # API enablement
    ├── wif_ci/               # WIF configuration
    ├── artifact_registry/    # Container registry
    ├── storage/              # GCS buckets
    ├── firestore/            # Database
    ├── cloud_tasks/          # Task queues
    ├── cloud_run/            # Services
    ├── secrets/              # Secret Manager
    └── iam/                  # Service accounts
```

## GitHub Actions Workflow Architecture

### CI Workflow (ci.yml)

```yaml
Trigger: pull_request to main
Jobs:
  terraform:
    - Authenticate via WIF
    - terraform fmt -check
    - terraform validate
  api:
    - npm ci
    - npm run lint
    - npm run typecheck
    - npm test
    - npm run build
  worker:
    - (same as api)
  frontend:
    - (same as api)
  shared:
    - (same as api)
```

### Deploy Workflow (deploy.yml)

```yaml
Trigger: push to main
Jobs:
  setup:
    - Determine environment (dev/prod)
  terraform:
    - Authenticate via WIF
    - terraform init
    - terraform plan
    - terraform apply
  build-images:
    - Build API image
    - Build Worker image
    - Push to Artifact Registry
  deploy-services:
    - Deploy API to Cloud Run
    - Deploy Worker to Cloud Run
  deploy-frontend:
    - Build frontend
    - Deploy to Firebase Hosting
  verify:
    - Health check API
    - Health check Frontend
```

## Security Considerations

### WIF Security

- No service account keys in GitHub
- Short-lived credentials (1 hour max)
- Repository-scoped access
- Audit trail via Cloud Logging

### Network Security

- Cloud Run services are internal-only (worker)
- API is public but protected by App Check
- All storage buckets are private
- Signed URLs for all file access

### Data Security

- No PII in logs
- Firestore rules restrict client access
- Storage rules deny direct access
- All uploads via signed URLs

---

**Generated:** 2025-12-07 19:35 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
