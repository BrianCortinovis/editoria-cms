import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const pageType = searchParams.get("page") || "homepage";

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Get layout template
  const { data: template } = await supabase
    .from("layout_templates")
    .select("id, name, page_type, screenshot_url")
    .eq("tenant_id", tenant.id)
    .eq("page_type", pageType)
    .eq("is_active", true)
    .single();

  if (!template) {
    return NextResponse.json({ error: "Layout not found" }, { status: 404 });
  }

  // Get slots with their content
  const { data: slots } = await supabase
    .from("layout_slots")
    .select("slot_key, label, content_type, category_id, max_items, sort_by, sort_order, style_hint, categories(name, slug, color)")
    .eq("template_id", template.id)
    .order("sort_index");

  if (!slots) {
    return NextResponse.json({ template, slots: [] });
  }

  // For each slot, fetch the actual content
  const slotsWithContent = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slots.map(async (slot: any) => {
      let content = null;

      if (slot.content_type === "articles") {
        let query = supabase
          .from("articles")
          .select("id, title, subtitle, slug, summary, cover_image_url, is_featured, is_premium, reading_time_minutes, published_at, profiles!articles_author_id_fkey(full_name, avatar_url), categories(name, slug, color)")
          .eq("tenant_id", tenant.id)
          .eq("status", "published")
          .order(slot.sort_by, { ascending: slot.sort_order === "asc" })
          .limit(slot.max_items);

        if (slot.category_id) {
          query = query.eq("category_id", slot.category_id);
        }

        const { data } = await query;
        content = data;
      } else if (slot.content_type === "events") {
        const { data } = await supabase
          .from("events")
          .select("*")
          .eq("tenant_id", tenant.id)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
          .limit(slot.max_items);
        content = data;
      } else if (slot.content_type === "breaking_news") {
        const { data } = await supabase
          .from("breaking_news")
          .select("id, text, link_url, priority")
          .eq("tenant_id", tenant.id)
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(slot.max_items);
        content = data;
      }

      return {
        slot_key: slot.slot_key,
        label: slot.label,
        content_type: slot.content_type,
        category: slot.categories,
        style_hint: slot.style_hint,
        items: content || [],
      };
    })
  );

  return NextResponse.json(
    {
      template: { name: template.name, page_type: template.page_type },
      slots: slotsWithContent,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
