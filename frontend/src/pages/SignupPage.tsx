// Operation Hired - Agency Signup Page
// Phase 4: Agency Onboarding

import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export function SignupPage() {
  const [step, setStep] = useState<'agency' | 'account' | 'complete'>('agency');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agency info
  const [agencyName, setAgencyName] = useState('');
  const [agencySlug, setAgencySlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Account info
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  // Auto-generate slug from agency name
  const handleAgencyNameChange = (value: string) => {
    setAgencyName(value);
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setAgencySlug(slug);
  };

  const handleAgencySubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agencyName.trim()) {
      setError('Agency name is required');
      return;
    }
    if (!agencySlug.trim()) {
      setError('Agency slug is required');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(agencySlug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    setStep('account');
  };

  const handleAccountSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ownerName.trim()) {
      setError('Your name is required');
      return;
    }
    if (!ownerEmail.trim()) {
      setError('Email is required');
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

    setLoading(true);

    try {
      // Call backend API to create agency
      const response = await fetch(
        `${import.meta.env.VITE_WORKER_URL}/api/agencies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: agencyName,
            slug: agencySlug,
            contactEmail: contactEmail || ownerEmail,
            ownerName,
            ownerEmail,
            password,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create agency');
      }

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agency');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Agency Info
  if (step === 'agency') {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', padding: '2rem' }}>
        <div
          className="card"
          style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}
        >
          {/* Progress Indicator */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-gold)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              1
            </div>
            <div
              style={{
                width: '60px',
                height: '2px',
                backgroundColor: 'var(--border-light)',
                alignSelf: 'center',
              }}
            />
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--border-light)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              2
            </div>
          </div>

          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            Create Your Agency
          </h1>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              marginBottom: '2rem',
            }}
          >
            Step 1: Agency Information
          </p>

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

          <form onSubmit={handleAgencySubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="agencyName"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Agency Name *
              </label>
              <input
                id="agencyName"
                type="text"
                value={agencyName}
                onChange={(e) => handleAgencyNameChange(e.target.value)}
                required
                placeholder="e.g., Hire Heroes USA"
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
                htmlFor="agencySlug"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Agency URL Slug *
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-light)',
                    border: '1px solid var(--border-light)',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  operationhired.com/
                </span>
                <input
                  id="agencySlug"
                  type="text"
                  value={agencySlug}
                  onChange={(e) => setAgencySlug(e.target.value.toLowerCase())}
                  required
                  placeholder="hire-heroes"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <p
                style={{
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                Only lowercase letters, numbers, and hyphens
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="contactEmail"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Contact Email (Optional)
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@agency.com"
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
                Defaults to your account email if left blank
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem' }}
            >
              Continue
            </button>
          </form>

          <p
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-gold)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Account Info
  if (step === 'account') {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', padding: '2rem' }}>
        <div
          className="card"
          style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}
        >
          {/* Progress Indicator */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#38a169',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              ✓
            </div>
            <div
              style={{
                width: '60px',
                height: '2px',
                backgroundColor: 'var(--primary-gold)',
                alignSelf: 'center',
              }}
            />
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-gold)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              2
            </div>
          </div>

          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            Create Your Account
          </h1>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              marginBottom: '2rem',
            }}
          >
            Step 2: Owner Account for <strong>{agencyName}</strong>
          </p>

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

          <form onSubmit={handleAccountSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="ownerName"
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
                id="ownerName"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
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
                htmlFor="ownerEmail"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Email Address *
              </label>
              <input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
                placeholder="you@agency.com"
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

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setStep('agency')}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  backgroundColor: 'var(--bg-light)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '0.875rem',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Creating...' : 'Create Agency'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Complete
  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', padding: '2rem' }}>
      <div
        className="card"
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem',
            backgroundColor: '#38a169',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ marginBottom: '0.5rem' }}>Welcome to Operation Hired!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Your agency <strong>{agencyName}</strong> has been created successfully.
        </p>

        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-light)',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Your agency URL:
          </p>
          <p style={{ fontWeight: 600, margin: '0.5rem 0 0' }}>
            operationhired.com/{agencySlug}
          </p>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.875rem' }}
        >
          Sign In to Your Dashboard
        </button>

        <p
          style={{
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          Check your email for a verification link to complete your account setup.
        </p>
      </div>
    </div>
  );
}
