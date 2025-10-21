# YouTube Videos in Course Page - Setup & Testing Guide

## 🎯 What You'll See

When you open a course page, you'll now see a **"Related YouTube Videos"** section displaying:

- 📺 **6 YouTube videos** related to your course topic
- 🖼️ **Video thumbnails** (high quality)
- **Video titles** with channel names
- **Publish dates**
- **Clickable links** that open videos in new tabs
- **Hover effects** with play button overlay

## 🚀 Setup Instructions

### Step 1: Get Your YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select project: **ai-learn-9cf34** (already activated)
3. Click **"Create Credentials"** → **"API Key"**
4. Copy your new API key
5. (Optional but recommended) Click "Restrict Key" and limit to:
   - **Application restrictions**: HTTP referrers or None
   - **API restrictions**: YouTube Data API v3

### Step 2: Configure Environment

Create `.env.local` file in the `frontend` folder:

```bash
# Navigate to frontend folder
cd "c:\Users\Tyson\Desktop\ai learn\frontend"

# Copy example file
Copy-Item .env.local.example .env.local

# Edit .env.local and add your real API key
notepad .env.local
```

Replace `your_youtube_api_key_here` with your actual key:

```env
YOUTUBE_API_KEY=AIzaSyC_YOUR_ACTUAL_KEY_HERE
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

**⚠️ Important**:

- Never commit `.env.local` to git (it's already in .gitignore)
- Never prefix with `NEXT_PUBLIC_` (keeps it server-only)

### Step 3: Restart Development Server

```powershell
# Stop current server (Ctrl+C)
# Start fresh
npm run dev
```

## 🧪 Testing Checklist

### Test 1: API Connection

```powershell
# Test the API endpoint directly
curl "http://localhost:3001/api/youtube/search?q=AI%20learning&maxResults=5"
```

**✅ Expected**: JSON response with 5 videos  
**❌ If broken**: Check error message in response

### Test 2: Course Page Integration

1. **Upload a PDF** and generate a course
2. **Open the course page** (e.g., `/course/[id]`)
3. **Scroll down** below the course modules
4. **Look for** "Related YouTube Videos" section

### Test 3: Video Display

✅ **Success criteria**:

- Section header with YouTube icon
- Grid of 6 video cards
- Each card shows:
  - Thumbnail image (not broken)
  - Video title with 📺 emoji
  - Channel name
  - Publish date
  - Hover effect with play button

### Test 4: Console Debugging

Open browser console (F12) and look for these logs:

```
🔍 Fetching YouTube videos for: [Course Title] AI learning tutorial
📡 Response status: 200
✅ Received data: {videos: Array(6), ...}
```

### Test 5: Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter: `search`
4. Reload course page
5. Look for request to `/api/youtube/search`

**✅ Success**: Status 200, Preview shows videos array  
**❌ Failure**: See status code and error message

## 🐛 Troubleshooting Guide

### Issue: Blank Section (No Videos)

**Check Console**:

```
⚠️ No videos returned from API
```

**Solution**: API key works but query returned nothing. Try different course title.

---

### Issue: "Server is missing YouTube API key"

**Console shows**:

```
❌ Error: Server is missing YouTube API key
```

**Solution**:

1. Create `.env.local` file
2. Add `YOUTUBE_API_KEY=your_key`
3. Restart dev server (Ctrl+C, then `npm run dev`)

---

### Issue: 403 Forbidden

**Network tab shows**: `403 Forbidden`

**Possible causes**:

1. **Invalid API key**

   - Verify key in Google Cloud Console
   - Make sure it's copied correctly (no extra spaces)

2. **API not enabled**

   - Go to [APIs & Services](https://console.cloud.google.com/apis/library)
   - Search "YouTube Data API v3"
   - Click "Enable"

3. **Key restrictions too strict**
   - Check API key restrictions
   - Temporarily set to "None" for testing

---

### Issue: 429 Quota Exceeded

**Console/Network shows**: `429 Too Many Requests` or "Quota exceeded"

**Explanation**: Free tier = 10,000 quota units/day. Each search = ~100 units.

**Solutions**:

1. **Wait 24 hours** for quota reset
2. **Reduce maxResults**: Change from 6 to 3
3. **Cache results**: Store in localStorage
4. **Upgrade plan** (if needed for production)

---

### Issue: 400 Bad Request

**Check**:

- Query string formatting
- Special characters in course title

**Fix**: The component already encodes the query, but verify in Network tab.

---

### Issue: Thumbnails not loading

**Console shows**: `❌ Failed to load thumbnail: [URL]`

**Causes**:

- YouTube thumbnail URL changed/invalid
- CORS issue (rare)
- Network connectivity

**The component handles this**: Falls back to placeholder

---

### Issue: Videos load but clicking doesn't work

**Check**:

1. Browser popup blocker
2. Console for JavaScript errors
3. `target="_blank"` attribute present

**Solution**: The component uses proper `a` tags with `rel="noopener noreferrer"`

## 📊 Expected API Response Format

```json
{
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Introduction to AI Learning",
      "description": "Learn the basics...",
      "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "channelTitle": "AI Education Channel",
      "publishedAt": "2024-01-15T10:30:00Z",
      "watchUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
    // ... 5 more videos
  ],
  "nextPageToken": "CAUQAA"
}
```

## 🎨 UI Behavior

### Loading State

- Shows spinner with "Loading videos..." message
- Section header visible immediately

### Error State

- Red alert box with error icon
- User-friendly error message
- Debug instructions (check console/network tab)

### Empty State

- Message: "No videos found for [query]"
- Suggestion to check console

### Success State

- Grid layout: 1 column (mobile), 2 (tablet), 3 (desktop)
- Hover effects: darkens thumbnail, shows play button
- Click: Opens in new tab

## 🔍 Debug Commands

### Check API key is loaded

```powershell
# In PowerShell (be careful not to expose in public terminal)
Get-Content "c:\Users\Tyson\Desktop\ai learn\frontend\.env.local"
```

### Test API directly with curl

```powershell
curl "http://localhost:3001/api/youtube/search?q=python%20tutorial&maxResults=3"
```

### Check build includes component

```powershell
cd "c:\Users\Tyson\Desktop\ai learn\frontend"
npm run build
# Look for /course/[id] route size increased
```

### Verify GCP project

```powershell
gcloud config get-value project
# Should output: ai-learn-9cf34
```

## 📝 Component Location

**Component**: `frontend/components/CourseYouTubeVideos.tsx`  
**Used in**: `frontend/app/course/[id]/page.tsx`  
**API Route**: `frontend/app/api/youtube/search/route.ts`  
**Server Util**: `frontend/lib/server/youtubeData.ts`

## 🎯 Test Scenarios

### Scenario 1: New Course Upload

1. Upload PDF with title "Machine Learning Basics"
2. Generate course
3. Open course page
4. Expect: 6 ML-related videos

### Scenario 2: Different Topics

- Try different course titles:
  - "Python Programming"
  - "Web Development"
  - "Data Science"
- Each should show topic-relevant videos

### Scenario 3: Network Issues

1. Disconnect internet
2. Reload course page
3. Expect: Error state with clear message

### Scenario 4: No API Key

1. Remove `YOUTUBE_API_KEY` from `.env.local`
2. Restart server
3. Reload course page
4. Expect: "Server is missing YouTube API key" error

## ✅ Success Checklist

After setup, verify:

- [ ] `.env.local` file exists with API key
- [ ] Dev server restarted after adding key
- [ ] Course page loads without errors
- [ ] YouTube section appears below modules
- [ ] 6 videos display with thumbnails
- [ ] Video titles visible (with 📺 emoji)
- [ ] Channel names shown
- [ ] Hover shows play button overlay
- [ ] Clicking opens YouTube in new tab
- [ ] Console logs show successful API calls
- [ ] Network tab shows 200 status for `/api/youtube/search`
- [ ] No errors in console
- [ ] No CORS errors
- [ ] No 403/429/400 errors

## 🚨 Quick Diagnosis

**Nothing shows up?**
→ Check console (F12) for error messages

**Error in red box?**
→ Read the message, likely API key issue

**403 error?**
→ API key invalid or API not enabled

**429 error?**
→ Quota exceeded, wait 24h or reduce requests

**Blank/loading forever?**
→ Check Network tab for failed requests

## 📚 Additional Resources

- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [Get API Key](https://console.cloud.google.com/apis/credentials?project=ai-learn-9cf34)
- [API Quotas](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas?project=ai-learn-9cf34)

## 🎉 Expected Result (Success)

When everything works, you'll see:

```
┌─────────────────────────────────────────────┐
│ 🎥 Related YouTube Videos        (6 videos) │
├─────────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐                │
│  │ 📺  │  │ 📺  │  │ 📺  │                │
│  │VIDEO│  │VIDEO│  │VIDEO│                │
│  └─────┘  └─────┘  └─────┘                │
│  ┌─────┐  ┌─────┐  ┌─────┐                │
│  │ 📺  │  │ 📺  │  │ 📺  │                │
│  │VIDEO│  │VIDEO│  │VIDEO│                │
│  └─────┘  └─────┘  └─────┘                │
└─────────────────────────────────────────────┘
```

Each card clickable → Opens YouTube in new tab ✅
