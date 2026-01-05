// Firestore Data Access Layer for Operation Hired Candidates
// Handles CRUD operations for candidates and candidateDocuments collections

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';

// ============================================================================
// Types
// ============================================================================

export type CandidateStatus = 'created' | 'docs_uploaded' | 'processing' | 'resume_ready' | 'error';

export type MilitaryBranch =
  | 'Army'
  | 'Navy'
  | 'Air Force'
  | 'Marines'
  | 'Coast Guard'
  | 'Space Force';

export type DocumentType =
  | 'dd214'
  | 'erb_orb'
  | 'evaluation'
  | 'award'
  | 'training'
  | 'resume'
  | 'other';

export interface CandidateInput {
  name: string;
  email: string;
  branch: MilitaryBranch;
  rank: string;
  mos: string;
  phone?: string;
  city?: string;
  state?: string;
  targetJobDescription?: string; // Optional job posting for keyword optimization
}

export interface Candidate extends CandidateInput {
  id: string;
  status: CandidateStatus;
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CandidateDocumentInput {
  candidateId: string;
  type: DocumentType;
  fileName: string;
  storagePath: string;
}

export interface CandidateDocument extends CandidateDocumentInput {
  id: string;
  uploadedAt: Timestamp;
}

// ============================================================================
// Candidate Operations
// ============================================================================

/**
 * Create a new candidate in Firestore
 */
export async function createCandidate(input: CandidateInput): Promise<string> {
  const db = getFirestoreDb();
  const candidatesRef = collection(db, 'candidates');

  const docRef = await addDoc(candidatesRef, {
    ...input,
    status: 'created' as CandidateStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Get a candidate by ID
 */
export async function getCandidate(candidateId: string): Promise<Candidate | null> {
  const db = getFirestoreDb();
  const candidateRef = doc(db, 'candidates', candidateId);
  const snapshot = await getDoc(candidateRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Candidate;
}

/**
 * Update candidate status
 */
export async function updateCandidateStatus(
  candidateId: string,
  status: CandidateStatus
): Promise<void> {
  const db = getFirestoreDb();
  const candidateRef = doc(db, 'candidates', candidateId);

  await updateDoc(candidateRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// Candidate Document Operations
// ============================================================================

/**
 * Add a document record for a candidate
 */
export async function addCandidateDocument(
  input: CandidateDocumentInput
): Promise<string> {
  const db = getFirestoreDb();
  const docsRef = collection(db, 'candidateDocuments');

  const docRef = await addDoc(docsRef, {
    ...input,
    uploadedAt: serverTimestamp(),
  });

  return docRef.id;
}

// ============================================================================
// Document Type Labels (for UI)
// ============================================================================

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  dd214: 'DD-214',
  erb_orb: 'ERB/ORB',
  evaluation: 'Evaluation',
  award: 'Award',
  training: 'Training',
  resume: 'Existing Resume',
  other: 'Other',
};

export const MILITARY_BRANCHES: MilitaryBranch[] = [
  'Army',
  'Navy',
  'Air Force',
  'Marines',
  'Coast Guard',
  'Space Force',
];

// ============================================================================
// Real-time Subscriptions (Phase 1.9)
// ============================================================================

/**
 * Subscribe to candidate status changes (real-time)
 */
export function subscribeToCandidateStatus(
  candidateId: string,
  callback: (candidate: Candidate | null) => void
): Unsubscribe {
  const db = getFirestoreDb();
  const candidateRef = doc(db, 'candidates', candidateId);

  return onSnapshot(candidateRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    } as Candidate);
  });
}

// ============================================================================
// Status Labels (for UI)
// ============================================================================

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  created: 'Profile Created',
  docs_uploaded: 'Documents Uploaded',
  processing: 'Generating Resume...',
  resume_ready: 'Resume Ready!',
  error: 'Error Occurred',
};
