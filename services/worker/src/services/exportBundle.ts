// Bundle Export Service - 3-PDF Resume Bundle
// Phase 2.5: Military Resume + Civilian Resume + Crosswalk

import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import puppeteer, { Browser } from 'puppeteer';
import { getBundleExportPaths, getStorageBucket } from './storagePaths.js';
import type { ResumeBundleOutput } from '../types/candidate.js';

const firestore = new Firestore();
const storage = new Storage();

// Collections
const resumeBundlesCollection = firestore.collection('resumeBundles');

export interface BundleExportResult {
  militaryPdfPath: string;
  civilianPdfPath: string;
  crosswalkPdfPath: string;
  exportGeneratedAt: Timestamp;
  errors: string[];
}

/**
 * Export 3-PDF bundle for a candidate
 * Generates Military Resume, Civilian Resume, and Crosswalk PDFs
 */
export async function exportBundleForCandidate(
  candidateId: string,
  bundle: ResumeBundleOutput
): Promise<BundleExportResult> {
  console.log(`[exportBundle] Starting 3-PDF bundle export for candidate: ${candidateId}`);

  const errors: string[] = [];

  // Generate paths
  const { militaryPdfPath, civilianPdfPath, crosswalkPdfPath, timestamp } = getBundleExportPaths(candidateId);
  const bucket = storage.bucket(getStorageBucket());

  console.log(`[exportBundle] Generating exports with timestamp: ${timestamp}`);

  // Launch browser once for all 3 PDFs
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });

  try {
    // Generate Military Resume PDF
    let militaryGenerated = false;
    try {
      const pdfBuffer = await generatePdfFromHtml(browser, bundle.artifacts.resume_military.content_html);
      await bucket.file(militaryPdfPath).save(pdfBuffer, {
        contentType: 'application/pdf',
        metadata: {
          candidateId,
          exportTimestamp: timestamp,
          resumeType: 'military',
        },
      });
      console.log(`[exportBundle] Military PDF saved to: ${militaryPdfPath}`);
      militaryGenerated = true;
    } catch (error) {
      const msg = `Military PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[exportBundle] ${msg}`);
      errors.push(msg);
    }

    // Generate Civilian Resume PDF
    let civilianGenerated = false;
    try {
      const pdfBuffer = await generatePdfFromHtml(browser, bundle.artifacts.resume_civilian.content_html);
      await bucket.file(civilianPdfPath).save(pdfBuffer, {
        contentType: 'application/pdf',
        metadata: {
          candidateId,
          exportTimestamp: timestamp,
          resumeType: 'civilian',
        },
      });
      console.log(`[exportBundle] Civilian PDF saved to: ${civilianPdfPath}`);
      civilianGenerated = true;
    } catch (error) {
      const msg = `Civilian PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[exportBundle] ${msg}`);
      errors.push(msg);
    }

    // Generate Crosswalk PDF
    let crosswalkGenerated = false;
    try {
      const pdfBuffer = await generatePdfFromHtml(browser, bundle.artifacts.resume_crosswalk.content_html);
      await bucket.file(crosswalkPdfPath).save(pdfBuffer, {
        contentType: 'application/pdf',
        metadata: {
          candidateId,
          exportTimestamp: timestamp,
          resumeType: 'crosswalk',
        },
      });
      console.log(`[exportBundle] Crosswalk PDF saved to: ${crosswalkPdfPath}`);
      crosswalkGenerated = true;
    } catch (error) {
      const msg = `Crosswalk PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[exportBundle] ${msg}`);
      errors.push(msg);
    }

    // Update Firestore with export paths
    const updateData: Record<string, unknown> = {
      exportGeneratedAt: FieldValue.serverTimestamp(),
    };

    if (militaryGenerated) {
      updateData.militaryPdfPath = militaryPdfPath;
    }
    if (civilianGenerated) {
      updateData.civilianPdfPath = civilianPdfPath;
    }
    if (crosswalkGenerated) {
      updateData.crosswalkPdfPath = crosswalkPdfPath;
    }
    if (errors.length > 0) {
      updateData.exportError = errors.join('; ');
    }

    await resumeBundlesCollection.doc(candidateId).update(updateData);

    console.log(
      `[exportBundle] Export complete for ${candidateId}. ` +
        `Military: ${militaryGenerated ? 'OK' : 'FAILED'}, ` +
        `Civilian: ${civilianGenerated ? 'OK' : 'FAILED'}, ` +
        `Crosswalk: ${crosswalkGenerated ? 'OK' : 'FAILED'}`
    );

    return {
      militaryPdfPath: militaryGenerated ? militaryPdfPath : '',
      civilianPdfPath: civilianGenerated ? civilianPdfPath : '',
      crosswalkPdfPath: crosswalkGenerated ? crosswalkPdfPath : '',
      exportGeneratedAt: Timestamp.now(),
      errors,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Generate PDF from HTML using Puppeteer
 */
async function generatePdfFromHtml(
  browser: Browser,
  html: string
): Promise<Buffer> {
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
