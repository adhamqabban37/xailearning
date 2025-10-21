"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Youtube, AlertCircle } from "lucide-react";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  watchUrl: string;
}

interface CourseYouTubeVideosProps {
  searchQuery: string;
  maxResults?: number;
}

export default function CourseYouTubeVideos({
  searchQuery,
  maxResults = 6,
}: CourseYouTubeVideosProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      if (!searchQuery) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Fetching YouTube videos for:", searchQuery);

        const response = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(
            searchQuery
          )}&maxResults=${maxResults}`
        );

        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Response error:", errorText);
          throw new Error(
            `Failed to fetch videos: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("✅ Received data:", data);

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.videos || data.videos.length === 0) {
          console.warn("⚠️ No videos returned from API");
        }

        setVideos(data.videos || []);
      } catch (err: any) {
        console.error("❌ Error fetching YouTube videos:", err);
        setError(err.message || "Failed to load videos");
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [searchQuery, maxResults]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Youtube className="w-6 h-6 text-red-500" />
          <h3 className="text-2xl font-bold">Related YouTube Videos</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading videos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Youtube className="w-6 h-6 text-red-500" />
          <h3 className="text-2xl font-bold">Related YouTube Videos</h3>
        </div>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">Error loading videos</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
            <p className="text-xs text-gray-500 mt-2">
              Check browser console (F12) and Network tab for details
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Youtube className="w-6 h-6 text-red-500" />
          <h3 className="text-2xl font-bold">Related YouTube Videos</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <Youtube className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No videos found for "{searchQuery}"</p>
          <p className="text-sm mt-2">
            Check console (F12) for API errors or quota issues
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Youtube className="w-6 h-6 text-red-500" />
        <h3 className="text-2xl font-bold">Related YouTube Videos</h3>
        <span className="ml-auto text-sm text-gray-400">
          {videos.length} videos found
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-700">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(
                    "❌ Failed to load thumbnail:",
                    video.thumbnailUrl
                  );
                  e.currentTarget.src = "/placeholder-video.png";
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-red-600 rounded-full p-3">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-3">
              <h4
                className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition-colors mb-2"
                title={video.title}
              >
                📺 {video.title}
              </h4>
              <p className="text-xs text-gray-400 mb-1">{video.channelTitle}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        💡 Tip: Open browser console (F12) to see API debug logs
      </div>
    </div>
  );
}
