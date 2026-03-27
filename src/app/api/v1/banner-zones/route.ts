import { NextResponse } from "next/server";
import { readPublishedJson } from "@/lib/publish/storage";
import type { PublishedBannerZonesDocument } from "@/lib/publish/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const publishedBannerZones = await readPublishedJson<PublishedBannerZonesDocument>(
    `sites/${encodeURIComponent(tenantSlug)}/banner-zones.json`,
  );

  if (!publishedBannerZones?.zones) {
    return NextResponse.json({ error: "Banner zones not found" }, { status: 404 });
  }

  return NextResponse.json(
    { zones: publishedBannerZones.zones },
    {
      headers: {
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
