import { describe, expect, it } from 'vitest';
import { createZipBuffer } from '@/lib/utils/zip';

describe('createZipBuffer', () => {
  it('creates a valid ZIP buffer from text and binary entries', () => {
    const entries = [
      { path: 'index.html', content: '<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>' },
      { path: 'styles/main.css', content: 'body { margin: 0; background: #000; }' },
      { path: 'src/game.js', content: 'console.log("Game started");' },
    ];

    const zipBuffer = createZipBuffer(entries);

    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(0);

    // Verify ZIP magic signature (PK\x03\x04)
    expect(zipBuffer[0]).toBe(0x50);
    expect(zipBuffer[1]).toBe(0x4b);
    expect(zipBuffer[2]).toBe(0x03);
    expect(zipBuffer[3]).toBe(0x04);

    // Verify End of Central Directory signature (PK\x05\x06) near the end
    const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
    expect(zipBuffer.includes(eocdSig)).toBe(true);

    // Verify filenames are present in the central directory
    expect(zipBuffer.toString('utf-8')).toContain('index.html');
    expect(zipBuffer.toString('utf-8')).toContain('styles/main.css');
    expect(zipBuffer.toString('utf-8')).toContain('src/game.js');
  });

  it('handles empty entries gracefully', () => {
    const zipBuffer = createZipBuffer([]);
    expect(zipBuffer.length).toBe(22); // Just EOCD record
  });
});
