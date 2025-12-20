import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CreateCasePage } from './pages/CreateCasePage';
import { UploadPage } from './pages/UploadPage';
import { StatusPage } from './pages/StatusPage';
import { DownloadPage } from './pages/DownloadPage';
import { ReviewPage } from './pages/ReviewPage';
// Operation Hired Intake Flow
import { IntakePage } from './pages/IntakePage';
import { IntakeDocumentsPage } from './pages/IntakeDocumentsPage';
import { IntakeCompletePage } from './pages/IntakeCompletePage';
import { CandidatePage } from './pages/CandidatePage';
// Admin Dashboard (Phase 2.4)
import { AdminCandidatesPage } from './pages/AdminCandidatesPage';
import { AdminCandidateDetailPage } from './pages/AdminCandidateDetailPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateCasePage />} />
        <Route path="/case/:caseId/upload" element={<UploadPage />} />
        <Route path="/case/:caseId/status" element={<StatusPage />} />
        <Route path="/case/:caseId/download" element={<DownloadPage />} />
        <Route path="/review" element={<ReviewPage />} />
        {/* Operation Hired - Military Resume Intake */}
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/intake/:candidateId/documents" element={<IntakeDocumentsPage />} />
        <Route path="/intake/:candidateId/complete" element={<IntakeCompletePage />} />
        {/* Canonical candidate resume URL (shareable) */}
        <Route path="/candidate/:candidateId" element={<CandidatePage />} />
        {/* Admin Dashboard (Phase 2.4) */}
        <Route path="/admin" element={<AdminCandidatesPage />} />
        <Route path="/admin/candidates" element={<AdminCandidatesPage />} />
        <Route path="/admin/candidates/:candidateId" element={<AdminCandidateDetailPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
