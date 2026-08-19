/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    // `ws` does a guarded require('bufferutil') for an optional native addon;
    // bundlers stub the require and break frame masking. Matches the official
    // harness-e2e-next example.
    WS_NO_BUFFER_UTIL: '1',
  },
  // The AI SDK harness chain is Node-only runtime code that reads bridge
  // assets from its own node_modules at runtime (new URL(..., import.meta.url)).
  // Bundling it breaks Turbopack's static analysis (Can't resolve '../bridge/')
  // and would break runtime asset reads. Keep it external.
  serverExternalPackages: [
    '@ai-sdk/harness-opencode',
    '@ai-sdk/harness',
    '@ai-sdk/sandbox-vercel',
    'ws',
    '@visioncortex/vtracer',
    'potrace',
    'sharp',
    '@resvg/resvg-js',
  ],
}

export default nextConfig
