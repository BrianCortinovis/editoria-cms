import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchArticleIdsForCategory } from "@/lib/articles/taxonomy";

interface LayoutSlotRow {
  id: string;
  slot_key: string;
  label: string;
  content_type: string;
  category_id: string | null;
  max_items: number;
  sort_by: string;
  sort_order: "asc" | "desc";
  style_hint: string | null;
  assignment_mode: string | null;
  categories: { name: string; slug: string; color: string | null } | null;
}

interface PinnedArticleRow {
  articles: {
    id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    summary: string | null;
    cover_image_url: string | null;
    is_featured: boolean;
    is_premium: boolean;
    reading_time_minutes: number;
    published_at: string | null;
    profiles: { full_name: string; avatar_url: string | null } | null;
    categories: { name: string; slug: string; color: string | null } | null;
  } | null;
}

type SlotArticle = NonNullable<PinnedArticleRow["articles"]>;

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
    .select("id, slot_key, label, content_type, category_id, max_items, sort_by, sort_order, style_hint, assignment_mode, categories(name, slug, color)")
    .eq("template_id", template.id)
    .order("sort_index");

  if (!slots) {
    return NextResponse.json({ template, slots: [] });
  }

  // For each slot, fetch the actual content
  const slotsWithContent = await Promise.all(
    ((slots || []) as unknown as LayoutSlotRow[]).map(async (slot) => {
      let content = null;

      if (slot.content_type === "articles") {
        const mode = slot.assignment_mode ?? "auto";

        // Step 1: Fetch pinned articles (for manual or mixed mode)
        let pinned: SlotArticle[] = [];
        if (mode === "manual" || mode === "mixed") {
          const { data: pinnedData } = await supabase
            .from("slot_assignments")
            .select(
              "articles(id, title, subtitle, slug, summary, cover_image_url, is_featured, is_premium, reading_time_minutes, published_at, profiles!articles_author_id_fkey(full_name, avatar_url), categories:categories!articles_category_id_fkey(id, name, slug, color))"
            )
            .eq("slot_id", slot.id)
            .order("pin_order");
          pinned = (pinnedData as PinnedArticleRow[] | null)?.map((row) => row.articles).filter(Boolean) as SlotArticle[] ?? [];
        }

        // Step 2: If mode is manual, stop here with pinned articles
        if (mode === "manual") {
          content = pinned.slice(0, slot.max_items);
        } else {
          // Step 3: Auto-fill remaining slots (for auto or mixed mode)
          const remaining = slot.max_items - pinned.length;
          let auto: SlotArticle[] = [];

          if (remaining > 0 || mode === "auto") {
            const pinnedIds = pinned.map((a) => a.id);
            let query = supabase
              .from("articles")
              .select(
                "id, title, subtitle, slug, summary, cover_image_url, is_featured, is_premium, reading_time_minutes, published_at, profiles!articles_author_id_fkey(full_name, avatar_url), categories:categories!articles_category_id_fkey(id, name, slug, color)"
              )
              .eq("tenant_id", tenant.id)
              .eq("status", "published")
              .order(slot.sort_by, { ascending: slot.sort_order === "asc" })
              .limit(mode === "auto" ? slot.max_items : remaining);

            if (slot.category_id) {
              const matchingArticleIds = await fetchArticleIdsForCategory(supabase as never, slot.category_id);
              if (matchingArticleIds && matchingArticleIds.length > 0) {
                query = query.in("id", matchingArticleIds);
              } else {
                query = query.eq("category_id", slot.category_id);
              }
            }

            if (pinnedIds.length > 0) {
              query = query.not("id", "in", `(${pinnedIds.join(",")})`);
            }

            const { data } = await query;
            auto = (data ?? []) as unknown as SlotArticle[];
          }

          content = [...pinned, ...auto];
        }
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
