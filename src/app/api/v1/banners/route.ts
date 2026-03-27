import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { readPublishedJson } from "@/lib/publish/storage";
import type { PublishedBannersDocument } from "@/lib/publish/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const position = searchParams.get("position");
  const device = searchParams.get("device") || "all";

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const publishedBanners = await readPublishedJson<PublishedBannersDocument>(`sites/${encodeURIComponent(tenantSlug)}/banners.json`);
  if (publishedBanners?.banners) {
    const now = Date.now();
    const filtered = publishedBanners.banners.filter((banner) => {
      if (position && banner.position !== position) return false;
      const targetDevice = String(banner.target_device || "all");
      if (device !== "all" && targetDevice !== "all" && targetDevice !== device) return false;
      const startsAt = typeof banner.starts_at === "string" ? new Date(banner.starts_at).getTime() : null;
      const endsAt = typeof banner.ends_at === "string" ? new Date(banner.ends_at).getTime() : null;
      if (startsAt && !Number.isNaN(startsAt) && startsAt > now) return false;
      if (endsAt && !Number.isNaN(endsAt) && endsAt < now) return false;
      return true;
    });

    const selected = weightedSelect(filtered as Array<{ weight: number } & Record<string, unknown>>);
    return NextResponse.json({ banners: selected }, {
      headers: {
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  let query = supabase
    .from("banners")
    .select("id, name, position, type, image_url, html_content, link_url, target_device, weight")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`);

  if (position) {
    query = query.eq("position", position);
  }

  if (device !== "all") {
    query = query.or(`target_device.eq.all,target_device.eq.${device}`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Weighted random selection if multiple banners for same position
  const selected = data ? weightedSelect(data as Array<{ weight: number } & Record<string, unknown>>) : [];

  return NextResponse.json({ banners: selected }, {
    headers: {
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function weightedSelect<T extends { weight: number }>(items: T[]): T[] {
  if (items.length <= 1) return items;

  // Group by position, select one per position based on weight
  const byPosition: Record<string, T[]> = {};
  for (const item of items) {
    const pos = (item as Record<string, unknown>).position as string;
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(item);
  }

  const result: T[] = [];
  for (const group of Object.values(byPosition)) {
    const totalWeight = group.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;
    for (const banner of group) {
      random -= banner.weight;
      if (random <= 0) {
        result.push(banner);
        break;
      }
    }
  }

  return result;
}
