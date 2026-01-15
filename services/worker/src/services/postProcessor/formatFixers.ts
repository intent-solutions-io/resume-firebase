/**
 * Format Fixers
 * DOM manipulation functions to fix common AI-generated HTML issues
 * Each fixer is idempotent - safe to run multiple times
 */

import { safeQuerySelector, safeQuerySelectorAll } from './htmlParser.js';

// Date pattern: matches "2018 - 2022", "Jan 2020 - Dec 2023", "2018", etc.
const DATE_PATTERN = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\s*(?:19|20)\d{2}\s*[-–—]\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\s*(?:19|20)?\d{2,4}|\b(?:19|20)\d{2}\b|\bPresent\b/gi;

/**
 * Fix 1: Header Centering
 * Ensures header is centered, not split into left/right columns
 */
export function fixHeaderCentering(doc: Document): void {
  // Find header container using multiple possible selectors
  const header = safeQuerySelector(doc, '.header') ||
    safeQuerySelector(doc, 'header') ||
    safeQuerySelector(doc, '[class*="header"]') ||
    safeQuerySelector(doc, 'div:first-child'); // Fallback to first div

  if (!header) return;

  // Check for split layout elements
  const leftEl = safeQuerySelector(doc, '.header-left') ||
    safeQuerySelector(doc, '[class*="header-left"]');
  const rightEl = safeQuerySelector(doc, '.header-right') ||
    safeQuerySelector(doc, '[class*="header-right"]');

  if (leftEl && rightEl) {
    // Merge split layout into centered structure
    const nameEl = leftEl.querySelector('h1');
    const name = nameEl?.textContent?.trim() || leftEl.textContent?.trim() || '';

    const contactParts: string[] = [];
    rightEl.querySelectorAll('p, span, a').forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        contactParts.push(text);
      }
    });

    // Also collect from left side (email might be there)
    leftEl.querySelectorAll('p, span:not(:first-child), a').forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text !== name) {
        contactParts.push(text);
      }
    });

    // Rebuild as centered structure
    header.innerHTML = `
      <h1>${name}</h1>
      <p>${contactParts.join(' | ')}</p>
    `;
  }

  // Force centered styling on header
  (header as HTMLElement).style.textAlign = 'center';
  (header as HTMLElement).style.display = 'block';

  // Center all header children
  const headerH1 = header.querySelector('h1');
  if (headerH1) {
    (headerH1 as HTMLElement).style.textAlign = 'center';
    (headerH1 as HTMLElement).style.marginLeft = 'auto';
    (headerH1 as HTMLElement).style.marginRight = 'auto';
  }

  header.querySelectorAll('p').forEach((p) => {
    (p as HTMLElement).style.textAlign = 'center';
  });

  // Add centered class for CSS hardening to target
  header.classList.add('header-centered');
}

/**
 * Fix 2: Education Spacing
 * - Dates inline with institution (not on separate line)
 * - Minimal spacing between university name and degree
 */
