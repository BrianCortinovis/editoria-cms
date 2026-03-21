import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const supabase = await createServerSupabaseClient();

  try {
    // Get slot with template info for tenant verification
    const { data: slot, error: slotError } = await supabase
      .from("layout_slots")
      .select("id, template_id")
      .eq("id", slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // Get template to verify tenant
    const { data: template, error: templateError } = await supabase
      .from("layout_templates")
      .select("tenant_id")
      .eq("id", slot.template_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Fetch assignments filtered by tenant_id for security
    const { data, error } = await supabase
      .from("slot_assignments")
      .select(
        `pin_order, article_id,
         articles(id, title, slug, cover_image_url, published_at, status)`
      )
      .eq("slot_id", slotId)
      .eq("tenant_id", template.tenant_id)
      .order("pin_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
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
  const { assignments } = body; // Array of { article_id, pin_order }

  const supabase = await createServerSupabaseClient();

  try {
    // Get current user (for auth check)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get slot info
    const { data: slot, error: slotError } = await supabase
      .from("layout_slots")
      .select("id, template_id")
      .eq("id", slotId)
      .single();

    if (slotError || !slot)
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    // Get template to get tenant_id for validation
    const { data: template } = await supabase
      .from("layout_templates")
      .select("tenant_id")
      .eq("id", slot.template_id)
      .single();

    if (!template)
      return NextResponse.json({ error: "Template not found" }, { status: 404 });

    // Delete existing assignments for this slot
    await supabase.from("slot_assignments").delete().eq("slot_id", slotId);

    // Insert new assignments
    if (assignments && assignments.length > 0) {
      const rows = assignments.map(
        (a: { article_id: string; pin_order: number }, index: number) => ({
          slot_id: slotId,
          article_id: a.article_id,
          tenant_id: template.tenant_id,
          assigned_by: user.id,
          pin_order: index, // Re-index based on insertion order
        })
      );

      const { error: insertError } = await supabase
        .from("slot_assignments")
        .insert(rows);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, count: assignments?.length || 0 });
  } catch (error) {
    console.error("Error updating slot assignments:", error);
    return NextResponse.json(
      { error: "Failed to update assignments" },
      { status: 500 }
    );
  }
}
