"use client";

import { useEffect, useMemo, useState } from "react";

type EmbedStatus = "unknown" | "ok" | "blocked";

function extractYouTubeId(rawUrl: string): string | null {
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
  const [status, setStatus] = useState<EmbedStatus>("unknown");

  useEffect(() => {
    let cancelled = false;
    async function checkEmbeddable() {
      if (!videoId) {
        setStatus("blocked");
        return;
      }
      try {
        const res = await fetch(
          `/api/youtube-oembed?url=${encodeURIComponent(url)}`
        );
        if (!cancelled) {
          setStatus(res.ok ? "ok" : "blocked");
        }
      } catch {
        if (!cancelled) setStatus("ok"); // be permissive on network hiccups
      }
    }
    checkEmbeddable();
    return () => {
      cancelled = true;
    };
  }, [url, videoId]);

  // If invalid or explicitly blocked, show a safe link fallback
  if (!videoId || status === "blocked") {
    return (
      <div className="aspect-video w-full flex items-center justify-center rounded-lg bg-secondary/30 p-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline"
          aria-label="Open video on YouTube in a new tab"
        >
          Open this video on YouTube
        </a>
      </div>
    );
  }

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    // origin is added at runtime for better compatibility with some embeds
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (origin) params.set("origin", origin);

  return (
    <div className="aspect-video w-full">
      <iframe
        className="w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
        title="YouTube video player"
        referrerPolicy="origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
