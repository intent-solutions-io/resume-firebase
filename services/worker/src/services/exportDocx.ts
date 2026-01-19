// DOCX Export Service
// Uploads generated DOCX files to Firebase Storage

import { Storage } from '@google-cloud/storage';
import type { ResumeDocxPaths } from '../types/resumeData.js';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev',
});

const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET || 'resume-gen-intent-dev.firebasestorage.app';

/**
 * Upload all three DOCX files to Firebase Storage
 */
export async function uploadDocxBundle(
  candidateId: string,
  buffers: { military: Buffer; civilian: Buffer; crosswalk: Buffer }
): Promise<ResumeDocxPaths> {
  const bucket = storage.bucket(BUCKET_NAME);
  const timestamp = Date.now();

  // Define file paths
  const paths = {
    military: `candidates/${candidateId}/exports/${timestamp}-resume-military.docx`,
    civilian: `candidates/${candidateId}/exports/${timestamp}-resume-civilian.docx`,
    crosswalk: `candidates/${candidateId}/exports/${timestamp}-crosswalk.docx`,
  };

  console.log(`[exportDocx] Uploading 3 DOCX files for candidate: ${candidateId}`);

  // Upload all three files in parallel
  await Promise.all([
    uploadFile(bucket, paths.military, buffers.military, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    uploadFile(bucket, paths.civilian, buffers.civilian, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    uploadFile(bucket, paths.crosswalk, buffers.crosswalk, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
  ]);

  console.log(`[exportDocx] Successfully uploaded all 3 DOCX files`);

  return {
    militaryDocxPath: paths.military,
    civilianDocxPath: paths.civilian,
    crosswalkDocxPath: paths.crosswalk,
  };
}

/**
 * Upload a single file to Firebase Storage
 */
async function uploadFile(
  bucket: ReturnType<Storage['bucket']>,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    },
  });

  console.log(`[exportDocx] Uploaded: ${path} (${buffer.length} bytes)`);
}

/**
 * Get signed download URL for a DOCX file
 */
export async function getDocxDownloadUrl(filePath: string): Promise<string> {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}
