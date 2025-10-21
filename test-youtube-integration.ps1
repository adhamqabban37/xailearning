# YouTube API Test Script
# Run this to verify your YouTube API integration

Write-Host "🧪 Testing YouTube API Integration..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envPath = "c:\Users\Tyson\Desktop\ai learn\frontend\.env.local"
if (Test-Path $envPath) {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
    
    # Check if API key is set (without exposing it)
    $content = Get-Content $envPath -Raw
    if ($content -match "YOUTUBE_API_KEY=.+") {
        Write-Host "✅ YOUTUBE_API_KEY is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ YOUTUBE_API_KEY not found in .env.local" -ForegroundColor Red
        Write-Host "   Add: YOUTUBE_API_KEY=your_actual_key" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "   Create it from .env.local.example" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔍 Checking if dev server is running..." -ForegroundColor Cyan

# Test if server is responding
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method HEAD -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Dev server is running on port 3001" -ForegroundColor Green
} catch {
    Write-Host "❌ Dev server not responding on port 3001" -ForegroundColor Red
    Write-Host "   Start it with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📡 Testing YouTube API endpoint..." -ForegroundColor Cyan

# Test the API endpoint
try {
    $apiUrl = "http://localhost:3001/api/youtube/search?q=AI%20learning&maxResults=3"
    $apiResponse = Invoke-RestMethod -Uri $apiUrl -Method GET -ErrorAction Stop
    
    if ($apiResponse.error) {
        Write-Host "❌ API returned error: $($apiResponse.error)" -ForegroundColor Red
        exit 1
    }
    
    if ($apiResponse.videos -and $apiResponse.videos.Count -gt 0) {
        Write-Host "✅ API is working! Retrieved $($apiResponse.videos.Count) videos" -ForegroundColor Green
        Write-Host ""
        Write-Host "📺 Sample video:" -ForegroundColor Cyan
        $video = $apiResponse.videos[0]
        Write-Host "   Title: $($video.title)" -ForegroundColor White
        Write-Host "   Channel: $($video.channelTitle)" -ForegroundColor Gray
        Write-Host "   URL: $($video.watchUrl)" -ForegroundColor Blue
    } else {
        Write-Host "⚠️  API responded but returned no videos" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Check server logs and Network tab" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 All tests passed! YouTube integration is working." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Upload a PDF to create a course" -ForegroundColor White
Write-Host "   2. Open the course page" -ForegroundColor White
Write-Host "   3. Scroll down to see Related YouTube Videos" -ForegroundColor White
Write-Host ""
Write-Host "🐛 Debug tips:" -ForegroundColor Cyan
Write-Host "   - Open browser console (F12) to see API logs" -ForegroundColor White
Write-Host "   - Check Network tab for request details" -ForegroundColor White
Write-Host "   - Look for messages starting with 🔍 📡 ✅ or ❌" -ForegroundColor White
