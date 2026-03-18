"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  Plus,
  Zap,
  Trash2,
  X,
  Check,
  Power,
  PowerOff,
  Clock,
  Link2,
  AlertTriangle,
} from "lucide-react";
import AIButton from "@/components/ai/AIButton";

interface BreakingItem {
  id: string;
  text: string;
  link_url: string | null;
  is_active: boolean;
  priority: number;
  created_by: string;
  created_at: string;
  expires_at: string | null;
}

export default function BreakingNewsPage() {
  const { currentTenant, user } = useAuthStore();
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [priority, setPriority] = useState(0);
  const [expiresAt, setExpiresAt] = useState("");

  const load = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("breaking_news")
      .select("*")
      .eq("tenant_id", currentTenant.id)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setItems(data as BreakingItem[]);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setText(""); setLinkUrl(""); setPriority(0); setExpiresAt("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (item: BreakingItem) => {
    setEditingId(item.id);
    setText(item.text);
    setLinkUrl(item.link_url ?? "");
    setPriority(item.priority);
    setExpiresAt(item.expires_at ?? "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!currentTenant || !user || !text.trim()) {
      toast.error("Il testo è obbligatorio");
      return;
    }
    const supabase = createClient();

    const payload = {
      tenant_id: currentTenant.id,
      text: text.trim(),
      link_url: linkUrl || null,
      priority,
      created_by: user.id,
      expires_at: expiresAt || null,
      is_active: true,
    };

    if (editingId) {
      const { error } = await supabase
        .from("breaking_news")
        .update({ text: payload.text, link_url: payload.link_url, priority: payload.priority, expires_at: payload.expires_at })
        .eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Aggiornato");
    } else {
      const { error } = await supabase.from("breaking_news").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Breaking news creata");
    }
    resetForm();
    load();
  };

  const toggleActive = async (item: BreakingItem) => {
    const supabase = createClient();
    await supabase.from("breaking_news").update({ is_active: !item.is_active }).eq("id", item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa breaking news?")) return;
    const supabase = createClient();
    await supabase.from("breaking_news").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Eliminata");
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-red-500" />
          <span className="text-sm" style={{ color: "var(--c-text-2)" }}>
            {items.filter(i => i.is_active).length} attive
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AIButton
            actions={[
              {
                id: "genera_breaking",
                label: "Genera breaking news",
                prompt: "Basandoti sulle tendenze attuali e sulle breaking news esistenti, genera una nuova breaking news breve e d'impatto per un giornale locale italiano. Breaking news esistenti: {context}",
              },
              {
                id: "riscrivi_urgente",
                label: "Riscrivi urgente",
                prompt: "Riscrivi la seguente breaking news con un tono più urgente e d'impatto, mantenendola breve e incisiva: {context}",
              },
            ]}
            contextData={items.map(i => i.text).join(" | ")}
            onApply={(actionId, result) => {
              setText(result);
              setShowForm(true);
            }}
          />
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition"
            style={{ background: "var(--c-danger)" }}
          >
            <Plus className="w-4 h-4" /> Nuova Breaking
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg p-5 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--c-text-0)" }}>
              <AlertTriangle className="w-4 h-4 text-red-500" />
              {editingId ? "Modifica" : "Nuova"} Breaking News
            </h3>
            <button onClick={resetForm}><X className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Testo *</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={2}
                placeholder="Es: Allerta meteo arancione in Val Brembana..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ border: "1px solid var(--c-border)" }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Link (opzionale)</label>
                <div className="relative mt-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Priorità</label>
                <input
                  type="number"
                  value={priority}
                  onChange={e => setPriority(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Scadenza</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={resetForm} className="px-4 py-2 text-sm font-medium rounded-lg transition"
                style={{ color: "var(--c-text-2)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>Annulla</button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition"
                style={{ background: "var(--c-danger)" }}>
                <Check className="w-4 h-4" /> Salva
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--c-text-3)" }}>Caricamento...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Zap className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessuna breaking news</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {items.map(item => (
              <div key={item.id} className={`flex items-start gap-4 px-5 py-4 transition ${!item.is_active ? "opacity-50" : ""}`}>
                <button
                  onClick={() => toggleActive(item)}
                  className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition"
                  style={item.is_active
                    ? { background: "rgba(var(--c-success-rgb, 16,185,129), 0.15)", color: "var(--c-success)" }
                    : { background: "var(--c-bg-2)", color: "var(--c-text-3)" }}
                  title={item.is_active ? "Disattiva" : "Attiva"}
                >
                  {item.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{item.text}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--c-text-3)" }}>
                    {item.link_url && (
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Link
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleString("it-IT")}
                    </span>
                    {item.expires_at && (
                      <span>Scade: {new Date(item.expires_at).toLocaleString("it-IT")}</span>
                    )}
                    <span>P: {item.priority}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(item)} className="w-8 h-8 flex items-center justify-center rounded transition"
                    style={{ color: "var(--c-text-3)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center rounded transition text-red-400"
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
