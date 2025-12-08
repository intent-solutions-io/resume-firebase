/**
 * Contract Tests for Shared Schemas
 * Validates that schemas accept valid payloads and reject malformed ones
 */

import { describe, it, expect } from 'vitest';
import {
  createCaseSchema,
  requestUploadUrlsSchema,
  processCasePayloadSchema,
  generateArtifactPayloadSchema,
  resumeJsonSchema,
  caseStatusSchema,
  artifactTypeSchema,
  isValidFileName,
  isValidFileSize,
  MAX_FILE_SIZE,
} from '../schemas/index.js';

describe('createCaseSchema', () => {
  it('accepts valid input with all fields', () => {
    const valid = {
      name: 'John Doe',
      email: 'john@example.com',
      targetRole: 'Software Engineer',
    };
    expect(() => createCaseSchema.parse(valid)).not.toThrow();
  });

  it('accepts valid input without optional targetRole', () => {
    const valid = {
      name: 'John Doe',
      email: 'john@example.com',
    };
    expect(() => createCaseSchema.parse(valid)).not.toThrow();
  });

  it('rejects empty name', () => {
    const invalid = {
      name: '',
      email: 'john@example.com',
    };
    expect(() => createCaseSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid email', () => {
    const invalid = {
      name: 'John Doe',
      email: 'not-an-email',
    };
    expect(() => createCaseSchema.parse(invalid)).toThrow();
  });

  it('rejects name exceeding max length', () => {
    const invalid = {
      name: 'x'.repeat(201),
      email: 'john@example.com',
    };
    expect(() => createCaseSchema.parse(invalid)).toThrow();
  });
});

describe('requestUploadUrlsSchema', () => {
  it('accepts valid file names array', () => {
    const valid = {
      fileNames: ['resume.pdf', 'cover-letter.docx'],
    };
    expect(() => requestUploadUrlsSchema.parse(valid)).not.toThrow();
  });

  it('rejects empty array', () => {
    const invalid = {
      fileNames: [],
    };
    expect(() => requestUploadUrlsSchema.parse(invalid)).toThrow();
  });

  it('rejects more than 10 files', () => {
    const invalid = {
      fileNames: Array(11).fill('file.pdf'),
    };
    expect(() => requestUploadUrlsSchema.parse(invalid)).toThrow();
  });

  it('rejects empty file name', () => {
    const invalid = {
      fileNames: [''],
    };
    expect(() => requestUploadUrlsSchema.parse(invalid)).toThrow();
  });
});

describe('processCasePayloadSchema', () => {
  it('accepts valid UUID', () => {
    const valid = {
      caseId: '550e8400-e29b-41d4-a716-446655440000',
    };
    expect(() => processCasePayloadSchema.parse(valid)).not.toThrow();
  });

  it('rejects non-UUID string', () => {
    const invalid = {
      caseId: 'not-a-uuid',
    };
    expect(() => processCasePayloadSchema.parse(invalid)).toThrow();
  });

  it('rejects empty string', () => {
    const invalid = {
      caseId: '',
    };
    expect(() => processCasePayloadSchema.parse(invalid)).toThrow();
  });

  it('rejects missing caseId', () => {
    const invalid = {};
    expect(() => processCasePayloadSchema.parse(invalid)).toThrow();
  });
});

describe('generateArtifactPayloadSchema', () => {
  it('accepts valid payload with resume_json type', () => {
    const valid = {
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      artifactType: 'resume_json',
    };
    expect(() => generateArtifactPayloadSchema.parse(valid)).not.toThrow();
  });

  it('accepts valid payload with resume_pdf type', () => {
    const valid = {
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      artifactType: 'resume_pdf',
    };
    expect(() => generateArtifactPayloadSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid artifact type', () => {
    const invalid = {
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      artifactType: 'invalid_type',
    };
    expect(() => generateArtifactPayloadSchema.parse(invalid)).toThrow();
  });
});

describe('caseStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(() => caseStatusSchema.parse('pending')).not.toThrow();
    expect(() => caseStatusSchema.parse('processing')).not.toThrow();
    expect(() => caseStatusSchema.parse('completed')).not.toThrow();
    expect(() => caseStatusSchema.parse('failed')).not.toThrow();
  });

  it('rejects invalid status', () => {
    expect(() => caseStatusSchema.parse('unknown')).toThrow();
  });
});

