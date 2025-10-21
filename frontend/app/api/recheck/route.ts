import { NextResponse } from "next/server";
import { CatalogItem } from "@/types/catalog";
import { POST as validate } from "@/app/api/validate-links/route";
import path from "path";
import { promises as fs } from "fs";

const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.sample.json");

export async function POST() {
  // In a real app, pull from DB; here we use a JSON sample file
  const raw = await fs.readFile(CATALOG_PATH, "utf-8");
  const items: CatalogItem[] = JSON.parse(raw);
  const res = await validate(
    new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ items }),
    }) as any
  );
  const json = await (res as any).json();
  const updated: CatalogItem[] = json.items;
  await fs.writeFile(CATALOG_PATH, JSON.stringify(updated, null, 2));
  return NextResponse.json({ ok: true, count: updated.length });
}

export async function GET() {
  // Allow manual trigger via GET as well
  return POST();
}
