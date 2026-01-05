// Prototype Endpoint - Test 3-PDF Generation
// Phase: Prototype (Checkpoint 1)
// Enhanced with keyword extraction and validation

import { Request, Response } from 'express';
import { Firestore } from '@google-cloud/firestore';
import { generateThreePdfResume } from '../services/vertexThreePdf.js';
import { exportThreePdfBundle } from '../services/exportThreePdf.js';
import { extractDocumentTexts } from '../services/textExtraction.js';
import { extractJobKeywords } from '../services/keywordExtractor.js';
import { runAllValidations } from '../services/keywordValidator.js';
import type { KeywordExtractionResult } from '../types/threePdf.js';

const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev',
});

/**
 * PROTOTYPE ENDPOINT - Test 3-PDF generation
 * POST /internal/prototype/threePdf
 * Body: { candidateId: string }
 *
 * Purpose: Validate Vertex AI prompt, HTML generation, and PDF export
 * without touching existing production flow
 */
export async function prototypeThreePdfHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { candidateId } = req.body;

    // Validation
    if (!candidateId || typeof candidateId !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'candidateId (string) required in request body',
      });
      return;
    }

    console.log(`[prototype] Testing 3-PDF generation for: ${candidateId}`);

    // Fetch candidate data
    const candidateDoc = await firestore
      .collection('candidates')
      .doc(candidateId)
      .get();

    if (!candidateDoc.exists) {
      res.status(404).json({
        error: 'Candidate not found',
        message: `No candidate found with ID: ${candidateId}`,
      });
      return;
    }

    const candidate = candidateDoc.data()!;
    console.log(`[prototype] Found candidate: ${candidate.name}`);

    // Get target job description from request body or candidate record
    const targetJobDescription =
      req.body.targetJobDescription || candidate.targetJobDescription || null;

    // Extract keywords if job description provided
    let extractedKeywords: KeywordExtractionResult | undefined;
    if (targetJobDescription) {
      console.log('[prototype] Extracting keywords from target job description...');
      extractedKeywords = await extractJobKeywords(targetJobDescription);
      console.log(`[prototype] Extracted ${extractedKeywords.hardSkills.length} hard skills, ${extractedKeywords.softSkills.length} soft skills`);
      console.log(`[prototype] Target role identified: ${extractedKeywords.jobTitle}`);
    } else {
      console.log('[prototype] No target job description provided - using default keywords');
    }

    // Extract text from documents using proper text extraction service
    console.log('[prototype] Extracting text from uploaded documents...');
    const documentTexts = await extractDocumentTexts(candidateId);

    if (documentTexts.length === 0) {
      res.status(400).json({
        error: 'No readable documents',
        message: 'Could not extract text from any documents',
      });
      return;
    }

    console.log(`[prototype] Successfully extracted text from ${documentTexts.length} documents`);

    // Limit text length to prevent token overflow (50K chars per document)
    const validDocuments = documentTexts.map(doc => ({
      type: doc.type,
      fileName: doc.fileName,
      text: doc.text.substring(0, 50000),
    }));

    // Generate 3-PDF bundle with Vertex AI
    console.log('[prototype] Calling Vertex AI...');
    const generationOutput = await generateThreePdfResume({
      candidateId,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      city: candidate.city,
      state: candidate.state,
      branch: candidate.branch,
      rank: candidate.rank,
      mos: candidate.mos,
      documentTexts: validDocuments,
      extractedKeywords,
    });

    console.log('[prototype] Vertex AI generation complete');
    console.log(`[prototype] Target role: ${generationOutput.qa.target_role_used}`);
    console.log(`[prototype] Bullets translated: ${generationOutput.qa.bullets_translated_count}`);
    console.log(`[prototype] Terms mapped: ${generationOutput.qa.terms_mapped_count}`);

    // Run validation if keywords were extracted
    let validation = null;
    if (extractedKeywords) {
      console.log('[prototype] Running ATS validation...');
      validation = runAllValidations(generationOutput, extractedKeywords);
      console.log(`[prototype] ATS Score: ${validation.overallScore}/100`);
      console.log(`[prototype] Keyword Coverage: ${validation.keywordCoverage.coveragePercent}%`);
      if (validation.bannedPhrases.found.length > 0) {
        console.warn(`[prototype] Banned phrases found: ${validation.bannedPhrases.found.join(', ')}`);
      }
    }

    // Export to PDFs
    console.log('[prototype] Exporting to PDFs...');
    const paths = await exportThreePdfBundle(candidateId, generationOutput);

    console.log('[prototype] SUCCESS! All 3 PDFs generated and uploaded');

    // Return success response
    res.status(200).json({
      success: true,
      message: '3-PDF bundle generated successfully',
      candidateId,
      candidateName: candidate.name,
      paths,
      qa: generationOutput.qa,
      validation: validation
        ? {
            atsScore: validation.overallScore,
            keywordCoverage: validation.keywordCoverage.coveragePercent,
            missingKeywords: validation.keywordCoverage.missingKeywords.slice(0, 5),
            suggestions: validation.keywordCoverage.suggestions,
            wordCount: validation.wordCount,
            bannedPhrasesFound: validation.bannedPhrases.found,
          }
        : null,
      documentsProcessed: validDocuments.length,
      targetJobProvided: !!targetJobDescription,
    });
  } catch (error) {
    console.error('[prototype] Error:', error);

    // Return error response
    res.status(500).json({
      error: 'Prototype generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
