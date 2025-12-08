import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, CaseStatus } from '../services/api';

export function StatusPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CaseStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    const fetchStatus = async () => {
      try {
        const result = await apiService.getCaseStatus(caseId);
        setStatus(result);

        if (result.status === 'completed') {
          navigate(`/case/${caseId}/download`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      }
    };

    // Poll every 5 seconds
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [caseId, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#888';
      case 'processing':
        return '#646cff';
      case 'completed':
        return '#4ade80';
      case 'failed':
        return '#ff6b6b';
      default:
        return '#888';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting to start...';
      case 'processing':
        return 'Generating your resume...';
      case 'completed':
        return 'Resume ready!';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Processing Your Resume</h1>
      <p style={{ color: '#888', marginBottom: '3rem' }}>Case ID: {caseId}</p>

      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        {error ? (
          <div style={{ color: '#ff6b6b' }}>{error}</div>
        ) : status ? (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: `4px solid ${getStatusColor(status.status)}`,
                margin: '0 auto 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {status.status === 'processing' && (
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '4px solid transparent',
                    borderTopColor: '#646cff',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              )}
              {status.status === 'completed' && <span style={{ fontSize: '2rem' }}>✓</span>}
              {status.status === 'failed' && <span style={{ fontSize: '2rem' }}>✕</span>}
            </div>

            <h2 style={{ color: getStatusColor(status.status), marginBottom: '1rem' }}>
              {getStatusText(status.status)}
            </h2>

            {status.currentStep && (
              <p style={{ color: '#888' }}>Current step: {status.currentStep}</p>
            )}

            {status.progress !== undefined && (
              <div style={{ marginTop: '1.5rem' }}>
                <div
                  style={{
                    height: '8px',
                    background: '#333',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${status.progress}%`,
                      background: '#646cff',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#888' }}>
                  {status.progress}% complete
                </p>
              </div>
            )}
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
