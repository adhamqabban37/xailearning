import { stripTrackingParams, upgradeToHttps } from "@/lib/urlTools";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  watchUrl: string;
}

export interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      "YouTube API key not configured. Set YOUTUBE_API_KEY in your server environment (e.g., .env.local)."
    );
  }
  return key;
}

export async function searchVideos(
  query: string,
  opts: { maxResults?: number; pageToken?: string } = {}
): Promise<YouTubeSearchResponse> {
  if (!query || !query.trim()) {
    return { videos: [] };
  }

  const key = getApiKey();
  const params = new URLSearchParams({
    key,
    part: "snippet",
    type: "video",
    q: query.trim(),
    maxResults: String(Math.min(Math.max(opts.maxResults ?? 10, 1), 50)),
  });
  if (opts.pageToken) params.set("pageToken", opts.pageToken);

  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const res = await fetch(url, {
    // Prevent proxying API key to client; this runs server-side only
    cache: "no-store",
    headers: {
      // Optional UA to reduce some anti-bot false positives
      "User-Agent": "Mozilla/5.0 (server) ai-learner-platform",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Mask API key; don't log it
    throw new Error(
      `YouTube API error: ${res.status} ${res.statusText} ${
        text ? "- " + text : ""
      }`
    );
  }

  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : [];

  const videos: YouTubeVideo[] = items
    .filter((it) => it.id && it.id.videoId && it.snippet)
    .map((it) => {
      const vid = it.id.videoId as string;
      const sn = it.snippet;
      const thumb =
        sn.thumbnails?.high?.url ||
        sn.thumbnails?.medium?.url ||
        sn.thumbnails?.default?.url ||
        "";
      const watchUrl = upgradeToHttps(
        stripTrackingParams(`https://www.youtube.com/watch?v=${vid}`)
      );
      return {
        id: vid,
        title: sn.title || "",
        description: sn.description || "",
        thumbnailUrl: thumb,
        channelTitle: sn.channelTitle || "",
        publishedAt: sn.publishedAt || "",
        watchUrl,
      } satisfies YouTubeVideo;
    });

  return {
    videos,
    nextPageToken: json.nextPageToken,
  };
}