export function fixEducationSpacing(doc: Document): void {
  const educationEntries = safeQuerySelectorAll(doc, '.education-entry') ||
    safeQuerySelectorAll(doc, '.education') ||
    safeQuerySelectorAll(doc, '[class*="education"]');

  // Also try finding education section and getting its children
  if (educationEntries.length === 0) {
    const educationSection = safeQuerySelector(doc, '#education') ||
      safeQuerySelector(doc, '.education-section') ||
      safeQuerySelector(doc, 'h2:contains("Education")');

    if (educationSection) {
      const parent = educationSection.parentElement;
      if (parent) {
        // Get all divs/ps after the education header
        const siblings = Array.from(parent.children);
        const eduIndex = siblings.indexOf(educationSection);
        for (let i = eduIndex + 1; i < siblings.length; i++) {
          const el = siblings[i];
          if (el.tagName === 'H2') break; // Stop at next section
          if (el.tagName === 'DIV' || el.tagName === 'P') {
            educationEntries.push(el);
          }
        }
      }
    }
  }

  educationEntries.forEach((entry) => {
    const paragraphs = entry.querySelectorAll('p');

    if (paragraphs.length >= 1) {
      const firstP = paragraphs[0] as HTMLElement;

      // Check if dates are missing from first paragraph
      const firstText = firstP.textContent || '';
      const hasDate = DATE_PATTERN.test(firstText);

      if (!hasDate && paragraphs.length >= 2) {
        // Look for date in second or subsequent paragraphs
        for (let i = 1; i < paragraphs.length; i++) {
          const p = paragraphs[i] as HTMLElement;
          const text = p.textContent || '';
          const dateMatch = text.match(DATE_PATTERN);

          if (dateMatch) {
            // Check if firstP already has a dates span
            if (!firstP.querySelector('.dates')) {
              // Add date inline with institution
              const dateSpan = doc.createElement('span');
              dateSpan.className = 'dates';
              dateSpan.style.cssText = 'float: right; margin-left: 16px;';
              dateSpan.textContent = dateMatch[0];
              firstP.appendChild(dateSpan);

              // Remove date from original location
              p.textContent = text.replace(DATE_PATTERN, '').trim();

              // If paragraph is now empty, remove it
              if (!p.textContent?.trim()) {
                p.remove();
              }
            }
            break;
          }
        }
      }

      // Remove vertical spacing between school and degree lines
      firstP.style.marginBottom = '0';
      firstP.style.marginTop = '0';

      // Style subsequent paragraphs (degree info)
      for (let i = 1; i < paragraphs.length; i++) {
        const p = paragraphs[i] as HTMLElement;
        p.style.marginTop = '2px';
        p.style.marginBottom = '0';
      }
    }

    // Ensure flex layout for inline dates
    const firstP = entry.querySelector('p:first-child') as HTMLElement;
    if (firstP && firstP.querySelector('.dates')) {
      firstP.style.display = 'flex';
      firstP.style.justifyContent = 'space-between';
      firstP.style.alignItems = 'baseline';
    }
  });
}

/**
 * Fix 3: Experience Layout
 * - Dates have proper spacing from location
 * - Job title is bold (not company/location)
 * - Minimal space between org line and title line
 */
export function fixExperienceLayout(doc: Document): void {
  const jobs = safeQuerySelectorAll(doc, '.job') ||
    safeQuerySelectorAll(doc, '.experience-entry') ||
    safeQuerySelectorAll(doc, '[class*="job"]');

  // Fallback: find experience section children
  if (jobs.length === 0) {
    const expSection = safeQuerySelector(doc, '#experience') ||
      safeQuerySelector(doc, '.experience-section');

    if (expSection) {
      const children = Array.from(expSection.querySelectorAll('div'));
      jobs.push(...children);
    }
  }

  jobs.forEach((job) => {
    // Fix job header (org + location + dates)
    const jobHeader = job.querySelector('.job-header') ||
      job.querySelector('[class*="job-header"]') ||
      job.querySelector('p:first-child');

    if (jobHeader) {
      const headerEl = jobHeader as HTMLElement;

      // Ensure flex layout for proper date spacing
      headerEl.style.display = 'flex';
      headerEl.style.justifyContent = 'space-between';
      headerEl.style.alignItems = 'baseline';
      headerEl.style.marginBottom = '0';

      // Find dates span and ensure spacing
      const datesSpan = jobHeader.querySelector('.dates') ||
        jobHeader.querySelector('[class*="date"]') ||
        jobHeader.querySelector('span:last-child');

      if (datesSpan) {
        (datesSpan as HTMLElement).style.marginLeft = '16px';
        (datesSpan as HTMLElement).style.whiteSpace = 'nowrap';
      }

      // Un-bold the org/location line (it should NOT be bold)
      const strongInHeader = jobHeader.querySelector('strong');
      if (strongInHeader) {
        // Check if this looks like a company/location (not a title)
        const text = strongInHeader.textContent || '';
        const looksLikeLocation = /,\s*[A-Z]{2}\b|U\.S\.|Air Force|Army|Navy|Marine|Coast Guard/i.test(text);

        if (looksLikeLocation) {
          // Replace <strong> with <span>
          const span = doc.createElement('span');
          span.textContent = strongInHeader.textContent;
          strongInHeader.parentNode?.replaceChild(span, strongInHeader);
        }
      }
    }

    // Fix job title - ensure it IS bold
    const jobTitle = job.querySelector('.job-title') ||
      job.querySelector('[class*="title"]') ||
      job.querySelectorAll('p')[1]; // Second paragraph is often the title

    if (jobTitle) {
      const titleEl = jobTitle as HTMLElement;
      titleEl.style.fontWeight = 'bold';
      titleEl.style.fontStyle = 'italic';
      titleEl.style.marginTop = '2px';
      titleEl.style.marginBottom = '4px';
    }

    // Fix bullet list spacing
    const ul = job.querySelector('ul');
    if (ul) {
      (ul as HTMLElement).style.marginTop = '4px';
      (ul as HTMLElement).style.marginBottom = '0';
      (ul as HTMLElement).style.paddingLeft = '20px';
    }
  });
}

