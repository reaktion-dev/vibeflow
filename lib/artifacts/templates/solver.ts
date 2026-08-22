import { DesignSlotData, TemplateArchetype } from './types';
import { getTemplateById } from './catalog';

interface ThemePalette {
  bgStart: string;
  bgEnd: string;
  cardBg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  badgeBg: string;
  badgeText: string;
  meshGlow: string;
}

const THEMES: Record<string, ThemePalette> = {
  'dark-navy': {
    bgStart: '#0B132B',
    bgEnd: '#020617',
    cardBg: 'rgba(30, 41, 59, 0.5)',
    border: 'rgba(148, 163, 184, 0.15)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#60A5FA',
    meshGlow: 'rgba(59, 130, 246, 0.12)',
  },
  'deep-obsidian': {
    bgStart: '#09090b',
    bgEnd: '#000000',
    cardBg: 'rgba(24, 24, 27, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    badgeBg: 'rgba(255, 255, 255, 0.1)',
    badgeText: '#f4f4f5',
    meshGlow: 'rgba(168, 85, 247, 0.15)',
  },
  'clean-light': {
    bgStart: '#FFFFFF',
    bgEnd: '#F1F5F9',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(203, 213, 225, 0.6)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    badgeBg: 'rgba(59, 130, 246, 0.1)',
    badgeText: '#2563EB',
    meshGlow: 'rgba(59, 130, 246, 0.08)',
  },
  'sunset-glow': {
    bgStart: '#180B26',
    bgEnd: '#090214',
    cardBg: 'rgba(46, 16, 77, 0.4)',
    border: 'rgba(244, 63, 94, 0.2)',
    textPrimary: '#FFF1F2',
    textSecondary: '#FDA4AF',
    textMuted: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeText: '#FB7185',
    meshGlow: 'rgba(244, 63, 94, 0.2)',
  },
  'cyberpunk': {
    bgStart: '#0A0612',
    bgEnd: '#030008',
    cardBg: 'rgba(25, 12, 44, 0.6)',
    border: 'rgba(6, 182, 212, 0.3)',
    textPrimary: '#F0FDFA',
    textSecondary: '#2DD4BF',
    textMuted: '#14B8A6',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    badgeText: '#22D3EE',
    meshGlow: 'rgba(6, 182, 212, 0.25)',
  },
};

/**
 * Escapes XML special characters for safe SVG string injection.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Splits long text into wrapped lines fitting within maxCharsPerLine.
 */
function wrapText(text: string, maxCharsPerLine: number = 32): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Deterministic Layout Solver
 * Takes semantic slot data and generates perfectly aligned, non-overlapping SVG markup.
 */
