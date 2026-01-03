// Resume Export Service
// Phase 2.0: Resume Export (PDF/DOCX)
// Generates PDF and DOCX from GeneratedResume

import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import puppeteer from 'puppeteer';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { renderResumeToHtml, type CandidateHeader } from './resumeRender.js';
import { getResumeExportPaths, getStorageBucket } from './storagePaths.js';
import type { GeneratedResume, Candidate } from '../types/candidate.js';

const firestore = new Firestore();
const storage = new Storage();

// Collections
const candidatesCollection = firestore.collection('candidates');
const resumesCollection = firestore.collection('resumes');

export interface ExportResult {
  pdfPath: string;
  docxPath: string;
  exportGeneratedAt: Timestamp;
  errors: string[];
}

/**
 * Export resume for a candidate to PDF and DOCX
 * Stores files in Cloud Storage and updates Firestore
 * @param candidateId - Candidate ID
 * @param civilianHtml - Optional pre-generated HTML from 3-PDF bundle (if provided, uses this instead of rendering from Firestore data)
 */
export async function exportResumeForCandidate(
  candidateId: string,
  civilianHtml?: string
): Promise<ExportResult> {
  console.log(`[exportResume] Starting export for candidate: ${candidateId}`);

  const errors: string[] = [];

  // 3. Generate paths
  const { pdfPath, docxPath, timestamp } = getResumeExportPaths(candidateId);
  const bucket = storage.bucket(getStorageBucket());

  console.log(`[exportResume] Generating exports with timestamp: ${timestamp}`);

  // 4. Get HTML (either from 3-PDF bundle or render from Firestore data)
  let html: string;

  if (civilianHtml) {
    // Use pre-generated HTML from 3-PDF bundle (ensures consistency)
    html = civilianHtml;
    console.log('[exportResume] Using civilian HTML from 3-PDF bundle');
  } else {
    // Fallback: Render from Firestore data (legacy approach)
    console.log('[exportResume] Rendering HTML from Firestore data (fallback)');

    // 1. Fetch resume data
    const resumeDoc = await resumesCollection.doc(candidateId).get();
    if (!resumeDoc.exists) {
      throw new Error(`Resume not found for candidate: ${candidateId}`);
    }
    const resume = resumeDoc.data() as GeneratedResume;

    // 2. Fetch candidate data for header
    const candidateDoc = await candidatesCollection.doc(candidateId).get();
    if (!candidateDoc.exists) {
      throw new Error(`Candidate not found: ${candidateId}`);
    }
    const candidate = candidateDoc.data() as Candidate;

    const candidateHeader: CandidateHeader = {
      name: candidate.name,
      email: candidate.email,
      branch: candidate.branch,
      rank: candidate.rank,
      mos: candidate.mos,
    };

    html = renderResumeToHtml(resume, candidateHeader);
  }

  // 5. Generate PDF
  let pdfGenerated = false;
  try {
    const pdfBuffer = await generatePdf(html);
    await bucket.file(pdfPath).save(pdfBuffer, {
      contentType: 'application/pdf',
      metadata: {
        candidateId,
        exportTimestamp: timestamp,
      },
    });
    console.log(`[exportResume] PDF saved to: ${pdfPath}`);
    pdfGenerated = true;
  } catch (error) {
    const msg = `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[exportResume] ${msg}`);
    errors.push(msg);
  }

  // 6. Generate DOCX (only if using Firestore data, not HTML)
  let docxGenerated = false;
  if (!civilianHtml) {
    try {
      // Fetch data for DOCX (already fetched above in fallback path)
      const resumeDoc = await resumesCollection.doc(candidateId).get();
      const resume = resumeDoc.data() as GeneratedResume;
      const candidateDoc = await candidatesCollection.doc(candidateId).get();
      const candidate = candidateDoc.data() as Candidate;

      const candidateHeader: CandidateHeader = {
        name: candidate.name,
        email: candidate.email,
        branch: candidate.branch,
        rank: candidate.rank,
        mos: candidate.mos,
      };

      const docxBuffer = await generateDocx(resume, candidateHeader);
      await bucket.file(docxPath).save(docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          candidateId,
          exportTimestamp: timestamp,
        },
      });
      console.log(`[exportResume] DOCX saved to: ${docxPath}`);
      docxGenerated = true;
    } catch (error) {
      const msg = `DOCX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[exportResume] ${msg}`);
      errors.push(msg);
    }
  } else {
    console.log('[exportResume] Skipping DOCX generation when using civilian HTML (3-PDF has DOCX export)');
  }

  // 7. Update Firestore with export paths
  const updateData: Record<string, unknown> = {
    exportGeneratedAt: FieldValue.serverTimestamp(),
  };

  if (pdfGenerated) {
    updateData.pdfPath = pdfPath;
  }
  if (docxGenerated) {
    updateData.docxPath = docxPath;
  }
  if (errors.length > 0) {
    updateData.exportError = errors.join('; ');
  }

  await resumesCollection.doc(candidateId).update(updateData);

  console.log(
    `[exportResume] Export complete for ${candidateId}. ` +
      `PDF: ${pdfGenerated ? 'OK' : 'FAILED'}, DOCX: ${docxGenerated ? 'OK' : 'FAILED'}`
  );

  return {
    pdfPath: pdfGenerated ? pdfPath : '',
    docxPath: docxGenerated ? docxPath : '',
    exportGeneratedAt: Timestamp.now(),
    errors,
  };
}

