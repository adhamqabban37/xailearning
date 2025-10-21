import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateItems } from "@/lib/server/validateItems";
import type { CatalogItem } from "@/types/catalog";

const okResponse = (url: string) =>
  new Response("", {
    status: 200,
    headers: { "Content-Type": "application/json" },
    url,
  });
const notFound = new Response("", { status: 404 });

describe("validateItems", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates youtube via oembed", async () => {
    const items: CatalogItem[] = [
      { id: "1", type: "video", title: "t", url: "https://youtu.be/abc123" },
    ];
    const mockFetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input: any) => {
        const u = typeof input === "string" ? input : input.url;
        if (u.startsWith("https://www.youtube.com/oembed"))
          return okResponse(u);
        return okResponse(u);
      });
    const out = await validateItems(items);
    expect(out[0].broken).toBeFalsy();
    expect(out[0].normalizedUrl).toContain("/embed/abc123");
    mockFetch.mockRestore();
  });

  it("marks broken when oembed fails", async () => {
    const items: CatalogItem[] = [
      { id: "1", type: "video", title: "t", url: "https://youtu.be/xxx" },
    ];
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(notFound);
    const out = await validateItems(items);
    expect(out[0].broken).toBeTruthy();
    mockFetch.mockRestore();
  });

  it("validates links using HEAD then GET fallback", async () => {
    const items: CatalogItem[] = [
      {
        id: "2",
        type: "link",
        title: "l",
        url: "http://example.com/path?utm_source=x",
      },
    ];
    const mockFetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input: any, init?: any) => {
        if (init?.method === "HEAD") return new Response("", { status: 405 });
        return okResponse("https://example.com/path");
      });
    const out = await validateItems(items);
    expect(out[0].broken).toBeFalsy();
    expect(out[0].url).toBe("https://example.com/path");
    mockFetch.mockRestore();
  });
});
