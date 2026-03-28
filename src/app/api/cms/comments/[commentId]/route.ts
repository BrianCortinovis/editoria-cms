import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { commentId } = await params;
  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  const status = typeof body?.status === "string" ? body.status : null;
  if (!tenantId || !status) {
    return NextResponse.json({ error: "tenant_id and status required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const { data, error } = await access.sessionClient
    .from("article_comments")
    .update({
      status,
      published_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("tenant_id", tenantId)
    .eq("id", commentId)
    .select("id, status")
    .single();

  if (error || !data) {
    console.error("comment.update failed:", error?.message);
    return NextResponse.json({ error: "Unable to update comment" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "comment.update_status",
    entityType: "article_comment",
    entityId: commentId,
    details: { status },
  });

  return NextResponse.json({ comment: data });
}