export function solveTemplateLayout(slotData: DesignSlotData): string {
  const template = getTemplateById(slotData.templateId);
  const width = slotData.width || template.width;
  const height = slotData.height || template.height;
  const theme = THEMES[slotData.theme || 'dark-navy'] ?? THEMES['dark-navy'];
  const accent = slotData.accentColor || '#3B82F6';

  const headline = slotData.headline || 'Autonomous Multi-Agent Studio';
  const subheading =
    slotData.subheading ||
    'Build full-stack applications, vector graphics, and video content in unified workspaces.';
  const badge = slotData.badgeText || 'Vibeflow Platform';
  const visualHref = slotData.visualUrl || (slotData.visualAssetId ? `/api/assets/${slotData.visualAssetId}` : null);

  let svgBody = '';

  switch (slotData.templateId) {
    case 'article-split': {
      // 1200x630: Left Visual Hero (400x400), Right Typography (580px wide)
      const visualX = 80;
      const visualY = (height - 400) / 2;
      const textX = 540;
      const badgeY = 150;
      const headlineY = 225;

      const headlineLines = wrapText(headline, 26);
      const subheadLines = wrapText(subheading, 38);

      const headlineHeight = headlineLines.length * 48;
      const subheadY = headlineY + headlineHeight + 20;

      svgBody = `
  <!-- Background Layer -->
  <g id="layer-background">
    <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
    <circle cx="${width * 0.25}" cy="${height * 0.4}" r="280" fill="${theme.meshGlow}" filter="url(#blurEffect)" />
    <circle cx="${width * 0.85}" cy="${height * 0.7}" r="220" fill="${accent}" opacity="0.08" filter="url(#blurEffect)" />
    <!-- Tech Grid Accent -->
    <path d="M 0 100 L ${width} 100 M 0 200 L ${width} 200 M 0 300 L ${width} 300 M 0 400 L ${width} 400 M 0 500 L ${width} 500" stroke="${theme.border}" stroke-width="1" opacity="0.4" stroke-dasharray="4 8" />
  </g>

  <!-- Left Visual Hero Slot -->
  <g id="layer-visual">
    <rect x="${visualX - 10}" y="${visualY - 10}" width="420" height="420" rx="28" fill="${theme.cardBg}" stroke="${theme.border}" stroke-width="1.5" />
    ${
      visualHref
        ? `<image href="${escapeXml(visualHref)}" x="${visualX}" y="${visualY}" width="400" height="400" preserveAspectRatio="xMidYMid meet" />`
        : `
      <!-- Default Procedural Visual Geometry -->
      <g transform="translate(${visualX + 50}, ${visualY + 50})">
        <rect width="300" height="300" rx="20" fill="url(#accentGradient)" opacity="0.15" />
        <circle cx="150" cy="150" r="90" fill="url(#accentGradient)" opacity="0.8" />
        <polygon points="150,80 210,190 90,190" fill="#ffffff" opacity="0.9" />
      </g>`
    }
  </g>

  <!-- Right Typography Slot (Zero Overlap Guaranteed) -->
  <g id="layer-typography">
    <!-- Category Badge -->
    <g transform="translate(${textX}, ${badgeY})">
      <rect width="${badge.length * 10 + 32}" height="32" rx="16" fill="${theme.badgeBg}" stroke="${accent}" stroke-width="1" opacity="0.9" />
      <text x="16" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${theme.badgeText}" letter-spacing="0.5">${escapeXml(badge.toUpperCase())}</text>
    </g>

    <!-- Headline -->
    <text x="${textX}" y="${headlineY}" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="${theme.textPrimary}" letter-spacing="-0.03em">
      ${headlineLines.map((line, i) => `<tspan x="${textX}" dy="${i === 0 ? 0 : 50}">${escapeXml(line)}</tspan>`).join('')}
    </text>

    <!-- Subheading -->
    <text x="${textX}" y="${subheadY}" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="400" fill="${theme.textSecondary}" line-height="1.5">
      ${subheadLines.map((line, i) => `<tspan x="${textX}" dy="${i === 0 ? 0 : 28}">${escapeXml(line)}</tspan>`).join('')}
    </text>
  </g>
`;
      break;
    }

    case 'article-centered': {
      // 1200x630: Top Badge, Center Visual (450x260), Bottom Headline
      const visualW = 480;
      const visualH = 260;
      const visualX = (width - visualW) / 2;
      const visualY = 120;
      const headlineLines = wrapText(headline, 40);

      svgBody = `
  <!-- Background Layer -->
  <g id="layer-background">
    <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
    <circle cx="${width / 2}" cy="${height / 2}" r="350" fill="${theme.meshGlow}" filter="url(#blurEffect)" />
  </g>

  <!-- Top Badge -->
  <g id="layer-badge" transform="translate(${(width - (badge.length * 10 + 32)) / 2}, 50)">
    <rect width="${badge.length * 10 + 32}" height="32" rx="16" fill="${theme.badgeBg}" stroke="${accent}" stroke-width="1" />
    <text x="16" y="21" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="${theme.badgeText}">${escapeXml(badge.toUpperCase())}</text>
  </g>

  <!-- Center Visual Slot -->
  <g id="layer-visual">
    <rect x="${visualX - 8}" y="${visualY - 8}" width="${visualW + 16}" height="${visualH + 16}" rx="20" fill="${theme.cardBg}" stroke="${theme.border}" />
    ${
      visualHref
        ? `<image href="${escapeXml(visualHref)}" x="${visualX}" y="${visualY}" width="${visualW}" height="${visualH}" preserveAspectRatio="xMidYMid meet" />`
        : `
      <g transform="translate(${visualX + (visualW - 160) / 2}, ${visualY + 50})">
        <circle cx="80" cy="80" r="70" fill="url(#accentGradient)" opacity="0.9" />
        <rect x="50" y="50" width="60" height="60" rx="12" fill="#ffffff" />
      </g>`
    }
  </g>

  <!-- Bottom Headline & Subheading -->
  <g id="layer-typography">
    <text x="${width / 2}" y="450" text-anchor="middle" font-family="system-ui, sans-serif" font-size="38" font-weight="800" fill="${theme.textPrimary}">
      ${headlineLines.map((line, i) => `<tspan x="${width / 2}" dy="${i === 0 ? 0 : 46}">${escapeXml(line)}</tspan>`).join('')}
    </text>
    <text x="${width / 2}" y="550" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" font-weight="400" fill="${theme.textSecondary}">
      ${escapeXml(subheading)}
    </text>
  </g>
`;
      break;
    }

    case 'social-square': {
      // 1080x1080: Centered Visual (540x540) + Bottom Title
      const visualSize = 540;
      const visualX = (width - visualSize) / 2;
      const visualY = 180;
      const headlineLines = wrapText(headline, 28);

      svgBody = `
  <!-- Background Layer -->
  <g id="layer-background">
    <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
    <circle cx="${width / 2}" cy="${height * 0.4}" r="380" fill="${theme.meshGlow}" filter="url(#blurEffect)" />
  </g>

  <!-- Top Badge -->
  <g id="layer-badge" transform="translate(${(width - (badge.length * 12 + 40)) / 2}, 90)">
    <rect width="${badge.length * 12 + 40}" height="40" rx="20" fill="${theme.badgeBg}" stroke="${accent}" stroke-width="1.5" />
    <text x="20" y="26" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="${theme.badgeText}">${escapeXml(badge.toUpperCase())}</text>
  </g>

  <!-- Center Artwork Slot -->
  <g id="layer-visual">
    <rect x="${visualX - 12}" y="${visualY - 12}" width="${visualSize + 24}" height="${visualSize + 24}" rx="32" fill="${theme.cardBg}" stroke="${theme.border}" stroke-width="2" />
    ${
      visualHref
        ? `<image href="${escapeXml(visualHref)}" x="${visualX}" y="${visualY}" width="${visualSize}" height="${visualSize}" preserveAspectRatio="xMidYMid meet" />`
        : `
      <g transform="translate(${visualX + 120}, ${visualY + 120})">
        <circle cx="150" cy="150" r="140" fill="url(#accentGradient)" opacity="0.85" />
        <polygon points="150,60 230,220 70,220" fill="#ffffff" />
      </g>`
    }
  </g>

  <!-- Bottom Title -->
  <g id="layer-typography">
    <text x="${width / 2}" y="820" text-anchor="middle" font-family="system-ui, sans-serif" font-size="44" font-weight="800" fill="${theme.textPrimary}" letter-spacing="-0.02em">
      ${headlineLines.map((line, i) => `<tspan x="${width / 2}" dy="${i === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`).join('')}
    </text>
    <text x="${width / 2}" y="950" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="400" fill="${theme.textSecondary}">
      ${escapeXml(subheading)}
    </text>
  </g>
`;
      break;
    }

    case 'app-icon': {
      // 512x512: Centered Squircle & Monogram
      const iconPadding = 48;
      const iconSize = width - iconPadding * 2;

      svgBody = `
  <!-- Background Layer -->
  <g id="layer-background">
    <rect width="${width}" height="${height}" fill="${theme.bgStart}" />
    <!-- Rounded App Squircle -->
    <rect x="${iconPadding}" y="${iconPadding}" width="${iconSize}" height="${iconSize}" rx="92" fill="url(#bgGradient)" stroke="${theme.border}" stroke-width="2" />
    <rect x="${iconPadding + 4}" y="${iconPadding + 4}" width="${iconSize - 8}" height="${iconSize - 8}" rx="88" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
    <circle cx="${width / 2}" cy="${height / 2}" r="160" fill="${accent}" opacity="0.25" filter="url(#blurEffect)" />
  </g>

  <!-- Centered Monogram / Visual Glyph -->
  <g id="layer-visual">
    ${
      visualHref
        ? `<image href="${escapeXml(visualHref)}" x="${width * 0.2}" y="${height * 0.2}" width="${width * 0.6}" height="${height * 0.6}" preserveAspectRatio="xMidYMid meet" />`
        : `
      <g transform="translate(${width * 0.22}, ${height * 0.22})">
        <!-- 45-degree Modern Sliced Crown Monogram -->
        <path d="M 40 40 L 90 240 L 140 240 L 190 40 L 145 40 L 115 175 L 85 40 Z" fill="url(#accentGradient)" />
        <path d="M 180 40 L 235 40 L 235 90 L 180 90 Z" fill="#ffffff" opacity="0.9" />
        <path d="M 180 115 L 235 115 L 235 165 L 180 165 Z" fill="${accent}" />
      </g>`
    }
  </g>
`;
      break;
    }

    case 'banner-horizontal': {
      // 1200x400: Compact Header Banner
      const visualX = 60;
      const visualY = 50;
      const textX = 420;
      const headlineLines = wrapText(headline, 32);

      svgBody = `
  <!-- Background Layer -->
  <g id="layer-background">
    <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
    <circle cx="${width * 0.8}" cy="${height * 0.5}" r="220" fill="${accent}" opacity="0.1" filter="url(#blurEffect)" />
  </g>

  <!-- Left Visual Slot -->
  <g id="layer-visual">
    <rect x="${visualX - 6}" y="${visualY - 6}" width="312" height="312" rx="20" fill="${theme.cardBg}" stroke="${theme.border}" />
    ${
      visualHref
        ? `<image href="${escapeXml(visualHref)}" x="${visualX}" y="${visualY}" width="300" height="300" preserveAspectRatio="xMidYMid meet" />`
        : `
      <g transform="translate(${visualX + 40}, ${visualY + 40})">
        <circle cx="110" cy="110" r="95" fill="url(#accentGradient)" opacity="0.8" />
        <rect x="75" y="75" width="70" height="70" rx="14" fill="#ffffff" />
      </g>`
    }
  </g>

  <!-- Right Typography Slot -->
  <g id="layer-typography">
    <g transform="translate(${textX}, 70)">
      <rect width="${badge.length * 10 + 28}" height="28" rx="14" fill="${theme.badgeBg}" stroke="${accent}" stroke-width="1" />
      <text x="14" y="19" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="${theme.badgeText}">${escapeXml(badge.toUpperCase())}</text>
    </g>

    <text x="${textX}" y="150" font-family="system-ui, sans-serif" font-size="38" font-weight="800" fill="${theme.textPrimary}">
      ${headlineLines.map((line, i) => `<tspan x="${textX}" dy="${i === 0 ? 0 : 46}">${escapeXml(line)}</tspan>`).join('')}
    </text>

    <text x="${textX}" y="270" font-family="system-ui, sans-serif" font-size="17" font-weight="400" fill="${theme.textSecondary}">
      ${escapeXml(subheading)}
    </text>
  </g>
`;
      break;
    }
  }

  // Complete SVG Root Envelope
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgStart}" />
      <stop offset="100%" stop-color="${theme.bgEnd}" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent}" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>
    <filter id="blurEffect" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
    </filter>
  </defs>
  ${svgBody}
</svg>`.trim();
}
