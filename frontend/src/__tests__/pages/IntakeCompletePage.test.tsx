import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { IntakeCompletePage } from '../../pages/IntakeCompletePage';
import { mockCandidate, mockDocuments } from '../fixtures/candidate';

// Mock the firestore module
const mockUpdateCandidateStatus = vi.fn();
const mockGetCandidate = vi.fn();
const mockGetCandidateDocuments = vi.fn();

vi.mock('../../lib/firestore', () => ({
  updateCandidateStatus: (...args: any[]) => mockUpdateCandidateStatus(...args),
  getCandidate: (...args: any[]) => mockGetCandidate(...args),
  getCandidateDocuments: (...args: any[]) => mockGetCandidateDocuments(...args),
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-candidate-123' }),
  };
});

// Mock worker service
global.fetch = vi.fn();

describe('IntakeCompletePage - Issue #6 Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should NOT set docs_uploaded status when no documents exist', async () => {
    // REGRESSION TEST FOR ISSUE #6
    // Setup: candidate with status='created' and NO documents
    mockGetCandidate.mockResolvedValue(mockCandidate);
    mockGetCandidateDocuments.mockResolvedValue([]); // No documents!

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    // Wait for initial data load
    await waitFor(() => {
      expect(mockGetCandidate).toHaveBeenCalledWith('test-candidate-123');
    });

    await waitFor(() => {
      expect(mockGetCandidateDocuments).toHaveBeenCalledWith('test-candidate-123');
    });

    // CRITICAL ASSERTION: Status should NOT be updated when documents.length === 0
    expect(mockUpdateCandidateStatus).not.toHaveBeenCalled();
  });

  it('should set docs_uploaded status when documents exist', async () => {
    // Setup: candidate with status='created' and documents present
    mockGetCandidate.mockResolvedValue(mockCandidate);
    mockGetCandidateDocuments.mockResolvedValue(mockDocuments); // 2 documents

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    // Wait for initial data load
    await waitFor(() => {
      expect(mockGetCandidate).toHaveBeenCalledWith('test-candidate-123');
    });

    await waitFor(() => {
      expect(mockGetCandidateDocuments).toHaveBeenCalledWith('test-candidate-123');
    });

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
    mockGetCandidate.mockResolvedValue(mockCandidate);
    mockGetCandidateDocuments.mockResolvedValue(mockDocuments);

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    // Should display document count
    await waitFor(() => {
      const countElement = screen.queryByText(/2/);
      expect(countElement).toBeTruthy();
    });
  });

  it('should not call worker when no documents exist', async () => {
    mockGetCandidate.mockResolvedValue(mockCandidate);
    mockGetCandidateDocuments.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockGetCandidateDocuments).toHaveBeenCalled();
    });

    // Worker should NOT be called when there are no documents
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle processing state correctly', async () => {
    const processingCandidate = {
      ...mockCandidate,
      status: 'processing' as const,
    };

    mockGetCandidate.mockResolvedValue(processingCandidate);
    mockGetCandidateDocuments.mockResolvedValue(mockDocuments);

    render(
      <BrowserRouter>
        <IntakeCompletePage />
      </BrowserRouter>
    );

    // Should not update status when already processing
    await waitFor(() => {
      expect(mockGetCandidate).toHaveBeenCalled();
    });

    expect(mockUpdateCandidateStatus).not.toHaveBeenCalled();
  });
});
