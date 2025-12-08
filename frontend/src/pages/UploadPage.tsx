import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface UploadedFile {
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export function UploadPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleUpload = async () => {
    if (!caseId || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      // Get signed URLs for upload
      // TODO: Use urls.urls[i].uploadUrl for actual file upload to GCS
      await apiService.requestUploadUrls(caseId, files.map((f) => f.name));

      // Upload each file using signed URLs
      for (let i = 0; i < files.length; i++) {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
        );

        try {
          // TODO: Implement actual file upload to signed URL
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate upload

          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f))
          );
        } catch {
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'error' } : f))
          );
        }
      }

      // Navigate to status page
      navigate(`/case/${caseId}/status`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '0.5rem' }}>Upload Documents</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Case ID: {caseId}</p>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div
          style={{
            border: '2px dashed #444',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Drop files here or click to browse
            </p>
            <p style={{ color: '#888', fontSize: '0.875rem' }}>
              PDF, DOC, DOCX, TXT (max 10MB each)
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Selected Files</h3>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  borderRadius: '4px',
                  marginBottom: '0.5rem',
                }}
              >
                <span>{file.name}</span>
                <div>
                  {file.status === 'uploading' && <span style={{ color: '#646cff' }}>Uploading...</span>}
                  {file.status === 'done' && <span style={{ color: '#4ade80' }}>Done</span>}
                  {file.status === 'error' && <span style={{ color: '#ff6b6b' }}>Error</span>}
                  {file.status === 'pending' && (
                    <button onClick={() => removeFile(index)} style={{ padding: '0.25rem 0.5rem' }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}

        <button
          className="primary"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          style={{ width: '100%' }}
        >
          {uploading ? 'Uploading...' : 'Upload and Generate Resume'}
        </button>
      </div>
    </div>
  );
}
