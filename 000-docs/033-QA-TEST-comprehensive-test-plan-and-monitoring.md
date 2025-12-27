# Comprehensive Test Plan and Monitoring Strategy

**Document ID:** 033
**Type:** QA-TEST
**Project:** Operation Hired - Resume Generator
**Created:** 2025-12-22
**Status:** Active

## Executive Summary

This document defines the comprehensive testing and monitoring strategy for the Operation Hired resume generator application, covering local test suites, Google Cloud error logging, and end-to-end validation workflows.

## Table of Contents

1. [Testing Architecture](#testing-architecture)
2. [Local Test Suite](#local-test-suite)
3. [Cloud Logging Strategy](#cloud-logging-strategy)
4. [Test Coverage Requirements](#test-coverage-requirements)
5. [Monitoring and Alerting](#monitoring-and-alerting)
6. [Implementation Checklist](#implementation-checklist)

---

## Testing Architecture

### Three-Layer Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: Unit Tests                       │
│  - Component logic (React hooks, utilities)                  │
│  - Service functions (Firestore, Storage, Vertex AI)         │
│  - Schema validation (Zod)                                   │
│  - Coverage target: 80%+                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              LAYER 2: Integration Tests                      │
│  - API endpoint flows                                        │
│  - Firestore + Storage interactions                         │
│  - Document processing pipeline                             │
│  - Coverage target: Critical paths 100%                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               LAYER 3: E2E Tests (Manual)                    │
│  - Full user journey (intake → documents → resume)          │
│  - Cross-browser testing                                    │
│  - Mobile responsiveness                                    │
│  - Production smoke tests                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Local Test Suite

### Frontend Tests (Vitest + React Testing Library)

**Location:** `frontend/src/__tests__/`

#### Test Categories

1. **Component Tests**
   ```typescript
   // frontend/src/__tests__/components/DocumentUpload.test.tsx
   describe('DocumentUpload', () => {
     it('should handle file selection and upload', async () => {
       // Test file selection UI
       // Test upload progress tracking
       // Test error handling
     });

     it('should prevent duplicate uploads with unique IDs', async () => {
       // Verify unique ID generation
       // Verify React key stability
     });

     it('should validate file types and sizes', async () => {
       // Test PDF/DOCX/TXT acceptance
       // Test file size limits (10MB)
     });
   });
   ```

2. **Page Integration Tests**
   ```typescript
   // frontend/src/__tests__/pages/IntakeCompletePage.test.tsx
   describe('IntakeCompletePage', () => {
     it('should NOT set docs_uploaded status when no documents exist', async () => {
       // Mock candidate with status='created'
       // Mock empty documents array
       // Verify status remains 'created'
       // REGRESSION TEST FOR ISSUE #6
     });

     it('should set docs_uploaded status when documents exist', async () => {
       // Mock candidate with status='created'
       // Mock documents array with items
       // Verify status updates to 'docs_uploaded'
     });

     it('should display processing status correctly', async () => {
       // Test all status states
       // Verify progress feedback
     });
   });
   ```

3. **Firestore Service Tests**
   ```typescript
   // frontend/src/__tests__/lib/firestore.test.ts
   describe('Firestore Service', () => {
     it('should validate candidate data with Zod schema', async () => {
       // Test schema validation
       // Test error messages
     });

     it('should handle concurrent updates safely', async () => {
       // Test race conditions
       // Test transaction behavior
     });
   });
   ```

#### Vitest Configuration

**File:** `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

**File:** `frontend/src/__tests__/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));
```

### Worker Tests (Vitest + Node.js)

**Location:** `services/worker/src/__tests__/`

#### Test Categories

1. **Document Processing Tests**
   ```typescript
   // services/worker/src/__tests__/services/textExtraction.test.ts
   describe('Text Extraction', () => {
     it('should extract text from PDF', async () => {
       // Test PDF parsing
       // Verify text quality
     });

     it('should extract text from DOCX', async () => {
       // Test DOCX parsing
     });

     it('should handle corrupted files gracefully', async () => {
       // Test error handling
     });
   });
   ```

2. **Resume Generation Tests**
   ```typescript
   // services/worker/src/__tests__/services/vertex.test.ts
   describe('Vertex AI Integration', () => {
     it('should generate candidate profile from military docs', async () => {
       // Mock Vertex AI response
       // Validate schema compliance
     });

     it('should handle API errors with retry logic', async () => {
       // Test quota errors
       // Test rate limiting
     });
   });
   ```

3. **Export Tests**
   ```typescript
   // services/worker/src/__tests__/services/exportResume.test.ts
   describe('Resume Export', () => {
     it('should generate valid PDF with Puppeteer', async () => {
       // Test PDF generation
       // Verify file size < 5MB
     });

     it('should generate valid DOCX', async () => {
       // Test DOCX structure
       // Verify sections present
     });
   });
   ```

---

## Cloud Logging Strategy

### Google Cloud Logging Configuration

#### Structured Logging Format

All logs should use JSON structured logging for queryability:

```typescript
// services/worker/src/utils/logger.ts
import { Logging } from '@google-cloud/logging';

const logging = new Logging({
  projectId: process.env.GCP_PROJECT_ID,
});

const log = logging.log('resume-worker');

export const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    const entry = log.entry(
      {
        severity: 'INFO',
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: 'resume-worker-dev',
          },
        },
      },
      {
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    );
    return log.write(entry);
  },

  error: (message: string, error: Error, metadata?: Record<string, any>) => {
    const entry = log.entry(
      {
        severity: 'ERROR',
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: 'resume-worker-dev',
          },
        },
      },
      {
        message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    );
    return log.write(entry);
  },

  warn: (message: string, metadata?: Record<string, any>) => {
    const entry = log.entry(
      {
        severity: 'WARNING',
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: 'resume-worker-dev',
          },
        },
      },
      {
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    );
    return log.write(entry);
  },
};
```

#### Critical Log Points

1. **Document Upload**
   ```typescript
   logger.info('Document upload started', {
     candidateId,
     fileCount: files.length,
     totalSize: files.reduce((sum, f) => sum + f.size, 0),
   });
   ```

2. **Processing Pipeline**
   ```typescript
   logger.info('Resume processing started', {
     candidateId,
     documentCount,
     status: 'processing',
   });
   ```

3. **Errors**
   ```typescript
   logger.error('Vertex AI generation failed', error, {
     candidateId,
     retryCount,
     quotaRemaining,
   });
   ```

4. **Performance Metrics**
   ```typescript
   logger.info('Resume export completed', {
     candidateId,
     duration: Date.now() - startTime,
     pdfSize,
     docxSize,
   });
   ```

### Log Queries for Monitoring

```bash
# View all errors in last hour
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit 50 \
  --project resume-gen-intent-dev \
  --format json

