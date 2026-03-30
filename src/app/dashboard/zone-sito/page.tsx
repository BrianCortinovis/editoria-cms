"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  LayoutGrid,
  Image,
  Video,
  Zap,
  SlidersHorizontal,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Pencil,
  Check,
  X,
  ChevronDown,
  GripVertical,
  Eye,
} from "lucide-react";

interface ContentZone {
  id: string;
  tenant_id: string;
  zone_key: string;
  label: string;
  zone_type: string;
  description: string;
  source_mode: string;
  source_config: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  max_items: number;
  auto_interval_ms: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ManualItem {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  category: string;
}

const ZONE_TYPES = [
  { value: "slideshow", label: "Slideshow", icon: Image },
  { value: "banner", label: "Banner", icon: LayoutGrid },
  { value: "video", label: "Video", icon: Video },
  { value: "ticker", label: "Ticker", icon: Zap },
  { value: "carousel", label: "Carousel", icon: SlidersHorizontal },
];

const SOURCE_MODES = [
  { value: "auto", label: "Automatico — ultimi articoli" },
  { value: "featured", label: "Solo articoli in evidenza" },
  { value: "category", label: "Articoli di una categoria" },
  { value: "manual", label: "Selezione manuale" },
];

const ZONE_TYPE_ICON: Record<string, typeof Image> = {
  slideshow: Image,
  banner: LayoutGrid,
  video: Video,
  ticker: Zap,
  carousel: SlidersHorizontal,
};

export default function ZoneSitoPage() {
  const { currentTenant } = useAuthStore();
  const [zones, setZones] = useState<ContentZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formKey, setFormKey] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formType, setFormType] = useState("slideshow");
  const [formDesc, setFormDesc] = useState("");
  const [formSource, setFormSource] = useState("auto");
  const [formConfig, setFormConfig] = useState<Record<string, unknown>>({});
  const [formItems, setFormItems] = useState<ManualItem[]>([]);
  const [formMaxItems, setFormMaxItems] = useState(8);
  const [formInterval, setFormInterval] = useState(5000);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const sb = createClient();
    const { data, error } = await sb
      .from("content_zones")
      .select("*")
      .eq("tenant_id", currentTenant.id)
      .order("sort_order");
    if (error) toast.error(error.message);
    setZones(data || []);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormKey(""); setFormLabel(""); setFormType("slideshow"); setFormDesc("");
    setFormSource("auto"); setFormConfig({}); setFormItems([]);
    setFormMaxItems(8); setFormInterval(5000);
    setEditingId(null); setShowForm(false);
  };

  const openEdit = (z: ContentZone) => {
    setFormKey(z.zone_key); setFormLabel(z.label); setFormType(z.zone_type);
    setFormDesc(z.description || ""); setFormSource(z.source_mode);
    setFormConfig(z.source_config || {}); setFormItems((z.items || []) as unknown as ManualItem[]);
    setFormMaxItems(z.max_items); setFormInterval(z.auto_interval_ms);
    setEditingId(z.id); setShowForm(true);
  };

  const save = async () => {
    if (!currentTenant || !formKey || !formLabel) {
      toast.error("Chiave e nome sono obbligatori");
      return;
    }

    const payload = {
      tenant_id: currentTenant.id,
      zone_key: formKey,
      label: formLabel,
      zone_type: formType,
      description: formDesc,
      source_mode: formSource,
      source_config: formConfig,
      items: formItems,
      max_items: formMaxItems,
      auto_interval_ms: formInterval,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await createClient()
        .from("content_zones")
        .update(payload)
        .eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Zona aggiornata");
    } else {
      const { error } = await createClient()
        .from("content_zones")
        .insert({ ...payload, sort_order: zones.length });
      if (error) { toast.error(error.message); return; }
      toast.success("Zona creata");
    }

    resetForm();
    load();
  };

  const toggleActive = async (z: ContentZone) => {
    const { error } = await createClient()
      .from("content_zones")
      .update({ is_active: !z.is_active })
      .eq("id", z.id);
    if (error) toast.error(error.message);
    else load();
  };

  const deleteZone = async (z: ContentZone) => {
    if (!confirm(`Eliminare la zona "${z.label}"?`)) return;
    const { error } = await createClient()
      .from("content_zones")
      .delete()
      .eq("id", z.id);
    if (error) toast.error(error.message);
    else { toast.success("Zona eliminata"); load(); }
  };

  const addManualItem = () => {
    setFormItems([...formItems, { id: crypto.randomUUID(), title: "", image_url: "", link_url: "", category: "" }]);
  };

  const updateManualItem = (idx: number, key: string, value: string) => {
    const updated = [...formItems];
    (updated[idx] as unknown as Record<string, string>)[key] = value;
    setFormItems(updated);
  };

  const removeManualItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  if (!currentTenant) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
            Zone Sito
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
            Gestisci slideshow, banner, ticker e carousel del sito. Le zone appaiono solo se il sito le supporta.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--c-accent)" }}
        >
          <Plus size={16} />
          Nuova zona
        </button>
      </div>

      {/* Zone list */}
      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: "var(--c-text-2)" }}>Caricamento...</div>
      ) : zones.length === 0 && !showForm ? (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <LayoutGrid size={32} className="mx-auto mb-3" style={{ color: "var(--c-text-2)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--c-text-1)" }}>Nessuna zona configurata</p>
          <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
            Crea zone per gestire slideshow, banner e carousel del sito.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((z) => {
            const Icon = ZONE_TYPE_ICON[z.zone_type] || LayoutGrid;
            return (
              <div
                key={z.id}
                className="flex items-center gap-4 rounded-xl border p-4"
                style={{
                  borderColor: "var(--c-border)",
                  background: "var(--c-bg-1)",
                  opacity: z.is_active ? 1 : 0.5,
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--c-accent-soft)" }}
                >
                  <Icon size={18} style={{ color: "var(--c-accent)" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                      {z.label}
                    </span>
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}
                    >
                      {z.zone_type}
                    </span>
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-mono"
                      style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}
                    >
                      {z.zone_key}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--c-text-2)" }}>
                    {z.description || SOURCE_MODES.find(s => s.value === z.source_mode)?.label || z.source_mode}
                    {z.source_mode === "manual" && ` · ${(z.items || []).length} elementi`}
                    {z.max_items > 0 && ` · max ${z.max_items}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEdit(z)}
                    className="rounded-lg p-2 transition hover:bg-white/10"
                    title="Modifica"
                  >
                    <Pencil size={14} style={{ color: "var(--c-text-2)" }} />
                  </button>
                  <button
                    onClick={() => toggleActive(z)}
                    className="rounded-lg p-2 transition hover:bg-white/10"
                    title={z.is_active ? "Disattiva" : "Attiva"}
                  >
                    {z.is_active ? (
                      <Power size={14} style={{ color: "#22c55e" }} />
                    ) : (
                      <PowerOff size={14} style={{ color: "#ef4444" }} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteZone(z)}
                    className="rounded-lg p-2 transition hover:bg-white/10"
                    title="Elimina"
                  >
                    <Trash2 size={14} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "var(--c-accent)", background: "var(--c-bg-1)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              {editingId ? "Modifica zona" : "Nuova zona"}
            </h3>
            <button onClick={resetForm} className="rounded-lg p-1">
              <X size={16} style={{ color: "var(--c-text-2)" }} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
                Chiave zona (ID univoco)
              </label>
              <input
                value={formKey}
                onChange={(e) => setFormKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="es: slideshow-foto, ticker, sidebar-left"
                className="input w-full"
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
                Nome visualizzato
              </label>
              <input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="es: Slideshow Foto Valle"
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
              Descrizione
            </label>
            <input
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Dove appare questa zona nel sito"
              className="input w-full"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
                Tipo
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="input w-full"
              >
                {ZONE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
                Fonte contenuti
              </label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="input w-full"
              >
                {SOURCE_MODES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
                Max elementi
              </label>
              <input
                type="number"
                value={formMaxItems}
                onChange={(e) => setFormMaxItems(Number(e.target.value))}
                min={1}
                max={50}
                className="input w-full"
              />
            </div>
          </div>

          {formSource === "category" && (
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
                Slug categoria
              </label>
              <input
                value={String(formConfig.category_slug || "")}
                onChange={(e) => setFormConfig({ ...formConfig, category_slug: e.target.value })}
                placeholder="es: cronaca, sport"
                className="input w-full"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
              Intervallo rotazione (ms)
            </label>
            <input
              type="number"
              value={formInterval}
              onChange={(e) => setFormInterval(Number(e.target.value))}
              min={1000}
              step={500}
              className="input w-full"
            />
            <p className="mt-0.5 text-[10px]" style={{ color: "var(--c-text-2)" }}>
              {formInterval}ms = {(formInterval / 1000).toFixed(1)} secondi
            </p>
          </div>

          {/* Manual items */}
          {formSource === "manual" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
                  Elementi manuali ({formItems.length})
                </label>
                <button
                  onClick={addManualItem}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold"
                  style={{ background: "var(--c-accent)", color: "#fff" }}
                >
                  <Plus size={12} /> Aggiungi
                </button>
              </div>
              {formItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="rounded-lg border p-3 space-y-2"
                  style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold" style={{ color: "var(--c-text-2)" }}>
                      Elemento {idx + 1}
                    </span>
                    <button onClick={() => removeManualItem(idx)}>
                      <Trash2 size={12} style={{ color: "#ef4444" }} />
                    </button>
                  </div>
                  <input
                    value={item.title}
                    onChange={(e) => updateManualItem(idx, "title", e.target.value)}
                    placeholder="Titolo"
                    className="input w-full text-xs"
                  />
                  <input
                    value={item.image_url}
                    onChange={(e) => updateManualItem(idx, "image_url", e.target.value)}
                    placeholder="URL immagine"
                    className="input w-full text-xs"
                  />
                  <input
                    value={item.link_url}
                    onChange={(e) => updateManualItem(idx, "link_url", e.target.value)}
                    placeholder="URL destinazione"
                    className="input w-full text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={save}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--c-accent)" }}
            >
              <Check size={14} />
              {editingId ? "Salva modifiche" : "Crea zona"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)" }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
