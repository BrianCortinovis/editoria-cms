import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { sanitizeExternalUrl, sanitizeHtml } from "@/lib/security/html";
import { CMS_BANNER_ROLES, CMS_VIEW_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { z } from "zod";

const bannerPositions = ["sidebar", "header", "footer", "inline", "popup", "interstitial"] as const;
const bannerTypes = ["image", "html", "video"] as const;
const bannerDevices = ["all", "desktop", "mobile", "tablet"] as const;

const bannerCreateSchema = z.object({
  tenant_id: z.string().uuid("tenant_id must be a valid UUID"),
  name: z.string().min(1, "name is required").transform((v) => v.trim()),
  position: z.enum(bannerPositions).optional().default("sidebar"),
  type: z.enum(bannerTypes).optional().default("image"),
  image_url: z.string().optional().nullable(),
  html_content: z.string().optional().nullable(),
  link_url: z.string().optional().nullable(),
  target_categories: z.array(z.string()).optional().default([]),
  target_device: z.enum(bannerDevices).optional().default("all"),
  weight: z.number().int().min(1).max(100).optional().default(1),
  advertiser_id: z.string().uuid().optional().nullable(),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional().default(false),
}).passthrough();

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
    console.error("banners.list failed:", bannersRes.error?.message || advertisersRes.error?.message || categoriesRes.error?.message);
    return NextResponse.json({ error: "Unable to load banners" }, { status: 500 });
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
  const parsed = bannerCreateSchema.safeParse(body);
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

  // Validate advertiser belongs to same tenant
  if (parsed.data.advertiser_id) {
    const { data: advertiser } = await access.serviceClient
      .from("advertisers")
      .select("id")
      .eq("id", parsed.data.advertiser_id)
      .eq("tenant_id", tenantId)
      .single();
    if (!advertiser) {
      return NextResponse.json({ error: "Inserzionista non valido o non appartenente a questo tenant" }, { status: 400 });
    }
  }

  const payload = {
    tenant_id: tenantId,
    name: parsed.data.name,
    position: parsed.data.position,
    type: parsed.data.type,
    image_url: sanitizeExternalUrl(parsed.data.image_url, true),
    html_content: typeof parsed.data.html_content === "string" ? sanitizeHtml(parsed.data.html_content) : null,
    link_url: sanitizeExternalUrl(parsed.data.link_url, true),
    target_categories: parsed.data.target_categories,
    target_device: parsed.data.target_device,
    weight: parsed.data.weight,
    advertiser_id: parsed.data.advertiser_id || null,
    starts_at: parsed.data.starts_at || null,
    ends_at: parsed.data.ends_at || null,
    is_active: parsed.data.is_active,
  };

  const { data, error } = await access.sessionClient.from("banners").insert(payload).select("*").single();
  if (error || !data) {
    console.error("banner.create failed:", error?.message);
    return NextResponse.json({ error: "Unable to create banner" }, { status: 500 });
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
