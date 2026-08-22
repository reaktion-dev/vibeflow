import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
  Packer,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import { WordDocModel, DocSection, OFFICE_THEMES } from '../types';

/**
 * Generates a studio-grade, beautifully formatted Microsoft Word (.docx) buffer
 * from a structured WordDocModel AST.
 */
export async function generateDocxBuffer(model: WordDocModel): Promise<Buffer> {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['corporate-navy'];
  const primaryHex = theme.primary.replace('#', '');
  const secondaryHex = theme.secondary.replace('#', '');
  const bgLightHex = theme.bgLight.replace('#', '');
  const borderHex = theme.border.replace('#', '');

  const docChildren: (Paragraph | Table)[] = [];

  // 1. Cover Page (Optional)
  if (model.hasCoverPage) {
    docChildren.push(
      new Paragraph({
        spacing: { before: 2400, after: 400 },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: 'EXECUTIVE DOCUMENT',
            size: 20, // 10pt
            bold: true,
            color: secondaryHex,
            allCaps: true,
            font: 'Arial',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 200, after: 400 },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: model.title,
            size: 56, // 28pt
            bold: true,
            color: primaryHex,
            font: 'Arial',
          }),
        ],
      })
    );

    if (model.subtitle) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 200, after: 800 },
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: model.subtitle,
              size: 28, // 14pt
              color: '475569',
              font: 'Arial',
            }),
          ],
        })
      );
    }

    // Metadata Card
    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: bgLightHex },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: { style: BorderStyle.SINGLE, size: 24, color: primaryHex },
                },
                margins: { top: 200, bottom: 200, left: 300, right: 300 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'AUTHOR: ', bold: true, size: 18, color: '64748B' }),
                      new TextRun({ text: model.author || 'Autonomous Agent Studio', size: 18, bold: true, color: primaryHex }),
                      new TextRun({ text: '   |   DATE: ', bold: true, size: 18, color: '64748B' }),
                      new TextRun({ text: model.date || new Date().toLocaleDateString(), size: 18, color: primaryHex }),
                    ],
                  }),
                  ...(model.organization
                    ? [
                        new Paragraph({
                          spacing: { before: 100 },
                          children: [
                            new TextRun({ text: 'ORGANIZATION: ', bold: true, size: 18, color: '64748B' }),
                            new TextRun({ text: model.organization, size: 18, color: '334155' }),
                          ],
                        }),
                      ]
                    : []),
                ],
              }),
            ],
          }),
        ],
      }),
      // Page Break after Cover
      new Paragraph({
        pageBreakBefore: true,
        children: [],
      })
    );
  }

  // 2. Render Sections
  for (const section of model.sections) {
    const rendered = renderDocSection(section, { primaryHex, secondaryHex, bgLightHex, borderHex });
    if (Array.isArray(rendered)) {
      docChildren.push(...rendered);
    } else {
      docChildren.push(rendered);
    }
  }

  // 3. Assemble Document with Header/Footer & Page Settings
  const isA4 = model.pageSize === 'a4';
  const isLandscape = model.orientation === 'landscape';
  const isStrict1Page = model.pageFit === 'strict-1-page';

  // Page dimensions in DXA
  // Letter: 12240 x 15840 | A4: 11906 x 16838
  const baseWidth = isA4 ? 11906 : 12240;
  const baseHeight = isA4 ? 16838 : 15840;

  const pageWidth = isLandscape ? baseHeight : baseWidth;
  const pageHeight = isLandscape ? baseWidth : baseHeight;

  // Margins: 0.5" (720 dxa) for strict-1-page / resumes; 1.0" (1440 dxa) for standard docs
  const marginSize = isStrict1Page ? 720 : 1440;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidth,
              height: pageHeight,
            },
            margin: {
              top: marginSize,
              bottom: marginSize,
              left: marginSize,
              right: marginSize,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: model.title,
                    size: 16,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.SPACE_BETWEEN,
                children: [
                  new TextRun({
                    text: 'CONFIDENTIAL — ' + (model.organization || 'Vibeflow Platform'),
                    size: 16,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: 'Page ',
                    size: 16,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: docChildren,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

function renderDocSection(
  section: DocSection,
  colors: { primaryHex: string; secondaryHex: string; bgLightHex: string; borderHex: string }
): Paragraph | Table | (Paragraph | Table)[] {
  switch (section.type) {
    case 'heading': {
      const headingLevel =
        section.level === 1
          ? HeadingLevel.HEADING_1
          : section.level === 2
          ? HeadingLevel.HEADING_2
          : section.level === 3
          ? HeadingLevel.HEADING_3
          : HeadingLevel.HEADING_4;

      const size = section.level === 1 ? 40 : section.level === 2 ? 32 : section.level === 3 ? 26 : 22;
      const color = section.level === 1 ? colors.primaryHex : colors.secondaryHex;

      return new Paragraph({
        heading: headingLevel,
        spacing: { before: section.level === 1 ? 480 : 360, after: 180 },
        children: [
          new TextRun({
            text: section.text,
            size,
            bold: true,
            color,
            font: 'Arial',
          }),
        ],
      });
    }

    case 'paragraph': {
      return new Paragraph({
        spacing: { before: 120, after: 200, line: 320 },
        children: [
          new TextRun({
            text: section.text,
            size: section.lead ? 24 : 22,
            color: section.lead ? '1E293B' : '334155',
            font: 'Arial',
          }),
        ],
      });
    }

    case 'callout': {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: colors.bgLightHex },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: { style: BorderStyle.SINGLE, size: 30, color: colors.secondaryHex },
                },
                margins: { top: 180, bottom: 180, left: 240, right: 240 },
                children: [
                  ...(section.title
                    ? [
                        new Paragraph({
                          spacing: { after: 100 },
                          children: [
                            new TextRun({
                              text: section.title.toUpperCase(),
                              bold: true,
                              size: 18,
                              color: colors.secondaryHex,
                              font: 'Arial',
                            }),
                          ],
                        }),
                      ]
                    : []),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: section.text,
                        size: 20,
                        color: '1E293B',
                        font: 'Arial',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    case 'stat-grid': {
      const cells = section.stats.map(
        (stat) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: colors.bgLightHex },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: colors.borderHex },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: colors.borderHex },
              left: { style: BorderStyle.SINGLE, size: 8, color: colors.borderHex },
              right: { style: BorderStyle.SINGLE, size: 8, color: colors.borderHex },
            },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: stat.value,
                    bold: true,
                    size: 40,
                    color: colors.primaryHex,
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: stat.label.toUpperCase(),
                    bold: true,
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
              ...(stat.description
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 60 },
                      children: [
                        new TextRun({
                          text: stat.description,
                          size: 16,
                          color: '475569',
                          font: 'Arial',
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          })
      );

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: cells })],
      });
    }

    case 'table': {
      const headerRow = new TableRow({
        tableHeader: true,
        children: section.headers.map(
          (h) =>
            new TableCell({
              shading: { type: ShadingType.SOLID, color: colors.primaryHex },
              margins: { top: 160, bottom: 160, left: 160, right: 160 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: h,
                      bold: true,
                      size: 20,
                      color: 'FFFFFF',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            })
        ),
      });

      const bodyRows = section.rows.map((row, rIdx) => {
        const isZebra = rIdx % 2 === 1;
        return new TableRow({
          children: row.map(
            (cellText) =>
              new TableCell({
                shading: isZebra ? { type: ShadingType.SOLID, color: colors.bgLightHex } : undefined,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: colors.borderHex },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: colors.borderHex },
                  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cellText,
                        size: 20,
                        color: '334155',
                        font: 'Arial',
                      }),
                    ],
                  }),
                ],
              })
          ),
        });
      });

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...bodyRows],
      });
    }

    case 'bullet-list':
    case 'numbered-list': {
      return section.items.map(
        (item, idx) =>
          new Paragraph({
            spacing: { before: 60, after: 60 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `${section.type === 'numbered-list' ? `${idx + 1}. ` : ''}${item}`,
                size: 22,
                color: '334155',
                font: 'Arial',
              }),
            ],
          })
      );
    }

    case 'divider': {
      return new Paragraph({
        spacing: { before: 240, after: 240 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 8, color: colors.borderHex },
        },
        children: [],
      });
    }
  }
}
