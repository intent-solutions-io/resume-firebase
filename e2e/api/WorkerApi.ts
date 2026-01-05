import { APIRequestContext, expect } from '@playwright/test';
import { URLS, VALIDATION_THRESHOLDS, SOFT_THRESHOLDS } from '../fixtures/test-data';

/**
 * API Helper: Worker Service Endpoints
 */
export class WorkerApi {
  readonly request: APIRequestContext;
  readonly baseUrl: string;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.baseUrl = URLS.WORKER;
  }

  async healthCheck() {
    const response = await this.request.get(`${this.baseUrl}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('worker');

    return data;
  }

  async getCandidateStatus(candidateId: string) {
    const response = await this.request.get(`${this.baseUrl}/internal/candidateStatus/${candidateId}`);
    expect(response.ok()).toBeTruthy();

    return await response.json();
  }

  async generateThreePdfBundle(candidateId: string, targetJobDescription: string) {
    const response = await this.request.post(`${this.baseUrl}/internal/prototype/threePdf`, {
      headers: { 'Content-Type': 'application/json' },
      data: { candidateId, targetJobDescription },
      timeout: 180000, // 3 minute timeout for AI processing
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    return data;
  }

  async getDownloadUrl(candidateId: string, format: 'pdf' | 'docx') {
    const response = await this.request.get(`${this.baseUrl}/internal/resumeDownload/${candidateId}/${format}`);

    if (!response.ok()) {
      return null;
    }

    const data = await response.json();
    return data.url;
  }

  async validateAtsScores(validation: {
    atsScore: number;
    keywordCoverage: number;
    bannedPhrasesFound: string[];
    wordCount: { military: number; civilian: number };
  }) {
    // ATS Score validation (hard threshold for E2E, soft warning for production target)
    expect(validation.atsScore).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_ATS_SCORE);
    if (validation.atsScore >= SOFT_THRESHOLDS.TARGET_ATS_SCORE) {
      console.log(`   ✓ ATS Score: ${validation.atsScore} (min: ${VALIDATION_THRESHOLDS.MIN_ATS_SCORE})`);
    } else {
      console.log(`   ⚠ ATS Score: ${validation.atsScore} (E2E min: ${VALIDATION_THRESHOLDS.MIN_ATS_SCORE}, prod target: ${SOFT_THRESHOLDS.TARGET_ATS_SCORE})`);
    }

    // Keyword coverage validation (hard threshold for E2E, soft warning for production target)
    expect(validation.keywordCoverage).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_KEYWORD_COVERAGE);
    if (validation.keywordCoverage >= SOFT_THRESHOLDS.TARGET_KEYWORD_COVERAGE) {
      console.log(`   ✓ Keyword Coverage: ${validation.keywordCoverage}% (min: ${VALIDATION_THRESHOLDS.MIN_KEYWORD_COVERAGE}%)`);
    } else {
      console.log(`   ⚠ Keyword Coverage: ${validation.keywordCoverage}% (E2E min: ${VALIDATION_THRESHOLDS.MIN_KEYWORD_COVERAGE}%, prod target: ${SOFT_THRESHOLDS.TARGET_KEYWORD_COVERAGE}%)`);
    }

    // Banned phrases validation
    expect(validation.bannedPhrasesFound.length).toBeLessThanOrEqual(VALIDATION_THRESHOLDS.MAX_BANNED_PHRASES);
    console.log(`   ✓ Banned Phrases: ${validation.bannedPhrasesFound.length} (max: ${VALIDATION_THRESHOLDS.MAX_BANNED_PHRASES})`);

    // Word count validation
    expect(validation.wordCount.military).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_WORD_COUNT);
    expect(validation.wordCount.military).toBeLessThanOrEqual(VALIDATION_THRESHOLDS.MAX_WORD_COUNT);
    expect(validation.wordCount.civilian).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_WORD_COUNT);
    expect(validation.wordCount.civilian).toBeLessThanOrEqual(VALIDATION_THRESHOLDS.MAX_WORD_COUNT);
    console.log(`   ✓ Word Counts: Military=${validation.wordCount.military}, Civilian=${validation.wordCount.civilian}`);
  }

  async processCandidate(candidateId: string) {
    const response = await this.request.post(`${this.baseUrl}/internal/processCandidate`, {
      headers: { 'Content-Type': 'application/json' },
      data: { candidateId },
      timeout: 180000,
    });

    return await response.json();
  }

  async waitForStatus(candidateId: string, targetStatus: string, timeout = 120000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getCandidateStatus(candidateId);

      if (status.status === targetStatus) {
        return true;
      }

      if (status.status === 'error') {
        throw new Error(`Candidate processing failed: ${status.errorMessage || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
    }

    return false;
  }
}