/**
 * Generate PDF from HTML using Puppeteer
 * Uses system Chromium in production (Cloud Run) via PUPPETEER_EXECUTABLE_PATH
 */
async function generatePdf(html: string): Promise<Buffer> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath || undefined, // Use system Chromium if set
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process', // Required for Cloud Run
    ],
  });

  try {
    const page = await browser.newPage();
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
    await browser.close();
  }
}

/**
 * Generate DOCX from resume data using docx library
 */
async function generateDocx(
  resume: GeneratedResume,
  candidate: CandidateHeader
): Promise<Buffer> {
  const sections: Paragraph[] = [];

  // Header - Name
  sections.push(
    new Paragraph({
      text: candidate.name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );

  // Header - Contact
  sections.push(
    new Paragraph({
      text: candidate.email,
      alignment: AlignmentType.CENTER,
    })
  );

  // Header - Military info
  if (candidate.branch || candidate.rank || candidate.mos) {
    const details: string[] = [];
    if (candidate.branch) details.push(candidate.branch);
    if (candidate.rank) details.push(candidate.rank);
    if (candidate.mos) details.push(`MOS: ${candidate.mos}`);
    sections.push(
      new Paragraph({
        text: details.join(' | '),
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Summary section
  if (resume.summary) {
    sections.push(createSectionHeading('PROFESSIONAL SUMMARY'));
    sections.push(
      new Paragraph({
        text: resume.summary,
        spacing: { after: 200 },
      })
    );
  }

  // Skills section - horizontal boxes layout using table
  if (resume.skills && resume.skills.length > 0) {
    sections.push(createSectionHeading('SKILLS'));

    // Create skill boxes in table format (4-5 per row)
    const skillsPerRow = 5;
    const rows: TableRow[] = [];

    for (let i = 0; i < resume.skills.length; i += skillsPerRow) {
      const rowSkills = resume.skills.slice(i, i + skillsPerRow);
      const cells = rowSkills.map(skill =>
        new TableCell({
          children: [
            new Paragraph({
              text: skill,
              alignment: AlignmentType.CENTER,
            })
          ],
          shading: { fill: 'F5F5F5' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'D0D0D0' },
          },
          margins: { top: 50, bottom: 50, left: 100, right: 100 },
        })
      );

      // Fill remaining cells if row is not complete
      while (cells.length < skillsPerRow) {
        cells.push(
          new TableCell({
            children: [new Paragraph({ text: '' })],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          })
        );
      }

      rows.push(new TableRow({ children: cells }));
    }

    const skillsTable = new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 200 },
    });

    sections.push(new Paragraph({ children: [skillsTable] }));
  }

  // Experience section
  if (resume.experience && resume.experience.length > 0) {
    sections.push(createSectionHeading('PROFESSIONAL EXPERIENCE'));

    for (const exp of resume.experience) {
      // Title
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true }),
          ],
        })
      );

      // Company and dates
      const companyLine = [exp.company];
      if (exp.location) companyLine.push(exp.location);
      if (exp.dates) companyLine.push(exp.dates);
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: companyLine.join(' | '), italics: true }),
          ],
        })
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        for (const bullet of exp.bullets) {
          sections.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
            })
          );
        }
      }

      sections.push(new Paragraph({ spacing: { after: 200 } }));
    }
  }

  // Education section
  if (resume.education) {
    sections.push(createSectionHeading('EDUCATION'));
    sections.push(
      new Paragraph({
        text: resume.education,
        spacing: { after: 200 },
      })
    );
  }

  // Certifications section
  if (resume.certifications && resume.certifications.length > 0) {
    sections.push(createSectionHeading('CERTIFICATIONS'));
    for (const cert of resume.certifications) {
      sections.push(
        new Paragraph({
          text: cert,
          bullet: { level: 0 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Create a section heading with underline style
 */
function createSectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 100 },
    border: {
      bottom: {
        color: '666666',
        space: 1,
        size: 6,
        style: BorderStyle.SINGLE,
      },
    },
  });
}

/**
 * Generate a signed URL for downloading a file
 * Valid for 1 hour
 */
export async function getSignedDownloadUrl(
  storagePath: string
): Promise<string> {
  const bucket = storage.bucket(getStorageBucket());
  const file = bucket.file(storagePath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}
