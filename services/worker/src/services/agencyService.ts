// Agency Service for Operation Hired
// Phase 2: Agency-Based Multi-Tenancy

import { getFirestore, Timestamp, FieldValue, QueryDocumentSnapshot, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
  Agency,
  AgencyUser,
  AgencyUserRole,
  AgencySettings,
  AgencyInvitation,
  CreateAgencyRequest,
  InviteUserRequest,
} from '../types/agency.js';

// Lazy initialization to ensure Firebase is initialized first
let _db: Firestore | null = null;
function db(): Firestore {
  if (!_db) {
    _db = getFirestore();
  }
  return _db;
}

// ============================================================================
// Agency Operations
// ============================================================================

/**
 * Create a new agency with an owner user
 */
export async function createAgency(
  request: CreateAgencyRequest
): Promise<{ agency: Agency; owner: AgencyUser }> {
  console.log(`[agencyService] Creating agency: ${request.name}`);

  // Validate slug is unique
  const existingAgency = await db()
    .collection('agencies')
    .where('slug', '==', request.slug)
    .limit(1)
    .get();

  if (!existingAgency.empty) {
    throw new Error(`Agency slug "${request.slug}" is already taken`);
  }

  // Create agency document
  const agencyRef = db().collection('agencies').doc();
  const now = Timestamp.now();

  const defaultSettings: AgencySettings = {
    retentionDays: 90,
    maxCandidatesPerMonth: undefined,
    atsIntegration: undefined,
    brandColor: '#C59141',
    customDomain: undefined,
  };

  const agencyData: Omit<Agency, 'id'> = {
    name: request.name,
    slug: request.slug,
    contactEmail: request.contactEmail,
    logoUrl: undefined,
    status: 'trial',
    settings: defaultSettings,
    createdAt: now,
    updatedAt: now,
  };

  // Check if owner email already has a Firebase Auth account
  let ownerUid: string;
  try {
    const existingUser = await getAuth().getUserByEmail(request.ownerEmail);
    ownerUid = existingUser.uid;
  } catch {
    // User doesn't exist - create a temporary password (they'll reset it)
    const tempPassword = generateTempPassword();
    const newUser = await getAuth().createUser({
      email: request.ownerEmail,
      emailVerified: false,
      password: tempPassword,
      displayName: `Admin - ${request.name}`,
    });
    ownerUid = newUser.uid;

    // TODO: Send welcome email with password reset link
    console.log(`[agencyService] Created Firebase user for owner: ${ownerUid}`);
  }

  // Create owner user document
  const ownerData: Omit<AgencyUser, 'id'> = {
    agencyId: agencyRef.id,
    email: request.ownerEmail,
    displayName: `Admin - ${request.name}`,
    role: 'owner',
    invitedBy: undefined,
    lastLoginAt: undefined,
    createdAt: now,
    updatedAt: now,
  };

  // Batch write agency and owner
  const batch = db().batch();
  batch.set(agencyRef, agencyData);
  batch.set(db().collection('agencyUsers').doc(ownerUid), ownerData);
  await batch.commit();

  console.log(`[agencyService] Agency created: ${agencyRef.id}`);

  return {
    agency: { id: agencyRef.id, ...agencyData } as Agency,
    owner: { id: ownerUid, ...ownerData } as AgencyUser,
  };
}

/**
 * Get agency by ID
 */
export async function getAgencyById(agencyId: string): Promise<Agency | null> {
  const doc = await db().collection('agencies').doc(agencyId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Agency;
}

/**
 * Get agency by slug
 */
export async function getAgencyBySlug(slug: string): Promise<Agency | null> {
  const snapshot = await db()
    .collection('agencies')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Agency;
}

/**
 * Update agency settings
 */
export async function updateAgencySettings(
  agencyId: string,
  settings: Partial<AgencySettings>
): Promise<void> {
  await db().collection('agencies').doc(agencyId).update({
    settings: settings,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Invite a user to an agency
 */
export async function inviteUser(
  request: InviteUserRequest,
  invitedByUid: string
): Promise<AgencyInvitation> {
  console.log(`[agencyService] Inviting ${request.email} to agency ${request.agencyId}`);

  // Check if user already exists in this agency
  const existingUsers = await db()
    .collection('agencyUsers')
    .where('agencyId', '==', request.agencyId)
    .where('email', '==', request.email)
    .limit(1)
    .get();

  if (!existingUsers.empty) {
    throw new Error(`User ${request.email} is already a member of this agency`);
  }

  // Check for existing pending invitation
  const existingInvites = await db()
    .collection('agencyInvitations')
    .where('agencyId', '==', request.agencyId)
    .where('email', '==', request.email)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!existingInvites.empty) {
    throw new Error(`An invitation is already pending for ${request.email}`);
  }

  // Create invitation
  const inviteRef = db().collection('agencyInvitations').doc();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitationData: Omit<AgencyInvitation, 'id'> = {
    agencyId: request.agencyId,
    email: request.email,
    role: request.role,
    invitedBy: invitedByUid,
    status: 'pending',
    expiresAt,
    acceptedAt: undefined,
    createdAt: now,
  };

  await inviteRef.set(invitationData);

  // TODO: Send invitation email

  console.log(`[agencyService] Invitation created: ${inviteRef.id}`);

  return { id: inviteRef.id, ...invitationData };
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<AgencyUser> {
  const inviteRef = db().collection('agencyInvitations').doc(invitationId);
  const inviteDoc = await inviteRef.get();

  if (!inviteDoc.exists) {
    throw new Error('Invitation not found');
  }

  const invitation = inviteDoc.data() as AgencyInvitation;

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation is ${invitation.status}`);
  }

  if (Timestamp.now().toMillis() > (invitation.expiresAt as Timestamp).toMillis()) {
    await inviteRef.update({ status: 'expired' });
    throw new Error('Invitation has expired');
  }

  // Get the user's email from Firebase Auth
  const user = await getAuth().getUser(userId);
  if (user.email !== invitation.email) {
    throw new Error('Email does not match invitation');
  }

  // Create agency user and update invitation in a batch
  const now = Timestamp.now();
  const userData: Omit<AgencyUser, 'id'> = {
    agencyId: invitation.agencyId,
    email: invitation.email,
    displayName: user.displayName,
    role: invitation.role,
    invitedBy: invitation.invitedBy,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db().batch();
  batch.set(db().collection('agencyUsers').doc(userId), userData);
  batch.update(inviteRef, { status: 'accepted', acceptedAt: now });
  await batch.commit();

  console.log(`[agencyService] Invitation accepted: ${invitationId}`);

  return { id: userId, ...userData };
}

/**
 * Get users for an agency
 */
export async function getAgencyUsers(agencyId: string): Promise<AgencyUser[]> {
  const snapshot = await db()
    .collection('agencyUsers')
    .where('agencyId', '==', agencyId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
  })) as AgencyUser[];
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  newRole: AgencyUserRole
): Promise<void> {
  if (newRole === 'owner') {
    throw new Error('Cannot change role to owner - use transferOwnership instead');
  }

  await db().collection('agencyUsers').doc(userId).update({
    role: newRole,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Remove user from agency
 */
export async function removeUser(userId: string): Promise<void> {
  const userDoc = await db().collection('agencyUsers').doc(userId).get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const user = userDoc.data() as AgencyUser;
  if (user.role === 'owner') {
    throw new Error('Cannot remove the agency owner');
  }

  await db().collection('agencyUsers').doc(userId).delete();
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
