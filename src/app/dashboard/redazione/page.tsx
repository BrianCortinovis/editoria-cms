"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getJournalistDeskSettingsFromTenant } from "@/lib/desk/uix";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Newspaper,
  Plus,
  Sparkles,
  Save,
  Zap,
} from "lucide-react";

interface WorkflowStats {
  drafts: number;
  inReview: number;
  approved: number;
  scheduled: number;
  published: number;
  breaking: number;
}

interface EditorialArticle {
  id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  updated_at: string;
  author_name: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
}

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  in_review: "In revisione",
  approved: "Approvato",
  published: "Pubblicato",
  archived: "Archiviato",
};

const statusStyles: Record<string, React.CSSProperties> = {
  draft: { background: "var(--c-bg-2)", color: "var(--c-text-2)" },
  in_review: { background: "rgba(245, 158, 11, 0.14)", color: "var(--c-warning)" },
  approved: { background: "var(--c-accent-soft)", color: "var(--c-accent)" },
  published: { background: "rgba(16, 185, 129, 0.14)", color: "var(--c-success)" },
  archived: { background: "rgba(239, 68, 68, 0.14)", color: "var(--c-danger)" },
};

export default function RedazionePage() {
  const { currentTenant, currentRole } = useAuthStore();
  const deskSettings = getJournalistDeskSettingsFromTenant(currentTenant?.settings);
  const aiEnabled = Array.isArray((currentTenant?.settings as Record<string, unknown> | undefined)?.active_modules)
    ? ((currentTenant?.settings as Record<string, unknown>).active_modules as string[]).includes("ai_assistant")
    : false;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WorkflowStats>({
    drafts: 0,
    inReview: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
    breaking: 0,
  });
  const [focusArticles, setFocusArticles] = useState<EditorialArticle[]>([]);
  const [scheduledArticles, setScheduledArticles] = useState<EditorialArticle[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [homepageFreshHours, setHomepageFreshHours] = useState(0);
  const [savingRules, setSavingRules] = useState(false);

  const loadRedazione = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const now = new Date().toISOString();

      const [
        draftsRes,
        reviewRes,
        approvedRes,
        scheduledRes,
        publishedRes,
        breakingRes,
        focusRes,
        scheduledListRes,
        eventsRes,
        siteConfigRes,
      ] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", currentTenant.id).eq("status", "draft"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", currentTenant.id).eq("status", "in_review"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", currentTenant.id).eq("status", "approved"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", currentTenant.id).not("scheduled_at", "is", null).gt("scheduled_at", now),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", currentTenant.id).eq("status", "published"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", currentTenant.id).eq("is_breaking", true),
        supabase
          .from("articles")
          .select("id, title, status, scheduled_at, updated_at, profiles!articles_author_id_fkey(full_name)")
          .eq("tenant_id", currentTenant.id)
          .in("status", ["draft", "in_review", "approved"])
          .order("updated_at", { ascending: false })
          .limit(6),
        supabase
          .from("articles")
          .select("id, title, status, scheduled_at, updated_at, profiles!articles_author_id_fkey(full_name)")
          .eq("tenant_id", currentTenant.id)
          .not("scheduled_at", "is", null)
          .gt("scheduled_at", now)
          .order("scheduled_at", { ascending: true })
          .limit(5),
        supabase
          .from("events")
          .select("id, title, starts_at, location")
          .eq("tenant_id", currentTenant.id)
          .gte("starts_at", now)
          .order("starts_at", { ascending: true })
          .limit(5),
        supabase
          .from("site_config")
          .select("theme")
          .eq("tenant_id", currentTenant.id)
          .maybeSingle(),
      ]);

      setStats({
        drafts: draftsRes.count ?? 0,
        inReview: reviewRes.count ?? 0,
        approved: approvedRes.count ?? 0,
        scheduled: scheduledRes.count ?? 0,
        published: publishedRes.count ?? 0,
        breaking: breakingRes.count ?? 0,
      });

      const mapArticles = (rows: unknown[] | null | undefined) =>
        ((rows || []) as Array<Record<string, unknown>>).map((row) => ({
          id: String(row.id || ""),
          title: String(row.title || "Articolo"),
          status: String(row.status || "draft"),
          scheduled_at: row.scheduled_at ? String(row.scheduled_at) : null,
          updated_at: String(row.updated_at || new Date().toISOString()),
          author_name:
            Array.isArray(row.profiles) && row.profiles[0]?.full_name
              ? String(row.profiles[0].full_name)
              : "—",
        }));

      setFocusArticles(mapArticles(focusRes.data));
      setScheduledArticles(mapArticles(scheduledListRes.data));
      setUpcomingEvents((eventsRes.data || []) as UpcomingEvent[]);
      const automation = ((siteConfigRes.data?.theme as Record<string, unknown> | null)?.editorialAutomation || {}) as Record<string, unknown>;
      setHomepageFreshHours(typeof automation.homepageFreshHours === "number" ? automation.homepageFreshHours : 0);
    } catch (error) {
      console.error(error);
      toast.error("Errore nel caricamento della pagina Redazione");
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRedazione();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRedazione]);

  const workflowCards = [
    { label: "Bozze", value: stats.drafts, icon: FileText },
    { label: "In revisione", value: stats.inReview, icon: Clock3 },
    { label: "Approvati", value: stats.approved, icon: CheckCircle2 },
    { label: "Programmati", value: stats.scheduled, icon: CalendarClock },
    { label: "Pubblicati", value: stats.published, icon: Newspaper },
    { label: "Breaking", value: stats.breaking, icon: Zap },
  ];

  const shortcuts = [
    { href: "/dashboard/articoli/nuovo", label: "Nuovo articolo", icon: Plus },
    { href: "/dashboard/articoli", label: "Tutti gli articoli", icon: FileText },
    { href: "/dashboard/commenti", label: "Moderazione commenti", icon: MessageSquare },
    { href: "/dashboard/breaking-news", label: "Desk breaking", icon: Zap },
    { href: "/dashboard/eventi", label: "Agenda eventi", icon: CalendarClock },
    ...(aiEnabled ? [{ href: "/dashboard/ia", label: "Tool IA redazione", icon: Sparkles }] : []),
  ].filter((item) => {
    if (item.href === "/dashboard/breaking-news") {
      return deskSettings.allowBreakingNewsManagement && deskSettings.showBreakingDesk;
    }
    return true;
  });
  const productionLinks = [
    { href: "/dashboard/desk", label: "Desk Giornalisti", note: "Bozze veloci, media dal campo, invio in revisione." },
    { href: "/dashboard/articoli", label: "Articoli", note: "Revisione completa, stati, opzioni editoriali, publish." },
    { href: "/dashboard/media", label: "Media", note: "Immagini, video e allegati del lavoro quotidiano." },
  ].filter((item) => {
    if (item.href === "/dashboard/media") return deskSettings.showFieldKit;
    return true;
  });
  const controlLinks = [
    { href: "/dashboard/commenti", label: "Commenti", note: "Moderazione, spam, cestino e controlli rapidi." },
    { href: "/dashboard/breaking-news", label: "Breaking News", note: "Ticker, urgenze e contenuti caldi della giornata." },
    { href: "/dashboard/eventi", label: "Eventi", note: "Agenda redazionale e appuntamenti da presidiare." },
    { href: "/dashboard/form", label: "Form", note: "Segnalazioni, contatti e invii che arrivano in redazione." },
  ].filter((item) => {
    if (item.href === "/dashboard/breaking-news") {
      return deskSettings.allowBreakingNewsManagement && deskSettings.showBreakingDesk;
    }
    return true;
  });
  const distributionLinks = [
    { href: "/dashboard/social", label: "Social", note: "Rilanci e adattamenti dei contenuti per i canali." },
    { href: "/dashboard/newsletter", label: "Newsletter", note: "Composizione, anteprima e uscite editoriali." },
    { href: "/dashboard/seo", label: "SEO", note: "Metadata, visibilita` e continuita` dei pezzi pubblicati." },
  ];
  const uixPills = [
    { label: "Header desk", enabled: deskSettings.showDeskHeader },
    { label: "Rail progetti", enabled: deskSettings.showProjectsRail },
    { label: "Workflow", enabled: deskSettings.showWorkflowStatus },
    { label: "Modalita IA", enabled: deskSettings.allowAiMode && deskSettings.showModeSwitcher },
    { label: "Raccolta campo", enabled: deskSettings.showFieldKit },
    { label: "Preview", enabled: deskSettings.showPreviewPane },
    { label: "Breaking", enabled: deskSettings.allowBreakingNewsManagement && deskSettings.showBreakingDesk },
  ];
  const rolePlaybook = [
    {
      role: "Collaboratore",
      focus: "Apri dal Desk, raccogli materiali, salva in bozza e passa in revisione.",
    },
    {
      role: "Editor",
      focus: "Rifinisci gli articoli, governa evidenze, commenti e programmazione.",
    },
    {
      role: "Caporedattore",
      focus: "Approva, governa priorita`, breaking e regole automatiche della home.",
    },
  ];

  const saveEditorialAutomation = async () => {
    if (!currentTenant) {
      toast.error("Tenant non disponibile");
      return;
    }
    setSavingRules(true);
    const supabase = createClient();
    const { data: currentConfig } = await supabase
      .from("site_config")
      .select("theme")
      .eq("tenant_id", currentTenant.id)
      .single();

    const currentTheme = (currentConfig?.theme || {}) as Record<string, unknown>;
    const { error } = await supabase
      .from("site_config")
      .update({
        theme: {
          ...currentTheme,
          editorialAutomation: {
            ...((currentTheme.editorialAutomation as Record<string, unknown> | undefined) || {}),
            homepageFreshHours,
          },
        },
      })
      .eq("tenant_id", currentTenant.id);

    setSavingRules(false);
    if (error) {
      console.error(error);
      toast.error("Salvataggio regole non riuscito");
      return;
    }
    toast.success("Regole redazionali salvate");
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    chief_editor: "Caporedattore",
    editor: "Editor",
    advertiser: "Inserzionista",
    contributor: "Collaboratore",
  };
  const roleLabel = currentRole ? roleLabels[currentRole] || currentRole : "Ruolo non definito";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Redazione
        </h2>
        <p className="text-sm max-w-3xl" style={{ color: "var(--c-text-2)" }}>
          Hub operativo per bozze, revisione, programmazione e strumenti editoriali. I moduli restano quelli del CMS, ma qui li trovi organizzati per il lavoro quotidiano della redazione.
        </p>
      </div>

      <section
        className="rounded-2xl px-4 py-4"
        style={{
          background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(59,130,246,0.04))",
          border: "1px solid var(--c-border)",
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              Stato operativo redazione
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--c-text-2)" }}>
              Punto di accesso unico al lavoro editoriale del tenant attivo: produzione, revisione, controllo e distribuzione restano negli stessi moduli, ma qui sono organizzati come una vera regia di redazione.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--c-bg-1)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}>
              Tenant: {currentTenant?.name || "Nessuno"}
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--c-bg-1)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}>
              Ruolo: {roleLabel}
            </span>
            <button
              type="button"
              onClick={() => void loadRedazione()}
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition"
              style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
            >
              Aggiorna dati
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl px-4 py-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              UIX Desk Redazione attiva
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
              Questa panoramica ti dice subito quali blocchi della shell giornalisti sono attivi per il tenant corrente.
            </p>
          </div>
          <Link
            href="/dashboard/desk"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
          >
            Configura desk giornalisti
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {uixPills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={
                pill.enabled
                  ? { background: "var(--c-accent-soft)", color: "var(--c-accent)" }
                  : { background: "var(--c-bg-2)", color: "var(--c-text-2)", border: "1px solid var(--c-border)" }
              }
            >
              {pill.label}: {pill.enabled ? "ON" : "OFF"}
            </span>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {workflowCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl p-4"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: "var(--c-accent)" }} />
              <div className="text-2xl font-bold" style={{ color: "var(--c-text-0)" }}>
                {loading ? "…" : card.value}
              </div>
              <div className="text-[11px] font-medium mt-1" style={{ color: "var(--c-text-2)" }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Azioni redazionali
          </div>
          <div className="p-3 space-y-2">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition"
                  style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
                    {shortcut.label}
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl overflow-hidden xl:col-span-2" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-2)" }}>
              Da lavorare adesso
            </span>
            <Link href="/dashboard/articoli" className="text-xs font-medium" style={{ color: "var(--c-accent)" }}>
              Apri articoli
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {focusArticles.length === 0 ? (
              <div className="p-8 text-sm text-center" style={{ color: "var(--c-text-3)" }}>
                Nessun contenuto in bozza o revisione.
              </div>
            ) : (
              focusArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/dashboard/articoli/${article.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--c-text-0)" }}>
                      {article.title}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                      {article.author_name} · aggiornato {new Date(article.updated_at).toLocaleDateString("it-IT")}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0" style={statusStyles[article.status] ?? statusStyles.draft}>
                    {statusLabels[article.status] ?? article.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
          Accessi redazionali
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3">
          <div style={{ borderRight: "1px solid var(--c-border)", borderBottom: "1px solid var(--c-border)" }} className="xl:border-b-0">
            <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-3)" }}>
              Produzione
            </div>
            <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
              {productionLinks.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-start justify-between gap-3 px-4 py-3 transition">
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{item.label}</div>
                    <div className="text-[11px] mt-1" style={{ color: "var(--c-text-3)" }}>{item.note}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--c-text-3)" }} />
                </Link>
              ))}
            </div>
          </div>

          <div style={{ borderRight: "1px solid var(--c-border)", borderBottom: "1px solid var(--c-border)" }} className="xl:border-b-0">
            <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-3)" }}>
              Controllo
            </div>
            <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
              {controlLinks.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-start justify-between gap-3 px-4 py-3 transition">
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{item.label}</div>
                    <div className="text-[11px] mt-1" style={{ color: "var(--c-text-3)" }}>{item.note}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--c-text-3)" }} />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-3)" }}>
              Distribuzione
            </div>
            <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
              {distributionLinks.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-start justify-between gap-3 px-4 py-3 transition">
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{item.label}</div>
                    <div className="text-[11px] mt-1" style={{ color: "var(--c-text-3)" }}>{item.note}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--c-text-3)" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
          Ruoli e uso corretto
        </div>
        <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
          {rolePlaybook.map((item) => (
            <div key={item.role} className="px-4 py-3">
              <div className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{item.role}</div>
              <div className="text-[12px] mt-1" style={{ color: "var(--c-text-2)" }}>{item.focus}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-2)" }}>
            Regole automatiche
          </span>
          <button
            onClick={saveEditorialAutomation}
            disabled={savingRules}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--c-accent)" }}
          >
            <Save className="w-3.5 h-3.5" />
            {savingRules ? "Salvataggio..." : "Salva regole"}
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-lg p-3" style={{ background: "var(--c-bg-2)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              Decadimento automatico homepage
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>
              Dopo N ore gli articoli non saranno piu eleggibili per gli slot automatici della homepage, cosi la home si rinnova da sola.
            </p>
          </div>
          <div className="rounded-lg p-3 lg:col-span-2" style={{ background: "var(--c-bg-2)" }}>
            <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--c-text-2)" }}>
              Ore di permanenza automatica in homepage
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={homepageFreshHours}
              onChange={(e) => setHomepageFreshHours(Number(e.target.value) || 0)}
              className="input w-full max-w-xs text-sm"
            />
            <p className="text-[11px] mt-2" style={{ color: "var(--c-text-3)" }}>
              `0` disattiva la regola. Vale per gli slot automatici della homepage gestiti dal modulo Layout.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Programmazione contenuti
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {scheduledArticles.length === 0 ? (
              <div className="p-8 text-sm text-center" style={{ color: "var(--c-text-3)" }}>
                Nessun articolo programmato.
              </div>
            ) : (
              scheduledArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/dashboard/articoli/${article.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--c-text-0)" }}>
                      {article.title}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                      {article.scheduled_at ? new Date(article.scheduled_at).toLocaleString("it-IT") : "Data da definire"}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0" style={statusStyles.approved}>
                    In agenda
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Agenda eventi
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-sm text-center" style={{ color: "var(--c-text-3)" }}>
                Nessun evento imminente.
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href="/dashboard/eventi"
                  className="flex items-center justify-between gap-4 px-4 py-3 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--c-text-0)" }}>
                      {event.title}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                      {new Date(event.starts_at).toLocaleString("it-IT")}
                      {event.location ? ` · ${event.location}` : ""}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "var(--c-text-3)" }} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
