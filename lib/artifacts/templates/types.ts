import { z } from 'zod';

export type TemplateArchetype =
  | 'article-split'
  | 'article-centered'
  | 'social-square'
  | 'app-icon'
  | 'banner-horizontal';

export interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesignSlotData {
  /** Template archetype ID */
  templateId: TemplateArchetype;
  /** Primary headline or title text */
  headline?: string;
  /** Subheading or description text */
  subheading?: string;
  /** Category badge or tag text (e.g., "AI & Automation", "Tutorial") */
  badgeText?: string;
  /** R2 Asset ID of the visual hero image/icon (if any) */
  visualAssetId?: string;
  /** Raw visual image URL or SVG data (alternative to assetId) */
  visualUrl?: string;
  /** Background theme style */
  theme?: 'dark-navy' | 'deep-obsidian' | 'clean-light' | 'gradient-mesh' | 'sunset-glow' | 'cyberpunk';
  /** Project ID context for asset URLs */
  projectId?: string;
  /** Primary accent color hex (e.g., "#3b82f6", "#f97316") */
  accentColor?: string;
  /** Custom canvas width in pixels (defaults to template preset) */
  width?: number;
  /** Custom canvas height in pixels (defaults to template preset) */
  height?: number;
}

export const designSlotDataSchema = z.object({
  templateId: z.enum([
    'article-split',
    'article-centered',
    'social-square',
    'app-icon',
    'banner-horizontal',
  ]).describe('Template layout archetype'),
  headline: z.string().optional().describe('Primary headline or article title'),
  subheading: z.string().optional().describe('Supporting subtitle or tagline'),
  badgeText: z.string().optional().describe('Category or tag badge (e.g. "Artificial Intelligence")'),
  visualAssetId: z.string().optional().describe('R2 asset ID of the hero image/icon to place'),
  visualUrl: z.string().optional().describe('Direct image URL to fetch if not yet stored as asset'),
  projectId: z.string().optional().describe('Active project ID'),
  theme: z.enum([
    'dark-navy',
    'deep-obsidian',
    'clean-light',
    'gradient-mesh',
    'sunset-glow',
    'cyberpunk',
  ]).default('dark-navy').describe('Visual background theme palette'),
  accentColor: z.string().default('#3b82f6').describe('Primary accent highlight color hex'),
  width: z.number().int().positive().optional().describe('Optional custom width override'),
  height: z.number().int().positive().optional().describe('Optional custom height override'),
});

export interface TemplateDefinition {
  id: TemplateArchetype;
  name: string;
  description: string;
  width: number;
  height: number;
  aspectRatio: string;
  slots: {
    hasBadge: boolean;
    hasHeadline: boolean;
    hasSubheading: boolean;
    hasVisualHero: boolean;
  };
}
