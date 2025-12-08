# Phase 1 Scope - Public MVP Spine

**Document Type:** Product & Project (PP-PROD)
**Project:** Resume Generator
**Phase:** 1 - MVP Spine
**Created:** 2025-12-07 19:50 CST

---

## Overview

Phase 1 delivers the minimum viable product (MVP) for the Resume Generator - a public (no-login) web application that allows users to upload documents and receive AI-generated resumes.

## Objectives

1. Build Firebase Hosting frontend (React + Vite)
2. Build Cloud Run API service (TypeScript)
3. Build Cloud Run Worker service (TypeScript)
4. Create shared packages for types and schemas
5. Implement abuse controls (App Check + rate limiting)

## Key Constraint: No Login

This MVP operates without user authentication:
- **Access control**: Case ID acts as access token
- **Abuse prevention**: Firebase App Check + reCAPTCHA
- **Rate limiting**: IP-based and token-based limits
- **Data isolation**: Users can only access their own case by ID

## Deliverables

### A) Frontend (Firebase Hosting)

| Page | Purpose |
|------|---------|
| Home | Landing page with value proposition |
| Create Case | Collect name, email, target role |
| Upload | Multi-file upload interface |
| Status | Real-time processing status |
| Download | Artifact download links |

### B) API Service (Cloud Run)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/v1/cases` | POST | Create new case |
| `/v1/cases/{id}/uploads:request` | POST | Get signed upload URLs |
| `/v1/cases/{id}` | GET | Get case status |
| `/v1/cases/{id}/artifacts/{aid}/download` | GET | Get download URL |

### C) Worker Service (Cloud Run)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/internal/processCase` | POST | Process case (Cloud Tasks) |
| `/internal/generateArtifact` | POST | Generate artifact (Cloud Tasks) |

### D) Shared Packages

| Package | Contents |
|---------|----------|
| `@resume-generator/shared` | Types, Zod schemas |

## Processing Pipeline

```
1. User creates case → Firestore record
2. User requests upload URLs → Signed GCS URLs
3. User uploads files → GCS raw bucket
4. User triggers processing → Cloud Tasks queue
5. Worker extracts text → PDF/DOCX parsing
6. Worker calls Vertex AI → Resume JSON generation
7. Worker stores artifact → GCS artifacts bucket
8. User downloads resume → Signed download URL
```

## Success Criteria

- [ ] All frontend pages functional
- [ ] All API endpoints operational
- [ ] Worker processes cases successfully
- [ ] App Check verification working
- [ ] Rate limiting enforced
- [ ] No PII in logs
- [ ] Tests pass
- [ ] Build succeeds

---

**Generated:** 2025-12-07 19:50 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
