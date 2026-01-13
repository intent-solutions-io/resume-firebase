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
