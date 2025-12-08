import { Storage } from '@google-cloud/storage';

const storage = new Storage();

const RAW_UPLOADS_BUCKET = process.env.RAW_UPLOADS_BUCKET || 'resume-generator-raw-uploads';
const ARTIFACTS_BUCKET = process.env.ARTIFACTS_BUCKET || 'resume-generator-artifacts';

class StorageService {
  private rawBucket = storage.bucket(RAW_UPLOADS_BUCKET);
  private artifactsBucket = storage.bucket(ARTIFACTS_BUCKET);

  /**
   * Download a file from raw uploads bucket
   */
  async downloadFile(
    caseId: string,
    documentId: string,
    fileName: string
  ): Promise<Buffer> {
    const filePath = `cases/${caseId}/raw/${documentId}/${fileName}`;
    const file = this.rawBucket.file(filePath);

    const [content] = await file.download();
    return content;
  }

  /**
   * Upload an artifact to artifacts bucket
   */
  async uploadArtifact(
    caseId: string,
    artifactId: string,
    fileName: string,
    content: Buffer
  ): Promise<void> {
    const filePath = `cases/${caseId}/artifacts/${artifactId}/${fileName}`;
    const file = this.artifactsBucket.file(filePath);

    await file.save(content, {
      contentType: this.getContentType(fileName),
      metadata: {
        cacheControl: 'private, max-age=31536000',
      },
    });
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'json':
        return 'application/json';
      case 'pdf':
        return 'application/pdf';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * List files in a case's raw directory
   */
  async listRawFiles(caseId: string): Promise<string[]> {
    const prefix = `cases/${caseId}/raw/`;
    const [files] = await this.rawBucket.getFiles({ prefix });
    return files.map((f) => f.name);
  }
}

export const storageService = new StorageService();
