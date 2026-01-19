// Cloud Tasks Handler for Resume Generation
// Receives tasks from Cloud Tasks queue with retry semantics

import { Request, Response } from 'express';
import { Firestore, FieldValue } from '@google-cloud/firestore';
import { isCloudTasksRequest, getRetryCount } from '../services/cloudTasks.js';
import { extractDocumentTexts } from '../services/textExtraction.js';
import { generateProfileAndResume, getModelInfo } from '../services/vertex.js';
import { generateThreePdfResume } from '../services/vertexThreePdf.js';
import { exportThreePdfBundle } from '../services/exportThreePdf.js';
import { notifyNewCandidate, notifyResumeReady } from '../services/slackNotifier.js';
import type { Candidate, CandidateProfile, GeneratedResume, GenerationInput } from '../types/candidate.js';
import type { ThreePDFGenerationOutput } from '../types/threePdf.js';

const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev',
});

const candidatesCollection = firestore.collection('candidates');
const profilesCollection = firestore.collection('candidateProfiles');
const resumesCollection = firestore.collection('resumes');

/**
 * Task payload from Cloud Tasks
 */
interface TaskPayload {
  candidateId: string;
  correlationId: string;
  attempt: number;
  enqueuedAt: string;
}

/**
 * Process candidate task from Cloud Tasks queue
 * POST /internal/tasks/processCandidate
 *
 * This handler is designed for Cloud Tasks with automatic retry:
 * - Returns 2xx on success (task complete)
 * - Returns 5xx on retryable failure (Cloud Tasks will retry)
 * - Returns 4xx on permanent failure (no retry)
 */
