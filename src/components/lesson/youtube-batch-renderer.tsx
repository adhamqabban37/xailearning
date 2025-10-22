"use client";

import { useState } from "react";
import { YouTubeEmbed } from "./youtube-embed";
import { Loader2, FileText, Video } from "lucide-react";

interface VideoItem {
  url: string;
  title?: string;
  context?: string;
}

interface YouTubeBatchRendererProps {
  videos: VideoItem[];
  title?: string;
  description?: string;
}

/**
 * YouTubeBatchRenderer
 * 
 * Production-ready component for rendering multiple YouTube videos with bulletproof fallbacks.
 * Handles all edge cases: deleted, private, age-restricted, region-locked, shorts, live, etc.
 * 
 * Features:
 * - Automatic validation via oEmbed + YouTube Data API
 * - Clean fallback UI for unavailable videos
 * - Lazy rendering for performance (renders visible videos first)
 * - Shows thumbnails and metadata even when embedding fails
 * - Direct YouTube link fallback for all blocked videos
 * - Mobile and desktop responsive
 * 
 * Usage:
 * ```tsx
 * const videos = [
 *   { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Example Video" },
 *   { url: "https://youtu.be/9bZkp7q19f0", title: "Another Video" },
 * ];
 * 
 * <YouTubeBatchRenderer videos={videos} title="Course Videos" />
 * ```
 */
export function YouTubeBatchRenderer({
  videos,
  title,
  description,
}: YouTubeBatchRendererProps) {
  const [visibleCount, setVisibleCount] = useState(Math.min(5, videos.length));
  const hasMore = visibleCount < videos.length;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, videos.length));
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="w-full rounded-lg border border-dashed bg-muted/30 p-8 text-center">
        <Video className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No videos to display</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Video className="w-4 h-4" />
        <span>
          {videos.length} video{videos.length !== 1 ? "s" : ""} total
        </span>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 gap-6">
        {videos.slice(0, visibleCount).map((video, index) => (
          <div key={`${video.url}-${index}`} className="space-y-2">
            {video.context && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-muted-foreground">{video.context}</p>
              </div>
            )}
            <YouTubeEmbed url={video.url} title={video.title} />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Loader2 className="w-4 h-4" />
            Load More Videos ({videos.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for extracting YouTube URLs from text content (e.g., parsed PDF)
 * 
 * Usage:
 * ```tsx
 * const extractedVideos = useExtractYouTubeUrls(pdfText);
 * <YouTubeBatchRenderer videos={extractedVideos} />
 * ```
 */
export function useExtractYouTubeUrls(text: string): VideoItem[] {
  const youtubeRegex = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)[\w-]+/g;
  const matches = text.match(youtubeRegex) || [];
  
  // Deduplicate
  const uniqueUrls = Array.from(new Set(matches));
  
  return uniqueUrls.map((url) => ({
    url,
    title: undefined, // Will be fetched from API
    context: undefined,
  }));
}

/**
 * Example usage component showing all features
 */
export function YouTubeBatchRendererExample() {
  // Example: Mix of working, deleted, private, age-restricted, and shorts videos
  const exampleVideos: VideoItem[] = [
    {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Working Video Example",
      context: "From PDF page 1: Introduction section",
    },
    {
      url: "https://www.youtube.com/watch?v=INVALID_ID_123",
      title: "Deleted Video Example",
      context: "From PDF page 2: This video no longer exists",
    },
    {
      url: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      title: "Shorts Example",
      context: "From PDF page 3: YouTube Shorts are not embeddable",
    },
    {
      url: "https://youtu.be/9bZkp7q19f0",
      title: "Short Link Format",
      context: "From PDF page 4: Alternative URL format",
    },
  ];

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <YouTubeBatchRenderer
        videos={exampleVideos}
        title="Course Video Library"
        description="All videos extracted from your PDF, with automatic fallback for unavailable content."
      />
    </div>
  );
}
