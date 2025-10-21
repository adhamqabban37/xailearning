"use client";

import React, { useState } from "react";
import { Plus, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface ResultItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  watchUrl: string;
}

export default function YoutubeSearchClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=9`
      );
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setResults(json.videos || []);
      setNextToken(json.nextPageToken || null);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch YouTube data");
    } finally {
      setLoading(false);
    }
  };

  const onLoadMore = async () => {
    if (!nextToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(
          query
        )}&maxResults=9&pageToken=${encodeURIComponent(nextToken)}`
      );
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setResults((prev) => [...prev, ...(json.videos || [])]);
      setNextToken(json.nextPageToken || null);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch YouTube data");
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = (video: ResultItem) => {
    // Get existing collection from localStorage
    const existing = localStorage.getItem("youtubeCollection");
    const collection = existing ? JSON.parse(existing) : [];

    // Check if already saved
    if (collection.some((v: ResultItem) => v.id === video.id)) {
      toast.error("Video already in your collection");
      return;
    }

    // Add to collection
    collection.push(video);
    localStorage.setItem("youtubeCollection", JSON.stringify(collection));

    // Update UI state
    setSavedVideos((prev) => new Set(prev).add(video.id));
    toast.success(`Added "${video.title}" to collection`);
  };

  const removeFromCollection = (videoId: string) => {
    const existing = localStorage.getItem("youtubeCollection");
    const collection = existing ? JSON.parse(existing) : [];

    const filtered = collection.filter((v: ResultItem) => v.id !== videoId);
    localStorage.setItem("youtubeCollection", JSON.stringify(filtered));

    setSavedVideos((prev) => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
    toast.success("Removed from collection");
  };

  // Load saved videos on mount
  React.useEffect(() => {
    const existing = localStorage.getItem("youtubeCollection");
    if (existing) {
      const collection = JSON.parse(existing);
      setSavedVideos(new Set(collection.map((v: ResultItem) => v.id)));
    }
  }, []);

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search YouTube videos..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search YouTube"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || !query.trim()}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((v) => {
          const isSaved = savedVideos.has(v.id);
          return (
            <div
              key={v.id}
              className="rounded-lg border border-gray-200 hover:shadow-sm transition p-2 relative group"
            >
              <a
                href={v.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={v.thumbnailUrl}
                  alt={v.title}
                  className="w-full aspect-video object-cover rounded"
                />
              </a>
              <div className="mt-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    {v.title}
                  </h3>
                  <div className="flex gap-1">
                    <a
                      href={v.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-gray-100 text-gray-600"
                      title="Watch on YouTube"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() =>
                        isSaved
                          ? removeFromCollection(v.id)
                          : addToCollection(v)
                      }
                      className={`p-1 rounded transition ${
                        isSaved
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "hover:bg-gray-100 text-gray-600"
                      }`}
                      title={
                        isSaved ? "Remove from collection" : "Add to collection"
                      }
                    >
                      {isSaved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">{v.channelTitle}</p>
                <p className="text-xs text-gray-500">
                  {new Date(v.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {results.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={!nextToken || loading}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50"
          >
            {nextToken
              ? loading
                ? "Loading..."
                : "Load more"
              : "No more results"}
          </button>
        </div>
      )}
    </div>
  );
}
