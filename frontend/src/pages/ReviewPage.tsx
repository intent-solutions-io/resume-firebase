import { useState } from 'react';
import {
  apiService,
  CaseReviewData,
  ReviewStatus,
  ReviewDocument,
  CaseArtifact,
} from '../services/api';

type ReviewAction = ReviewStatus;

export function ReviewPage() {
  const [caseId, setCaseId] = useState('');
  const [reviewData, setReviewData] = useState<CaseReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [resumeJson, setResumeJson] = useState<object | null>(null);

  const loadCase = async () => {
    if (!caseId.trim()) {
      setError('Please enter a case ID');
      return;
    }

    setLoading(true);
    setError(null);
    setReviewData(null);
    setResumeJson(null);

    try {
      const data = await apiService.getCaseReview(caseId.trim());
      setReviewData(data);
      setNotes(data.reviewerNotes || '');

      // Try to load resume JSON artifact if exists
      const resumeArtifact = data.artifacts.find(
        (a) => a.type === 'resume_json'
      );
      if (resumeArtifact) {
        try {
          const url = await apiService.getDownloadUrl(caseId.trim(), resumeArtifact.id);
          const response = await fetch(url);
          const json = await response.json();
          setResumeJson(json);
        } catch {
          console.log('Could not load resume JSON');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action: ReviewAction) => {
    if (!reviewData) return;

    setUpdating(true);
    setError(null);

    try {
      await apiService.updateCaseReview(reviewData.caseId, {
        status: action,
        notes: notes.trim() || undefined,
      });

      // Reload case data
      const data = await apiService.getCaseReview(reviewData.caseId);
      setReviewData(data);
      setNotes(data.reviewerNotes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review');
    } finally {
      setUpdating(false);
    }
  };

  const handleDocumentDownload = async (doc: ReviewDocument) => {
    if (!reviewData) return;

    try {
      const url = await apiService.getDocumentDownloadUrl(
        reviewData.caseId,
        doc.id
      );
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download URL');
    }
  };

  const handleArtifactDownload = async (artifact: CaseArtifact) => {
    if (!reviewData) return;

    try {
      const url = await apiService.getDownloadUrl(reviewData.caseId, artifact.id);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download URL');
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      case 'needs_fix':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Reviewer Console</h1>

      {/* Case ID Input */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          placeholder="Enter Case ID (UUID)"
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          onKeyDown={(e) => e.key === 'Enter' && loadCase()}
        />
        <button
          onClick={loadCase}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Load Case'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '4px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Case Review Data */}
      {reviewData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Case Summary */}
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h2 style={{ marginBottom: '12px' }}>Case Summary</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <strong>Case ID:</strong> {reviewData.caseId.substring(0, 8)}...
              </div>
              <div>
                <strong>Status:</strong> {reviewData.status}
              </div>
              <div>
                <strong>Target Role:</strong> {reviewData.targetRole || 'N/A'}
              </div>
              <div>
                <strong>Review Status:</strong>{' '}
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: getStatusBadgeColor(reviewData.reviewStatus),
                    color: 'white',
                  }}
                >
                  {reviewData.reviewStatus}
                </span>
              </div>
              <div>
                <strong>Created:</strong>{' '}
                {new Date(reviewData.createdAt).toLocaleString()}
              </div>
              {reviewData.reviewedAt && (
                <div>
                  <strong>Last Reviewed:</strong>{' '}
                  {new Date(reviewData.reviewedAt).toLocaleString()}
                </div>
              )}
            </div>
          </section>

          {/* Documents Section */}
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h2 style={{ marginBottom: '12px' }}>
              Documents ({reviewData.documents.length})
            </h2>
            {reviewData.documents.length === 0 ? (
              <p>No documents uploaded</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviewData.documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      padding: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <strong>{doc.fileName}</strong>
                      <button
                        onClick={() => handleDocumentDownload(doc)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Download
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      Status: {doc.status} | Extraction:{' '}
                      {doc.extractionStatus || 'N/A'}
                    </div>
                    {doc.extractedText && (
                      <details style={{ marginTop: '8px' }}>
                        <summary style={{ cursor: 'pointer' }}>
                          View Extracted Text
                        </summary>
                        <pre
                          style={{
                            backgroundColor: '#f3f4f6',
                            padding: '12px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '200px',
                            fontSize: '12px',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {doc.extractedText}
                        </pre>
                      </details>
                    )}
                    {doc.extractionStatus === 'needs_ocr' && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: '#fef3c7',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      >
                        This is an image file. OCR extraction will be available in
                        a future phase.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Artifacts Section */}
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h2 style={{ marginBottom: '12px' }}>
              Artifacts ({reviewData.artifacts.length})
            </h2>
            {reviewData.artifacts.length === 0 ? (
              <p>No artifacts generated yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reviewData.artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      padding: '12px',
                    }}
                  >
                    <div>
                      <strong>{artifact.name}</strong>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {artifact.type} |{' '}
                        {(artifact.size / 1024).toFixed(1)} KB |{' '}
                        {new Date(artifact.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleArtifactDownload(artifact)}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Resume JSON Preview */}
          {resumeJson && (
            <section
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <h2 style={{ marginBottom: '12px' }}>Resume JSON Preview</h2>
              <details open>
                <summary style={{ cursor: 'pointer', marginBottom: '12px' }}>
                  View Raw JSON
                </summary>
                <pre
                  style={{
                    backgroundColor: '#f3f4f6',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '400px',
                    fontSize: '12px',
                  }}
                >
                  {JSON.stringify(resumeJson, null, 2)}
                </pre>
              </details>
            </section>
          )}

          {/* Review Actions */}
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h2 style={{ marginBottom: '12px' }}>Review Actions</h2>

            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="notes"
                style={{ display: 'block', marginBottom: '8px' }}
              >
                Reviewer Notes:
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  resize: 'vertical',
                }}
                placeholder="Add notes about this case..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleReviewAction('approved')}
                disabled={updating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReviewAction('needs_fix')}
                disabled={updating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                }}
              >
                Needs Fix
              </button>
              <button
                onClick={() => handleReviewAction('rejected')}
                disabled={updating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                }}
              >
                Reject
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
