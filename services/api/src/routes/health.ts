import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
  });
});

router.get('/ready', (_req, res) => {
  // TODO: Add actual readiness checks (Firestore, Storage, etc.)
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };
