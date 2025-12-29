// Operation Hired - Admin Candidate Detail Page
// Phase 2.4: Read-only view of candidate details

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchCandidateDetails,
  formatTimestamp,
  getStatusColor,
  getDocumentTypeLabel,
  CandidateWithDetails,
} from '../lib/adminData';
import { CandidateStatus, STATUS_LABELS } from '../lib/firestore';

// Worker API URL from environment
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8080';

// Status badge component
function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#ffffff',
        backgroundColor: getStatusColor(status),
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// Info row component
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{value}</span>
    </div>
  );
}

export function AdminCandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [data, setData] = useState<CandidateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      return;
    }

    fetchCandidateDetails(candidateId)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch candidate:', err);
        setLoading(false);
      });
  }, [candidateId]);

  // Handle download
  async function handleDownload(format: 'pdf' | 'docx') {
    if (!candidateId) return;

    setDownloading(format);
    setDownloadError(null);

    try {
      const response = await fetch(
        `${WORKER_URL}/internal/resumeDownload/${candidateId}/${format}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // Get the binary file as a blob
      const blob = await response.blob();

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume.${format}`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading candidate...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Candidate Not Found</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            The candidate with ID "{candidateId}" could not be found.
          </p>
          <Link
            to="/admin/candidates"
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              color: 'var(--primary-gold)',
            }}
          >
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  const { documents = [], profile, resume } = data;
  const isResumeReady = data.status === 'resume_ready';

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div
        style={{
          background: isResumeReady
            ? 'linear-gradient(135deg, #276749 0%, #38a169 100%)'
            : 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)',
          padding: '2rem',
        }}
      >
        <div className="container">
          <Link
            to="/admin/candidates"
            style={{
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Candidates
          </Link>
          <h1 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>{data.name}</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>
            {data.branch} | {data.rank} | {data.mos}
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-1rem' }}>
        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Candidate Info Card */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Candidate Information</h3>
              <InfoRow label="Name" value={data.name} />
              <InfoRow label="Email" value={data.email} />
              <InfoRow label="Branch" value={data.branch} />
              <InfoRow label="Rank" value={data.rank} />
              <InfoRow label="MOS/Rate" value={data.mos} />
              <InfoRow label="Status" value={<StatusBadge status={data.status || 'created'} />} />
              {data.errorMessage && (
                <InfoRow
                  label="Error"
                  value={
                    <span style={{ color: 'var(--error-red)', fontSize: '0.75rem' }}>
                      {data.errorMessage}
                    </span>
                  }
                />
              )}
            </div>

            {/* System Info Card */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>System Information</h3>
              <InfoRow label="Candidate ID" value={<code style={{ fontSize: '0.75rem' }}>{candidateId}</code>} />
              <InfoRow label="Created" value={formatTimestamp(data.createdAt)} />
              <InfoRow label="Updated" value={formatTimestamp(data.updatedAt)} />
              <div style={{ marginTop: '1rem' }}>
                <Link
                  to={`/candidate/${candidateId}`}
                  target="_blank"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--primary-gold)',
                    fontSize: '0.875rem',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View Candidate Page
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Documents Card */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                Uploaded Documents ({documents.length})
              </h3>
              {documents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No documents uploaded
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {documents.map((doc: CandidateDocument) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--primary-gold)"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {doc.fileName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {getDocumentTypeLabel(doc.type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resume Preview Card */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Resume Preview</h3>

              {!resume ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Resume not yet generated
                </p>
              ) : (
                <>
                  {/* Summary */}
                  {resume.summary && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Summary</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {resume.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {resume.skills && resume.skills.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {resume.skills.slice(0, 10).map((skill: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'var(--bg-light)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.skills.length > 10 && (
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              color: 'var(--text-muted)',
                              fontSize: '0.75rem',
                            }}
                          >
                            +{resume.skills.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {resume.experience && resume.experience.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Experience</h4>
                      {resume.experience.slice(0, 3).map((exp: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.5rem 0',
                            borderBottom: i < Math.min(resume.experience!.length, 3) - 1 ? '1px solid var(--border-light)' : undefined,
                          }}
                        >
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{exp.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {exp.company} {exp.duration && `| ${exp.duration}`}
                          </div>
                        </div>
                      ))}
                      {resume.experience.length > 3 && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          +{resume.experience.length - 3} more positions
                        </p>
                      )}
                    </div>
                  )}

                  {/* Download buttons */}
                  {(resume.pdfPath || resume.docxPath) && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>Downloads</h4>

                      {downloadError && (
                        <div
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'var(--error-light)',
                            color: 'var(--error-red)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          {downloadError}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {resume.pdfPath && (
                          <button
                            onClick={() => handleDownload('pdf')}
                            disabled={downloading !== null}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.625rem 1rem',
                              backgroundColor: downloading === 'pdf' ? 'var(--border-medium)' : '#276749',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: downloading ? 'wait' : 'pointer',
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
                        {resume.docxPath && (
                          <button
                            onClick={() => handleDownload('docx')}
                            disabled={downloading !== null}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.625rem 1rem',
                              backgroundColor: downloading === 'docx' ? 'var(--border-medium)' : 'var(--info-blue)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: downloading ? 'wait' : 'pointer',
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {downloading === 'docx' ? 'Downloading...' : 'DOCX'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {resume.exportError && (
                    <p style={{ color: 'var(--error-red)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                      Export error: {resume.exportError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Profile Card (if available) */}
            {profile && (
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Military Profile</h3>

                {profile.yearsOfService && (
                  <InfoRow label="Years of Service" value={profile.yearsOfService} />
                )}

                {profile.certifications && profile.certifications.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Certifications</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {profile.certifications.map((cert: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--bg-light)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.awards && profile.awards.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Awards</h4>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '1.25rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {profile.awards.slice(0, 5).map((award: string, i: number) => (
                        <li key={i}>{award}</li>
                      ))}
                      {profile.awards.length > 5 && (
                        <li style={{ color: 'var(--text-muted)' }}>
                          +{profile.awards.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
