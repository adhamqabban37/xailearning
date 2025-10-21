"use client";

import React, { useState, useEffect, useRef } from "react";
import { extractYouTubeId, toEmbedUrl, normalizeYouTube } from "@/lib/urlTools";
import { getYouTubeErrorMessage } from "@/lib/youtube";

export interface SafeYouTubePlayerProps {
  url: string;
  title?: string;
  startSeconds?: number;
  className?: string;
}

type PlayerState = "loading" | "ready" | "error" | "fallback";

export default function SafeYouTubePlayer({
  url,
  title,
  startSeconds,
  className = "",
}: SafeYouTubePlayerProps) {
  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoId = extractYouTubeId(url);
  const watchUrl = videoId ? normalizeYouTube(url) : url;
  const embedUrl = videoId ? toEmbedUrl(videoId, startSeconds) : null;

  useEffect(() => {
    if (!videoId || !embedUrl) {
      setPlayerState("fallback");
      setErrorMessage("Invalid YouTube URL");
      return;
    }

    // Set high-res thumbnail
    setThumbnailUrl(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);

    // Attempt to validate via client-side oEmbed check
    const validateEmbed = async () => {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
          watchUrl
        )}&format=json`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
          throw new Error(`oEmbed check failed: ${response.status}`);
        }

        // oEmbed successful, mark as ready
        setPlayerState("ready");
      } catch (err: any) {
        // oEmbed failed: video might be private or embedding disabled
        setPlayerState("fallback");
        setErrorMessage("Embedding disabled or video unavailable");
      }
    };

    validateEmbed();

    // Listen for iframe load errors (e.g., network issues)
    const iframe = iframeRef.current;
    if (iframe) {
      const handleError = () => {
        setPlayerState("fallback");
        setErrorMessage("Failed to load video player");
      };
      iframe.addEventListener("error", handleError);
      return () => iframe.removeEventListener("error", handleError);
    }
  }, [url, videoId, embedUrl, watchUrl]);

  // Handle YouTube Player API errors via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // YouTube Player API sends messages with error codes
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.event === "onError" && typeof data.info === "number") {
          const errorCode = data.info;
          setPlayerState("fallback");
          setErrorMessage(getYouTubeErrorMessage(errorCode));
        }
      } catch {
        // Ignore parsing errors
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Fallback card when embedding fails
  if (playerState === "fallback" || !embedUrl) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-lg ${className}`}
      >
        <div className="relative aspect-video bg-gray-900">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title || "YouTube video"}
              className="w-full h-full object-cover opacity-60"
              onError={(e) => {
                // Fallback to medium quality thumbnail
                e.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center px-4">
              <svg
                className="w-16 h-16 mx-auto mb-3 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <p className="text-white text-sm font-medium mb-1">
                {errorMessage || "Video embedding disabled"}
              </p>
              <p className="text-gray-300 text-xs mb-4">
                This video cannot be embedded. Watch it directly on YouTube.
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-800">
          {title && <h3 className="text-white font-semibold mb-2">{title}</h3>}
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  // Loading state
  if (playerState === "loading") {
    return (
      <div
        className={`bg-gray-900 rounded-lg overflow-hidden shadow-lg ${className}`}
      >
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  // Ready state: render iframe
  return (
    <div
      className={`bg-black rounded-lg overflow-hidden shadow-lg ${className}`}
    >
      <div className="aspect-video">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title || "YouTube video"}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          onError={() => {
            setPlayerState("fallback");
            setErrorMessage("Failed to load video player");
          }}
        />
      </div>
    </div>
  );
}
