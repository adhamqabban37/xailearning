"use client";

import YoutubeSearchClient from "@/components/YoutubeSearchClient";
import SafeYouTubePlayer from "@/components/SafeYouTubePlayer";
import { useState, useEffect } from "react";
import { Trash2, Play } from "lucide-react";
import toast from "react-hot-toast";

interface SavedVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  watchUrl: string;
}

export default function Page() {
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SavedVideo | null>(null);
  const [showCollection, setShowCollection] = useState(false);

  useEffect(() => {
    loadCollection();
  }, []);

  const loadCollection = () => {
    const existing = localStorage.getItem("youtubeCollection");
    if (existing) {
      setSavedVideos(JSON.parse(existing));
    }
  };

  const removeVideo = (videoId: string) => {
    const filtered = savedVideos.filter((v) => v.id !== videoId);
    setSavedVideos(filtered);
    localStorage.setItem("youtubeCollection", JSON.stringify(filtered));
    toast.success("Removed from collection");

    if (selectedVideo?.id === videoId) {
      setSelectedVideo(null);
    }
  };

  const clearCollection = () => {
    if (confirm("Are you sure you want to clear your entire collection?")) {
      localStorage.removeItem("youtubeCollection");
      setSavedVideos([]);
      setSelectedVideo(null);
      toast.success("Collection cleared");
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">YouTube Search & Collection</h1>
        <p className="text-sm text-gray-600 mb-4">
          Search YouTube videos and build your learning resource collection.
          Your API key stays secure on the server.
        </p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowCollection(false)}
            className={`px-4 py-2 rounded-lg transition ${
              !showCollection
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Search Videos
          </button>
          <button
            onClick={() => {
              setShowCollection(true);
              loadCollection();
            }}
            className={`px-4 py-2 rounded-lg transition ${
              showCollection
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            My Collection ({savedVideos.length})
          </button>
        </div>
      </div>

      {!showCollection ? (
        <YoutubeSearchClient />
      ) : (
        <div className="space-y-6">
          {savedVideos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Your collection is empty</p>
              <p className="text-sm mt-2">
                Search for videos and click the + button to add them here
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Your Collection ({savedVideos.length} videos)
                </h2>
                <button
                  onClick={clearCollection}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>

              {selectedVideo && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedVideo.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedVideo.channelTitle}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <SafeYouTubePlayer url={selectedVideo.watchUrl} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedVideos.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-lg border border-gray-200 hover:shadow-sm transition p-2"
                  >
                    <div className="relative">
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        className="w-full aspect-video object-cover rounded"
                      />
                      <button
                        onClick={() => setSelectedVideo(v)}
                        className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center rounded"
                      >
                        <Play className="w-12 h-12 text-white" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                          {v.title}
                        </h3>
                        <button
                          onClick={() => removeVideo(v.id)}
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                          title="Remove from collection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {v.channelTitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(v.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
