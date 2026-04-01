"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  Plus,
  Megaphone,
  Trash2,
  Pencil,
  X,
  Check,
  Eye,
  MousePointer,
  BarChart3,
  Power,
  Image as ImageIcon,
  Code,
  Loader2,
  Monitor,
  Smartphone,
} from "lucide-react";
import AIButton from "@/components/ai/AIButton";

interface Banner {
  id: string;
  name: string;
  position: string;
  type: string;
  image_url: string | null;
  html_content: string | null;
  link_url: string | null;
  target_categories: string[];
  target_device: string;
  weight: number;
  impressions: number;
  clicks: number;
  advertiser_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface BannerOverlayConfig {
  enabled: boolean;
  delay_seconds: number;
  target_article_slugs: string[];
  title: string;
  description: string;
  cta_label: string;
  cta_url: string;
}

interface Advertiser {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const positions = [
  { value: "header", label: "Header" },
  { value: "sidebar", label: "Sidebar (entrambe)" },
  { value: "sidebar-left", label: "Sidebar Sinistra" },
  { value: "sidebar-right", label: "Sidebar Destra" },
  { value: "in_article", label: "In-Article" },
  { value: "footer", label: "Footer" },
  { value: "interstitial", label: "Interstitial" },
];

const bannerTypes = [
  { value: "image", label: "Immagine", icon: ImageIcon },
  { value: "html", label: "HTML/JS", icon: Code },
  { value: "adsense", label: "AdSense", icon: BarChart3 },
];

const DEFAULT_OVERLAY_CONFIG: BannerOverlayConfig = {
  enabled: false,
  delay_seconds: 0.8,
  target_article_slugs: [],
  title: "",
  description: "",
  cta_label: "Apri sponsor",
  cta_url: "",
};

function parseOverlayConfig(htmlContent: string | null): BannerOverlayConfig {
  if (!htmlContent) return { ...DEFAULT_OVERLAY_CONFIG };

  try {
    const parsed = JSON.parse(htmlContent);
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_OVERLAY_CONFIG };
    }

    return {
      enabled: parsed.enabled === true,
      delay_seconds: Number(parsed.delay_seconds) > 0 ? Number(parsed.delay_seconds) : DEFAULT_OVERLAY_CONFIG.delay_seconds,
      target_article_slugs: Array.isArray(parsed.target_article_slugs) ? parsed.target_article_slugs.map(String).filter(Boolean) : [],
      title: typeof parsed.title === "string" ? parsed.title : "",
      description: typeof parsed.description === "string" ? parsed.description : "",
      cta_label: typeof parsed.cta_label === "string" && parsed.cta_label ? parsed.cta_label : DEFAULT_OVERLAY_CONFIG.cta_label,
      cta_url: typeof parsed.cta_url === "string" ? parsed.cta_url : "",
    };
  } catch {
    return { ...DEFAULT_OVERLAY_CONFIG };
  }
}

function buildBannerHtmlContent(type: string, htmlContent: string, overlayConfig: BannerOverlayConfig) {
  if (type === "html") {
    return htmlContent || null;
  }

  if (!overlayConfig.enabled) {
    return null;
  }

  return JSON.stringify({
    enabled: true,
    delay_seconds: overlayConfig.delay_seconds,
    target_article_slugs: overlayConfig.target_article_slugs,
    title: overlayConfig.title,
    description: overlayConfig.description,
    cta_label: overlayConfig.cta_label,
    cta_url: overlayConfig.cta_url,
  });
}