# Find slow resume generations (>30s)
gcloud logging read "jsonPayload.message='Resume export completed' AND jsonPayload.duration>30000" \
  --limit 20 \
  --project resume-gen-intent-dev

# Track document upload failures
gcloud logging read "jsonPayload.message='Document upload failed'" \
  --limit 50 \
  --project resume-gen-intent-dev

# Monitor Vertex AI quota usage
gcloud logging read "jsonPayload.message=~'Vertex AI.*quota'" \
  --project resume-gen-intent-dev
```

---

## Test Coverage Requirements

### Minimum Coverage Thresholds

| Component | Line Coverage | Branch Coverage | Function Coverage |
|-----------|---------------|-----------------|-------------------|
| Frontend Pages | 80% | 75% | 80% |
| Frontend Components | 85% | 80% | 85% |
| Frontend Services | 90% | 85% | 90% |
| Worker Services | 90% | 85% | 90% |
| Shared Schemas | 100% | 100% | 100% |

### Critical Path Coverage (Must be 100%)

1. Document upload → Firestore save
2. Status transitions (created → docs_uploaded → processing → resume_ready)
3. Resume generation → PDF/DOCX export
4. Error handling and rollback

---

## Monitoring and Alerting

### Cloud Monitoring Alerts

#### 1. High Error Rate Alert

```yaml
alert_policy:
  display_name: "Resume Worker - High Error Rate"
  conditions:
    - display_name: "Error rate > 5% in 5 minutes"
      condition_threshold:
        filter: |
          resource.type="cloud_run_revision"
          resource.labels.service_name="resume-worker-dev"
          severity="ERROR"
        comparison: COMPARISON_GT
        threshold_value: 5
        duration: 300s
  notification_channels:
    - projects/resume-gen-intent-dev/notificationChannels/slack-operation-hired
```

#### 2. Vertex AI Quota Alert

```yaml
alert_policy:
  display_name: "Vertex AI - Approaching Quota Limit"
  conditions:
    - display_name: "Quota usage > 80%"
      condition_threshold:
        filter: |
          metric.type="serviceruntime.googleapis.com/quota/rate/net_usage"
          resource.labels.service="aiplatform.googleapis.com"
        comparison: COMPARISON_GT
        threshold_value: 0.8
        duration: 60s
```

#### 3. Cold Start Latency Alert

```yaml
alert_policy:
  display_name: "Resume Worker - Cold Start > 10s"
  conditions:
    - display_name: "Startup latency threshold"
      condition_threshold:
        filter: |
          resource.type="cloud_run_revision"
          metric.type="run.googleapis.com/request_latencies"
        comparison: COMPARISON_GT
        threshold_value: 10000
        duration: 60s
