import { NextResponse } from "next/server";
import { CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

/**
 * GET /api/cms/social/scheduled?tenant_id=...&article_id=...
 * Lista post programmati. Se article_id presente, filtra per articolo.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  const articleId = searchParams.get("article_id");

  let query = access.serviceClient
    .from("scheduled_social_posts")
    .select("*, articles!inner(title, slug, cover_image_url)")
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: true });

  if (articleId) {
    query = query.eq("article_id", articleId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data });
}

/**
 * POST /api/cms/social/scheduled
 * Crea uno o piu' post programmati.
 * Body: { tenant_id, posts: [{ article_id, platform, target_label?, channel_config?, custom_text?, scheduled_at }] }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.tenant_id || !Array.isArray(body.posts) || body.posts.length === 0) {
    return NextResponse.json(
      { error: "tenant_id and posts[] required" },
      { status: 400 },
    );
  }

  const tenantId = String(body.tenant_id);
  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  const rows = body.posts.map((p: Record<string, unknown>) => ({
    tenant_id: tenantId,
    article_id: String(p.article_id),
    platform: String(p.platform),
    target_label: typeof p.target_label === "string" ? p.target_label : "",
    channel_config: p.channel_config ?? null,
    custom_text: typeof p.custom_text === "string" ? p.custom_text : null,
    scheduled_at: String(p.scheduled_at),
    status: "pending" as const,
    created_by: access.user.id,
  }));

  const { data, error } = await access.serviceClient
    .from("scheduled_social_posts")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, posts: data }, { status: 201 });
}

/**
 * PUT /api/cms/social/scheduled
 * Aggiorna un post programmato (es: cambia orario, annulla).
 * Body: { tenant_id, id, ...updates }
 */
export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.tenant_id || !body?.id) {
    return NextResponse.json({ error: "tenant_id and id required" }, { status: 400 });
  }

  const tenantId = String(body.tenant_id);
  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  const allowedFields: Record<string, unknown> = {};
  if (typeof body.scheduled_at === "string") allowedFields.scheduled_at = body.scheduled_at;
  if (typeof body.platform === "string") allowedFields.platform = body.platform;
  if (typeof body.target_label === "string") allowedFields.target_label = body.target_label;
  if (typeof body.custom_text === "string") allowedFields.custom_text = body.custom_text;
  if (body.channel_config !== undefined) allowedFields.channel_config = body.channel_config;
  if (body.status === "canceled") allowedFields.status = "canceled";
  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await access.serviceClient
    .from("scheduled_social_posts")
    .update(allowedFields)
    .eq("id", body.id)
    .eq("tenant_id", tenantId)
    .in("status", ["pending"]) // solo post pending modificabili
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, post: data });
}

/**
 * DELETE /api/cms/social/scheduled
 * Elimina un post programmato (solo se pending).
 * Body: { tenant_id, id }
 */
export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.tenant_id || !body?.id) {
    return NextResponse.json({ error: "tenant_id and id required" }, { status: 400 });
  }

  const tenantId = String(body.tenant_id);
  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  const { error } = await access.serviceClient
    .from("scheduled_social_posts")
    .delete()
    .eq("id", body.id)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "failed", "canceled"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
