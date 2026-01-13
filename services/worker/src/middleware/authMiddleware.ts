// Auth Middleware for Operation Hired Worker
// Phase 2: Agency-Based Multi-Tenancy

import { Request, Response, NextFunction } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { AgencyUser, AgencyUserRole } from '../types/agency.js';

// ============================================================================
// Types
// ============================================================================

export interface AuthenticatedRequest extends Request {
  auth?: {
    uid: string;
    email?: string;
    agencyId: string;
    role: AgencyUserRole;
  };
}

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * Verify Firebase ID token and attach user info to request
 * This middleware extracts the token but doesn't require authentication
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    // No token provided - continue without auth
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get agency user record
    const db = getFirestore();
    const agencyUserDoc = await db.collection('agencyUsers').doc(decodedToken.uid).get();

    if (!agencyUserDoc.exists) {
      // User exists in Firebase Auth but not in agencyUsers
      // Continue without agency context
      req.auth = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        agencyId: '',
        role: 'viewer' as AgencyUserRole,
      };
      return next();
    }

    const agencyUser = agencyUserDoc.data() as AgencyUser;

    req.auth = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      agencyId: agencyUser.agencyId,
      role: agencyUser.role,
    };

    next();
  } catch (error) {
    // Invalid token - continue without auth
    console.warn('[authMiddleware] Invalid token:', error);
    next();
  }
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No authorization token provided' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get agency user record
    const db = getFirestore();
    const agencyUserDoc = await db.collection('agencyUsers').doc(decodedToken.uid).get();

    if (!agencyUserDoc.exists) {
      res.status(403).json({ error: 'User not associated with any agency' });
      return;
    }

    const agencyUser = agencyUserDoc.data() as AgencyUser;

    // Check if agency is active
    const agencyDoc = await db.collection('agencies').doc(agencyUser.agencyId).get();
    if (!agencyDoc.exists) {
      res.status(403).json({ error: 'Agency not found' });
      return;
    }

    const agency = agencyDoc.data();
    if (agency?.status === 'suspended') {
      res.status(403).json({ error: 'Agency account is suspended' });
      return;
    }

    req.auth = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      agencyId: agencyUser.agencyId,
      role: agencyUser.role,
    };

    next();
  } catch (error) {
    console.error('[authMiddleware] Token verification failed:', error);
    res.status(401).json({ error: 'Invalid authorization token' });
  }
}

/**
 * Require admin or owner role
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.auth.role !== 'admin' && req.auth.role !== 'owner') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

/**
 * Require owner role
 */
export function requireOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.auth.role !== 'owner') {
    res.status(403).json({ error: 'Owner access required' });
    return;
  }

  next();
}

/**
 * Validate that the request is for the user's own agency
 */
export function validateAgencyAccess(agencyIdParam: string = 'agencyId') {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const requestedAgencyId = req.params[agencyIdParam] || req.body?.agencyId;

    if (!requestedAgencyId) {
      res.status(400).json({ error: 'Agency ID required' });
      return;
    }

    if (req.auth.agencyId !== requestedAgencyId) {
      res.status(403).json({ error: 'Access denied to this agency' });
      return;
    }

    next();
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user can perform write operations (not viewer)
 */
export function canWrite(req: AuthenticatedRequest): boolean {
  return req.auth?.role !== 'viewer';
}

/**
 * Check if user is admin or owner
 */
export function isAdminOrOwner(req: AuthenticatedRequest): boolean {
  return req.auth?.role === 'admin' || req.auth?.role === 'owner';
}
