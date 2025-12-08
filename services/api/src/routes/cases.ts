import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from '../services/firestore.js';
import { storageService } from '../services/storage.js';
import { tasksService } from '../services/tasks.js';
// Import shared schemas for contract consistency
import {
  createCaseSchema,
  requestUploadUrlsSchema,
  reviewerUpdateSchema,
} from '@resume-generator/shared/schemas';

const router = Router();

// POST /v1/cases - Create a new case
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCaseSchema.parse(req.body);
    const caseId = uuidv4();

    await firestoreService.createCase({
      id: caseId,
      name: data.name,
      email: data.email,
      targetRole: data.targetRole,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Log event (no PII)
    console.log(`Case created: ${caseId}`);

    res.status(201).json({
      caseId,
      status: 'pending',
    });
  } catch (error) {
    next(error);
  }
});

// POST /v1/cases/:caseId/uploads:request - Get signed upload URLs
router.post(
  '/:caseId/uploads:request',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;
      const data = requestUploadUrlsSchema.parse(req.body);

      // Verify case exists
      const caseDoc = await firestoreService.getCase(caseId);
      if (!caseDoc) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      // Generate signed URLs for each file
      const urls = await Promise.all(
        data.fileNames.map(async (fileName) => {
          const documentId = uuidv4();
          const uploadUrl = await storageService.generateUploadUrl(
            caseId,
            documentId,
            fileName
          );

          // Create document record
          await firestoreService.createDocument({
            id: documentId,
            caseId,
            fileName,
            status: 'pending',
            uploadedAt: new Date().toISOString(),
          });

          return {
            fileName,
            uploadUrl,
            documentId,
          };
        })
      );

      console.log(`Upload URLs generated for case: ${caseId}, count: ${urls.length}`);

      res.json({ urls });
    } catch (error) {
      next(error);
    }
  }
);

// POST /v1/cases/:caseId/process - Trigger processing
router.post(
  '/:caseId/process',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;

      // Verify case exists
      const caseDoc = await firestoreService.getCase(caseId);
      if (!caseDoc) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      // Enqueue processing task
      await tasksService.enqueueProcessing(caseId);

      // Update case status
      await firestoreService.updateCaseStatus(caseId, 'processing');

      console.log(`Processing triggered for case: ${caseId}`);

      res.json({ status: 'processing' });
    } catch (error) {
      next(error);
    }
  }
);

// GET /v1/cases/:caseId - Get case status
router.get(
  '/:caseId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;

      const caseDoc = await firestoreService.getCase(caseId);
      if (!caseDoc) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      const artifacts = await firestoreService.getCaseArtifacts(caseId);

      res.json({
        caseId: caseDoc.id,
        status: caseDoc.status,
        currentStep: caseDoc.currentStep,
        progress: caseDoc.progress,
        artifacts: artifacts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          size: a.size,
          createdAt: a.createdAt,
        })),
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /v1/cases/:caseId/artifacts/:artifactId/download - Get download URL
router.get(
  '/:caseId/artifacts/:artifactId/download',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId, artifactId } = req.params;

      // Verify case and artifact exist
      const artifact = await firestoreService.getArtifact(caseId, artifactId);
      if (!artifact) {
        res.status(404).json({ error: 'Artifact not found' });
        return;
      }

      const downloadUrl = await storageService.generateDownloadUrl(
        caseId,
        artifactId,
        artifact.fileName
      );

      console.log(`Download URL generated for artifact: ${artifactId}`);

      res.json({ downloadUrl });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// REVIEWER CONSOLE ENDPOINTS (Human-in-the-Loop)
// =============================================================================

// GET /v1/cases/:caseId/review - Get full case review data
router.get(
  '/:caseId/review',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;

      const reviewInfo = await firestoreService.getCaseReviewInfo(caseId);
      if (!reviewInfo) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      // Return review data (redact sensitive info)
      res.json({
        caseId: reviewInfo.case.id,
        status: reviewInfo.case.status,
        targetRole: reviewInfo.case.targetRole,
        reviewStatus: reviewInfo.case.reviewStatus || 'unreviewed',
        reviewedAt: reviewInfo.case.reviewedAt,
        reviewerNotes: reviewInfo.case.reviewerNotes,
        createdAt: reviewInfo.case.createdAt,
        updatedAt: reviewInfo.case.updatedAt,
        documents: reviewInfo.documents.map((d) => ({
          id: d.id,
          fileName: d.fileName,
          status: d.status,
          extractionStatus: d.extractionStatus,
          extractedText: d.extractedText,
          uploadedAt: d.uploadedAt,
        })),
        artifacts: reviewInfo.artifacts.map((a) => ({
          id: a.id,
          name: a.name,
          fileName: a.fileName,
          type: a.type,
          size: a.size,
          createdAt: a.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /v1/cases/:caseId/review - Update review status
router.post(
  '/:caseId/review',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;
      const data = reviewerUpdateSchema.parse(req.body);

      // Verify case exists
      const caseDoc = await firestoreService.getCase(caseId);
      if (!caseDoc) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      // Update review status
      await firestoreService.updateCaseReview(caseId, data.status, data.notes);

      // Log event (no PII - truncate caseId)
      console.log(`Review updated: ${caseId.substring(0, 8)}... -> ${data.status}`);

      res.json({
        caseId,
        reviewStatus: data.status,
        reviewedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /v1/cases/:caseId/documents/:documentId/download - Get document download URL
router.get(
  '/:caseId/documents/:documentId/download',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId, documentId } = req.params;

      // Verify document exists and belongs to case
      const document = await firestoreService.getDocument(documentId);
      if (!document || document.caseId !== caseId) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      const downloadUrl = await storageService.generateDocumentDownloadUrl(
        caseId,
        documentId,
        document.fileName
      );

      console.log(`Document download URL generated: ${documentId.substring(0, 8)}...`);

      res.json({ downloadUrl });
    } catch (error) {
      next(error);
    }
  }
);

export { router as casesRouter };