export async function taskProcessCandidateHandler(
  req: Request,
  res: Response
): Promise<void> {
  const correlationId = req.correlationId || (req.headers['x-correlation-id'] as string) || 'unknown';
  const retryCount = getRetryCount(req.headers);
  const isFromCloudTasks = isCloudTasksRequest(req.headers);

  console.log(`[taskHandler] correlationId=${correlationId} Received task (retry: ${retryCount}, fromCloudTasks: ${isFromCloudTasks})`);

  // Parse payload
  let payload: TaskPayload;
  try {
    payload = req.body as TaskPayload;
  } catch (error) {
    console.error(`[taskHandler] correlationId=${correlationId} Invalid payload:`, error);
    res.status(400).json({
      error: 'Invalid payload',
      correlationId,
      retryable: false,
    });
    return;
  }

  const { candidateId } = payload;

  if (!candidateId) {
    res.status(400).json({
      error: 'candidateId is required',
      correlationId,
      retryable: false,
    });
    return;
  }

  console.log(`[taskHandler] correlationId=${correlationId} Processing candidate: ${candidateId} (attempt: ${retryCount + 1})`);

  try {
    // 1. Get candidate metadata
    const candidateDoc = await candidatesCollection.doc(candidateId).get();
    if (!candidateDoc.exists) {
      console.error(`[taskHandler] correlationId=${correlationId} Candidate not found: ${candidateId}`);
      res.status(404).json({
        error: 'Candidate not found',
        correlationId,
        retryable: false,  // Don't retry if candidate doesn't exist
      });
      return;
    }

    const candidate = candidateDoc.data() as Candidate;
    console.log(`[taskHandler] correlationId=${correlationId} Candidate: ${candidate.name}`);

    // 2. Update status to processing
    await candidatesCollection.doc(candidateId).update({
      status: 'processing',
      processingAttempt: retryCount + 1,
      correlationId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Send new candidate Slack notification (if not already sent)
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
        await candidatesCollection.doc(candidateId).update({
          firstSlackNotifiedAt: FieldValue.serverTimestamp(),
        });
      } catch (slackError) {
        console.warn(`[taskHandler] correlationId=${correlationId} Slack notification failed:`, slackError);
        // Non-fatal, continue
      }
    }

    // 4. Extract text from documents
    const documentTexts = await extractDocumentTexts(candidateId);
    if (documentTexts.length === 0) {
      throw new Error('No documents found or text extraction failed');
    }
    console.log(`[taskHandler] correlationId=${correlationId} Extracted ${documentTexts.length} documents`);

    // 5. Generate resume content
    const input: GenerationInput = {
      candidateId,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      city: candidate.city,
      state: candidate.state,
      branch: candidate.branch,
      rank: candidate.rank,
      mos: candidate.mos,
      documentTexts,
    };

    // Generate 3-PDF bundle
    const [profileResumeResult, threePdfBundle] = await Promise.all([
      generateProfileAndResume(input),
      generateThreePdfResume(input),
    ]);

    const { profile, resume } = profileResumeResult;
    const modelInfo = getModelInfo();

    // 6. Save profile and resume
    const timestamp = FieldValue.serverTimestamp();

    await profilesCollection.doc(candidateId).set({
      ...profile,
      createdAt: timestamp,
      modelName: modelInfo.modelName,
      modelVersion: modelInfo.modelVersion,
    });

    await resumesCollection.doc(candidateId).set({
      ...resume,
      createdAt: timestamp,
      modelName: modelInfo.modelName,
      modelVersion: modelInfo.modelVersion,
    });

    // 7. Export PDFs
    const threePdfPaths = await exportThreePdfBundle(candidateId, threePdfBundle);
    await resumesCollection.doc(candidateId).update({ threePdfPaths });

    // 8. Update status to ready
    await candidatesCollection.doc(candidateId).update({
      status: 'resume_ready',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 9. Send resume ready notification
    try {
      await notifyResumeReady({
        candidateId,
        name: candidate.name,
        email: candidate.email,
        branch: candidate.branch,
        rank: candidate.rank,
        mos: candidate.mos,
        pdfPath: threePdfPaths.civilianPdfPath,
        docxPath: '',
      });
      await resumesCollection.doc(candidateId).update({
        resumeSlackNotifiedAt: FieldValue.serverTimestamp(),
      });
    } catch (slackError) {
      console.warn(`[taskHandler] correlationId=${correlationId} Resume notification failed:`, slackError);
    }

    console.log(`[taskHandler] correlationId=${correlationId} Completed successfully`);

    res.status(200).json({
      status: 'ok',
      candidateId,
      correlationId,
      newStatus: 'resume_ready',
      threePdfPaths,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[taskHandler] correlationId=${correlationId} Error:`, error);

    // Update candidate with error info
    try {
      await candidatesCollection.doc(candidateId).update({
        status: retryCount >= 4 ? 'error' : 'processing',  // Only set error after max retries
        errorMessage,
        errorCorrelationId: correlationId,
        lastErrorAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (updateError) {
      console.error(`[taskHandler] correlationId=${correlationId} Failed to update error status:`, updateError);
    }

    // Determine if retryable
    const isRetryable = shouldRetry(error, retryCount);

    if (isRetryable) {
      // Return 500 to trigger Cloud Tasks retry
      res.status(500).json({
        error: 'Processing failed - will retry',
        message: errorMessage,
        correlationId,
        retryable: true,
        attempt: retryCount + 1,
      });
    } else {
      // Return 400 to indicate permanent failure (no retry)
      res.status(400).json({
        error: 'Processing failed permanently',
        message: errorMessage,
        correlationId,
        retryable: false,
        attempt: retryCount + 1,
      });
    }
  }
}

/**
 * Determine if an error should trigger a retry
 */
function shouldRetry(error: unknown, retryCount: number): boolean {
  // Max retries reached
  if (retryCount >= 4) {
    return false;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Don't retry on these permanent failures
  const permanentFailures = [
    'Candidate not found',
    'No documents found',
    'Invalid payload',
    'candidateId is required',
  ];

  for (const pf of permanentFailures) {
    if (errorMessage.includes(pf)) {
      return false;
    }
  }

  // Retry on transient failures
  const transientFailures = [
    'DEADLINE_EXCEEDED',
    'UNAVAILABLE',
    'INTERNAL',
    'timeout',
    'rate limit',
    'quota',
    '500',
    '502',
    '503',
    '504',
  ];

  for (const tf of transientFailures) {
    if (errorMessage.toLowerCase().includes(tf.toLowerCase())) {
      return true;
    }
  }

  // Default to retry for unknown errors
  return true;
}
