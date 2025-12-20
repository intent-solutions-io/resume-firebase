# Operation Hired Resume Platform: Operator-Grade System Analysis & Operations Guide

*For: DevOps Engineer*
*Generated: December 9, 2025*
*System Version: 95e5aa7 (Phase 2.4)*

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Operator & Customer Journey](#2-operator--customer-journey)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Directory Deep-Dive](#4-directory-deep-dive)
5. [Automation & Agent Surfaces](#5-automation--agent-surfaces)
6. [Operational Reference](#6-operational-reference)
7. [Security, Compliance & Access](#7-security-compliance--access)
8. [Cost & Performance](#8-cost--performance)
9. [Development Workflow](#9-development-workflow)
10. [Dependencies & Supply Chain](#10-dependencies--supply-chain)
11. [Integration with Existing Documentation](#11-integration-with-existing-documentation)
12. [Current State Assessment](#12-current-state-assessment)
13. [Quick Reference](#13-quick-reference)
14. [Recommendations Roadmap](#14-recommendations-roadmap)

---

## 1. Executive Summary

### Business Purpose

The **Operation Hired Resume Platform** is an AI-powered resume generation system designed specifically for military veterans transitioning to civilian careers. The system transforms military service records (DD-214, ERB/ORB, evaluations) into polished, ATS-optimized civilian resumes in PDF and DOCX formats.

**Primary Value Proposition:**
- Veterans upload military documents → AI extracts career data → Generates civilian-friendly resume
- Operation Hired team monitors pipeline via admin dashboard
- ATS-optimized output increases job application success rates

**Current Status:** MVP Testing (Phase 2.4 complete)
- Live development environment at https://resume-gen-intent-dev.web.app
- Worker service processing candidates at https://resume-worker-dev-96171099570.us-central1.run.app
- Admin dashboard operational at /admin

**Technology Foundation:**
- **Frontend**: React 18 + TypeScript + Vite → Firebase Hosting
- **Backend**: Node.js 20 + Express → Cloud Run (Worker service)
- **AI/ML**: Google Vertex AI (Gemini 1.5 Flash) for document understanding
- **Storage**: Firestore (data) + Cloud Storage (documents/exports)
- **Infrastructure**: Terraform IaC with Workload Identity Federation (no service account keys)

**Strategic Considerations:**
- Production deployment blocked behind explicit approval (guardrails in place)
- Admin authentication not yet implemented (Phase 2.5)
- System designed for plug-and-play frontend replacement

### Operational Status Matrix

| Environment | Status | Uptime Target | Current Uptime | Release Cadence | Active Users |
|-------------|--------|---------------|----------------|-----------------|--------------|
| Production  | NOT DEPLOYED | N/A | N/A | N/A | N/A |
| Dev (Live)  | HEALTHY | 99% | ~99% (manual deploys) | On-demand | Internal testing |
| Local       | Available | N/A | N/A | N/A | Development |

### Technology Stack Summary

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | TypeScript | 5.2.2 | All services |
| Frontend Framework | React | 18.2.0 | SPA UI |
| Build Tool | Vite | 5.0.0 | Frontend bundling |
| Backend Framework | Express | 4.18.2 | API/Worker HTTP |
| Database | Firestore | Native mode | Document storage |
| Object Storage | Cloud Storage | v7.7.0 SDK | File uploads/exports |
| AI/ML | Vertex AI (Gemini) | 1.5 Flash | Resume generation |
| PDF Generation | Puppeteer | 24.32.1 | HTML→PDF rendering |
| DOCX Generation | docx | 9.5.1 | Word document creation |
| Infrastructure | Terraform | 1.5.7 | IaC |
| CI/CD | GitHub Actions | v4 | Automated pipelines |
| Container Runtime | Cloud Run | Gen2 | Serverless containers |

---

## 2. Operator & Customer Journey

### Primary Personas

- **Veterans (Candidates)**: End users uploading military documents, receiving resumes
- **Operation Hired Team (Operators)**: Staff monitoring pipeline, downloading resumes, supporting candidates
- **Intent Solutions (Platform Owner)**: Development, maintenance, infrastructure management
- **Automation Bots**: Slack notifications, CI/CD pipelines

### End-to-End Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CANDIDATE JOURNEY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INTAKE          UPLOAD           PROCESS          RESUME                   │
│  ───────         ──────           ───────          ──────                   │
│  /intake    →    /intake/:id      Worker        →  /intake/:id/complete     │
│                  /documents       Cloud Run                                 │
│                                                                             │
│  [1] Enter       [2] Upload       [3] AI          [4] Download              │
│  name, email,    DD-214, ERB,     extracts        PDF/DOCX                  │
│  branch, rank,   evaluations      profile,                                  │
│  MOS                              generates                                  │
│                                   resume                                    │
│                                                                             │
│  Firestore:      Cloud Storage:   Vertex AI:      Cloud Storage:            │
│  candidates/     candidates/      Gemini 1.5      candidates/.../exports/   │
│                  {id}/uploads/    Flash                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        OPERATOR JOURNEY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NOTIFICATION    MONITOR          REVIEW           DELIVER                  │
│  ────────────    ───────          ──────           ───────                  │
│  Slack           /admin           /admin/:id       Download/Share           │
│  #operation-     /candidates                       PDF/DOCX                 │
│  hired                                                                      │
│                                                                             │
│  Real-time       Filter by        View profile,    Signed URLs              │
│  alerts for      status,          documents,       for secure               │
│  new intake,     see summary      resume preview   downloads                │
│  resume ready    cards                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Critical Touchpoints

| Stage | Touchpoint | Dependencies | Friction Points | Success Metrics |
|-------|------------|--------------|-----------------|-----------------|
| Intake | Form submission | Firestore write | None observed | Form completion rate |
| Upload | File upload | Cloud Storage write | Large files, network | Upload success rate |
| Process | AI generation | Vertex AI, Worker | 30-60s latency | Processing success rate |
| Download | PDF/DOCX export | Puppeteer, docx lib | Chromium memory | Export success rate |
| Admin | Dashboard load | Firestore reads | No pagination yet | Query latency |

### SLA Commitments (Targets)

| Metric | Target | Current | Owner |
|--------|--------|---------|-------|
| System Uptime | 99% | ~99% (dev) | DevOps |
| Resume Generation | < 60s | 30-60s | Worker |
| PDF Export | < 30s | ~15s | Worker |
| Admin Dashboard Load | < 2s | ~1s | Frontend |

---

## 3. System Architecture Overview

### Technology Stack (Detailed)

| Layer | Technology | Version | Source of Truth | Purpose | Owner |
|-------|------------|---------|-----------------|---------|-------|
| Frontend/UI | React + Vite | 18.2/5.0 | `frontend/package.json` | Candidate/Admin UI | Frontend |
| Routing | react-router-dom | 6.20.0 | `frontend/package.json` | SPA navigation | Frontend |
| Backend/Worker | Express + Node | 4.18/20 | `services/worker/package.json` | AI processing, exports | Backend |
| Database | Firestore | Native | Terraform | Candidate data | Backend |
| Object Storage | Cloud Storage | v7 | Terraform | Documents, exports | Backend |
| AI/ML | Vertex AI | Gemini 1.5 | `services/worker/src/services/vertex.ts` | Resume generation | Backend |
| PDF Engine | Puppeteer | 24.32.1 | `services/worker/package.json` | HTML→PDF | Backend |
| DOCX Engine | docx | 9.5.1 | `services/worker/package.json` | Word docs | Backend |
| Validation | Zod | 3.22.4 | `packages/shared/package.json` | Schema validation | Shared |
| Infrastructure | Terraform | 1.5.7 | `.github/workflows/deploy.yml` | IaC | DevOps |
| CI/CD | GitHub Actions | v4 | `.github/workflows/` | Automation | DevOps |
| Notifications | Slack Webhooks | N/A | Worker env vars | Team alerts | Backend |

### Environment Matrix

| Environment | Purpose | Hosting | Data Source | Release Cadence | IaC Source | Notes |
|-------------|---------|---------|-------------|-----------------|------------|-------|
| local | Development | localhost | Emulators/Dev | Continuous | N/A | `npm run dev` |
| dev | Testing | Cloud Run + Firebase | Firestore dev | On-demand | `infra/terraform/envs/dev/` | Live MVP |
| prod | Production | Cloud Run + Firebase | Firestore prod | Gated | `infra/terraform/envs/prod/` | NOT DEPLOYED |

### Cloud & Platform Services

| Service | Purpose | Environment(s) | Key Config | Cost/Limits | Owner | Vendor Risk |
|---------|---------|----------------|------------|-------------|-------|-------------|
| Cloud Run | Worker service | dev | 2vCPU/2Gi, 300s timeout | Pay-per-use | DevOps | Low (GCP) |
| Firebase Hosting | Frontend | dev | CDN, SPA routing | Free tier | DevOps | Low |
| Firestore | Candidate data | dev | Native mode | Pay-per-read/write | Backend | Low |
| Cloud Storage | Documents/exports | dev | 2 buckets | Pay-per-GB | Backend | Low |
| Cloud Tasks | Job queues | dev | 2 queues | Pay-per-task | Backend | Low |
| Vertex AI | Gemini 1.5 Flash | dev | us-central1 | Pay-per-token | Backend | Medium (API limits) |
| Artifact Registry | Container images | dev | Docker format | Pay-per-GB | DevOps | Low |
| Secret Manager | API keys | dev | 3 secrets | Pay-per-access | DevOps | Low |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                         │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
           │   Firebase    │ │  Cloud Run    │ │    Slack      │
           │   Hosting     │ │   Worker      │ │   Webhooks    │
           │               │ │               │ │               │
           │  React SPA    │ │  Express API  │ │ Notifications │
           │  /intake      │ │  /internal/*  │ │ #operation-   │
           │  /admin       │ │  /health      │ │  hired        │
           └───────┬───────┘ └───────┬───────┘ └───────────────┘
                   │                 │
                   │                 │
                   ▼                 ▼
           ┌───────────────────────────────────────────────────┐
           │                  GOOGLE CLOUD                      │
           ├───────────────────────────────────────────────────┤
           │                                                   │
           │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
           │  │  Firestore  │  │   Cloud     │  │  Vertex   │ │
           │  │             │  │   Storage   │  │    AI     │ │
           │  │ candidates/ │  │             │  │           │ │
           │  │ candidateDocs│  │ raw-uploads/│  │ Gemini    │ │
           │  │ profiles/   │  │ artifacts/  │  │ 1.5 Flash │ │
           │  │ resumes/    │  │             │  │           │ │
           │  └─────────────┘  └─────────────┘  └───────────┘ │
           │                                                   │
           │  ┌─────────────┐  ┌─────────────┐                │
           │  │ Cloud Tasks │  │  Secret     │                │
           │  │             │  │  Manager    │                │
           │  │ resume-     │  │             │                │
           │  │ processing  │  │ slack-      │                │
           │  │ artifact-   │  │ webhook     │                │
           │  │ generation  │  │             │                │
           │  └─────────────┘  └─────────────┘                │
           │                                                   │
           └───────────────────────────────────────────────────┘
```

### Data Flow

```
1. INTAKE FLOW
   Browser → Firebase Hosting → Firestore (candidates/)

2. UPLOAD FLOW
   Browser → Firebase Hosting → Cloud Storage (candidates/{id}/uploads/)

3. PROCESSING FLOW
   Frontend POST → Worker → Text Extraction → Vertex AI → Firestore

4. EXPORT FLOW
   Worker → Puppeteer/docx → Cloud Storage (candidates/{id}/exports/)

5. NOTIFICATION FLOW
   Worker → Slack Webhook → #operation-hired

6. ADMIN FLOW
   Browser → Firebase Hosting → Firestore (reads all collections)
```

---

## 4. Directory Deep-Dive

### Project Structure Analysis

```
firebase-generator/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # PR validation (lint, typecheck, test, build)
│       └── deploy.yml              # Main branch deployment (dev only)
├── 000-docs/                       # Project documentation (6767 + NNN standards)
│   ├── 001-025 (Phase docs)        # Phase planning and AAR documents
│   ├── 026-AA-REPT-*               # Phase 2.4 AAR
│   └── 027-DR-GUID-*               # Client guide
├── frontend/                       # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx          # Branded nav/footer
│   │   ├── lib/
│   │   │   ├── firebase.ts         # Firebase client init
│   │   │   ├── firestore.ts        # Candidate CRUD
│   │   │   ├── adminData.ts        # Admin queries
│   │   │   └── storage.ts          # File upload helpers
│   │   └── pages/
│   │       ├── IntakePage.tsx      # Step 1: Info form
│   │       ├── IntakeDocumentsPage.tsx  # Step 2: Upload
│   │       ├── IntakeCompletePage.tsx   # Step 3: Status/Download
│   │       ├── CandidatePage.tsx   # Shareable URL redirect
│   │       ├── AdminCandidatesPage.tsx  # Admin list
│   │       └── AdminCandidateDetailPage.tsx  # Admin detail
│   └── package.json
├── services/
│   ├── api/                        # API service (future use)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   └── cases.ts
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── worker/                     # Main processing service
│       ├── src/
│       │   ├── handlers/
│       │   │   ├── processCandidateHandler.ts  # Main entry
│       │   │   └── health.ts
│       │   ├── services/
│       │   │   ├── vertex.ts       # Gemini AI calls
│       │   │   ├── textExtraction.ts
│       │   │   ├── exportResume.ts # PDF/DOCX generation
│       │   │   ├── slackNotifier.ts
│       │   │   └── firestore.ts
│       │   └── index.ts            # Express server
│       ├── Dockerfile              # Chromium for Puppeteer
│       └── package.json
├── packages/
│   └── shared/                     # Shared types and schemas
│       ├── src/
│       │   ├── types/              # TypeScript interfaces
│       │   └── schemas/            # Zod validation schemas
│       └── package.json
├── infra/
│   └── terraform/
│       ├── envs/
│       │   ├── dev/
│       │   │   ├── main.tf         # Dev environment config
│       │   │   └── guardrails.tf   # Safety constraints
│       │   └── prod/
│       │       └── main.tf         # Prod (not active)
│       └── modules/
│           ├── artifact_registry/
│           ├── cloud_run/
│           ├── cloud_tasks/
│           ├── firestore/
│           ├── iam/
│           ├── project_apis/
│           ├── secrets/
│           ├── storage/
│           └── wif_ci/             # Workload Identity Federation
├── firebase.json                   # Firebase Hosting config
├── firestore.rules                 # Security rules
├── storage.rules                   # Storage security rules
├── CLAUDE.md                       # AI assistant instructions
└── README.md                       # Project documentation
```

### Key Service Analysis

#### services/worker/ (Primary Service)

**Purpose**: AI-powered resume generation with PDF/DOCX export

**Entry Point**: `src/index.ts:37`

**Key Handlers**:
| Handler | Path | Purpose |
|---------|------|---------|
| `processCandidateHandler` | POST `/internal/processCandidate` | Main processing |
| `generateArtifact` | POST `/internal/generateArtifact` | Export generation |
| `health` | GET `/health` | Health check |
| `resumeDownload` | GET `/internal/resumeDownload/:id/:format` | Signed URL |
| `candidateStatus` | GET `/internal/candidateStatus/:id` | Status check |

**Key Services**:
| Service | File | Purpose |
|---------|------|---------|
| `vertex.ts` | Gemini integration | Profile/resume generation |
| `textExtraction.ts` | Document parsing | PDF/DOCX text extraction |
| `exportResume.ts` | Export engine | PDF (Puppeteer) + DOCX generation |
| `slackNotifier.ts` | Notifications | Team alerts |
| `firestore.ts` | Data layer | CRUD operations |

**Resource Requirements**:
- Memory: 2Gi (Chromium headless needs ~1.5GB)
- CPU: 2 vCPU (PDF rendering)
- Timeout: 300s (AI + export can take 60s+)

#### frontend/ (React SPA)

**Purpose**: Candidate intake flow + Admin dashboard

**Key Routes**:
| Route | Component | Purpose |
|-------|-----------|---------|
| `/intake` | IntakePage | Candidate info form |
| `/intake/:id/documents` | IntakeDocumentsPage | Document upload |
| `/intake/:id/complete` | IntakeCompletePage | Status + download |
| `/candidate/:id` | CandidatePage | Shareable redirect |
| `/admin` | AdminCandidatesPage | Admin list |
| `/admin/candidates/:id` | AdminCandidateDetailPage | Admin detail |

**State Management**: React hooks + Firestore real-time listeners

#### infra/terraform/ (Infrastructure as Code)

**Modules**:
| Module | Purpose | Key Resources |
|--------|---------|---------------|
| `project_apis` | Enable GCP APIs | 15+ APIs |
| `wif_ci` | Workload Identity Federation | Pool, provider, SA |
| `artifact_registry` | Container registry | Docker repo |
| `storage` | Object storage | 2 buckets |
| `firestore` | Database | Native mode |
| `cloud_tasks` | Job queues | 2 queues |
| `secrets` | Secret management | 3 secrets |
| `iam` | Access control | Service accounts, roles |
| `cloud_run` | Container hosting | 2 services |

**Guardrails** (in `guardrails.tf`):
- Project locked to `resume-gen-intent-dev`
- Region locked to `us-central1`
- Prod deployment disabled

---

## 5. Automation & Agent Surfaces

### CI/CD Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | PR, push to main | Validate code quality |
| Deploy | `.github/workflows/deploy.yml` | push to main | Deploy to dev |

**CI Pipeline Stages**:
1. Terraform validate (dev + prod)
2. API service: lint, typecheck, test, build
3. Worker service: lint, typecheck, test, build
4. Frontend: lint, typecheck, test, build
5. Shared packages: lint, typecheck, test, build

**Deploy Pipeline Stages**:
1. Test Spine (66 contract tests must pass)
2. Terraform Apply
3. Build Images (API + Worker)
4. Deploy Services (Cloud Run)
5. NO-SPRAWL CHECK (verify resource counts)
6. Deploy Frontend (Firebase Hosting)
7. Verify (health checks)

### Slack Notifications

| Event | Channel | Message |
|-------|---------|---------|
| New candidate intake | #operation-hired | Name, email, branch/rank/MOS, [View] button |
| Resume ready | #operation-hired | Name, branch/rank/MOS, PDF/DOCX links, [View] button |

**Implementation**: `services/worker/src/services/slackNotifier.ts`
**Webhook**: Stored in Secret Manager as `slack-operation-hired-webhook`

### Cloud Tasks Queues

| Queue | Purpose | Max Rate | Retry |
|-------|---------|----------|-------|
| resume-processing-dev | Main processing | 10/sec | 3 attempts |
| artifact-generation-dev | Export jobs | 5/sec | 3 attempts |

---

## 6. Operational Reference

### Deployment Workflows

#### Local Development

**Prerequisites**:
- Node.js 20.x
- npm 10.x
- Firebase CLI (`npm install -g firebase-tools`)
- GCP credentials (for Vertex AI)

**Environment Setup**:
```bash
# Frontend
cd frontend
cp .env.example .env.local
# Set VITE_WORKER_URL, VITE_FIREBASE_* vars
npm install
npm run dev

# Worker (in separate terminal)
cd services/worker
cp .env.example .env
# Set GCP_PROJECT_ID, VERTEX_*, FIREBASE_*, SLACK_*, APP_BASE_URL
npm install
npm run dev
```

**Verification**:
```bash
# Frontend
curl http://localhost:5173/

# Worker
curl http://localhost:8080/health
```

#### Dev Deployment (Automated)

**Trigger**: Push to `main` branch

**Manual Deploy** (if needed):
```bash
# Frontend
cd frontend
npm run build
firebase deploy --only hosting --project resume-gen-intent-dev

# Worker
gcloud run deploy resume-worker-dev \
  --image us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator/worker:latest \
  --region us-central1 \
  --project resume-gen-intent-dev \
  --allow-unauthenticated \
  --memory 2Gi --cpu 2 --timeout 300
```

#### Production Deployment

**Status**: BLOCKED by guardrails

**To Enable**:
1. Edit `.github/workflows/deploy.yml` line 21 to uncomment `- prod`
2. Review `infra/terraform/envs/prod/main.tf` variables
3. Set up prod secrets in GitHub
4. Get explicit approval from Jeremy

### Monitoring & Alerting

**Dashboards**:
- Cloud Run: https://console.cloud.google.com/run?project=resume-gen-intent-dev
- Firestore: https://console.firebase.google.com/project/resume-gen-intent-dev/firestore

**Health Endpoints**:
```bash
# Worker
curl https://resume-worker-dev-96171099570.us-central1.run.app/health
# Expected: {"status":"healthy","service":"worker","timestamp":"...","version":"0.1.0"}

# Frontend
curl -I https://resume-gen-intent-dev.web.app
# Expected: HTTP/2 200
```

**Logs**:
```bash
# Worker logs
gcloud run logs read resume-worker-dev --project resume-gen-intent-dev --limit 100

# All logs
gcloud logging read "resource.type=cloud_run_revision" --project resume-gen-intent-dev --limit 50
```

### Incident Response

| Severity | Definition | Response Time | First Actions |
|----------|------------|---------------|---------------|
| P0 | Service down | Immediate | Check Cloud Run, redeploy |
| P1 | Processing failures | 15 min | Check Vertex AI quota, logs |
| P2 | Slow performance | 1 hour | Scale Cloud Run, check memory |
| P3 | Minor UI issues | Next day | Frontend hotfix |

**Common Issues**:

| Issue | Symptom | Fix |
|-------|---------|-----|
| Worker OOM | PDF generation fails | Increase memory to 4Gi |
| Vertex AI quota | 429 errors | Check quota, add retry |
| Firestore timeout | Slow admin dashboard | Add pagination |
| Slack not sending | No notifications | Check webhook secret |

### Backup & Recovery

**Firestore**: Automatic daily backups (Firebase managed)

**Manual Export**:
```bash
gcloud firestore export gs://resume-gen-intent-dev-backups/$(date +%Y%m%d) \
  --project resume-gen-intent-dev
```

**RPO/RTO**:
| Component | RPO | RTO |
|-----------|-----|-----|
| Firestore | 24h (daily backup) | 1h (restore) |
| Cloud Storage | Real-time (replicated) | N/A |
| Code | Git history | 5min (redeploy) |

---

## 7. Security, Compliance & Access

### Identity & Access Management

| Account/Role | Purpose | Permissions | MFA | Used By |
|--------------|---------|-------------|-----|---------|
| GitHub Actions WIF | CI/CD | Editor on dev project | N/A (federated) | Pipelines |
| Worker SA | Runtime | Firestore, Storage, Vertex AI | N/A | Cloud Run |
| API SA | Runtime | Firestore, Storage, Tasks | N/A | Cloud Run |
| Developer | Development | Owner on dev project | Required | Team |

### Secrets Management

| Secret | Location | Rotation | Purpose |
|--------|----------|----------|---------|
| `slack-operation-hired-webhook` | Secret Manager | Manual | Slack notifications |
| `firebase-api-key` | GitHub Secrets + .env | Manual | Frontend Firebase |
| WIF provider | Terraform | Never | CI/CD auth |

### Security Posture

**Authentication**:
- Frontend: None (MVP, Phase 2.5 will add Firebase Auth)
- Worker: None (internal endpoints, no public data)
- Admin: None (CRITICAL - add before production)

**Authorization**:
- Firestore rules: Basic validation, no auth check
- Storage rules: Candidate path isolation

**Network**:
- Cloud Run: Public ingress (allow-unauthenticated)
- Firestore: Private (SDK only)
- No VPC/firewall customization

**Known Gaps** (MUST FIX for production):
1. ⚠️ Admin dashboard has no authentication
2. ⚠️ Worker endpoints publicly accessible
3. ⚠️ No rate limiting on intake form
4. ⚠️ No input sanitization on file uploads

---

## 8. Cost & Performance

### Current Costs (Dev Environment)

**Estimated Monthly**: ~$50-100 (low usage)

| Service | Est. Cost | Notes |
|---------|-----------|-------|
| Cloud Run | $10-30 | Pay-per-request, idle to zero |
| Vertex AI | $20-50 | ~$0.075/1k chars output |
| Firestore | $5-10 | Free tier covers most |
| Cloud Storage | $1-5 | Minimal data volume |
| Firebase Hosting | $0 | Free tier |

### Performance Baseline

| Operation | Target | Current | Notes |
|-----------|--------|---------|-------|
| Intake form submit | < 500ms | ~200ms | Firestore write |
| Document upload | < 10s | 2-5s | Depends on file size |
| AI processing | < 60s | 30-60s | Gemini latency |
| PDF export | < 30s | 10-20s | Puppeteer cold start |
| DOCX export | < 10s | 2-5s | Native generation |
| Admin list load | < 2s | ~1s | No pagination |

### Optimization Opportunities

1. **Worker cold start**: Use min instances (1) → Est: +$30/month
2. **PDF generation**: Pre-warm Chromium → Est: -5s latency
3. **Admin pagination**: Add cursor-based pagination → Required for scale
4. **Caching**: Add Redis for repeated queries → Not needed yet

---

## 9. Development Workflow

### Local Development

**Standard Setup**:
```bash
# Clone
git clone git@github.com:intent-solutions-io/resume-firebase.git
cd resume-firebase

# Install all dependencies
npm install
cd packages/shared && npm install && npm run build && cd ..
cd services/api && npm install && cd ..
cd services/worker && npm install && cd ..
cd frontend && npm install && cd ..

# Start services (3 terminals)
# Terminal 1: Shared (watch mode)
cd packages/shared && npm run build -- --watch

# Terminal 2: Worker
cd services/worker && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### CI/CD Pipeline

**PR Checks** (ci.yml):
- Terraform fmt/validate
- All services: lint, typecheck, test, build

**Deploy** (deploy.yml):
- Test Spine (66 tests)
- Terraform apply
- Docker build/push
- Cloud Run deploy
- NO-SPRAWL check
- Firebase deploy
- Health verify

### Code Quality

| Tool | Config | Enforcement |
|------|--------|-------------|
| ESLint | Per-service `.eslintrc` | CI blocks on warnings |
| TypeScript | `tsconfig.json` | Strict mode |
| Vitest | Per-service | Tests required |
| Terraform fmt | Native | CI check |

### Test Coverage

| Package | Tests | Coverage | Gap |
|---------|-------|----------|-----|
| shared | ~20 | ~80% | Schema edge cases |
| api | ~15 | ~60% | Route handlers |
| worker | ~30 | ~70% | AI mocking |
| frontend | 0 | 0% | Needs component tests |

---

## 10. Dependencies & Supply Chain

### Direct Dependencies (Critical)

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `@google-cloud/vertexai` | 1.9.0 | AI API | Low |
| `puppeteer` | 24.32.1 | PDF generation | Medium (Chromium) |
| `docx` | 9.5.1 | DOCX generation | Low |
| `firebase` | 10.7.0 | Frontend SDK | Low |
| `express` | 4.18.2 | HTTP server | Low |
| `zod` | 3.22.4 | Validation | Low |

### Third-Party Services

| Service | Purpose | Data Shared | Auth | SLA | Renewal | Owner |
|---------|---------|-------------|------|-----|---------|-------|
| GCP | Infrastructure | All data | IAM | 99.95% | Annual | Jeremy |
| Slack | Notifications | Candidate names | Webhook | N/A | N/A | Jeremy |
| GitHub | Source/CI | Code | OAuth | 99.9% | Monthly | Jeremy |

---

## 11. Integration with Existing Documentation

### Documentation Inventory

| Document | Location | Status | Last Updated |
|----------|----------|--------|--------------|
| README.md | Root | Current | Dec 9, 2025 |
| CLAUDE.md | Root | Current | Dec 7, 2025 |
| Phase AARs | 000-docs/ | Complete | Through Phase 2.4 |
| Client Guide | 000-docs/027-* | v1.0 | Dec 9, 2025 |
| Terraform | infra/terraform/ | Current | Dec 7, 2025 |

### Recommended Reading Order

1. `README.md` - System overview, deployment commands
2. `000-docs/027-DR-GUID-*` - Client-facing system guide
3. `000-docs/026-AA-REPT-*` - Latest phase (2.4) details
4. `CLAUDE.md` - Development conventions
5. `.github/workflows/deploy.yml` - CI/CD pipeline

---

## 12. Current State Assessment

### What's Working Well

✅ **AI Pipeline**: Vertex AI integration stable, generates quality resumes
✅ **PDF Export**: Puppeteer + Chromium working in Cloud Run
✅ **Real-time Updates**: Firestore subscriptions for status changes
✅ **Admin Dashboard**: Functional monitoring for ops team
✅ **CI/CD**: WIF-based deployment, no service account keys
✅ **Guardrails**: Terraform prevents resource sprawl
✅ **Test Spine**: 66 contract tests enforce API stability

### Areas Needing Attention

⚠️ **No Admin Auth**: Admin pages publicly accessible
⚠️ **No Pagination**: Admin list will slow with scale
⚠️ **No Rate Limiting**: Intake form could be abused
⚠️ **Frontend Tests**: 0% coverage
⚠️ **No Prod Environment**: Blocked but not validated

### Immediate Priorities

| Priority | Issue | Impact | Action | Owner |
|----------|-------|--------|--------|-------|
| HIGH | Admin auth | Security | Add Firebase Auth (Phase 2.5) | Backend |
| HIGH | Worker auth | Security | Add IAM invoker | DevOps |
| MEDIUM | Pagination | Performance | Add cursor pagination | Frontend |
| MEDIUM | Frontend tests | Quality | Add component tests | Frontend |
| LOW | Cold starts | Latency | Set min instances | DevOps |

---

## 13. Quick Reference

### Operational Command Map

| Capability | Command/Tool | Notes |
|------------|--------------|-------|
| Local frontend | `cd frontend && npm run dev` | Port 5173 |
| Local worker | `cd services/worker && npm run dev` | Port 8080 |
| Build all | `npm run build` per service | |
| Deploy frontend | `firebase deploy --only hosting` | Project flag needed |
| Deploy worker | `gcloud run deploy resume-worker-dev ...` | See README |
| View worker logs | `gcloud run logs read resume-worker-dev` | |
| Terraform plan | `cd infra/terraform/envs/dev && terraform plan` | |
| Run tests | `npm test` per service | Vitest |
| Health check | `curl .../health` | Worker endpoint |

### Critical Endpoints & Resources

**Production URLs** (Dev Environment):
- Frontend: https://resume-gen-intent-dev.web.app
- Admin: https://resume-gen-intent-dev.web.app/admin
- Worker: https://resume-worker-dev-96171099570.us-central1.run.app

**Monitoring**:
- Cloud Run Console: https://console.cloud.google.com/run?project=resume-gen-intent-dev
- Firestore Console: https://console.firebase.google.com/project/resume-gen-intent-dev/firestore
- GitHub Actions: https://github.com/intent-solutions-io/resume-firebase/actions

### First-Week Checklist

- [ ] Clone repository, run local environment
- [ ] Complete a test candidate flow end-to-end
- [ ] Deploy a frontend change via Firebase CLI
- [ ] Review Terraform modules structure
- [ ] Check Cloud Run logs for a processing run
- [ ] Understand Vertex AI quota and pricing
- [ ] Review firestore.rules and storage.rules
- [ ] Get added to #operation-hired Slack channel
- [ ] File first improvement ticket

---

## 14. Recommendations Roadmap

### Week 1 – Critical Setup & Stabilization

**Goals**:
- [ ] Add Firebase Authentication to admin routes
- [ ] Configure Cloud Run IAM invoker (remove allow-unauthenticated from sensitive endpoints)
- [ ] Set up monitoring alerts for error rates

**Stakeholders**: Backend, DevOps
**Dependencies**: Firebase Auth setup, IAM configuration

### Month 1 – Foundation & Visibility

**Goals**:
- [ ] Add pagination to admin candidate list
- [ ] Implement frontend component tests (target 50% coverage)
- [ ] Add rate limiting to intake form
- [ ] Configure Cloud Run min instances (1) to reduce cold starts
- [ ] Document runbooks for common incidents

**Stakeholders**: Frontend, Backend, DevOps
**Dependencies**: None

### Quarter 1 – Strategic Enhancements

**Goals**:
- [ ] Enable production environment deployment
- [ ] Add comprehensive logging and tracing (Cloud Trace)
- [ ] Implement candidate email notifications
- [ ] Create load testing suite
- [ ] Establish SLO monitoring dashboard

**Stakeholders**: All teams
**Dependencies**: Prod environment approval

---

## Appendices

### Appendix A. Glossary

| Term | Definition |
|------|------------|
| ATS | Applicant Tracking System - software employers use to filter resumes |
| DD-214 | Military discharge document |
| ERB/ORB | Enlisted/Officer Record Brief |
| MOS | Military Occupational Specialty (job code) |
| WIF | Workload Identity Federation - keyless auth for CI/CD |
| Cold start | First request latency when container scales from zero |

### Appendix B. Reference Links

| Resource | URL |
|----------|-----|
| GitHub Repo | https://github.com/intent-solutions-io/resume-firebase |
| Firebase Console | https://console.firebase.google.com/project/resume-gen-intent-dev |
| GCP Console | https://console.cloud.google.com/home/dashboard?project=resume-gen-intent-dev |
| Vertex AI Docs | https://cloud.google.com/vertex-ai/docs |

### Appendix C. Troubleshooting Playbooks

**Worker Not Responding**:
1. Check Cloud Run console for instance status
2. Review logs: `gcloud run logs read resume-worker-dev`
3. Verify health endpoint: `curl .../health`
4. If OOM, increase memory in deployment
5. Redeploy if needed

**AI Processing Fails**:
1. Check Vertex AI quota
2. Review worker logs for error details
3. Verify API enabled: `gcloud services list`
4. Test with smaller document

**Frontend Not Loading**:
1. Check Firebase Hosting deployment
2. Verify build succeeded: `npm run build`
3. Check browser console for errors
4. Redeploy: `firebase deploy --only hosting`

### Appendix D. Open Questions

- [ ] When should production deployment be enabled?
- [ ] What is the expected candidate volume for scaling decisions?
- [ ] Are there compliance requirements (GDPR, etc.)?
- [ ] What is the backup retention requirement?
- [ ] Should we add APM tooling (Datadog, etc.)?

---

*Document ID: 028-AA-AUDT*
*Generated: December 9, 2025 16:30 CST*
*Author: Claude Opus 4.5 (Intent Solutions)*
