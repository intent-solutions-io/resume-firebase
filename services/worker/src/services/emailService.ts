// Email Service - SendGrid Integration
// Sends resume PDFs to candidates via email

import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@operationhired.com';
const FROM_NAME = process.env.FROM_NAME || 'Operation Hired';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('[emailService] SENDGRID_API_KEY not set - email sending disabled');
}

export interface SendResumeEmailParams {
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  militaryPdfUrl?: string;
  civilianPdfUrl?: string;
  crosswalkPdfUrl?: string;
  zipUrl?: string;
}

/**
 * Send resume ready email to candidate
 */
export async function sendResumeEmail(params: SendResumeEmailParams): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('[emailService] Skipping email - SENDGRID_API_KEY not configured');
    return;
  }

  const {
    candidateEmail,
    candidateName,
    militaryPdfUrl,
    civilianPdfUrl,
    crosswalkPdfUrl,
    zipUrl,
  } = params;

  // Build download links
  const downloadLinks: string[] = [];
  if (civilianPdfUrl) {
    downloadLinks.push(`<li><a href="${civilianPdfUrl}">Civilian Resume (PDF)</a></li>`);
  }
  if (militaryPdfUrl) {
    downloadLinks.push(`<li><a href="${militaryPdfUrl}">Military Resume (PDF)</a></li>`);
  }
  if (crosswalkPdfUrl) {
    downloadLinks.push(`<li><a href="${crosswalkPdfUrl}">Translation Crosswalk (PDF)</a></li>`);
  }
  if (zipUrl) {
    downloadLinks.push(`<li><a href="${zipUrl}">Download All (ZIP)</a></li>`);
  }

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Resume is Ready!</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #C59141;
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .download-section {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 2px solid #C59141;
    }
    .download-section h2 {
      color: #C59141;
      margin-top: 0;
    }
    .download-section ul {
      list-style: none;
      padding: 0;
    }
    .download-section li {
      margin: 10px 0;
    }
    .download-section a {
      display: inline-block;
      padding: 12px 24px;
      background-color: #C59141;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .download-section a:hover {
      background-color: #a57833;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Your Resume is Ready!</h1>
  </div>
  <div class="content">
    <p>Hi ${candidateName},</p>

    <p>Great news! Your military-to-civilian resume package has been successfully generated and is ready for download.</p>

    <div class="download-section">
      <h2>📥 Download Your Resumes</h2>
      <ul>
        ${downloadLinks.join('\n        ')}
      </ul>
    </div>

    <p><strong>What's included:</strong></p>
    <ul>
      <li><strong>Civilian Resume</strong> - ATS-optimized resume with military experience translated to civilian language</li>
      <li><strong>Military Resume</strong> - Traditional military format resume</li>
      <li><strong>Translation Crosswalk</strong> - Side-by-side comparison showing how your military experience translates to civilian terms</li>
    </ul>

    <p><strong>Next Steps:</strong></p>
    <ol>
      <li>Download your resumes using the links above</li>
      <li>Review the content and customize as needed</li>
      <li>Use the Civilian Resume for job applications</li>
      <li>Reference the Crosswalk when preparing for interviews</li>
    </ol>

    <p>Good luck with your civilian career transition!</p>

    <p>Best regards,<br>
    <strong>The Operation Hired Team</strong></p>
  </div>

  <div class="footer">
    <p>This is an automated email from Operation Hired.<br>
    If you have questions, please contact support.</p>
  </div>
</body>
</html>
  `;

  const emailText = `
Hi ${candidateName},

Your military-to-civilian resume package is ready!

Download Your Resumes:
${civilianPdfUrl ? `- Civilian Resume: ${civilianPdfUrl}` : ''}
${militaryPdfUrl ? `- Military Resume: ${militaryPdfUrl}` : ''}
${crosswalkPdfUrl ? `- Translation Crosswalk: ${crosswalkPdfUrl}` : ''}
${zipUrl ? `- Download All (ZIP): ${zipUrl}` : ''}

What's included:
- Civilian Resume - ATS-optimized with military experience translated
- Military Resume - Traditional military format
- Translation Crosswalk - Side-by-side comparison

Next Steps:
1. Download your resumes
2. Review and customize as needed
3. Use the Civilian Resume for job applications
4. Reference the Crosswalk for interview prep

Good luck with your civilian career transition!

Best regards,
The Operation Hired Team
  `;

  const msg = {
    to: candidateEmail,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: '🎉 Your Resume is Ready - Operation Hired',
    text: emailText,
    html: emailHtml,
  };

  try {
    await sgMail.send(msg);
    console.log(`[emailService] Resume email sent successfully to: ${candidateEmail}`);
  } catch (error) {
    console.error('[emailService] Failed to send email:', error);
    throw error;
  }
}
