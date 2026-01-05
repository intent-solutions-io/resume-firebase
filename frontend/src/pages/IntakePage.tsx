// Operation Hired - Candidate Intake Page
// Phase 2.3: Updated with Operation Hired branding and improved UX

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createCandidate,
  CandidateInput,
  MilitaryBranch,
  MILITARY_BRANCHES,
} from '../lib/firestore';
import { isFirebaseConfigured } from '../lib/firebase';

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

export function IntakePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CandidateInput>({
    name: '',
    email: '',
    branch: 'Army' as MilitaryBranch,
    rank: '',
    mos: '',
    targetJobDescription: '',
  });
  const [showJobField, setShowJobField] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate Firebase configuration
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Please check environment variables.');
      setLoading(false);
      return;
    }

    try {
      const candidateId = await createCandidate(formData);
      navigate(`/intake/${candidateId}/documents`);
    } catch (err) {
      console.error('Failed to create candidate:', err);
      setError(err instanceof Error ? err.message : 'Failed to create candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1
            style={{
              color: '#ffffff',
              marginBottom: '1rem',
              fontSize: '2.25rem',
            }}
          >
            Military-to-Civilian Resume Generator
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '1.125rem',
              lineHeight: '1.7',
              marginBottom: '0.5rem',
            }}
          >
            Transform your military experience into language that civilian hiring managers understand.
          </p>
          <p
            style={{
              color: '#C59141',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            AI-powered • ATS-friendly • Free for veterans
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="container" style={{ marginTop: '-2rem' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Step Indicator */}
          <StepIndicator currentStep={1} />

          <h2 style={{ marginBottom: '0.5rem' }}>Tell Us About Yourself</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            We'll use this information to personalize your resume.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label>
                Full Name <span style={{ color: 'var(--error-red)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label>
                Email <span style={{ color: 'var(--error-red)' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.smith@email.com"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                We'll send your completed resume here.
              </p>
            </div>

            {/* Branch */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label>
                Branch of Service <span style={{ color: 'var(--error-red)' }}>*</span>
              </label>
              <select
                required
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value as MilitaryBranch })
                }
              >
                {MILITARY_BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            {/* Rank and MOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label>Rank</label>
                <input
                  type="text"
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  placeholder="SSG, CPT, etc."
                />
              </div>

              <div>
                <label>MOS/Rating/AFSC</label>
                <input
                  type="text"
                  value={formData.mos}
                  onChange={(e) => setFormData({ ...formData, mos: e.target.value })}
                  placeholder="11B, IT, 3D1X1"
                />
              </div>
            </div>

            {/* Target Job Description (Optional) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setShowJobField(!showJobField)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C59141',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: 0,
                  marginBottom: showJobField ? '0.75rem' : 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: showJobField ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {showJobField ? 'Hide target job' : 'Have a specific job in mind? (Optional)'}
              </button>

              {showJobField && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <label>Target Job Description</label>
                  <textarea
                    value={formData.targetJobDescription || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, targetJobDescription: e.target.value })
                    }
                    placeholder="Paste the job posting here to optimize your resume for this specific role. We'll extract keywords and tailor your resume to match..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    This helps us optimize your resume for ATS systems and include relevant keywords.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="primary"
              disabled={loading}
              style={{ width: '100%', padding: '1rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ marginRight: '0.5rem' }} />
                  Creating Profile...
                </>
              ) : (
                'Continue to Document Upload'
              )}
            </button>
          </form>
        </div>

        {/* Trust Indicators */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '2rem',
            padding: '1rem',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Your information is secure and will only be used to generate your resume.
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span style={{ fontSize: '0.75rem' }}>Secure & Private</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontSize: '0.75rem' }}>Veteran-Owned</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: '0.75rem' }}>100% Free</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