/**
 * Fix 4: Skills Format (bonus)
 * Ensures skills are pipe-delimited, not bullets
 */
export function fixSkillsFormat(doc: Document): void {
  const skillsSections = safeQuerySelectorAll(doc, '.skills') ||
    safeQuerySelectorAll(doc, '[class*="skills"]');

  skillsSections.forEach((section) => {
    // If skills are in a <ul>, convert to pipe-delimited
    const ul = section.querySelector('ul');
    if (ul) {
      const skills: string[] = [];
      ul.querySelectorAll('li').forEach((li) => {
        const text = li.textContent?.trim();
        if (text) skills.push(text);
      });

      if (skills.length > 0) {
        const p = doc.createElement('p');
        p.innerHTML = `<strong>CORE SKILLS:</strong> ${skills.join(' | ')}`;
        ul.parentNode?.replaceChild(p, ul);
      }
    }
  });
}

/**
 * Fix 5: Crosswalk Structure
 * Transforms plain-text crosswalk into properly styled HTML with CSS classes
 * This is needed because the AI often outputs plain text instead of HTML structure
 *
 * APPROACH: Walk DOM elements directly, wrap content in styled divs
 */
export function fixCrosswalkStructure(doc: Document): void {
  const body = doc.body;
  if (!body) return;

  // Get ALL text content from body
  const rawText = body.textContent || '';

  // Check if this looks like a crosswalk document
  if (!rawText.includes('TRANSLATION') && !rawText.includes('→')) {
    console.log('[fixCrosswalkStructure] Not a crosswalk document, skipping');
    return;
  }

  console.log('[fixCrosswalkStructure] Processing crosswalk document...');

  // Extract the header (name and contact info) before we process - preserve it
  const headerEl = body.querySelector('.header') || body.querySelector('header');
  const headerHtml = headerEl ? headerEl.outerHTML : '';

  // Get all paragraph and heading elements
  const elements = Array.from(body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span'));
  console.log('[fixCrosswalkStructure] Found', elements.length, 'DOM elements');

  // Extract text from each element into lines
  let lines: string[] = [];
  for (const el of elements) {
    const text = (el.textContent || '').trim();
    if (text && !lines.includes(text)) {  // Dedupe
      lines.push(text);
    }
  }

  // Fallback: if no elements found, try splitting rawText by common delimiters
  if (lines.length < 5) {
    console.log('[fixCrosswalkStructure] Few elements found, using rawText fallback');
    // Try to split by sentence boundaries or paragraph-like breaks
    const rawLines = rawText
      .replace(/([.!?])\s+([A-Z])/g, '$1\n$2')  // Split on sentence boundaries
      .replace(/→\s+/g, '→\n')  // Split after arrows
      .replace(/\s{2,}/g, '\n')  // Multiple spaces to newlines
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 3);

    if (rawLines.length > lines.length) {
      lines = rawLines;
      console.log('[fixCrosswalkStructure] Using', lines.length, 'lines from rawText');
    }
  }

  console.log('[fixCrosswalkStructure] Total lines to process:', lines.length);
  if (lines.length > 0) {
    console.log('[fixCrosswalkStructure] First 3 lines:', lines.slice(0, 3))
  }

  // Build new HTML structure
  const sections: string[] = [];
  let currentSection: { type: string; header: string; content: string[] } | null = null;
  let currentRole: { name: string; translations: string[]; metrics: string[] } | null = null;
  let inMetrics = false;

  // Helper to close current role
  const closeRole = () => {
    if (currentRole && currentSection) {
      let roleHtml = `<div class="role-translation"><h4>${escapeHtml(currentRole.name)}</h4>`;

      for (const trans of currentRole.translations) {
        const parts = trans.split('→').map(s => s.trim());
        if (parts.length === 2 && parts[0] && parts[1]) {
          roleHtml += `<div class="translation-row">
            <span class="military-term">${escapeHtml(parts[0])}</span>
            <span class="arrow">→</span>
            <span class="civilian-term">${escapeHtml(parts[1])}</span>
          </div>`;
        }
      }

      if (currentRole.metrics.length > 0) {
        roleHtml += `<div class="metrics-preserved"><strong>✓ Key Metrics Preserved:</strong><ul>`;
        for (const metric of currentRole.metrics) {
          roleHtml += `<li>${escapeHtml(metric)}</li>`;
        }
        roleHtml += `</ul></div>`;
      }

      roleHtml += `</div>`;
      currentSection.content.push(roleHtml);
    }
    currentRole = null;
    inMetrics = false;
  };

  // Helper to close current section
  const closeSection = () => {
    closeRole();
    if (currentSection) {
      let sectionHtml = `<div class="crosswalk-section"><h3>${escapeHtml(currentSection.header)}</h3>`;
      sectionHtml += currentSection.content.join('');
      sectionHtml += `</div>`;
      sections.push(sectionHtml);
    }
    currentSection = null;
  };

  for (const line of lines) {
    // Skip header info (name, contact - we preserve it separately)
    if (line.includes('@') && line.includes('.')) continue; // Email
    if (/^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/.test(line)) continue; // Phone
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(line) && !line.includes('→')) continue; // Name

    // Detect section headers
    if (line.includes('EXPERIENCE TRANSLATION') || line === 'EXPERIENCE TRANSLATIONS') {
      closeSection();
      currentSection = { type: 'experience', header: 'EXPERIENCE TRANSLATIONS', content: [] };
      console.log('[fixCrosswalkStructure] Found EXPERIENCE section');
      continue;
    }

    if (line.includes('SKILLS TRANSLATION') || line === 'SKILLS TRANSLATIONS') {
      closeSection();
      currentSection = { type: 'skills', header: 'SKILLS TRANSLATIONS', content: [] };
      console.log('[fixCrosswalkStructure] Found SKILLS section');
      continue;
    }

    if (line.includes('ACRONYM GLOSSARY') || line === 'ACRONYM GLOSSARY') {
      closeSection();
      currentSection = { type: 'acronyms', header: 'ACRONYM GLOSSARY', content: [] };
      console.log('[fixCrosswalkStructure] Found ACRONYM section');
      continue;
    }

    // Detect role headers (for experience section)
    if (currentSection?.type === 'experience') {
      // Role header patterns:
      // - "Role: Title at Location"
      // - "Title at Location" (e.g., "Learning and Development Analyst at San Antonio, TX")
      // - "Title: Location"
      const isRoleHeader =
        line.startsWith('Role:') ||
        line.startsWith('Role ') ||
        (line.includes(' at ') && !line.includes('→')) ||  // "Title at Location"
        (line.includes(':') && !line.includes('→') && line.length < 100);

      if (isRoleHeader) {
        closeRole();
        const roleName = line
          .replace(/^Role[:\s]+/i, '')
          .replace(/:$/, '')
          .trim();
        if (roleName) {
          currentRole = { name: roleName, translations: [], metrics: [] };
          console.log('[fixCrosswalkStructure] Found role:', roleName);
        }
        continue;
      }
    }

    // Detect metrics section
    if (line.toLowerCase().includes('metrics preserved') || line.toLowerCase().includes('key metrics')) {
      inMetrics = true;
      continue;
    }

    // Handle translation rows (lines with →)
    if (line.includes('→')) {
      inMetrics = false; // Translation row ends metrics section

      if (currentRole) {
        currentRole.translations.push(line);
      } else if (currentSection) {
        // Direct translation without role wrapper (for skills section)
        const parts = line.split('→').map(s => s.trim());
        if (parts.length === 2 && parts[0] && parts[1]) {
          currentSection.content.push(`<div class="translation-row">
            <span class="military-term">${escapeHtml(parts[0])}</span>
            <span class="arrow">→</span>
            <span class="civilian-term">${escapeHtml(parts[1])}</span>
          </div>`);
        }
      }
      continue;
    }

    // Handle metrics lines (bullet points or plain text after "metrics preserved")
    if (inMetrics && currentRole) {
      const metricText = line.replace(/^[•\-\*\✓]\s*/, '').trim();
      if (metricText && metricText.length > 5) {
        currentRole.metrics.push(metricText);
      }
      continue;
    }

    // Handle acronym glossary entries
    if (currentSection?.type === 'acronyms') {
      // Parse patterns:
      // - "ABC - Full Name" (with dash/colon)
      // - "ABC Full Name" (space only, e.g., "AI Artificial Intelligence")
      const dashMatch = line.match(/^([A-Z]{2,})\s*[-–:]\s*(.+)$/);
      if (dashMatch) {
        currentSection.content.push(`<div class="acronym-entry">
          <dt>${escapeHtml(dashMatch[1])}</dt>
          <dd>${escapeHtml(dashMatch[2])}</dd>
        </div>`);
      } else {
        // Try space-separated: "ABC Full Description Here"
        const spaceMatch = line.match(/^([A-Z]{2,})\s+(.+)$/);
        if (spaceMatch) {
          currentSection.content.push(`<div class="acronym-entry">
            <dt>${escapeHtml(spaceMatch[1])}</dt>
            <dd>${escapeHtml(spaceMatch[2])}</dd>
          </div>`);
        }
      }
      continue;
    }
  }

  // Close any remaining open structures
  closeSection();

  // Only rebuild if we found crosswalk sections
  if (sections.length === 0) {
    console.log('[fixCrosswalkStructure] No sections found, aborting');
    return;
  }

  console.log('[fixCrosswalkStructure] Built', sections.length, 'sections');

  // Build complete new body HTML
  let newBodyHtml = '';

  // Add header if we found one
  if (headerHtml) {
    newBodyHtml += headerHtml;
  }

  // Add all crosswalk sections
  newBodyHtml += sections.join('\n');

  // Replace body content
  body.innerHTML = newBodyHtml;

  // Inject crosswalk-specific CSS
  let styleEl = doc.querySelector('style');
  if (!styleEl) {
    styleEl = doc.createElement('style');
    doc.head?.appendChild(styleEl);
  }

  const crosswalkCss = `
    /* Crosswalk Document Styles */
    body { font-family: 'Roboto', Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333; max-width: 8.5in; margin: 0 auto; padding: 0.5in; }

    .header, header { text-align: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #C59141; }
    .header h1, header h1 { font-size: 18pt; margin: 0 0 8px 0; color: #1a1a1a; }
    .header p, header p { margin: 4px 0; color: #555; }

    .crosswalk-section {
      border: 2px solid #333;
      margin-bottom: 20px;
      page-break-inside: avoid;
      border-radius: 4px;
      overflow: hidden;
    }

    .crosswalk-section h3 {
      font-size: 11pt;
      text-transform: uppercase;
      background: linear-gradient(135deg, #1a1a1a, #333);
      color: white;
      padding: 10px 14px;
      margin: 0;
      letter-spacing: 1px;
    }

    .role-translation {
      margin: 0;
      padding: 14px;
      background: #fafafa;
      border-bottom: 1px solid #eee;
    }
    .role-translation:last-child { border-bottom: none; }

    .role-translation h4 {
      font-size: 10pt;
      margin: 0 0 12px 0;
      color: #1a1a1a;
      border-bottom: 2px solid #C59141;
      padding-bottom: 6px;
      font-weight: bold;
    }

    .translation-row {
      display: flex;
      align-items: center;
      margin: 8px 0;
      padding: 8px 10px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .military-term {
      flex: 1;
      color: #666;
      font-style: italic;
      padding-right: 12px;
    }

    .arrow {
      width: 50px;
      text-align: center;
      color: #C59141;
      font-weight: bold;
      font-size: 14pt;
    }

    .civilian-term {
      flex: 1;
      font-weight: bold;
      color: #1a1a1a;
      padding-left: 12px;
    }

    .metrics-preserved {
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
      padding: 12px 16px;
      margin-top: 14px;
      border-left: 4px solid #38a169;
      border-radius: 0 6px 6px 0;
    }
    .metrics-preserved strong {
      display: block;
      margin-bottom: 8px;
      color: #2d6a4f;
      font-size: 9pt;
    }
    .metrics-preserved ul {
      margin: 0 0 0 20px;
      padding: 0;
    }
    .metrics-preserved li {
      color: #2d6a4f;
      margin-bottom: 4px;
      font-size: 9pt;
    }

    .acronym-entry {
      display: flex;
      padding: 6px 14px;
      border-bottom: 1px dotted #ddd;
    }
    .acronym-entry:last-child { border-bottom: none; }
    .acronym-entry dt {
      font-weight: bold;
      width: 80px;
      color: #C59141;
    }
    .acronym-entry dd {
      margin: 0;
      flex: 1;
      color: #333;
    }
  `;

  // Add CSS if not already present
  if (!styleEl.textContent?.includes('.crosswalk-section')) {
    styleEl.textContent = crosswalkCss + (styleEl.textContent || '');
  }

  console.log('[fixCrosswalkStructure] Complete - body HTML rebuilt');
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
