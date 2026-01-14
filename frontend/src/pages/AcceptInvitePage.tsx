// Operation Hired - Accept Invitation Page
// Phase 4: Agency Onboarding

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createAccount } from '../lib/auth';

interface Invitation {
  id: string;
  agencyId: string;
  agencyName: string;
  email: string;
  role: string;
  invitedBy: string;
  expiresAt: string;
}

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get('id');
  const inviteToken = searchParams.get('token');

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!inviteId || !inviteToken) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_WORKER_URL}/api/invitations/${inviteId}?token=${inviteToken}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Invitation not found');
        }

        const data = await response.json();
        setInvitation(data.invitation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [inviteId, inviteToken]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Name is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      // Create Firebase Auth account
      const user = await createAccount(invitation!.email, password, displayName);

      // Accept invitation via API
      const response = await fetch(
        `${import.meta.env.VITE_WORKER_URL}/api/invitations/${inviteId}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ token: inviteToken }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invitation');
      }

      // Redirect to dashboard
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="spinner"
            style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '400px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              backgroundColor: '#e53e3e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Invalid Invitation</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <Link
            to="/login"
            className="btn btn-primary"
            style={{ display: 'inline-block', padding: '0.75rem 2rem' }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', padding: '2rem' }}>
      <div
        className="card"
        style={{ maxWidth: '450px', margin: '0 auto', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              backgroundColor: 'var(--primary-gold)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Join {invitation?.agencyName}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            You've been invited to join as a{' '}
            <strong>{invitation?.role}</strong>
          </p>
        </div>

        {/* Invitation Details */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-light)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            <span style={{ color: 'var(--text-muted)' }}>Email:</span>{' '}
            <strong>{invitation?.email}</strong>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(229, 62, 62, 0.1)',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid rgba(229, 62, 62, 0.3)',
            }}
          >
            <p style={{ color: '#e53e3e', fontSize: '0.875rem', margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="displayName"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Your Name *
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="John Smith"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
              minLength={8}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your password"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.875rem',
              fontSize: '1rem',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Creating Account...' : 'Accept Invitation'}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            fontSize: '0.875rem',
          }}
        >
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-gold)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
