// Firebase Auth Wrapper for Operation Hired
// Phase 2: Agency-Based Multi-Tenancy

import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Unsubscribe,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseApp, getFirestoreDb } from './firebase';

// ============================================================================
// Types
// ============================================================================

export type AgencyUserRole = 'owner' | 'admin' | 'recruiter' | 'viewer';

export interface AgencyUser {
  id: string;
  agencyId: string;
  email: string;
  displayName?: string;
  role: AgencyUserRole;
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  logoUrl?: string;
  status: 'active' | 'suspended' | 'trial';
}

export interface AuthState {
  user: User | null;
  agencyUser: AgencyUser | null;
  agency: Agency | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Auth Instance (Singleton)
// ============================================================================

let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

// ============================================================================
// Auth Operations
// ============================================================================

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Create a new user account (for invitation acceptance)
 */
export async function createAccount(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);

  // Update the user's display name
  await updateProfile(result.user, { displayName });

  return result.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return getFirebaseAuth().currentUser;
}

// ============================================================================
// Agency User Operations
// ============================================================================

/**
 * Get the AgencyUser record for the current user
 */
export async function getAgencyUser(userId: string): Promise<AgencyUser | null> {
  const db = getFirestoreDb();
  const userRef = doc(db, 'agencyUsers', userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as AgencyUser;
}

/**
 * Get the Agency record for a given agencyId
 */
export async function getAgency(agencyId: string): Promise<Agency | null> {
  const db = getFirestoreDb();
  const agencyRef = doc(db, 'agencies', agencyId);
  const snapshot = await getDoc(agencyRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Agency;
}

// ============================================================================
// Auth State Subscription
// ============================================================================

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export function subscribeToAuthState(
  callback: (state: AuthState) => void
): Unsubscribe {
  const auth = getFirebaseAuth();

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({
        user: null,
        agencyUser: null,
        agency: null,
        loading: false,
        error: null,
      });
      return;
    }

    // User is signed in - fetch agency user and agency data
    try {
      const agencyUser = await getAgencyUser(user.uid);

      if (!agencyUser) {
        callback({
          user,
          agencyUser: null,
          agency: null,
          loading: false,
          error: 'User not associated with any agency',
        });
        return;
      }

      const agency = await getAgency(agencyUser.agencyId);

      if (!agency) {
        callback({
          user,
          agencyUser,
          agency: null,
          loading: false,
          error: 'Agency not found',
        });
        return;
      }

      callback({
        user,
        agencyUser,
        agency,
        loading: false,
        error: null,
      });
    } catch (error) {
      callback({
        user,
        agencyUser: null,
        agency: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

// ============================================================================
// Permission Helpers
// ============================================================================

/**
 * Check if user has admin or owner role
 */
export function isAdmin(agencyUser: AgencyUser | null): boolean {
  return agencyUser?.role === 'admin' || agencyUser?.role === 'owner';
}

/**
 * Check if user has owner role
 */
export function isOwner(agencyUser: AgencyUser | null): boolean {
  return agencyUser?.role === 'owner';
}

/**
 * Check if user can manage users (admin/owner only)
 */
export function canManageUsers(agencyUser: AgencyUser | null): boolean {
  return isAdmin(agencyUser);
}

/**
 * Check if user can modify agency settings (admin/owner only)
 */
export function canModifySettings(agencyUser: AgencyUser | null): boolean {
  return isAdmin(agencyUser);
}

/**
 * Check if user can create candidates
 */
export function canCreateCandidates(agencyUser: AgencyUser | null): boolean {
  if (!agencyUser) return false;
  // All roles except viewer can create candidates
  return agencyUser.role !== 'viewer';
}

/**
 * Check if user can view all candidates
 */
export function canViewCandidates(agencyUser: AgencyUser | null): boolean {
  // All authenticated agency members can view
  return agencyUser !== null;
}
