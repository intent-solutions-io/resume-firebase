/**
 * HTML Parser
 * JSDOM wrapper for parsing and serializing resume HTML
 */

import { JSDOM } from 'jsdom';

/**
 * Parse HTML string into a JSDOM Document
 */
export function parseHtml(html: string): Document {
  const dom = new JSDOM(html);
  return dom.window.document;
}

/**
 * Serialize Document back to HTML string
 */
export function serializeHtml(doc: Document): string {
  // Get the full HTML including doctype if present
  const html = doc.documentElement.outerHTML;

  // Check if original had doctype
  if (doc.doctype) {
    return `<!DOCTYPE ${doc.doctype.name}>\n${html}`;
  }

  return html;
}

/**
 * Safe querySelector that returns null instead of throwing
 */
export function safeQuerySelector(doc: Document, selector: string): Element | null {
  try {
    return doc.querySelector(selector);
  } catch {
    return null;
  }
}

/**
 * Safe querySelectorAll that returns empty array instead of throwing
 */
export function safeQuerySelectorAll(doc: Document, selector: string): Element[] {
  try {
    return Array.from(doc.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Get or create the style element in document head
 */
export function getOrCreateStyleElement(doc: Document): HTMLStyleElement {
  let style = doc.querySelector('style') as HTMLStyleElement | null;

  if (!style) {
    style = doc.createElement('style');
    const head = doc.querySelector('head');
    if (head) {
      head.appendChild(style);
    } else {
      // If no head, prepend to body
      const body = doc.querySelector('body');
      if (body) {
        body.insertBefore(style, body.firstChild);
      }
    }
  }

  return style;
}
