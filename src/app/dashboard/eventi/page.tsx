"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  Plus,
  Calendar,
  MapPin,
  Trash2,
  Pencil,
  X,
  Check,
  Clock,
  Ticket,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  category: string | null;
  price: string | null;
  ticket_url: string | null;
  starts_at: string;
  ends_at: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  created_at: string;
}

const eventCategories = [
  "Cultura", "Sport", "Musica", "Gastronomia", "Tradizione",
  "Mercati", "Feste", "Conferenze", "Escursioni", "Altro",
];

export default function EventiPage() {
  const { currentTenant } = useAuthStore();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");

  const load = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("tenant_id", currentTenant.id)
      .order("starts_at", { ascending: true });
    if (data) setEvents(data as EventItem[]);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setLocation(""); setImageUrl("");
    setCategory(""); setPrice(""); setTicketUrl(""); setStartsAt("");
    setEndsAt(""); setIsRecurring(false); setRecurrenceRule("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description ?? "");
    setLocation(ev.location ?? "");
    setImageUrl(ev.image_url ?? "");
    setCategory(ev.category ?? "");
    setPrice(ev.price ?? "");
    setTicketUrl(ev.ticket_url ?? "");
    setStartsAt(ev.starts_at ? new Date(ev.starts_at).toISOString().slice(0, 16) : "");
    setEndsAt(ev.ends_at ? new Date(ev.ends_at).toISOString().slice(0, 16) : "");
    setIsRecurring(ev.is_recurring);
    setRecurrenceRule(ev.recurrence_rule ?? "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!currentTenant || !title.trim() || !startsAt) {
      toast.error("Titolo e data inizio sono obbligatori");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const payload = {
      tenant_id: currentTenant.id,
      title: title.trim(),
      description: description || null,
      location: location || null,
      image_url: imageUrl || null,
      category: category || null,
      price: price || null,
      ticket_url: ticketUrl || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_recurring: isRecurring,
      recurrence_rule: recurrenceRule || null,
    };

    if (editingId) {
      const { tenant_id, ...updatePayload } = payload;
      const { error } = await supabase.from("events").update(updatePayload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Evento aggiornato");
    } else {
      const { error } = await supabase.from("events").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Evento creato");
    }
    setSaving(false);
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo evento?")) return;
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Evento eliminato");
  };

  const getEventStatus = (startsAt: string, endsAt: string | null) => {
    const now = new Date();
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;
    if (end && now > end) return { label: "Concluso", color: "bg-gray-100 text-gray-500" };
    if (now >= start && (!end || now <= end)) return { label: "In corso", color: "bg-green-100 text-green-700" };
    return { label: "In arrivo", color: "bg-blue-100 text-blue-700" };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{events.length} eventi</p>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"}`}
            >Lista</button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === "calendar" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"}`}
            >Calendario</button>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition"
          >
            <Plus className="w-4 h-4" /> Nuovo Evento
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{editingId ? "Modifica" : "Nuovo"} Evento</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Titolo *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome evento"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Descrizione</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000] resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Data inizio *</label>
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Data fine</label>
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Luogo</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Es: Piazza Brembana"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]">
                <option value="">Seleziona...</option>
                {eventCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Prezzo</label>
              <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Es: Gratuito, €15"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Link biglietti</label>
              <input type="url" value={ticketUrl} onChange={e => setTicketUrl(e.target.value)} placeholder="https://..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Immagine URL</label>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-[#8B0000] rounded border-gray-300" />
                <span className="text-sm text-gray-700">Evento ricorrente</span>
              </label>
              {isRecurring && (
                <input type="text" value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value)}
                  placeholder="Es: Ogni martedì, Primo sabato del mese"
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
              )}
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

      {/* Events List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Caricamento...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nessun evento</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map(ev => {
              const status = getEventStatus(ev.starts_at, ev.ends_at);
              return (
                <div key={ev.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition">
                  {/* Date badge */}
                  <div className="w-14 h-14 bg-[#8B0000]/10 rounded-lg flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#8B0000] uppercase">
                      {new Date(ev.starts_at).toLocaleDateString("it-IT", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold text-[#8B0000] leading-tight">
                      {new Date(ev.starts_at).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{ev.title}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      {ev.category && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {ev.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ev.starts_at).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                        {ev.ends_at && ` → ${new Date(ev.ends_at).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}`}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>
                      )}
                      {ev.price && (
                        <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />{ev.price}</span>
                      )}
                      {ev.is_recurring && <span className="text-purple-500">🔄 Ricorrente</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(ev)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition">
                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(ev.id)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 transition">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
