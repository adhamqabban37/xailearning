import { NextRequest, NextResponse } from "next/server";
import { CatalogItem } from "@/types/catalog";
import { validateItems } from "@/lib/server/validateItems";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CatalogItem[] = Array.isArray(body?.items) ? body.items : [];
    const results = await validateItems(items);
    return NextResponse.json({ items: results });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
