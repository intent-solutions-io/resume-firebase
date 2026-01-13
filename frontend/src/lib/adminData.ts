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
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
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
// Firestore Converters (Type-safe data transformation)
// ============================================================================

/**
 * Firestore converter for Candidate documents
 */
const candidateConverter: FirestoreDataConverter<Candidate> = {
  toFirestore(candidate: Candidate): DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = candidate;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Candidate {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      agencyId: data.agencyId,  // Phase 2: Multi-tenancy
      name: data.name ?? '',
      email: data.email ?? '',
      branch: data.branch ?? 'Army',
      rank: data.rank ?? '',
      mos: data.mos ?? '',
      phone: data.phone,
      city: data.city,
      state: data.state,
      targetJobDescription: data.targetJobDescription,
      status: data.status ?? 'created',
      errorMessage: data.errorMessage,
      createdAt: data.createdAt ?? Timestamp.now(),
      updatedAt: data.updatedAt ?? Timestamp.now(),
    };
  },
};

/**
 * Firestore converter for CandidateDocument documents
 */
const candidateDocumentConverter: FirestoreDataConverter<CandidateDocument> = {
  toFirestore(doc: CandidateDocument): DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = doc;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): CandidateDocument {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      candidateId: data.candidateId ?? '',
      type: data.type ?? 'other',
      fileName: data.fileName ?? '',
      storagePath: data.storagePath ?? '',
      uploadedAt: data.uploadedAt ?? Timestamp.now(),
    };
  },
};

/**
 * Firestore converter for CandidateProfile documents
 */
const candidateProfileConverter: FirestoreDataConverter<CandidateProfile> = {
  toFirestore(profile: CandidateProfile): DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = profile;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): CandidateProfile {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      candidateId: data.candidateId ?? '',
      branch: data.branch,
      rank: data.rank,
      mos: data.mos,
      yearsOfService: data.yearsOfService,
      skills: data.skills,
      certifications: data.certifications,
      experience: data.experience,
      education: data.education,
      awards: data.awards,
      summary: data.summary,
      createdAt: data.createdAt,
    };
  },
};

/**
 * Firestore converter for GeneratedResume documents
 */
const generatedResumeConverter: FirestoreDataConverter<GeneratedResume> = {
  toFirestore(resume: GeneratedResume): DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = resume;
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): GeneratedResume {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      candidateId: data.candidateId ?? '',
      summary: data.summary,
      skills: data.skills,
      experience: data.experience,
      education: data.education,
      pdfPath: data.pdfPath,
      docxPath: data.docxPath,
      exportGeneratedAt: data.exportGeneratedAt,
      exportError: data.exportError,
      createdAt: data.createdAt,
    };
  },
};

// ============================================================================
// Candidate List Operations
// ============================================================================

/**
 * Fetch all candidates, optionally filtered by status
 * @deprecated Use fetchAgencyCandidates for multi-tenant queries
 */
export async function fetchAllCandidates(
  statusFilter?: CandidateStatus
): Promise<Candidate[]> {
  const db = getFirestoreDb();
  const candidatesRef = collection(db, 'candidates').withConverter(candidateConverter);

  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (statusFilter) {
    constraints.unshift(where('status', '==', statusFilter));
  }

  const q = query(candidatesRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data());
}

/**
 * Fetch candidates for a specific agency (Phase 2: Multi-tenancy)
 */
export async function fetchAgencyCandidates(
  agencyId: string,
  statusFilter?: CandidateStatus
): Promise<Candidate[]> {
  const db = getFirestoreDb();
  const candidatesRef = collection(db, 'candidates').withConverter(candidateConverter);

  const constraints: QueryConstraint[] = [
    where('agencyId', '==', agencyId),
    orderBy('createdAt', 'desc'),
  ];

  if (statusFilter) {
    constraints.splice(1, 0, where('status', '==', statusFilter));
  }

  const q = query(candidatesRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data());
}

/**
 * Subscribe to all candidates (real-time updates)
 * @deprecated Use subscribeToAgencyCandidates for multi-tenant queries
 */
export function subscribeToAllCandidates(
  callback: (candidates: Candidate[]) => void,
  statusFilter?: CandidateStatus
): Unsubscribe {
  const db = getFirestoreDb();
  const candidatesRef = collection(db, 'candidates').withConverter(candidateConverter);

  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (statusFilter) {
    constraints.unshift(where('status', '==', statusFilter));
  }

  const q = query(candidatesRef, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const candidates = snapshot.docs.map((doc) => doc.data());
    callback(candidates);
  });
}

/**
 * Subscribe to agency candidates (real-time updates) - Phase 2: Multi-tenancy
 */
export function subscribeToAgencyCandidates(
  agencyId: string,
  callback: (candidates: Candidate[]) => void,
  statusFilter?: CandidateStatus
): Unsubscribe {
  const db = getFirestoreDb();
  const candidatesRef = collection(db, 'candidates').withConverter(candidateConverter);

  const constraints: QueryConstraint[] = [
    where('agencyId', '==', agencyId),
    orderBy('createdAt', 'desc'),
  ];

  if (statusFilter) {
    constraints.splice(1, 0, where('status', '==', statusFilter));
  }

  const q = query(candidatesRef, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const candidates = snapshot.docs.map((doc) => doc.data());
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
  const docsRef = collection(db, 'candidateDocuments').withConverter(candidateDocumentConverter);
  const q = query(docsRef, where('candidateId', '==', candidateId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data());
}

/**
 * Fetch candidate profile by candidateId
 */
export async function fetchCandidateProfile(
  candidateId: string
): Promise<CandidateProfile | null> {
  const db = getFirestoreDb();
  const profileRef = doc(db, 'candidateProfiles', candidateId).withConverter(candidateProfileConverter);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

/**
 * Fetch generated resume by candidateId
 */
export async function fetchGeneratedResume(
  candidateId: string
): Promise<GeneratedResume | null> {
  const db = getFirestoreDb();
  const resumeRef = doc(db, 'resumes', candidateId).withConverter(generatedResumeConverter);
  const snapshot = await getDoc(resumeRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

/**
 * Fetch complete candidate details (candidate + documents + profile + resume)
 */
export async function fetchCandidateDetails(
  candidateId: string
): Promise<CandidateWithDetails | null> {
  const db = getFirestoreDb();

  // Fetch candidate with converter
  const candidateRef = doc(db, 'candidates', candidateId).withConverter(candidateConverter);
  const candidateSnap = await getDoc(candidateRef);

  if (!candidateSnap.exists()) {
    return null;
  }

  const candidate = candidateSnap.data();

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