describe('artifactTypeSchema', () => {
  it('accepts valid artifact types', () => {
    expect(() => artifactTypeSchema.parse('resume_json')).not.toThrow();
    expect(() => artifactTypeSchema.parse('resume_pdf')).not.toThrow();
  });

  it('rejects invalid artifact type', () => {
    expect(() => artifactTypeSchema.parse('invalid')).toThrow();
  });
});

describe('resumeJsonSchema', () => {
  it('accepts valid minimal resume', () => {
    const valid = {
      metadata: {
        version: '1.0',
        generatedAt: '2025-12-08T00:00:00Z',
      },
      contact: {
        name: 'John Doe',
      },
      summary: 'Experienced software engineer.',
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: [],
        certifications: [],
        languages: [],
      },
    };
    expect(() => resumeJsonSchema.parse(valid)).not.toThrow();
  });

  it('accepts complete resume with all fields', () => {
    const valid = {
      metadata: {
        version: '1.0',
        generatedAt: '2025-12-08T00:00:00Z',
        targetRole: 'Software Engineer',
      },
      contact: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-123-4567',
        location: 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/johndoe',
        portfolio: 'https://johndoe.dev',
      },
      summary: 'Experienced software engineer with 10 years of experience.',
      experience: [
        {
          title: 'Senior Engineer',
          company: 'Tech Corp',
          location: 'San Francisco',
          startDate: '2020-01',
          endDate: '2024-12',
          current: false,
          description: 'Led engineering team',
          achievements: ['Increased revenue by 50%'],
        },
      ],
      education: [
        {
          degree: 'BS Computer Science',
          institution: 'MIT',
          location: 'Cambridge, MA',
          graduationDate: '2015-05',
          gpa: '3.9',
          honors: ['Magna Cum Laude'],
        },
      ],
      skills: {
        technical: ['TypeScript', 'Python'],
        soft: ['Leadership', 'Communication'],
        certifications: ['AWS Solutions Architect'],
        languages: ['English', 'Spanish'],
      },
      projects: [
        {
          name: 'Open Source Project',
          description: 'A cool project',
          technologies: ['TypeScript', 'Node.js'],
          url: 'https://github.com/example/project',
        },
      ],
    };
    expect(() => resumeJsonSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    const invalid = {
      metadata: {
        version: '1.0',
      },
      // Missing contact, summary, etc.
    };
    expect(() => resumeJsonSchema.parse(invalid)).toThrow();
  });
});

describe('File Validation Helpers', () => {
  describe('isValidFileName', () => {
    it('accepts valid file extensions', () => {
      expect(isValidFileName('resume.pdf')).toBe(true);
      expect(isValidFileName('document.doc')).toBe(true);
      expect(isValidFileName('document.docx')).toBe(true);
      expect(isValidFileName('notes.txt')).toBe(true);
    });

    it('rejects invalid file extensions', () => {
      expect(isValidFileName('script.exe')).toBe(false);
      expect(isValidFileName('image.jpg')).toBe(false);
      expect(isValidFileName('file.zip')).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('accepts valid file sizes', () => {
      expect(isValidFileSize(1024)).toBe(true);
      expect(isValidFileSize(MAX_FILE_SIZE)).toBe(true);
    });

    it('rejects zero size', () => {
      expect(isValidFileSize(0)).toBe(false);
    });

    it('rejects negative size', () => {
      expect(isValidFileSize(-1)).toBe(false);
    });

    it('rejects size exceeding max', () => {
      expect(isValidFileSize(MAX_FILE_SIZE + 1)).toBe(false);
    });
  });
});
