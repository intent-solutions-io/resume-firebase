import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import { StatusPage } from './pages/StatusPage';
import { DownloadPage } from './pages/DownloadPage';
import { ReviewPage } from './pages/ReviewPage';
// Operation Hired Intake Flow
import { IntakePage } from './pages/IntakePage';
import { IntakeDocumentsPage } from './pages/IntakeDocumentsPage';
import { IntakeCompletePage } from './pages/IntakeCompletePage';
import { CandidatePage } from './pages/CandidatePage';
// Auth Pages (Phase 3 + Phase 4: Multi-tenancy)
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
// Admin Dashboard (Phase 2.4 + Phase 3 Multi-tenancy)
import { AdminCandidatesPage } from './pages/AdminCandidatesPage';
import { AdminCandidateDetailPage } from './pages/AdminCandidateDetailPage';
import { AgencySettingsPage } from './pages/AgencySettingsPage';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/invite/accept" element={<AcceptInvitePage />} />

          {/* Legacy /create redirects to Operation Hired intake */}
          <Route path="/create" element={<Navigate to="/intake" replace />} />
          <Route path="/case/:caseId/upload" element={<UploadPage />} />
          <Route path="/case/:caseId/status" element={<StatusPage />} />
          <Route path="/case/:caseId/download" element={<DownloadPage />} />
          <Route path="/review" element={<ReviewPage />} />

          {/* Operation Hired - Military Resume Intake (Public) */}
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/intake/:candidateId/documents" element={<IntakeDocumentsPage />} />
          <Route path="/intake/:candidateId/complete" element={<IntakeCompletePage />} />

          {/* Canonical candidate resume URL (shareable) */}
          <Route path="/candidate/:candidateId" element={<CandidatePage />} />

          {/* Protected Admin Routes (Phase 3: Multi-tenancy) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminCandidatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/candidates"
            element={
              <ProtectedRoute>
                <AdminCandidatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/candidates/:candidateId"
            element={
              <ProtectedRoute>
                <AdminCandidateDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AgencySettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
