/**
 * Worker Handler Tests
 * Tests that worker handlers properly validate payloads using shared schemas
 */

import { describe, it, expect } from 'vitest';
import {
  processCasePayloadSchema,
  generateArtifactPayloadSchema,
  resumeJsonSchema,
} from '@resume-generator/shared/schemas';

describe('Worker Payload Validation', () => {
  describe('processCase - processCasePayloadSchema', () => {
    it('accepts valid UUID caseId', () => {
      const validPayload = {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => processCasePayloadSchema.parse(validPayload)).not.toThrow();
    });

    it('accepts various valid UUID formats', () => {
      const uuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ];
      uuids.forEach((uuid) => {
        expect(() => processCasePayloadSchema.parse({ caseId: uuid })).not.toThrow();
      });
    });

    it('rejects non-UUID string', () => {
      const invalidPayloads = [
        { caseId: 'not-a-uuid' },
        { caseId: '12345' },
        { caseId: 'case-id-123' },
        { caseId: '550e8400-e29b-41d4-a716-446655440000-extra' },
      ];
      invalidPayloads.forEach((payload) => {
        expect(() => processCasePayloadSchema.parse(payload)).toThrow();
      });
    });

    it('rejects empty string', () => {
      const invalidPayload = { caseId: '' };
      expect(() => processCasePayloadSchema.parse(invalidPayload)).toThrow();
    });

    it('rejects missing caseId', () => {
      expect(() => processCasePayloadSchema.parse({})).toThrow();
    });

    it('rejects null caseId', () => {
      expect(() => processCasePayloadSchema.parse({ caseId: null })).toThrow();
    });

    it('rejects numeric caseId', () => {
      expect(() => processCasePayloadSchema.parse({ caseId: 12345 })).toThrow();
    });
  });

  describe('generateArtifact - generateArtifactPayloadSchema', () => {
    it('accepts resume_json artifact type', () => {
      const validPayload = {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        artifactType: 'resume_json',
      };
      expect(() => generateArtifactPayloadSchema.parse(validPayload)).not.toThrow();
    });

    it('accepts resume_pdf artifact type', () => {
      const validPayload = {
        caseId: '550e8400-e29b-41d4-a716-446655440000',
        artifactType: 'resume_pdf',
      };
      expect(() => generateArtifactPayloadSchema.parse(validPayload)).not.toThrow();
    });

    it('rejects unknown artifact type', () => {
      const invalidTypes = ['resume_docx', 'image_png', 'invalid', 'JSON', 'PDF'];
      invalidTypes.forEach((type) => {
        expect(() =>
          generateArtifactPayloadSchema.parse({
            caseId: '550e8400-e29b-41d4-a716-446655440000',
            artifactType: type,
          })
        ).toThrow();
      });
    });

    it('rejects missing fields', () => {
      expect(() => generateArtifactPayloadSchema.parse({})).toThrow();
      expect(() =>
        generateArtifactPayloadSchema.parse({ caseId: '550e8400-e29b-41d4-a716-446655440000' })
      ).toThrow();
      expect(() =>
        generateArtifactPayloadSchema.parse({ artifactType: 'resume_json' })
      ).toThrow();
    });
  });

  describe('Resume JSON Output - resumeJsonSchema', () => {
    it('accepts minimal valid resume', () => {
      const validResume = {
        metadata: {
          version: '1.0',
          generatedAt: '2025-12-08T00:00:00Z',
        },
        contact: {
          name: 'John Doe',
        },
        summary: 'Experienced professional.',
        experience: [],
        education: [],
        skills: {
          technical: [],
          soft: [],
          certifications: [],
          languages: [],
        },
      };
      expect(() => resumeJsonSchema.parse(validResume)).not.toThrow();
    });

    it('accepts complete resume with all fields', () => {
      const completeResume = {
        metadata: {
          version: '1.0',
          generatedAt: '2025-12-08T00:00:00Z',
          targetRole: 'Senior Software Engineer',
        },
        contact: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1-555-123-4567',
          location: 'San Francisco, CA',
          linkedin: 'https://linkedin.com/in/janesmith',
          portfolio: 'https://janesmith.dev',
        },
        summary: 'Experienced software engineer with 8 years of experience building scalable systems.',
        experience: [
          {
            title: 'Senior Engineer',
            company: 'Tech Corp',
            location: 'San Francisco, CA',
            startDate: '2020-01',
            endDate: '2024-12',
            current: false,
            description: 'Led engineering team of 5',
            achievements: ['Increased system performance by 40%', 'Reduced costs by 25%'],
          },
        ],
        education: [
          {
            degree: 'BS Computer Science',
            institution: 'Stanford University',
            location: 'Stanford, CA',
            graduationDate: '2016-06',
            gpa: '3.8',
            honors: ['Cum Laude'],
          },
        ],
        skills: {
          technical: ['TypeScript', 'Python', 'Go', 'AWS', 'Kubernetes'],
          soft: ['Leadership', 'Communication', 'Problem Solving'],
          certifications: ['AWS Solutions Architect', 'GCP Professional'],
          languages: ['English', 'Spanish'],
        },
        projects: [
          {
            name: 'Open Source CLI Tool',
            description: 'A CLI tool for managing cloud resources',
            technologies: ['Go', 'AWS SDK'],
            url: 'https://github.com/example/cli-tool',
          },
        ],
      };
      expect(() => resumeJsonSchema.parse(completeResume)).not.toThrow();
    });

    it('rejects resume missing required metadata', () => {
      const invalidResume = {
        contact: { name: 'John Doe' },
        summary: 'Summary text',
        experience: [],
        education: [],
        skills: { technical: [], soft: [], certifications: [], languages: [] },
      };
      expect(() => resumeJsonSchema.parse(invalidResume)).toThrow();
    });

    it('rejects resume missing contact name', () => {
      const invalidResume = {
        metadata: { version: '1.0', generatedAt: '2025-12-08T00:00:00Z' },
        contact: { email: 'test@example.com' },
        summary: 'Summary text',
        experience: [],
        education: [],
        skills: { technical: [], soft: [], certifications: [], languages: [] },
      };
      expect(() => resumeJsonSchema.parse(invalidResume)).toThrow();
    });

    it('rejects resume with invalid experience entry', () => {
      const invalidResume = {
        metadata: { version: '1.0', generatedAt: '2025-12-08T00:00:00Z' },
        contact: { name: 'John Doe' },
        summary: 'Summary text',
        experience: [
          {
            // Missing required title and company
            location: 'San Francisco',
          },
        ],
        education: [],
        skills: { technical: [], soft: [], certifications: [], languages: [] },
      };
      expect(() => resumeJsonSchema.parse(invalidResume)).toThrow();
    });
  });
});
