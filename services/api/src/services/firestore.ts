import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();

export interface Case {
  id: string;
  name: string;
  email: string;
  targetRole?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  // Review fields (human-in-the-loop)
  reviewStatus?: 'unreviewed' | 'approved' | 'rejected' | 'needs_fix';
  reviewedAt?: string;
  reviewerNotes?: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  fileName: string;
  status: 'pending' | 'uploaded' | 'processed' | 'failed';
  uploadedAt: string;
  // Extraction fields
  extractedText?: string;
  extractionStatus?: 'pending' | 'completed' | 'needs_ocr' | 'failed';
}

export interface CaseEvent {
  id?: string;
  caseId: string;
  type: string;
  timestamp: string;
  status?: string;
  details?: Record<string, unknown>;
}

export interface CaseArtifact {
  id: string;
  caseId: string;
  name: string;
  fileName: string;
  type: string;
  size: number;
  createdAt: string;
}

class FirestoreService {
  private casesCollection = firestore.collection('cases');
  private documentsCollection = firestore.collection('case_documents');
  private artifactsCollection = firestore.collection('case_artifacts');
  private eventsCollection = firestore.collection('case_events');

  async createCase(data: Case): Promise<void> {
    await this.casesCollection.doc(data.id).set(data);
  }

  async getCase(caseId: string): Promise<Case | null> {
    const doc = await this.casesCollection.doc(caseId).get();
    if (!doc.exists) return null;
    return doc.data() as Case;
  }

  async updateCaseStatus(
    caseId: string,
    status: Case['status'],
    updates?: Partial<Case>
  ): Promise<void> {
    await this.casesCollection.doc(caseId).update({
      status,
      updatedAt: new Date().toISOString(),
      ...updates,
    });
  }

  async createDocument(data: CaseDocument): Promise<void> {
    await this.documentsCollection.doc(data.id).set(data);
  }

  async getCaseDocuments(caseId: string): Promise<CaseDocument[]> {
    const snapshot = await this.documentsCollection
      .where('caseId', '==', caseId)
      .orderBy('uploadedAt')
      .get();
    return snapshot.docs.map((doc) => doc.data() as CaseDocument);
  }

  async getCaseArtifacts(caseId: string): Promise<CaseArtifact[]> {
    const snapshot = await this.artifactsCollection
      .where('caseId', '==', caseId)
      .get();
    return snapshot.docs.map((doc) => doc.data() as CaseArtifact);
  }

  async getArtifact(
    caseId: string,
    artifactId: string
  ): Promise<CaseArtifact | null> {
    const doc = await this.artifactsCollection.doc(artifactId).get();
    if (!doc.exists) return null;
    const artifact = doc.data() as CaseArtifact;
    if (artifact.caseId !== caseId) return null;
    return artifact;
  }

  async createArtifact(data: CaseArtifact): Promise<void> {
    await this.artifactsCollection.doc(data.id).set(data);
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<CaseDocument | null> {
    const doc = await this.documentsCollection.doc(documentId).get();
    if (!doc.exists) return null;
    return doc.data() as CaseDocument;
  }

  /**
   * Update case review status (human-in-the-loop)
   */
  async updateCaseReview(
    caseId: string,
    reviewStatus: Case['reviewStatus'],
    notes?: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    await this.casesCollection.doc(caseId).update({
      reviewStatus,
      reviewedAt: timestamp,
      reviewerNotes: notes || null,
      updatedAt: timestamp,
    });

    // Log review event for audit trail
    await this.eventsCollection.add({
      caseId,
      type: 'review',
      status: reviewStatus,
      timestamp,
      details: { notes: notes || null },
    });
  }

  /**
   * Get review info for a case (for reviewer console)
   */
  async getCaseReviewInfo(caseId: string): Promise<{
    case: Case;
    documents: CaseDocument[];
    artifacts: CaseArtifact[];
  } | null> {
    const caseDoc = await this.getCase(caseId);
    if (!caseDoc) return null;

    const documents = await this.getCaseDocuments(caseId);
    const artifacts = await this.getCaseArtifacts(caseId);

    return {
      case: caseDoc,
      documents,
      artifacts,
    };
  }
}

export const firestoreService = new FirestoreService();
