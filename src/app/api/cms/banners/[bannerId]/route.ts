import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { sanitizeExternalUrl, sanitizeHtml } from "@/lib/security/html";
import { CMS_BANNER_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { z } from "zod";

const bannerPatchSchema = z.object({
  tenant_id: z.string().uuid("tenant_id deve essere un UUID valido"),
  name: z.string().min(1).transform((v) => v.trim()).optional(),
  position: z.enum(["sidebar", "header", "footer", "inline", "popup", "interstitial"]).optional(),
  type: z.enum(["image", "html", "video"]).optional(),
  image_url: z.string().nullable().optional(),
  html_content: z.string().nullable().optional(),
  link_url: z.string().nullable().optional(),
  target_categories: z.array(z.string()).optional(),
  target_device: z.enum(["all", "desktop", "mobile", "tablet"]).optional(),
  weight: z.number().int().min(1).max(100).optional(),
  advertiser_id: z.string().uuid().nullable().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().optional(),
}).passthrough();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bannerId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { bannerId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bannerPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const tenantId = parsed.data.tenant_id;

  const access = await requireTenantAccess(tenantId, CMS_BANNER_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.position !== undefined) patch.position = parsed.data.position;
  if (parsed.data.type !== undefined) patch.type = parsed.data.type;
  if ("image_url" in parsed.data) patch.image_url = sanitizeExternalUrl(parsed.data.image_url, true);
  if ("html_content" in parsed.data) patch.html_content = typeof parsed.data.html_content === "string" ? sanitizeHtml(parsed.data.html_content) : null;
  if ("link_url" in parsed.data) patch.link_url = sanitizeExternalUrl(parsed.data.link_url, true);
  if (parsed.data.target_categories !== undefined) patch.target_categories = parsed.data.target_categories;
  if (parsed.data.target_device !== undefined) patch.target_device = parsed.data.target_device;
  if (parsed.data.weight !== undefined) patch.weight = parsed.data.weight;
  if ("advertiser_id" in parsed.data) patch.advertiser_id = parsed.data.advertiser_id || null;
  if ("starts_at" in parsed.data) patch.starts_at = parsed.data.starts_at || null;
  if ("ends_at" in parsed.data) patch.ends_at = parsed.data.ends_at || null;
  if (parsed.data.is_active !== undefined) patch.is_active = parsed.data.is_active;

  const { data, error } = await access.sessionClient
    .from("banners")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", bannerId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("banner.update failed:", error?.message);
    return NextResponse.json({ error: "Unable to update banner" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "banner.update",
    entityType: "banner",
    entityId: bannerId,
    details: { updatedKeys: Object.keys(patch) },
  });
  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ banner: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bannerId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { bannerId } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_BANNER_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.sessionClient.from("banners").delete().eq("tenant_id", tenantId).eq("id", bannerId);
  if (error) {
    console.error("banner.delete failed:", error.message);
    return NextResponse.json({ error: "Unable to delete banner" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "banner.delete",
    entityType: "banner",
    entityId: bannerId,
  });
  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ ok: true });
}
