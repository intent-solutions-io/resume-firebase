// Operation Hired - Document Upload Page
// Phase 2.3: Updated with Operation Hired branding and improved UX

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCandidate,
  addCandidateDocument,
  updateCandidateStatus,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  Candidate,
} from '../lib/firestore';
import { uploadCandidateDocument } from '../lib/storage';

interface UploadedFile {
  id: string; // Unique ID for React key
  file: File;
  type: DocumentType;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
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

export function IntakeDocumentsPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Load candidate info on mount
  useEffect(() => {
    async function loadCandidate() {
      if (!candidateId) {
        setError('No candidate ID provided');
        setLoading(false);
        return;
      }

      try {
        const data = await getCandidate(candidateId);
        if (!data) {
          setError('Candidate not found');
        } else {
          setCandidate(data);
        }
      } catch (err) {
        console.error('Failed to load candidate:', err);
        setError('Failed to load candidate information');
      } finally {
        setLoading(false);
      }
    }

    loadCandidate();
  }, [candidateId]);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    console.log('Adding files:', fileList.length); // Debug logging
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      file,
      type: 'other' as DocumentType,
      status: 'pending',
    }));
    console.log('New files created:', newFiles.length); // Debug logging
    setFiles((prev) => {
      const updated = [...prev, ...newFiles];
      console.log('Files after update:', updated.length); // Debug logging
      return updated;
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    addFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const updateFileType = (id: string, type: DocumentType) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, type } : f))
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUploadAll = async () => {
    if (!candidateId || files.length === 0) return;

    setUploading(true);
    setError(null);

    let successCount = 0;

    for (const fileInfo of files) {
      if (fileInfo.status !== 'pending') continue;

      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === fileInfo.id ? { ...f, status: 'uploading' as const } : f))
      );

      try {
        // Upload to Storage
        const { storagePath } = await uploadCandidateDocument(
          candidateId,
          fileInfo.file
        );

        // Create Firestore record
        await addCandidateDocument({
          candidateId,
          type: fileInfo.type,
          fileName: fileInfo.file.name,
          storagePath,
        });

        // Mark as success
        setFiles((prev) =>
          prev.map((f) => (f.id === fileInfo.id ? { ...f, status: 'success' as const } : f))
        );
        successCount++;
      } catch (err) {
        console.error('Upload failed:', err);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileInfo.id
              ? { ...f, status: 'error' as const, error: 'Upload failed' }
              : f
          )
        );
      }
    }

    // Update candidate status if at least one file uploaded
    if (successCount > 0) {
      try {
        await updateCandidateStatus(candidateId, 'docs_uploaded');
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }

    setUploading(false);
  };

  const handleComplete = () => {
    navigate(`/intake/${candidateId}/complete`);
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (error && !candidate) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div className="alert alert-error" style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error}
        </div>
      </div>
    );
  }

  const pendingFiles = files.filter((f) => f.status === 'pending');
  const successFiles = files.filter((f) => f.status === 'success');

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Upload Your Documents</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>
          Welcome, <strong style={{ color: '#C59141' }}>{candidate?.name}</strong>
        </p>
      </div>

      <div className="container" style={{ marginTop: '-1.5rem' }}>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Step Indicator */}
          <StepIndicator currentStep={2} />

          {/* Upload Area */}
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ marginBottom: '1.5rem' }}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary-gold)"
                strokeWidth="1.5"
                style={{ margin: '0 auto 1rem', display: 'block' }}
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Drop files here or click to browse
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                PDF, Word documents, or images (max 10MB each)
              </span>
            </label>
          </div>

          {/* Document Type Guide */}
          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              Recommended Documents:
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
              <li><strong>DD-214</strong> - Discharge papers (most important)</li>
              <li><strong>ERB/ORB</strong> - Enlisted/Officer Record Brief</li>
              <li><strong>Evaluations</strong> - NCOERs, OERs, FITREPs, EPRs</li>
              <li>Awards, decorations, and training certificates</li>
            </ul>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>
                Selected Files ({files.length})
              </h3>
              {files.map((fileInfo) => (
                <div
                  key={fileInfo.id}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor:
                      fileInfo.status === 'success'
                        ? 'var(--success-light)'
                        : fileInfo.status === 'error'
                        ? 'var(--error-light)'
                        : 'var(--bg-light)',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    border: '1px solid',
                    borderColor:
                      fileInfo.status === 'success'
                        ? '#9ae6b4'
                        : fileInfo.status === 'error'
                        ? '#fc8181'
                        : 'var(--border-light)',
                  }}
                >
                  {/* Top row: Icon, Filename, Remove button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    {/* File Icon */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
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

                    {/* File Info - full width, no truncation issues */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          wordBreak: 'break-word',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {fileInfo.file.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(fileInfo.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    {/* Remove button (pending only) */}
                    {fileInfo.status === 'pending' && (
                      <button
                        onClick={() => removeFile(fileInfo.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error-red)',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                        title="Remove file"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}

                    {/* Status indicators */}
                    {fileInfo.status === 'uploading' && (
                      <div className="spinner" style={{ flexShrink: 0 }} />
                    )}
                    {fileInfo.status === 'success' && (
                      <span className="badge badge-success" style={{ flexShrink: 0 }}>Uploaded</span>
                    )}
                    {fileInfo.status === 'error' && (
                      <span className="badge badge-error" style={{ flexShrink: 0 }}>Failed</span>
                    )}
                  </div>

                  {/* Bottom row: Document Type Select (full width) */}
                  <select
                    value={fileInfo.type}
                    onChange={(e) => updateFileType(fileInfo.id, e.target.value as DocumentType)}
                    disabled={fileInfo.status !== 'pending'}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: fileInfo.status !== 'pending' ? 'var(--bg-light)' : 'white',
                    }}
                  >
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            {pendingFiles.length > 0 && (
              <button
                onClick={handleUploadAll}
                className="primary"
                disabled={uploading}
                style={{ flex: 1 }}
              >
                {uploading ? (
                  <>
                    <span className="spinner" style={{ marginRight: '0.5rem' }} />
                    Uploading...
                  </>
                ) : (
                  `Upload ${pendingFiles.length} File${pendingFiles.length > 1 ? 's' : ''}`
                )}
              </button>
            )}

            {successFiles.length > 0 && pendingFiles.length === 0 && (
              <button
                onClick={handleComplete}
                className="primary"
                style={{ flex: 1 }}
              >
                Continue to Resume Generation
              </button>
            )}
          </div>

          {/* Skip Option */}
          {files.length === 0 && (
            <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Need to upload documents later?{' '}
              <button
                onClick={handleComplete}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-gold)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: 'inherit',
                }}
              >
                Skip for now
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
