"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  LayoutTemplate,
  Upload,
  Plus,
  Trash2,
  Settings,
  FileText,
  Image as ImageIcon,
  Calendar,
  Zap,
  Megaphone,
  X,
  Check,
  Loader2,
  FolderUp,
  Eye,
  GripVertical,
  Pencil,
  ArrowRight,
  ScanLine,
} from "lucide-react";
import Link from "next/link";

interface LayoutSlot {
  id: string;
  slot_key: string;
  label: string;
  description: string | null;
  slot_type: string;
  category_id: string | null;
  content_type: string;
  max_items: number;
  sort_by: string;
  sort_order: string;
  sort_index: number;
  style_hint: string | null;
  category_name?: string;
  article_count?: number;
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

const contentTypeIcons: Record<string, typeof FileText> = {
  articles: FileText,
  events: Calendar,
  breaking_news: Zap,
  banners: Megaphone,
  media: ImageIcon,
};

const contentTypeLabels: Record<string, string> = {
  articles: "Articoli",
  events: "Eventi",
  breaking_news: "Breaking News",
  banners: "Banner",
  media: "Media",
};

export default function LayoutPage() {
  const { currentTenant } = useAuthStore();
  const [template, setTemplate] = useState<LayoutTemplate | null>(null);
  const [slots, setSlots] = useState<LayoutSlot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<LayoutSlot | null>(null);
  const [showNewSlot, setShowNewSlot] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slot form
  const [slotKey, setSlotKey] = useState("");
  const [slotLabel, setSlotLabel] = useState("");
  const [slotDescription, setSlotDescription] = useState("");
  const [slotContentType, setSlotContentType] = useState("articles");
  const [slotCategoryId, setSlotCategoryId] = useState("");
  const [slotMaxItems, setSlotMaxItems] = useState(6);
  const [slotSortBy, setSlotSortBy] = useState("published_at");

  const load = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();

    // Load or create template
    let { data: tmpl } = await supabase
      .from("layout_templates")
      .select("*")
      .eq("tenant_id", currentTenant.id)
      .eq("page_type", "homepage")
      .single();

    if (!tmpl) {
      const { data: newTmpl } = await supabase
        .from("layout_templates")
        .insert({
          tenant_id: currentTenant.id,
          name: `${currentTenant.name} — Homepage`,
          page_type: "homepage",
        })
        .select("*")
        .single();
      tmpl = newTmpl;
    }

    if (tmpl) {
      setTemplate(tmpl as LayoutTemplate);

      // Load slots
      const { data: slotData } = await supabase
        .from("layout_slots")
        .select("*, categories(name)")
        .eq("template_id", tmpl.id)
        .order("sort_index");

      if (slotData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSlots(slotData.map((s: any) => ({
          ...s,
          category_name: s.categories?.name ?? null,
        })));
      }
    }

    // Load categories
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, slug, color")
      .eq("tenant_id", currentTenant.id)
      .order("sort_order");
    if (cats) setCategories(cats as Category[]);

    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

  const resetSlotForm = () => {
    setSlotKey(""); setSlotLabel(""); setSlotDescription("");
    setSlotContentType("articles"); setSlotCategoryId("");
    setSlotMaxItems(6); setSlotSortBy("published_at");
    setEditingSlot(null); setShowNewSlot(false);
  };

  const startEditSlot = (slot: LayoutSlot) => {
    setEditingSlot(slot);
    setSlotKey(slot.slot_key);
    setSlotLabel(slot.label);
    setSlotDescription(slot.description ?? "");
    setSlotContentType(slot.content_type);
    setSlotCategoryId(slot.category_id ?? "");
    setSlotMaxItems(slot.max_items);
    setSlotSortBy(slot.sort_by);
    setShowNewSlot(true);
  };

  const handleSaveSlot = async () => {
    if (!template || !slotKey.trim() || !slotLabel.trim()) {
      toast.error("Chiave e nome sono obbligatori");
      return;
    }
    const supabase = createClient();

    const payload = {
      template_id: template.id,
      slot_key: slotKey.trim().toLowerCase().replace(/\s+/g, "-"),
      label: slotLabel.trim(),
      description: slotDescription || null,
      content_type: slotContentType,
      category_id: slotCategoryId || null,
      max_items: slotMaxItems,
      sort_by: slotSortBy,
      sort_order: "desc",
      sort_index: editingSlot ? editingSlot.sort_index : slots.length,
    };

    if (editingSlot) {
      const { error } = await supabase
        .from("layout_slots")
        .update(payload)
        .eq("id", editingSlot.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Slot aggiornato");
    } else {
      const { error } = await supabase.from("layout_slots").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Slot creato");
    }
    resetSlotForm();
    load();
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Eliminare questo slot?")) return;
    const supabase = createClient();
    await supabase.from("layout_slots").delete().eq("id", id);
    setSlots(prev => prev.filter(s => s.id !== id));
    toast.success("Slot eliminato");
  };

  // Parse files from folder upload
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setParsing(true);

    const filesToParse: { path: string; content: string }[] = [];

    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["html", "htm", "tsx", "jsx", "vue", "svelte", "astro"].includes(ext)) continue;
      if (file.name.includes("node_modules") || file.name.startsWith(".")) continue;

      try {
        const content = await file.text();
        filesToParse.push({
          path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
          content,
        });
      } catch {
        // skip unreadable files
      }
    }

