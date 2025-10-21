import SafeYouTubePlayer from "@/components/SafeYouTubePlayer";
import { validateYouTubeUrl } from "@/lib/youtube";

export default async function VideoTestPage() {
  // Example: pre-validate videos server-side (optional)
  const testUrls = [
    {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Normal video (watch URL)",
    },
    {
      url: "https://youtu.be/jNQXAC9IVRw",
      title: "Share link (youtu.be)",
    },
    {
      url: "https://www.youtube.com/shorts/2vj37YE4hTA",
      title: "YouTube Short",
    },
    {
      url: "https://www.youtube.com/watch?v=INVALID_ID_12345",
      title: "Invalid video (should fallback)",
    },
  ];

  // Server-side validation (optional - removes need for client oEmbed check)
  const validatedUrls = await Promise.all(
    testUrls.map(async (item) => {
      const validation = await validateYouTubeUrl(item.url);
      return {
        ...item,
        validation,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Safe YouTube Player Demo
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Robust YouTube embeds with validation, error handling, and graceful
            fallbacks. Supports watch links, share links, and Shorts.
          </p>
        </header>

        <div className="space-y-8">
          {validatedUrls.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {item.title}
                </h2>
                {item.validation.valid ? (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                    ✓ Valid
                  </span>
                ) : (
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                    ✗ {item.validation.error}
                  </span>
                )}
              </div>
              <SafeYouTubePlayer
                url={item.url}
                title={item.validation.title || item.title}
              />
              <details className="text-sm text-gray-400">
                <summary className="cursor-pointer hover:text-gray-300">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 rounded text-xs overflow-x-auto">
                  {JSON.stringify(item.validation, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-3">Usage</h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            {`import SafeYouTubePlayer from "@/components/SafeYouTubePlayer";

// Basic usage
<SafeYouTubePlayer
  url="https://www.youtube.com/watch?v=VIDEO_ID"
  title="Video Title"
/>

// With start time
<SafeYouTubePlayer
  url="https://youtu.be/VIDEO_ID"
  startSeconds={42}
  className="max-w-2xl"
/>

// Server-side validation (optional)
import { validateYouTubeUrl } from "@/lib/youtube";

const validation = await validateYouTubeUrl(url);
if (validation.valid) {
  // Render player
}`}
          </pre>
        </div>

        <div className="mt-8 p-6 bg-blue-950/30 border border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">
            ✨ Features
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">→</span>
              <span>
                <strong>URL Normalization:</strong> Handles watch?v=, youtu.be,
                shorts, embed URLs with tracking params
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">→</span>
              <span>
                <strong>oEmbed Validation:</strong> Server-side or client-side
                check before rendering iframe
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">→</span>
              <span>
                <strong>Runtime Error Handling:</strong> Catches Player API
                errors (100/101/150) and shows fallback
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">→</span>
              <span>
                <strong>Graceful Fallback:</strong> Thumbnail + "Watch on
                YouTube" button when embedding fails
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">→</span>
              <span>
                <strong>Loading States:</strong> Spinner while validating, smooth
                transitions
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
