import { describe, expect, it } from 'vitest';
import {
  ALL_TEMPLATES,
  TEMPLATE_CATALOG,
  getTemplateById,
  solveTemplateLayout,
  designSlotDataSchema,
} from '@/lib/artifacts/templates';

describe('Template Catalog & Layout Solver', () => {
  it('registers all 5 core template archetypes', () => {
    expect(ALL_TEMPLATES).toHaveLength(5);
    expect(TEMPLATE_CATALOG['article-split']).toBeDefined();
    expect(TEMPLATE_CATALOG['article-centered']).toBeDefined();
    expect(TEMPLATE_CATALOG['social-square']).toBeDefined();
    expect(TEMPLATE_CATALOG['app-icon']).toBeDefined();
    expect(TEMPLATE_CATALOG['banner-horizontal']).toBeDefined();
  });

  it('validates template dimensions and aspect ratios', () => {
    const article = getTemplateById('article-split');
    expect(article.width).toBe(1200);
    expect(article.height).toBe(630);
    expect(article.aspectRatio).toBe('16:9');

    const appIcon = getTemplateById('app-icon');
    expect(appIcon.width).toBe(512);
    expect(appIcon.height).toBe(512);
    expect(appIcon.aspectRatio).toBe('1:1');

    const social = getTemplateById('social-square');
    expect(social.width).toBe(1080);
    expect(social.height).toBe(1080);
  });

  it('solves layout and generates valid SVG for article-split', () => {
    const svg = solveTemplateLayout({
      templateId: 'article-split',
      headline: 'The Era of Agentic AI & Autonomous Workflows',
      subheading: 'How intelligent agents are revolutionizing software development and creative pipelines.',
      badgeText: 'Artificial Intelligence',
      theme: 'dark-navy',
      accentColor: '#3B82F6',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 1200 630"');
    expect(svg).toContain('id="layer-background"');
    expect(svg).toContain('id="layer-visual"');
    expect(svg).toContain('id="layer-typography"');
    expect(svg).toContain('ARTIFICIAL INTELLIGENCE');
    expect(svg).toContain('The Era of Agentic AI');
    expect(svg).toContain('</svg>');
  });

  it('solves layout and generates valid SVG for app-icon', () => {
    const svg = solveTemplateLayout({
      templateId: 'app-icon',
      theme: 'deep-obsidian',
      accentColor: '#A855F7',
    });

    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain('id="layer-background"');
    expect(svg).toContain('id="layer-visual"');
    expect(svg).toContain('rx="92"');
  });

  it('solves layout and generates valid SVG for social-square', () => {
    const svg = solveTemplateLayout({
      templateId: 'social-square',
      headline: 'Vibeflow 2.0 Launch',
      subheading: 'Create apps, vectors, and videos in unified workspaces.',
      badgeText: 'Product Update',
      theme: 'cyberpunk',
    });

    expect(svg).toContain('viewBox="0 0 1080 1080"');
    expect(svg).toContain('Vibeflow 2.0 Launch');
    expect(svg).toContain('PRODUCT UPDATE');
  });

  it('escapes XML special characters to prevent broken SVG XML', () => {
    const svg = solveTemplateLayout({
      templateId: 'article-split',
      headline: 'AI & Next.js <Fast & Modular>',
      subheading: 'Testing "quotes" and \'apostrophes\' & special chars',
      badgeText: 'Dev & Design',
    });

    expect(svg).toContain('&amp;');
    expect(svg).toContain('&lt;Fast');
    expect(svg).toContain('Modular&gt;');
    expect(svg).toContain('&quot;quotes&quot;');
    expect(svg).toContain('&apos;apostrophes&apos;');
    expect(svg).not.toContain('<Fast');
  });

  it('validates schema with defaults and overrides', () => {
    const parsed = designSlotDataSchema.parse({
      templateId: 'article-split',
      headline: 'Custom Headline',
    });

    expect(parsed.templateId).toBe('article-split');
    expect(parsed.theme).toBe('dark-navy');
    expect(parsed.accentColor).toBe('#3b82f6');
  });
});
