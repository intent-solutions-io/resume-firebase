# Phase 1 Architecture - Public MVP Spine

**Document Type:** Architecture & Technical (AT-ARCH)
**Project:** Resume Generator
**Phase:** 1 - MVP Spine
**Created:** 2025-12-07 19:55 CST

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            User Browser                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Firebase Hosting (React + Vite)                              │   │
│  │  - App Check token included in all requests                   │   │
│  │  - Polls status endpoint                                      │   │
│  │  - Downloads via signed URLs                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Cloud Run - API Service                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Express.js (TypeScript)                                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │ App Check  │  │ Rate       │  │ Cases Router           │  │   │
│  │  │ Middleware │→ │ Limiter    │→ │ - POST /v1/cases       │  │   │
│  │  │            │  │            │  │ - GET /v1/cases/{id}   │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│   Firestore     │  │ Cloud Storage   │  │    Cloud Tasks          │
│   - cases       │  │ - raw uploads   │  │    - processing queue   │
│   - documents   │  │ - artifacts     │  │    - artifact queue     │
│   - artifacts   │  │ (signed URLs)   │  │                         │
│   - events      │  │                 │  │                         │
└─────────────────┘  └─────────────────┘  └─────────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Cloud Run - Worker Service                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Express.js (TypeScript) - Internal Only                      │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │ /internal/processCase                                   │   │   │
│  │  │ 1. Load case + documents                                │   │   │
│  │  │ 2. Download files from GCS                              │   │   │
│  │  │ 3. Extract text (PDF/DOCX)                              │   │   │
│  │  │ 4. Call Vertex AI Gemini                                │   │   │
│  │  │ 5. Store resume.json artifact                           │   │   │
│  │  │ 6. Update Firestore status                              │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Vertex AI                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Gemini 1.5 Flash                                             │   │
│  │  - Resume generation from extracted text                      │   │
│  │  - Structured JSON output                                     │   │
│  │  - temperature: 0.3, topP: 0.8                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Model (Firestore)

### cases Collection

```typescript
interface Case {
  id: string;           // UUID
  name: string;         // User name (not logged, stored encrypted at rest)
  email: string;        // User email (for notifications, not logged)
  targetRole?: string;  // Target job role
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep?: string; // Current processing step
  progress?: number;    // 0-100
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}
```

### case_documents Collection

```typescript
interface CaseDocument {
  id: string;           // UUID
  caseId: string;       // Reference to case
  fileName: string;     // Original filename
  status: 'pending' | 'uploaded' | 'processed' | 'failed';
  uploadedAt: string;   // ISO timestamp
  processedAt?: string; // ISO timestamp
}
```

### case_artifacts Collection

```typescript
interface CaseArtifact {
  id: string;           // UUID
  caseId: string;       // Reference to case
  name: string;         // Display name
  fileName: string;     // Storage filename
  type: 'resume_json' | 'resume_pdf';
  size: number;         // Bytes
  createdAt: string;    // ISO timestamp
}
```

### case_events Collection

```typescript
interface CaseEvent {
  id: string;           // Auto-generated
  caseId: string;       // Reference to case
  type: string;         // Event type
  status?: string;      // Status at time of event
  timestamp: string;    // ISO timestamp
  details?: object;     // Additional metadata (no PII)
}
```

## Storage Layout

```
gs://{project}-raw-uploads-{env}/
└── cases/
    └── {caseId}/
        └── raw/
            └── {documentId}/
                └── {fileName}

gs://{project}-artifacts-{env}/
└── cases/
    └── {caseId}/
        └── artifacts/
            └── {artifactId}/
                └── {fileName}
```

## Security Architecture

### Abuse Prevention Layers

```
Layer 1: Firebase App Check
├── reCAPTCHA v3 verification
├── Token required for all API calls
└── Hard fail if missing/invalid

Layer 2: Rate Limiting
├── Global: 100 req/15min per IP
├── Create case: 10/hour per IP
└── Upload URLs: 50/15min per IP

Layer 3: File Validation
├── Max file size: 10MB
├── Max files per case: 10
└── Allowed types: PDF, DOC, DOCX, TXT

Layer 4: Signed URLs
├── Upload URLs: 15 min TTL
├── Download URLs: 1 hour TTL
└── No direct bucket access
```

### No-Login Security Model

```
┌────────────────────────────────────────────────────────────────┐
│ Case ID = Access Token                                          │
│                                                                 │
│ - UUID v4 (122 bits of entropy)                                │
│ - Unguessable without brute force                              │
│ - Only way to access case data                                 │
│ - Share case ID = share access                                 │
│                                                                 │
│ Tradeoffs:                                                      │
│ - Pro: Simple, no auth infrastructure                          │
│ - Pro: Easy sharing for collaboration                          │
│ - Con: Anyone with link can access                             │
│ - Con: No password protection                                  │
│                                                                 │
│ Mitigation:                                                     │
│ - Cases auto-expire after 90 days                              │
│ - No PII exposed in case data                                  │
│ - Rate limiting prevents enumeration                           │
└────────────────────────────────────────────────────────────────┘
```

## Resume JSON Schema (federal_basic)

```typescript
interface ResumeJson {
  metadata: {
    version: string;
    generatedAt: string;
    targetRole?: string;
  };
  contact: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillsSection;
  projects?: ProjectEntry[];
}
```

## Processing Pipeline Details

### Step 1: Case Creation
```
API receives POST /v1/cases
├── Validate input (Zod schema)
├── Generate UUID
├── Create Firestore document
├── Return caseId
└── Log: "Case created: {caseId}" (no PII)
```

### Step 2: Upload URL Generation
```
API receives POST /v1/cases/{id}/uploads:request
├── Verify case exists
├── Generate document UUIDs
├── Create signed upload URLs (15 min TTL)
├── Create document records in Firestore
└── Return URLs and document IDs
```

### Step 3: File Upload
```
User uploads directly to signed URL
├── GCS validates content length
├── File stored in raw bucket
└── User confirms upload complete
```

### Step 4: Processing Trigger
```
API receives POST /v1/cases/{id}/process
├── Verify case exists
├── Create Cloud Tasks task
├── Update status to 'processing'
└── Return immediately
```

### Step 5: Worker Processing
```
Worker receives task
├── Load case and documents
├── Download files from GCS
├── Extract text (pdf-parse, basic DOCX)
├── Build Gemini prompt
├── Call Vertex AI
├── Parse JSON response
├── Store artifact in GCS
├── Create artifact record
└── Update status to 'completed'
```

---

**Generated:** 2025-12-07 19:55 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
