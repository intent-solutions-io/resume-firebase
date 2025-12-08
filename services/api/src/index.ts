import express from 'express';
import helmet from 'helmet';
import { casesRouter } from './routes/cases.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { appCheckMiddleware } from './middleware/appCheck.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Health check (no auth required)
app.use('/health', healthRouter);

// Rate limiting
app.use(rateLimiter);

// App Check verification for all API routes
app.use('/v1', appCheckMiddleware);

// API routes
app.use('/v1/cases', casesRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

export { app };
