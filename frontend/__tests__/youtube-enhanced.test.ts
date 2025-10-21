import { describe, it, expect } from "vitest";
import { extractYouTubeId, toEmbedUrl } from "@/lib/urlTools";

describe("Enhanced YouTube URL utilities", () => {
  describe("extractYouTubeId", () => {
    it("extracts from standard watch URLs", () => {
      expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      expect(extractYouTubeId("https://youtube.com/watch?v=abc123&t=42")).toBe("abc123");
    });

    it("extracts from youtu.be share links", () => {
      expect(extractYouTubeId("https://youtu.be/jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
      expect(extractYouTubeId("https://youtu.be/xyz789?si=tracking123")).toBe("xyz789");
    });

    it("extracts from Shorts URLs", () => {
      expect(extractYouTubeId("https://www.youtube.com/shorts/2vj37YE4hTA")).toBe("2vj37YE4hTA");
      expect(extractYouTubeId("https://youtube.com/shorts/SHORT_ID?feature=share")).toBe("SHORT_ID");
    });

    it("extracts from embed URLs", () => {
      expect(extractYouTubeId("https://www.youtube.com/embed/VIDEO_ID")).toBe("VIDEO_ID");
      expect(extractYouTubeId("https://www.youtube-nocookie.com/embed/NOCOOKIE_ID")).toBe("NOCOOKIE_ID");
    });

    it("extracts from legacy /v/ URLs", () => {
      expect(extractYouTubeId("https://www.youtube.com/v/LEGACY_ID")).toBe("LEGACY_ID");
    });

    it("handles URLs with tracking params", () => {
      const urlWithTracking = "https://www.youtube.com/watch?v=TEST123&utm_source=share&si=abc&list=playlist";
      expect(extractYouTubeId(urlWithTracking)).toBe("TEST123");
    });

    it("returns null for invalid URLs", () => {
      expect(extractYouTubeId("https://example.com/video")).toBeNull();
      expect(extractYouTubeId("not a url")).toBeNull();
      expect(extractYouTubeId("https://youtube.com/")).toBeNull();
    });

    it("handles mobile URLs", () => {
      expect(extractYouTubeId("https://m.youtube.com/watch?v=MOBILE_ID")).toBe("MOBILE_ID");
    });
  });

  describe("toEmbedUrl", () => {
    it("generates clean embed URLs with safe params", () => {
      const url = toEmbedUrl("TEST_VIDEO_ID");
      expect(url).toBe("https://www.youtube.com/embed/TEST_VIDEO_ID?rel=0&modestbranding=1&controls=1");
    });

    it("includes start parameter when provided", () => {
      const url = toEmbedUrl("VIDEO_ID", 42);
      expect(url).toContain("start=42");
      expect(url).toContain("rel=0");
      expect(url).toContain("modestbranding=1");
      expect(url).toContain("controls=1");
    });

    it("floors fractional start seconds", () => {
      const url = toEmbedUrl("VIDEO_ID", 42.7);
      expect(url).toContain("start=42");
    });
  });
});
