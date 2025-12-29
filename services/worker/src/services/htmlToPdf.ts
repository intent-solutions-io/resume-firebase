// HTML to PDF Converter using Puppeteer
// Phase: Prototype (Checkpoint 1)
// Security: Validates HTML, prevents script injection

import puppeteer from 'puppeteer';

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
  // Security: Validate HTML doesn't contain script tags
  const htmlLower = html.toLowerCase();
  if (htmlLower.includes('<script')) {
    console.error('[htmlToPdf] Security violation: HTML contains script tags');
    throw new Error('Security: HTML contains script tags - rendering blocked');
  }

  // Additional security: Check for javascript: protocol
  if (htmlLower.includes('javascript:')) {
    console.error('[htmlToPdf] Security violation: HTML contains javascript: protocol');
    throw new Error('Security: HTML contains javascript: protocol - rendering blocked');
  }

  // Additional security: Check for onclick/onerror/onload handlers
  const dangerousPatterns = ['onclick=', 'onerror=', 'onload=', 'onmouseover='];
  for (const pattern of dangerousPatterns) {
    if (htmlLower.includes(pattern)) {
      console.error(`[htmlToPdf] Security violation: HTML contains ${pattern}`);
      throw new Error(`Security: HTML contains event handlers - rendering blocked`);
    }
  }

  console.log('[htmlToPdf] HTML security validation passed');

  let browser;
  try {
    // Launch Puppeteer with system Chromium (in Docker container)
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevents memory issues
        '--disable-web-security', // For inline CSS
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for all resources
    await page.setContent(html, {
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
