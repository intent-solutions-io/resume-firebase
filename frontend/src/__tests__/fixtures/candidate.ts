export const mockCandidate = {
  id: 'test-candidate-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0100',
  branch: 'Army' as const,
  rank: 'E-5',
  mos: '11B',
  yearsOfService: 5,
  status: 'created' as const,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

export const mockCandidateWithDocs = {
  ...mockCandidate,
  id: 'test-candidate-456',
  status: 'docs_uploaded' as const,
};

export const mockCandidateProcessing = {
  ...mockCandidate,
  id: 'test-candidate-789',
  status: 'processing' as const,
};

export const mockCandidateReady = {
  ...mockCandidate,
  id: 'test-candidate-999',
  status: 'resume_ready' as const,
};

export const mockDocument = {
  id: 'test-doc-456',
  candidateId: 'test-candidate-123',
  fileName: 'dd214.pdf',
  fileType: 'application/pdf',
  fileSize: 1024000, // 1MB
  storagePath: 'candidates/test-candidate-123/documents/dd214.pdf',
  type: 'dd214' as const,
  uploadedAt: new Date('2025-01-01T01:00:00Z'),
};

export const mockDocuments = [
  mockDocument,
  {
    ...mockDocument,
    id: 'test-doc-457',
    fileName: 'erb.pdf',
    type: 'erb' as const,
  },
];
