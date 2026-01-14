// Agency API Handler
// Phase 4: Agency Onboarding

import { Router, Request, Response } from 'express';
import { getFirestore, Timestamp, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
  inviteUser,
  acceptInvitation,
  getAgencyUsers,
  getAgencyById,
} from '../services/agencyService.js';
import {
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/authMiddleware.js';

const router = Router();

// Lazy initialization to ensure Firebase is initialized first
let _db: Firestore | null = null;
function db(): Firestore {
  if (!_db) {
    _db = getFirestore();
  }
  return _db;
}

/**
 * POST /api/agencies
 * Create a new agency with owner account
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, slug, contactEmail, ownerName, ownerEmail, password } = req.body;

    // Validate required fields
    if (!name || !slug || !ownerEmail || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      res.status(400).json({ error: 'Invalid slug format' });
      return;
    }

    // Validate password
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if slug is already taken
    const existingAgency = await db()
      .collection('agencies')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existingAgency.empty) {
      res.status(409).json({ error: 'Agency slug is already taken' });
      return;
    }

    // Check if email is already in use
    try {
      await getAuth().getUserByEmail(ownerEmail);
      res.status(409).json({ error: 'Email is already registered' });
      return;
    } catch {
      // User doesn't exist - good, we can proceed
    }

    // Create Firebase Auth user
    const userRecord = await getAuth().createUser({
      email: ownerEmail,
      password,
      displayName: ownerName || `Admin - ${name}`,
      emailVerified: false,
    });

    // Create agency and owner records
    const now = Timestamp.now();
    const agencyRef = db().collection('agencies').doc();

    const agencyData = {
      name,
      slug,
      contactEmail: contactEmail || ownerEmail,
      logoUrl: null,
      status: 'trial',
      settings: {
        retentionDays: 90,
        brandColor: '#C59141',
      },
      createdAt: now,
      updatedAt: now,
    };

    const ownerData = {
      agencyId: agencyRef.id,
      email: ownerEmail,
      displayName: ownerName || `Admin - ${name}`,
      role: 'owner',
      invitedBy: null,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    // Batch write
    const batch = db().batch();
    batch.set(agencyRef, agencyData);
    batch.set(db().collection('agencyUsers').doc(userRecord.uid), ownerData);
    await batch.commit();

    console.log(`[agencyHandler] Created agency: ${agencyRef.id} with owner: ${userRecord.uid}`);

    res.status(201).json({
      agency: { id: agencyRef.id, ...agencyData },
      owner: { id: userRecord.uid, ...ownerData },
    });
  } catch (error) {
    console.error('[agencyHandler] Failed to create agency:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create agency',
    });
  }
});

/**
 * GET /api/agencies/:agencyId
 * Get agency details (authenticated)
 */
router.get('/:agencyId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agencyId } = req.params;

    // Verify user belongs to this agency
    if (req.auth?.agencyId !== agencyId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const agency = await getAgencyById(agencyId);
    if (!agency) {
      res.status(404).json({ error: 'Agency not found' });
      return;
    }

    res.json({ agency });
  } catch (error) {
    console.error('[agencyHandler] Failed to get agency:', error);
    res.status(500).json({ error: 'Failed to get agency' });
  }
});

/**
 * GET /api/agencies/:agencyId/users
 * Get users for an agency (admin only)
 */
router.get(
  '/:agencyId/users',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { agencyId } = req.params;

      // Verify user belongs to this agency
      if (req.auth?.agencyId !== agencyId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const users = await getAgencyUsers(agencyId);
      res.json({ users });
    } catch (error) {
      console.error('[agencyHandler] Failed to get users:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }
);

/**
 * POST /api/agencies/:agencyId/invitations
 * Invite a user to the agency (admin only)
 */
router.post(
  '/:agencyId/invitations',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { agencyId } = req.params;
      const { email, role } = req.body;

      // Verify user belongs to this agency
      if (req.auth?.agencyId !== agencyId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Validate role
      if (!['admin', 'recruiter', 'viewer'].includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }

      const invitation = await inviteUser(
        { agencyId, email, role },
        req.auth.uid
      );

      // TODO: Send invitation email

      res.status(201).json({ invitation });
    } catch (error) {
      console.error('[agencyHandler] Failed to create invitation:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create invitation',
      });
    }
  }
);

/**
 * GET /api/invitations/:invitationId
 * Get invitation details (public with token)
 */
router.get('/invitations/:invitationId', async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ error: 'Token required' });
      return;
    }

    const inviteDoc = await db().collection('agencyInvitations').doc(invitationId).get();

    if (!inviteDoc.exists) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    const invitation = inviteDoc.data()!;

    // Verify token (simple check - in production use a proper token system)
    if (invitation.token !== token) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }

    // Check if expired
    if (invitation.status !== 'pending') {
      res.status(410).json({ error: `Invitation is ${invitation.status}` });
      return;
    }

    if (Timestamp.now().toMillis() > invitation.expiresAt.toMillis()) {
      res.status(410).json({ error: 'Invitation has expired' });
      return;
    }

    // Get agency name
    const agencyDoc = await db().collection('agencies').doc(invitation.agencyId).get();
    const agencyName = agencyDoc.exists ? agencyDoc.data()?.name : 'Unknown Agency';

    res.json({
      invitation: {
        id: invitationId,
        agencyId: invitation.agencyId,
        agencyName,
        email: invitation.email,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt.toDate().toISOString(),
      },
    });
  } catch (error) {
    console.error('[agencyHandler] Failed to get invitation:', error);
    res.status(500).json({ error: 'Failed to get invitation' });
  }
});

/**
 * POST /api/invitations/:invitationId/accept
 * Accept an invitation (authenticated)
 */
router.post(
  '/invitations/:invitationId/accept',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { invitationId } = req.params;
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Token required' });
        return;
      }

      const inviteDoc = await db().collection('agencyInvitations').doc(invitationId).get();

      if (!inviteDoc.exists) {
        res.status(404).json({ error: 'Invitation not found' });
        return;
      }

      const invitation = inviteDoc.data()!;

      // Verify token
      if (invitation.token !== token) {
        res.status(403).json({ error: 'Invalid token' });
        return;
      }

      // Accept the invitation
      const agencyUser = await acceptInvitation(invitationId, req.auth!.uid);

      res.json({ user: agencyUser });
    } catch (error) {
      console.error('[agencyHandler] Failed to accept invitation:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to accept invitation',
      });
    }
  }
);

export { router as agencyRouter };
