// Operation Hired - Layout Component
// Phase 2.3: Branded layout with nav and footer

import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

// Navigation items matching operationhired.com
const NAV_ITEMS = [
  { label: 'Home', href: '/', external: false },
  { label: 'Resume Generator', href: '/intake', external: false },
  { label: 'Admin', href: '/admin', external: false },
  { label: 'Hire Talent', href: 'https://operationhired.com/hire-talent/', external: true },
  { label: 'Government Services', href: 'https://operationhired.com/government-services/', external: true },
  { label: 'Contact Us', href: 'https://operationhired.com/contact/', external: true },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#1a1a1a',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '70px',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
            }}
          >
            {/* Logo placeholder - military boot icon style */}
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#C59141',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Operation Hired
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.625rem',
                  color: '#C59141',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginTop: '-2px',
                }}
              >
                Resume Generator
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            className="desktop-nav"
          >
            {NAV_ITEMS.map((item) => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 1rem',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    opacity: 0.85,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = 'rgba(197, 145, 65, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.85';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  style={{
                    padding: '0.5rem 1rem',
                    color: isActive(item.href) ? '#C59141' : '#ffffff',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.href) ? 600 : 500,
                    borderRadius: '6px',
                    backgroundColor: isActive(item.href) ? 'rgba(197, 145, 65, 0.1)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#ffffff',
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '1rem 0',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
            className="mobile-nav"
          >
            {NAV_ITEMS.map((item) => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    color: isActive(item.href) ? '#C59141' : '#ffffff',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.href) ? 600 : 500,
                    backgroundColor: isActive(item.href) ? 'rgba(197, 145, 65, 0.1)' : 'transparent',
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: 'var(--bg-light)' }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Footer Top */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#C59141',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>Operation Hired</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', maxWidth: '300px' }}>
                Empowering veterans with the tools to translate military experience into civilian career success.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', color: '#C59141' }}>
                Quick Links
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="https://operationhired.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                  Main Website
                </a>
                <Link to="/intake" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                  Resume Generator
                </Link>
                <a href="https://operationhired.com/contact/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                  Contact Us
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', color: '#C59141' }}>
                Contact
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                11715 Fox Rd. #400-206<br />
                Indianapolis, IN 46236
              </p>
            </div>
          </div>

          {/* Footer Bottom */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              paddingTop: '1.5rem',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <p>
              &copy; {new Date().getFullYear()} Operation Hired. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="https://operationhired.com/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Privacy Policy
              </a>
              <a href="https://operationhired.com/terms-of-service/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Terms of Service
              </a>
            </div>
          </div>

          {/* Confidential Note */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center',
              fontSize: '0.625rem',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <p>Powered by intent solutions io</p>
          </div>
        </div>
      </footer>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
