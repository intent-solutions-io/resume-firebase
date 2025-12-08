import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService, CaseArtifact } from '../services/api';

export function DownloadPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    const fetchArtifacts = async () => {
      try {
        const result = await apiService.getCaseStatus(caseId);
        setArtifacts(result.artifacts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch artifacts');
      } finally {
        setLoading(false);
      }
    };

    fetchArtifacts();
  }, [caseId]);

  const handleDownload = async (artifact: CaseArtifact) => {
    try {
      // Get signed download URL
      const downloadUrl = await apiService.getDownloadUrl(caseId!, artifact.id);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download URL');
    }
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'resume_json':
        return '📄';
      case 'resume_pdf':
        return '📑';
      default:
        return '📁';
    }
  };

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Your Resume is Ready!</h1>
      <p style={{ color: '#888', marginBottom: '3rem' }}>Case ID: {caseId}</p>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <p>Loading artifacts...</p>
        ) : error ? (
          <div style={{ color: '#ff6b6b' }}>{error}</div>
        ) : artifacts.length === 0 ? (
          <p>No artifacts found</p>
        ) : (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Available Downloads</h2>
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#2a2a2a',
                  borderRadius: '8px',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{getArtifactIcon(artifact.type)}</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 'bold' }}>{artifact.name}</p>
                    <p style={{ color: '#888', fontSize: '0.875rem' }}>{artifact.type}</p>
                  </div>
                </div>
                <button className="primary" onClick={() => handleDownload(artifact)}>
                  Download
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #333' }}>
          <Link to="/create">
            <button>Create Another Resume</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
