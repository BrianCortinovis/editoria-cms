"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { isModuleActive } from "@/lib/modules";
import { useAIStatus } from "@/lib/ai-status";
import toast from "react-hot-toast";
import ZoneRenderer from "@/components/layout/ZoneRenderer";
import BuilderLayoutRenderedPreview from "@/components/layout/BuilderLayoutRenderedPreview";
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
  FileQuestion,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutPresets as LayoutBuilderModal } from "@/components/builder/LayoutPresets";
import { LAYOUT_PRESETS as BUILDER_LAYOUT_LIBRARY } from "@/components/builder/LayoutPresets";
import type { Block } from "@/lib/types";
import { LAYOUT_PRESETS as CONFIG_LAYOUT_LIBRARY, type LayoutPresetDef } from "@/lib/config/layout-presets";
import { buildLayoutPresetBlocks } from "@/lib/layout/preset-blocks";

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
  assignment_mode?: string;
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
  slug: string;
  label: string;
  icon: typeof FileQuestion;
  blocks: Block[];
  meta: Record<string, unknown> | null;
}

interface LayoutLibraryItem extends LayoutPresetDef {
  _libraryKey: string;
  _featured: boolean;
  _generated?: boolean;
  _pageBlocks?: Block[];
  _pageMeta?: Record<string, unknown> | null;
}

interface ImportedSlot {
  slot_key: string;
  label: string;
  description?: string | null;
  content_type?: string;
  max_items?: number;
  sort_by?: string;
  layout?: {
    tag?: string;
    display?: string;
    width?: string;
    height?: string;
    grid_cols?: number;
    classes?: string;
  };
  page?: string;
}

const contentTypeIcons: Record<string, typeof FileText> = {
  articles: FileText, events: Calendar, breaking_news: Zap, banners: Megaphone, media: ImageIcon,
};

const contentTypeLabels: Record<string, string> = {
  articles: "Articoli", events: "Eventi", breaking_news: "Breaking News", banners: "Banner", media: "Media",
};

