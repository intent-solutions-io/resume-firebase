import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
          Resume Generator
        </Link>
        <nav>
          <Link to="/create" style={{ marginLeft: '2rem' }}>Create Resume</Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer style={{
        padding: '1rem 2rem',
        borderTop: '1px solid #333',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        <p>intent solutions io — confidential IP</p>
        <p>Contact: jeremy@intentsolutions.io</p>
      </footer>
    </div>
  );
}
