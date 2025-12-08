import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Resume Generator</h1>
      <p style={{ fontSize: '1.25rem', color: '#888', marginBottom: '2rem' }}>
        AI-powered resume creation from your documents
      </p>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>How it works</h2>
        <ol style={{ textAlign: 'left', lineHeight: '2' }}>
          <li>Create a new case</li>
          <li>Upload your documents (LinkedIn PDF, existing resume, etc.)</li>
          <li>Our AI analyzes and generates your resume</li>
          <li>Download your polished resume</li>
        </ol>

        <Link to="/create">
          <button className="primary" style={{ marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
}
