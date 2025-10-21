export type CatalogItemType = "video" | "link";

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  title: string;
  url: string;
  summary?: string; // what it's about
  benefit?: string; // how it helps
  normalizedUrl?: string; // filled by validator for videos
  broken?: boolean; // set by validator
  lastCheckedAt?: string;
  // Optional mirrors for links
  mirrors?: string[];
}
