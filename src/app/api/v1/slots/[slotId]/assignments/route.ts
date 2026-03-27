import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildPlacementExpiry,
  isPlacementActive,
  normalizePlacementDisplayMode,
} from "@/lib/editorial/placements";
import { triggerPublish } from "@/lib/publish/runner";
import { NextRequest, NextResponse } from "next/server";

const SLOT_ASSIGNMENT_EDITOR_ROLES = new Set(["admin", "super_admin", "chief_editor", "editor"]);

async function getSlotTenantAccess(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, slotId: string, userId: string) {
  const { data: slot, error: slotError } = await supabase
    .from("layout_slots")
    .select("id, template_id, placement_duration_hours")
    .eq("id", slotId)
    .single();

  const migrationMissing = slotError?.code === "42703";
  if (migrationMissing) {
    const fallbackSlot = await supabase
      .from("layout_slots")
      .select("id, template_id")
      .eq("id", slotId)
      .single();

    if (fallbackSlot.error || !fallbackSlot.data) {
      return { error: NextResponse.json({ error: "Slot not found" }, { status: 404 }) };
    }

    const { data: template } = await supabase
      .from("layout_templates")
      .select("tenant_id")
      .eq("id", fallbackSlot.data.template_id)
      .single();

    if (!template) {
      return { error: NextResponse.json({ error: "Template not found" }, { status: 404 }) };
    }

    const { data: membership } = await supabase
      .from("user_tenants")
      .select("role")
      .eq("user_id", userId)
      .eq("tenant_id", template.tenant_id)
      .single();

    if (!membership) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return {
      slot: fallbackSlot.data,
      template,
      membership,
      migrationMissing,
      error: null,
    };
  }

  if (slotError || !slot) {
    return { error: NextResponse.json({ error: "Slot not found" }, { status: 404 }) };
  }

  const { data: template, error: templateError } = await supabase
    .from("layout_templates")
    .select("tenant_id")
    .eq("id", slot.template_id)
    .single();

  if (templateError || !template) {
    return { error: NextResponse.json({ error: "Template not found" }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from("user_tenants")
    .select("role")
    .eq("user_id", userId)
    .eq("tenant_id", template.tenant_id)
    .single();

  if (!membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    slot,
    template,
    membership,
    migrationMissing: false,
    error: null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getSlotTenantAccess(supabase, slotId, user.id);
    if (access.error) {
      return access.error;
    }

    // Fetch assignments filtered by tenant_id for security
    let assignmentsResponse: {
      data: Array<Record<string, unknown>> | null;
      error: { code?: string | null } | null;
    } = await supabase
      .from("slot_assignments")
      .select(
        `pin_order, article_id, display_mode, expires_at,
         articles(id, title, slug, cover_image_url, published_at, status)`
      )
      .eq("slot_id", slotId)
      .eq("tenant_id", access.template.tenant_id)
      .order("pin_order", { ascending: true });

    if (assignmentsResponse.error?.code === "42703") {
      assignmentsResponse = await supabase
        .from("slot_assignments")
        .select(
          `pin_order, article_id,
           articles(id, title, slug, cover_image_url, published_at, status)`
        )
        .eq("slot_id", slotId)
        .eq("tenant_id", access.template.tenant_id)
        .order("pin_order", { ascending: true });
    }

    if (assignmentsResponse.error) throw assignmentsResponse.error;
    const data = assignmentsResponse.data;

    return NextResponse.json(
      (data || [])
        .filter((assignment) =>
          isPlacementActive(typeof assignment.expires_at === "string" ? assignment.expires_at : null)
        )
        .map((assignment) => ({
          ...assignment,
          display_mode: normalizePlacementDisplayMode(assignment.display_mode),
        }))
    );
  } catch (error) {
    console.error("Error fetching slot assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const body = await request.json();
  const { assignments } = body; // Array of { article_id, pin_order, display_mode? }

  const supabase = await createServerSupabaseClient();

  try {
    // Get current user (for auth check)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const access = await getSlotTenantAccess(supabase, slotId, user.id);
    if (access.error) {
      return access.error;
    }
    if (!SLOT_ASSIGNMENT_EDITOR_ROLES.has(access.membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const articleIds = Array.isArray(assignments)
      ? assignments
          .map((assignment) => (typeof assignment?.article_id === "string" ? assignment.article_id : null))
          .filter((articleId): articleId is string => Boolean(articleId))
      : [];

    if (articleIds.length !== (assignments?.length ?? 0)) {
      return NextResponse.json({ error: "Invalid article assignments" }, { status: 400 });
    }

    if (articleIds.length > 0) {
      const { data: articles, error: articlesError } = await supabase
        .from("articles")
        .select("id")
        .in("id", articleIds)
        .eq("tenant_id", access.template.tenant_id);

      if (articlesError) {
        throw articlesError;
      }

      if ((articles?.length ?? 0) !== articleIds.length) {
        return NextResponse.json({ error: "One or more articles do not belong to this tenant" }, { status: 400 });
      }
    }

    // Delete existing assignments for this slot
    await supabase
      .from("slot_assignments")
      .delete()
      .eq("slot_id", slotId)
      .eq("tenant_id", access.template.tenant_id);

    // Insert new assignments
    if (assignments && assignments.length > 0) {
      const assignedAt = new Date();
      const expiresAt = buildPlacementExpiry(
        access.migrationMissing ? null : ((access.slot as { placement_duration_hours?: number | null })?.placement_duration_hours ?? null),
        assignedAt
      );
      const rows = assignments.map((
        a: { article_id: string; pin_order?: number; display_mode?: string | null },
        index: number
      ) => {
        const baseRow = {
          slot_id: slotId,
          article_id: a.article_id,
          tenant_id: access.template.tenant_id,
          assigned_by: user.id,
          pin_order: a.pin_order ?? index,
        };

        if (access.migrationMissing) {
          return baseRow;
        }

        return {
          ...baseRow,
          display_mode: normalizePlacementDisplayMode(a.display_mode),
          assigned_at: assignedAt.toISOString(),
          expires_at: expiresAt,
        };
      });

      const { error: insertError } = await supabase
        .from("slot_assignments")
        .insert(rows);

      if (insertError) throw insertError;
    }

    try {
      await triggerPublish(access.template.tenant_id, [{ type: "full_rebuild" }], user.id);
      return NextResponse.json({ success: true, count: assignments?.length || 0 });
    } catch (publishError) {
      console.error("Publish refresh failed after slot assignment update:", publishError);
      return NextResponse.json({ success: true, count: assignments?.length || 0, publishWarning: true }, { status: 202 });
    }
  } catch (error) {
    console.error("Error updating slot assignments:", error);
    return NextResponse.json(
      { error: "Failed to update assignments" },
      { status: 500 }
    );
  }
}
