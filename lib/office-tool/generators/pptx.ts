import pptxgen from 'pptxgenjs';
import { PresentationModel, SlideModel, OFFICE_THEMES } from '../types';

/**
 * Generates a modern, widescreen 16:9 PowerPoint (.pptx) presentation deck
 * from a structured PresentationModel AST.
 */
export async function generatePptxBuffer(model: PresentationModel): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = model.author || 'Vibeflow Autonomous Agent Studio';
  pptx.title = model.title;

  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['corporate-navy'];
  const primaryHex = theme.primary.replace('#', '');
  const secondaryHex = theme.secondary.replace('#', '');
  const accentHex = theme.accent.replace('#', '');
  const bgLightHex = theme.bgLight.replace('#', '');
  const borderHex = theme.border.replace('#', '');

  for (const slideData of model.slides) {
    const slide = pptx.addSlide();

    // Set Slide Background
    slide.background = { color: slideData.layout === 'title' ? primaryHex : bgLightHex };

    switch (slideData.layout) {
      case 'title': {
        // Accent Top Line
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.5,
          w: 1.2,
          h: 0.08,
          fill: { color: accentHex },
        });

        // Badge
        if (slideData.badge) {
          slide.addText(slideData.badge.toUpperCase(), {
            x: 0.8,
            y: 1.8,
            w: 8.0,
            h: 0.3,
            fontSize: 12,
            bold: true,
            color: accentHex,
            fontFace: 'Arial',
          });
        }

        // Title
        slide.addText(slideData.title, {
          x: 0.8,
          y: 2.3,
          w: 11.0,
          h: 1.8,
          fontSize: 40,
          bold: true,
          color: 'FFFFFF',
          fontFace: 'Arial',
        });

        // Subtitle
        if (slideData.subtitle) {
          slide.addText(slideData.subtitle, {
            x: 0.8,
            y: 4.3,
            w: 11.0,
            h: 1.0,
            fontSize: 20,
            color: 'CBD5E1',
            fontFace: 'Arial',
          });
        }

        // Metadata
        slide.addText(`PRESENTED BY: ${model.author || 'Vibeflow'}   |   ${new Date().toLocaleDateString()}`, {
          x: 0.8,
          y: 6.2,
          w: 10.0,
          h: 0.4,
          fontSize: 11,
          color: '94A3B8',
          fontFace: 'Arial',
        });
        break;
      }

      case 'stats': {
        renderSlideHeader(slide, slideData, primaryHex, secondaryHex);

        const stats = slideData.stats || [];
        const count = Math.min(stats.length, 4);
        const cardWidth = 2.4;
        const gap = 0.3;
        const startX = (13.33 - (count * cardWidth + (count - 1) * gap)) / 2;

        stats.slice(0, 4).forEach((stat, idx) => {
          const x = startX + idx * (cardWidth + gap);
          const y = 2.4;

          // Card Background
          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y,
            w: cardWidth,
            h: 3.8,
            rectRadius: 0.15,
            fill: { color: 'FFFFFF' },
            line: { color: borderHex, width: 1.5 },
          });

          // Stat Value
          slide.addText(stat.value, {
            x,
            y: y + 0.6,
            w: cardWidth,
            h: 1.0,
            fontSize: 36,
            bold: true,
            color: primaryHex,
            align: 'center',
            fontFace: 'Arial',
          });

          // Stat Label
          slide.addText(stat.label.toUpperCase(), {
            x: x + 0.15,
            y: y + 1.8,
            w: cardWidth - 0.3,
            h: 0.6,
            fontSize: 12,
            bold: true,
            color: secondaryHex,
            align: 'center',
            fontFace: 'Arial',
          });

          // Note
          if (stat.note) {
            slide.addText(stat.note, {
              x: x + 0.15,
              y: y + 2.5,
              w: cardWidth - 0.3,
              h: 0.9,
              fontSize: 10,
              color: '64748B',
              align: 'center',
              fontFace: 'Arial',
            });
          }
        });
        break;
      }

      case 'cards': {
        renderSlideHeader(slide, slideData, primaryHex, secondaryHex);

        const cards = slideData.cards || [];
        const cardWidth = 3.6;
        const startX = 0.8;

        cards.slice(0, 3).forEach((card, idx) => {
          const x = startX + idx * (cardWidth + 0.35);
          const y = 2.2;

          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y,
            w: cardWidth,
            h: 4.2,
            rectRadius: 0.12,
            fill: { color: 'FFFFFF' },
            line: { color: borderHex, width: 1.5 },
          });

          if (card.tag) {
            slide.addText(card.tag.toUpperCase(), {
              x: x + 0.3,
              y: y + 0.3,
              w: cardWidth - 0.6,
              h: 0.3,
              fontSize: 10,
              bold: true,
              color: secondaryHex,
              fontFace: 'Arial',
            });
          }

          slide.addText(card.title, {
            x: x + 0.3,
            y: y + 0.7,
            w: cardWidth - 0.6,
            h: 0.8,
            fontSize: 18,
            bold: true,
            color: primaryHex,
            fontFace: 'Arial',
          });

          slide.addText(card.body, {
            x: x + 0.3,
            y: y + 1.6,
            w: cardWidth - 0.6,
            h: 2.2,
            fontSize: 12,
            color: '475569',
            fontFace: 'Arial',
          });
        });
        break;
      }

      case 'two-column': {
        renderSlideHeader(slide, slideData, primaryHex, secondaryHex);

        const colWidth = 5.6;

        // Left Column Card
        if (slideData.leftColumn) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 2.2,
            w: colWidth,
            h: 4.4,
            rectRadius: 0.12,
            fill: { color: 'FFFFFF' },
            line: { color: borderHex, width: 1.5 },
          });

          slide.addText(slideData.leftColumn.title, {
            x: 1.1,
            y: 2.5,
            w: colWidth - 0.6,
            h: 0.6,
            fontSize: 20,
            bold: true,
            color: primaryHex,
            fontFace: 'Arial',
          });

          const leftBullets = slideData.leftColumn.bullets.map((b) => ({
            text: b,
            options: { fontSize: 13, color: '334155', bullet: true, spacing: { after: 12 } },
          }));

          slide.addText(leftBullets as any, {
            x: 1.1,
            y: 3.3,
            w: colWidth - 0.6,
            h: 3.0,
            fontFace: 'Arial',
          });
        }

        // Right Column Card
        if (slideData.rightColumn) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 6.9,
            y: 2.2,
            w: colWidth,
            h: 4.4,
            rectRadius: 0.12,
            fill: { color: 'FFFFFF' },
            line: { color: borderHex, width: 1.5 },
          });

          slide.addText(slideData.rightColumn.title, {
            x: 7.2,
            y: 2.5,
            w: colWidth - 0.6,
            h: 0.6,
            fontSize: 20,
            bold: true,
            color: secondaryHex,
            fontFace: 'Arial',
          });

          const rightBullets = slideData.rightColumn.bullets.map((b) => ({
            text: b,
            options: { fontSize: 13, color: '334155', bullet: true, spacing: { after: 12 } },
          }));

          slide.addText(rightBullets as any, {
            x: 7.2,
            y: 3.3,
            w: colWidth - 0.6,
            h: 3.0,
            fontFace: 'Arial',
          });
        }
        break;
      }

      default: {
        renderSlideHeader(slide, slideData, primaryHex, secondaryHex);
        if (slideData.subtitle) {
          slide.addText(slideData.subtitle, {
            x: 0.8,
            y: 2.2,
            w: 11.5,
            h: 4.0,
            fontSize: 14,
            color: '334155',
            fontFace: 'Arial',
          });
        }
        break;
      }
    }

    if (slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }
  }

  const rawBuffer = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.from(rawBuffer as ArrayBuffer);
}

function renderSlideHeader(
  slide: any,
  slideData: SlideModel,
  primaryHex: string,
  secondaryHex: string
) {
  if (slideData.badge) {
    slide.addText(slideData.badge.toUpperCase(), {
      x: 0.8,
      y: 0.6,
      w: 10.0,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: secondaryHex,
      fontFace: 'Arial',
    });
  }

  slide.addText(slideData.title, {
    x: 0.8,
    y: 0.9,
    w: 11.5,
    h: 0.8,
    fontSize: 26,
    bold: true,
    color: primaryHex,
    fontFace: 'Arial',
  });
}
