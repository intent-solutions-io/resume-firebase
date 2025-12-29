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
  CandidateDocument,
} from '../lib/firestore';
import { fetchCandidateDocuments } from '../lib/adminData';

// Worker API URL from environment
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8080';

// Resume export data from Firestore
interface ResumeExport {
  pdfPath?: string;
  docxPath?: string;
  exportGeneratedAt?: unknown;
  exportError?: string;
  // Phase: 3-PDF Resume Bundle (Checkpoint 3.5)
  threePdfPaths?: {
    militaryPdfPath: string;
    civilianPdfPath: string;
    crosswalkPdfPath: string;
  };
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
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | 'military' | 'civilian' | 'crosswalk' | 'bundle' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingElapsed, setProcessingElapsed] = useState(0);

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

  // Fetch uploaded documents
  useEffect(() => {
    if (!candidateId) return;

    async function loadDocuments() {
      try {
        const docs = await fetchCandidateDocuments(candidateId!);
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    }

    loadDocuments();
  }, [candidateId]);

  // Track processing time for progress feedback
  useEffect(() => {
    const isProcessing = candidate?.status === 'processing';

    if (!isProcessing) {
      setProcessingElapsed(0);
      return;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      setProcessingElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [candidate?.status]);

  // Handle download
  async function handleDownload(format: 'pdf' | 'docx' | 'military' | 'civilian' | 'crosswalk' | 'bundle') {
    if (!candidateId) return;

    setDownloading(format);
    setError(null);

    try {
      // Build the download URL
      const url = format === 'bundle'
        ? `${WORKER_URL}/internal/resumeDownload/${candidateId}/bundle`
        : `${WORKER_URL}/internal/resumeDownload/${candidateId}/${format}`;

      const response = await fetch(url);

      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 404) {
          throw new Error(
            `${format.toUpperCase()} file not found. The file may still be generating. Please refresh in a few moments.`
          );
        } else if (response.status === 403) {
          throw new Error(
            'Access denied. Please contact support with your Reference ID if this persists.'
          );
        } else if (response.status >= 500) {
          throw new Error(
            'Server error occurred. Our team has been notified. Please try again in a few minutes.'
          );
        } else {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Download failed (${response.status}). Please try again.`);
        }
      }

      // Get the binary file as a blob
      const blob = await response.blob();

      // Determine filename based on format
      let filename: string;
      if (format === 'bundle') {
        filename = 'resume-bundle.zip';
      } else if (format === 'military') {
        filename = 'resume-military.pdf';
      } else if (format === 'civilian') {
        filename = 'resume-civilian.pdf';
      } else if (format === 'crosswalk') {
        filename = 'resume-crosswalk.pdf';
      } else if (format === 'docx') {
        filename = 'resume.docx';
      } else {
        filename = 'resume.pdf';
      }

      // Create a download link and trigger the download
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);

      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network connection failed. Please check your internet and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
      }
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
      // Update status to docs_uploaded ONLY if documents actually exist
      if (candidate?.status === 'created' && documents.length > 0) {
        await updateCandidateStatus(candidateId, 'docs_uploaded');
      }

      // Call worker to process candidate
      const response = await fetch(`${WORKER_URL}/internal/processCandidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });

      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 400) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.message || 'No documents found. Please upload at least one document and try again.'
          );
        } else if (response.status === 403) {
          throw new Error(
            'Access denied. Your session may have expired. Please refresh and try again.'
          );
        } else if (response.status === 408 || response.status === 504) {
          throw new Error(
            'Request timed out. Your resume may still be generating. Please refresh this page in 30 seconds to check status.'
          );
        } else if (response.status >= 500) {
          throw new Error(
            'Server error occurred. Our team has been notified. Please try again in a few minutes or contact support with your Reference ID.'
          );
        } else {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.message || `Failed to start processing (${response.status}). Please try again.`
          );
        }
      }

      // Status updates will come through the real-time subscription
    } catch (err) {
      console.error('Failed to generate resume:', err);

      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(
          'Network connection failed. Please check your internet connection and try again. If you\'re on a slow connection, the request may time out - your resume might still be generating.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate resume. Please try again.');
      }
      setGenerating(false);
    }
  }

  // Get progress message based on elapsed time
  function getProcessingMessage(elapsed: number): { stage: string; detail: string } {
    if (elapsed < 10) {
      return {
        stage: 'Extracting text from documents...',
        detail: 'Reading your uploaded files',
      };
    } else if (elapsed < 25) {
      return {
        stage: 'Analyzing military experience...',
        detail: 'Identifying key skills and achievements',
      };
    } else if (elapsed < 40) {
      return {
        stage: 'Translating to civilian terms...',
        detail: 'Converting military language for civilian employers',
      };
    } else if (elapsed < 55) {
      return {
        stage: 'Generating resume content...',
        detail: 'Creating your ATS-friendly resume',
      };
    } else {
      return {
        stage: 'Finalizing your resume...',
        detail: 'Almost done! This usually completes within 60 seconds.',
      };
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
  const hasDocuments = documents.length > 0;

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

          {/* Uploaded Documents Section */}
          {documents.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                📄 Uploaded Documents ({documents.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-light)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    {/* File Icon */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-white)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>

                    {/* File Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {doc.fileName}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.uploadedAt?.toDate?.()?.toLocaleDateString() || 'Recently uploaded'}
                      </p>
                    </div>

                    {/* Document Type Badge */}
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: 'var(--info-light)',
                        color: 'var(--info-blue)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.type === 'dd214' && 'DD-214'}
                      {doc.type === 'erb_orb' && 'ERB/ORB'}
                      {doc.type === 'evaluation' && 'Evaluation'}
                      {doc.type === 'award' && 'Award'}
                      {doc.type === 'training' && 'Training'}
                      {doc.type === 'resume' && 'Resume'}
                      {doc.type === 'other' && 'Other'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

              {/* Progress message */}
              <p style={{ color: '#975a16', fontWeight: 600, marginBottom: '0.5rem' }}>
                {getProcessingMessage(processingElapsed).stage}
              </p>
              <p style={{ color: '#975a16', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                {getProcessingMessage(processingElapsed).detail}
              </p>

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(151, 90, 22, 0.2)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (processingElapsed / 60) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#975a16',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              {/* Elapsed time */}
              <p style={{ color: '#975a16', fontSize: '0.75rem' }}>
                {processingElapsed < 60 ? (
                  <>Elapsed: {processingElapsed}s • Expected: 30-60s</>
                ) : (
                  <>Taking longer than usual... Please don't close this page.</>
                )}
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
          {canGenerate && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {generating ? (
                /* Immediate loading feedback while waiting for API */
                <div
                  style={{
                    backgroundColor: 'var(--info-light)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid var(--info-blue)',
                  }}
                >
                  <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--info-blue)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Starting resume generation...
                  </p>
                  <p style={{ color: 'var(--info-blue)', fontSize: '0.875rem', margin: 0 }}>
                    Please wait, this may take a moment.
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleGenerateResume}
                    className="primary"
                    disabled={!hasDocuments}
                    style={{
                      padding: '1rem 2rem',
                      fontSize: '1.125rem',
                      opacity: hasDocuments ? 1 : 0.5,
                      cursor: hasDocuments ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Generate My Resume
                  </button>
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {hasDocuments ? (
                      'Our AI will analyze your documents and create a civilian-friendly resume.'
                    ) : (
                      <span style={{ color: 'var(--error-red)', fontWeight: 500 }}>
                        Please upload at least one document before generating your resume.
                      </span>
                    )}
                  </p>
                </>
              )}
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
              {/* 3-PDF Resume Bundle Available */}
              {resumeExport?.threePdfPaths ? (
                <>
                  <h3 style={{ color: '#276749', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
                    Your Resume Bundle is Ready!
                  </h3>
                  <p style={{ color: '#276749', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Download individual resumes or get all 3 in one ZIP file:
                  </p>

                  {/* Individual PDF Downloads - Grid Layout */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}>
                    {/* Military Resume */}
                    <button
                      onClick={() => handleDownload('military')}
                      disabled={downloading !== null}
                      style={{
                        backgroundColor: downloading === 'military' ? 'var(--border-medium)' : '#2d3748',
                        color: 'white',
                        padding: '1rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: downloading === null ? 'pointer' : 'not-allowed',
                        opacity: downloading === null ? 1 : 0.7,
                        transition: 'all 0.2s',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      <span style={{ fontWeight: 600 }}>Military Resume</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                        {downloading === 'military' ? 'Downloading...' : 'Full military detail'}
                      </span>
                    </button>

                    {/* Civilian Resume */}
                    <button
                      onClick={() => handleDownload('civilian')}
                      disabled={downloading !== null}
                      style={{
                        backgroundColor: downloading === 'civilian' ? 'var(--border-medium)' : 'var(--info-blue)',
                        color: 'white',
                        padding: '1rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: downloading === null ? 'pointer' : 'not-allowed',
                        opacity: downloading === null ? 1 : 0.7,
                        transition: 'all 0.2s',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <circle cx="12" cy="13" r="2" />
                        <path d="M12 15v3" />
                      </svg>
                      <span style={{ fontWeight: 600 }}>Civilian Resume</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                        {downloading === 'civilian' ? 'Downloading...' : 'Civilian-friendly version'}
                      </span>
                    </button>

                    {/* Crosswalk Resume */}
                    <button
                      onClick={() => handleDownload('crosswalk')}
                      disabled={downloading !== null}
                      style={{
                        backgroundColor: downloading === 'crosswalk' ? 'var(--border-medium)' : '#C59141',
                        color: 'white',
                        padding: '1rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: downloading === null ? 'pointer' : 'not-allowed',
                        opacity: downloading === null ? 1 : 0.7,
                        transition: 'all 0.2s',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="16" y2="17" />
                      </svg>
                      <span style={{ fontWeight: 600 }}>Crosswalk Guide</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                        {downloading === 'crosswalk' ? 'Downloading...' : 'Side-by-side comparison'}
                      </span>
                    </button>
                  </div>

                  {/* Download All Button */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDownload('bundle')}
                      disabled={downloading !== null}
                      style={{
                        backgroundColor: downloading === 'bundle' ? 'var(--border-medium)' : '#276749',
                        color: 'white',
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: downloading === null ? 'pointer' : 'not-allowed',
                        opacity: downloading === null ? 1 : 0.7,
                        transition: 'all 0.2s',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {downloading === 'bundle' ? 'Downloading ZIP...' : 'Download All (ZIP)'}
                    </button>
                  </div>

                  {/* Legacy Format Downloads - Collapsed */}
                  {(resumeExport?.pdfPath || resumeExport?.docxPath) && (
                    <details style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(39, 103, 73, 0.1)', borderRadius: '8px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 500, color: '#276749', fontSize: '0.875rem' }}>
                        Legacy Formats (PDF & Word)
                      </summary>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {resumeExport?.pdfPath && (
                          <button
                            onClick={() => handleDownload('pdf')}
                            disabled={downloading !== null}
                            style={{
                              backgroundColor: downloading === 'pdf' ? 'var(--border-medium)' : '#276749',
                              color: 'white',
                              padding: '0.625rem 1rem',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: downloading === null ? 'pointer' : 'not-allowed',
                              opacity: downloading === null ? 1 : 0.7,
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {downloading === 'pdf' ? 'Downloading...' : 'PDF'}
                          </button>
                        )}
                        {resumeExport?.docxPath && (
                          <button
                            onClick={() => handleDownload('docx')}
                            disabled={downloading !== null}
                            style={{
                              backgroundColor: downloading === 'docx' ? 'var(--border-medium)' : 'var(--info-blue)',
                              color: 'white',
                              padding: '0.625rem 1rem',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: downloading === null ? 'pointer' : 'not-allowed',
                              opacity: downloading === null ? 1 : 0.7,
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {downloading === 'docx' ? 'Downloading...' : 'Word'}
                          </button>
                        )}
                      </div>
                    </details>
                  )}
                </>
              ) : (
                /* Fallback: Legacy format downloads if 3-PDF not available */
                <>
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
                            border: 'none',
                            borderRadius: '8px',
                            cursor: downloading === null ? 'pointer' : 'not-allowed',
                            opacity: downloading === null ? 1 : 0.7,
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
                            border: 'none',
                            borderRadius: '8px',
                            cursor: downloading === null ? 'pointer' : 'not-allowed',
                            opacity: downloading === null ? 1 : 0.7,
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
                </>
              )}
            </div>
          )}

          {/* Info Section */}
          {candidate?.email && (
            <div
              style={{
                backgroundColor: 'var(--bg-light)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                <strong>Email:</strong> {candidate.email}
              </p>
            </div>
          )}

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
