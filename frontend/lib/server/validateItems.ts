import { CatalogItem } from "@/types/catalog";
import {
  extractYouTubeId,
  normalizeYouTube,
  toEmbedUrl,
  normalizeLinkHygiene,
} from "@/lib/urlTools";

const DEFAULT_TIMEOUT_MS = 6000;

async function fetchWithTimeout(
  resource: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function validateYouTube(originalUrl: string) {
  const canonical = normalizeYouTube(originalUrl);
  const params = new URLSearchParams({ url: canonical, format: "json" });
  const oembedUrl = `https://www.youtube.com/oembed?${params.toString()}`;
  try {
    const res = await fetchWithTimeout(oembedUrl, { method: "GET" });
    if (res.ok) {
      const id = extractYouTubeId(canonical);
      if (!id) return { valid: false };
      return { valid: true, embedUrl: toEmbedUrl(id), canonical };
    }
  } catch {
    // ignore; will mark as broken
  }
  return { valid: false };
}

async function validateLink(originalUrl: string) {
  const sanitized = normalizeLinkHygiene(originalUrl);
  try {
    let res = await fetchWithTimeout(sanitized, { method: "HEAD" });
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetchWithTimeout(sanitized, { method: "GET" });
    }
    if (res.ok) {
      // In some environments Response.url may be empty on mocked responses
      return { valid: true, finalUrl: res.url || sanitized };
    }
  } catch {
    // network error/timeout
  }
  return { valid: false, finalUrl: sanitized };
}

export async function validateItems(
  items: CatalogItem[]
): Promise<CatalogItem[]> {
  const results: CatalogItem[] = [];
  for (const item of items) {
    let updated: CatalogItem = { ...item };
    if (item.type === "video") {
      const yt = await validateYouTube(item.url);
      if (yt.valid && yt.embedUrl) {
        updated.normalizedUrl = yt.embedUrl;
        updated.broken = false;
        updated.url = yt.canonical ?? item.url;
      } else {
        updated.broken = true;
      }
    } else if (item.type === "link") {
      const ln = await validateLink(item.url);
      if (ln.valid) {
        updated.broken = false;
        updated.url = ln.finalUrl ?? item.url;
      } else {
        updated.broken = true;
        updated.url = ln.finalUrl ?? item.url;
      }
    }
    updated.lastCheckedAt = new Date().toISOString();
    results.push(updated);
  }
  return results;
}
