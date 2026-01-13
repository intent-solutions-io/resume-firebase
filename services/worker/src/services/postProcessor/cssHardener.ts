/**
 * CSS Hardener
 * Injects !important CSS rules that cannot be overridden by AI-generated styles
 */

import { getOrCreateStyleElement } from './htmlParser.js';

/**
 * Hardened CSS with !important on all critical layout rules
 * This CSS is injected AFTER AI-generated CSS, so it overrides everything
 */
export const HARDENED_CSS = `
/* ============================================
   HARDENED CSS - Injected by postProcessor
   DO NOT MODIFY - Overrides AI formatting
   ============================================ */

/* ===== HEADER CENTERING (Issue #1) ===== */
.header,
.header-centered,
header,
div[class*="header"] {
  text-align: center !important;
  display: block !important;
  width: 100% !important;
}

.header h1,
.header-centered h1,
header h1 {
  text-align: center !important;
  margin-left: auto !important;
  margin-right: auto !important;
  font-size: 16pt !important;
  font-weight: bold !important;
  text-transform: uppercase !important;
  margin-bottom: 4px !important;
}

.header p,
.header-centered p,
header p,
.contact-info,
.header-info {
  text-align: center !important;
  margin: 2px 0 !important;
}

/* Kill any split/two-column header attempts */
.header-left,
.header-right,
[class*="header-left"],
[class*="header-right"] {
  display: contents !important;
  float: none !important;
  width: auto !important;
  text-align: center !important;
}

/* ===== EDUCATION SPACING (Issue #2) ===== */
.education-entry,
.education,
div[class*="education"] {
  margin-bottom: 8px !important;
}

.education-entry p,
.education p {
  margin-bottom: 0 !important;
  margin-top: 0 !important;
}

.education-entry p + p,
.education p + p {
  margin-top: 2px !important;
}

/* Dates inline with institution */
.education-entry p:first-child,
.education p:first-child {
  display: flex !important;
  justify-content: space-between !important;
  align-items: baseline !important;
}

/* ===== EXPERIENCE LAYOUT (Issue #3) ===== */
.job,
.experience-entry,
div[class*="job"],
div[class*="experience"] {
  margin-bottom: 14px !important;
}

.job-header,
.experience-header,
[class*="job-header"] {
  display: flex !important;
  justify-content: space-between !important;
  align-items: baseline !important;
  margin-bottom: 0 !important;
}

.job-title,
.experience-title,
[class*="job-title"] {
  font-weight: bold !important;
  font-style: italic !important;
  margin-top: 2px !important;
  margin-bottom: 4px !important;
}

/* Dates spacing fix */
.dates,
.job-dates,
span[class*="date"] {
  margin-left: 16px !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

/* ===== SECTION HEADERS ===== */
h2 {
  font-size: 11pt !important;
  font-weight: bold !important;
  text-transform: uppercase !important;
  border-bottom: 1px solid #000 !important;
  margin: 14px 0 8px 0 !important;
  padding-bottom: 3px !important;
}

/* ===== BULLET LISTS ===== */
ul {
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding-left: 20px !important;
}

li {
  margin-bottom: 2px !important;
}

/* ===== SKILLS FORMAT ===== */
.skills p,
[class*="skills"] p {
  margin: 0 !important;
}

/* ===== UNIVERSAL OVERRIDES ===== */
* {
  box-sizing: border-box !important;
}

body {
  font-family: 'Times New Roman', Times, serif !important;
  font-size: 11pt !important;
  line-height: 1.4 !important;
}

/* ===== CROSSWALK DOCUMENT ===== */
.crosswalk-section {
  border: 2px solid #333 !important;
  margin-bottom: 16px !important;
  padding: 12px !important;
  page-break-inside: avoid !important;
}

.crosswalk-section h3 {
  font-size: 12pt !important;
  border-bottom: 1px solid #333 !important;
  padding-bottom: 4px !important;
  margin-bottom: 12px !important;
  text-transform: uppercase !important;
}

.role-translation {
  margin-bottom: 16px !important;
  padding: 8px !important;
  background: #fafafa !important;
}

.translation-row {
  display: flex !important;
  align-items: center !important;
  margin: 6px 0 !important;
  padding: 4px 0 !important;
  border-bottom: 1px dotted #ddd !important;
}

.military-term {
  flex: 1 !important;
  color: #666 !important;
  font-style: italic !important;
}

.arrow {
  margin: 0 16px !important;
  color: #C59141 !important;
  font-weight: bold !important;
}

.civilian-term {
  flex: 1 !important;
  font-weight: bold !important;
  color: #000 !important;
}

.metrics-preserved {
  background: #e8f5e9 !important;
  padding: 8px 12px !important;
  margin-top: 12px !important;
  border-left: 4px solid #38a169 !important;
}

.metrics-preserved ul {
  margin-left: 16px !important;
}

.metrics-preserved li {
  color: #2d6a4f !important;
}
`;

/**
 * Inject hardened CSS into document
 * Appends to existing style element (so it overrides AI CSS)
 */
export function injectHardenedCss(doc: Document): void {
  const style = getOrCreateStyleElement(doc);

  // Check if already injected (idempotent)
  if (style.textContent?.includes('HARDENED CSS')) {
    return;
  }

  // Append hardened CSS at the end (highest priority)
  style.textContent = (style.textContent || '') + HARDENED_CSS;
}
