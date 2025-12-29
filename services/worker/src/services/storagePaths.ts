// Storage Path Helper for Resume Exports
// Phase 2.0: Resume Export (PDF/DOCX)
// Phase 2.5: 3-PDF Bundle Export

/**
 * Generate storage paths for resume exports
 * Convention: candidates/{candidateId}/exports/{timestamp}-resume.{ext}
 */
export function getResumeExportPaths(
  candidateId: string,
  timestamp?: string
): {
  pdfPath: string;
  docxPath: string;
  timestamp: string;
} {
  const ts = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
  const basePath = `candidates/${candidateId}/exports/${ts}-resume`;

  return {
    pdfPath: `${basePath}.pdf`,
    docxPath: `${basePath}.docx`,
    timestamp: ts,
  };
}

/**
 * Generate storage paths for 3-PDF bundle exports
 * Convention: candidates/{candidateId}/exports/{timestamp}-{type}.pdf
 */
export function getBundleExportPaths(
  candidateId: string,
  timestamp?: string
): {
  militaryPdfPath: string;
  civilianPdfPath: string;
  crosswalkPdfPath: string;
  timestamp: string;
} {
  const ts = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
  const basePath = `candidates/${candidateId}/exports/${ts}`;

  return {
    militaryPdfPath: `${basePath}-resume-military.pdf`,
    civilianPdfPath: `${basePath}-resume-civilian.pdf`,
    crosswalkPdfPath: `${basePath}-resume-crosswalk.pdf`,
    timestamp: ts,
  };
}

/**
 * Get the storage bucket name from environment
 */
export function getStorageBucket(): string {
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('FIREBASE_STORAGE_BUCKET environment variable is required');
  }
  return bucket;
}

/**
 * Generate a public URL for a storage path (if public access is enabled)
 * Note: For production, use signed URLs instead
 */
export function getPublicStorageUrl(storagePath: string): string {
  const bucket = getStorageBucket();
  return `https://storage.googleapis.com/${bucket}/${storagePath}`;
}
