"use client";

import { useEffect, useState } from "react";
import { Loader2, ExternalLink, AlertCircle, Video } from "lucide-react";

// Bulletproof YouTube embed component - NEVER shows blank screens or 503s

type SafeYouTubeProps = {
  url: string;
  title?: string;
  className?: string;
};

type VideoStatus = {
  ok: boolean;
  reason: string;
  embedUrl: string | null;
  openUrl: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  note?: string;
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    
    if (host === "youtu.be") {
      return u.pathname.split("/")[1] || null;
    }
    
    if (host.endsWith("youtube.com")) {
      // Watch URLs
      if (u.pathname === "/watch") {
        return u.searchParams.get("v");
      }
      // Embed/shorts/live URLs
      const parts = u.pathname.split("/").filter(Boolean);
      if ((parts[0] === "embed" || parts[0] === "v" || parts[0] === "shorts" || parts[0] === "live") && parts[1]) {
        return parts[1];
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

function getThumbnailUrl(videoId: string): string {
  // Try maxresdefault first, fallback to hqdefault
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

async function validateVideo(url: string, title?: string): Promise<VideoStatus> {
  const videoId = extractYouTubeId(url);
  
  // Fallback response if we can't extract ID
  if (!videoId) {
    return {
      ok: true,
      reason: "invalid_url",
      embedUrl: null,
      openUrl: url || "https://youtube.com",
      title: title || "Video",
      note: "Unable to extract video ID",
    };
  }
  
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  
  try {
    // Try validation API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`/api/youtube-validate?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      
      return {
        ok: true,
        reason: data.reason || "ok",
        embedUrl: data.embeddable ? embedUrl : null,
        openUrl: watchUrl,
        title: data.title || title || "Video",
        author: data.author,
        thumbnail: data.thumbnail || getThumbnailUrl(videoId),
      };
    }
  } catch (error) {
    console.warn("Validation failed, using fallback:", error);
  }
  
  // Ultimate fallback - always provide something
  return {
    ok: true,
    reason: "validation_unavailable",
    embedUrl: null, // Don't embed if we couldn't validate
    openUrl: watchUrl,
    title: title || "Video",
    thumbnail: getThumbnailUrl(videoId),
    note: "Validation unavailable, external link provided",
  };
}

export default function SafeYouTube({ url, title, className = "" }: SafeYouTubeProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    setLoading(true);
    validateVideo(url, title)
      .then((result) => {
        if (mounted) {
          setStatus(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("SafeYouTube validation error:", err);
        if (mounted) {
          // Final ultimate fallback
          const videoId = extractYouTubeId(url);
          setStatus({
            ok: true,
            reason: "error",
            embedUrl: null,
            openUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : url,
            title: title || "Video",
            thumbnail: videoId ? getThumbnailUrl(videoId) : undefined,
            note: "An error occurred",
          });
          setLoading(false);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, [url, title]);

  if (loading || !status) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900/50 rounded-lg border border-zinc-800 p-8 ${className}`}>
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Checking video...</p>
        </div>
      </div>
    );
  }

  // If embeddable and user hasn't clicked yet, show thumbnail
  if (status.embedUrl && !showIframe) {
    return (
      <div className={`relative group ${className}`}>
        <div
          className="relative cursor-pointer rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
          onClick={() => setShowIframe(true)}
        >
          {status.thumbnail && (
            <img
              src={status.thumbnail}
              alt={status.title || "Video thumbnail"}
              className="w-full aspect-video object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 transition-colors shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        {status.title && (
          <div className="mt-2">
            <p className="text-sm font-medium text-zinc-200 line-clamp-2">{status.title}</p>
            {status.author && (
              <p className="text-xs text-zinc-500 mt-1">{status.author}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // If embeddable and user clicked, show iframe
  if (status.embedUrl && showIframe) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative pt-[56.25%] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
          <iframe
            src={status.embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={status.title || "YouTube video"}
          />
        </div>
        {status.title && (
          <div className="mt-2">
            <p className="text-sm font-medium text-zinc-200 line-clamp-2">{status.title}</p>
            {status.author && (
              <p className="text-xs text-zinc-500 mt-1">{status.author}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // NOT embeddable - show clean fallback card with external link
  return (
    <div className={`relative ${className}`}>
      <div className="rounded-lg overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-zinc-800 hover:border-zinc-700 transition-all">
        {/* Thumbnail background */}
        {status.thumbnail && (
          <div className="relative w-full aspect-video bg-zinc-900">
            <img
              src={status.thumbnail}
              alt={status.title || "Video thumbnail"}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          </div>
        )}
        
        {/* Content overlay */}
        <div className="p-6 space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              <Video className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-400 capitalize">
                {status.reason === "private" && "Private Video"}
                {status.reason === "age_restricted" && "Age Restricted"}
                {status.reason === "region_blocked" && "Region Blocked"}
                {status.reason === "embed_disabled" && "Embedding Disabled"}
                {status.reason === "not_found" && "Video Not Found"}
                {status.reason === "shorts" && "YouTube Short"}
                {status.reason === "live" && "Live Stream"}
                {!["private", "age_restricted", "region_blocked", "embed_disabled", "not_found", "shorts", "live"].includes(status.reason) && "Cannot Embed"}
              </span>
            </div>
          </div>
          
          {/* Title */}
          {status.title && (
            <h4 className="text-lg font-semibold text-zinc-100 line-clamp-2">
              {status.title}
            </h4>
          )}
          
          {/* Author */}
          {status.author && (
            <p className="text-sm text-zinc-400">{status.author}</p>
          )}
          
          {/* Note */}
          {status.note && (
            <p className="text-xs text-zinc-500 italic">{status.note}</p>
          )}
          
          {/* Action button */}
          <a
            href={status.openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <ExternalLink className="w-4 h-4" />
            Open on YouTube
          </a>
          
          <p className="text-xs text-zinc-600">
            This video cannot be embedded here, but you can watch it directly on YouTube.
          </p>
        </div>
      </div>
    </div>
  );
}
