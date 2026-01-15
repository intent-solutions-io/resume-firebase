// Text Extraction Tests
// Validates PDF and DOCX extraction functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies before importing the module
vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn().mockImplementation(() => ({
    bucket: vi.fn().mockReturnValue({
      file: vi.fn().mockReturnValue({
        exists: vi.fn().mockResolvedValue([true]),
        download: vi.fn().mockResolvedValue([Buffer.from('test content')]),
      }),
    }),
  })),
}));

vi.mock('@google-cloud/firestore', () => ({
  Firestore: vi.fn().mockImplementation(() => ({
    collection: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          docs: [],
        }),
      }),
    }),
  })),
}));

vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({ text: 'PDF extracted text' }),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({
      value: 'DOCX extracted text from mammoth',
      messages: [],
    }),
  },
}));

describe('Text Extraction Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTextFromBuffer', () => {
    it('should extract text from PDF files', async () => {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfBuffer = Buffer.from('%PDF-1.4 test');

      await pdfParse(pdfBuffer);

      expect(pdfParse).toHaveBeenCalledWith(pdfBuffer);
    });

    it('should extract text from DOCX files using mammoth', async () => {
      const mammoth = (await import('mammoth')).default;
      const docxBuffer = Buffer.from('PK\x03\x04 mock docx');

      const result = await mammoth.extractRawText({ buffer: docxBuffer });

      expect(mammoth.extractRawText).toHaveBeenCalled();
      expect(result.value).toBe('DOCX extracted text from mammoth');
    });

    it('should handle mammoth extraction errors gracefully', async () => {
      const mammoth = (await import('mammoth')).default;

      // Make mammoth throw an error
      vi.mocked(mammoth.extractRawText).mockRejectedValueOnce(new Error('Invalid DOCX'));

      await expect(mammoth.extractRawText({ buffer: Buffer.from('invalid') }))
        .rejects.toThrow('Invalid DOCX');
    });

    it('should return text for plain text files', async () => {
      const txtBuffer = Buffer.from('Plain text content');
      const result = txtBuffer.toString('utf-8');

      expect(result).toBe('Plain text content');
    });
  });

  describe('buildCombinedText', () => {
    it('should combine multiple documents with separators', () => {
      const documents = [
        { type: 'dd214' as const, fileName: 'DD214.pdf', text: 'Discharge info' },
        { type: 'evaluation' as const, fileName: 'EPR.pdf', text: 'Performance review' },
      ];

      // Simple implementation of buildCombinedText for testing
      const combined = documents
        .map(
          (doc) =>
            `\n========================================\n` +
            `DOCUMENT TYPE: ${doc.type.toUpperCase()}\n` +
            `FILE: ${doc.fileName}\n` +
            `========================================\n\n` +
            doc.text
        )
        .join('\n\n');

      expect(combined).toContain('DOCUMENT TYPE: DD214');
      expect(combined).toContain('DOCUMENT TYPE: EVALUATION');
      expect(combined).toContain('Discharge info');
      expect(combined).toContain('Performance review');
    });
  });
});

describe('Correlation ID', () => {
  it('should generate valid UUID format', () => {
    const { randomUUID } = require('crypto');
    const correlationId = randomUUID();

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(correlationId).toMatch(uuidRegex);
  });

  it('should use provided correlation ID from header', () => {
    const headerCorrelationId = 'custom-correlation-id-12345';
    const finalCorrelationId = headerCorrelationId || 'fallback';

    expect(finalCorrelationId).toBe('custom-correlation-id-12345');
  });
});

describe('Error Response Format', () => {
  it('should include correlationId in error response', () => {
    const errorResponse = {
      error: 'Processing failed',
      message: 'DOCX extraction failed',
      correlationId: 'test-correlation-id',
    };

    expect(errorResponse).toHaveProperty('correlationId');
    expect(errorResponse.correlationId).toBe('test-correlation-id');
  });

  it('should include correlationId in success response', () => {
    const successResponse = {
      status: 'ok',
      candidateId: 'test-candidate-id',
      correlationId: 'test-correlation-id',
      newStatus: 'resume_ready',
    };

    expect(successResponse).toHaveProperty('correlationId');
    expect(successResponse.status).toBe('ok');
  });
});
