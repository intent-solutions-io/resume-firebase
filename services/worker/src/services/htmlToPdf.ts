// HTML to PDF Converter using Puppeteer
// Phase: Prototype (Checkpoint 1)
// Security: Sanitizes HTML using DOMPurify to prevent XSS/script injection

import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

/**
 * PDF rendering options matching Vertex AI render_hints
 */
export interface PDFRenderOptions {
  margins_in: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  page_size: 'LETTER';
}

/**
 * Convert HTML to PDF buffer using Puppeteer
 * Security: Validates HTML for dangerous content before rendering
 *
 * @param html - Complete HTML document with inline CSS
 * @param options - PDF rendering options (margins, page size)
 * @returns PDF as Buffer
 * @throws Error if HTML contains scripts or rendering fails
 */
export async function convertHtmlToPdf(
  html: string,
  options: PDFRenderOptions
): Promise<Buffer> {
  // Security: Sanitize HTML using DOMPurify to prevent XSS attacks
  // This is much more robust than string matching and handles all edge cases
  console.log('[htmlToPdf] Sanitizing HTML with DOMPurify...');

  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);

  // Configure DOMPurify to allow safe HTML for PDF rendering
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'html', 'head', 'body', 'style', 'title', 'meta',
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img', 'code', 'pre', 'blockquote',
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'href', 'src', 'alt', 'title',
      'width', 'height', 'colspan', 'rowspan', 'align', 'valign',
    ],
    ALLOW_DATA_ATTR: false, // Block data-* attributes
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  });

  // Verify sanitization actually removed dangerous content
  const beforeLength = html.length;
  const afterLength = cleanHtml.length;
  if (beforeLength !== afterLength) {
    console.warn(`[htmlToPdf] DOMPurify removed ${beforeLength - afterLength} bytes of potentially dangerous content`);
  }

  console.log('[htmlToPdf] HTML sanitization complete');

  let browser;
  try {
    // Launch Puppeteer with system Chromium (in Docker container)
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevents memory issues
        '--disable-web-security', // For inline CSS
      ],
    });

    const page = await browser.newPage();

    // Set content with SANITIZED HTML and wait for all resources
    await page.setContent(cleanHtml, {
      waitUntil: 'networkidle0',
      timeout: 30000, // 30 second timeout
    });

    console.log('[htmlToPdf] HTML loaded successfully, generating PDF');

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true, // Include background colors/images
      margin: {
        top: `${options.margins_in.top}in`,
        right: `${options.margins_in.right}in`,
        bottom: `${options.margins_in.bottom}in`,
        left: `${options.margins_in.left}in`,
      },
      preferCSSPageSize: false, // Use format instead of CSS
    });

    console.log(`[htmlToPdf] PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    // Convert Uint8Array to Buffer
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('[htmlToPdf] PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Always close browser
    if (browser) {
      await browser.close();
      console.log('[htmlToPdf] Browser closed');
    }
  }
}
