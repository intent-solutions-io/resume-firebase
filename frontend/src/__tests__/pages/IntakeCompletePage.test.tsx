import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { IntakeCompletePage } from '../../pages/IntakeCompletePage';

// Mock candidate data
const mockCandidate = {
  id: 'test-candidate-123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  branch: 'Army' as const,
  rank: 'E-5',
  mos: '11B',
  status: 'created' as const,
  createdAt: { toDate: () => new Date('2025-01-01T00:00:00Z') },
  updatedAt: { toDate: () => new Date('2025-01-01T00:00:00Z') },
};

const mockDocuments = [
  {
    id: 'test-doc-456',
    candidateId: 'test-candidate-123',
    fileName: 'dd214.pdf',
    storagePath: 'candidates/test-candidate-123/documents/dd214.pdf',
    type: 'dd214' as const,
    uploadedAt: { toDate: () => new Date('2025-01-01T01:00:00Z') },
  },
  {
    id: 'test-doc-457',
    candidateId: 'test-candidate-123',
    fileName: 'erb.pdf',
    storagePath: 'candidates/test-candidate-123/documents/erb.pdf',
    type: 'erb_orb' as const,
    uploadedAt: { toDate: () => new Date('2025-01-01T01:00:00Z') },
  },
];

// Mock functions
const mockUpdateCandidateStatus = vi.fn();
const mockSubscribeToCandidateStatus = vi.fn();
const mockFetchCandidateDocuments = vi.fn();
const mockOnSnapshot = vi.fn();

// Mock useParams to return candidateId (not id)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ candidateId: 'test-candidate-123' }),
  };
});

// Mock firestore module
vi.mock('../../lib/firestore', () => ({
  subscribeToCandidateStatus: (...args: unknown[]) => mockSubscribeToCandidateStatus(...args),
  updateCandidateStatus: (...args: unknown[]) => mockUpdateCandidateStatus(...args),
  STATUS_LABELS: {
    created: 'Profile Created',
    docs_uploaded: 'Documents Uploaded',
    processing: 'Processing',
    resume_ready: 'Resume Ready',
    error: 'Error',
  },
}));

// Mock adminData module
vi.mock('../../lib/adminData', () => ({
  fetchCandidateDocuments: (...args: unknown[]) => mockFetchCandidateDocuments(...args),
}));

// Mock firebase module
vi.mock('../../lib/firebase', () => ({
  getFirestoreDb: () => ({}),
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

// Mock fetch for worker service
global.fetch = vi.fn();

describe('IntakeCompletePage - Issue #6 Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: subscribeToCandidateStatus calls callback immediately with candidate
    mockSubscribeToCandidateStatus.mockImplementation((id, callback) => {
      callback(mockCandidate);
      return () => {}; // unsubscribe function
    });

    // Default: onSnapshot for resume exports - return no data
    mockOnSnapshot.mockImplementation(() => () => {});

    // Default: fetch succeeds
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should NOT set docs_uploaded status when no documents exist', async () => {
    // REGRESSION TEST FOR ISSUE #6
    // Setup: candidate with status='created' and NO documents
    mockFetchCandidateDocuments.mockResolvedValue([]); // No documents!

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    // Wait for documents to be fetched
    await waitFor(() => {
      expect(mockFetchCandidateDocuments).toHaveBeenCalledWith('test-candidate-123');
    });

    // CRITICAL ASSERTION: Status should NOT be updated when documents.length === 0
    // (Status update only happens when user clicks "Generate Resume" button)
    expect(mockUpdateCandidateStatus).not.toHaveBeenCalled();
  });

  it('should set docs_uploaded status when documents exist and generate is clicked', async () => {
    // Setup: candidate with status='created' and documents present
    mockFetchCandidateDocuments.mockResolvedValue(mockDocuments);
    mockUpdateCandidateStatus.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    // Wait for documents to load
    await waitFor(() => {
      expect(mockFetchCandidateDocuments).toHaveBeenCalledWith('test-candidate-123');
    });

    // Find and click the Generate Resume button
    const generateButton = await screen.findByRole('button', { name: /generate my resume/i });
    generateButton.click();

    // Status should be updated when documents exist
    await waitFor(() => {
      expect(mockUpdateCandidateStatus).toHaveBeenCalledWith(
        'test-candidate-123',
        'docs_uploaded'
      );
    });

    // Worker should be called to process
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should display correct document count', async () => {
    mockFetchCandidateDocuments.mockResolvedValue(mockDocuments);

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    // Should display document count
    await waitFor(() => {
      expect(screen.getByText(/uploaded documents/i)).toBeInTheDocument();
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });
  });

  it('should not call worker when no documents exist', async () => {
    mockFetchCandidateDocuments.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockFetchCandidateDocuments).toHaveBeenCalled();
    });

    // The Generate button should be disabled when no documents
    const generateButton = screen.getByRole('button', { name: /generate my resume/i });
    expect(generateButton).toBeDisabled();

    // Worker should NOT be called when there are no documents
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle processing state correctly', async () => {
    const processingCandidate = {
      ...mockCandidate,
      status: 'processing' as const,
    };

    mockSubscribeToCandidateStatus.mockImplementation((id, callback) => {
      callback(processingCandidate);
      return () => {};
    });
    mockFetchCandidateDocuments.mockResolvedValue(mockDocuments);

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    // Should show processing state
    await waitFor(() => {
      expect(screen.getByText(/building your resume/i)).toBeInTheDocument();
    });

    // Should not update status when already processing
    expect(mockUpdateCandidateStatus).not.toHaveBeenCalled();
  });
});
