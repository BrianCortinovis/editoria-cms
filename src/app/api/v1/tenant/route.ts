import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("name, slug, domain, logo_url, theme_config, settings")
    .eq("slug", tenantSlug)
    .single();

  if (error || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({ tenant }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
