// Operation Hired - Agency Settings Page
// Phase 3: Agency Admin UI

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function AgencySettingsPage() {
  const { agency, agencyUser, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!agency || !agencyUser) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading agency settings...</p>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // TODO: Implement settings update via API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)',
          padding: '2rem',
        }}
      >
        <div className="container">
          <h1 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>
            Agency Settings
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>
            Manage your agency configuration and preferences
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '1.5rem' }}>
        {/* Message */}
        {message && (
          <div
            className="card"
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor:
                message.type === 'success'
                  ? 'rgba(56, 161, 105, 0.1)'
                  : 'rgba(229, 62, 62, 0.1)',
              border: `1px solid ${
                message.type === 'success'
                  ? 'rgba(56, 161, 105, 0.3)'
                  : 'rgba(229, 62, 62, 0.3)'
              }`,
            }}
          >
            <p
              style={{
                margin: 0,
                color: message.type === 'success' ? '#38a169' : '#e53e3e',
              }}
            >
              {message.text}
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Agency Info Card */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
              Agency Information
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Agency Name
              </label>
              <input
                type="text"
                value={agency.name}
                disabled={!isAdmin}
                readOnly
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: isAdmin ? '#fff' : 'var(--bg-light)',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Contact Email
              </label>
              <input
                type="email"
                value={agency.contactEmail}
                disabled={!isAdmin}
                readOnly
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: isAdmin ? '#fff' : 'var(--bg-light)',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Agency Slug (URL)
              </label>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-light)',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                }}
              >
                operationhired.com/agency/<strong>{agency.slug}</strong>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Account Status
              </label>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor:
                    agency.status === 'active'
                      ? '#38a169'
                      : agency.status === 'trial'
                      ? '#d69e2e'
                      : '#e53e3e',
                }}
              >
                {agency.status.charAt(0).toUpperCase() + agency.status.slice(1)}
              </span>
            </div>
          </div>

          {/* User Info Card */}
          <div className="card">
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
              Your Account
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Email
              </label>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-light)',
                }}
              >
                {agencyUser.email}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Role
              </label>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor:
                    agencyUser.role === 'owner'
                      ? '#805ad5'
                      : agencyUser.role === 'admin'
                      ? '#3182ce'
                      : agencyUser.role === 'recruiter'
                      ? '#38a169'
                      : '#718096',
                }}
              >
                {agencyUser.role.charAt(0).toUpperCase() + agencyUser.role.slice(1)}
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Member Since
              </label>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-light)',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                }}
              >
                {agencyUser.createdAt
                  ? new Date(
                      typeof agencyUser.createdAt === 'object'
                        ? (agencyUser.createdAt as { toDate: () => Date }).toDate()
                        : agencyUser.createdAt
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Settings Card (Admin Only) */}
          {isAdmin && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
                Agency Settings
              </h2>

              <div
                style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    Document Retention (Days)
                  </label>
                  <input
                    type="number"
                    defaultValue={agency.settings?.retentionDays || 90}
                    min={30}
                    max={365}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                  <p
                    style={{
                      marginTop: '0.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    How long to keep candidate documents
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    Brand Color
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="color"
                      defaultValue={agency.settings?.brandColor || '#C59141'}
                      style={{
                        width: '50px',
                        height: '42px',
                        padding: '0',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      defaultValue={agency.settings?.brandColor || '#C59141'}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="/admin/candidates"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--bg-light)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          >
            ← Back to Candidates
          </a>
          {isAdmin && (
            <a
              href="/admin/users"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--bg-light)',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            >
              Manage Users →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
