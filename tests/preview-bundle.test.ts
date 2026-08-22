import { describe, expect, it } from 'vitest';
import { bundleStaticPreview } from '@/lib/artifacts/preview-bundle';

describe('bundleStaticPreview', () => {
  it('inlines local css and js files into index.html', () => {
    const files = [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Game Canvas</h1>
  <script src="game.js"></script>
</body>
</html>`,
      },
      {
        path: 'style.css',
        content: 'body { background: red; }',
      },
      {
        path: 'game.js',
        content: 'console.log("Game started");',
      },
    ];

    const bundled = bundleStaticPreview(files);

    expect(bundled).toContain('body { background: red; }');
    expect(bundled).toContain('console.log("Game started");');
    expect(bundled).toContain('__vibeflow_preview_harness__');
  });

  it('handles external CDN links without inlining them', () => {
    const files = [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"></script>
</head>
<body>
</body>
</html>`,
      },
    ];

    const bundled = bundleStaticPreview(files);

    expect(bundled).toContain('https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js');
  });
});
