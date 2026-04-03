import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import {
  CMS_VIEW_ROLES,
  CMS_EDITOR_ROLES,
  requireTenantAccess,
} from "@/lib/cms/tenant-access";
import {
  getArticleTranslations,
  linkArticleTranslation,
  unlinkArticleTranslation,
} from "@/lib/multilingual/service";

/**
 * GET /api/cms/translations?tenant_id=...&article_id=...
 * Returns all translations linked to the given article.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const articleId = searchParams.get("article_id");

  if (!tenantId || !articleId) {
    return NextResponse.json(
      { error: "tenant_id and article_id required" },
      { status: 400 },
    );
  }

  const access = await requireTenantAccess(tenantId, CMS_VIEW_ROLES);
  if ("error" in access) return access.error;

  try {
    const translations = await getArticleTranslations(
      access.tenantClient,
      articleId,
    );
    return NextResponse.json({ translations });
  } catch (err) {
    console.error("translations.get failed:", err);
    return NextResponse.json(
      { error: "Unable to load translations" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/cms/translations
 * Body: { tenant_id, source_article_id, source_language, target_article_id, target_language }
 * Links two articles as translations of each other.
 */
export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tenantId = body.tenant_id as string | undefined;
  const sourceArticleId = body.source_article_id as string | undefined;
  const sourceLanguage = body.source_language as string | undefined;
  const targetArticleId = body.target_article_id as string | undefined;
  const targetLanguage = body.target_language as string | undefined;

  if (
    !tenantId ||
    !sourceArticleId ||
    !sourceLanguage ||
    !targetArticleId ||
    !targetLanguage
  ) {
    return NextResponse.json(
      {
        error:
          "tenant_id, source_article_id, source_language, target_article_id, and target_language required",
      },
      { status: 400 },
    );
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  const result = await linkArticleTranslation(
    access.serviceClient,
    tenantId,
    sourceArticleId,
    sourceLanguage,
    targetArticleId,
    targetLanguage,
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ groupId: result.groupId });
}

/**
 * DELETE /api/cms/translations?tenant_id=...&article_id=...
 * Removes an article from its translation group.
 */
export async function DELETE(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const articleId = searchParams.get("article_id");

  if (!tenantId || !articleId) {
    return NextResponse.json(
      { error: "tenant_id and article_id required" },
      { status: 400 },
    );
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) return access.error;

  try {
    await unlinkArticleTranslation(access.serviceClient, articleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("translations.delete failed:", err);
    return NextResponse.json(
      { error: "Unable to remove translation link" },
      { status: 500 },
    );
  }
}
