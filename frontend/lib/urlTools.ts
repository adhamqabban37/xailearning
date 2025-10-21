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

/**
 * Extracts YouTube video ID from various URL forms.
 * Supports: watch?v=, youtu.be/, shorts/, embed/, with extra params (&t=, &list=, &si=...)
 * Returns the 11-character video ID or null if invalid.
 */
export function extractYouTubeId(input: string): string | null {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    // youtu.be share links
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      // Remove any trailing query params embedded in path (rare but possible)
      return id ? id.split("?")[0] : null;
    }

    // All youtube.com variants
    if (
      host === "youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "music.youtube.com"
    ) {
      const segments = url.pathname.split("/").filter(Boolean);

      // Handle /shorts/VIDEO_ID
      if (segments[0] === "shorts" && segments[1]) {
        return segments[1].split("?")[0]; // strip any inline params
      }

      // Handle /embed/VIDEO_ID
      if (segments[0] === "embed" && segments[1]) {
        return segments[1].split("?")[0];
      }

      // Handle /watch?v=VIDEO_ID
      const v = url.searchParams.get("v");
      if (v) return v;

      // Handle /v/VIDEO_ID (legacy)
      if (segments[0] === "v" && segments[1]) {
        return segments[1].split("?")[0];
      }
    }

    return null;
  } catch {
    // Not a valid URL
    return null;
  }
}

// Returns canonical watch URL for a given YouTube URL.
export function normalizeYouTube(input: string): string {
  const id = extractYouTubeId(input);
  if (!id) return input;
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * Returns a clean embed URL for a given video ID.
 * Only includes safe params: rel=0, modestbranding=1, controls=1
 * Optionally adds start= if startSeconds is provided.
 */
export function toEmbedUrl(videoId: string, startSeconds?: number): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    controls: "1",
  });
  if (startSeconds) {
    params.set("start", String(Math.floor(startSeconds)));
  }
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function normalizeLinkHygiene(input: string): string {
  return stripTrackingParams(upgradeToHttps(input));
}
