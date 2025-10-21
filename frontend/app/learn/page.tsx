import { promises as fs } from "fs";
import path from "path";
import { CatalogItem } from "@/types/catalog";
import VideoCard from "@/components/cards/VideoCard";
import LinkCard from "@/components/cards/LinkCard";
import { validateItems } from "@/lib/server/validateItems";

async function loadCatalog(): Promise<CatalogItem[]> {
  const file = path.join(process.cwd(), "data", "catalog.sample.json");
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw);
}

async function validateIfStale(items: CatalogItem[]): Promise<CatalogItem[]> {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const stale = items.some(
    (i) =>
      !i.lastCheckedAt || now - new Date(i.lastCheckedAt).getTime() > sevenDays
  );
  if (!stale) return items;
  // Call validator directly on the server to avoid network calls during build/SSR
  return validateItems(items);
}

export default async function LearnPage() {
  const items = await loadCatalog();
  const validated = await validateIfStale(items);
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Learn</h1>
      <p className="text-gray-600 mb-6">
        Verified videos and links with quick summaries.
      </p>
      <div className="grid grid-cols-1 gap-6">
        {validated.map((item) =>
          item.type === "video" ? (
            <VideoCard key={item.id} item={item} />
          ) : (
            <LinkCard key={item.id} item={item} />
          )
        )}
      </div>
      <form action="/api/recheck" method="post">
        <button type="submit" className="btn-secondary">
          Admin: Recheck links
        </button>
      </form>
    </div>
  );
}
