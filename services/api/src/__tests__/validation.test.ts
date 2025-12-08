/**
 * API Validation Tests
 * Tests that API endpoints properly validate requests using shared schemas
 */

import { describe, it, expect } from 'vitest';
import {
  createCaseSchema,
  requestUploadUrlsSchema,
  processCasePayloadSchema,
  generateArtifactPayloadSchema,
  reviewerUpdateSchema,
} from '@resume-generator/shared/schemas';

describe('API Request Validation', () => {
  describe('POST /v1/cases - createCaseSchema', () => {
    it('accepts valid case creation request', () => {
      const validRequest = {
        name: 'John Doe',
        email: 'john@example.com',
        targetRole: 'Software Engineer',
      };
      expect(() => createCaseSchema.parse(validRequest)).not.toThrow();
    });

    it('accepts request without optional targetRole', () => {
      const validRequest = {
        name: 'Jane Smith',
        email: 'jane@example.com',
      };
      expect(() => createCaseSchema.parse(validRequest)).not.toThrow();
    });

    it('rejects request with missing name', () => {
      const invalidRequest = {
        email: 'john@example.com',
      };
      expect(() => createCaseSchema.parse(invalidRequest)).toThrow();
    });

    it('rejects request with missing email', () => {
      const invalidRequest = {
        name: 'John Doe',
      };
      expect(() => createCaseSchema.parse(invalidRequest)).toThrow();
    });

    it('rejects request with invalid email format', () => {
      const invalidRequest = {
        name: 'John Doe',
        email: 'not-valid-email',
      };
      expect(() => createCaseSchema.parse(invalidRequest)).toThrow();
    });

    it('rejects request with empty name', () => {
      const invalidRequest = {
        name: '',
        email: 'john@example.com',
      };
      expect(() => createCaseSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('POST /v1/cases/:caseId/uploads:request - requestUploadUrlsSchema', () => {
    it('accepts valid file upload request', () => {
      const validRequest = {
        fileNames: ['resume.pdf'],
      };
      expect(() => requestUploadUrlsSchema.parse(validRequest)).not.toThrow();
    });

    it('accepts multiple file names', () => {
      const validRequest = {
        fileNames: ['resume.pdf', 'cover-letter.docx', 'portfolio.pdf'],
      };
      expect(() => requestUploadUrlsSchema.parse(validRequest)).not.toThrow();
    });

    it('rejects empty fileNames array', () => {
      const invalidRequest = {
        fileNames: [],
      };
      expect(() => requestUploadUrlsSchema.parse(invalidRequest)).toThrow();
    });

    it('rejects request with more than 10 files', () => {
      const invalidRequest = {
        fileNames: Array(11).fill('file.pdf'),
      };
      expect(() => requestUploadUrlsSchema.parse(invalidRequest)).toThrow();
    });

    it('rejects request with empty file name string', () => {
      const invalidRequest = {
        fileNames: ['resume.pdf', ''],
      };
      expect(() => requestUploadUrlsSchema.parse(invalidRequest)).toThrow();
    });

    it('rejects missing fileNames field', () => {
      const invalidRequest = {};
      expect(() => requestUploadUrlsSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('Cloud Tasks Payload Validation', () => {
    describe('processCasePayloadSchema', () => {
      it('accepts valid UUID caseId', () => {
        const validPayload = {
          caseId: '550e8400-e29b-41d4-a716-446655440000',
        };
        expect(() => processCasePayloadSchema.parse(validPayload)).not.toThrow();
      });

      it('rejects non-UUID caseId', () => {
        const invalidPayload = {
          caseId: 'not-a-uuid',
        };
        expect(() => processCasePayloadSchema.parse(invalidPayload)).toThrow();
      });

      it('rejects missing caseId', () => {
        const invalidPayload = {};
        expect(() => processCasePayloadSchema.parse(invalidPayload)).toThrow();
      });

      it('rejects empty string caseId', () => {
        const invalidPayload = {
          caseId: '',
        };
        expect(() => processCasePayloadSchema.parse(invalidPayload)).toThrow();
      });
    });

    describe('generateArtifactPayloadSchema', () => {
      it('accepts valid payload with resume_json type', () => {
        const validPayload = {
          caseId: '550e8400-e29b-41d4-a716-446655440000',
          artifactType: 'resume_json',
        };
        expect(() => generateArtifactPayloadSchema.parse(validPayload)).not.toThrow();
      });

      it('accepts valid payload with resume_pdf type', () => {
        const validPayload = {
          caseId: '550e8400-e29b-41d4-a716-446655440000',
          artifactType: 'resume_pdf',
        };
        expect(() => generateArtifactPayloadSchema.parse(validPayload)).not.toThrow();
      });

      it('rejects invalid artifact type', () => {
        const invalidPayload = {
          caseId: '550e8400-e29b-41d4-a716-446655440000',
          artifactType: 'invalid_type',
        };
        expect(() => generateArtifactPayloadSchema.parse(invalidPayload)).toThrow();
      });

      it('rejects missing caseId', () => {
        const invalidPayload = {
          artifactType: 'resume_json',
        };
        expect(() => generateArtifactPayloadSchema.parse(invalidPayload)).toThrow();
      });

      it('rejects missing artifactType', () => {
        const invalidPayload = {
          caseId: '550e8400-e29b-41d4-a716-446655440000',
        };
        expect(() => generateArtifactPayloadSchema.parse(invalidPayload)).toThrow();
      });
    });
  });

  describe('Reviewer Console Validation', () => {
    describe('POST /v1/cases/:caseId/review - reviewerUpdateSchema', () => {
      it('accepts valid review update with approved status', () => {
        const validRequest = {
          status: 'approved',
        };
        expect(() => reviewerUpdateSchema.parse(validRequest)).not.toThrow();
      });

      it('accepts valid review update with rejected status', () => {
        const validRequest = {
          status: 'rejected',
          notes: 'Resume contains inaccurate information',
        };
        expect(() => reviewerUpdateSchema.parse(validRequest)).not.toThrow();
      });

      it('accepts valid review update with needs_fix status', () => {
        const validRequest = {
          status: 'needs_fix',
          notes: 'Please verify employment dates',
        };
        expect(() => reviewerUpdateSchema.parse(validRequest)).not.toThrow();
      });

      it('accepts review update without notes', () => {
        const validRequest = {
          status: 'approved',
        };
        const result = reviewerUpdateSchema.parse(validRequest);
        expect(result.notes).toBeUndefined();
      });

      it('rejects invalid review status', () => {
        const invalidRequest = {
          status: 'pending',
        };
        expect(() => reviewerUpdateSchema.parse(invalidRequest)).toThrow();
      });

      it('rejects missing status', () => {
        const invalidRequest = {
          notes: 'Some reviewer notes',
        };
        expect(() => reviewerUpdateSchema.parse(invalidRequest)).toThrow();
      });

      it('rejects notes exceeding max length', () => {
        const invalidRequest = {
          status: 'needs_fix',
          notes: 'x'.repeat(2001),
        };
        expect(() => reviewerUpdateSchema.parse(invalidRequest)).toThrow();
      });

      it('accepts empty notes string', () => {
        const validRequest = {
          status: 'approved',
          notes: '',
        };
        expect(() => reviewerUpdateSchema.parse(validRequest)).not.toThrow();
      });
    });
  });
});
