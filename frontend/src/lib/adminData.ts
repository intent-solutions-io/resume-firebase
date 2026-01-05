// Admin Data Access Layer for Operation Hired
// Phase 2.4: Read-only admin dashboard helpers
// Provides access to candidates, documents, profiles, and resumes

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  Unsubscribe,
  QueryConstraint,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { Candidate, CandidateStatus, CandidateDocument, DocumentType } from './firestore';

// Re-export types needed by consumers
export type { CandidateDocument } from './firestore';

// Type for resume experience entries
export interface ResumeExperience {
  title: string;
  company: string;
  duration?: string;
  bullets?: string[];
}

// ============================================================================
// Types
// ============================================================================

export interface CandidateProfile {
  id: string;
  candidateId: string;
  branch?: string;
  rank?: string;
  mos?: string;
  yearsOfService?: number;
  skills?: string[];
  certifications?: string[];
  experience?: Array<{
    title: string;
    unit: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    institution: string;
    degree?: string;
    field?: string;
    graduationDate?: string;
  }>;
  awards?: string[];
  summary?: string;
  createdAt?: Timestamp;
}

export interface GeneratedResume {
  id: string;
  candidateId: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    date?: string;
  }>;
  pdfPath?: string;
  docxPath?: string;
  exportGeneratedAt?: Timestamp;
  exportError?: string;
  createdAt?: Timestamp;
}

export interface CandidateWithDetails extends Candidate {
  documents: CandidateDocument[];
  profile: CandidateProfile | null;
  resume: GeneratedResume | null;
}

// ============================================================================
// Candidate List Operations
// ============================================================================

/**
 * Fetch all candidates, optionally filtered by status
 */
export async function fetchAllCandidates(
  statusFilter?: CandidateStatus
): Promise<Candidate[]> {
  const db = getFirestoreDb();
  const candidatesRef = collection(db, 'candidates');

  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (statusFilter) {
    constraints.unshift(where('status', '==', statusFilter));
  }

  const q = query(candidatesRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Candidate[];
}

/**
 * Subscribe to all candidates (real-time updates)
 */
export function subscribeToAllCandidates(
  callback: (candidates: Candidate[]) => void,
  statusFilter?: CandidateStatus
): Unsubscribe {
  const db = getFirestoreDb();
  const candidatesRef = collection(db, 'candidates');

  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (statusFilter) {
    constraints.unshift(where('status', '==', statusFilter));
  }

  const q = query(candidatesRef, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const candidates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Candidate[];
    callback(candidates);
  });
}

// ============================================================================
// Candidate Detail Operations
// ============================================================================

/**
 * Fetch candidate documents by candidateId
 */
export async function fetchCandidateDocuments(
  candidateId: string
): Promise<CandidateDocument[]> {
  const db = getFirestoreDb();
  const docsRef = collection(db, 'candidateDocuments');
  const q = query(docsRef, where('candidateId', '==', candidateId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CandidateDocument[];
}

/**
 * Fetch candidate profile by candidateId
 */
export async function fetchCandidateProfile(
  candidateId: string
): Promise<CandidateProfile | null> {
  const db = getFirestoreDb();
  const profileRef = doc(db, 'candidateProfiles', candidateId);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as CandidateProfile;
}

/**
 * Fetch generated resume by candidateId
 */
export async function fetchGeneratedResume(
  candidateId: string
): Promise<GeneratedResume | null> {
  const db = getFirestoreDb();
  const resumeRef = doc(db, 'resumes', candidateId);
  const snapshot = await getDoc(resumeRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as GeneratedResume;
}

/**
 * Fetch complete candidate details (candidate + documents + profile + resume)
 */
export async function fetchCandidateDetails(
  candidateId: string
): Promise<CandidateWithDetails | null> {
  const db = getFirestoreDb();

  // Fetch candidate
  const candidateRef = doc(db, 'candidates', candidateId);
  const candidateSnap = await getDoc(candidateRef);

  if (!candidateSnap.exists()) {
    return null;
  }

  const candidate = {
    id: candidateSnap.id,
    ...candidateSnap.data(),
  } as Candidate;

  // Fetch related data in parallel
  const [documents, profile, resume] = await Promise.all([
    fetchCandidateDocuments(candidateId),
    fetchCandidateProfile(candidateId),
    fetchGeneratedResume(candidateId),
  ]);

  return {
    ...candidate,
    documents,
    profile,
    resume,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format timestamp to readable date string
 */
export function formatTimestamp(timestamp: Timestamp | undefined): string {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status color for styling
 */
export function getStatusColor(status: CandidateStatus): string {
  const colors: Record<CandidateStatus, string> = {
    created: '#3182ce', // blue
    docs_uploaded: '#805ad5', // purple
    processing: '#d69e2e', // yellow
    resume_ready: '#38a169', // green
    error: '#e53e3e', // red
  };
  return colors[status] || '#718096';
}

/**
 * Get document type label for display
 */
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    dd214: 'DD-214',
    erb_orb: 'ERB/ORB',
    evaluation: 'Evaluation',
    award: 'Award',
    training: 'Training',
    resume: 'Existing Resume',
    other: 'Other',
  };
  return labels[type] || type;
}
