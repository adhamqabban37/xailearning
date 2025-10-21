import { describe, it, expect } from "vitest";
import {
  extractYouTubeId,
  normalizeYouTube,
  toEmbedUrl,
  stripTrackingParams,
  upgradeToHttps,
} from "@/lib/urlTools";

describe("urlTools", () => {
  it("extracts ID from watch URLs", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=abc123")).toBe(
      "abc123"
    );
  });
  it("extracts ID from youtu.be URLs", () => {
    expect(extractYouTubeId("https://youtu.be/xyz789")).toBe("xyz789");
  });
  it("extracts ID from shorts URLs", () => {
    expect(extractYouTubeId("https://www.youtube.com/shorts/SHORTS_ID")).toBe(
      "SHORTS_ID"
    );
  });
  it("extracts ID from embed URLs", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/EMBED_ID")).toBe(
      "EMBED_ID"
    );
  });
  it("normalizes to canonical watch URL", () => {
    expect(normalizeYouTube("https://youtu.be/xyz789")).toBe(
      "https://www.youtube.com/watch?v=xyz789"
    );
  });
  it("produces embed URL with params", () => {
    const url = toEmbedUrl("abc123");
    expect(url).toContain("https://www.youtube.com/embed/abc123");
    expect(url).toContain("rel=0");
    expect(url).toContain("modestbranding=1");
  });
  it("strips tracking params", () => {
    const cleaned = stripTrackingParams(
      "https://example.com/page?utm_source=x&si=y&ok=1"
    );
    expect(cleaned).toBe("https://example.com/page?ok=1");
  });
  it("upgrades http to https", () => {
    const up = upgradeToHttps("http://example.com/page");
    expect(up).toBe("https://example.com/page");
  });
});
