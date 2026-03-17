"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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

  const load = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("advertisers")
      .select("*")
      .eq("tenant_id", currentTenant.id)
      .order("name");
    if (data) setAdvertisers(data as Advertiser[]);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

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
    const supabase = createClient();

    const payload = {
      tenant_id: currentTenant.id,
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    };

    if (editingId) {
      const { tenant_id, ...updatePayload } = payload;
      const { error } = await supabase.from("advertisers").update(updatePayload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Inserzionista aggiornato");
    } else {
      const { error } = await supabase.from("advertisers").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Inserzionista creato");
    }
    setSaving(false); resetForm(); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo inserzionista?")) return;
    const supabase = createClient();
    await supabase.from("advertisers").delete().eq("id", id);
    setAdvertisers(prev => prev.filter(a => a.id !== id));
    toast.success("Eliminato");
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{advertisers.length} inserzionist{advertisers.length === 1 ? "a" : "i"}</p>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition">
          <Plus className="w-4 h-4" /> Nuovo Inserzionista
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{editingId ? "Modifica" : "Nuovo"} Inserzionista</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Nome azienda *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Es: Hotel Stella Alpina"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@azienda.it"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Telefono</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 0345..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Note</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Note interne..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000] resize-none" />
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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Caricamento...</div>
        ) : advertisers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nessun inserzionista</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {advertisers.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                  {a.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {a.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{a.email}</span>}
                    {a.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(a)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100">
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50">
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
