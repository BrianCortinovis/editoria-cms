import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeCss, sanitizeHtml } from "@/lib/security/html";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";

const CONFIG_EDIT_ROLES = new Set(["super_admin", "chief_editor"]);

async function getTenantMembership(tenantId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, role: null };
  }

  const { data: membership } = await supabase
    .from("user_tenants")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();

  return { supabase, user, role: membership?.role || null };
}

// GET: Fetch site config for a tenant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const { supabase, user } = await getTenantMembership(tenantId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json();
  const { tenant_id, theme, navigation, footer, global_css, global_head, favicon_url, og_defaults } = body;

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const { supabase, user, role } = await getTenantMembership(tenant_id);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!role || !CONFIG_EDIT_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (theme !== undefined) update.theme = theme;
  if (navigation !== undefined) update.navigation = navigation;
  if (footer !== undefined) update.footer = footer;
  if (global_css !== undefined) update.global_css = sanitizeCss(global_css);
  if (global_head !== undefined) update.global_head = sanitizeHtml(global_head);
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

  await writeActivityLog({
    tenantId: tenant_id,
    userId: user.id,
    action: "site_config.update",
    entityType: "site_config",
    details: { updatedKeys: Object.keys(update) },
  });

  return NextResponse.json({ config: data });
}
