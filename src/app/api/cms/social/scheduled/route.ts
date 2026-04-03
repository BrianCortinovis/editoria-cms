import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { SOCIAL_PLATFORMS } from "@/lib/social/platforms";

const DIRECT_SOCIAL_PLATFORMS = new Set<string>(
  SOCIAL_PLATFORMS.filter((platform) => platform.supportsDirectApi).map((platform) => platform.key),
);

interface NormalizedScheduledPostInput {
  articleId: string;
  platform: string;
  targetLabel: string;
  channelConfig: unknown;
  customText: string | null;
  scheduledAt: string | null;
}

function toIsoDateTime(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

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

  let query = access.tenantClient
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
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

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

  const normalizedPosts: NormalizedScheduledPostInput[] = body.posts.map((post: Record<string, unknown>) => {
    const scheduledAt = toIsoDateTime(post.scheduled_at);
    return {
      articleId: typeof post.article_id === "string" ? post.article_id : "",
      platform: typeof post.platform === "string" ? post.platform : "",
      targetLabel: typeof post.target_label === "string" ? post.target_label : "",
      channelConfig: post.channel_config ?? null,
      customText: typeof post.custom_text === "string" ? post.custom_text : null,
      scheduledAt,
    };
  });

  if (normalizedPosts.some((post) => !post.articleId || !post.scheduledAt || !DIRECT_SOCIAL_PLATFORMS.has(post.platform))) {
    return NextResponse.json(
      { error: "Each post requires a valid article_id, direct platform and scheduled_at" },
      { status: 400 },
    );
  }

  const now = Date.now();
  if (normalizedPosts.some((post) => new Date(post.scheduledAt as string).getTime() <= now)) {
    return NextResponse.json(
      { error: "scheduled_at must be in the future" },
      { status: 400 },
    );
  }

  const articleIds = [...new Set(normalizedPosts.map((post) => post.articleId))];
  const { data: articles, error: articlesError } = await access.tenantClient
    .from("articles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .in("id", articleIds);

  if (articlesError) {
    return NextResponse.json({ error: articlesError.message }, { status: 500 });
  }

  if ((articles?.length ?? 0) !== articleIds.length) {
    return NextResponse.json(
      { error: "One or more articles do not belong to this tenant or are not published" },
      { status: 400 },
    );
  }

  const rows = normalizedPosts.map((post) => ({
    tenant_id: tenantId,
    article_id: post.articleId,
    platform: post.platform,
    target_label: post.targetLabel,
    channel_config: post.channelConfig,
    custom_text: post.customText,
    scheduled_at: post.scheduledAt as string,
    status: "pending" as const,
    created_by: access.user.id,
  }));

  const { data, error } = await access.tenantClient
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
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  if (!body?.tenant_id || !body?.id) {
    return NextResponse.json({ error: "tenant_id and id required" }, { status: 400 });
  }

  const tenantId = String(body.tenant_id);
  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  const allowedFields: Record<string, unknown> = {};
  if (body.scheduled_at !== undefined) {
    const scheduledAt = toIsoDateTime(body.scheduled_at);
    if (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now()) {
      return NextResponse.json({ error: "scheduled_at must be a future datetime" }, { status: 400 });
    }
    allowedFields.scheduled_at = scheduledAt;
  }
  if (typeof body.platform === "string") {
    if (!DIRECT_SOCIAL_PLATFORMS.has(body.platform)) {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
    }
    allowedFields.platform = body.platform;
  }
  if (typeof body.target_label === "string") allowedFields.target_label = body.target_label;
  if (typeof body.custom_text === "string") allowedFields.custom_text = body.custom_text;
  if (body.channel_config !== undefined) allowedFields.channel_config = body.channel_config;
  if (body.status === "canceled") allowedFields.status = "canceled";
  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await access.tenantClient
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
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  if (!body?.tenant_id || !body?.id) {
    return NextResponse.json({ error: "tenant_id and id required" }, { status: 400 });
  }

  const tenantId = String(body.tenant_id);
  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  const { error } = await access.tenantClient
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
