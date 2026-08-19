import { getEnv } from '@/lib/env';

/**
 * Web search service for the Design workspace.
 *
 * Uses Serper (https://serper.dev) or SerpAPI (https://serpapi.com) to search
 * for reusable images, backgrounds, transparent PNGs, and reference material.
 *
 * Both are simple REST APIs:
 * - Serper: POST https://google.serper.dev/{images,search} with JSON body
 * - SerpAPI: GET https://serpapi.com/search?engine=google_images&q=...
 *
 * Images found via search are downloaded and stored in R2 via fetchImage().
 */

export interface SearchResult {
  title: string;
  url: string;
  imageUrl?: string;
  source?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

/**
 * Search for images using the configured search provider.
 *
 * @param query - Search query (e.g., "coffee cup png transparent background")
 * @param options - Search options
 * @returns Array of search results with image URLs
 */
export async function searchImages(
  query: string,
  options?: { count?: number }
): Promise<{ results: SearchResult[]; provider: string }> {
  const env = getEnv();
  const count = options?.count ?? 10;

  if (env.SERPER_API_KEY) {
    return searchWithSerper(query, count, env.SERPER_API_KEY);
  }

  if (env.SERPAPI_API_KEY) {
    return searchWithSerpAPI(query, count, env.SERPAPI_API_KEY);
  }

  throw new Error(
    'No web search provider configured. Set SERPER_API_KEY or SERPAPI_API_KEY in your environment.'
  );
}

/**
 * Search the web (general, not images) using the configured search provider.
 */
export async function searchWeb(
  query: string,
  options?: { count?: number }
): Promise<{ results: SearchResult[]; provider: string }> {
  const env = getEnv();
  const count = options?.count ?? 10;

  if (env.SERPER_API_KEY) {
    return searchWebWithSerper(query, count, env.SERPER_API_KEY);
  }

  if (env.SERPAPI_API_KEY) {
    return searchWebWithSerpAPI(query, count, env.SERPAPI_API_KEY);
  }

  throw new Error(
    'No web search provider configured. Set SERPER_API_KEY or SERPAPI_API_KEY in your environment.'
  );
}

// ─── Serper (https://serper.dev) ───────────────────────────────────────────────

async function searchWithSerper(
  query: string,
  count: number,
  apiKey: string
): Promise<{ results: SearchResult[]; provider: string }> {
  const response = await fetch('https://google.serper.dev/images', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: count,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const images = (data.images ?? []) as Array<{
    title: string;
    imageUrl: string;
    source?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
  }>;

  return {
    results: images.map((img) => ({
      title: img.title,
      url: img.imageUrl,
      imageUrl: img.imageUrl,
      source: img.source,
      thumbnailUrl: img.thumbnailUrl,
      width: img.width,
      height: img.height,
    })),
    provider: 'serper',
  };
}

async function searchWebWithSerper(
  query: string,
  count: number,
  apiKey: string
): Promise<{ results: SearchResult[]; provider: string }> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: count,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const organic = (data.organic ?? []) as Array<{
    title: string;
    link: string;
    snippet?: string;
  }>;

  return {
    results: organic.map((item) => ({
      title: item.title,
      url: item.link,
      source: item.snippet,
    })),
    provider: 'serper',
  };
}

// ─── SerpAPI (https://serpapi.com) ─────────────────────────────────────────────

async function searchWithSerpAPI(
  query: string,
  count: number,
  apiKey: string
): Promise<{ results: SearchResult[]; provider: string }> {
  const params = new URLSearchParams({
    engine: 'google_images',
    q: query,
    num: String(count),
    api_key: apiKey,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);

  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const imagesResults = (data.images_results ?? []) as Array<{
    title: string;
    original?: string;
    thumbnail?: string;
    source?: string;
    original_width?: number;
    original_height?: number;
  }>;

  return {
    results: imagesResults.slice(0, count).map((img) => ({
      title: img.title,
      url: img.original ?? img.thumbnail ?? '',
      imageUrl: img.original ?? img.thumbnail,
      source: img.source,
      thumbnailUrl: img.thumbnail,
      width: img.original_width,
      height: img.original_height,
    })),
    provider: 'serpapi',
  };
}

async function searchWebWithSerpAPI(
  query: string,
  count: number,
  apiKey: string
): Promise<{ results: SearchResult[]; provider: string }> {
  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    num: String(count),
    api_key: apiKey,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);

  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const organic = (data.organic_results ?? []) as Array<{
    title: string;
    link: string;
    snippet?: string;
  }>;

  return {
    results: organic.slice(0, count).map((item) => ({
      title: item.title,
      url: item.link,
      source: item.snippet,
    })),
    provider: 'serpapi',
  };
}

/**
 * Download an image from a URL and return the buffer.
 * Used by the fetchImage tool before storing to R2.
 */
export async function downloadImageFromUrl(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Vibeflow/1.0 (Design Workspace)',
      Accept: 'image/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get('content-type') ?? 'image/png';

  return { buffer, mimeType };
}

/**
 * Check if a web search provider is configured.
 */
export function isWebSearchConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.SERPER_API_KEY || env.SERPAPI_API_KEY);
}
