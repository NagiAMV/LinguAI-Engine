const cache = globalThis.__linguaiEngnovateCache || new Map();
globalThis.__linguaiEngnovateCache = cache;

const DEFAULT_TTL_MS = 15 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

function scraperUrlFor(resource, query = "") {
  const baseUrl = process.env.ENGNOVATE_SCRAPER_URL;
  if (!baseUrl) return null;
  const url = new URL(baseUrl);
  url.searchParams.set("resource", resource);
  if (query) url.searchParams.set("query", query);
  return url;
}

export async function fetchEngnovateResource(resource, query = "") {
  const cacheKey = `${resource}:${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = scraperUrlFor(resource, query);
  if (!url) return null;

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Engnovate scraper returned ${response.status}`);

  const payload = await response.json();
  return setCached(cacheKey, payload);
}

export function invalidateEngnovateCache() {
  cache.clear();
}