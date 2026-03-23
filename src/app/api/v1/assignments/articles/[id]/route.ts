import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: articleId } = await params;
  const supabase = await createServerSupabaseClient();

  try {
    const { data } = await supabase
      .from("slot_assignments")
      .select("slot_id, pin_order, layout_slots(slot_key, label)")
      .eq("article_id", articleId)
      .order("pin_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json(data || null);
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
  const { slot_id } = body;

  const supabase = await createServerSupabaseClient();

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get article to find tenant_id
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("tenant_id")
      .eq("id", articleId)
      .single();

    if (articleError || !article)
      return NextResponse.json({ error: "Article not found" }, { status: 404 });

    // If slot_id is null, delete existing assignment
    if (!slot_id) {
      await supabase
        .from("slot_assignments")
        .delete()
        .eq("article_id", articleId);
      return NextResponse.json({ success: true });
    }

    // Delete any existing assignment for this article
    await supabase
      .from("slot_assignments")
      .delete()
      .eq("article_id", articleId);

    // Get max pin_order for this slot to insert new one at the end
    const { data: maxRow } = await supabase
      .from("slot_assignments")
      .select("pin_order", { count: "exact" })
      .eq("slot_id", slot_id)
      .order("pin_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxRow?.pin_order ?? -1) + 1;

    // Insert new assignment
    const { data, error } = await supabase
      .from("slot_assignments")
      .insert({
        slot_id,
        article_id: articleId,
        tenant_id: article.tenant_id,
        assigned_by: user.id,
        pin_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error managing slot assignment:", error);
    return NextResponse.json({ error: "Failed to manage assignment" }, { status: 500 });
  }
}
