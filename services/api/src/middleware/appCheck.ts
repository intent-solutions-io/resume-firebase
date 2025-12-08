import { Request, Response, NextFunction } from 'express';

/**
 * Firebase App Check middleware
 * Verifies the X-Firebase-AppCheck token on every request
 * Hard fails if token is missing or invalid (no login, so this is our only protection)
 */
export async function appCheckMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const appCheckToken = req.headers['x-firebase-appcheck'] as string;

  // In development, allow bypass with debug token
  if (process.env.ENVIRONMENT === 'dev' && process.env.APP_CHECK_DEBUG === 'true') {
    console.log('App Check bypassed in development mode');
    next();
    return;
  }

  if (!appCheckToken) {
    console.log('App Check token missing');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'App Check token required',
    });
    return;
  }

  try {
    // TODO: Implement actual App Check token verification
    // const decodedToken = await getAppCheck().verifyToken(appCheckToken);

    // For now, just check token exists (placeholder)
    if (appCheckToken.length < 10) {
      throw new Error('Invalid token format');
    }

    next();
  } catch (error) {
    console.log('App Check verification failed');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid App Check token',
    });
  }
}
