// Generate DOCX Handler
// New architecture: AI outputs JSON → DOCX generator creates Word documents
// No HTML, no Puppeteer, no Chrome - just clean data transformation

import { Request, Response } from 'express';
import { Firestore, FieldValue } from '@google-cloud/firestore';
import { generateStructuredResume } from '../services/vertexStructured.js';
import { generateAllDocx } from '../services/docxGenerator.js';
import { uploadDocxBundle } from '../services/exportDocx.js';
import { extractDocumentTexts } from '../services/textExtraction.js';
import { extractJobKeywords } from '../services/keywordExtractor.js';
import { randomUUID } from 'crypto';
import type { KeywordExtractionResult } from '../types/threePdf.js';

const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev',
});

/**
 * Generate 3 DOCX resumes (Military, Civilian, Crosswalk)
 * POST /internal/generateDocx
 * Body: { candidateId: string, targetJobDescription?: string }
 */
export async function generateDocxHandler(
  req: Request,
  res: Response
): Promise<void> {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  const startTime = Date.now();

  try {
    const { candidateId, targetJobDescription } = req.body;

    // Validation
    if (!candidateId || typeof candidateId !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'candidateId (string) required',
        correlationId,
      });
      return;
    }

    console.log(`[generateDocx] correlationId=${correlationId} Starting for: ${candidateId}`);

    // Fetch candidate
    const candidateDoc = await firestore.collection('candidates').doc(candidateId).get();

    if (!candidateDoc.exists) {
      res.status(404).json({
        error: 'Candidate not found',
        message: `No candidate with ID: ${candidateId}`,
        correlationId,
      });
      return;
    }

    const candidate = candidateDoc.data()!;
    console.log(`[generateDocx] Found candidate: ${candidate.name}`);

    // Extract keywords from job description
    let extractedKeywords: KeywordExtractionResult | undefined;
    const jobDesc = targetJobDescription || candidate.targetJobDescription;

    if (jobDesc) {
      console.log('[generateDocx] Extracting keywords from job description...');
      extractedKeywords = await extractJobKeywords(jobDesc);
      console.log(`[generateDocx] Keywords: ${extractedKeywords.hardSkills.length} hard, ${extractedKeywords.softSkills.length} soft`);
    }

    // Extract text from uploaded documents
    console.log('[generateDocx] Extracting text from documents...');
    const documentTexts = await extractDocumentTexts(candidateId);

    if (documentTexts.length === 0) {
      res.status(400).json({
        error: 'No documents',
        message: 'No readable documents found for this candidate',
        correlationId,
      });
      return;
    }

    console.log(`[generateDocx] Extracted text from ${documentTexts.length} documents`);

    // Limit text to prevent token overflow
    const validDocs = documentTexts.map(doc => ({
      type: doc.type,
      fileName: doc.fileName,
      text: doc.text.substring(0, 50000),
    }));

    // Step 1: Generate structured JSON from AI
    console.log('[generateDocx] Calling Vertex AI for structured data...');
    const structuredData = await generateStructuredResume({
      candidateId,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      city: candidate.city,
      state: candidate.state,
      branch: candidate.branch,
      rank: candidate.rank,
      mos: candidate.mos,
      documentTexts: validDocs,
      extractedKeywords,
    });

    console.log('[generateDocx] Structured data received');

    // Step 2: Generate DOCX files from structured data
    console.log('[generateDocx] Generating DOCX files...');
    const docxBuffers = await generateAllDocx(structuredData);

    console.log(`[generateDocx] DOCX sizes: military=${docxBuffers.military.length}, civilian=${docxBuffers.civilian.length}, crosswalk=${docxBuffers.crosswalk.length}`);

    // Step 3: Upload to Firebase Storage
    console.log('[generateDocx] Uploading to Firebase Storage...');
    const paths = await uploadDocxBundle(candidateId, docxBuffers);

    // Step 4: Update Firestore with paths
    const resumeData = {
      candidateId,
      militaryDocxPath: paths.militaryDocxPath,
      civilianDocxPath: paths.civilianDocxPath,
      crosswalkDocxPath: paths.crosswalkDocxPath,
      // Keep backward compatibility with PDF path fields
      militaryPdfPath: paths.militaryDocxPath,
      civilianPdfPath: paths.civilianDocxPath,
      crosswalkPdfPath: paths.crosswalkDocxPath,
      metadata: structuredData.metadata,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await firestore.collection('resumes').doc(candidateId).set(resumeData, { merge: true });

    // Update candidate status
    await firestore.collection('candidates').doc(candidateId).update({
      status: 'resume_ready',
      updatedAt: FieldValue.serverTimestamp(),
    });

    const duration = Date.now() - startTime;
    console.log(`[generateDocx] SUCCESS in ${duration}ms`);

    // Return success
    res.status(200).json({
      success: true,
      message: '3 DOCX resumes generated successfully',
      correlationId,
      candidateId,
      candidateName: candidate.name,
      paths,
      metadata: structuredData.metadata,
      documentsProcessed: validDocs.length,
      durationMs: duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[generateDocx] correlationId=${correlationId} ERROR after ${duration}ms:`, error);

    // Update candidate status to error
    try {
      const { candidateId } = req.body;
      if (candidateId) {
        await firestore.collection('candidates').doc(candidateId).update({
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorCorrelationId: correlationId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (updateError) {
      console.error('[generateDocx] Failed to update error status:', updateError);
    }

    res.status(500).json({
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
    });
  }
}
