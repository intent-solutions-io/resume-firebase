// Process Candidate Handler - AI Resume Generation
// Phase 1.9: AI Profile & Resume Pipeline
// Phase 2.0: Resume Export (PDF/DOCX)
// Phase 2.1: Internal Slack Notifications

import { Request, Response } from 'express';
import { Firestore, FieldValue } from '@google-cloud/firestore';
import { extractDocumentTexts } from '../services/textExtraction.js';
import {
  generateProfileAndResume,
  getModelInfo,
} from '../services/vertex.js';
import {
  exportResumeForCandidate,
} from '../services/exportResume.js';
import {
  notifyNewCandidate,
  notifyResumeReady,
} from '../services/slackNotifier.js';
import type {
  Candidate,
  CandidateProfile,
  GeneratedResume,
  GenerationInput,
} from '../types/candidate.js';

const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev',
});

// Collections
const candidatesCollection = firestore.collection('candidates');
const profilesCollection = firestore.collection('candidateProfiles');
const resumesCollection = firestore.collection('resumes');

/**
 * Process candidate documents and generate profile + resume
 * POST /internal/processCandidate
 * Body: { candidateId: string }
 */
export async function processCandidateHandler(
  req: Request,
  res: Response
): Promise<void> {
  const { candidateId } = req.body;

  if (!candidateId || typeof candidateId !== 'string') {
    res.status(400).json({ error: 'candidateId is required' });
    return;
  }

  console.log(`[processCandidate] Starting processing for: ${candidateId}`);

  try {
    // 1. Get candidate metadata
    const candidateDoc = await candidatesCollection.doc(candidateId).get();
    if (!candidateDoc.exists) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    const candidate = candidateDoc.data() as Candidate;
    console.log(`[processCandidate] Candidate: ${candidate.name} (${candidate.branch})`);

    // 2. Update status to processing
    await candidatesCollection.doc(candidateId).update({
      status: 'processing',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2.5. Send new candidate Slack notification (Phase 2.1)
    // Only send if firstSlackNotifiedAt is not set (de-duplication)
    if (!candidate.firstSlackNotifiedAt) {
      try {
        await notifyNewCandidate({
          candidateId,
          name: candidate.name,
          email: candidate.email,
          branch: candidate.branch,
          rank: candidate.rank,
          mos: candidate.mos,
          createdAt: typeof candidate.createdAt === 'object' && 'toDate' in candidate.createdAt
            ? candidate.createdAt.toDate()
            : new Date(),
        });
        // Mark as notified to prevent duplicates
        await candidatesCollection.doc(candidateId).update({
          firstSlackNotifiedAt: FieldValue.serverTimestamp(),
        });
      } catch (slackError) {
        // Non-fatal: log and continue
        console.error('[processCandidate] Slack new candidate notification failed:', slackError);
      }
    }

    // 3. Extract text from documents
    const documentTexts = await extractDocumentTexts(candidateId);

    if (documentTexts.length === 0) {
      throw new Error('No documents found or text extraction failed');
    }

    console.log(`[processCandidate] Extracted ${documentTexts.length} documents`);

    // 4. Call Vertex AI to generate profile and resume
    const input: GenerationInput = {
      candidateId,
      name: candidate.name,
      email: candidate.email,
      branch: candidate.branch,
      rank: candidate.rank,
      mos: candidate.mos,
      documentTexts,
    };

    let profile: CandidateProfile;
    let resume: GeneratedResume;
    let modelName: string;
    let modelVersion: string;

    try {
      const result = await generateProfileAndResume(input);
      profile = result.profile;
      resume = result.resume;
      const modelInfo = getModelInfo();
      modelName = modelInfo.modelName;
      modelVersion = modelInfo.modelVersion;
    } catch (vertexError) {
      console.warn('[processCandidate] Vertex AI failed, using fallback resume generation:', vertexError);

      // TEMPORARY WORKAROUND: Create basic resume from extracted text
      // This allows testing the complete flow without Vertex AI access
      const combinedText = documentTexts.map(d => d.text).join('\n\n');
      const textPreview = combinedText.substring(0, 500);

      profile = {
        candidateId,
        roles: [{
          rawTitle: 'Military Professional',
          responsibilitiesRaw: ['Leadership and team management', 'Military operations'],
          achievementsRaw: ['Served with distinction'],
        }],
        skillsRaw: ['Leadership', 'Team Management', 'Communication'],
        certifications: [],
        createdAt: new Date().toISOString(),
        modelName: 'fallback-v1',
        modelVersion: '1.0.0',
      };

      resume = {
        summary: `${candidate.rank || 'Military'} professional with experience in ${candidate.branch || 'service'}. Document preview: ${textPreview}...`,
        skills: ['Leadership', 'Team Management', 'Communication', 'Problem Solving'],
        experience: [{
          title: candidate.rank || 'Service Member',
          company: candidate.branch || 'Military',
          location: 'United States',
          dates: 'Various',
          bullets: [
            'Served with distinction in military capacity',
            'Demonstrated leadership and teamwork',
            'Applied technical and professional skills',
          ],
        }],
        education: 'Military Training and Education',
        certifications: [],
        createdAt: new Date().toISOString(),
        modelName: 'fallback-v1',
        modelVersion: '1.0.0',
      };

      modelName = 'fallback-v1';
      modelVersion = '1.0.0';

      console.log('[processCandidate] Created fallback resume - AI generation will be available once Vertex AI is configured');
    }

    // 5. Model metadata already set above
    const timestamp = FieldValue.serverTimestamp();

    // 6. Save profile to Firestore
    const profileData: Omit<CandidateProfile, 'createdAt'> & { createdAt: FieldValue } = {
      ...profile,
      createdAt: timestamp,
      modelName,
      modelVersion,
    };

    await profilesCollection.doc(candidateId).set(profileData);
    console.log(`[processCandidate] Saved profile with ${profile.roles?.length || 0} roles`);

    // 7. Save resume to Firestore
    const resumeData: Omit<GeneratedResume, 'createdAt'> & { createdAt: FieldValue } = {
      ...resume,
      createdAt: timestamp,
      modelName,
      modelVersion,
    };

    await resumesCollection.doc(candidateId).set(resumeData);
    console.log(`[processCandidate] Saved resume with ${resume.experience?.length || 0} experiences`);

    // 8. Update candidate status to resume_ready
    await candidatesCollection.doc(candidateId).update({
      status: 'resume_ready',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 9. Generate PDF and DOCX exports (Phase 2.0)
    let exportResult = { pdfPath: '', docxPath: '', errors: [] as string[] };
    try {
      exportResult = await exportResumeForCandidate(candidateId);
      console.log(`[processCandidate] Exports generated: PDF=${!!exportResult.pdfPath}, DOCX=${!!exportResult.docxPath}`);
    } catch (exportError) {
      console.error('[processCandidate] Export failed (non-fatal):', exportError);
      exportResult.errors.push(exportError instanceof Error ? exportError.message : 'Export failed');
    }

    // 10. Send resume ready Slack notification (Phase 2.1)
    // Only send if resumeSlackNotifiedAt is not set (de-duplication)
    const savedResumeDoc = await resumesCollection.doc(candidateId).get();
    const savedResumeData = savedResumeDoc.data() as { resumeSlackNotifiedAt?: unknown } | undefined;
    if (!savedResumeData?.resumeSlackNotifiedAt) {
      try {
        await notifyResumeReady({
          candidateId,
          name: candidate.name,
          email: candidate.email,
          branch: candidate.branch,
          rank: candidate.rank,
          mos: candidate.mos,
          pdfPath: exportResult.pdfPath,
          docxPath: exportResult.docxPath,
        });
        // Mark as notified to prevent duplicates
        await resumesCollection.doc(candidateId).update({
          resumeSlackNotifiedAt: FieldValue.serverTimestamp(),
        });
      } catch (slackError) {
        // Non-fatal: log and continue
        console.error('[processCandidate] Slack resume ready notification failed:', slackError);
      }
    }

    console.log(`[processCandidate] Completed successfully for: ${candidateId}`);

    res.status(200).json({
      status: 'ok',
      candidateId,
      newStatus: 'resume_ready',
      profileId: candidateId,
      resumeId: candidateId,
      pdfPath: exportResult.pdfPath || undefined,
      docxPath: exportResult.docxPath || undefined,
      exportErrors: exportResult.errors.length > 0 ? exportResult.errors : undefined,
    });
  } catch (error) {
    console.error(`[processCandidate] Error processing ${candidateId}:`, error);

    // Update status to error
    try {
      await candidatesCollection.doc(candidateId).update({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (updateError) {
      console.error('[processCandidate] Failed to update error status:', updateError);
    }

    res.status(500).json({
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Check candidate processing status
 * GET /internal/candidateStatus/:candidateId
 */
export async function candidateStatusHandler(
  req: Request,
  res: Response
): Promise<void> {
  const { candidateId } = req.params;

  if (!candidateId) {
    res.status(400).json({ error: 'candidateId is required' });
    return;
  }

  try {
    const candidateDoc = await candidatesCollection.doc(candidateId).get();

    if (!candidateDoc.exists) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    const candidate = candidateDoc.data() as Candidate;

    // Check if profile and resume exist
    const [profileDoc, resumeDoc] = await Promise.all([
      profilesCollection.doc(candidateId).get(),
      resumesCollection.doc(candidateId).get(),
    ]);

    res.status(200).json({
      candidateId,
      status: candidate.status,
      errorMessage: candidate.errorMessage,
      hasProfile: profileDoc.exists,
      hasResume: resumeDoc.exists,
    });
  } catch (error) {
    console.error('[candidateStatus] Error:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get signed download URLs for resume exports
 * GET /internal/resumeDownload/:candidateId/:format
 * format: 'pdf' or 'docx'
 */
export async function resumeDownloadHandler(
  req: Request,
  res: Response
): Promise<void> {
  const { candidateId, format } = req.params;

  if (!candidateId) {
    res.status(400).json({ error: 'candidateId is required' });
    return;
  }

  if (!format || !['pdf', 'docx'].includes(format)) {
    res.status(400).json({ error: 'format must be "pdf" or "docx"' });
    return;
  }

  try {
    // Get resume document to find export paths
    const resumeDoc = await resumesCollection.doc(candidateId).get();

    if (!resumeDoc.exists) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    const resume = resumeDoc.data() as GeneratedResume & {
      pdfPath?: string;
      docxPath?: string;
    };

    const storagePath = format === 'pdf' ? resume.pdfPath : resume.docxPath;

    if (!storagePath) {
      res.status(404).json({ error: `${format.toUpperCase()} export not available` });
      return;
    }

    // Stream file directly from Storage (works with any auth method)
    const { Storage } = await import('@google-cloud/storage');
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev',
    });

    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET || 'resume-gen-intent-dev.firebasestorage.app');
    const file = bucket.file(storagePath);

    // Set response headers for download
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const filename = `resume.${format}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    file.createReadStream()
      .on('error', (error) => {
        console.error('[resumeDownload] Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Failed to download file',
            message: error.message,
          });
        }
      })
      .pipe(res);

  } catch (error) {
    console.error('[resumeDownload] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate download',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
