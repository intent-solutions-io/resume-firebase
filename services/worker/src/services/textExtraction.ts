// Text Extraction Service for Candidate Documents
// Phase 1.9: AI Profile & Resume Pipeline
// Phase 3.0: Proper DOCX extraction with mammoth

import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import type {
  CandidateDocument,
  ExtractedDocument,
  DocumentType,
} from '../types/candidate.js';

const storage = new Storage();
const firestore = new Firestore();

// Firebase Storage bucket (from Phase 1.8)
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || 'resume-gen-intent-dev.firebasestorage.app';

/**
 * Fetch all candidate documents from Firestore
 */
export async function getCandidateDocuments(
  candidateId: string
): Promise<CandidateDocument[]> {
  const snapshot = await firestore
    .collection('candidateDocuments')
    .where('candidateId', '==', candidateId)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CandidateDocument[];
}

/**
 * Extract text from all candidate documents
 */
export async function extractDocumentTexts(
  candidateId: string
): Promise<ExtractedDocument[]> {
  console.log(`[textExtraction] Starting extraction for candidate: ${candidateId}`);

  // Get document metadata from Firestore
  const documents = await getCandidateDocuments(candidateId);
  console.log(`[textExtraction] Found ${documents.length} documents`);

  if (documents.length === 0) {
    console.warn(`[textExtraction] No documents found for candidate: ${candidateId}`);
    return [];
  }

  const bucket = storage.bucket(STORAGE_BUCKET);
  const results: ExtractedDocument[] = [];

  for (const doc of documents) {
    try {
      console.log(`[textExtraction] Processing: ${doc.fileName} (${doc.type})`);

      // Download file from Storage
      const file = bucket.file(doc.storagePath);
      const [exists] = await file.exists();

      if (!exists) {
        console.warn(`[textExtraction] File not found: ${doc.storagePath}`);
        continue;
      }

      const [content] = await file.download();
      const text = await extractTextFromBuffer(content, doc.fileName);

      if (text && text.trim().length > 0) {
        results.push({
          type: doc.type as DocumentType,
          fileName: doc.fileName,
          text: text.trim(),
        });
        console.log(
          `[textExtraction] Extracted ${text.length} chars from ${doc.fileName}`
        );
      } else {
        console.warn(`[textExtraction] No text extracted from: ${doc.fileName}`);
      }
    } catch (error) {
      console.error(`[textExtraction] Failed to process ${doc.fileName}:`, error);
      // Continue with other documents
    }
  }

  console.log(
    `[textExtraction] Completed: ${results.length}/${documents.length} documents extracted`
  );
  return results;
}

/**
 * Extract text from file buffer based on file type
 */
async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return extractTextFromPDF(buffer);

    case 'txt':
      return buffer.toString('utf-8');

    case 'docx':
      return extractTextFromDOCX(buffer, fileName);

    case 'doc':
      // Legacy .doc format - try plain text extraction as fallback
      console.warn(`[textExtraction] Legacy .doc format has limited support: ${fileName}`);
      return extractPlainTextFromBinary(buffer);

    case 'jpg':
    case 'jpeg':
    case 'png':
      // Images would require OCR - mark as limitation
      console.warn(
        `[textExtraction] Image files require OCR (not implemented): ${fileName}`
      );
      return `[Image file: ${fileName} - OCR not yet implemented]`;

    default:
      // Try to read as plain text
      return extractPlainTextFromBinary(buffer);
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('[textExtraction] PDF parse error:', error);
    // Return empty string on parse failure
    return '';
  }
}

/**
 * Extract text from DOCX using mammoth
 * DOCX files are ZIP archives containing XML - mammoth handles this properly
 */
async function extractTextFromDOCX(buffer: Buffer, fileName: string): Promise<string> {
  try {
    console.log(`[textExtraction] Extracting DOCX with mammoth: ${fileName}`);
    const result = await mammoth.extractRawText({ buffer });

    if (result.messages.length > 0) {
      console.warn(`[textExtraction] Mammoth warnings for ${fileName}:`, result.messages);
    }

    const text = result.value || '';
    console.log(`[textExtraction] DOCX extraction successful: ${text.length} chars from ${fileName}`);
    return text;
  } catch (error) {
    console.error(`[textExtraction] DOCX parse error for ${fileName}:`, error);
    // Try fallback to plain text extraction
    console.log(`[textExtraction] Trying fallback extraction for ${fileName}`);
    return extractPlainTextFromBinary(buffer);
  }
}

/**
 * Extract readable plain text from binary file
 * Basic extraction for DOC/DOCX - finds ASCII strings
 */
function extractPlainTextFromBinary(buffer: Buffer): string {
  // Try UTF-8 first
  const text = buffer.toString('utf-8');

  // Filter to only printable characters and whitespace
  // This is a basic approach - works for some DOC files
  const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');

  // Remove excessive whitespace
  const cleaned = printable.replace(/\s+/g, ' ').trim();

  // If we got reasonable text (more than just noise), return it
  if (cleaned.length > 50) {
    return cleaned;
  }

  // For DOCX files, try to find the document.xml content
  // DOCX is a ZIP file containing XML
  const xmlMatch = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  if (xmlMatch) {
    return xmlMatch
      .map((m) => m.replace(/<[^>]+>/g, ''))
      .join(' ')
      .trim();
  }

  return cleaned;
}

/**
 * Build combined document text with clear separators
 */
export function buildCombinedText(documents: ExtractedDocument[]): string {
  if (documents.length === 0) {
    return '';
  }

  return documents
    .map(
      (doc) =>
        `\n========================================\n` +
        `DOCUMENT TYPE: ${doc.type.toUpperCase()}\n` +
        `FILE: ${doc.fileName}\n` +
        `========================================\n\n` +
        doc.text
    )
    .join('\n\n');
}
