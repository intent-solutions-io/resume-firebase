import { Request, Response } from 'express';
import { firestoreService } from '../services/firestore.js';
import { storageService } from '../services/storage.js';
import { extractionService } from '../services/extraction.js';
import { geminiService } from '../services/gemini.js';
import { v4 as uuidv4 } from 'uuid';
// Import shared schema for contract consistency
import { processCasePayloadSchema } from '@resume-generator/shared/schemas';

/**
 * Process Case Handler
 * Main entry point for resume generation pipeline
 * Target for Cloud Tasks queue
 *
 * Pipeline:
 * 1. Load case + document metadata
 * 2. Extract text from documents
 * 3. Call Vertex Gemini to produce Resume JSON
 * 4. Store resume.json artifact
 * 5. Update Firestore status
 */
export async function processCaseHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { caseId } = processCasePayloadSchema.parse(req.body);

    // Log start (no PII)
    console.log(`Processing started: ${caseId}`);

    // Update status to processing
    await firestoreService.updateCaseStatus(caseId, 'processing', {
      currentStep: 'loading',
      progress: 0,
    });

    // Step 1: Load case and documents
    const caseDoc = await firestoreService.getCase(caseId);
    if (!caseDoc) {
      throw new Error('Case not found');
    }

    const documents = await firestoreService.getCaseDocuments(caseId);
    if (documents.length === 0) {
      throw new Error('No documents found for case');
    }

    await firestoreService.updateCaseStatus(caseId, 'processing', {
      currentStep: 'extracting',
      progress: 20,
    });

    // Step 2: Extract text from all documents
    // Note: Image files are marked as needs_ocr and don't block processing
    console.log(`Extracting text from ${documents.length} documents`);
    const extractedTexts: string[] = [];
    let imageCount = 0;

    for (const doc of documents) {
      try {
        // Check if this is an image file (needs OCR - future phase)
        if (extractionService.isImageFile(doc.fileName)) {
          console.log(`Image file skipped for now: ${doc.fileName}`);
          imageCount++;
          await firestoreService.updateDocumentStatus(doc.id, 'uploaded', {
            extractedText: '',
            extractionStatus: 'needs_ocr',
          });
          continue;
        }

        const content = await storageService.downloadFile(caseId, doc.id, doc.fileName);
        const result = await extractionService.extractTextWithStatus(content, doc.fileName);

        if (result.status === 'completed' && result.text) {
          extractedTexts.push(result.text);
        }

        await firestoreService.updateDocumentStatus(doc.id, 'processed', {
          extractedText: result.text,
          extractionStatus: result.status,
        });
      } catch (error) {
        console.log(`Failed to extract document: ${doc.id}`);
        await firestoreService.updateDocumentStatus(doc.id, 'failed', {
          extractedText: '',
          extractionStatus: 'failed',
        });
      }
    }

    // Log image files that need OCR
    if (imageCount > 0) {
      console.log(`${imageCount} image file(s) marked as needs_ocr for future processing`);
    }

    if (extractedTexts.length === 0) {
      throw new Error('No text could be extracted from documents (images require OCR in future phase)');
    }

    await firestoreService.updateCaseStatus(caseId, 'processing', {
      currentStep: 'generating',
      progress: 50,
    });

    // Step 3: Generate resume with Vertex AI Gemini
    console.log(`Generating resume for case: ${caseId}`);
    const combinedText = extractedTexts.join('\n\n---\n\n');
    const resumeJson = await geminiService.generateResume(
      combinedText,
      caseDoc.targetRole
    );

    await firestoreService.updateCaseStatus(caseId, 'processing', {
      currentStep: 'storing',
      progress: 80,
    });

    // Step 4: Store resume.json artifact
    const artifactId = uuidv4();
    const artifactFileName = 'resume.json';
    const artifactContent = JSON.stringify(resumeJson, null, 2);

    await storageService.uploadArtifact(
      caseId,
      artifactId,
      artifactFileName,
      Buffer.from(artifactContent)
    );

    await firestoreService.createArtifact({
      id: artifactId,
      caseId,
      name: 'Generated Resume',
      fileName: artifactFileName,
      type: 'resume_json',
      size: Buffer.byteLength(artifactContent),
      createdAt: new Date().toISOString(),
    });

    // Step 5: Mark as completed
    await firestoreService.updateCaseStatus(caseId, 'completed', {
      currentStep: 'done',
      progress: 100,
    });

    console.log(`Processing completed: ${caseId}`);

    res.status(200).json({ status: 'completed' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Processing failed: ${errorMessage}`);

    // Try to update status to failed
    try {
      const { caseId } = processCasePayloadSchema.parse(req.body);
      await firestoreService.updateCaseStatus(caseId, 'failed', {
        currentStep: 'error',
      });
    } catch {
      // Ignore errors updating status
    }

    // Return 500 to trigger Cloud Tasks retry
    res.status(500).json({ error: errorMessage });
  }
}
