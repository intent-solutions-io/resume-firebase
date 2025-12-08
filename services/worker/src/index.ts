import express from 'express';
import helmet from 'helmet';
import { processCaseHandler } from './handlers/processCase.js';
import { generateArtifactHandler } from './handlers/generateArtifact.js';
import { healthRouter } from './handlers/health.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// Health check
app.use('/health', healthRouter);

// Internal endpoints (Cloud Tasks targets)
app.post('/internal/processCase', processCaseHandler);
app.post('/internal/generateArtifact', generateArtifactHandler);

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
