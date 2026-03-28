import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveEditorialAutomationRule } from "@/lib/editorial/automation";
import {
  buildPlacementExpiry,
  isPlacementActive,
  normalizePlacementDisplayMode,
} from "@/lib/editorial/placements";
import { triggerPublish } from "@/lib/publish/runner";
import { NextRequest, NextResponse } from "next/server";

const ARTICLE_ASSIGNMENT_EDITOR_ROLES = new Set(["admin", "super_admin", "chief_editor", "editor"]);

async function getArticleTenantAccess(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  articleId: string,
  userId: string,
) {
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, tenant_id")
    .eq("id", articleId)
    .single();

  if (articleError || !article) {
    return { error: NextResponse.json({ error: "Article not found" }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from("user_tenants")
    .select("role")
    .eq("user_id", userId)
    .eq("tenant_id", article.tenant_id)
    .single();

  if (!membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { article, membership, error: null };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: articleId } = await params;
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getArticleTenantAccess(supabase, articleId, user.id);
    if (access.error) {
      return access.error;
    }

    let assignmentResponse: {
      data: Array<Record<string, unknown>> | null;
      error: { code?: string | null } | null;
    } = await supabase
      .from("slot_assignments")
      .select("slot_id, pin_order, display_mode, expires_at, assigned_at, layout_slots(slot_key, label, placement_duration_hours)")
      .eq("article_id", articleId)
      .eq("tenant_id", access.article.tenant_id)
      .order("pin_order", { ascending: true })
      .limit(10);

    if (assignmentResponse.error?.code === "42703") {
      assignmentResponse = await supabase
        .from("slot_assignments")
        .select("slot_id, pin_order, assigned_at, layout_slots(slot_key, label)")
        .eq("article_id", articleId)
        .eq("tenant_id", access.article.tenant_id)
        .order("pin_order", { ascending: true })
        .limit(10);
    }

    const data = assignmentResponse.data;

    const activeAssignment = (data || []).find((assignment) =>
      isPlacementActive(typeof assignment.expires_at === "string" ? assignment.expires_at : null)
    ) || null;
    if (!activeAssignment) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      ...activeAssignment,
      display_mode: normalizePlacementDisplayMode(activeAssignment.display_mode),
    });
  } catch (error) {
    console.error("Error fetching slot assignment:", error);
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: articleId } = await params;
  const body = await request.json();
  let slotId = typeof body?.slot_id === "string" ? body.slot_id : null;
  let displayMode = normalizePlacementDisplayMode(body?.display_mode);
  const categoryIds = Array.isArray(body?.category_ids)
    ? body.category_ids.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    : [];
  const tagIds = Array.isArray(body?.tag_ids)
    ? body.tag_ids.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    : [];

  const supabase = await createServerSupabaseClient();

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const access = await getArticleTenantAccess(supabase, articleId, user.id);
    if (access.error) {
      return access.error;
    }
    if (!ARTICLE_ASSIGNMENT_EDITOR_ROLES.has(access.membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!slotId && categoryIds.length > 0 && tagIds.length > 0) {
      const { data: siteConfig } = await supabase
        .from("site_config")
        .select("theme")
        .eq("tenant_id", access.article.tenant_id)
        .maybeSingle();

      const automationRule = resolveEditorialAutomationRule({
        categoryIds,
        tagIds,
        config: ((siteConfig?.theme as Record<string, unknown> | null)?.editorialAutomation || null),
      });

      if (automationRule?.homepageSlotId) {
        slotId = automationRule.homepageSlotId;
        displayMode = automationRule.displayMode;
      }
    }

    // If slot_id is null, delete existing assignment
    if (!slotId) {
      await supabase
        .from("slot_assignments")
        .delete()
        .eq("article_id", articleId)
        .eq("tenant_id", access.article.tenant_id);
      try {
        await triggerPublish(access.article.tenant_id, [{ type: "full_rebuild" }], user.id);
        return NextResponse.json({ success: true, resolved_slot_id: null });
      } catch (publishError) {
        console.error("Publish refresh failed after article assignment removal:", publishError);
        return NextResponse.json({ success: true, publishWarning: true, resolved_slot_id: null }, { status: 202 });
      }
    }

    let slotResponse = await supabase
      .from("layout_slots")
      .select("id, content_type, assignment_mode, placement_duration_hours, layout_templates!inner(tenant_id)")
      .eq("id", slotId)
      .single();

    const migrationMissing = slotResponse.error?.code === "42703";
    if (migrationMissing) {
      slotResponse = await supabase
        .from("layout_slots")
        .select("id, content_type, assignment_mode, layout_templates!inner(tenant_id)")
        .eq("id", slotId)
        .single();
    }

    const { data: slot, error: slotError } = slotResponse;

    const slotTemplates = slot?.layout_templates as
      | { tenant_id: string }
      | Array<{ tenant_id: string }>
      | null
      | undefined;
    const slotTenantId = Array.isArray(slotTemplates)
      ? slotTemplates[0]?.tenant_id
      : slotTemplates?.tenant_id;

    if (
      slotError ||
      !slot ||
      slot.content_type !== "articles" ||
      !["manual", "mixed"].includes(slot.assignment_mode ?? "") ||
      slotTenantId !== access.article.tenant_id
    ) {
      return NextResponse.json({ error: "Invalid slot for this article" }, { status: 400 });
    }

    // Delete any existing assignment for this article
    await supabase
      .from("slot_assignments")
      .delete()
      .eq("article_id", articleId)
      .eq("tenant_id", access.article.tenant_id);

    // Get max pin_order for this slot to insert new one at the end
    const { data: maxRow } = await supabase
      .from("slot_assignments")
      .select("pin_order", { count: "exact" })
      .eq("slot_id", slotId)
      .order("pin_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxRow?.pin_order ?? -1) + 1;
    const assignedAt = new Date();
    const expiresAt = buildPlacementExpiry(
      migrationMissing ? null : ((slot as { placement_duration_hours?: number | null })?.placement_duration_hours ?? null),
      assignedAt
    );

    // Insert new assignment
    let insertResponse;
    if (migrationMissing) {
      insertResponse = await supabase
        .from("slot_assignments")
        .insert({
          slot_id: slotId,
          article_id: articleId,
          tenant_id: access.article.tenant_id,
          assigned_by: user.id,
          pin_order: nextOrder,
        })
        .select()
        .single();
    } else {
      insertResponse = await supabase
        .from("slot_assignments")
        .insert({
          slot_id: slotId,
          article_id: articleId,
          tenant_id: access.article.tenant_id,
          assigned_by: user.id,
          pin_order: nextOrder,
          display_mode: displayMode,
          assigned_at: assignedAt.toISOString(),
          expires_at: expiresAt,
        })
        .select()
        .single();
    }

    const { data, error } = insertResponse;

    if (error) throw error;

    try {
      await triggerPublish(access.article.tenant_id, [{ type: "full_rebuild" }], user.id);
      return NextResponse.json({ ...data, resolved_slot_id: slotId, resolved_display_mode: displayMode });
    } catch (publishError) {
      console.error("Publish refresh failed after article assignment update:", publishError);
      return NextResponse.json({ ...data, publishWarning: true, resolved_slot_id: slotId, resolved_display_mode: displayMode }, { status: 202 });
    }
  } catch (error) {
    console.error("Error managing slot assignment:", error);
    return NextResponse.json({ error: "Failed to manage assignment" }, { status: 500 });
  }
}
