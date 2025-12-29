// Export 3-PDF Bundle to Firebase Storage
// Phase: Prototype (Checkpoint 1)
// Converts 3 HTML artifacts to PDFs and uploads to Storage

import { Storage } from '@google-cloud/storage';
import { convertHtmlToPdf } from './htmlToPdf.js';
import type {
  ThreePDFGenerationOutput,
  ThreePDFPaths,
} from '../types/threePdf.js';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev',
});

/**
 * Export 3-PDF bundle to Firebase Storage
 * Converts HTML artifacts to PDFs and uploads in parallel for efficiency
 *
 * @param candidateId - Candidate ID for storage path
 * @param generationOutput - 3-PDF generation output from Vertex AI
 * @returns Storage paths for all 3 PDFs
 */
export async function exportThreePdfBundle(
  candidateId: string,
  generationOutput: ThreePDFGenerationOutput
): Promise<ThreePDFPaths> {
  console.log(`[exportThreePdf] Starting export for candidate: ${candidateId}`);

  const timestamp = Date.now();
  const bucket = storage.bucket(
    process.env.FIREBASE_STORAGE_BUCKET ||
      'resume-gen-intent-dev.firebasestorage.app'
  );

  try {
    // Step 1: Convert all 3 HTML documents to PDFs in parallel (efficient)
    console.log('[exportThreePdf] Converting HTML to PDF...');

    const [militaryPdf, civilianPdf, crosswalkPdf] = await Promise.all([
      convertHtmlToPdf(
        generationOutput.artifacts.resume_military.content_html,
        {
          margins_in: generationOutput.render_hints.margins_in,
          page_size: generationOutput.render_hints.page_size,
        }
      ),
      convertHtmlToPdf(
        generationOutput.artifacts.resume_civilian.content_html,
        {
          margins_in: generationOutput.render_hints.margins_in,
          page_size: generationOutput.render_hints.page_size,
        }
      ),
      convertHtmlToPdf(
        generationOutput.artifacts.resume_crosswalk.content_html,
        {
          margins_in: generationOutput.render_hints.margins_in,
          page_size: generationOutput.render_hints.page_size,
        }
      ),
    ]);

    console.log('[exportThreePdf] All PDFs generated successfully');
    console.log(`[exportThreePdf] Military PDF: ${militaryPdf.length} bytes`);
    console.log(`[exportThreePdf] Civilian PDF: ${civilianPdf.length} bytes`);
    console.log(`[exportThreePdf] Crosswalk PDF: ${crosswalkPdf.length} bytes`);

    // Step 2: Define storage paths
    const militaryPath = `candidates/${candidateId}/exports/${timestamp}-military.pdf`;
    const civilianPath = `candidates/${candidateId}/exports/${timestamp}-civilian.pdf`;
    const crosswalkPath = `candidates/${candidateId}/exports/${timestamp}-crosswalk.pdf`;

    // Step 3: Upload all 3 PDFs to Storage in parallel (efficient)
    console.log('[exportThreePdf] Uploading to Firebase Storage...');

    await Promise.all([
      bucket.file(militaryPath).save(militaryPdf, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            candidateId,
            documentType: 'resume_military',
            timestamp: timestamp.toString(),
          },
        },
      }),
      bucket.file(civilianPath).save(civilianPdf, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            candidateId,
            documentType: 'resume_civilian',
            timestamp: timestamp.toString(),
          },
        },
      }),
      bucket.file(crosswalkPath).save(crosswalkPdf, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            candidateId,
            documentType: 'resume_crosswalk',
            timestamp: timestamp.toString(),
          },
        },
      }),
    ]);

    console.log('[exportThreePdf] All PDFs uploaded successfully');
    console.log(`[exportThreePdf] Military: ${militaryPath}`);
    console.log(`[exportThreePdf] Civilian: ${civilianPath}`);
    console.log(`[exportThreePdf] Crosswalk: ${crosswalkPath}`);

    return {
      militaryPdfPath: militaryPath,
      civilianPdfPath: civilianPath,
      crosswalkPdfPath: crosswalkPath,
    };
  } catch (error) {
    console.error('[exportThreePdf] Export failed:', error);
    throw new Error(
      `Failed to export 3-PDF bundle: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
