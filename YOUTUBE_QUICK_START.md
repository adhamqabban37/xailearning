# Course Page YouTube Integration - Quick Start

## 🎯 What This Does

Automatically displays 6 relevant YouTube videos on every course page, related to the course topic.

## ⚡ Quick Setup (3 steps)

### 1. Get YouTube API Key

```
https://console.cloud.google.com/apis/credentials?project=ai-learn-9cf34
→ Create Credentials → API Key → Copy it
```

### 2. Create .env.local

```powershell
cd frontend
Copy-Item .env.local.example .env.local
notepad .env.local
```

Add your key:

```
YOUTUBE_API_KEY=AIzaSyC_YOUR_ACTUAL_KEY_HERE
```

### 3. Restart Dev Server

```powershell
npm run dev
```

## ✅ Test It

### Automated Test

```powershell
.\test-youtube-integration.ps1
```

### Manual Test

1. Upload a PDF → Generate course
2. Open course page
3. Scroll down → See "Related YouTube Videos"
4. Should show 6 videos with thumbnails

### API Test

```powershell
curl "http://localhost:3001/api/youtube/search?q=AI%20learning&maxResults=5"
```

## 🐛 Common Issues

| Issue                    | Solution                                |
| ------------------------ | --------------------------------------- |
| "API key not configured" | Add key to `.env.local`, restart server |
| 403 Forbidden            | Invalid key or API not enabled          |
| 429 Quota exceeded       | Wait 24h (free tier limit)              |
| Blank section            | Check console (F12) for errors          |

## 📁 What Was Added

- `components/CourseYouTubeVideos.tsx` - Video display component
- `app/course/[id]/page.tsx` - Integrated into course page
- `.env.local.example` - Environment template

## 🎨 Features

- ✅ Automatic video search based on course title
- ✅ 6 videos per course (configurable)
- ✅ High-quality thumbnails
- ✅ Click to open in new tab
- ✅ Hover effects with play button
- ✅ Error handling with clear messages
- ✅ Console logging for debugging

## 🔍 Debug

Open browser console (F12) and look for:

```
🔍 Fetching YouTube videos for: [Course Title]
📡 Response status: 200
✅ Received data: {videos: Array(6)}
```

## 📚 Full Documentation

See `YOUTUBE_COURSE_INTEGRATION_GUIDE.md` for complete setup, troubleshooting, and API details.
