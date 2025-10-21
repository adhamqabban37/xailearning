"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";

type EmbedStatus = "loading" | "ok" | "blocked" | "invalid";
type ValidateResponse = {
  embeddable: boolean;
  id: string | null;
  embedUrl: string | null;
  watchUrl: string | null;
  reason:
    | "ok"
    | "invalid_url"
    | "shorts"
    | "live"
    | "private"
    | "age_restricted"
    | "embed_disabled"
    | "region_blocked"
    | "not_found"
    | "unknown";
  title?: string;
  author?: string;
  thumbnail?: string;
};
type VideoMetadata = {
  title?: string;
  author?: string;
  thumbnail?: string;
};

function extractYouTubeId(rawUrl: string): string | null {
  // Early validation - check if URL is valid and not empty
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    console.warn("❌ Empty or invalid URL provided to YouTubeEmbed");
    return null;
  }

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    // Handle youtu.be short links
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    if (host.endsWith("youtube.com")) {
      const path = url.pathname;
      // Standard watch URL
      if (path === "/watch") {
        const v = url.searchParams.get("v");
        return v && v.length === 11 ? v : null;
      }
      // Embedded styles
      const parts = path.split("/").filter(Boolean);
      // /embed/{id} or /v/{id}
      if ((parts[0] === "embed" || parts[0] === "v") && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
      // /shorts/{id}
      if (parts[0] === "shorts" && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
      // /live/{id}
      if (parts[0] === "live" && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
    }
  } catch {
    // fallthrough
  }
  // Final regex fallback for odd cases
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = rawUrl.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function YouTubeEmbed({ url }: { url: string }) {
  const videoId = useMemo(() => extractYouTubeId(url), [url]);
  const [status, setStatus] = useState<EmbedStatus>("loading");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  // Generate thumbnail URLs (YouTube provides multiple resolutions)
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null;
  const fallbackThumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  useEffect(() => {
    let cancelled = false;

    async function validateVideo() {
      if (!videoId) {
        console.warn("❌ Invalid YouTube URL:", url);
        setStatus("invalid");
        return;
      }

      console.log("✅ Extracted YouTube video ID:", videoId, "from:", url);

      try {
        // Server validation and normalization (oEmbed + Data API)
        const res = await fetch(
          `/api/youtube-validate?url=${encodeURIComponent(url)}`
        );

        if (cancelled) return;

        if (res.ok) {
          const data: ValidateResponse = await res.json();
          if (data.embeddable) {
            console.log(`📹 Video ${videoId} is valid and embeddable`);
            setMetadata({
              title: data.title,
              author: data.author,
              thumbnail: data.thumbnail,
            });
            setStatus("ok");
          } else {
            console.warn(`⚠️ Video ${videoId} blocked: ${data.reason}`);
            setMetadata({
              title: data.title,
              author: data.author,
              thumbnail: data.thumbnail,
            });
            setStatus("blocked");
          }
        } else {
          console.warn(`⚠️ Video ${videoId} not embeddable or not found`);
          setStatus("blocked");
        }
      } catch (err) {
        console.warn("⚠️ validation failed for:", videoId, err);
        if (!cancelled) {
          // On network error, still try to show embed with thumbnail
          setStatus("ok");
        }
      }
    }

    validateVideo();
    return () => {
      cancelled = true;
    };
  }, [url, videoId]);

  // If truly invalid (bad ID), render a friendly fallback
  if (!videoId || status === "invalid") {
    return (
      <div className="w-full rounded-md border bg-secondary/30 p-3 text-sm text-muted-foreground flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> Invalid or unsupported YouTube URL
      </div>
    );
  }

  // Loading state with thumbnail
  if (status === "loading") {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-secondary/30 relative">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt="Loading video..."
            className="w-full h-full object-cover"
            onError={(e) => {
              if (fallbackThumbnail) {
                (e.target as HTMLImageElement).src = fallbackThumbnail;
              }
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (origin) params.set("origin", origin);

  // If blocked, show a resilient card with a link to watch on YouTube
  if (status === "blocked") {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return (
      <div className="w-full rounded-md border bg-secondary/30 p-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Video unavailable to embed. You can still watch it on YouTube.</span>
        </div>
        <a
          className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on YouTube <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  // Show thumbnail initially, load iframe on click for better performance
  if (!showEmbed) {
    return (
      <div
        className="aspect-video w-full rounded-lg overflow-hidden cursor-pointer group relative"
        onClick={() => setShowEmbed(true)}
      >
        <img
          src={thumbnailUrl || fallbackThumbnail || ""}
          alt={metadata?.title || "YouTube video"}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            if (
              fallbackThumbnail &&
              (e.target as HTMLImageElement).src !== fallbackThumbnail
            ) {
              (e.target as HTMLImageElement).src = fallbackThumbnail;
            }
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          {/* YouTube play button */}
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-colors">
            <svg
              className="w-8 h-8 text-white ml-1"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {metadata?.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-sm font-medium line-clamp-2">
              {metadata.title}
            </p>
            {metadata.author && (
              <p className="text-white/70 text-xs mt-1">{metadata.author}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}&autoplay=1`}
        title={metadata?.title || "YouTube video player"}
        referrerPolicy="origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
