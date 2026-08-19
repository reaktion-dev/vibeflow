import { describe, it, expect } from 'vitest';
import { renderSvgToRaster } from '@/lib/artifacts/render';

/**
 * Integration tests for the SVG → raster export pipeline.
 *
 * These tests use @resvg/resvg-js + sharp to render real SVG strings
 * into actual image buffers and verify the output dimensions and format.
 */

const MINIMAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
  <rect x="0" y="0" width="200" height="100" fill="#3b82f6"/>
  <rect x="20" y="20" width="60" height="60" fill="#fbbf24"/>
  <path d="M100 50 L140 80 L140 20 Z" fill="#ef4444"/>
</svg>`;

describe('SVG → raster export pipeline', () => {
  it('renders SVG to PNG buffer', async () => {
    const { buffer, mimeType } = await renderSvgToRaster(MINIMAL_SVG, {
      format: 'png',
      scale: 1,
      width: 200,
    });

    expect(mimeType).toBe('image/png');
    expect(buffer.length).toBeGreaterThan(0);

    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it('renders SVG to JPEG buffer', async () => {
    const { buffer, mimeType } = await renderSvgToRaster(MINIMAL_SVG, {
      format: 'jpeg',
      scale: 1,
      quality: 85,
      width: 200,
    });

    expect(mimeType).toBe('image/jpeg');
    expect(buffer.length).toBeGreaterThan(0);

    // JPEG magic bytes: FF D8 FF
    expect(buffer[0]).toBe(0xff);
    expect(buffer[1]).toBe(0xd8);
    expect(buffer[2]).toBe(0xff);
  });

  it('renders SVG to WebP buffer', async () => {
    const { buffer, mimeType } = await renderSvgToRaster(MINIMAL_SVG, {
      format: 'webp',
      scale: 1,
      quality: 85,
      width: 200,
    });

    expect(mimeType).toBe('image/webp');
    expect(buffer.length).toBeGreaterThan(0);

    // WebP magic bytes: R I F F .... W E B P
    expect(buffer.slice(0, 4).toString('ascii')).toBe('RIFF');
    expect(buffer.slice(8, 12).toString('ascii')).toBe('WEBP');
  });

  it('produces larger buffer at 2x scale', async () => {
    const { buffer: buffer1x } = await renderSvgToRaster(MINIMAL_SVG, {
      format: 'png',
      scale: 1,
      width: 200,
    });

    const { buffer: buffer2x } = await renderSvgToRaster(MINIMAL_SVG, {
      format: 'png',
      scale: 2,
      width: 200,
    });

    // 2x scale should produce significantly more pixels
    expect(buffer2x.length).toBeGreaterThan(buffer1x.length);
  });

  it('handles SVG with text (font fallback)', async () => {
    const svgWithText = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100">
      <rect width="300" height="100" fill="#1e293b"/>
      <text x="150" y="55" font-family="sans-serif" font-size="24" fill="white" text-anchor="middle">Hello World</text>
    </svg>`;

    const { buffer, mimeType } = await renderSvgToRaster(svgWithText, {
      format: 'png',
      scale: 1,
      width: 300,
    });

    expect(mimeType).toBe('image/png');
    expect(buffer.length).toBeGreaterThan(100); // Should have content (text may render small without system fonts)
  });

  it('throws on unsupported format', async () => {
    await expect(
      renderSvgToRaster(MINIMAL_SVG, {
        format: 'gif' as any,
        scale: 1,
      })
    ).rejects.toThrow(/Unsupported export format/);
  });

  it('renders with transparent background', async () => {
    const svgTransparent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#22c55e"/>
    </svg>`;

    const { buffer, mimeType } = await renderSvgToRaster(svgTransparent, {
      format: 'png',
      scale: 1,
      width: 100,
      background: 'rgba(0,0,0,0)',
    });

    expect(mimeType).toBe('image/png');
    expect(buffer.length).toBeGreaterThan(0);
  });
});
