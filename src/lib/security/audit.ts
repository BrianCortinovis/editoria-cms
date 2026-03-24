import { createServiceRoleClient } from "@/lib/supabase/server";

interface ActivityLogInput {
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}

interface PageAuditInput {
  pageId: string;
  tenantId: string;
  changedBy: string;
  action: string;
  changes: Record<string, unknown>;
}

export async function writeActivityLog(input: ActivityLogInput) {
  try {
    const supabase = await createServiceRoleClient();
    await supabase.from("activity_log").insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId || null,
      details: input.details || {},
    });
  } catch (error) {
    console.warn("Failed to write activity log", error);
  }
}

export async function writePageAuditLog(input: PageAuditInput) {
  try {
    const supabase = await createServiceRoleClient();
    await supabase.from("page_audit_log").insert({
      page_id: input.pageId,
      tenant_id: input.tenantId,
      action: input.action,
      changes: input.changes,
      changed_by: input.changedBy,
    });
  } catch (error) {
    console.warn("Failed to write page audit log", error);
  }
}
