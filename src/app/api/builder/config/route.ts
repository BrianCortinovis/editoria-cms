import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET: Fetch site config for a tenant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (error && error.code === "PGRST116") {
    // No config yet — create default
    const { data: created, error: createError } = await supabase
      .from("site_config")
      .insert({ tenant_id: tenantId })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    return NextResponse.json({ config: created });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}

// PUT: Update site config
export async function PUT(request: Request) {
  const body = await request.json();
  const { tenant_id, theme, navigation, footer, global_css, global_head, favicon_url, og_defaults } = body;

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const update: Record<string, unknown> = {};
  if (theme !== undefined) update.theme = theme;
  if (navigation !== undefined) update.navigation = navigation;
  if (footer !== undefined) update.footer = footer;
  if (global_css !== undefined) update.global_css = global_css;
  if (global_head !== undefined) update.global_head = global_head;
  if (favicon_url !== undefined) update.favicon_url = favicon_url;
  if (og_defaults !== undefined) update.og_defaults = og_defaults;

  const { data, error } = await supabase
    .from("site_config")
    .update(update)
    .eq("tenant_id", tenant_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}
