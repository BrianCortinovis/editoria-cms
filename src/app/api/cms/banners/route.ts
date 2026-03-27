import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { sanitizeExternalUrl, sanitizeHtml } from "@/lib/security/html";
import { CMS_BANNER_ROLES, CMS_VIEW_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_VIEW_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const [bannersRes, advertisersRes, categoriesRes] = await Promise.all([
    access.sessionClient.from("banners").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    access.sessionClient.from("advertisers").select("id, name").eq("tenant_id", tenantId).order("name"),
    access.sessionClient.from("categories").select("id, name, slug").eq("tenant_id", tenantId).order("sort_order"),
  ]);

  if (bannersRes.error || advertisersRes.error || categoriesRes.error) {
    return NextResponse.json({ error: bannersRes.error?.message || advertisersRes.error?.message || categoriesRes.error?.message || "Unable to load banners" }, { status: 500 });
  }

  return NextResponse.json({
    banners: bannersRes.data || [],
    advertisers: advertisersRes.data || [],
    categories: categoriesRes.data || [],
  });
}

export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  if (!tenantId || typeof body?.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "tenant_id and name required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_BANNER_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const payload = {
    tenant_id: tenantId,
    name: body.name.trim(),
    position: String(body.position || "sidebar"),
    type: String(body.type || "image"),
    image_url: sanitizeExternalUrl(body.image_url, true),
    html_content: typeof body.html_content === "string" ? sanitizeHtml(body.html_content) : null,
    link_url: sanitizeExternalUrl(body.link_url, true),
    target_categories: Array.isArray(body.target_categories) ? body.target_categories.map(String) : [],
    target_device: String(body.target_device || "all"),
    weight: Number(body.weight || 1),
    advertiser_id: typeof body.advertiser_id === "string" && body.advertiser_id ? body.advertiser_id : null,
    starts_at: typeof body.starts_at === "string" && body.starts_at ? body.starts_at : null,
    ends_at: typeof body.ends_at === "string" && body.ends_at ? body.ends_at : null,
    is_active: Boolean(body.is_active),
  };

  const { data, error } = await access.sessionClient.from("banners").insert(payload).select("*").single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to create banner" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "banner.create",
    entityType: "banner",
    entityId: data.id,
    details: { position: data.position, type: data.type },
  });
  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);

  return NextResponse.json({ banner: data });
}
