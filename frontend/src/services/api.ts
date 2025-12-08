// API Service for Resume Generator
// Handles all communication with the backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface CreateCaseRequest {
  name: string;
  email: string;
  targetRole?: string;
}

export interface CreateCaseResponse {
  caseId: string;
  status: string;
}

export interface UploadUrlResponse {
  urls: Array<{
    fileName: string;
    uploadUrl: string;
    documentId: string;
  }>;
}

export interface CaseArtifact {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface CaseStatus {
  caseId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep?: string;
  progress?: number;
  artifacts?: CaseArtifact[];
  createdAt: string;
  updatedAt: string;
}

// Review types (Human-in-the-Loop)
export type ReviewStatus = 'unreviewed' | 'approved' | 'rejected' | 'needs_fix';

export interface ReviewDocument {
  id: string;
  fileName: string;
  status: string;
  extractionStatus?: string;
  extractedText?: string;
  uploadedAt: string;
}

export interface CaseReviewData {
  caseId: string;
  status: string;
  targetRole?: string;
  reviewStatus: ReviewStatus;
  reviewedAt?: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
  documents: ReviewDocument[];
  artifacts: CaseArtifact[];
}

export interface ReviewUpdateRequest {
  status: ReviewStatus;
  notes?: string;
}

export interface ReviewUpdateResponse {
  caseId: string;
  reviewStatus: ReviewStatus;
  reviewedAt: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // TODO: Add App Check token to headers
    // const appCheckToken = await getAppCheckToken();
    // headers['X-Firebase-AppCheck'] = appCheckToken;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  async createCase(data: CreateCaseRequest): Promise<CreateCaseResponse> {
    return this.request<CreateCaseResponse>('/v1/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestUploadUrls(
    caseId: string,
    fileNames: string[]
  ): Promise<UploadUrlResponse> {
    return this.request<UploadUrlResponse>(
      `/v1/cases/${caseId}/uploads:request`,
      {
        method: 'POST',
        body: JSON.stringify({ fileNames }),
      }
    );
  }

  async getCaseStatus(caseId: string): Promise<CaseStatus> {
    return this.request<CaseStatus>(`/v1/cases/${caseId}`);
  }

  async getDownloadUrl(caseId: string, artifactId: string): Promise<string> {
    const response = await this.request<{ downloadUrl: string }>(
      `/v1/cases/${caseId}/artifacts/${artifactId}/download`
    );
    return response.downloadUrl;
  }

  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }
  }

  // ==========================================================================
  // REVIEWER CONSOLE METHODS (Human-in-the-Loop)
  // ==========================================================================

  async getCaseReview(caseId: string): Promise<CaseReviewData> {
    return this.request<CaseReviewData>(`/v1/cases/${caseId}/review`);
  }

  async updateCaseReview(
    caseId: string,
    data: ReviewUpdateRequest
  ): Promise<ReviewUpdateResponse> {
    return this.request<ReviewUpdateResponse>(`/v1/cases/${caseId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDocumentDownloadUrl(
    caseId: string,
    documentId: string
  ): Promise<string> {
    const response = await this.request<{ downloadUrl: string }>(
      `/v1/cases/${caseId}/documents/${documentId}/download`
    );
    return response.downloadUrl;
  }

  async triggerProcessing(caseId: string): Promise<void> {
    await this.request(`/v1/cases/${caseId}/process`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
