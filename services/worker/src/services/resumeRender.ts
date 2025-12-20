// Resume HTML Renderer
// Phase 2.0: Resume Export (PDF/DOCX)
// Converts GeneratedResume JSON to ATS-friendly HTML

import type { GeneratedResume, ResumeExperience } from '../types/candidate.js';

export interface CandidateHeader {
  name: string;
  email: string;
  branch?: string;
  rank?: string;
  mos?: string;
}

/**
 * Render a GeneratedResume to ATS-friendly HTML
 * Pure function: receives data, returns HTML string
 */
export function renderResumeToHtml(
  resume: GeneratedResume,
  candidate: CandidateHeader
): string {
  const sections: string[] = [];

  // Header section
  sections.push(renderHeader(candidate));

  // Summary section
  if (resume.summary) {
    sections.push(renderSection('Professional Summary', `<p>${escapeHtml(resume.summary)}</p>`));
  }

  // Skills section
  if (resume.skills && resume.skills.length > 0) {
    sections.push(renderSection('Skills', renderSkillsList(resume.skills)));
  }

  // Experience section
  if (resume.experience && resume.experience.length > 0) {
    sections.push(renderSection('Professional Experience', renderExperienceList(resume.experience)));
  }

  // Education section
  if (resume.education) {
    sections.push(renderSection('Education', `<p>${escapeHtml(resume.education)}</p>`));
  }

  // Certifications section
  if (resume.certifications && resume.certifications.length > 0) {
    sections.push(renderSection('Certifications', renderCertificationsList(resume.certifications)));
  }

  return wrapInHtmlDocument(sections.join('\n'));
}

/**
 * Render candidate header (name, contact info)
 */
function renderHeader(candidate: CandidateHeader): string {
  const lines: string[] = [];
  lines.push(`<h1>${escapeHtml(candidate.name)}</h1>`);
  lines.push(`<p class="contact">${escapeHtml(candidate.email)}</p>`);

  if (candidate.branch || candidate.rank || candidate.mos) {
    const details: string[] = [];
    if (candidate.branch) details.push(candidate.branch);
    if (candidate.rank) details.push(candidate.rank);
    if (candidate.mos) details.push(`MOS: ${candidate.mos}`);
    lines.push(`<p class="military-info">${escapeHtml(details.join(' | '))}</p>`);
  }

  return `<header>\n${lines.join('\n')}\n</header>`;
}

/**
 * Render a section with title and content
 */
function renderSection(title: string, content: string): string {
  return `
<section>
  <h2>${escapeHtml(title)}</h2>
  ${content}
</section>`;
}

/**
 * Render skills as bullet list
 */
function renderSkillsList(skills: string[]): string {
  const items = skills.map((skill) => `  <li>${escapeHtml(skill)}</li>`).join('\n');
  return `<ul class="skills-list">\n${items}\n</ul>`;
}

/**
 * Render experience entries
 */
function renderExperienceList(experiences: ResumeExperience[]): string {
  return experiences
    .map((exp) => {
      const header = `<h3>${escapeHtml(exp.title)}</h3>`;
      const company = `<p class="company">${escapeHtml(exp.company)}${exp.location ? ` - ${escapeHtml(exp.location)}` : ''}${exp.dates ? ` | ${escapeHtml(exp.dates)}` : ''}</p>`;
      const bullets = exp.bullets && exp.bullets.length > 0
        ? `<ul>\n${exp.bullets.map((b) => `  <li>${escapeHtml(b)}</li>`).join('\n')}\n</ul>`
        : '';
      return `<div class="experience-entry">\n${header}\n${company}\n${bullets}\n</div>`;
    })
    .join('\n');
}

/**
 * Render certifications as bullet list
 */
function renderCertificationsList(certs: string[]): string {
  const items = certs.map((cert) => `  <li>${escapeHtml(cert)}</li>`).join('\n');
  return `<ul>\n${items}\n</ul>`;
}

/**
 * Wrap content in a complete HTML document with ATS-friendly styling
 */
function wrapInHtmlDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background: #fff;
    }
    header {
      text-align: center;
      margin-bottom: 0.5in;
      border-bottom: 1px solid #333;
      padding-bottom: 0.25in;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 0.1in;
    }
    h2 {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #666;
      margin-top: 0.25in;
      margin-bottom: 0.15in;
      padding-bottom: 0.05in;
    }
    h3 {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 0.05in;
    }
    p {
      margin-bottom: 0.1in;
    }
    .contact {
      font-size: 10pt;
    }
    .military-info {
      font-size: 10pt;
      font-style: italic;
    }
    .company {
      font-style: italic;
      font-size: 10pt;
    }
    section {
      margin-bottom: 0.2in;
    }
    ul {
      margin-left: 0.25in;
      margin-bottom: 0.1in;
    }
    li {
      margin-bottom: 0.05in;
    }
    .skills-list {
      column-count: 2;
      column-gap: 0.5in;
    }
    .experience-entry {
      margin-bottom: 0.2in;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
