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
    if (end && now > end) return { label: "Concluso", style: { background: "var(--c-bg-2)", color: "var(--c-text-2)" } };
    if (now >= start && (!end || now <= end)) return { label: "In corso", style: { background: "rgba(var(--c-success-rgb, 16,185,129), 0.15)", color: "var(--c-success)" } };
    return { label: "In arrivo", style: { background: "var(--c-accent-soft)", color: "var(--c-accent)" } };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>{events.length} eventi</p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
            <button
              onClick={() => setViewMode("list")}
              className="px-3 py-1.5 text-xs font-medium"
              style={viewMode === "list" ? { background: "var(--c-bg-2)", color: "var(--c-text-0)" } : { color: "var(--c-text-2)" }}
            >Lista</button>
            <button
              onClick={() => setViewMode("calendar")}
              className="px-3 py-1.5 text-xs font-medium"
              style={viewMode === "calendar" ? { background: "var(--c-bg-2)", color: "var(--c-text-0)" } : { color: "var(--c-text-2)" }}
            >Calendario</button>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition"
            style={{ background: "var(--c-accent)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
          >
            <Plus className="w-4 h-4" /> Nuovo Evento
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg p-5 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{editingId ? "Modifica" : "Nuovo"} Evento</h3>
            <button onClick={resetForm}><X className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Titolo *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome evento"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Descrizione</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 resize-none"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Data inizio *</label>
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
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Luogo</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Es: Piazza Brembana"
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                <option value="">Seleziona...</option>
                {eventCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Prezzo</label>
              <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Es: Gratuito, EUR15"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Link biglietti</label>
              <input type="url" value={ticketUrl} onChange={e => setTicketUrl(e.target.value)} placeholder="https://..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Immagine URL</label>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-sm" style={{ color: "var(--c-text-1)" }}>Evento ricorrente</span>
              </label>
              {isRecurring && (
                <input type="text" value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value)}
                  placeholder="Es: Ogni martedì, Primo sabato del mese"
                  className="w-full mt-2 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }} />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium rounded-lg transition" style={{ color: "var(--c-text-2)" }}
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

      {/* Events List */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--c-text-3)" }}>Caricamento...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessun evento</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {events.map(ev => {
              const status = getEventStatus(ev.starts_at, ev.ends_at);
              return (
                <div key={ev.id} className="flex items-start gap-4 px-5 py-4 transition"
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  {/* Date badge */}
                  <div className="w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: "var(--c-accent-soft)" }}>
                    <span className="text-[10px] font-bold uppercase" style={{ color: "var(--c-accent)" }}>
                      {new Date(ev.starts_at).toLocaleDateString("it-IT", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold leading-tight" style={{ color: "var(--c-accent)" }}>
                      {new Date(ev.starts_at).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{ev.title}</p>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={status.style}>
                        {status.label}
                      </span>
                      {ev.category && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                          {ev.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--c-text-3)" }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ev.starts_at).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                        {ev.ends_at && ` -> ${new Date(ev.ends_at).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}`}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>
                      )}
                      {ev.price && (
                        <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />{ev.price}</span>
                      )}
                      {ev.is_recurring && <span className="text-purple-500">Ricorrente</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(ev)} className="w-8 h-8 flex items-center justify-center rounded transition"
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <Pencil className="w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
                    </button>
                    <button onClick={() => handleDelete(ev.id)} className="w-8 h-8 flex items-center justify-center rounded transition"
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
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
