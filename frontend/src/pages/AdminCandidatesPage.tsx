// Operation Hired - Admin Candidates List Page
// Phase 2.4: Read-only admin dashboard for viewing candidates
// Phase 3: Updated for agency-scoped multi-tenancy

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  subscribeToAllCandidates,
  subscribeToAgencyCandidates,
  formatTimestamp,
  getStatusColor,
} from '../lib/adminData';
import { Candidate, CandidateStatus, STATUS_LABELS } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';

// Status options for filter dropdown
const STATUS_OPTIONS: Array<{ value: CandidateStatus | ''; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'created', label: 'Created' },
  { value: 'docs_uploaded', label: 'Documents Uploaded' },
  { value: 'processing', label: 'Processing' },
  { value: 'resume_ready', label: 'Resume Ready' },
  { value: 'error', label: 'Error' },
];

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

export function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | ''>('');

  // Get auth context for agency-scoped queries
  const { agency, agencyUser, signOut } = useAuth();

  // Real-time subscription to candidates (agency-scoped)
  useEffect(() => {
    setLoading(true);

    // Use agency-scoped subscription if available, else fall back to global (for backwards compat)
    const agencyId = agencyUser?.agencyId;

    const unsubscribe = agencyId
      ? subscribeToAgencyCandidates(agencyId, (data) => {
          const filtered = statusFilter
            ? data.filter((c) => c.status === statusFilter)
            : data;
          setCandidates(filtered);
          setLoading(false);
        })
      : subscribeToAllCandidates((data) => {
          const filtered = statusFilter
            ? data.filter((c) => c.status === statusFilter)
            : data;
          setCandidates(filtered);
          setLoading(false);
        });

    return () => unsubscribe();
  }, [statusFilter, agencyUser?.agencyId]);

  // Count candidates by status
  const statusCounts = candidates.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<CandidateStatus, number>
  );

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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>
                {agency ? `${agency.name} Dashboard` : 'Admin Dashboard'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                {agencyUser
                  ? `Logged in as ${agencyUser.email} (${agencyUser.role})`
                  : 'View and monitor candidate applications'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                to="/admin/settings"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                }}
              >
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-1rem' }}>
        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-gold)' }}>
              {candidates.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Candidates
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#38a169' }}>
              {statusCounts['resume_ready'] || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Resumes Ready
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d69e2e' }}>
              {statusCounts['processing'] || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Processing
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#e53e3e' }}>
              {statusCounts['error'] || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Errors
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Candidates</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label
                htmlFor="statusFilter"
                style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}
              >
                Filter by status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as CandidateStatus | '')
                }
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div
              className="spinner"
              style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}
            />
            <p style={{ color: 'var(--text-muted)' }}>Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {statusFilter
                ? `No candidates with status "${STATUS_LABELS[statusFilter]}"`
                : 'No candidates found'}
            </p>
          </div>
        ) : (
          /* Candidates Table */
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--bg-light)',
                      borderBottom: '2px solid var(--border-light)',
                    }}
                  >
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Branch</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Rank</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>MOS</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Created</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <td style={{ padding: '1rem', fontWeight: 500 }}>
                        {candidate.name}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {candidate.email}
                      </td>
                      <td style={{ padding: '1rem' }}>{candidate.branch}</td>
                      <td style={{ padding: '1rem' }}>{candidate.rank}</td>
                      <td style={{ padding: '1rem' }}>{candidate.mos}</td>
                      <td style={{ padding: '1rem' }}>
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td
                        style={{
                          padding: '1rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {formatTimestamp(candidate.createdAt)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <Link
                          to={`/admin/candidates/${candidate.id}`}
                          style={{
                            display: 'inline-block',
                            padding: '0.375rem 0.75rem',
                            backgroundColor: 'var(--primary-gold)',
                            color: '#ffffff',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          Real-time updates enabled. Data refreshes automatically.
        </p>
      </div>
    </div>
  );
}
