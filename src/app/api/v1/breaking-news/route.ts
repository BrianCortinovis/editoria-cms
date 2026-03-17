import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
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

  const { data, error } = await supabase
    .from("breaking_news")
    .select("id, text, link_url, priority, created_at")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ breaking_news: data }, {
    headers: {
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
