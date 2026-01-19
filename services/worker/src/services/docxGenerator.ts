// DOCX Resume Generator
// Creates Word documents from structured JSON data
// Maintains the same visual template as current HTML/PDF output

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Packer,
} from 'docx';
import type {
  ResumeContent,
  CrosswalkContent,
  StructuredResumeOutput,
} from '../types/resumeData.js';

// =============================================================================
// STYLE CONSTANTS - Match existing template
// =============================================================================

const FONTS = {
  PRIMARY: 'Times New Roman',
  SECONDARY: 'Arial',
};

const SIZES = {
  NAME: 32,           // 16pt = 32 half-points
  CONTACT: 20,        // 10pt
  SECTION_HEADER: 22, // 11pt
  BODY: 22,           // 11pt
  BULLET: 22,         // 11pt
};

const COLORS = {
  BLACK: '000000',
  GOLD: 'C59141',     // Operation Hired gold
  GRAY: '666666',
  GREEN: '38a169',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create centered header with name and contact info
 */
function createHeader(contact: ResumeContent['contact']): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Name (large, bold, centered)
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: contact.name.toUpperCase(),
          bold: true,
          size: SIZES.NAME,
          font: FONTS.PRIMARY,
        }),
      ],
    })
  );

  // Email | Phone
  const contactLine1Parts: string[] = [contact.email];
  if (contact.phone) contactLine1Parts.push(contact.phone);

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: contactLine1Parts.join(' | '),
          size: SIZES.CONTACT,
          font: FONTS.PRIMARY,
        }),
      ],
    })
  );

  // City, State | LinkedIn
  const contactLine2Parts: string[] = [];
  if (contact.city && contact.state) {
    contactLine2Parts.push(`${contact.city}, ${contact.state}`);
  }
  if (contact.linkedin) {
    contactLine2Parts.push(contact.linkedin);
  }

  if (contactLine2Parts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: contactLine2Parts.join(' | '),
            size: SIZES.CONTACT,
            font: FONTS.PRIMARY,
          }),
        ],
      })
    );
  }

  // Border line after header
  paragraphs.push(
    new Paragraph({
      border: {
        bottom: {
          color: COLORS.BLACK,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      spacing: { after: 200 },
    })
  );

  return paragraphs;
}

/**
 * Create section header (e.g., "PROFESSIONAL SUMMARY", "EXPERIENCE")
 */
function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    border: {
      bottom: {
        color: COLORS.BLACK,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: SIZES.SECTION_HEADER,
        font: FONTS.PRIMARY,
      }),
    ],
  });
}

/**
 * Create summary paragraph
 */
function createSummary(summary: string): Paragraph[] {
  return [
    createSectionHeader('Professional Summary'),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: summary,
          size: SIZES.BODY,
          font: FONTS.PRIMARY,
        }),
      ],
    }),
  ];
}

/**
 * Create skills line (pipe-delimited)
 */
function createSkills(skills: string[]): Paragraph[] {
  return [
    createSectionHeader('Core Skills'),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: skills.join(' | '),
          size: SIZES.BODY,
          font: FONTS.PRIMARY,
        }),
      ],
    }),
  ];
}

/**
 * Create experience section
 */
function createExperience(experience: ResumeContent['experience']): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionHeader('Professional Experience')];

  for (const job of experience) {
    // Organization + Location + Dates (same line)
    paragraphs.push(
      new Paragraph({
        spacing: { before: 160, after: 40 },
        children: [
          new TextRun({
            text: `${job.organization}, ${job.location}`,
            bold: true,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
          new TextRun({
            text: `\t${job.startDate} - ${job.endDate}`,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
        ],
        tabStops: [
          {
            type: 'right' as const,
            position: 9360, // Right margin at 6.5"
          },
        ],
      })
    );

    // Job Title (italic)
    paragraphs.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: job.title,
            bold: true,
            italics: true,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
        ],
      })
    );

    // Bullets
    for (const bullet of job.bullets) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: bullet,
              size: SIZES.BULLET,
              font: FONTS.PRIMARY,
            }),
          ],
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Create education section
 */
function createEducation(education: ResumeContent['education']): Paragraph[] {
  if (!education || education.length === 0) return [];

  const paragraphs: Paragraph[] = [createSectionHeader('Education')];

  for (const edu of education) {
    // Institution + Date
    paragraphs.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: edu.institution + (edu.location ? `, ${edu.location}` : ''),
            bold: true,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
          new TextRun({
            text: edu.graduationDate ? `\t${edu.graduationDate}` : '',
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
        ],
        tabStops: [
          {
            type: 'right' as const,
            position: 9360,
          },
        ],
      })
    );

    // Degree
    paragraphs.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: edu.degree + (edu.field ? `, ${edu.field}` : ''),
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

