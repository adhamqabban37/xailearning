/*
Small, pure URL utilities for YouTube/link normalization and hygiene.
These don't do network I/O and are safe to unit test.
*/

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "si",
  "igshid",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
]);

export function stripTrackingParams(input: string): string {
  try {
    const url = new URL(input);
    // Remove common tracking params
    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key) || key.startsWith("utm_")) {
        url.searchParams.delete(key);
      }
    }
    // Remove empty search
    url.search = url.searchParams.toString();
    return url.toString();
  } catch {
    return input;
  }
}

export function upgradeToHttps(input: string): string {
  try {
    const url = new URL(input);
    if (url.protocol === "http:") {
      url.protocol = "https:";
    }
    return url.toString();
  } catch {
    return input;
  }
}

// Extracts YouTube video ID from various URL forms.
// Supports: watch?v=, youtu.be/, shorts/, embed/
export function extractYouTubeId(input: string): string | null {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      // e.g. https://youtu.be/VIDEO_ID
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const segments = url.pathname.split("/").filter(Boolean);
      // shorts/VIDEO_ID
      if (segments[0] === "shorts" && segments[1]) return segments[1];
      // embed/VIDEO_ID
      if (segments[0] === "embed" && segments[1]) return segments[1];
      // watch?v=VIDEO_ID
      const v = url.searchParams.get("v");
      if (v) return v;
    }

    // Also support full www.youtube.com domains
    if (host === "www.youtube.com") {
      const v = url.searchParams.get("v");
      if (v) return v;
      const segs = url.pathname.split("/").filter(Boolean);
      if (segs[0] === "shorts" && segs[1]) return segs[1];
      if (segs[0] === "embed" && segs[1]) return segs[1];
    }

    return null;
  } catch {
    return null;
  }
}

// Returns canonical watch URL for a given YouTube URL.
export function normalizeYouTube(input: string): string {
  const id = extractYouTubeId(input);
  if (!id) return input;
  return `https://www.youtube.com/watch?v=${id}`;
}

export function toEmbedUrl(videoId: string): string {
  const origin = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    origin,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function normalizeLinkHygiene(input: string): string {
  return stripTrackingParams(upgradeToHttps(input));
}
