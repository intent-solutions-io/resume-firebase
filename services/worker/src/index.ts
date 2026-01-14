import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
// Phase 4: Agency Onboarding API
import { agencyRouter } from './handlers/agencyHandler.js';

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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Security middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

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

// Phase 4: Agency Onboarding API
app.use('/api/agencies', agencyRouter);
app.use('/api', agencyRouter);  // For /api/invitations routes

// Error handling
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    // Log error without PII
    console.error('Worker error:', {
      name: error.name,
      message: error.message,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Processing failed',
    });
  }
);

app.listen(PORT, () => {
  console.log(`Worker server listening on port ${PORT}`);
});

export { app };
