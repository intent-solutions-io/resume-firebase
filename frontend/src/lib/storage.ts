// Cloud Storage Helper for Candidate Document Uploads
// Path convention: candidates/{candidateId}/uploads/{timestamp}-{sanitizedFileName}

import { ref, uploadBytes, UploadResult } from 'firebase/storage';
import { getFirebaseStorage } from './firebase';

/**
 * Sanitize filename for storage path
 * Removes special characters and spaces
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Generate storage path for a candidate document
 */
export function generateStoragePath(candidateId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(fileName);
  return `candidates/${candidateId}/uploads/${timestamp}-${sanitized}`;
}

/**
 * Upload a file to Cloud Storage
 * Returns the storage path on success
 */
export async function uploadCandidateDocument(
  candidateId: string,
  file: File
): Promise<{ storagePath: string; result: UploadResult }> {
  const storage = getFirebaseStorage();
  const storagePath = generateStoragePath(candidateId, file.name);
  const storageRef = ref(storage, storagePath);

  const result = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      candidateId,
      originalName: file.name,
    },
  });

  return { storagePath, result };
}
