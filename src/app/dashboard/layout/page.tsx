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
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
            Definisci le zone del sito dove appariranno i contenuti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition disabled:opacity-50"
            style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
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
            className="flex items-center gap-2 px-3 py-2 text-white text-sm font-semibold rounded-lg transition"
            style={{ background: "var(--c-accent)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
          >
            <Plus className="w-4 h-4" /> Nuovo Slot
          </button>
        </div>
      </div>

      {/* How it works banner */}
      {slots.length === 0 && !showNewSlot && (
        <div className="rounded-xl p-6 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--c-accent-soft)" }}>
              <LayoutTemplate className="w-5 h-5" style={{ color: "var(--c-accent)" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>Come funziona il Layout Mapping</h3>
              <div className="space-y-2 text-sm" style={{ color: "var(--c-text-2)" }}>
                <p>1. <strong style={{ color: "var(--c-text-0)" }}>Costruisci il sito frontend</strong> con i tuoi componenti custom</p>
                <p>2. <strong style={{ color: "var(--c-text-0)" }}>Aggiungi</strong> <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--c-bg-2)", color: "var(--c-accent)" }}>data-cms-slot=&quot;nome-zona&quot;</code> ai tag HTML delle zone</p>
                <p>3. <strong style={{ color: "var(--c-text-0)" }}>Importa</strong> la cartella del sito con &quot;Importa da sito&quot; — il parser troverà gli slot automaticamente</p>
                <p>4. <strong style={{ color: "var(--c-text-0)" }}>Il cliente</strong> clicca sulle zone per gestire i contenuti</p>
              </div>
              <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--c-bg-0)" }}>
                <p className="text-[11px] mb-1.5 font-medium" style={{ color: "var(--c-text-3)" }}>Esempio nel tuo HTML/JSX:</p>
                <pre className="text-xs font-mono leading-relaxed overflow-x-auto" style={{ color: "var(--c-accent)" }}>{`<section data-cms-slot="hero" data-cms-label="Articolo Principale" data-cms-count="1">
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
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              {editingSlot ? "Modifica Slot" : "Nuovo Slot"}
            </h3>
            <button onClick={resetSlotForm}><X className="w-4 h-4" style={{ color: "var(--c-text-2)" }} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Chiave slot *</label>
              <input type="text" value={slotKey} onChange={e => setSlotKey(e.target.value)}
                placeholder="es: hero, cronaca-grid, sidebar-sport"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border-light)", color: "var(--c-text-0)", "--tw-ring-color": "var(--c-accent)" } as React.CSSProperties} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Nome visualizzato *</label>
              <input type="text" value={slotLabel} onChange={e => setSlotLabel(e.target.value)}
                placeholder="es: Articolo Principale"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border-light)", color: "var(--c-text-0)", "--tw-ring-color": "var(--c-accent)" } as React.CSSProperties} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Tipo contenuto</label>
              <select value={slotContentType} onChange={e => setSlotContentType(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border-light)", color: "var(--c-text-0)", "--tw-ring-color": "var(--c-accent)" } as React.CSSProperties}>
                <option value="articles">Articoli</option>
                <option value="events">Eventi</option>
                <option value="breaking_news">Breaking News</option>
                <option value="banners">Banner</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Categoria (opzionale)</label>
              <select value={slotCategoryId} onChange={e => setSlotCategoryId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border-light)", color: "var(--c-text-0)", "--tw-ring-color": "var(--c-accent)" } as React.CSSProperties}>
                <option value="">Tutte le categorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Max articoli</label>
              <input type="number" value={slotMaxItems} onChange={e => setSlotMaxItems(Number(e.target.value))}
                min={1} max={50}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border-light)", color: "var(--c-text-0)", "--tw-ring-color": "var(--c-accent)" } as React.CSSProperties} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Ordinamento</label>
              <select value={slotSortBy} onChange={e => setSlotSortBy(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border-light)", color: "var(--c-text-0)", "--tw-ring-color": "var(--c-accent)" } as React.CSSProperties}>
                <option value="published_at">Più recente</option>
                <option value="view_count">Più letto</option>
                <option value="homepage_position">Posizione manuale</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Descrizione</label>
              <input type="text" value={slotDescription} onChange={e => setSlotDescription(e.target.value)}
                placeholder="Dove si trova questa zona nel sito..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border-light)", color: "var(--c-text-0)", "--tw-ring-color": "var(--c-accent)" } as React.CSSProperties} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetSlotForm} className="px-4 py-2 text-sm font-medium rounded-lg transition" style={{ color: "var(--c-text-2)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>Annulla</button>
            <button onClick={handleSaveSlot}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}>
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
                className="rounded-xl overflow-hidden transition group"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--c-border-light)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--c-border)"}
              >
                {/* Slot header */}
                <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--c-accent-soft)" }}>
                    <Icon className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text-0)" }}>{slot.label}</p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--c-text-3)" }}>{slot.slot_key}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => startEditSlot(slot)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition"
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <Pencil className="w-3.5 h-3.5" style={{ color: "var(--c-text-2)" }} />
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
                    <span style={{ color: "var(--c-text-2)" }}>Tipo</span>
                    <span style={{ color: "var(--c-text-0)" }}>{contentTypeLabels[slot.content_type]}</span>
                  </div>
                  {cat && (
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "var(--c-text-2)" }}>Categoria</span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span style={{ color: "var(--c-text-0)" }}>{cat.name}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--c-text-2)" }}>Mostra</span>
                    <span style={{ color: "var(--c-text-0)" }}>{slot.max_items} elementi</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--c-text-2)" }}>Ordine</span>
                    <span style={{ color: "var(--c-text-0)" }}>
                      {slot.sort_by === "published_at" ? "Più recente" :
                       slot.sort_by === "view_count" ? "Più letto" : "Manuale"}
                    </span>
                  </div>
                </div>

                {/* Slot footer: go to articles */}
                <Link
                  href={`/dashboard/articoli${cat ? `?category=${cat.slug}` : ""}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition"
                  style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-accent)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-soft)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
