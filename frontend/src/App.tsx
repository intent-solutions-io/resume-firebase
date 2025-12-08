import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CreateCasePage } from './pages/CreateCasePage';
import { UploadPage } from './pages/UploadPage';
import { StatusPage } from './pages/StatusPage';
import { DownloadPage } from './pages/DownloadPage';
import { ReviewPage } from './pages/ReviewPage';

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
      </Routes>
    </Layout>
  );
}

export default App;
