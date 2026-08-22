export interface ProjectFileEntry {
  path: string;
  content: string;
}

/**
 * Script injected into the preview iframe to intercept console logs and runtime
 * errors and relay them safely to the host via postMessage.
 */
const PREVIEW_INJECTED_HARNESS = `
<script id="__vibeflow_preview_harness__">
(function() {
  function sendLog(level, message) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'vibeflow-preview-console',
          level: level,
          message: typeof message === 'string' ? message : JSON.stringify(message),
          timestamp: new Date().toISOString(),
        }, '*');
      }
    } catch (_) {}
  }

  var origLog = console.log;
  var origWarn = console.warn;
  var origError = console.error;

  console.log = function() {
    origLog.apply(console, arguments);
    sendLog('log', Array.from(arguments).map(String).join(' '));
  };
  console.warn = function() {
    origWarn.apply(console, arguments);
    sendLog('warn', Array.from(arguments).map(String).join(' '));
  };
  console.error = function() {
    origError.apply(console, arguments);
    sendLog('error', Array.from(arguments).map(String).join(' '));
  };

  window.addEventListener('error', function(e) {
    sendLog('error', e.message + (e.filename ? ' at ' + e.filename + ':' + e.lineno : ''));
  });

  window.addEventListener('unhandledrejection', function(e) {
    sendLog('error', 'Unhandled Promise Rejection: ' + (e.reason ? (e.reason.message || String(e.reason)) : 'unknown'));
  });
})();
</script>
`;

/**
 * Combines project files into a standalone preview HTML document.
 * Inlines referenced CSS and JavaScript so the resulting HTML can be rendered
 * inside an iframe via srcdoc or blob URL.
 */
export function bundleStaticPreview(files: ProjectFileEntry[]): string {
  if (!files || files.length === 0) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <style>
    body {
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #09090b;
      color: #a1a1aa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #18181b;
      border: 1px dashed #27272a;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #818cf8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 24px;
    }
    h3 {
      margin: 0 0 8px;
      color: #f4f4f5;
      font-size: 16px;
      font-weight: 600;
    }
    p {
      margin: 0;
      font-size: 13px;
      color: #71717a;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✨</div>
    <h3>Live Preview Ready</h3>
    <p>Ask the Coding Agent in the chat to scaffold your app, HTML5 game, or dashboard to see it render live here.</p>
  </div>
</body>
</html>`;
  }

  // Find root HTML entry point (index.html or any .html file)
  const htmlFile =
    files.find((f) => f.path === 'index.html' || f.path === '/index.html') ||
    files.find((f) => f.path.endsWith('.html'));

  const fileMap = new Map<string, string>();
  for (const f of files) {
    const cleanPath = f.path.replace(/^\//, '');
    fileMap.set(cleanPath, f.content);
  }

  if (!htmlFile) {
    // If no HTML file is present, construct a basic HTML wrapper for JS/CSS files
    const jsFiles = files.filter((f) => f.path.endsWith('.js') || f.path.endsWith('.ts'));
    const cssFiles = files.filter((f) => f.path.endsWith('.css'));

    let cssTags = cssFiles.map((c) => `<style>${c.content}</style>`).join('\n');
    let jsTags = jsFiles.map((j) => `<script>${j.content}</script>`).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibeflow Live Preview</title>
  ${PREVIEW_INJECTED_HARNESS}
  ${cssTags}
</head>
<body>
  <div id="app"></div>
  <div id="root"></div>
  ${jsTags}
</body>
</html>`;
  }

  let html = htmlFile.content;

  // Inline local <link rel="stylesheet" href="...">
  html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi, (match, href) => {
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
      return match; // Keep external CDN stylesheets
    }
    const cleanHref = href.replace(/^\//, '').replace(/^\.\//, '');
    const cssContent = fileMap.get(cleanHref);
    if (cssContent !== undefined) {
      return `<style>/* inlined from ${cleanHref} */\n${cssContent}\n</style>`;
    }
    return match;
  });

  // Inline local <script src="..."></script>
  html = html.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      return match; // Keep external CDN scripts (e.g. Tailwind, Phaser, Three.js)
    }
    const cleanSrc = src.replace(/^\//, '').replace(/^\.\//, '');
    const jsContent = fileMap.get(cleanSrc);
    if (jsContent !== undefined) {
      return `<script>/* inlined from ${cleanSrc} */\n${jsContent}\n</script>`;
    }
    return match;
  });

  // Inject preview error harness right after <head> or at the top
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n${PREVIEW_INJECTED_HARNESS}`);
  } else {
    html = `${PREVIEW_INJECTED_HARNESS}\n${html}`;
  }

  return html;
}
