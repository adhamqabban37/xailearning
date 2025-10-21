# AI Learner Platform Frontend

## YouTube & Link Summaries + Validation

This project now includes:

- Collapsible summaries for each YouTube video and external link using semantic <details>/<summary>.
- Robust YouTube embedding with URL normalization and oEmbed validation (supports watch, youtu.be, shorts, embed).
- Link hygiene and validation (HTTPS upgrade, tracking param stripping, HEAD/GET validation with redirects).
- Broken-link handling with badges and safe fallbacks.

### Data model

```
type CatalogItem = {
  id: string;
  type: 'video' | 'link';
  title: string;
  url: string;
  summary?: string;        // what it’s about
  benefit?: string;        // how it helps
  normalizedUrl?: string;  // filled by validator
  broken?: boolean;        // set by validator
  lastCheckedAt?: string;
};
```

### Utilities

- `lib/urlTools.ts` – URL parsing and normalization helpers.

### Server validation API

- `POST /api/validate-links` – accepts `{ items: CatalogItem[] }`, returns updated items with `normalizedUrl`, `broken`, and `lastCheckedAt`.
- `POST /api/recheck` – loads `data/catalog.sample.json`, re-validates, and writes back.

### UI Components

- `components/cards/VideoCard.tsx` – Renders title, details summary, and an iframe (when valid). Broken videos show a badge and an “Open on YouTube” link instead of an iframe.
- `components/cards/LinkCard.tsx` – Renders title with external link, details summary, and an optional “Try mirror” button when broken.

### Page Integration

- `app/learn/page.tsx` – Loads sample catalog and validates items server-side when stale (> 7 days).

### Accessibility

- Keyboard navigable summaries (native <summary> supports Enter/Space).
- Respects prefers-reduced-motion for iframes via a `motion-reduce` class.

### Migration note: run validation locally

Optional: trigger a manual recheck of the sample catalog.

```powershell
curl -X POST http://localhost:3001/api/recheck
```

Or validate an ad-hoc list of items:

```powershell
curl -X POST http://localhost:3001/api/validate-links -H "content-type: application/json" -d '{
  "items": [
    { "id": "1", "type": "video", "title": "T", "url": "https://youtu.be/abc123" },
    { "id": "2", "type": "link", "title": "L", "url": "http://example.com?a=1&utm_source=x" }
  ]
}'
```

Note: Ensure the app is running on `http://localhost:3001` (dev) and set `NEXT_PUBLIC_BASE_URL` accordingly in `next.config.js` or your environment.

### Tests

Run unit tests:

```powershell
npm run test
```

Covered cases:

- YouTube ID extraction for watch, youtu.be, shorts, embed.
- Embed URL formatting with required parameters.
- Tracking parameter stripping and HTTP→HTTPS upgrade.
- Validation logic for success, failure, HEAD→GET fallback.

## YouTube Data API search (server-only)

We integrate with YouTube Data API v3 securely on the server. Provide your API key in a server-only environment file (don’t prefix with NEXT_PUBLIC):

```
# .env.local (server only)
YOUTUBE_API_KEY=YOUR_API_KEY
```

- Server util: `lib/server/youtubeData.ts` – typed `searchVideos(query, { maxResults, pageToken })` that returns titles, thumbnails, and `nextPageToken`.
- API route: `GET /api/youtube/search?q=QUERY&maxResults=10&pageToken=...` – proxies server util without exposing your key to the client.
- Demo page: `app/youtube-demo/page.tsx` – client UI (`components/YoutubeSearchClient.tsx`) calls the API and displays results with pagination.

### Features

- **Search YouTube videos**: Search for educational content directly within the platform
- **Video Collection**: Save videos to your personal collection using localStorage
- **Safe Player**: Play videos inline with SafeYouTubePlayer and graceful fallback
- **Add/Remove**: Easily manage your collection with intuitive UI buttons
- **Persistent Storage**: Your collection persists across sessions via localStorage

### Navigation

The app now includes a global navigation bar with quick access to:

- Home: Main upload and prompt interface
- Learn: Resource catalog with validated links
- YouTube Search: Search and collect videos
- Video Test: Demo page for SafeYouTubePlayer

Example request:

```powershell
curl "http://localhost:3001/api/youtube/search?q=python%20tutorial&maxResults=6"
```

Response shape:

```
{
  "videos": [
    {
      "id": "VIDEO_ID",
      "title": "...",
      "thumbnailUrl": "https://i.ytimg.com/...",
      "channelTitle": "...",
      "publishedAt": "2024-01-01T00:00:00Z",
      "watchUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
    }
  ],
  "nextPageToken": "..."
}
```