export default function BannerPage() {
  const { currentTenant } = useAuthStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [position, setPosition] = useState("sidebar");
  const [type, setType] = useState("image");
  const [imageUrl, setImageUrl] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [targetCategories, setTargetCategories] = useState<string[]>([]);
  const [targetDevice, setTargetDevice] = useState("all");
  const [weight, setWeight] = useState(1);
  const [advertiserId, setAdvertiserId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [overlayDelaySeconds, setOverlayDelaySeconds] = useState("0.8");
  const [overlayTargetSlugs, setOverlayTargetSlugs] = useState("");
  const [overlayTitle, setOverlayTitle] = useState("");
  const [overlayDescription, setOverlayDescription] = useState("");
  const [overlayCtaLabel, setOverlayCtaLabel] = useState("Apri sponsor");
  const [overlayCtaUrl, setOverlayCtaUrl] = useState("");

  // Advanced settings
  const [rotationMode, setRotationMode] = useState<"sequential" | "random" | "weighted">("sequential");
  const [rotationIntervalMs, setRotationIntervalMs] = useState("5000");
  const [sizingMode, setSizingMode] = useState<"cover" | "contain" | "stretch">("cover");
  const [advOverlayEnabled, setAdvOverlayEnabled] = useState(false);
  const [advOverlayTrigger, setAdvOverlayTrigger] = useState<"hover" | "click" | "auto">("hover");
  const [advOverlayDelayMs, setAdvOverlayDelayMs] = useState("0");
  const [advOverlayCloseRequired, setAdvOverlayCloseRequired] = useState(true);
  const [advOverlayTargetPages, setAdvOverlayTargetPages] = useState("");

  const readErrorMessage = useCallback(async (response: Response, fallback: string) => {
    const payload = await response.json().catch(() => null);
    return typeof payload?.error === "string" ? payload.error : fallback;
  }, []);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const response = await fetch(`/api/cms/banners?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Impossibile caricare i banner"));
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as {
      banners?: Banner[];
      advertisers?: Advertiser[];
      categories?: CategoryOption[];
    };

    setBanners(Array.isArray(payload.banners) ? payload.banners : []);
    setAdvertisers(Array.isArray(payload.advertisers) ? payload.advertisers : []);
    setCategories(Array.isArray(payload.categories) ? payload.categories : []);
    setLoading(false);
  }, [currentTenant, readErrorMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const resetForm = () => {
    setName(""); setPosition("sidebar"); setType("image"); setImageUrl("");
    setHtmlContent(""); setLinkUrl(""); setTargetCategories([]); setTargetDevice("all"); setWeight(1);
    setAdvertiserId(""); setStartsAt(""); setEndsAt(""); setIsActive(true);
    setOverlayEnabled(false); setOverlayDelaySeconds("0.8"); setOverlayTargetSlugs("");
    setOverlayTitle(""); setOverlayDescription(""); setOverlayCtaLabel("Apri sponsor"); setOverlayCtaUrl("");
    setRotationMode("sequential"); setRotationIntervalMs("5000"); setSizingMode("cover");
    setAdvOverlayEnabled(false); setAdvOverlayTrigger("hover"); setAdvOverlayDelayMs("0");
    setAdvOverlayCloseRequired(true); setAdvOverlayTargetPages("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (b: Banner) => {
    const overlay = parseOverlayConfig(b.html_content);
    setEditingId(b.id); setName(b.name); setPosition(b.position); setType(b.type);
    setImageUrl(b.image_url ?? ""); setHtmlContent(b.html_content ?? ""); setLinkUrl(b.link_url ?? "");
    setTargetCategories(Array.isArray(b.target_categories) ? b.target_categories : []);
    setTargetDevice(b.target_device); setWeight(b.weight); setAdvertiserId(b.advertiser_id ?? "");
    setStartsAt(b.starts_at ? new Date(b.starts_at).toISOString().slice(0, 16) : "");
    setEndsAt(b.ends_at ? new Date(b.ends_at).toISOString().slice(0, 16) : "");
    setIsActive(b.is_active); setShowForm(true);
    setOverlayEnabled(overlay.enabled);
    setOverlayDelaySeconds(String(overlay.delay_seconds));
    setOverlayTargetSlugs(overlay.target_article_slugs.join(", "));
    setOverlayTitle(overlay.title);
    setOverlayDescription(overlay.description);
    setOverlayCtaLabel(overlay.cta_label);
    setOverlayCtaUrl(overlay.cta_url || (b.link_url ?? ""));
    // Advanced settings
    const bAny = b as unknown as Record<string, unknown>;
    setRotationMode((bAny.rotation_mode as typeof rotationMode) || "sequential");
    setRotationIntervalMs(String(bAny.rotation_interval_ms || 5000));
    setSizingMode((bAny.sizing_mode as typeof sizingMode) || "cover");
    setAdvOverlayEnabled(bAny.overlay_enabled === true);
    setAdvOverlayTrigger((bAny.overlay_trigger as typeof advOverlayTrigger) || "hover");
    setAdvOverlayDelayMs(String(bAny.overlay_delay_ms || 0));
    setAdvOverlayCloseRequired(bAny.overlay_close_required !== false);
    setAdvOverlayTargetPages(Array.isArray(bAny.overlay_target_pages) ? (bAny.overlay_target_pages as string[]).join(", ") : "");
  };

  const handleSave = async () => {
    if (!currentTenant || !name.trim()) { toast.error("Nome obbligatorio"); return; }
    setSaving(true);

    const overlayConfig: BannerOverlayConfig = {
      enabled: overlayEnabled,
      delay_seconds: Math.max(0, Number(overlayDelaySeconds) || 0),
      target_article_slugs: overlayTargetSlugs
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
      title: overlayTitle.trim(),
      description: overlayDescription.trim(),
      cta_label: overlayCtaLabel.trim() || "Apri sponsor",
      cta_url: overlayCtaUrl.trim(),
    };

    const payload = {
      tenant_id: currentTenant.id,
      name: name.trim(),
      position,
      type,
      image_url: imageUrl || null,
      html_content: buildBannerHtmlContent(type, htmlContent, overlayConfig),
      link_url: linkUrl || null,
      target_categories: targetCategories,
      target_device: targetDevice,
      weight,
      advertiser_id: advertiserId || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_active: isActive,
      rotation_mode: rotationMode,
      rotation_interval_ms: Math.max(1000, parseInt(rotationIntervalMs) || 5000),
      sizing_mode: sizingMode,
      overlay_enabled: advOverlayEnabled,
      overlay_trigger: advOverlayTrigger,
      overlay_delay_ms: Math.max(0, parseInt(advOverlayDelayMs) || 0),
      overlay_close_required: advOverlayCloseRequired,
      overlay_target_pages: advOverlayTargetPages.split(",").map(s => s.trim()).filter(Boolean),
    };

    if (editingId) {
      const response = await fetch(`/api/cms/banners/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!response.ok) { toast.error(await readErrorMessage(response, "Impossibile aggiornare il banner")); setSaving(false); return; }
      toast.success("Banner aggiornato");
    } else {
      const response = await fetch("/api/cms/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!response.ok) { toast.error(await readErrorMessage(response, "Impossibile creare il banner")); setSaving(false); return; }
      toast.success("Banner creato");
    }
    setSaving(false); resetForm(); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo banner?")) return;
    if (!currentTenant) return;
    const response = await fetch(`/api/cms/banners/${id}?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Impossibile eliminare il banner"));
      return;
    }
    setBanners(prev => prev.filter(b => b.id !== id));
    toast.success("Banner eliminato");
  };

  const toggleActive = async (b: Banner) => {
    if (!currentTenant) return;
    const response = await fetch(`/api/cms/banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        tenant_id: currentTenant.id,
        is_active: !b.is_active,
      }),
    });
    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Impossibile aggiornare lo stato del banner"));
      return;
    }
    setBanners(prev => prev.map(i => i.id === b.id ? { ...i, is_active: !b.is_active } : i));
  };

  const getCTR = (b: Banner) => {
    if (b.impressions === 0) return "0%";
    return ((b.clicks / b.impressions) * 100).toFixed(2) + "%";
  };

  const toggleTargetCategory = (categorySlug: string) => {
    setTargetCategories((prev) =>
      prev.includes(categorySlug)
        ? prev.filter((entry) => entry !== categorySlug)
        : [...prev, categorySlug]
    );
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-2xl font-bold font-serif" style={{ color: "var(--c-text-0)" }}>{banners.length}</p>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Banner totali</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-2xl font-bold font-serif" style={{ color: "var(--c-success)" }}>{banners.filter(b => b.is_active).length}</p>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Attivi</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-2xl font-bold font-serif" style={{ color: "var(--c-text-0)" }}>{banners.reduce((s, b) => s + b.impressions, 0).toLocaleString()}</p>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Impressioni totali</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-2xl font-bold font-serif" style={{ color: "var(--c-text-0)" }}>{banners.reduce((s, b) => s + b.clicks, 0).toLocaleString()}</p>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Click totali</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>{banners.length} banner</p>
        <div className="flex items-center gap-2">
          <AIButton
            actions={[
              {
                id: "suggerisci_copy",
                label: "Suggerisci copy per banner",
                prompt: "Suggerisci un copy efficace e persuasivo per un banner pubblicitario su un giornale locale italiano. Campagne attive: {context}",
              },
              {
                id: "analizza_performance",
                label: "Analizza performance",
                prompt: "Analizza le performance dei seguenti banner pubblicitari e suggerisci miglioramenti per aumentare il CTR. Dati banner: {context}",
              },
            ]}
            contextData={banners.map(b => `${b.name} (${b.position}, ${b.impressions} imp, ${b.clicks} click, CTR: ${b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(2) : 0}%)`).join(" | ")}
            onApply={(actionId, result) => {
              setShowForm(true);
              if (actionId === "suggerisci_copy") {
                setType("html");
                setHtmlContent(result);
                if (!name.trim()) {
                  setName("Banner AI");
                }
              } else {
                setHtmlContent((prev) =>
                  prev.trim()
                    ? `${prev}\n\n<!-- Analisi IA -->\n${result}`
                    : `<!-- Analisi IA -->\n${result}`
                );
              }
            }}
          />
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition"
            style={{ background: "var(--c-accent)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}>
            <Plus className="w-4 h-4" /> Nuovo Banner
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg p-5 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{editingId ? "Modifica" : "Nuovo"} Banner</h3>
            <button onClick={resetForm}><X className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Nome campagna *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Es: Banner primavera Hotel Stella"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Posizione</label>
              <select value={position} onChange={e => setPosition(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                {positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Tipo</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                {bannerTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Dispositivo</label>
              <select value={targetDevice} onChange={e => setTargetDevice(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                <option value="all">Tutti</option>
                <option value="desktop">Solo Desktop</option>
                <option value="mobile">Solo Mobile</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Categorie / gruppi banner</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <span className="text-xs" style={{ color: "var(--c-text-3)" }}>Nessuna categoria disponibile.</span>
                ) : (
                  categories.map((category) => {
                    const active = targetCategories.includes(category.slug);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleTargetCategory(category.slug)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                        style={active
                          ? { background: "var(--c-accent-soft)", color: "var(--c-accent)" }
                          : { background: "var(--c-bg-2)", color: "var(--c-text-2)" }}
                      >
                        {category.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            {type === "image" && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Immagine Banner</label>
                {imageUrl ? (
                  <div className="mt-1 relative inline-block">
                    <img src={imageUrl} alt="Preview" className="max-h-32 rounded-lg border" style={{ borderColor: "var(--c-border)" }} />
                    <button type="button" onClick={() => setImageUrl("")}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-1 flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition hover:bg-[var(--c-bg-2)]"
                    style={{ border: "1px dashed var(--c-border)" }}>
                    <ImageIcon className="w-5 h-5" style={{ color: "var(--c-text-3)" }} />
                    <span className="text-sm" style={{ color: "var(--c-text-2)" }}>Carica immagine banner (JPG, PNG, WebP)</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !currentTenant) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("tenant_id", currentTenant.id);
                        formData.append("tenant_slug", currentTenant.slug);
                        try {
                          const res = await fetch("/api/cms/media/upload", { method: "POST", body: formData, credentials: "same-origin" });
                          const data = await res.json().catch(() => null);
                          if (!res.ok) { toast.error(data?.error || "Errore upload"); return; }
                          if (data?.media?.url) { setImageUrl(data.media.url); toast.success("Immagine caricata"); }
                        } catch { toast.error("Errore upload"); }
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="oppure incolla URL..."
                  className="w-full mt-2 px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)", color: "var(--c-text-2)" }} />
              </div>
            )}
            {type === "html" && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Codice HTML</label>
                <textarea value={htmlContent} onChange={e => setHtmlContent(e.target.value)} rows={4} placeholder="<div>...</div>"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 resize-none"
                  style={{ border: "1px solid var(--c-border)" }} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Link destinazione</label>
              <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Peso (rotazione)</label>
              <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} min={1} max={100}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Inserzionista</label>
              <select value={advertiserId} onChange={e => setAdvertiserId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                <option value="">Nessuno</option>
                {advertisers.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Data inizio</label>
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Data fine</label>
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            {type === "image" && position === "interstitial" && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-lg p-4" style={{ border: "1px solid var(--c-border)", background: "var(--c-bg-2)" }}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Overlay su notizia</p>
                    <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Mostra il banner sopra card specifiche del sito e richiede la chiusura per aprire l&apos;articolo.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                    <input type="checkbox" checked={overlayEnabled} onChange={e => setOverlayEnabled(e.target.checked)} className="w-4 h-4 rounded" />
                    Attivo
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Secondi prima della comparsa</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={overlayDelaySeconds}
                      onChange={e => setOverlayDelaySeconds(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>CTA banner</label>
                    <input
                      type="text"
                      value={overlayCtaLabel}
                      onChange={e => setOverlayCtaLabel(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Slug articoli target</label>
                    <input
                      type="text"
                      value={overlayTargetSlugs}
                      onChange={e => setOverlayTargetSlugs(e.target.value)}
                      placeholder="slug-uno, slug-due, slug-tre"
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Titolo overlay</label>
                    <input
                      type="text"
                      value={overlayTitle}
                      onChange={e => setOverlayTitle(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>URL CTA overlay</label>
                    <input
                      type="url"
                      value={overlayCtaUrl}
                      onChange={e => setOverlayCtaUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Testo breve overlay</label>
                    <textarea
                      value={overlayDescription}
                      onChange={e => setOverlayDescription(e.target.value)}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 resize-none"
                      style={{ border: "1px solid var(--c-border)" }}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Advanced Settings */}
            <div className="sm:col-span-2 lg:col-span-3 border-t pt-4 mt-2" style={{ borderColor: "var(--c-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--c-text-2)" }}>Impostazioni avanzate</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Rotazione</label>
                  <select value={rotationMode} onChange={e => setRotationMode(e.target.value as typeof rotationMode)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                    <option value="sequential">Sequenziale (stesso ordine)</option>
                    <option value="random">Casuale (ogni caricamento)</option>
                    <option value="weighted">Per peso (priorita')</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Intervallo rotazione (ms)</label>
                  <input type="number" min={1000} step={500} value={rotationIntervalMs} onChange={e => setRotationIntervalMs(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }} />
                  <p className="text-[10px] mt-1" style={{ color: "var(--c-text-3)" }}>{(parseInt(rotationIntervalMs) / 1000) || 5}s tra un banner e l&apos;altro</p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Dimensionamento</label>
                  <select value={sizingMode} onChange={e => setSizingMode(e.target.value as typeof sizingMode)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                    <option value="cover">Riempi spazio (taglia bordi)</option>
                    <option value="contain">Adatta (mostra tutto)</option>
                    <option value="stretch">Allarga (deforma)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Peso / Priorita'</label>
                  <input type="number" min={1} max={100} value={weight} onChange={e => setWeight(Number(e.target.value) || 1)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }} />
                  <p className="text-[10px] mt-1" style={{ color: "var(--c-text-3)" }}>Piu' alto = piu' visibilita'</p>
                </div>
              </div>
            </div>

            {/* Overlay on articles */}
            <div className="sm:col-span-2 lg:col-span-3 border-t pt-4 mt-2" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-2)" }}>Banner overlay su articoli</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--c-text-3)" }}>Mostra il banner sopra le card articoli. L&apos;utente deve chiuderlo per accedere al contenuto.</p>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={advOverlayEnabled} onChange={e => setAdvOverlayEnabled(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-xs font-medium" style={{ color: "var(--c-text-1)" }}>Attivo</span>
                </label>
              </div>
              {advOverlayEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Trigger</label>
                    <select value={advOverlayTrigger} onChange={e => setAdvOverlayTrigger(e.target.value as typeof advOverlayTrigger)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                      style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                      <option value="hover">Al passaggio del mouse</option>
                      <option value="click">Al click</option>
                      <option value="auto">Automatico (con ritardo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Ritardo (ms)</label>
                    <input type="number" min={0} step={100} value={advOverlayDelayMs} onChange={e => setAdvOverlayDelayMs(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }} />
                    <p className="text-[10px] mt-1" style={{ color: "var(--c-text-3)" }}>Solo per trigger automatico</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mt-6">
                      <input type="checkbox" checked={advOverlayCloseRequired} onChange={e => setAdvOverlayCloseRequired(e.target.checked)} className="w-4 h-4 rounded" />
                      <span className="text-xs" style={{ color: "var(--c-text-1)" }}>Chiusura obbligatoria</span>
                    </label>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Pagine target</label>
                    <input type="text" value={advOverlayTargetPages} onChange={e => setAdvOverlayTargetPages(e.target.value)}
                      placeholder="homepage, cronaca, sport (vuoto = tutte)"
                      className="w-full mt-1 px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-sm" style={{ color: "var(--c-text-1)" }}>Attivo</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium rounded-lg transition"
              style={{ color: "var(--c-text-2)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>Annulla</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salva
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Columns Preview */}
      {!loading && banners.filter(b => b.position === "sidebar" || b.position === "sidebar-left" || b.position === "sidebar-right").length > 0 && (
        <div className="rounded-lg p-5 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Anteprima Colonne Sidebar</h3>
          <p className="text-xs mb-4" style={{ color: "var(--c-text-2)" }}>
            I banner &quot;Sidebar&quot; appaiono in entrambe le colonne (divisi automaticamente). Usa &quot;Sidebar Sinistra&quot; o &quot;Sidebar Destra&quot; per forzare la colonna.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Left column */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-2)" }}>Colonna Sinistra</p>
              <div className="space-y-2 p-3 rounded-lg min-h-[200px]" style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}>
                {(() => {
                  const sidebarAll = banners.filter(b => b.is_active && b.position === "sidebar");
                  const leftOnly = banners.filter(b => b.is_active && b.position === "sidebar-left");
                  const autoLeft = sidebarAll.filter((_, i) => i % 2 === 0);
                  const allLeft = [...leftOnly, ...autoLeft];
                  return allLeft.length === 0
                    ? <p className="text-xs text-center py-4" style={{ color: "var(--c-text-3)" }}>Nessun banner</p>
                    : allLeft.map((b) => (
                      <div key={b.id} className="rounded overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
                        {b.image_url
                          ? <img src={b.image_url} alt={b.name} className="w-full h-auto" style={{ maxHeight: "80px", objectFit: "cover" }} />
                          : <div className="h-12 flex items-center justify-center text-[10px]" style={{ background: "var(--c-bg-1)", color: "var(--c-text-3)" }}>{b.name}</div>
                        }
                      </div>
                    ));
                })()}
              </div>
            </div>
            {/* Right column */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-2)" }}>Colonna Destra</p>
              <div className="space-y-2 p-3 rounded-lg min-h-[200px]" style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}>
                {(() => {
                  const sidebarAll = banners.filter(b => b.is_active && b.position === "sidebar");
                  const rightOnly = banners.filter(b => b.is_active && b.position === "sidebar-right");
                  const autoRight = sidebarAll.filter((_, i) => i % 2 !== 0);
                  const allRight = [...rightOnly, ...autoRight];
                  return allRight.length === 0
                    ? <p className="text-xs text-center py-4" style={{ color: "var(--c-text-3)" }}>Nessun banner</p>
                    : allRight.map((b) => (
                      <div key={b.id} className="rounded overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
                        {b.image_url
                          ? <img src={b.image_url} alt={b.name} className="w-full h-auto" style={{ maxHeight: "80px", objectFit: "cover" }} />
                          : <div className="h-12 flex items-center justify-center text-[10px]" style={{ background: "var(--c-bg-1)", color: "var(--c-text-3)" }}>{b.name}</div>
                        }
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banners list */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--c-text-3)" }}>Caricamento...</div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessun banner</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-bg-2)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: "var(--c-text-2)" }}>Banner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase hidden sm:table-cell" style={{ color: "var(--c-text-2)" }}>Posizione</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase hidden md:table-cell" style={{ color: "var(--c-text-2)" }}>Device</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase hidden lg:table-cell" style={{ color: "var(--c-text-2)" }}>Impressioni</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase hidden lg:table-cell" style={{ color: "var(--c-text-2)" }}>Click</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase hidden lg:table-cell" style={{ color: "var(--c-text-2)" }}>CTR</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: "var(--c-text-2)" }}>Stato</th>
                  <th className="w-20 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--c-border)" }}>
                {banners.map(b => (
                  <tr key={b.id} className={`transition ${!b.is_active ? "opacity-50" : ""}`}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {b.image_url ? (
                          <div className="relative w-12 h-8">
                            <Image
                              src={b.image_url}
                              alt={b.name}
                              fill
                              className="object-cover rounded"
                              style={{ border: "1px solid var(--c-border)" }}
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-8 rounded flex items-center justify-center" style={{ background: "var(--c-bg-2)" }}>
                            {b.type === "html" ? <Code className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /> : <ImageIcon className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{b.name}</p>
                          <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
                            {b.type}
                            {b.target_categories.length > 0 ? ` · ${b.target_categories.join(", ")}` : ""}
                            {parseOverlayConfig(b.html_content).enabled ? ` · overlay ${parseOverlayConfig(b.html_content).delay_seconds}s` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>{b.position.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                        {b.target_device === "desktop" ? <Monitor className="w-3 h-3" /> :
                         b.target_device === "mobile" ? <Smartphone className="w-3 h-3" /> : null}
                        {b.target_device === "all" ? "Tutti" : b.target_device}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm flex items-center justify-end gap-1" style={{ color: "var(--c-text-2)" }}><Eye className="w-3 h-3" />{b.impressions.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm flex items-center justify-end gap-1" style={{ color: "var(--c-text-2)" }}><MousePointer className="w-3 h-3" />{b.clicks.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm font-medium" style={{ color: "var(--c-text-1)" }}>{getCTR(b)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(b)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={b.is_active
                          ? { background: "rgba(var(--c-success-rgb, 16,185,129), 0.15)", color: "var(--c-success)" }
                          : { background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                        <Power className="w-3 h-3" />{b.is_active ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(b)} className="w-7 h-7 flex items-center justify-center rounded transition"
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <Pencil className="w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="w-7 h-7 flex items-center justify-center rounded transition"
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
