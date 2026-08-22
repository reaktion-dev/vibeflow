import { TemplateArchetype, TemplateDefinition } from './types';

export const TEMPLATE_CATALOG: Record<TemplateArchetype, TemplateDefinition> = {
  'article-split': {
    id: 'article-split',
    name: 'Featured Article (Split 16:9)',
    description: '1200x630 featured blog/article banner. Left 45% visual hero image or icon, Right 55% category badge, headline, and subtitle.',
    width: 1200,
    height: 630,
    aspectRatio: '16:9',
    slots: {
      hasBadge: true,
      hasHeadline: true,
      hasSubheading: true,
      hasVisualHero: true,
    },
  },
  'article-centered': {
    id: 'article-centered',
    name: 'Featured Article (Centered 16:9)',
    description: '1200x630 featured banner with centered visual hero artwork, top category badge, and bottom bold headline.',
    width: 1200,
    height: 630,
    aspectRatio: '16:9',
    slots: {
      hasBadge: true,
      hasHeadline: true,
      hasSubheading: true,
      hasVisualHero: true,
    },
  },
  'social-square': {
    id: 'social-square',
    name: 'Social Media Card (Square 1:1)',
    description: '1080x1080 square format for Twitter, LinkedIn, and Instagram. Centered visual hero with top brand tag and bottom headline.',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    slots: {
      hasBadge: true,
      hasHeadline: true,
      hasSubheading: true,
      hasVisualHero: true,
    },
  },
  'app-icon': {
    id: 'app-icon',
    name: 'App Icon / Brand Monogram (1:1)',
    description: '512x512 high-resolution app icon. Centered vector monogram or glyph on a rich gradient backdrop with subtle border chamfers.',
    width: 512,
    height: 512,
    aspectRatio: '1:1',
    slots: {
      hasBadge: false,
      hasHeadline: false,
      hasSubheading: false,
      hasVisualHero: true,
    },
  },
  'banner-horizontal': {
    id: 'banner-horizontal',
    name: 'Marketing Header Banner (3:1)',
    description: '1200x400 horizontal banner for website headers, newsletters, and email campaigns.',
    width: 1200,
    height: 400,
    aspectRatio: '3:1',
    slots: {
      hasBadge: true,
      hasHeadline: true,
      hasSubheading: true,
      hasVisualHero: true,
    },
  },
};

export const ALL_TEMPLATES = Object.values(TEMPLATE_CATALOG);

export function getTemplateById(id: TemplateArchetype): TemplateDefinition {
  return TEMPLATE_CATALOG[id] ?? TEMPLATE_CATALOG['article-split'];
}
