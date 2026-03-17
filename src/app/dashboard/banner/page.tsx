"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
  Calendar,
} from "lucide-react";

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

interface Advertiser {
  id: string;
  name: string;
}

const positions = [
  { value: "header", label: "Header" },
  { value: "sidebar", label: "Sidebar" },
  { value: "in_article", label: "In-Article" },
  { value: "footer", label: "Footer" },
  { value: "interstitial", label: "Interstitial" },
];

const bannerTypes = [
  { value: "image", label: "Immagine", icon: ImageIcon },
  { value: "html", label: "HTML/JS", icon: Code },
  { value: "adsense", label: "AdSense", icon: BarChart3 },
];

export default function BannerPage() {
  const { currentTenant } = useAuthStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
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
  const [targetDevice, setTargetDevice] = useState("all");
  const [weight, setWeight] = useState(1);
  const [advertiserId, setAdvertiserId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();
    const [bannersRes, advRes] = await Promise.all([
      supabase.from("banners").select("*").eq("tenant_id", currentTenant.id).order("created_at", { ascending: false }),
      supabase.from("advertisers").select("id, name").eq("tenant_id", currentTenant.id).order("name"),
    ]);
    if (bannersRes.data) setBanners(bannersRes.data as Banner[]);
    if (advRes.data) setAdvertisers(advRes.data as Advertiser[]);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setName(""); setPosition("sidebar"); setType("image"); setImageUrl("");
    setHtmlContent(""); setLinkUrl(""); setTargetDevice("all"); setWeight(1);
    setAdvertiserId(""); setStartsAt(""); setEndsAt(""); setIsActive(true);
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (b: Banner) => {
    setEditingId(b.id); setName(b.name); setPosition(b.position); setType(b.type);
    setImageUrl(b.image_url ?? ""); setHtmlContent(b.html_content ?? ""); setLinkUrl(b.link_url ?? "");
    setTargetDevice(b.target_device); setWeight(b.weight); setAdvertiserId(b.advertiser_id ?? "");
    setStartsAt(b.starts_at ? new Date(b.starts_at).toISOString().slice(0, 16) : "");
    setEndsAt(b.ends_at ? new Date(b.ends_at).toISOString().slice(0, 16) : "");
    setIsActive(b.is_active); setShowForm(true);
  };

  const handleSave = async () => {
    if (!currentTenant || !name.trim()) { toast.error("Nome obbligatorio"); return; }
    setSaving(true);
    const supabase = createClient();

    const payload = {
      tenant_id: currentTenant.id,
      name: name.trim(),
      position,
      type,
      image_url: imageUrl || null,
      html_content: htmlContent || null,
      link_url: linkUrl || null,
      target_categories: [] as string[],
      target_device: targetDevice,
      weight,
      advertiser_id: advertiserId || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_active: isActive,
    };

    if (editingId) {
      const { tenant_id, ...updatePayload } = payload;
      const { error } = await supabase.from("banners").update(updatePayload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Banner aggiornato");
    } else {
      const { error } = await supabase.from("banners").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Banner creato");
    }
    setSaving(false); resetForm(); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo banner?")) return;
    const supabase = createClient();
    await supabase.from("banners").delete().eq("id", id);
    setBanners(prev => prev.filter(b => b.id !== id));
    toast.success("Banner eliminato");
  };

  const toggleActive = async (b: Banner) => {
    const supabase = createClient();
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    setBanners(prev => prev.map(i => i.id === b.id ? { ...i, is_active: !b.is_active } : i));
  };

  const getCTR = (b: Banner) => {
    if (b.impressions === 0) return "0%";
    return ((b.clicks / b.impressions) * 100).toFixed(2) + "%";
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <p className="text-2xl font-bold font-serif">{banners.length}</p>
          <p className="text-xs text-gray-500">Banner totali</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <p className="text-2xl font-bold font-serif text-green-600">{banners.filter(b => b.is_active).length}</p>
          <p className="text-xs text-gray-500">Attivi</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <p className="text-2xl font-bold font-serif">{banners.reduce((s, b) => s + b.impressions, 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Impressioni totali</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <p className="text-2xl font-bold font-serif">{banners.reduce((s, b) => s + b.clicks, 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Click totali</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{banners.length} banner</p>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition">
          <Plus className="w-4 h-4" /> Nuovo Banner
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{editingId ? "Modifica" : "Nuovo"} Banner</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-gray-500 font-medium">Nome campagna *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Es: Banner primavera Hotel Stella"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Posizione</label>
              <select value={position} onChange={e => setPosition(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]">
                {positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]">
                {bannerTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Dispositivo</label>
              <select value={targetDevice} onChange={e => setTargetDevice(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]">
                <option value="all">Tutti</option>
                <option value="desktop">Solo Desktop</option>
                <option value="mobile">Solo Mobile</option>
              </select>
            </div>
            {type === "image" && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs text-gray-500 font-medium">URL Immagine</label>
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
              </div>
            )}
            {type === "html" && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs text-gray-500 font-medium">Codice HTML</label>
                <textarea value={htmlContent} onChange={e => setHtmlContent(e.target.value)} rows={4} placeholder="<div>...</div>"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#8B0000] resize-none" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 font-medium">Link destinazione</label>
              <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Peso (rotazione)</label>
              <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} min={1} max={100}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Inserzionista</label>
              <select value={advertiserId} onChange={e => setAdvertiserId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]">
                <option value="">Nessuno</option>
                {advertisers.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Data inizio</label>
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Data fine</label>
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#8B0000] rounded border-gray-300" />
                <span className="text-sm text-gray-700">Attivo</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Annulla</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salva
            </button>
          </div>
        </div>
      )}

      {/* Banners list */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Caricamento...</div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nessun banner</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Banner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Posizione</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Device</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Impressioni</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Click</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">CTR</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                  <th className="w-20 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners.map(b => (
                  <tr key={b.id} className={`hover:bg-gray-50 transition ${!b.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {b.image_url ? (
                          <img src={b.image_url} alt="" className="w-12 h-8 object-cover rounded border border-gray-200" />
                        ) : (
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                            {b.type === "html" ? <Code className="w-4 h-4 text-gray-400" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{b.name}</p>
                          <p className="text-xs text-gray-400">{b.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{b.position.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {b.target_device === "desktop" ? <Monitor className="w-3 h-3" /> :
                         b.target_device === "mobile" ? <Smartphone className="w-3 h-3" /> : null}
                        {b.target_device === "all" ? "Tutti" : b.target_device}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm text-gray-600 flex items-center justify-end gap-1"><Eye className="w-3 h-3" />{b.impressions.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm text-gray-600 flex items-center justify-end gap-1"><MousePointer className="w-3 h-3" />{b.clicks.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm font-medium text-gray-700">{getCTR(b)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(b)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          b.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                        <Power className="w-3 h-3" />{b.is_active ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(b)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100">
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50">
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
