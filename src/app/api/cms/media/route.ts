import { NextResponse } from "next/server";
import { requireTenantAccess, CMS_VIEW_ROLES } from "@/lib/cms/tenant-access";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const search = (searchParams.get("search") || "").trim();

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_VIEW_ROLES);
  if ("error" in access) {
    return access.error;
  }

  let query = access.tenantClient
    .from("media")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (search) {
    query = query.ilike("original_filename", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("media.list failed:", error.message);
    return NextResponse.json({ error: "Unable to load media" }, { status: 500 });
  }

  return NextResponse.json({ media: data || [] });
}
