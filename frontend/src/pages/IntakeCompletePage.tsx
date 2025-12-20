// Operation Hired - Intake Complete Page
// Phase 2.3: Updated with Operation Hired branding and improved UX

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestoreDb } from '../lib/firebase';
import {
  subscribeToCandidateStatus,
  updateCandidateStatus,
  STATUS_LABELS,
  Candidate,
  CandidateStatus,
} from '../lib/firestore';

// Worker API URL from environment
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8080';

// Resume export data from Firestore
interface ResumeExport {
  pdfPath?: string;
  docxPath?: string;
  exportGeneratedAt?: unknown;
  exportError?: string;
}

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Your Info' },
    { num: 2, label: 'Documents' },
    { num: 3, label: 'Resume' },
  ];

  return (
    <div className="step-indicator" style={{ marginBottom: '2rem' }}>
      {steps.map((step) => (
        <div key={step.num} className="step">
          <div
            className={`step-circle ${
              step.num < currentStep
                ? 'completed'
                : step.num === currentStep
                ? 'active'
                : 'pending'
            }`}
          >
            {step.num < currentStep ? '✓' : step.num}
          </div>
          <span className={`step-label ${step.num === currentStep ? 'active' : ''}`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: CandidateStatus }) {
  const statusConfig: Record<CandidateStatus, { className: string; label: string }> = {
    created: { className: 'badge-info', label: 'Profile Created' },
    docs_uploaded: { className: 'badge-info', label: 'Documents Uploaded' },
    processing: { className: 'badge-warning', label: 'Building Resume...' },
    resume_ready: { className: 'badge-success', label: 'Resume Ready!' },
    error: { className: 'badge-error', label: 'Error' },
  };

  const config = statusConfig[status] || { className: 'badge-info', label: STATUS_LABELS[status] };

  return <span className={`badge ${config.className}`}>{config.label}</span>;
}

export function IntakeCompletePage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [resumeExport, setResumeExport] = useState<ResumeExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription to candidate status
  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCandidateStatus(candidateId, (data) => {
      setCandidate(data);
      setLoading(false);
      // Clear generating state when status changes from processing
      if (data?.status !== 'processing') {
        setGenerating(false);
      }
    });

    return () => unsubscribe();
  }, [candidateId]);

  // Real-time subscription to resume exports
  useEffect(() => {
    if (!candidateId) return;

    const db = getFirestoreDb();
    const resumeRef = doc(db, 'resumes', candidateId);

    const unsubscribe = onSnapshot(resumeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ResumeExport;
        setResumeExport(data);
      }
    });

    return () => unsubscribe();
  }, [candidateId]);

  // Handle download
  async function handleDownload(format: 'pdf' | 'docx') {
    if (!candidateId) return;

    setDownloading(format);
    setError(null);

    try {
      const response = await fetch(
        `${WORKER_URL}/internal/resumeDownload/${candidateId}/${format}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Download failed');
      }

      const { downloadUrl } = await response.json();

      // Open the download URL in a new tab
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  }

  // Trigger resume generation
  async function handleGenerateResume() {
    if (!candidateId) return;

    setGenerating(true);
    setError(null);

    try {
      // Update status to docs_uploaded if still in created state
      if (candidate?.status === 'created') {
        await updateCandidateStatus(candidateId, 'docs_uploaded');
      }

      // Call worker to process candidate
      const response = await fetch(`${WORKER_URL}/internal/processCandidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start processing');
      }

      // Status updates will come through the real-time subscription
    } catch (err) {
      console.error('Failed to generate resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate resume');
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  const isResumeReady = candidate?.status === 'resume_ready';
  const isProcessing = candidate?.status === 'processing';
  const canGenerate = candidate?.status && ['created', 'docs_uploaded'].includes(candidate.status);

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div
        style={{
          background: isResumeReady
            ? 'linear-gradient(135deg, #276749 0%, #38a169 100%)'
            : 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        {isResumeReady ? (
          <>
            <div
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Your Resume is Ready!</h1>
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>
              Download your ATS-friendly resume below.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>
              {isProcessing ? 'Building Your Resume...' : 'Submission Complete'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              {candidate?.name && <span>Welcome, <strong style={{ color: '#C59141' }}>{candidate.name}</strong></span>}
            </p>
          </>
        )}
      </div>

      <div className="container" style={{ marginTop: '-1.5rem' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Step Indicator */}
          <StepIndicator currentStep={isResumeReady ? 3 : (isProcessing ? 3 : 2)} />

          {/* Status */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Current Status
            </p>
            <StatusBadge status={candidate?.status || 'created'} />
          </div>

          {/* Processing Animation */}
          {isProcessing && (
            <div
              style={{
                backgroundColor: 'var(--warning-light)',
                padding: '1.5rem',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem' }} />
              <p style={{ color: '#975a16', fontWeight: 600, marginBottom: '0.5rem' }}>
                AI is analyzing your documents...
              </p>
              <p style={{ color: '#975a16', fontSize: '0.875rem' }}>
                This usually takes 30-60 seconds. Please don't close this page.
              </p>
            </div>
          )}

          {/* Error Message */}
          {(error || candidate?.errorMessage) && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <strong>Error:</strong> {error || candidate?.errorMessage}
              <br />
              <span style={{ fontSize: '0.875rem' }}>Please contact support if this persists.</span>
            </div>
          )}

          {/* Generate Resume Button */}
          {canGenerate && !generating && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={handleGenerateResume}
                className="primary"
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.125rem',
                }}
              >
                Generate My Resume
              </button>
              <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Our AI will analyze your documents and create a civilian-friendly resume.
              </p>
            </div>
          )}

          {/* Resume Ready - Download Section */}
          {isResumeReady && (
            <div
              style={{
                backgroundColor: 'var(--success-light)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ color: '#276749', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
                Download your resume in your preferred format:
              </p>

              {/* Download buttons */}
              {(resumeExport?.pdfPath || resumeExport?.docxPath) && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {resumeExport?.pdfPath && (
                    <button
                      onClick={() => handleDownload('pdf')}
                      disabled={downloading !== null}
                      style={{
                        backgroundColor: downloading === 'pdf' ? 'var(--border-medium)' : '#276749',
                        color: 'white',
                        padding: '0.875rem 1.5rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {downloading === 'pdf' ? 'Downloading...' : 'Download PDF'}
                    </button>
                  )}
                  {resumeExport?.docxPath && (
                    <button
                      onClick={() => handleDownload('docx')}
                      disabled={downloading !== null}
                      style={{
                        backgroundColor: downloading === 'docx' ? 'var(--border-medium)' : 'var(--info-blue)',
                        color: 'white',
                        padding: '0.875rem 1.5rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {downloading === 'docx' ? 'Downloading...' : 'Download Word'}
                    </button>
                  )}
                </div>
              )}

              {/* Waiting for exports */}
              {!resumeExport?.pdfPath && !resumeExport?.docxPath && (
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ color: '#276749', fontSize: '0.875rem' }}>
                    Generating downloadable files...
                  </p>
                </div>
              )}

              {/* Export error */}
              {resumeExport?.exportError && (
                <p style={{ color: 'var(--error-red)', fontSize: '0.75rem', marginTop: '0.75rem', textAlign: 'center' }}>
                  Note: {resumeExport.exportError}
                </p>
              )}
            </div>
          )}

          {/* Info Section */}
          <div
            style={{
              backgroundColor: 'var(--bg-light)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          >
            {candidate?.email && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <strong>Email:</strong> {candidate.email}
              </p>
            )}
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <strong>Reference ID:</strong>{' '}
              <code style={{ backgroundColor: 'var(--bg-white)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                {candidateId}
              </code>
            </p>
          </div>

          {/* Actions */}
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/intake"
              style={{
                color: 'var(--primary-gold)',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Start a new application
            </Link>
          </div>
        </div>

        {/* Share Link */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Bookmark this page to return to your resume:{' '}
            <code style={{ backgroundColor: 'var(--bg-white)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              /candidate/{candidateId}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
