"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  Plus,
  Building2,
  Trash2,
  Pencil,
  X,
  Check,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import AIButton from "@/components/ai/AIButton";

interface Advertiser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export default function InserzionistiPage() {
  const { currentTenant } = useAuthStore();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const readErrorMessage = useCallback(async (response: Response, fallback: string) => {
    const payload = await response.json().catch(() => null);
    return typeof payload?.error === "string" ? payload.error : fallback;
  }, []);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const response = await fetch(`/api/cms/advertisers?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Impossibile caricare gli inserzionisti"));
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as { advertisers?: Advertiser[] };
    setAdvertisers(Array.isArray(payload.advertisers) ? payload.advertisers : []);
    setLoading(false);
  }, [currentTenant, readErrorMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const resetForm = () => {
    setName(""); setEmail(""); setPhone(""); setNotes("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (a: Advertiser) => {
    setEditingId(a.id); setName(a.name); setEmail(a.email ?? "");
    setPhone(a.phone ?? ""); setNotes(a.notes ?? ""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!currentTenant || !name.trim()) { toast.error("Nome obbligatorio"); return; }
    setSaving(true);

    const payload = {
      tenant_id: currentTenant.id,
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    };

    if (editingId) {
      const response = await fetch(`/api/cms/advertisers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!response.ok) { toast.error(await readErrorMessage(response, "Impossibile aggiornare l'inserzionista")); setSaving(false); return; }
      toast.success("Inserzionista aggiornato");
    } else {
      const response = await fetch("/api/cms/advertisers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!response.ok) { toast.error(await readErrorMessage(response, "Impossibile creare l'inserzionista")); setSaving(false); return; }
      toast.success("Inserzionista creato");
    }
    setSaving(false); resetForm(); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo inserzionista?")) return;
    if (!currentTenant) return;
    const response = await fetch(`/api/cms/advertisers/${id}?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Impossibile eliminare l'inserzionista"));
      return;
    }
    setAdvertisers(prev => prev.filter(a => a.id !== id));
    toast.success("Eliminato");
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>{advertisers.length} inserzionist{advertisers.length === 1 ? "a" : "i"}</p>
        <div className="flex items-center gap-2">
          <AIButton
            compact
            actions={[
              {
                id: "advertiser-crm",
                label: "Gestione clienti",
                prompt: "Analizza elenco inserzionisti, dati contatto e note. Suggerisci segmentazione commerciale, prossimi follow-up e dati mancanti da raccogliere: {context}",
              },
              {
                id: "advertiser-brief",
                label: "Brief campagna",
                prompt: "Dato l'elenco clienti attuale, suggerisci opportunita` ADV, posizionamenti banner e proposte da presentare agli inserzionisti: {context}",
              },
            ]}
            contextData={JSON.stringify({ tenant: currentTenant, advertisers, editingId, draft: { name, email, phone, notes } }, null, 2)}
          />
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition"
            style={{ background: "var(--c-accent)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}>
            <Plus className="w-4 h-4" /> Nuovo Inserzionista
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg p-5 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{editingId ? "Modifica" : "Nuovo"} Inserzionista</h3>
            <button onClick={resetForm}><X className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Nome azienda *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Es: Hotel Stella Alpina"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@azienda.it"
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Telefono</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 0345..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Note</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Note interne..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 resize-none"
                style={{ border: "1px solid var(--c-border)" }} />
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

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--c-text-3)" }}>Caricamento...</div>
        ) : advertisers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessun inserzionista</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {advertisers.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4 transition"
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                  {a.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{a.name}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--c-text-3)" }}>
                    {a.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{a.email}</span>}
                    {a.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(a)} className="w-8 h-8 flex items-center justify-center rounded transition"
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <Pencil className="w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="w-8 h-8 flex items-center justify-center rounded transition"
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
