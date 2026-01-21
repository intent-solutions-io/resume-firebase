// Initialize Firebase Admin first (before other imports)
import { initializeApp, applicationDefault } from 'firebase-admin/app';

initializeApp({
  credential: applicationDefault(),
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { correlationIdMiddleware } from './middleware/correlationId.js';
import { processCaseHandler } from './handlers/processCase.js';
import { generateArtifactHandler } from './handlers/generateArtifact.js';
import { healthRouter } from './handlers/health.js';
// Operation Hired - Phase 1.9: AI Resume Pipeline + Phase 2.0: Resume Export
import {
  processCandidateHandler,
  candidateStatusHandler,
  resumeDownloadHandler,
  resumeBundleDownloadHandler,
} from './handlers/processCandidateHandler.js';
// PROTOTYPE: 3-PDF Resume Bundle (Checkpoint 1)
import { prototypeThreePdfHandler } from './handlers/prototypeThreePdfHandler.js';
// NEW: JSON → DOCX direct generation (no HTML/Puppeteer)
import { generateDocxHandler } from './handlers/generateDocxHandler.js';
// Phase 4: Agency Onboarding API
import { agencyRouter } from './handlers/agencyHandler.js';
// Cloud Tasks handler for async retry processing
import { taskProcessCandidateHandler } from './handlers/taskHandler.js';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration - allow frontend to access API
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://resume-gen-intent-dev.web.app',
    'https://resume-gen-intent-dev.firebaseapp.com',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
  exposedHeaders: ['X-Correlation-ID'],
  credentials: true,
};

// Security middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// Correlation ID for request tracing
app.use(correlationIdMiddleware);

// Health check
app.use('/health', healthRouter);

// Internal endpoints (Cloud Tasks targets)
app.post('/internal/processCase', processCaseHandler);
app.post('/internal/generateArtifact', generateArtifactHandler);

// Operation Hired endpoints (Phase 1.9 + 2.0 + 3-PDF Bundle)
app.post('/internal/processCandidate', processCandidateHandler);
app.get('/internal/candidateStatus/:candidateId', candidateStatusHandler);
app.get('/internal/resumeDownload/:candidateId/bundle', resumeBundleDownloadHandler);
app.get('/internal/resumeDownload/:candidateId/:format', resumeDownloadHandler);

// PROTOTYPE: 3-PDF Resume Bundle Testing (Checkpoint 1)
app.post('/internal/prototype/threePdf', prototypeThreePdfHandler);

// NEW: JSON → DOCX direct generation (no HTML/Puppeteer)
app.post('/internal/generateDocx', generateDocxHandler);

// Phase 4: Agency Onboarding API
app.use('/api/agencies', agencyRouter);
app.use('/api', agencyRouter);  // For /api/invitations routes

// Cloud Tasks handler (async retry processing)
app.post('/internal/tasks/processCandidate', taskProcessCandidateHandler);

// Error handling with correlation ID
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const correlationId = req.correlationId || 'unknown';

    // Log error with correlation ID
    console.error(`[${correlationId}] Worker error:`, {
      name: error.name,
      message: error.message,
      path: req.path,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Processing failed',
      correlationId,
      retryable: true,
    });
  }
);

app.listen(PORT, () => {
  console.log(`Worker server listening on port ${PORT}`);
});

export { app };
