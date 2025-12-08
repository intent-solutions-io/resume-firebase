# Phase 1 Checklist - Public MVP Spine

**Document Type:** Project Management (PM-TASK)
**Project:** Resume Generator
**Phase:** 1 - MVP Spine
**Created:** 2025-12-07 20:00 CST

---

## Frontend (Firebase Hosting)

### Structure
- [x] `frontend/package.json`
- [x] `frontend/tsconfig.json`
- [x] `frontend/vite.config.ts`
- [x] `frontend/index.html`
- [x] `frontend/src/main.tsx`
- [x] `frontend/src/App.tsx`
- [x] `frontend/src/index.css`

### Components
- [x] `Layout.tsx` - Header, footer, navigation

### Pages
- [x] `HomePage.tsx` - Landing page
- [x] `CreateCasePage.tsx` - Case creation form
- [x] `UploadPage.tsx` - File upload interface
- [x] `StatusPage.tsx` - Processing status
- [x] `DownloadPage.tsx` - Artifact download

### Services
- [x] `api.ts` - API client service

### Types
- [x] `vite-env.d.ts` - Environment types

## API Service (Cloud Run)

### Structure
- [x] `services/api/package.json`
- [x] `services/api/tsconfig.json`
- [x] `services/api/Dockerfile`
- [x] `services/api/src/index.ts`

### Routes
- [x] `routes/health.ts` - Health check endpoints
- [x] `routes/cases.ts` - Case management endpoints

### Middleware
- [x] `middleware/appCheck.ts` - App Check verification
- [x] `middleware/rateLimiter.ts` - Rate limiting
- [x] `middleware/errorHandler.ts` - Error handling

### Services
- [x] `services/firestore.ts` - Firestore operations
- [x] `services/storage.ts` - GCS operations
- [x] `services/tasks.ts` - Cloud Tasks operations

## Worker Service (Cloud Run)

### Structure
- [x] `services/worker/package.json`
- [x] `services/worker/tsconfig.json`
- [x] `services/worker/Dockerfile`
- [x] `services/worker/src/index.ts`

### Handlers
- [x] `handlers/health.ts` - Health check
- [x] `handlers/processCase.ts` - Case processing
- [x] `handlers/generateArtifact.ts` - Artifact generation

### Services
- [x] `services/firestore.ts` - Firestore operations
- [x] `services/storage.ts` - GCS operations
- [x] `services/extraction.ts` - Text extraction
- [x] `services/gemini.ts` - Vertex AI Gemini

## Shared Packages

### Structure
- [x] `packages/shared/package.json`
- [x] `packages/shared/tsconfig.json`
- [x] `packages/shared/src/index.ts`

### Types
- [x] `types/index.ts` - Shared type definitions

### Schemas
- [x] `schemas/index.ts` - Zod validation schemas

## Validation Commands

```bash
# Frontend
cd frontend && npm install && npm run typecheck && npm run build

# API Service
cd services/api && npm install && npm run typecheck && npm run build

# Worker Service
cd services/worker && npm install && npm run typecheck && npm run build

# Shared Package
cd packages/shared && npm install && npm run typecheck && npm run build
```

## Testing Commands

```bash
# Run all tests
npm test --workspaces

# Run specific service tests
cd services/api && npm test
cd services/worker && npm test
cd packages/shared && npm test
```

## Integration Testing

- [ ] Create case via API
- [ ] Request upload URLs
- [ ] Upload test document
- [ ] Trigger processing
- [ ] Verify status updates
- [ ] Download generated resume

---

**Generated:** 2025-12-07 20:00 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
