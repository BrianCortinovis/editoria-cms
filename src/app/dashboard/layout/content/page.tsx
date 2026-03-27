"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestPublishTrigger } from "@/lib/publish/client";
import { useAuthStore } from "@/lib/store";
import { Check, FileQuestion, LayoutTemplate, Loader2, ScanLine } from "lucide-react";
import toast from "react-hot-toast";

interface SitePageSummary {
  id: string;
  page_type: string;
  label: string;
}

interface LayoutTemplateSummary {
  id: string;
  page_type: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface LayoutSlotRule {
  id: string;
  slot_key: string;
  label: string;
  description: string | null;
  content_type: string;
  category_id: string | null;
  max_items: number;
  sort_by: string;
  assignment_mode: "auto" | "manual" | "mixed";
  placement_duration_hours: number | null;
  layout_width: string;
  layout_height: string;
  layout_grid_cols: number;
  category_name?: string | null;
  category_color?: string | null;
}

interface SlotRuleDraft {
  content_type: string;
  category_id: string;
  max_items: number;
  sort_by: string;
  assignment_mode: "auto" | "manual" | "mixed";
  placement_duration_hours: string;
}

const contentTypeOptions = [
  { value: "articles", label: "Articoli" },
  { value: "events", label: "Eventi" },
  { value: "breaking_news", label: "Breaking News" },
  { value: "banners", label: "Banner" },
  { value: "media", label: "Media" },
];

const sortOptions = [
  { value: "published_at", label: "Data pubblicazione" },
  { value: "created_at", label: "Data creazione" },
  { value: "updated_at", label: "Ultimo aggiornamento" },
  { value: "manual", label: "Manuale / pinning" },
  { value: "title", label: "Titolo" },
];

function toDraft(slot: LayoutSlotRule): SlotRuleDraft {
  return {
    content_type: slot.content_type,
    category_id: slot.category_id ?? "",
    max_items: slot.max_items,
    sort_by: slot.sort_by,
    assignment_mode: slot.assignment_mode ?? "auto",
    placement_duration_hours:
      typeof slot.placement_duration_hours === "number" ? String(slot.placement_duration_hours) : "",
  };
}

export default function LayoutContentRulesPage() {
  const { currentTenant } = useAuthStore();
  const searchParams = useSearchParams();
  const [sitePages, setSitePages] = useState<SitePageSummary[]>([]);
  const [templates, setTemplates] = useState<LayoutTemplateSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [slots, setSlots] = useState<LayoutSlotRule[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SlotRuleDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentTenant) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const [{ data: pagesData }, { data: templateData }, { data: categoryData }] = await Promise.all([
      supabase
        .from("site_pages")
        .select("id, title, slug")
        .eq("tenant_id", currentTenant.id)
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("layout_templates")
        .select("id, page_type")
        .eq("tenant_id", currentTenant.id),
      supabase
        .from("categories")
        .select("id, name, color")
        .eq("tenant_id", currentTenant.id)
        .order("sort_order"),
    ]);

    const nextPages = (pagesData || []).map((page: { id: string; title: string; slug: string }) => ({
      id: page.id,
      page_type: page.slug,
      label: page.title,
    }));
    const nextTemplates = (templateData || []) as LayoutTemplateSummary[];
    const nextCategories = (categoryData || []) as Category[];
    const requestedPageId = searchParams.get("page");
    const requestedPageType = requestedPageId
      ? nextPages.find((page) => page.id === requestedPageId)?.page_type
      : null;
    const nextSelectedPage =
      requestedPageType ||
      nextPages.find((page) => page.page_type === selectedPage)?.page_type ||
      nextPages[0]?.page_type ||
      "";

    setSitePages(nextPages);
    setTemplates(nextTemplates);
    setCategories(nextCategories);
    if (nextSelectedPage !== selectedPage) {
      setSelectedPage(nextSelectedPage);
    }

    const template = nextTemplates.find((item) => item.page_type === nextSelectedPage);
    if (!template) {
      setSlots([]);
      setDrafts({});
      setLoading(false);
      return;
    }

    const { data: slotData } = await supabase
      .from("layout_slots")
      .select("id, slot_key, label, description, content_type, category_id, max_items, sort_by, assignment_mode, placement_duration_hours, layout_width, layout_height, layout_grid_cols, categories(name, color)")
      .eq("template_id", template.id)
      .order("sort_index");

    const nextSlots = ((slotData || []) as Array<Record<string, unknown>>).map((slot) => ({
      id: String(slot.id),
      slot_key: String(slot.slot_key),
      label: String(slot.label),
      description: typeof slot.description === "string" ? slot.description : null,
      content_type: String(slot.content_type || "articles"),
      category_id: typeof slot.category_id === "string" ? slot.category_id : null,
      max_items: Number(slot.max_items || 6),
      sort_by: String(slot.sort_by || "published_at"),
      assignment_mode: (slot.assignment_mode as SlotRuleDraft["assignment_mode"]) || "auto",
      placement_duration_hours:
        typeof slot.placement_duration_hours === "number" ? slot.placement_duration_hours : null,
      layout_width: String(slot.layout_width || "full"),
      layout_height: String(slot.layout_height || "auto"),
      layout_grid_cols: Number(slot.layout_grid_cols || 1),
      category_name: (slot.categories as { name?: string } | null)?.name ?? null,
      category_color: (slot.categories as { color?: string } | null)?.color ?? null,
    }));

    setSlots(nextSlots);
    setDrafts(
      nextSlots.reduce<Record<string, SlotRuleDraft>>((accumulator, slot) => {
        accumulator[slot.id] = toDraft(slot);
        return accumulator;
      }, {})
    );
    setLoading(false);
  }, [currentTenant, searchParams, selectedPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedSitePage = sitePages.find((page) => page.page_type === selectedPage) || null;

  const updateDraft = (slotId: string, patch: Partial<SlotRuleDraft>) => {
    setDrafts((current) => ({
      ...current,
      [slotId]: {
        ...current[slotId],
        ...patch,
      },
    }));
  };

  const handleSave = async (slot: LayoutSlotRule) => {
    const draft = drafts[slot.id];
    if (!draft || !currentTenant) {
      return;
    }

    setSavingSlotId(slot.id);
    const supabase = createClient();
    const normalizedDuration = Number.parseInt(draft.placement_duration_hours, 10);
    const payload = {
      content_type: draft.content_type,
      category_id: draft.category_id || null,
      max_items: Math.max(1, Number(draft.max_items || 1)),
      sort_by: draft.sort_by,
      assignment_mode: draft.assignment_mode,
      placement_duration_hours: Number.isFinite(normalizedDuration) && normalizedDuration > 0 ? normalizedDuration : null,
    };

    try {
      let response = await supabase.from("layout_slots").update(payload).eq("id", slot.id);
      if (response.error?.code === "42703") {
        const legacyPayload: Omit<typeof payload, "placement_duration_hours"> & { placement_duration_hours?: number | null } = { ...payload };
        delete legacyPayload.placement_duration_hours;
        response = await supabase.from("layout_slots").update(legacyPayload).eq("id", slot.id);
      }

      if (response.error) {
        throw response.error;
      }

      setSlots((current) =>
        current.map((item) =>
          item.id === slot.id
            ? {
                ...item,
                ...payload,
                category_name: categories.find((category) => category.id === (draft.category_id || ""))?.name ?? null,
                category_color: categories.find((category) => category.id === (draft.category_id || ""))?.color ?? null,
              }
            : item
        )
      );
      await requestPublishTrigger(currentTenant.id, [{ type: "full_rebuild" }]);
      toast.success(`Regole aggiornate per ${slot.label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Salvataggio non riuscito";
      toast.error(message);
    } finally {
      setSavingSlotId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} />
      </div>
    );
  }

  if (!selectedPage) {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <LayoutTemplate className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>Serve prima una pagina reale</h2>
        <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--c-text-2)" }}>
          Le regole contenuto degli slot si applicano alle pagine del CMS. Crea una pagina e poi definisci come ogni slot verra` riempito.
        </p>
        <Link
          href="/dashboard/pagine"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--c-accent)" }}
        >
          <FileQuestion className="w-4 h-4" />
          Vai a Pagine
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4 md:p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
              <ScanLine className="w-4 h-4" />
              CMS Slot Rules
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              Regole contenuto separate dal layout
            </h1>
            <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--c-text-2)" }}>
              Qui definisci come ogni slot del layout viene riempito dal CMS: tipo contenuto, categoria, ordinamento, capienza e scadenza del placement. La forma dello slot resta invece nella schermata Layout.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/desktop-bridge?page=${selectedSitePage?.id || ""}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "var(--c-bg-0)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Apri Bridge Desktop
            </Link>
            {selectedSitePage && (
              <Link
                href={`/dashboard/desktop-bridge?page=${selectedSitePage.id}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "var(--c-bg-0)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
              >
                <FileQuestion className="w-3.5 h-3.5" />
                Editor Desktop
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-3)" }}>
              Pagina attiva
            </div>
            <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              {selectedSitePage?.label || "Nessuna pagina"}
            </div>
            <div className="text-xs" style={{ color: "var(--c-text-2)" }}>
              {templates.some((template) => template.page_type === selectedPage)
                ? `${slots.length} slot configurabili`
                : "Nessun template layout associato a questa pagina"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {sitePages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setSelectedPage(page.page_type)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition"
                style={{
                  background: selectedPage === page.page_type ? "var(--c-accent-soft)" : "var(--c-bg-0)",
                  color: selectedPage === page.page_type ? "var(--c-accent)" : "var(--c-text-2)",
                  border: "1px solid var(--c-border)",
                }}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <LayoutTemplate className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>Nessuno slot disponibile</h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--c-text-2)" }}>
            La struttura della pagina si definisce nel desktop editor separato. Quando gli slot esistono, qui puoi assegnare regole editoriali e categorie dal CMS online.
          </p>
          <Link
            href={`/dashboard/desktop-bridge?page=${selectedSitePage?.id || ""}`}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--c-accent)" }}
          >
            <LayoutTemplate className="w-4 h-4" />
            Apri Bridge Desktop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {slots.map((slot) => {
            const draft = drafts[slot.id] || toDraft(slot);
            return (
              <div
                key={slot.id}
                id={`slot-${slot.id}`}
                className="rounded-2xl border p-4 space-y-4"
                style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{slot.label}</div>
                    <div className="text-[11px] font-mono mt-1" style={{ color: "var(--c-text-3)" }}>
                      {slot.slot_key} · {slot.layout_width} · {slot.layout_height} · {slot.layout_grid_cols} col.
                    </div>
                    {slot.description && (
                      <div className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>
                        {slot.description}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] px-2 py-1 rounded-full" style={{ background: "var(--c-bg-0)", color: "var(--c-text-2)", border: "1px solid var(--c-border)" }}>
                    Regole CMS
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Tipo contenuto</label>
                    <select
                      value={draft.content_type}
                      onChange={(event) => updateDraft(slot.id, { content_type: event.target.value })}
                      className="input w-full mt-1 text-xs"
                    >
                      {contentTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Modalita` riempimento</label>
                    <select
                      value={draft.assignment_mode}
                      onChange={(event) => updateDraft(slot.id, { assignment_mode: event.target.value as SlotRuleDraft["assignment_mode"] })}
                      className="input w-full mt-1 text-xs"
                    >
                      <option value="auto">Automatico</option>
                      <option value="manual">Manuale</option>
                      <option value="mixed">Misto</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Categoria</label>
                    <select
                      value={draft.category_id}
                      onChange={(event) => updateDraft(slot.id, { category_id: event.target.value })}
                      className="input w-full mt-1 text-xs"
                    >
                      <option value="">Nessuna</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Max items</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={draft.max_items}
                      onChange={(event) => updateDraft(slot.id, { max_items: Number(event.target.value) })}
                      className="input w-full mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Ordinamento</label>
                    <select
                      value={draft.sort_by}
                      onChange={(event) => updateDraft(slot.id, { sort_by: event.target.value })}
                      className="input w-full mt-1 text-xs"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Scadenza placement (ore)</label>
                    <input
                      type="number"
                      min={1}
                      value={draft.placement_duration_hours}
                      onChange={(event) => updateDraft(slot.id, { placement_duration_hours: event.target.value })}
                      placeholder="Vuoto = nessuna scadenza"
                      className="input w-full mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--c-bg-0)", color: "var(--c-text-2)", border: "1px solid var(--c-border)" }}>
                  Stato attuale:
                  <span style={{ color: "var(--c-text-0)" }}>
                    {" "}
                    {contentTypeOptions.find((option) => option.value === draft.content_type)?.label || draft.content_type}
                    {draft.category_id
                      ? ` · ${categories.find((category) => category.id === draft.category_id)?.name || "Categoria"}`
                      : ""}
                    {draft.placement_duration_hours ? ` · scadenza ${draft.placement_duration_hours}h` : ""}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => updateDraft(slot.id, toDraft(slot))}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ color: "var(--c-text-2)" }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave(slot)}
                    disabled={savingSlotId === slot.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                    style={{ background: "var(--c-accent)" }}
                  >
                    {savingSlotId === slot.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Salva regole
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