    if (filesToParse.length === 0) {
      toast.error("Nessun file HTML/JSX trovato");
      setParsing(false);
      return;
    }

    toast.success(`Analizzando ${filesToParse.length} file...`);

    try {
      const res = await fetch("/api/layout/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesToParse }),
      });
      const data = await res.json();

      if (data.slots && data.slots.length > 0) {
        // Auto-create slots
        if (!template) { setParsing(false); return; }
        const supabase = createClient();

        let added = 0;
        for (const parsedSlot of data.slots) {
          // Skip if already exists
          if (slots.find(s => s.slot_key === parsedSlot.slot_key)) continue;

          // Try to match category by slot key
          const matchedCat = categories.find(
            c => parsedSlot.slot_key.includes(c.slug) || parsedSlot.label.toLowerCase().includes(c.name.toLowerCase())
          );

          await supabase.from("layout_slots").insert({
            template_id: template.id,
            slot_key: parsedSlot.slot_key,
            label: parsedSlot.label,
            description: parsedSlot.description,
            content_type: parsedSlot.content_type,
            category_id: matchedCat?.id ?? null,
            max_items: parsedSlot.max_items,
            sort_by: "published_at",
            sort_order: "desc",
            sort_index: slots.length + added,
            style_hint: parsedSlot.style_hint,
          });
          added++;
        }

        toast.success(`${added} slot importati da ${data.count} trovati`);
        load();
      } else {
        toast.error("Nessun slot data-cms-slot trovato nei file. Aggiungi data-cms-slot ai tuoi componenti.");
      }
    } catch {
      toast.error("Errore nel parsing");
    }

    setParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-zinc-500">
            Definisci le zone del sito dove appariranno i contenuti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className="flex items-center gap-2 px-3 py-2 bg-[#27272a] text-zinc-300 text-sm font-medium rounded-lg hover:bg-[#3f3f46] transition disabled:opacity-50"
          >
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            Importa da sito
          </button>
          <input
            ref={fileInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is not in standard HTML types
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleFolderUpload}
          />
          <button
            onClick={() => { resetSlotForm(); setShowNewSlot(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Nuovo Slot
          </button>
        </div>
      </div>

      {/* How it works banner */}
      {slots.length === 0 && !showNewSlot && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
              <LayoutTemplate className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Come funziona il Layout Mapping</h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <p>1. <strong className="text-zinc-200">Costruisci il sito frontend</strong> con i tuoi componenti custom</p>
                <p>2. <strong className="text-zinc-200">Aggiungi</strong> <code className="px-1.5 py-0.5 bg-[#27272a] rounded text-blue-400 text-xs">data-cms-slot=&quot;nome-zona&quot;</code> ai tag HTML delle zone</p>
                <p>3. <strong className="text-zinc-200">Importa</strong> la cartella del sito con &quot;Importa da sito&quot; — il parser troverà gli slot automaticamente</p>
                <p>4. <strong className="text-zinc-200">Il cliente</strong> clicca sulle zone per gestire i contenuti</p>
              </div>
              <div className="mt-4 p-3 bg-[#0f0f11] rounded-lg">
                <p className="text-[11px] text-zinc-600 mb-1.5 font-medium">Esempio nel tuo HTML/JSX:</p>
                <pre className="text-xs text-blue-400 font-mono leading-relaxed overflow-x-auto">{`<section data-cms-slot="hero" data-cms-label="Articolo Principale" data-cms-count="1">
<div data-cms-slot="cronaca-grid" data-cms-label="Ultimi Cronaca" data-cms-count="6">
<aside data-cms-slot="sidebar-sport" data-cms-label="Sport" data-cms-count="3">
<!-- CMS:eventi-home:Prossimi Eventi:4 -->`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slot Form */}
      {showNewSlot && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {editingSlot ? "Modifica Slot" : "Nuovo Slot"}
            </h3>
            <button onClick={resetSlotForm}><X className="w-4 h-4 text-zinc-500" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-500 font-medium">Chiave slot *</label>
              <input type="text" value={slotKey} onChange={e => setSlotKey(e.target.value)}
                placeholder="es: hero, cronaca-grid, sidebar-sport"
                className="w-full mt-1 px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium">Nome visualizzato *</label>
              <input type="text" value={slotLabel} onChange={e => setSlotLabel(e.target.value)}
                placeholder="es: Articolo Principale"
                className="w-full mt-1 px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium">Tipo contenuto</label>
              <select value={slotContentType} onChange={e => setSlotContentType(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="articles">Articoli</option>
                <option value="events">Eventi</option>
                <option value="breaking_news">Breaking News</option>
                <option value="banners">Banner</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium">Categoria (opzionale)</label>
              <select value={slotCategoryId} onChange={e => setSlotCategoryId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Tutte le categorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium">Max articoli</label>
              <input type="number" value={slotMaxItems} onChange={e => setSlotMaxItems(Number(e.target.value))}
                min={1} max={50}
                className="w-full mt-1 px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium">Ordinamento</label>
              <select value={slotSortBy} onChange={e => setSlotSortBy(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="published_at">Più recente</option>
                <option value="view_count">Più letto</option>
                <option value="homepage_position">Posizione manuale</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-zinc-500 font-medium">Descrizione</label>
              <input type="text" value={slotDescription} onChange={e => setSlotDescription(e.target.value)}
                placeholder="Dove si trova questa zona nel sito..."
                className="w-full mt-1 px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetSlotForm} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-[#27272a] rounded-lg transition">Annulla</button>
            <button onClick={handleSaveSlot}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
              <Check className="w-4 h-4" /> Salva
            </button>
          </div>
        </div>
      )}

      {/* Slots Grid */}
      {slots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {slots.map(slot => {
            const Icon = contentTypeIcons[slot.content_type] || FileText;
            const cat = categories.find(c => c.id === slot.category_id);
            return (
              <div
                key={slot.id}
                className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#3f3f46] transition group"
              >
                {/* Slot header */}
                <div className="px-4 py-3 border-b border-[#27272a] flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{slot.label}</p>
                    <p className="text-[10px] text-zinc-600 font-mono">{slot.slot_key}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => startEditSlot(slot)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#27272a]">
                      <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                    <button onClick={() => handleDeleteSlot(slot.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-950">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Slot body */}
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Tipo</span>
                    <span className="text-zinc-300">{contentTypeLabels[slot.content_type]}</span>
                  </div>
                  {cat && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Categoria</span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-zinc-300">{cat.name}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Mostra</span>
                    <span className="text-zinc-300">{slot.max_items} elementi</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Ordine</span>
                    <span className="text-zinc-300">
                      {slot.sort_by === "published_at" ? "Più recente" :
                       slot.sort_by === "view_count" ? "Più letto" : "Manuale"}
                    </span>
                  </div>
                </div>

                {/* Slot footer: go to articles */}
                <Link
                  href={`/dashboard/articoli${cat ? `?category=${cat.slug}` : ""}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border-t border-[#27272a] text-xs font-medium text-blue-400 hover:bg-blue-600/10 transition"
                >
                  Gestisci contenuti <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