export default function LayoutPage() {
  const { currentTenant } = useAuthStore();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [slots, setSlots] = useState<LayoutSlot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pageBlocks, setPageBlocks] = useState<Block[]>([]);
  const [pageMeta, setPageMeta] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"zone" | "moduli" | "preview">("zone");
  const [libraryCategory, setLibraryCategory] = useState<string>("all");
  const [selectedLibraryPresetId, setSelectedLibraryPresetId] = useState<string | null>(null);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [layoutBuilderOpen, setLayoutBuilderOpen] = useState(false);
  const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({
    templates: true,
  });
  const [libraryScrollState, setLibraryScrollState] = useState<Record<string, { left: boolean; right: boolean }>>({});
  const [showNewSlot, setShowNewSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<LayoutSlot | null>(null);
  const [parsing, setParsing] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importingUrl, setImportingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const libraryScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const settings = (currentTenant?.settings ?? {}) as Record<string, unknown>;
  const aiActive = isModuleActive(settings, "ai_assistant");
  const layoutLibrary = useMemo<LayoutLibraryItem[]>(() => {
    const generatedLayouts = sitePages
      .filter((page) => {
        const layoutLibraryMeta = (page.meta?.layoutLibrary as Record<string, unknown> | undefined) || {};
        const generatedTemplate = (layoutLibraryMeta.generatedTemplate as Record<string, unknown> | undefined) || {};
        return generatedTemplate.source === "ai" && Array.isArray(page.blocks) && page.blocks.length > 0;
      })
      .map((page) => {
        const layoutLibraryMeta = (page.meta?.layoutLibrary as Record<string, unknown> | undefined) || {};
        const generatedTemplate = (layoutLibraryMeta.generatedTemplate as Record<string, unknown> | undefined) || {};
        return {
          id: `ai-generated-${page.id}`,
          _libraryKey: `generated:${page.id}`,
          name: typeof generatedTemplate.name === "string" && generatedTemplate.name.trim()
            ? generatedTemplate.name
            : `${page.label} · IA`,
          description: `Layout generato dall'IA per ${page.label}`,
          category: 'creative' as LayoutPresetDef["category"],
          rows: deriveRowsFromBlocks(page.blocks),
          _featured: false,
          _generated: true,
          _pageBlocks: page.blocks,
          _pageMeta: page.meta,
        };
      });

    return [
      ...generatedLayouts,
      ...BUILDER_LAYOUT_LIBRARY.map((preset) => ({
        ...preset,
        _libraryKey: `builder:${preset.id}`,
        _featured: true as const,
        rows: preset.rows,
      })),
      ...CONFIG_LAYOUT_LIBRARY.map((preset) => ({
        ...preset,
        _libraryKey: `config:${preset.id}`,
        _featured: false as const,
      })),
    ];
  }, [sitePages]);

  // Slot form state
  const [slotKey, setSlotKey] = useState("");
  const [slotLabel, setSlotLabel] = useState("");
  const [slotDescription, setSlotDescription] = useState("");
  const [slotContentType, setSlotContentType] = useState("articles");
  const [slotAssignmentMode, setSlotAssignmentMode] = useState("auto");
  const [slotCategoryId, setSlotCategoryId] = useState("");
  const [slotMaxItems, setSlotMaxItems] = useState(6);
  const [slotSortBy, setSlotSortBy] = useState("published_at");
  const [slotWidth, setSlotWidth] = useState("full");
  const [slotHeight, setSlotHeight] = useState("auto");
  const [slotGridCols, setSlotGridCols] = useState(1);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();

    // Load real CMS pages only.
    const { data: pagesData } = await supabase.from("site_pages")
      .select("id, title, slug, blocks, meta")
      .eq("tenant_id", currentTenant.id)
      .order("sort_order")
      .order("created_at");

    const pages = (pagesData || []).map((p: { id: string; title: string; slug: string; blocks: Block[] | null; meta: Record<string, unknown> | null }) => ({
        id: p.id,
        page_type: p.slug,
        slug: p.slug,
        label: p.title,
        icon: FileQuestion,
        blocks: Array.isArray(p.blocks) ? p.blocks : [],
        meta: p.meta && typeof p.meta === "object" ? p.meta : null,
      }));
    const requestedPageId = searchParams.get("page");
    const requestedPageType = requestedPageId
      ? pages.find((page) => page.id === requestedPageId)?.page_type
      : null;
    const nextSelectedPage =
      requestedPageType ||
      pages.find((page) => page.page_type === selectedPage)?.page_type ||
      pages[0]?.page_type ||
      "";
    const currentPage = pages.find((page) => page.page_type === nextSelectedPage) || null;

    setSitePages(pages);
    setPageBlocks(currentPage?.blocks || []);
    setPageMeta(currentPage?.meta || null);
    if (nextSelectedPage !== selectedPage) {
      setSelectedPage(nextSelectedPage);
    }

    // Load all templates for this tenant
    const { data: tmplData } = await supabase.from("layout_templates")
      .select("*").eq("tenant_id", currentTenant.id);

    if (tmplData) setTemplates(tmplData as LayoutTemplate[]);

    if (!nextSelectedPage) {
      setSlots([]);
      setPageBlocks([]);
      setPageMeta(null);
      const { data: cats } = await supabase.from("categories").select("id, name, slug, color")
        .eq("tenant_id", currentTenant.id).order("sort_order");
      if (cats) setCategories(cats as Category[]);
      setLoading(false);
      return;
    }

    const tmpl = tmplData?.find((template) => template.page_type === nextSelectedPage);
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
    } else {
      setSlots([]);
    }

    const { data: cats } = await supabase.from("categories").select("id, name, slug, color")
      .eq("tenant_id", currentTenant.id).order("sort_order");
    if (cats) setCategories(cats as Category[]);
    setLoading(false);
  }, [currentTenant, searchParams, selectedPage]);

  const updateLibraryScrollState = useCallback((groupId: string) => {
    const node = libraryScrollRefs.current[groupId];
    if (!node) return;

    const maxScrollLeft = Math.max(node.scrollWidth - node.clientWidth, 0);
    setLibraryScrollState((current) => ({
      ...current,
      [groupId]: {
        left: node.scrollLeft > 8,
        right: maxScrollLeft - node.scrollLeft > 8,
      },
    }));
  }, []);

  const scrollLibraryRow = useCallback((groupId: string, direction: "left" | "right") => {
    const node = libraryScrollRefs.current[groupId];
    if (!node) return;
    node.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth",
    });
    window.setTimeout(() => updateLibraryScrollState(groupId), 220);
  }, [updateLibraryScrollState]);

  useEffect(() => {
    load();

    // Subscribe to real-time page changes
    if (!currentTenant) return;
    const supabase = createClient();

    const subscription = supabase
      .channel(`pages:${currentTenant.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'site_pages',
        filter: `tenant_id=eq.${currentTenant.id}`,
      }, async () => {
        await load();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [load, currentTenant]);

  useEffect(() => {
    const available = libraryCategory === "all"
      ? layoutLibrary
      : layoutLibrary.filter((preset) => preset.category === libraryCategory);

    if (!available.length) {
      setSelectedLibraryPresetId(null);
      return;
    }

    if (!selectedLibraryPresetId || !available.some((preset) => preset._libraryKey === selectedLibraryPresetId)) {
      setSelectedLibraryPresetId(available[0]._libraryKey);
    }
  }, [libraryCategory, layoutLibrary, selectedLibraryPresetId]);

  useEffect(() => {
    if (!libraryOpen) return;
    const frame = window.requestAnimationFrame(() => {
      updateLibraryScrollState("templates");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [libraryOpen, libraryCategory, layoutLibrary, updateLibraryScrollState]);

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      toast.error("Inserisci un URL");
      return;
    }
    if (!currentTenant || !selectedPage) {
      toast.error("Crea o seleziona prima una pagina reale nel CMS");
      return;
    }

    setImportingUrl(true);
    try {
      const res = await fetch("/api/layout/import-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl, selector: "body" }),
      });

      const data = await res.json();

      if (!res.ok || !data.slots || data.slots.length === 0) {
        toast.error(data.error || "Nessun blocco trovato");
        setImportingUrl(false);
        return;
      }

      // Save slots to database
      const supabase = createClient();
      let tmpl = templates.find(t => t.page_type === selectedPage);

      if (!tmpl) {
        const { data: newTmpl } = await supabase.from("layout_templates").insert({
          tenant_id: currentTenant.id,
          name: `${currentTenant.name} — ${sitePages.find(p => p.page_type === selectedPage)?.label || selectedPage}`,
          page_type: selectedPage,
        }).select("*").single();

        if (newTmpl) {
          tmpl = newTmpl as LayoutTemplate;
          setTemplates(prev => [...prev, newTmpl as LayoutTemplate]);
        }
      }

      if (!tmpl) {
        toast.error("Errore creazione template");
        setImportingUrl(false);
        return;
      }

      // Insert slots
      const slotsToInsert = (data.slots as ImportedSlot[]).map((s, idx: number) => ({
        template_id: tmpl!.id,
        slot_key: s.slot_key,
        label: s.label,
        description: s.description || "",
        content_type: s.content_type,
        max_items: s.max_items,
        sort_by: s.sort_by || "published_at",
        sort_index: idx,
        category_id: null,
        layout_tag: s.layout?.tag || "div",
        layout_display: s.layout?.display || "block",
        layout_width: s.layout?.width || "100%",
        layout_height: s.layout?.height || "auto",
        layout_grid_cols: s.layout?.grid_cols || 1,
      }));

      const { error } = await supabase.from("layout_slots").insert(slotsToInsert);

      if (error) {
        toast.error("Errore salvataggio slot");
      } else {
        toast.success(`${data.slots.length} blocchi importati!`);
        setImportUrl("");
        await load();
      }
    } catch (error) {
      toast.error("Errore importazione URL");
      console.error(error);
    } finally {
      setImportingUrl(false);
    }
  };

  const resetSlotForm = () => {
    setSlotKey(""); setSlotLabel(""); setSlotDescription(""); setSlotContentType("articles");
    setSlotAssignmentMode("auto"); setSlotCategoryId(""); setSlotMaxItems(6); setSlotSortBy("published_at");
    setSlotWidth("full"); setSlotHeight("auto"); setSlotGridCols(1);
    setEditingSlot(null); setShowNewSlot(false);
  };

  const startEditSlot = (slot: LayoutSlot) => {
    setEditingSlot(slot); setSlotKey(slot.slot_key); setSlotLabel(slot.label);
    setSlotDescription(slot.description ?? ""); setSlotContentType(slot.content_type);
    setSlotAssignmentMode(slot.assignment_mode ?? "auto");
    setSlotCategoryId(slot.category_id ?? ""); setSlotMaxItems(slot.max_items);
    setSlotSortBy(slot.sort_by); setSlotWidth(slot.layout_width); setSlotHeight(slot.layout_height);
    setSlotGridCols(slot.layout_grid_cols); setShowNewSlot(true); setActiveTab("moduli");
  };

  const handleSaveSlot = async () => {
    if (!currentTenant || !selectedPage || !slotKey.trim() || !slotLabel.trim()) { toast.error("Seleziona una pagina e compila chiave e nome"); return; }
    const supabase = createClient();
    let tmpl = templates.find(t => t.page_type === selectedPage);
    if (!tmpl) {
      const currentPage = sitePages.find((page) => page.page_type === selectedPage);
      const { data: newTemplate, error } = await supabase.from("layout_templates").insert({
        tenant_id: currentTenant.id,
        name: `${currentTenant.name} — ${currentPage?.label || selectedPage}`,
        page_type: selectedPage,
      }).select("*").single();
      if (error || !newTemplate) {
        toast.error("Impossibile creare il layout per questa pagina");
        return;
      }
      tmpl = newTemplate as LayoutTemplate;
      setTemplates((prev) => [...prev, tmpl!]);
    }

    const payload = {
      template_id: tmpl.id, slot_key: slotKey.trim().toLowerCase().replace(/\s+/g, "-"),
      label: slotLabel.trim(), description: slotDescription || null, content_type: slotContentType,
      category_id: slotCategoryId || null, max_items: slotMaxItems, sort_by: slotSortBy,
      sort_order: "desc", sort_index: editingSlot ? editingSlot.sort_index : slots.length,
      layout_width: slotWidth, layout_height: slotHeight, layout_grid_cols: slotGridCols,
      layout_tag: "div", layout_display: slotGridCols > 1 ? "grid" : "block",
      assignment_mode: slotAssignmentMode,
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
    if (!selectedPage || !currentTenant) {
      toast.error("Crea o seleziona prima una pagina reale nel CMS");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
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
        let tmpl = templates.find(t => t.page_type === selectedPage);
        if (!tmpl) {
          const currentPage = sitePages.find((page) => page.page_type === selectedPage);
          const { data: newTmpl } = await supabase.from("layout_templates").insert({
            tenant_id: currentTenant!.id,
            name: `${currentTenant!.name} — ${currentPage?.label || selectedPage}`,
            page_type: selectedPage,
          }).select("*").single();
          if (newTmpl) {
            tmpl = newTmpl as LayoutTemplate;
            setTemplates(prev => [...prev, newTmpl as LayoutTemplate]);
          }
        }
        if (tmpl) {
          const pageSlots = data.pages?.[selectedPage]
            || data.slots.filter((s: { page?: string }) => (s.page || selectedPage) === selectedPage)
            || data.slots;
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
        toast.success(`${totalAdded} slot importati nella pagina selezionata`);
        load();
      } else { toast.error("Nessun slot trovato. Aggiungi data-cms-slot al codice."); }
    } catch { toast.error("Errore nel parsing"); }
    setParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAIAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !currentTenant) return;
    if (!selectedPage) {
      toast.error("Crea o seleziona prima una pagina reale nel CMS");
      if (aiFileInputRef.current) aiFileInputRef.current.value = "";
      return;
    }
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
      const selectedPageSlots = data.pages?.[selectedPage] || data.slots || [];
      if (selectedPageSlots.length > 0) {
        const supabase = createClient();
        let totalAdded = 0;
        let tmpl = templates.find(t => t.page_type === selectedPage);
        if (!tmpl) {
          const currentPage = sitePages.find((page) => page.page_type === selectedPage);
          const { data: newTmpl } = await supabase.from("layout_templates").insert({
            tenant_id: currentTenant!.id,
            name: `${currentTenant!.name} — ${currentPage?.label || selectedPage}`,
            page_type: selectedPage,
          }).select("*").single();
          if (newTmpl) {
            tmpl = newTmpl as LayoutTemplate;
            setTemplates(prev => [...prev, newTmpl as LayoutTemplate]);
          }
        }
        if (!tmpl) throw new Error("Template non creato");

        let order = 0;
        for (const s of selectedPageSlots as Array<Record<string, unknown>>) {
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
        toast.success(`IA: ${totalAdded} slot nella pagina selezionata (${data.provider})`);
        useAIStatus.getState().set({ message: `Layout analizzato: ${totalAdded} slot nella pagina selezionata`, provider: data.provider || "" });
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
      setActiveTab("moduli");
      startEditSlot(slots.find(s => s.id === slot.id)!);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} /></div>;
  }

  const libraryCategories = [
    { id: "all", label: "Tutti" },
    ...(layoutLibrary.some((preset) => preset._generated)
      ? [{ id: "ia-generated", label: "IA Generated" }]
      : []),
    ...Array.from(new Set(layoutLibrary.map((preset) => preset.category))).map((category) => ({
      id: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
    })),
  ];

  const filteredLibrary = libraryCategory === "all"
    ? layoutLibrary
    : layoutLibrary.filter((preset) => libraryCategory === "ia-generated" ? preset._generated : preset.category === libraryCategory);
  const libraryGroups = [
    {
      id: "templates",
      label: "Template",
      items: filteredLibrary,
    },
  ].filter((group) => group.items.length > 0);
  const getSingleColumnLabel = (rowIndex: number, totalRows: number, height: number) => {
    if (rowIndex === 0) return "Header";
    if (rowIndex === totalRows - 1) return "Footer";
    if (height >= 45) return "Hero";
    if (height <= 8) return `Separatore ${rowIndex}`;
    if (rowIndex === 1) return "Sezione Principale";
    return `Sezione ${rowIndex + 1}`;
  };

  const numericWidth = (value: string) => {
    const parsed = Number.parseFloat(value.replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getColumnLabels = (cols: string[], rowIndex: number) => {
    if (cols.length === 2) {
      const [left, right] = cols.map(numericWidth);
      if (rowIndex === 1 && left >= 60) return ["Contenuto Principale", "Sidebar"];
      if (rowIndex === 1 && right >= 60) return ["Sidebar", "Contenuto Principale"];
      if (left <= 28 && right >= 60) return ["Sidebar", "Contenuto"];
      if (right <= 28 && left >= 60) return ["Contenuto", "Sidebar"];
      return ["Colonna Sinistra", "Colonna Destra"];
    }

    if (cols.length === 3) {
      const [left, center, right] = cols.map(numericWidth);
      if (center > left && center > right) return ["Colonna SX", "Contenuto Centrale", "Colonna DX"];
      if (left > center && left > right) return ["Hero / Focus", "Supporto", "Supporto"];
      if (right > center && right > left) return ["Supporto", "Supporto", "Hero / Focus"];
      return ["Colonna 1", "Colonna 2", "Colonna 3"];
    }

    if (cols.length === 4) {
      return ["Blocco 1", "Blocco 2", "Blocco 3", "Blocco 4"];
    }

    return cols.map((_, index) => `Blocco ${index + 1}`);
  };

  const renderPresetThumbnail = (preset: { id: string; rows: LayoutPresetDef["rows"] }) => {
    const totalHeight = preset.rows.reduce((sum, row) => sum + (row[0] as number), 0);

    return preset.rows.map((row, rowIndex) => {
      const [height, ...cols] = row;
      const heightPercent = ((height as number) / totalHeight) * 100;
      const singleLabel = cols.length === 1 ? getSingleColumnLabel(rowIndex, preset.rows.length, height as number) : null;
      const labels = cols.length > 1 ? getColumnLabels(cols as string[], rowIndex) : [];
      const isHeader = rowIndex === 0;
      const isFooter = rowIndex === preset.rows.length - 1;

      return (
        <div
          key={`${preset.id}-thumb-row-${rowIndex}`}
          className="flex gap-[4px] shrink-0"
          style={{ height: `${heightPercent}%`, minHeight: 10 }}
        >
          {cols.map((width, columnIndex) => (
            <div
              key={`${preset.id}-thumb-cell-${rowIndex}-${columnIndex}`}
              className="border border-dashed px-1 py-1 flex items-start overflow-hidden"
              style={{
                width: width as string,
                minWidth: 10,
                borderColor: isHeader
                  ? "rgba(29, 78, 216, 0.95)"
                  : isFooter
                    ? "rgba(37, 99, 235, 0.9)"
                    : "rgba(59, 130, 246, 0.82)",
                backgroundColor: isHeader
                  ? "rgba(29, 78, 216, 0.14)"
                  : isFooter
                    ? "rgba(37, 99, 235, 0.14)"
                    : columnIndex % 2 === 1
                      ? "rgba(96, 165, 250, 0.12)"
                      : "rgba(59, 130, 246, 0.08)",
              }}
            >
              <div className="min-w-0 w-full">
                <div className="text-[8px] font-semibold uppercase tracking-[0.08em] leading-none truncate" style={{ color: "var(--c-accent)" }}>
                  {singleLabel || labels[columnIndex] || `Blocco ${columnIndex + 1}`}
                </div>
                <div className="mt-1 flex flex-col gap-[2px]">
                  <div className="h-[4px] w-[84%]" style={{ background: "rgba(59,130,246,0.34)" }} />
                  <div className="h-[4px] w-[58%]" style={{ background: "rgba(59,130,246,0.18)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  function deriveRowsFromBlocks(blocks: Block[]): LayoutPresetDef["rows"] {
    if (!blocks.length) {
      return [[24, "100%"]];
    }

    return blocks.map((block) => {
      const minHeight = typeof block.style?.layout?.minHeight === "string"
        ? Number.parseInt(block.style.layout.minHeight, 10)
        : NaN;
      const height = Number.isFinite(minHeight) ? Math.max(8, Math.min(60, Math.round(minHeight / 10))) : 24;

      if (block.type === "columns" && Array.isArray(block.props?.columnWidths)) {
        const widths = (block.props.columnWidths as unknown[]).map((width) => String(width));
        return [height, ...(widths.length ? widths : ["50%", "50%"])] as LayoutPresetDef["rows"][number];
      }

      return [height, "100%"] as LayoutPresetDef["rows"][number];
    });
  }

  const selectedLibraryPreset = layoutLibrary.find((preset) => preset._libraryKey === selectedLibraryPresetId) || null;
  const selectedSitePage = sitePages.find((page) => page.page_type === selectedPage) || null;
  const selectedLibraryPreviewBlocks = selectedLibraryPreset
    ? (selectedLibraryPreset._generated && selectedLibraryPreset._pageBlocks
        ? selectedLibraryPreset._pageBlocks
        : buildLayoutPresetBlocks(selectedLibraryPreset))
    : [];
  const selectedLibraryPreviewMeta = selectedLibraryPreset?._generated
    ? (selectedLibraryPreset._pageMeta || null)
    : null;
  const renderBlocks = selectedLibraryPreset ? selectedLibraryPreviewBlocks : pageBlocks;
  const renderMeta = selectedLibraryPreset ? selectedLibraryPreviewMeta : pageMeta;
  const renderTitle = selectedLibraryPreset
    ? `Anteprima template: ${selectedLibraryPreset.name}`
    : "Pagina CMS";
  const compareLeftBlocks = selectedSitePage ? pageBlocks : [];
  const compareLeftMeta = selectedSitePage ? pageMeta : null;
  const compareRightBlocks = selectedLibraryPreset ? selectedLibraryPreviewBlocks : renderBlocks;
  const compareRightMeta = selectedLibraryPreset ? selectedLibraryPreviewMeta : renderMeta;

  const handleApplyLibraryPreset = async () => {
    if (!selectedSitePage) {
      toast.error("Apri prima una pagina reale del CMS");
      return;
    }

    if (!selectedLibraryPreset) {
      toast.error("Seleziona prima un template");
      return;
    }

    const confirmed = window.confirm(
      `Applicare "${selectedLibraryPreset.name}" alla pagina "${selectedSitePage.label}"?\n\nI blocchi attuali della pagina verranno sostituiti.`
    );

    if (!confirmed) {
      return;
    }

    const nextBlocks = selectedLibraryPreset._generated && selectedLibraryPreset._pageBlocks
      ? selectedLibraryPreset._pageBlocks
      : buildLayoutPresetBlocks(selectedLibraryPreset);
    if (nextBlocks.length === 0) {
      toast.error("Questo template non ha prodotto blocchi validi");
      return;
    }

    setApplyingPreset(true);
    try {
      await applyBlocksToSelectedPage(nextBlocks, `Template "${selectedLibraryPreset.name}" applicato`, {
        appliedTemplate: {
          source: selectedLibraryPreset._generated ? "ai-generated" : "library",
          name: selectedLibraryPreset.name,
          id: selectedLibraryPreset.id,
        },
      });
    } finally {
      setApplyingPreset(false);
    }
  };

  const applyBlocksToSelectedPage = async (
    nextBlocks: Block[],
    successMessage = "Layout applicato",
    options?: {
      generatedTemplate?: { source: "ai"; name: string };
      appliedTemplate?: { source: "library" | "ai-generated"; name: string; id: string };
    }
  ) => {
    if (!selectedSitePage) {
      throw new Error("Nessuna pagina selezionata");
    }

    const baseMeta = (pageMeta || {}) as Record<string, unknown>;
    const layoutLibraryMeta = ((baseMeta.layoutLibrary as Record<string, unknown> | undefined) || {});
    const nextMeta = {
      ...baseMeta,
      layoutLibrary: {
        ...layoutLibraryMeta,
        ...(options?.generatedTemplate
          ? {
              generatedTemplate: {
                source: options.generatedTemplate.source,
                name: options.generatedTemplate.name,
                updatedAt: new Date().toISOString(),
              },
            }
          : {}),
        ...(options?.appliedTemplate
          ? {
              appliedTemplate: {
                source: options.appliedTemplate.source,
                name: options.appliedTemplate.name,
                id: options.appliedTemplate.id,
                updatedAt: new Date().toISOString(),
              },
            }
          : {}),
      },
    };

    const response = await fetch(`/api/builder/pages/${selectedSitePage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: nextBlocks,
        meta: nextMeta,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Errore applicazione layout");
    }

    const updatedBlocks = Array.isArray(data.page?.blocks) ? (data.page.blocks as Block[]) : nextBlocks;
    const updatedMeta = data.page?.meta && typeof data.page.meta === "object"
      ? (data.page.meta as Record<string, unknown>)
      : nextMeta;

    setPageBlocks(updatedBlocks);
    setPageMeta(updatedMeta);
    setSitePages((current) =>
      current.map((page) =>
        page.id === selectedSitePage.id
          ? { ...page, blocks: updatedBlocks, meta: updatedMeta }
          : page
      )
    );
    setActiveTab("zone");
    toast.success(successMessage);
  };

  return (
    <div className="w-full min-w-0 grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start">
      <LayoutBuilderModal
        open={layoutBuilderOpen}
        onClose={() => setLayoutBuilderOpen(false)}
        onApplyBlocks={(blocks, options) => applyBlocksToSelectedPage(blocks, "Layout builder applicato alla pagina", options)}
      />
      {/* Left: Site tree */}
      <div className="hidden xl:block min-w-0">
        <div className="rounded-2xl border p-3" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <p className="text-[10px] font-semibold uppercase mb-2" style={{ color: "var(--c-text-3)" }}>Pagine sito</p>
        {sitePages.length === 0 ? (
          <div className="rounded-xl border p-3 text-xs" style={{ borderColor: "var(--c-border)", color: "var(--c-text-3)" }}>
            Nessuna pagina reale creata.
          </div>
        ) : (
          <div className="space-y-0.5">
            {sitePages.map(page => {
            const Icon = page.icon;
            const hasSlots = templates.some(t => t.page_type === page.page_type);
            return (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page.page_type)}
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
        )}
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 w-full">
        <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setLibraryOpen((current) => !current)}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--c-text-3)" }}
            >
              {libraryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Libreria Layout
            </button>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/pagine"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "var(--c-bg-0)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Crea pagina
              </Link>
              {selectedSitePage && (
                <Link
                  href={`/dashboard/editor?page=${selectedSitePage.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ background: "var(--c-bg-0)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Apri nell&apos;editor
                </Link>
              )}
              <button
                type="button"
                onClick={() => setLayoutBuilderOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white"
                style={{ background: "var(--c-accent)" }}
              >
                <Pencil className="w-3.5 h-3.5" />
                Builder Layout
              </button>
            </div>
          </div>
          {libraryOpen && (
            <>
              <div className="flex flex-wrap gap-2 mt-4">
                {libraryCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setLibraryCategory(category.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                    style={{
                      background: libraryCategory === category.id ? "var(--c-accent)" : "var(--c-bg-0)",
                      color: libraryCategory === category.id ? "#fff" : "var(--c-text-2)",
                      border: `1px solid ${libraryCategory === category.id ? "var(--c-accent)" : "var(--c-border)"}`,
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-4">
                {libraryGroups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-xl border p-3"
                    style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSubcategories((current) => ({
                          ...current,
                          [group.id]: !current[group.id],
                        }))
                      }
                      className="w-full flex items-center justify-between gap-3 text-left"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--c-text-2)" }}>
                        {group.label}
                      </div>
                      {openSubcategories[group.id] ? (
                        <ChevronUp className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                      )}
                    </button>
                    {openSubcategories[group.id] && (
                      <div className="mt-3 flex items-center gap-2">
                        {libraryScrollState[group.id]?.left ? (
                          <button
                            type="button"
                            onClick={() => scrollLibraryRow(group.id, "left")}
                            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border"
                            style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-1)" }}
                            aria-label="Scorri a sinistra"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        ) : null}
                        <div
                          ref={(node) => {
                            libraryScrollRefs.current[group.id] = node;
                          }}
                          onScroll={() => updateLibraryScrollState(group.id)}
                          className="flex-1 overflow-x-auto pb-2"
                        >
                          <div className="grid grid-flow-col grid-rows-1 auto-cols-[minmax(220px,220px)] gap-4 min-w-max">
                          {group.items.map((preset) => (
                            <button
                              key={preset._libraryKey}
                              type="button"
                              onClick={() => setSelectedLibraryPresetId(preset._libraryKey)}
                              className="rounded-xl text-left transition hover:-translate-y-0.5"
                              style={{ background: "transparent" }}
                            >
                              <div
                                className="rounded-xl p-2.5 flex flex-col gap-[3px] overflow-hidden"
                                style={{
                                  height: 180,
                                  background: "var(--c-bg-0)",
                                  border: `1.5px solid ${selectedLibraryPresetId === preset._libraryKey ? "var(--c-accent)" : "var(--c-border)"}`,
                                  boxShadow: selectedLibraryPresetId === preset._libraryKey ? "0 0 0 3px var(--c-accent-soft)" : "none",
                                }}
                              >
                                {renderPresetThumbnail(preset)}
                              </div>
                              <div className="mt-2 px-1">
                                <div className="text-sm font-semibold leading-tight" style={{ color: "var(--c-text-0)" }}>
                                  {preset.name}
                                </div>
                              </div>
                            </button>
                          ))}
                          </div>
                        </div>
                        {libraryScrollState[group.id]?.right ? (
                          <button
                            type="button"
                            onClick={() => scrollLibraryRow(group.id, "right")}
                            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border"
                            style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-1)" }}
                            aria-label="Scorri a destra"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!selectedPage ? (
          <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
            <LayoutTemplate className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>Il layout parte da pagine reali</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--c-text-2)" }}>
              Qui non vengono piu create pagine fittizie. Crea prima una pagina nel CMS, poi torna qui per costruirne il layout.
            </p>
            <Link
              href="/dashboard/pagine"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "var(--c-accent)" }}
            >
              <Plus className="w-4 h-4" />
              Vai a Pagine
            </Link>
          </div>
        ) : (
        <>
        {/* Tabs + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
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
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-3)" }}>
                Template selezionato
              </div>
              <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                {selectedLibraryPreset?.name || "Nessun template"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyLibraryPreset}
              disabled={!selectedLibraryPreset || !selectedSitePage || applyingPreset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--c-accent)" }}
            >
              {applyingPreset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Applica alla pagina
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => fileInputRef.current?.click()} disabled={parsing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />} Importa File
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

            {/* Import from URL */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
              <input
                type="url"
                placeholder="https://example.com"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleImportFromUrl()}
                className="text-xs px-1.5 rounded bg-transparent outline-none"
                style={{ color: "var(--c-text-1)", width: "200px" }}
              />
              <button
                onClick={handleImportFromUrl}
                disabled={importingUrl || !importUrl.trim()}
                className="flex items-center gap-1 px-2 py-1 text-white rounded text-xs font-medium transition disabled:opacity-50"
                style={{ background: "var(--c-accent)" }}
              >
                {importingUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileQuestion className="w-3 h-3" />}
              </button>
            </div>

            <button onClick={() => { resetSlotForm(); setShowNewSlot(true); setActiveTab("moduli"); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-white rounded-lg text-xs font-semibold transition"
              style={{ background: "var(--c-accent)" }}>
              <Plus className="w-3.5 h-3.5" /> Slot
            </button>
          </div>
        </div>

        {/* ZONE TAB: Visual wireframe */}
        {activeTab === "zone" && (
          renderBlocks.length > 0 ? (
            <BuilderLayoutRenderedPreview blocks={renderBlocks} meta={renderMeta} tenantSlug={currentTenant?.slug} />
          ) : slots.length > 0 ? (
            <ZoneRenderer
              slots={slots.map(s => ({
                ...s,
                sort_index: s.sort_index,
              }))}
              onSlotClick={handleZoneClick}
            />
          ) : (
            <BuilderLayoutRenderedPreview blocks={renderBlocks} meta={renderMeta} tenantSlug={currentTenant?.slug} />
          )
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
                    <label className="text-[10px] font-medium" style={{ color: "var(--c-text-2)" }}>Modalità riempimento</label>
                    <select value={slotAssignmentMode} onChange={e => setSlotAssignmentMode(e.target.value)} className="input w-full mt-0.5 text-xs">
                      <option value="auto">Automatico</option><option value="manual">Manuale</option><option value="mixed">Misto</option>
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
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-semibold truncate" style={{ color: "var(--c-text-0)" }}>{slot.label}</p>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                              {slot.assignment_mode === "manual" ? "Manuale" : slot.assignment_mode === "mixed" ? "Misto" : "Auto"}
                            </span>
                          </div>
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

        {/* PREVIEW TAB: pagina originale vs layout selezionato */}
        {activeTab === "preview" && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ minHeight: "72vh" }}>
              {/* LEFT: Pagina corrente/originale */}
              <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid var(--c-border)" }}>
                <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--c-accent)" }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--c-accent)" }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--c-accent)" }} />
                  </div>
                  <div className="flex-1 rounded-md px-2 py-0.5 text-[9px] font-mono text-center"
                    style={{ background: "var(--c-bg-3)", color: "var(--c-text-2)" }}>
                    {selectedSitePage ? `Pagina originale: ${selectedSitePage.label}` : "Nessuna pagina selezionata"}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2" style={{ background: "var(--c-bg-0)" }}>
                  {compareLeftBlocks.length > 0 ? (
                    <BuilderLayoutRenderedPreview blocks={compareLeftBlocks} meta={compareLeftMeta} tenantSlug={currentTenant?.slug} />
                  ) : (
                    <div className="h-full min-h-[360px] flex items-center justify-center text-center px-6" style={{ background: "var(--c-bg-1)" }}>
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--c-text-2)" }}>Nessuna pagina originale da confrontare</p>
                        <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
                          Seleziona una pagina reale del CMS per vedere il confronto a sinistra.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Layout selezionato / render attivo */}
              <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid var(--c-border)" }}>
                <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: "#eab308" }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                  </div>
                  <div className="flex-1 rounded-md px-2 py-0.5 text-[9px] font-mono text-center"
                    style={{ background: "var(--c-bg-3)", color: "var(--c-text-2)" }}>
                    {selectedLibraryPreset ? `Template selezionato: ${selectedLibraryPreset.name}` : renderTitle}
                  </div>
                </div>
                {compareRightBlocks.length > 0 ? (
                  <div className="flex-1 overflow-auto p-2" style={{ background: "var(--c-bg-0)" }}>
                    <BuilderLayoutRenderedPreview blocks={compareRightBlocks} meta={compareRightMeta} tenantSlug={currentTenant?.slug} />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center min-h-[360px]" style={{ background: "var(--c-bg-1)" }}>
                    <div className="text-center px-6">
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--c-text-2)" }}>Nessun layout da mostrare</p>
                      <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
                        Seleziona un template dalla libreria oppure costruisci un layout.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
