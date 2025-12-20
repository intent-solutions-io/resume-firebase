// Operation Hired - Candidate Resume Page
// Phase 2.3: Canonical route for viewing/sharing resume
// Route: /candidate/:candidateId

import { useParams, Navigate } from 'react-router-dom';

// This is an alias for IntakeCompletePage - redirects to the intake flow completion
// The canonical URL /candidate/:candidateId can be shared and bookmarked
export function CandidatePage() {
  const { candidateId } = useParams<{ candidateId: string }>();

  // Redirect to the intake complete page
  // This allows the /candidate/:id URL to be used as a shareable link
  if (candidateId) {
    return <Navigate to={`/intake/${candidateId}/complete`} replace />;
  }

  // No candidateId provided
  return <Navigate to="/intake" replace />;
}
