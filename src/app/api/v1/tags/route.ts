import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { readPublishedJson } from "@/lib/publish/storage";
import { getPublicApiCorsHeaders } from "@/lib/security/cors";
import type { PublishedTagsDocument } from "@/lib/publish/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const publishedTags = await readPublishedJson<PublishedTagsDocument>(`sites/${encodeURIComponent(tenantSlug)}/tags.json`);
  if (publishedTags?.tags) {
    return NextResponse.json({ tags: publishedTags.tags }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        ...getPublicApiCorsHeaders(request),
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

  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tags: data }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      ...getPublicApiCorsHeaders(request),
    },
  });
}
