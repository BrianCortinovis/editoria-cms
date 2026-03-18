"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { isModuleActive } from "@/lib/modules";
import { useAIStatus } from "@/lib/ai-status";
import toast from "react-hot-toast";
import ZoneRenderer from "@/components/layout/ZoneRenderer";
import {
  LayoutTemplate,
  Plus,
  Trash2,
  FileText,
  Image as ImageIcon,
  Calendar,
  Zap,
  Megaphone,
  X,
  Check,
  Loader2,
  ScanLine,
  Sparkles,
  Pencil,
  ArrowRight,
  Home,
  Info,
  Phone,
  FileQuestion,
  Map,
  Newspaper,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface LayoutSlot {
  id: string;
  slot_key: string;
  label: string;
  description: string | null;
  content_type: string;
  max_items: number;
  sort_by: string;
  sort_index: number;
  category_id: string | null;
  category_name?: string | null;
  category_color?: string | null;
  layout_tag: string;
  layout_display: string;
  layout_width: string;
  layout_height: string;
  layout_grid_cols: number;
  layout_classes: string;
}

interface LayoutTemplate {
  id: string;
  name: string;
  page_type: string;
  screenshot_url: string | null;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface SitePage {
  id: string;
  page_type: string;
  label: string;
  icon: typeof Home;
}

const SITE_PAGES: SitePage[] = [
  { id: "homepage", page_type: "homepage", label: "Homepage", icon: Home },
  { id: "article", page_type: "article", label: "Pagina Articolo", icon: Newspaper },
  { id: "category", page_type: "category", label: "Pagina Categoria", icon: FileText },
  { id: "about", page_type: "about", label: "Chi Siamo", icon: Info },
  { id: "contact", page_type: "contact", label: "Contatti", icon: Phone },
  { id: "events", page_type: "events", label: "Pagina Eventi", icon: Calendar },
  { id: "meteo", page_type: "meteo", label: "Meteo", icon: FileText },
  { id: "webcam", page_type: "webcam", label: "Webcam", icon: FileText },
  { id: "ski", page_type: "ski", label: "Sci", icon: FileText },
  { id: "trekking", page_type: "trekking", label: "Trekking", icon: FileText },
  { id: "accommodation", page_type: "accommodation", label: "Dove Alloggiare", icon: Home },
  { id: "restaurant", page_type: "restaurant", label: "Dove Mangiare", icon: FileText },
  { id: "activities", page_type: "activities", label: "Attività", icon: FileText },
  { id: "alpine", page_type: "alpine", label: "Alpini", icon: FileText },
  { id: "map", page_type: "map", label: "Mappa", icon: Map },
  { id: "other", page_type: "other", label: "Altra Pagina", icon: FileQuestion },
];

const contentTypeIcons: Record<string, typeof FileText> = {
  articles: FileText, events: Calendar, breaking_news: Zap, banners: Megaphone, media: ImageIcon,
};

const contentTypeLabels: Record<string, string> = {
  articles: "Articoli", events: "Eventi", breaking_news: "Breaking News", banners: "Banner", media: "Media",
};

export default function LayoutPage() {
  const { currentTenant } = useAuthStore();
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("homepage");
  const [slots, setSlots] = useState<LayoutSlot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"zone" | "moduli" | "preview">("zone");
  const [previewSplit, setPreviewSplit] = useState(50); // split percentage
  const [showNewSlot, setShowNewSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<LayoutSlot | null>(null);
  const [parsing, setParsing] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<LayoutSlot | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  const settings = (currentTenant?.settings ?? {}) as Record<string, unknown>;
  const aiActive = isModuleActive(settings, "ai_assistant");

  // Slot form state
  const [slotKey, setSlotKey] = useState("");
  const [slotLabel, setSlotLabel] = useState("");
  const [slotDescription, setSlotDescription] = useState("");
  const [slotContentType, setSlotContentType] = useState("articles");
  const [slotCategoryId, setSlotCategoryId] = useState("");
  const [slotMaxItems, setSlotMaxItems] = useState(6);
  const [slotSortBy, setSlotSortBy] = useState("published_at");
  const [slotWidth, setSlotWidth] = useState("full");
  const [slotHeight, setSlotHeight] = useState("auto");
  const [slotGridCols, setSlotGridCols] = useState(1);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();

    // Load all templates for this tenant
    const { data: tmplData } = await supabase.from("layout_templates")
      .select("*").eq("tenant_id", currentTenant.id);

    if (tmplData) setTemplates(tmplData as LayoutTemplate[]);

    // Ensure selected page template exists
    let tmpl = tmplData?.find(t => t.page_type === selectedPage);
    if (!tmpl) {
      const { data: newTmpl } = await supabase.from("layout_templates").insert({
        tenant_id: currentTenant.id,
        name: `${currentTenant.name} — ${SITE_PAGES.find(p => p.page_type === selectedPage)?.label || selectedPage}`,
        page_type: selectedPage,
      }).select("*").single();
      if (newTmpl) {
        tmpl = newTmpl;
        setTemplates(prev => [...prev, newTmpl as LayoutTemplate]);
      }
    }

    if (tmpl) {
      const { data: slotData } = await supabase.from("layout_slots")
        .select("*, categories(name, color)")
        .eq("template_id", tmpl.id)
        .order("sort_index");

      if (slotData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSlots(slotData.map((s: any) => ({
          ...s,
          category_name: s.categories?.name ?? null,
          category_color: s.categories?.color ?? null,
        })));
      }
    }

    const { data: cats } = await supabase.from("categories").select("id, name, slug, color")
      .eq("tenant_id", currentTenant.id).order("sort_order");
    if (cats) setCategories(cats as Category[]);
    setLoading(false);
  }, [currentTenant, selectedPage]);

  useEffect(() => { load(); }, [load]);

  const resetSlotForm = () => {
    setSlotKey(""); setSlotLabel(""); setSlotDescription(""); setSlotContentType("articles");
    setSlotCategoryId(""); setSlotMaxItems(6); setSlotSortBy("published_at");
    setSlotWidth("full"); setSlotHeight("auto"); setSlotGridCols(1);
    setEditingSlot(null); setShowNewSlot(false);
  };

  const startEditSlot = (slot: LayoutSlot) => {
    setEditingSlot(slot); setSlotKey(slot.slot_key); setSlotLabel(slot.label);
    setSlotDescription(slot.description ?? ""); setSlotContentType(slot.content_type);
    setSlotCategoryId(slot.category_id ?? ""); setSlotMaxItems(slot.max_items);
    setSlotSortBy(slot.sort_by); setSlotWidth(slot.layout_width); setSlotHeight(slot.layout_height);
    setSlotGridCols(slot.layout_grid_cols); setShowNewSlot(true); setActiveTab("moduli");
  };

  const handleSaveSlot = async () => {
    if (!currentTenant || !slotKey.trim() || !slotLabel.trim()) { toast.error("Chiave e nome obbligatori"); return; }
    const supabase = createClient();
    const tmpl = templates.find(t => t.page_type === selectedPage);
    if (!tmpl) return;

    const payload = {
      template_id: tmpl.id, slot_key: slotKey.trim().toLowerCase().replace(/\s+/g, "-"),
      label: slotLabel.trim(), description: slotDescription || null, content_type: slotContentType,
      category_id: slotCategoryId || null, max_items: slotMaxItems, sort_by: slotSortBy,
      sort_order: "desc", sort_index: editingSlot ? editingSlot.sort_index : slots.length,
      layout_width: slotWidth, layout_height: slotHeight, layout_grid_cols: slotGridCols,
      layout_tag: "div", layout_display: slotGridCols > 1 ? "grid" : "block",
    };

    if (editingSlot) {
      await supabase.from("layout_slots").update(payload).eq("id", editingSlot.id);
      toast.success("Slot aggiornato");
    } else {
      await supabase.from("layout_slots").insert(payload);
      toast.success("Slot creato");
    }
    resetSlotForm(); load();
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Eliminare?")) return;
    const supabase = createClient();
    await supabase.from("layout_slots").delete().eq("id", id);
    setSlots(prev => prev.filter(s => s.id !== id));
    toast.success("Eliminato");
  };

  // File import handler (same logic, abbreviated)
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setParsing(true);
    const filesToParse: { path: string; content: string }[] = [];
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["html", "htm", "tsx", "jsx", "vue", "svelte", "astro"].includes(ext)) continue;
      if (file.name.includes("node_modules")) continue;
      try { filesToParse.push({ path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name, content: await file.text() }); } catch { /* skip */ }
    }
    if (filesToParse.length === 0) { toast.error("Nessun file valido"); setParsing(false); return; }
    try {
      const res = await fetch("/api/layout/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files: filesToParse }) });
      const data = await res.json();
      if (data.slots?.length > 0) {
        const supabase = createClient();
        let totalAdded = 0;
        // Get or create templates for each detected page
        const detectedPages: string[] = data.detected_pages || [selectedPage];
        for (const page of detectedPages) {
          let tmpl = templates.find(t => t.page_type === page);
          if (!tmpl) {
            const { data: newTmpl } = await supabase.from("layout_templates").insert({
              tenant_id: currentTenant!.id,
              name: `${currentTenant!.name} — ${SITE_PAGES.find(p => p.page_type === page)?.label || page}`,
              page_type: page,
            }).select("*").single();
            if (newTmpl) { tmpl = newTmpl as LayoutTemplate; setTemplates(prev => [...prev, newTmpl as LayoutTemplate]); }
          }
          if (!tmpl) continue;
          const pageSlots = (data.pages?.[page] || data.slots.filter((s: { page?: string }) => (s.page || selectedPage) === page));
          let pageOrder = 0;
          for (const s of pageSlots) {
            const existingSlots = await supabase.from("layout_slots").select("id").eq("template_id", tmpl.id).eq("slot_key", s.slot_key);
            if (existingSlots.data && existingSlots.data.length > 0) continue;
            const cat = categories.find(c => s.slot_key.includes(c.slug));
            await supabase.from("layout_slots").insert({
              template_id: tmpl.id, slot_key: s.slot_key, label: s.label, description: s.description,
              content_type: s.content_type || "articles", category_id: cat?.id ?? null, max_items: s.max_items || 6,
              sort_by: "published_at", sort_order: "desc", sort_index: pageOrder++,
              layout_tag: s.layout?.tag || "div", layout_display: s.layout?.display || "block",
              layout_width: s.layout?.width || "full", layout_height: s.layout?.height || "auto",
              layout_grid_cols: s.layout?.grid_cols || 1, layout_classes: s.layout?.classes || "",
            });
            totalAdded++;
          }
        }
        toast.success(`${totalAdded} slot importati in ${detectedPages.length} pagine: ${detectedPages.join(", ")}`);
        load();
      } else { toast.error("Nessun slot trovato. Aggiungi data-cms-slot al codice."); }
    } catch { toast.error("Errore nel parsing"); }
    setParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAIAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !currentTenant) return;
    setAiAnalyzing(true);
    useAIStatus.getState().set({ message: "Analisi IA layout in corso...", provider: "" });
    const files: { path: string; content: string }[] = [];
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["html", "htm", "tsx", "jsx", "vue", "svelte", "astro"].includes(ext)) continue;
      if (file.name.includes("node_modules")) continue;
      try { files.push({ path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name, content: await file.text() }); } catch { /* skip */ }
    }
    if (files.length === 0) { toast.error("Nessun file"); setAiAnalyzing(false); return; }
    useAIStatus.getState().set({ message: `Analisi IA di ${files.length} file in corso (ogni pagina viene analizzata separatamente)...`, provider: "" });
    toast.success(`Invio ${files.length} file all'IA — ogni pagina verrà analizzata individualmente...`);
    try {
      const res = await fetch("/api/ai/analyze-layout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: currentTenant.id, files }) });
      const data = await res.json();
      // New format: data.pages is a dict of page_type -> slots[]
      const aiPages = data.pages || (data.slots ? { [selectedPage]: data.slots } : null);
      if (aiPages && Object.keys(aiPages).length > 0) {
        const supabase = createClient();
        let totalAdded = 0;
        const pageNames: string[] = [];

        for (const [page, pageSlots] of Object.entries(aiPages)) {
          if (!Array.isArray(pageSlots) || pageSlots.length === 0) continue;
          pageNames.push(page);

          // Get or create template for this page
          let tmpl = templates.find(t => t.page_type === page);
          if (!tmpl) {
            const { data: newTmpl } = await supabase.from("layout_templates").insert({
              tenant_id: currentTenant!.id,
              name: `${currentTenant!.name} — ${page}`,
              page_type: page,
            }).select("*").single();
            if (newTmpl) { tmpl = newTmpl as LayoutTemplate; setTemplates(prev => [...prev, newTmpl as LayoutTemplate]); }
          }
          if (!tmpl) continue;

          let order = 0;
          for (const s of pageSlots as Array<Record<string, unknown>>) {
            const slotKey = s.slot_key as string;
            const existing = await supabase.from("layout_slots").select("id").eq("template_id", tmpl.id).eq("slot_key", slotKey);
            if (existing.data && existing.data.length > 0) continue;
            const cat = categories.find(c => slotKey.includes(c.slug));
            await supabase.from("layout_slots").insert({
              template_id: tmpl.id, slot_key: slotKey, label: (s.label as string) || slotKey,
              description: (s.description as string) || null,
              content_type: (s.content_type as string) || "articles",
              category_id: cat?.id ?? null, max_items: (s.max_items as number) || 6,
              sort_by: "published_at", sort_order: "desc", sort_index: order++,
              layout_width: (s.layout_width as string) || "full",
              layout_height: (s.layout_height as string) || "auto",
              layout_grid_cols: (s.grid_cols as number) || 1,
            });
            totalAdded++;
          }
        }
        toast.success(`IA: ${totalAdded} slot in ${pageNames.length} pagine (${data.provider})`);
        useAIStatus.getState().set({ message: `Layout analizzato: ${totalAdded} slot in ${pageNames.length} pagine`, provider: data.provider || "" });
        setTimeout(() => useAIStatus.getState().clear(), 5000);
        if (data.analysis) toast.success(data.analysis, { duration: 5000 });
        load();
      }
    } catch { toast.error("Errore IA"); }
    setAiAnalyzing(false);
    if (aiFileInputRef.current) aiFileInputRef.current.value = "";
  };

  const handleZoneClick = (slot: { id: string; slot_key: string; content_type: string; category_name?: string | null }) => {
    const cat = categories.find(c => c.name === slot.category_name);
    if (slot.content_type === "articles") {
      window.location.href = `/dashboard/articoli${cat ? `?category=${cat.slug}` : ""}`;
    } else if (slot.content_type === "events") {
      window.location.href = "/dashboard/eventi";
    } else if (slot.content_type === "breaking_news") {
      window.location.href = "/dashboard/breaking-news";
    } else if (slot.content_type === "banners") {
      window.location.href = "/dashboard/banner";
    } else {
      setSelectedSlot(slots.find(s => s.id === slot.id) || null);
      setActiveTab("moduli");
      startEditSlot(slots.find(s => s.id === slot.id)!);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} /></div>;
  }

  return (
    <div className="flex gap-5">
      {/* Left: Site tree */}
      <div className="w-48 shrink-0 hidden lg:block">
        <p className="text-[10px] font-semibold uppercase mb-2" style={{ color: "var(--c-text-3)" }}>Pagine sito</p>
        <div className="space-y-0.5">
          {SITE_PAGES.map(page => {
            const Icon = page.icon;
            const hasSlots = templates.some(t => t.page_type === page.page_type);
            return (
              <button
                key={page.id}
                onClick={() => { setSelectedPage(page.page_type); setLoading(true); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition text-left"
                style={{
                  background: selectedPage === page.page_type ? "var(--c-accent-soft)" : "transparent",
                  color: selectedPage === page.page_type ? "var(--c-accent)" : "var(--c-text-2)",
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {page.label}
                {hasSlots && <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: "var(--c-accent)" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Tabs + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--c-bg-2)" }}>
            <button onClick={() => setActiveTab("zone")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition"
              style={{ background: activeTab === "zone" ? "var(--c-bg-1)" : "transparent", color: activeTab === "zone" ? "var(--c-text-0)" : "var(--c-text-2)" }}>
              Zone
            </button>
            <button onClick={() => setActiveTab("moduli")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition"
              style={{ background: activeTab === "moduli" ? "var(--c-bg-1)" : "transparent", color: activeTab === "moduli" ? "var(--c-text-0)" : "var(--c-text-2)" }}>
              Moduli ({slots.length})
            </button>
            <button onClick={() => setActiveTab("preview")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition"
              style={{ background: activeTab === "preview" ? "var(--c-bg-1)" : "transparent", color: activeTab === "preview" ? "var(--c-text-0)" : "var(--c-text-2)" }}>
              Confronta
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={parsing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />} Importa
            </button>
            <input ref={fileInputRef} type="file" // @ts-expect-error webkitdirectory
            webkitdirectory="" directory="" multiple className="hidden" onChange={handleFolderUpload} />
            {aiActive && (
              <>
                <button onClick={() => aiFileInputRef.current?.click()} disabled={aiAnalyzing}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                  style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                  {aiAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Analisi IA
                </button>
                <input ref={aiFileInputRef} type="file" // @ts-expect-error webkitdirectory
            webkitdirectory="" directory="" multiple className="hidden" onChange={handleAIAnalyze} />
              </>
            )}
            <button onClick={() => { resetSlotForm(); setShowNewSlot(true); setActiveTab("moduli"); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-white rounded-lg text-xs font-semibold transition"
              style={{ background: "var(--c-accent)" }}>
              <Plus className="w-3.5 h-3.5" /> Slot
            </button>
          </div>
        </div>

        {/* ZONE TAB: Visual wireframe */}
        {activeTab === "zone" && (
          <ZoneRenderer
            slots={slots.map(s => ({
              ...s,
              sort_index: s.sort_index,
            }))}
            onSlotClick={handleZoneClick}
          />
        )}

        {/* MODULI TAB: Slot list */}
        {activeTab === "moduli" && (
          <div className="space-y-3">
            {/* New/Edit form */}
            {showNewSlot && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{editingSlot ? "Modifica" : "Nuovo"} Slot</h3>
                  <button onClick={resetSlotForm}><X className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Chiave *</label>
                    <input type="text" value={slotKey} onChange={e => setSlotKey(e.target.value)} placeholder="hero" className="input w-full mt-0.5 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Nome *</label>
                    <input type="text" value={slotLabel} onChange={e => setSlotLabel(e.target.value)} placeholder="Articolo Principale" className="input w-full mt-0.5 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Tipo</label>
                    <select value={slotContentType} onChange={e => setSlotContentType(e.target.value)} className="input w-full mt-0.5 text-xs">
                      <option value="articles">Articoli</option><option value="events">Eventi</option>
                      <option value="breaking_news">Breaking News</option><option value="banners">Banner</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Categoria</label>
                    <select value={slotCategoryId} onChange={e => setSlotCategoryId(e.target.value)} className="input w-full mt-0.5 text-xs">
                      <option value="">Tutte</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Max items</label>
                    <input type="number" value={slotMaxItems} onChange={e => setSlotMaxItems(Number(e.target.value))} min={1} max={50} className="input w-full mt-0.5 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Larghezza</label>
                    <select value={slotWidth} onChange={e => setSlotWidth(e.target.value)} className="input w-full mt-0.5 text-xs">
                      <option value="full">100%</option><option value="3/4">75%</option><option value="2/3">66%</option>
                      <option value="1/2">50%</option><option value="1/3">33%</option><option value="1/4">25%</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Altezza</label>
                    <select value={slotHeight} onChange={e => setSlotHeight(e.target.value)} className="input w-full mt-0.5 text-xs">
                      <option value="auto">Auto</option><option value="hero">Hero (grande)</option>
                      <option value="large">Grande</option><option value="medium">Media</option><option value="small">Piccola</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Colonne griglia</label>
                    <input type="number" value={slotGridCols} onChange={e => setSlotGridCols(Number(e.target.value))} min={1} max={6} className="input w-full mt-0.5 text-xs" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={resetSlotForm} className="px-3 py-1.5 text-xs font-medium rounded-lg" style={{ color: "var(--c-text-2)" }}>Annulla</button>
                  <button onClick={handleSaveSlot} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: "var(--c-accent)" }}>
                    <Check className="w-3 h-3 inline mr-1" /> Salva
                  </button>
                </div>
              </div>
            )}

            {/* Slot list */}
            {slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl" style={{ border: "2px dashed var(--c-border)" }}>
                <LayoutTemplate className="w-8 h-8 mb-2" style={{ color: "var(--c-text-3)" }} />
                <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessuno slot per questa pagina</p>
                <p className="text-xs mt-1" style={{ color: "var(--c-text-3)" }}>Importa dal sito o crea manualmente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {slots.map(slot => {
                  const Icon = contentTypeIcons[slot.content_type] || FileText;
                  const cat = categories.find(c => c.id === slot.category_id);
                  return (
                    <div key={slot.id} className="card group">
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--c-accent-soft)" }}>
                          <Icon className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: "var(--c-text-0)" }}>{slot.label}</p>
                          <p className="text-[10px] font-mono" style={{ color: "var(--c-text-3)" }}>
                            {slot.slot_key} · {slot.layout_width} · {contentTypeLabels[slot.content_type]} · {slot.max_items}
                            {cat && <span> · <span style={{ color: cat.color }}>{cat.name}</span></span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => startEditSlot(slot)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: "var(--c-text-3)" }}>
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDeleteSlot(slot.id)} className="w-6 h-6 flex items-center justify-center rounded text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PREVIEW TAB: Split wireframe + iframe */}
        {activeTab === "preview" && (
          <div>
            {/* Split controls */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-medium" style={{ color: "var(--c-text-3)" }}>Split:</span>
              {[30, 50, 70].map(v => (
                <button key={v} onClick={() => setPreviewSplit(v)}
                  className="text-[10px] px-2 py-1 rounded-md font-medium transition"
                  style={{ background: previewSplit === v ? "var(--c-accent-soft)" : "var(--c-bg-2)", color: previewSplit === v ? "var(--c-accent)" : "var(--c-text-2)" }}>
                  {v === 30 ? "Sito" : v === 50 ? "50/50" : "Zone"}
                </button>
              ))}
            </div>

            <div className="flex gap-3" style={{ height: "70vh" }}>
              {/* Wireframe side */}
              <div className="overflow-auto rounded-xl" style={{ width: `${previewSplit}%`, border: "1px solid var(--c-border)" }}>
                <div className="p-1 scale-[0.65] origin-top-left" style={{ width: "154%" }}>
                  <ZoneRenderer slots={slots} onSlotClick={handleZoneClick} />
                </div>
              </div>

              {/* Iframe side */}
              <div className="rounded-xl overflow-hidden flex flex-col" style={{ width: `${100 - previewSplit}%`, border: "1px solid var(--c-border)" }}>
                <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: "#eab308" }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                  </div>
                  <div className="flex-1 rounded-md px-2 py-0.5 text-[9px] font-mono text-center"
                    style={{ background: "var(--c-bg-3)", color: "var(--c-text-3)" }}>
                    {currentTenant?.domain || "sito-preview"}
                  </div>
                </div>
                {currentTenant?.domain ? (
                  <iframe
                    src={`https://${currentTenant.domain}`}
                    className="flex-1 w-full border-0"
                    style={{ background: "#fff" }}
                    sandbox="allow-scripts allow-same-origin"
                    title="Anteprima sito"
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center" style={{ background: "var(--c-bg-1)" }}>
                    <div className="text-center px-6">
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--c-text-2)" }}>Nessun dominio configurato</p>
                      <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
                        Configura il dominio del sito in Impostazioni per vedere l&apos;anteprima live
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
