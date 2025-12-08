import { Request, Response } from 'express';
// Import shared schema for contract consistency
import { generateArtifactPayloadSchema } from '@resume-generator/shared/schemas';

/**
 * Generate Artifact Handler
 * Creates additional artifacts from resume JSON
 * Phase 2: PDF generation
 */
export async function generateArtifactHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { caseId, artifactType } = generateArtifactPayloadSchema.parse(req.body);

    console.log(`Generating ${artifactType} for case: ${caseId}`);

    // TODO: Implement PDF generation in Phase 2
    // For now, return success as placeholder

    switch (artifactType) {
      case 'resume_pdf':
        // Placeholder for PDF generation
        console.log('PDF generation not implemented yet');
        break;
      default:
        throw new Error(`Unknown artifact type: ${artifactType}`);
    }

    res.status(200).json({ status: 'completed' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Artifact generation failed: ${errorMessage}`);
    res.status(500).json({ error: errorMessage });
  }
}
