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
    const timestamp = new Date().toISOString();

    await this.casesCollection.doc(caseId).update({
      status,
      updatedAt: timestamp,
      ...updates,
    });

    // Log event
    await this.eventsCollection.add({
      caseId,
      type: 'status_change',
      status,
      timestamp,
      details: updates,
    });
  }

  async getCaseDocuments(caseId: string): Promise<CaseDocument[]> {
    const snapshot = await this.documentsCollection
      .where('caseId', '==', caseId)
      .orderBy('uploadedAt')
      .get();
    return snapshot.docs.map((doc) => doc.data() as CaseDocument);
  }

  async updateDocumentStatus(
    documentId: string,
    status: CaseDocument['status'],
    extractionData?: {
      extractedText?: string;
      extractionStatus?: CaseDocument['extractionStatus'];
    }
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      status,
      processedAt: new Date().toISOString(),
    };

    if (extractionData) {
      if (extractionData.extractedText !== undefined) {
        updates.extractedText = extractionData.extractedText;
      }
      if (extractionData.extractionStatus !== undefined) {
        updates.extractionStatus = extractionData.extractionStatus;
      }
    }

    await this.documentsCollection.doc(documentId).update(updates);
  }

  async createArtifact(data: CaseArtifact): Promise<void> {
    await this.artifactsCollection.doc(data.id).set(data);
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
}

export const firestoreService = new FirestoreService();