```

### Health Check Dashboard

**GCP Console URL:**
https://console.cloud.google.com/monitoring/dashboards/custom?project=resume-gen-intent-dev

**Key Metrics:**

1. **Request Count** (requests/minute)
2. **Error Rate** (errors/total requests)
3. **P50/P95/P99 Latency** (ms)
4. **Memory Usage** (MB)
5. **CPU Utilization** (%)
6. **Vertex AI Quota Remaining** (requests/day)
7. **Storage Upload Success Rate** (%)

---

## Implementation Checklist

### Phase 1: Local Test Infrastructure (Priority: HIGH)

- [ ] Create `frontend/vitest.config.ts`
- [ ] Create `frontend/src/__tests__/setup.ts`
- [ ] Install testing dependencies:
  ```bash
  cd frontend
  npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom
  ```
- [ ] Create mock Firebase services
- [ ] Write IntakeCompletePage regression test for issue #6
- [ ] Write DocumentUpload component tests
- [ ] Achieve 80% coverage on critical paths

### Phase 2: Worker Test Infrastructure (Priority: HIGH)

- [ ] Create `services/worker/vitest.config.ts`
- [ ] Create `services/worker/src/__tests__/setup.ts`
- [ ] Write text extraction tests
- [ ] Write Vertex AI integration tests (with mocks)
- [ ] Write PDF/DOCX export tests
- [ ] Achieve 90% coverage on services

### Phase 3: Cloud Logging Integration (Priority: HIGH)

- [ ] Add `@google-cloud/logging` dependency to worker
- [ ] Create structured logger utility
- [ ] Add log points at critical operations:
  - [ ] Document upload start/complete/error
  - [ ] Processing start/complete/error
  - [ ] Vertex AI calls (with quota tracking)
  - [ ] Export generation (with performance metrics)
- [ ] Test log queries in Cloud Console
- [ ] Verify log retention (30 days default)

### Phase 4: Monitoring and Alerts (Priority: MEDIUM)

- [ ] Create Cloud Monitoring dashboard
- [ ] Set up error rate alert → Slack #operation-hired
- [ ] Set up Vertex AI quota alert
- [ ] Set up cold start latency alert
- [ ] Create runbook for common issues
- [ ] Document alert response procedures

### Phase 5: CI/CD Integration (Priority: MEDIUM)

- [ ] Add test step to GitHub Actions workflow
- [ ] Require tests to pass before merge
- [ ] Add coverage reporting to PRs
- [ ] Set up automated deployment after tests pass
- [ ] Add smoke test after deployment

### Phase 6: E2E Testing (Priority: LOW)

- [ ] Create manual test script (extend 032-QA-TEST)
- [ ] Document cross-browser test matrix
- [ ] Create production smoke test checklist
- [ ] Set up visual regression testing (optional)

---

## Test Execution Commands

### Run All Tests

```bash
# Frontend tests
cd frontend
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# Worker tests
cd services/worker
npm run test
npm run test:coverage

# Shared package tests
cd packages/shared
npm run test
```

### View Coverage Reports

```bash
# Frontend coverage
open frontend/coverage/index.html

# Worker coverage
open services/worker/coverage/index.html
```

### Run Specific Test Files

```bash
# Frontend
npm run test -- IntakeCompletePage.test.tsx

# Worker
npm run test -- textExtraction.test.ts
```

---

## Success Criteria

### Definition of Done for Testing

1. ✅ All unit tests passing
2. ✅ Coverage thresholds met (80%+ frontend, 90%+ worker)
3. ✅ Integration tests cover critical paths
4. ✅ Cloud logging implemented and queryable
5. ✅ Monitoring dashboard created
6. ✅ Alerts configured and tested
7. ✅ CI/CD pipeline runs tests automatically
8. ✅ Manual E2E test script executed successfully

### Key Performance Indicators (KPIs)

- **Test Execution Time:** < 30 seconds (frontend + worker)
- **Coverage Stability:** No regressions below thresholds
- **Error Detection Rate:** 95% of bugs caught by tests before production
- **Mean Time to Detection (MTTD):** < 5 minutes (via alerts)
- **Mean Time to Resolution (MTTR):** < 30 minutes (via logs + tests)

---

## Appendix A: Test Data Fixtures

### Sample Candidate Data

```typescript
// frontend/src/__tests__/fixtures/candidate.ts
export const mockCandidate = {
  id: 'test-candidate-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0100',
  branch: 'Army',
  rank: 'E-5',
  mos: '11B - Infantryman',
  yearsOfService: 5,
  status: 'created',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

export const mockCandidateWithDocs = {
  ...mockCandidate,
  status: 'docs_uploaded',
};

export const mockDocument = {
  id: 'test-doc-456',
  candidateId: 'test-candidate-123',
  fileName: 'dd214.pdf',
  fileType: 'application/pdf',
  fileSize: 1024000, // 1MB
  storagePath: 'candidates/test-candidate-123/documents/dd214.pdf',
  uploadedAt: new Date('2025-01-01T01:00:00Z'),
};
```

---

## Appendix B: Cloud Logging Labels

### Standard Label Schema

```typescript
interface LogMetadata {
  // Required
  candidateId: string;
  operation: string;  // 'upload' | 'process' | 'export' | 'notify'

  // Optional
  userId?: string;
  requestId?: string;
  duration?: number;  // milliseconds
  errorCode?: string;
  retryCount?: number;

  // Performance
  memoryUsedMb?: number;
  cpuUsedPercent?: number;

  // Business Metrics
  documentCount?: number;
  resumeFormat?: 'pdf' | 'docx';
  exportSize?: number;  // bytes
}
```

---

**Document End**
