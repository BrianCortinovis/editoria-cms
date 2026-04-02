import { NextResponse } from "next/server";
import { readPublishedJson } from "@/lib/publish/storage";
import { getPublicApiCorsHeaders } from "@/lib/security/cors";
import type { PublishedManifest, PublishedCategoryDocument } from "@/lib/publish/types";
import { resolvePublicTenantContext } from "@/lib/site/runtime";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const manifest = await readPublishedJson<PublishedManifest>(`sites/${encodeURIComponent(tenantSlug)}/manifest.json`);
  if (manifest) {
    const categoryDocuments = await Promise.all(
      Object.values(manifest.categories || {}).map((path) => readPublishedJson<PublishedCategoryDocument>(path))
    );

    return NextResponse.json({
      categories: categoryDocuments
        .filter((entry): entry is PublishedCategoryDocument => Boolean(entry?.category))
        .map((entry, index) => ({
          ...entry.category,
          sort_order: index,
        })),
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        ...getPublicApiCorsHeaders(request),
      },
    });
  }

  const context = await resolvePublicTenantContext(tenantSlug);
  if (!context) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { tenant, runtimeClient } = context;

  const { data, error } = await runtimeClient
    .from("categories")
    .select("id, name, slug, description, color, sort_order")
    .eq("tenant_id", tenant.id)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      ...getPublicApiCorsHeaders(request),
    },
  });
}
