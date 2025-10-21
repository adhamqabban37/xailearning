/**
 * YouTube utilities for server-side validation and client-side safe rendering.
 */

import { extractYouTubeId, normalizeYouTube } from "./urlTools";

export interface YouTubeOEmbedResponse {
  type: "video";
  version: string;
  provider_name: string;
  provider_url: string;
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  html: string;
  width: number;
  height: number;
}

export interface YouTubeValidation {
  valid: boolean;
  videoId: string | null;
  watchUrl: string | null;
  embedUrl: string | null;
  title?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Server-side utility: validates a YouTube URL via oEmbed API.
 * Use this in RSC or Route Handlers before rendering.
 * Returns validation result with metadata if available.
 */
export async function validateYouTubeUrl(
  url: string,
  timeoutMs = 5000
): Promise<YouTubeValidation> {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return {
      valid: false,
      videoId: null,
      watchUrl: null,
      embedUrl: null,
      error: "Invalid YouTube URL or video ID not found",
    };
  }

  const watchUrl = normalizeYouTube(url);
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      watchUrl
    )}&format=json`;

    const response = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // oEmbed failed: video might be private, deleted, or embedding disabled
      return {
        valid: false,
        videoId,
        watchUrl,
        embedUrl,
        error: `oEmbed check failed: ${response.status} ${response.statusText}`,
      };
    }

    const data: YouTubeOEmbedResponse = await response.json();

    return {
      valid: true,
      videoId,
      watchUrl,
      embedUrl,
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (err: any) {
    return {
      valid: false,
      videoId,
      watchUrl,
      embedUrl,
      error: err.name === "AbortError" ? "Request timeout" : err.message,
    };
  }
}

/**
 * Maps YouTube Player API error codes to human-readable messages.
 */
export function getYouTubeErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case 2:
      return "Invalid video parameter";
    case 5:
      return "HTML5 player error";
    case 100:
      return "Video not found or private";
    case 101:
      return "Video owner does not allow embedding";
    case 150:
      return "Video owner does not allow embedding";
    default:
      return `Player error (code ${errorCode})`;
  }
}
