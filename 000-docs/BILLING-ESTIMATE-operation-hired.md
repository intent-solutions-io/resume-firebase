# Operation Hired - Scope of Work & Billing Estimate

**Client:** Wendon / Operation Hired
**Project:** AI-Powered Military-to-Civilian Resume Generator
**Date Range:** December 7, 2025 - January 7, 2026 (16 active days)
**Total Commits:** 105

---

## Executive Summary

Built a production-grade AI resume generation platform from scratch, including React frontend, Cloud Run backend, Vertex AI integration, and automated PDF/DOCX export pipeline. The system generates 3 resume variants (Military, Civilian, Crosswalk) with ATS optimization.

---

## Scope of Work Breakdown

### Phase 1: Infrastructure & Foundation (Est. 24 hrs)

| Task | Description | Hours |
|------|-------------|-------|
| GCP Project Setup | Firebase project, Cloud Run, Artifact Registry, IAM | 3 |
| Terraform IaC | 12 HCL files, 1,440 lines - infra as code | 6 |
| CI/CD Pipeline | GitHub Actions, Workload Identity Federation | 4 |
| Docker Multi-Stage Build | Optimized container with Chromium for PDF | 4 |
| Firebase Hosting | Custom domain, hosting config | 2 |
| Firestore Schema | Collections design, security rules | 3 |
| Storage Rules | Firebase Storage for documents/exports | 2 |

### Phase 2: Backend Worker Service (Est. 40 hrs)

| Task | Description | Hours |
|------|-------------|-------|
| Express API Server | Routes, middleware, health checks | 4 |
| Document Text Extraction | PDF/DOCX/TXT parsing (pdf-parse, mammoth) | 6 |
| Vertex AI Integration | Gemini 2.5 Flash, prompt engineering | 12 |
| 3-PDF Resume Bundle | Military/Civilian/Crosswalk generation | 8 |
| PDF Generation | Puppeteer + Chromium HTML-to-PDF | 6 |
| DOCX Export | Native Word document generation | 4 |

### Phase 3: AI Prompt Engineering (Est. 20 hrs)

| Task | Description | Hours |
|------|-------------|-------|
| Profile Extraction Prompt | Military doc parsing, structured output | 4 |
| Resume Generation Prompt | Civilian translation, metrics preservation | 6 |
| ATS Keyword Optimization | Keyword injection pipeline | 4 |
| Format Enforcement | Strict HTML/CSS output rules | 4 |
| Iterative Refinement | 8+ major prompt rewrites | 2 |

### Phase 4: Frontend Application (Est. 28 hrs)

| Task | Description | Hours |
|------|-------------|-------|
| React + TypeScript Setup | Vite, routing, state management | 4 |
| Intake Flow (3-step wizard) | Candidate info, documents, completion | 8 |
| Admin Console | Candidate list, detail view, filtering | 6 |
| File Upload Component | Drag-drop, progress, validation | 4 |
| Download Interface | PDF/DOCX download with signed URLs | 3 |
| UI/UX Polish | Branding, responsive design | 3 |

### Phase 5: Testing & QA (Est. 16 hrs)

| Task | Description | Hours |
|------|-------------|-------|
| Unit Tests | Vitest test suite (96 tests) | 6 |
| E2E Test Suite | Playwright full-flow tests | 6 |
| ATS Validation | Keyword coverage, banned phrase checks | 2 |
| Manual QA | Cross-browser, mobile testing | 2 |

### Phase 6: Integrations (Est. 8 hrs)

| Task | Description | Hours |
|------|-------------|-------|
| Slack Notifications | Webhook to #operation-hired channel | 3 |
| Email Notifications | SendGrid integration (setup guide) | 3 |
| Deduplication Logic | Prevent duplicate notifications | 2 |

### Phase 7: Bug Fixes & Refinements (Est. 12 hrs)

| Task | Description | Hours |
|------|-------------|-------|
| Header Formatting | Centered layout enforcement | 3 |
| JSON Escaping | Malformed AI response handling | 2 |
| Type System Fixes | TypeScript strict mode compliance | 3 |
| Production Hotfixes | 6 urgent demo fixes | 4 |

---

## Total Hours Summary

| Category | Hours |
|----------|-------|
| Infrastructure & Foundation | 24 |
| Backend Worker Service | 40 |
| AI Prompt Engineering | 20 |
| Frontend Application | 28 |
| Testing & QA | 16 |
| Integrations | 8 |
| Bug Fixes & Refinements | 12 |
| **TOTAL** | **148 hrs** |

---

## Billing Options

### Option A: Fixed Project Rate (High-End)

| Item | Rate | Total |
|------|------|-------|
| Senior Full-Stack Development | $175/hr x 148 hrs | $25,900 |
| AI/ML Engineering Premium | +25% | $6,475 |
| Cloud Architecture | included | - |
| **Total** | | **$32,375** |

### Option B: Blended Rate

| Item | Rate | Total |
|------|------|-------|
| Development Hours | $150/hr x 148 hrs | $22,200 |
| Infrastructure (Terraform) | $200/hr x 12 hrs | $2,400 |
| **Total** | | **$24,600** |

### Option C: Value-Based (MVP Delivery)

| Deliverable | Value |
|-------------|-------|
| Production Resume Generator MVP | $18,000 |
| 3-PDF Bundle Feature | $4,000 |
| ATS Optimization Pipeline | $3,000 |
| Admin Console | $2,500 |
| E2E Test Suite | $1,500 |
| **Total** | **$29,000** |

---

## Subscription Model (Ongoing)

### Tier 1: Maintenance & Support
**$1,500/month**
- Bug fixes and patches
- Security updates
- Up to 8 hrs/month support
- 48-hr response SLA

### Tier 2: Growth
**$3,500/month**
- Everything in Tier 1
- Up to 20 hrs/month development
- New feature development
- Performance optimization
- 24-hr response SLA

### Tier 3: Scale
**$6,500/month**
- Everything in Tier 2
- Up to 40 hrs/month development
- Dedicated availability
- Architecture consulting
- Priority feature requests
- Same-day response SLA

---

## Cloud Costs (Estimated Monthly)

| Service | Est. Cost |
|---------|-----------|
| Cloud Run (worker) | $50-150 |
| Vertex AI (Gemini) | $100-300 |
| Firebase Hosting | $0-25 |
| Firebase Storage | $10-50 |
| Firestore | $25-75 |
| **Total** | **$185-600/month** |

*Scales with usage - currently in free tier for dev.*

---

## Deliverables Included

1. Full source code (GitHub repo)
2. Terraform infrastructure as code
3. CI/CD pipelines (GitHub Actions)
4. Technical documentation (CLAUDE.md)
5. Test suites (unit + E2E)
6. Deployment runbooks
7. Architecture diagrams

---

## Technical Stack Delivered

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Node.js 20, Express, Cloud Run
- **AI:** Vertex AI Gemini 2.5 Flash
- **Database:** Firestore
- **Storage:** Firebase Storage
- **PDF:** Puppeteer + Chromium
- **IaC:** Terraform (12 modules)
- **CI/CD:** GitHub Actions + WIF
- **Testing:** Vitest + Playwright

---

*Prepared by: Jeremy Longshore / Intent Solutions*
*Date: January 7, 2026*
