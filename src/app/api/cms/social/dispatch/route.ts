import { NextResponse } from "next/server";
import { CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { autoPostToSocial, buildArticleUrl } from "@/lib/social/post-service";
import { normalizeSocialAutoConfig } from "@/lib/social/platforms";

/**
 * POST /api/cms/social/dispatch
 * Trigger social auto-posting for a just-published article.
 * Called by the article editor after a status change to "published".
 *
 * Body: { tenant_id, article_id }
 *
 * This endpoint is non-blocking for the caller — it returns immediately
 * and the social posting happens in the background of this request.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.tenant_id || !body.article_id) {
    return NextResponse.json(
      { error: "tenant_id e article_id richiesti" },
      { status: 400 },
    );
  }

  const tenantId = String(body.tenant_id);
  const articleId = String(body.article_id);

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  // Load article data
  const { data: article, error: articleError } = await access.serviceClient
    .from("articles")
    .select("id, slug, title, summary, cover_image_url, status")
    .eq("id", articleId)
    .eq("tenant_id", tenantId)
    .single();

  if (articleError || !article) {
    return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });
  }

  if (article.status !== "published") {
    return NextResponse.json(
      { error: "L'articolo non e' pubblicato" },
      { status: 400 },
    );
  }

  // Load tenant for slug and social config
  const { data: tenant } = await access.serviceClient
    .from("tenants")
    .select("slug, settings")
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
  }

  const settings = (tenant.settings ?? {}) as Record<string, unknown>;
  const moduleConfig = (settings.module_config as Record<string, unknown>) ?? {};
  const socialCfg = normalizeSocialAutoConfig(moduleConfig.social_auto);
  const articleUrl = buildArticleUrl(socialCfg.siteUrl, tenant.slug, article.slug);

  // Dispatch social posting — uses service client for audit logging
  const results = await autoPostToSocial(access.serviceClient, tenantId, {
    title: article.title || "",
    summary: article.summary || "",
    url: articleUrl,
    imageUrl: article.cover_image_url || undefined,
  });

  return NextResponse.json({ ok: true, results });
}
