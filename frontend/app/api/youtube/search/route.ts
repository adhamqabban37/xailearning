import { NextRequest, NextResponse } from "next/server";
import { searchVideos } from "@/lib/server/youtubeData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || searchParams.get("query") || "";
  const max = searchParams.get("maxResults");
  const pageToken = searchParams.get("pageToken") || undefined;

  try {
    const data = await searchVideos(q, {
      maxResults: max ? parseInt(max, 10) : 10,
      pageToken,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    // Don't leak secrets; provide user-friendly message
    const message = err?.message?.includes("YouTube API key not configured")
      ? "Server is missing YouTube API key. Set YOUTUBE_API_KEY in environment."
      : "Failed to fetch YouTube data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const q = body.q || body.query || "";
  const max = typeof body.maxResults === "number" ? body.maxResults : undefined;
  const pageToken = body.pageToken || undefined;

  try {
    const data = await searchVideos(q, { maxResults: max, pageToken });
    return NextResponse.json(data);
  } catch (err: any) {
    const message = err?.message?.includes("YouTube API key not configured")
      ? "Server is missing YouTube API key. Set YOUTUBE_API_KEY in environment."
      : "Failed to fetch YouTube data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
