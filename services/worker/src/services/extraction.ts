/**
 * Text Extraction Service
 * Basic text extraction from documents
 * Phase 2: Add Document AI/Vision fallback for complex documents and images
 */

// Image extensions that need OCR
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'heic'];

export interface ExtractionResult {
  text: string;
  status: 'completed' | 'needs_ocr' | 'failed';
}

class ExtractionService {
  /**
   * Check if file is an image that needs OCR
   */
  isImageFile(fileName: string): boolean {
    const ext = (fileName.toLowerCase().split('.').pop() || '').toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  }

  /**
   * Extract text from a document buffer
   * Supports: PDF, TXT, DOCX (basic)
   * Images: Returns needs_ocr status for future Document AI processing
   */
  async extractText(content: Buffer, fileName: string): Promise<string> {
    const ext = fileName.toLowerCase().split('.').pop();

    switch (ext) {
      case 'txt':
        return this.extractFromText(content);
      case 'pdf':
        return this.extractFromPdf(content);
      case 'doc':
      case 'docx':
        return this.extractFromDocx(content);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Extract text with status tracking
   * Returns both extracted text and extraction status
   */
  async extractTextWithStatus(content: Buffer, fileName: string): Promise<ExtractionResult> {
    const ext = (fileName.toLowerCase().split('.').pop() || '').toLowerCase();

    // Handle image files - mark for future OCR
    if (IMAGE_EXTENSIONS.includes(ext)) {
      console.log(`Image file detected: ${fileName} - marking for OCR`);
      return {
        text: '',
        status: 'needs_ocr',
      };
    }

    try {
      const text = await this.extractText(content, fileName);
      return {
        text,
        status: 'completed',
      };
    } catch (error) {
      console.log(`Extraction failed for ${fileName}: ${error}`);
      return {
        text: '',
        status: 'failed',
      };
    }
  }

  /**
   * Extract from plain text file
   */
  private extractFromText(content: Buffer): string {
    return content.toString('utf-8').trim();
  }

  /**
   * Extract from PDF file
   * Basic extraction - Phase 2 will add Document AI fallback
   */
  private async extractFromPdf(content: Buffer): Promise<string> {
    try {
      // Dynamic import for pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(content);
      return data.text.trim();
    } catch (error) {
      console.log('PDF extraction failed, returning empty text');
      // Phase 2: Fall back to Document AI
      return '';
    }
  }

  /**
   * Extract from DOCX file
   * Basic extraction - just reads as text for now
   * Phase 2: Add proper DOCX parsing
   */
  private extractFromDocx(content: Buffer): string {
    // TODO: Implement proper DOCX parsing in Phase 2
    // For now, try to extract any readable text
    const text = content.toString('utf-8');
    // Remove XML tags and control characters
    const cleaned = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned;
  }

  /**
   * Validate extracted text quality
   */
  validateExtraction(text: string): boolean {
    // Minimum viable text length
    if (text.length < 100) {
      return false;
    }

    // Check for actual word content (not just garbage)
    const words = text.split(/\s+/).filter((w) => w.length > 2);
    if (words.length < 20) {
      return false;
    }

    return true;
  }
}

export const extractionService = new ExtractionService();
