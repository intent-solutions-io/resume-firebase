import { Storage } from '@google-cloud/storage';

const storage = new Storage();

const RAW_UPLOADS_BUCKET = process.env.RAW_UPLOADS_BUCKET || 'resume-generator-raw-uploads';
const ARTIFACTS_BUCKET = process.env.ARTIFACTS_BUCKET || 'resume-generator-artifacts';

// Signed URL TTL in seconds
const UPLOAD_URL_TTL = 15 * 60; // 15 minutes
const DOWNLOAD_URL_TTL = 60 * 60; // 1 hour

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

class StorageService {
  private rawBucket = storage.bucket(RAW_UPLOADS_BUCKET);
  private artifactsBucket = storage.bucket(ARTIFACTS_BUCKET);

  /**
   * Generate a signed URL for file upload
   * Files are stored at: cases/{caseId}/raw/{documentId}/{fileName}
   */
  async generateUploadUrl(
    caseId: string,
    documentId: string,
    fileName: string
  ): Promise<string> {
    const filePath = `cases/${caseId}/raw/${documentId}/${fileName}`;
    const file = this.rawBucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + UPLOAD_URL_TTL * 1000,
      contentType: 'application/octet-stream', // Allow any type, validate later
      extensionHeaders: {
        'x-goog-content-length-range': `0,${MAX_FILE_SIZE}`,
      },
    });

    return url;
  }

  /**
   * Generate a signed URL for artifact download
   * Artifacts are stored at: cases/{caseId}/artifacts/{artifactId}/{fileName}
   */
  async generateDownloadUrl(
    caseId: string,
    artifactId: string,
    fileName: string
  ): Promise<string> {
    const filePath = `cases/${caseId}/artifacts/${artifactId}/${fileName}`;
    const file = this.artifactsBucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + DOWNLOAD_URL_TTL * 1000,
      responseDisposition: `attachment; filename="${fileName}"`,
    });

    return url;
  }

  /**
   * Generate a signed URL for raw document download (reviewer console)
   * Documents are stored at: cases/{caseId}/raw/{documentId}/{fileName}
   */
  async generateDocumentDownloadUrl(
    caseId: string,
    documentId: string,
    fileName: string
  ): Promise<string> {
    const filePath = `cases/${caseId}/raw/${documentId}/${fileName}`;
    const file = this.rawBucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + DOWNLOAD_URL_TTL * 1000,
      responseDisposition: `attachment; filename="${fileName}"`,
    });

    return url;
  }

  /**
   * Check if a file exists in the raw uploads bucket
   */
  async fileExists(caseId: string, documentId: string): Promise<boolean> {
    const prefix = `cases/${caseId}/raw/${documentId}/`;
    const [files] = await this.rawBucket.getFiles({ prefix, maxResults: 1 });
    return files.length > 0;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(
    caseId: string,
    documentId: string,
    fileName: string
  ): Promise<{ size: number; contentType: string } | null> {
    const filePath = `cases/${caseId}/raw/${documentId}/${fileName}`;
    const file = this.rawBucket.file(filePath);

    try {
      const [metadata] = await file.getMetadata();
      return {
        size: Number(metadata.size),
        contentType: metadata.contentType || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }
}

export const storageService = new StorageService();
