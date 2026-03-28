import { NextResponse } from "next/server";
import { CMS_VIEW_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

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

  const { data, error } = await access.sessionClient
    .from("article_comments")
    .select("id, author_name, author_email, body, status, created_at, articles(title, slug)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("comments.list failed:", error.message);
    return NextResponse.json({ error: "Unable to load comments" }, { status: 500 });
  }

  return NextResponse.json({ comments: data || [] });
}