/**
 * Create certifications section
 */
function createCertifications(certs?: ResumeContent['certifications']): Paragraph[] {
  if (!certs || certs.length === 0) return [];

  const paragraphs: Paragraph[] = [createSectionHeader('Certifications & Training')];

  for (const cert of certs) {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: cert.name + (cert.date ? ` (${cert.date})` : ''),
            size: SIZES.BULLET,
            font: FONTS.PRIMARY,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

// =============================================================================
// MAIN GENERATORS
// =============================================================================

/**
 * Generate Military or Civilian Resume DOCX
 */
export function generateResumeDocx(content: ResumeContent): Document {
  const children: Paragraph[] = [
    ...createHeader(content.contact),
    ...createSummary(content.summary),
    ...createSkills(content.skills),
    ...createExperience(content.experience),
    ...createEducation(content.education),
    ...createCertifications(content.certifications),
  ];

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 864,  // 0.6 inch
              bottom: 720, // 0.5 inch
              left: 864,   // 0.6 inch
            },
          },
        },
        children,
      },
    ],
  });
}

/**
 * Generate Crosswalk Document DOCX
 */
export function generateCrosswalkDocx(content: CrosswalkContent): Document {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'MILITARY TO CIVILIAN TRANSLATION GUIDE',
          bold: true,
          size: 28,
          font: FONTS.PRIMARY,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: {
        bottom: { color: COLORS.BLACK, style: BorderStyle.SINGLE, size: 12 },
      },
      children: [
        new TextRun({
          text: content.candidateName,
          size: SIZES.BODY,
          font: FONTS.PRIMARY,
        }),
      ],
    })
  );

  // Experience Translations
  children.push(createSectionHeader('Experience Translations'));

  for (const role of content.roles) {
    // Role header
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        shading: { fill: 'F0F0F0' },
        children: [
          new TextRun({
            text: `${role.roleTitle} - ${role.location}`,
            bold: true,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
        ],
      })
    );

    // Translation pairs
    for (const pair of role.translations) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: pair.military,
              italics: true,
              color: COLORS.GRAY,
              size: SIZES.BODY,
              font: FONTS.PRIMARY,
            }),
            new TextRun({
              text: '  →  ',
              bold: true,
              color: COLORS.GOLD,
              size: SIZES.BODY,
              font: FONTS.PRIMARY,
            }),
            new TextRun({
              text: pair.civilian,
              bold: true,
              size: SIZES.BODY,
              font: FONTS.PRIMARY,
            }),
          ],
        })
      );
    }

    // Metrics preserved
    if (role.metricsPreserved.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: 'Key Metrics Preserved:',
              bold: true,
              color: COLORS.GREEN,
              size: SIZES.BODY,
              font: FONTS.PRIMARY,
            }),
          ],
        })
      );

      for (const metric of role.metricsPreserved) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: metric,
                color: COLORS.GREEN,
                size: SIZES.BULLET,
                font: FONTS.PRIMARY,
              }),
            ],
          })
        );
      }
    }
  }

  // Skills Translations
  children.push(createSectionHeader('Skills Translations'));

  for (const pair of content.skillTranslations) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: pair.military,
            italics: true,
            color: COLORS.GRAY,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
          new TextRun({
            text: '  →  ',
            bold: true,
            color: COLORS.GOLD,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
          new TextRun({
            text: pair.civilian,
            bold: true,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
        ],
      })
    );
  }

  // Acronym Glossary
  children.push(createSectionHeader('Acronym Glossary'));

  for (const item of content.acronymGlossary) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: item.acronym,
            bold: true,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
          new TextRun({
            text: ` - ${item.definition}`,
            size: SIZES.BODY,
            font: FONTS.PRIMARY,
          }),
        ],
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 864,
              bottom: 720,
              left: 864,
            },
          },
        },
        children,
      },
    ],
  });
}

/**
 * Generate all three DOCX files from structured data
 */
export async function generateAllDocx(
  data: StructuredResumeOutput
): Promise<{ military: Buffer; civilian: Buffer; crosswalk: Buffer }> {
  const militaryDoc = generateResumeDocx(data.military);
  const civilianDoc = generateResumeDocx(data.civilian);
  const crosswalkDoc = generateCrosswalkDocx(data.crosswalk);

  const [military, civilian, crosswalk] = await Promise.all([
    Packer.toBuffer(militaryDoc),
    Packer.toBuffer(civilianDoc),
    Packer.toBuffer(crosswalkDoc),
  ]);

  return { military, civilian, crosswalk };
}
