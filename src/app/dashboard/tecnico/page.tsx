"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { GuideSheet } from "@/components/help/GuideSheet";
import AIButton from "@/components/ai/AIButton";
import { Cpu, FlaskConical, Play } from "lucide-react";

interface TechStats {
  totalArticles: number;
  totalMedia: number;
  totalUsers: number;
  totalEvents: number;
  totalBanners: number;
}

interface TechOverview {
  projectRef: string | null;
  supabaseHost: string | null;
  appUrl: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
  } | null;
  site: {
    id: string;
    status: string;
    default_subdomain: string;
  } | null;
  membershipRole: string;
  platformBaseDomain: string;
  domainProvider: string;
  stats: {
    members: number;
    domains: number;
    pages: number;
    articles: number;
    media: number;
    events: number;
    banners: number;
  };
  storage: {
    bucketCount: number;
    mediaObjectCount: number;
    mediaLibraryBytes: number;
    mediaLibraryObjectCount: number;
    quota: {
      mediaProvider: string;
      publishedMediaProvider: string;
      softLimitBytes: number;
      hardLimitBytes: number;
      monthlyEgressLimitBytes: number | null;
      uploadBlocked: boolean;
      publishBlocked: boolean;
    } | null;
  };
  subscription: {
    plan_code: string;
    status: string;
  } | null;
  cron: {
    publishMaintenance: {
      createdAt: string;
      metadata: Record<string, unknown>;
    } | null;
    tenantMaintenance: {
      createdAt: string;
      metadata: Record<string, unknown>;
    } | null;
    seoAnalysis: {
      createdAt: string;
      metadata: Record<string, unknown>;
    } | null;
    settings: {
      publishMaintenanceEnabled: boolean;
      seoAnalysisEnabled: boolean;
    };
  };
  billing: {
    available: boolean;
    note: string;
  };
}

interface CommandTemplate {
  id: string;
  label: string;
  description: string;
  command: string;
  payload: Record<string, unknown>;
}

const COMMAND_TEMPLATES: CommandTemplate[] = [
  {
    id: "theme-contract",
    label: "Theme Contract",
    description: "Controlla il contract frontend compatibile col CMS.",
    command: "cms.theme.contract.get",
    payload: {},
  },
  {
    id: "page-list",
    label: "Lista pagine",
    description: "Legge le pagine del tenant corrente.",
    command: "cms.page.list",
    payload: {},
  },
  {
    id: "bridge-pack",
    label: "Bridge Pack",
    description: "Richiama il contract tecnico per desktop e AI builder.",
    command: "cms.page.list",
    payload: {
      note: "Usa GET /api/v1/bridge/site-pack?tenant={tenantSlug}",
    },
  },
  {
    id: "category-create",
    label: "Crea categoria",
    description: "Esempio rapido di creazione tassonomia.",
    command: "cms.category.create",
    payload: {
      name: "Approfondimenti",
      color: "#8B0000",
    },
  },
];

function InfoLine({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: "var(--c-border)" }}>
      <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`} style={{ color: "var(--c-text-0)" }}>{value}</span>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "Mai";
  return new Date(value).toLocaleString("it-IT");
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function TecnicoPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [stats, setStats] = useState<TechStats | null>(null);
  const [overview, setOverview] = useState<TechOverview | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(COMMAND_TEMPLATES[0].id);
  const [commandJson, setCommandJson] = useState(
    JSON.stringify(
      {
        command: COMMAND_TEMPLATES[0].command,
        input: COMMAND_TEMPLATES[0].payload,
      },
      null,
      2,
    ),
  );
  const [commandRunning, setCommandRunning] = useState<"dry" | "live" | null>(null);
  const [commandResponse, setCommandResponse] = useState<string>("");
  const [cronSaving, setCronSaving] = useState(false);

  useEffect(() => {
    if (!currentTenant) return;
    const tenantId = currentTenant.id;

    async function loadStats() {
      const supabase = createClient();
      const [articles, media, users, events, banners, overviewResponse] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("media").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("user_tenants").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("banners").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        fetch(`/api/platform/technical/overview?tenant_id=${tenantId}`, { cache: "no-store" }),
      ]);

      setStats({
        totalArticles: articles.count ?? 0,
        totalMedia: media.count ?? 0,
        totalUsers: users.count ?? 0,
        totalEvents: events.count ?? 0,
        totalBanners: banners.count ?? 0,
      });

      const overviewPayload = await overviewResponse.json();
      if (overviewResponse.ok) {
        setOverview(overviewPayload);
      }
    }

    void loadStats();
  }, [currentTenant]);

  const canUseCommandConsole = ["admin", "chief_editor", "editor"].includes(currentRole ?? "");
  const canManageCron = ["admin", "chief_editor"].includes(currentRole ?? "");

  const applyTemplate = (templateId: string) => {
    const template = COMMAND_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedTemplateId(templateId);
    setCommandJson(
      JSON.stringify(
        {
          command: template.command,
          input: template.payload,
        },
        null,
        2,
      ),
    );
  };

  const executeCommand = async (mode: "dry" | "live") => {
    if (!currentTenant?.id || !canUseCommandConsole) return;

    let parsed: { command: string; input?: Record<string, unknown> };
    try {
      parsed = JSON.parse(commandJson) as { command: string; input?: Record<string, unknown> };
    } catch {
      setCommandResponse("JSON non valido");
      return;
    }

    if (!parsed.command) {
      setCommandResponse("Campo command obbligatorio");
      return;
    }

    setCommandRunning(mode);
    setCommandResponse("");

    try {
      const response = await fetch("/api/v1/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          dryRun: mode === "dry",
          commands: [
            {
              command: parsed.command,
              input: parsed.input || {},
            },
          ],
        }),
      });

      const payload = await response.json();
      setCommandResponse(JSON.stringify(payload, null, 2));
    } catch (error) {
      setCommandResponse(error instanceof Error ? error.message : "Errore comando");
    } finally {
      setCommandRunning(null);
    }
  };

  const updateCronSettings = async (next: { publishMaintenanceEnabled: boolean; seoAnalysisEnabled: boolean }) => {
    if (!currentTenant?.id || !canManageCron) return;

    setCronSaving(true);
    try {
      const response = await fetch("/api/platform/technical/cron-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          ...next,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossibile aggiornare i cron");
      }

      setOverview((current) =>
        current
          ? {
              ...current,
              cron: {
                ...current.cron,
                settings: payload.settings,
              },
            }
          : current
      );
    } catch (error) {
      setCommandResponse(error instanceof Error ? error.message : "Errore cron settings");
    } finally {
      setCronSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <GuideSheet
        eyebrow="Tecnico"
        title="Manuale tecnico del tenant corrente"
        intro="Questa pagina raccoglie in forma leggibile quello che serve a un tecnico: contesto tenant, bridge, publish model, dati Supabase osservabili e una console dev per testare i comandi protetti del CMS."
        icon={Cpu}
        links={[
          { href: "/dashboard/cms", label: "Torna al CMS" },
          { href: "/dashboard/importa-sito", label: "Importa Sito" },
        ]}
        summary={[
          `Tenant: ${overview?.tenant?.slug || currentTenant?.slug || "—"}`,
          `Supabase project: ${overview?.projectRef || "—"}`,
          `Role: ${overview?.membershipRole || currentRole || "—"}`,
          `Bridge pack: /api/v1/bridge/site-pack?tenant=${overview?.tenant?.slug || currentTenant?.slug || "{tenantSlug}"}`,
        ]}
        sections={[
          {
            id: "modello",
            label: "Modello",
            title: "Come leggere l’architettura del CMS",
            body: [
              "Il CMS online e` uno solo e resta il punto di scrittura sul database. Il frontend pubblico non deve leggere il DB live, ma il layer pubblicato. Il desktop editor e` separato e si collega tramite bridge e contract del tenant.",
            ],
            bullets: [
              "Platform App a monte per profilo, siti, domini e permessi.",
              "Cloud CMS per contenuti, tassonomie, publish e controllo.",
              "Desktop editor separato, non piu` nel webapp online.",
              "Sito pubblico o custom runtime che legge il published layer.",
            ],
          },
          {
            id: "bridge",
            label: "Bridge",
            title: "Che cosa consegnare a tecnico o AI builder",
            body: [
              "Il punto di ingresso tecnico e` il bridge pack autenticato del tenant. Da li` si leggono route native, linking, menu, footer, slot, pagine e convenzioni del sito senza inventare integrazioni custom direttamente sul database.",
            ],
            bullets: [
              `/api/v1/bridge/site-pack?tenant=${overview?.tenant?.slug || currentTenant?.slug || "{tenantSlug}"}`,
              "Documentazione tecnica: docs/desktop-editor-cms-bridge.md",
              "Prompt IA bridge: docs/ai-desktop-builder-bridge.md",
            ],
          },
          {
            id: "osservabilita",
            label: "Osservabilita`",
            title: "Che cosa puoi leggere qui in modo affidabile",
            body: [
              "Questa pagina mostra dati osservabili del tenant corrente: contenuti, storage, dominio, stato sito e membership. Non e` una dashboard generica: serve a controllare il CMS reale e a dare un riferimento coerente a chi integra o verifica.",
            ],
            bullets: [
              `Articoli: ${stats?.totalArticles ?? "—"}`,
              `Media: ${stats?.totalMedia ?? "—"}`,
              `Utenti: ${stats?.totalUsers ?? "—"}`,
              `Eventi: ${stats?.totalEvents ?? "—"}`,
              `Banner: ${stats?.totalBanners ?? "—"}`,
            ],
          },
          {
            id: "cron",
            label: "Cron",
            title: "Automazioni di publish e manutenzione",
            body: [
              "I cron servono a mantenere coerente il published layer senza dipendere da click manuali. Per il CMS editoriale il job piu` importante e` publish-maintenance: pubblica articoli programmati, spegne contenuti scaduti e rilancia il publish dei tenant toccati.",
            ],
            bullets: [
              `Ultimo run publish-maintenance: ${formatDateTime(overview?.cron.publishMaintenance?.createdAt)}`,
              `Ultimo run SEO: ${formatDateTime(overview?.cron.seoAnalysis?.createdAt)}`,
              "Gli articoli programmati con scheduled_at sono inclusi nel cron.",
            ],
          },
        ]}
      />

      <article className="rounded-[1.9rem] border px-5 py-6 md:px-8" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="mx-auto max-w-5xl space-y-10">
          <section id="assistente-tecnico" className="scroll-mt-24">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                  Assistente tecnico
                </div>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
                  Analisi IA di runtime, publish, storage e integrazione
                </h2>
              </div>
              <AIButton
                compact
                actions={[
                  {
                    id: "runtime-audit",
                    label: "Audit runtime",
                    prompt:
                      "Analizza il tenant corrente usando solo i dati forniti. Separa la risposta in: fatti verificati, verifiche mancanti, azioni consigliate. Non dichiarare colli di bottiglia o problemi runtime se non sono supportati da questi dati: {context}",
                  },
                  {
                    id: "publish-check",
                    label: "Verifica publish",
                    prompt:
                      "Valuta la pipeline di publish del tenant usando solo il contesto fornito. Indica solo problemi verificabili, controlli mancanti e azioni consigliate. Se un punto non e' verificabile, dichiaralo apertamente: {context}",
                  },
                  {
                    id: "storage-security",
                    label: "Storage e sicurezza",
                    prompt:
                      "Analizza storage, bucket, media, RLS, quote tenant e superficie di attacco del CMS limitandoti al tenant corrente. Produci checklist pratica di hardening e controlli periodici. Non citare metriche o vulnerabilita' non presenti nel contesto: {context}",
                  },
                  {
                    id: "custom-site-brief",
                    label: "Brief sito custom",
                    prompt:
                      "Prepara un brief tecnico per collegare un sito custom al CMS di questo tenant, includendo publish layer, bridge pack, media, banner, cron e verifiche finali: {context}",
                  },
                ]}
                contextData={JSON.stringify(
                  {
                    tenant: overview?.tenant ?? currentTenant ?? null,
                    site: overview?.site ?? null,
                    projectRef: overview?.projectRef ?? null,
                    supabaseHost: overview?.supabaseHost ?? null,
                    stats: overview?.stats ?? stats ?? null,
                    storage: overview?.storage ?? null,
                    subscription: overview?.subscription ?? null,
                    cron: overview?.cron ?? null,
                    billing: overview?.billing ?? null,
                    commands: COMMAND_TEMPLATES,
                  },
                  null,
                  2,
                )}
              />
            </div>
            <div className="mt-4 rounded-[1.2rem] border px-4 py-4 text-sm leading-7" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)", color: "var(--c-text-1)" }}>
              Usa questo pannello per avere audit tecnici contestuali del tenant corrente: runtime osservabile, publish, storage, cron, security posture e integrazione di siti custom o esterni. Le risposte devono basarsi solo sui dati mostrati qui o nel contesto fornito.
            </div>
          </section>

          <section id="stato-sistema" className="scroll-mt-24">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
              Stato osservabile
            </div>
            <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              Dati reali disponibili per il tenant corrente
            </h2>
            <div className="mt-5 grid gap-6 xl:grid-cols-2">
              <section className="rounded-[1.2rem] border px-4 py-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Disponibile adesso</h3>
                <div className="mt-3">
                  <InfoLine label="Stato sito" value={overview?.site?.status || "—"} />
                  <InfoLine label="Dominio principale" value={overview?.tenant?.domain || currentTenant?.domain || "Non configurato"} mono />
                  <InfoLine label="Ultimo cron publish" value={formatDateTime(overview?.cron.publishMaintenance?.createdAt)} />
                  <InfoLine label="Ultimo cron SEO" value={formatDateTime(overview?.cron.seoAnalysis?.createdAt)} />
                  <InfoLine label="Articoli osservati" value={String(overview?.stats.articles ?? stats?.totalArticles ?? "—")} />
                  <InfoLine label="Media osservati" value={String(overview?.stats.media ?? stats?.totalMedia ?? "—")} />
                  <InfoLine label="Media library bytes" value={formatBytes(overview?.storage.mediaLibraryBytes)} />
                </div>
              </section>
              <section className="rounded-[1.2rem] border px-4 py-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Non disponibile qui</h3>
                <div className="mt-3 space-y-3 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
                  <p>Questa pagina non mostra metriche runtime live come CPU, RAM, latency applicativa o query costose. Se quei dati non sono collegati a una sorgente reale, non devono essere trattati come fatti.</p>
                  <p>Quando l&apos;IA analizza questa sezione, deve limitarsi ai dati osservabili del tenant corrente e dichiarare esplicitamente cio` che non e` verificato.</p>
                </div>
              </section>
            </div>
          </section>

          <section className="border-t pt-8 scroll-mt-24" style={{ borderColor: "var(--c-border)" }} id="infra">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
              Infrastruttura
            </div>
            <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              Hosting, database, dominio e storage
            </h2>
            <div className="mt-5 grid gap-6 xl:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Runtime e hosting</h3>
                <div className="mt-3">
                  <InfoLine label="App URL" value={overview?.appUrl || "http://localhost:3000"} mono />
                  <InfoLine label="CMS entry" value="/dashboard/cms" mono />
                  <InfoLine label="Importa sito" value="/dashboard/importa-sito" mono />
                  <InfoLine label="Domain provider" value={overview?.domainProvider || "—"} />
                  <InfoLine label="Platform base domain" value={overview?.platformBaseDomain || "localhost"} mono />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Supabase e sito</h3>
                <div className="mt-3">
                  <InfoLine label="Project ref" value={overview?.projectRef || "—"} mono />
                  <InfoLine label="Supabase host" value={overview?.supabaseHost || "—"} mono />
                  <InfoLine label="Tenant ID" value={overview?.tenant?.id || currentTenant?.id || "—"} mono />
                  <InfoLine label="Site ID" value={overview?.site?.id || "Non collegato"} mono />
                  <InfoLine label="Dominio sito" value={overview?.tenant?.domain || currentTenant?.domain || "Non configurato"} mono />
                  <InfoLine label="Default subdomain" value={overview?.site?.default_subdomain || "—"} mono />
                </div>
              </section>
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Uso osservabile</h3>
                <div className="mt-3">
                  <InfoLine label="Team members" value={String(overview?.stats.members ?? "—")} />
                  <InfoLine label="Connected domains" value={String(overview?.stats.domains ?? "—")} />
                  <InfoLine label="Site pages" value={String(overview?.stats.pages ?? "—")} />
                  <InfoLine label="Published articles" value={String(overview?.stats.articles ?? "—")} />
                  <InfoLine label="Media objects" value={String(overview?.storage.mediaObjectCount ?? "—")} />
                  <InfoLine label="Media library size" value={formatBytes(overview?.storage.mediaLibraryBytes)} />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Storage e subscription</h3>
                <div className="mt-3">
                  <InfoLine label="Bucket media disponibile" value={(overview?.storage.bucketCount ?? 0) > 0 ? "Si`" : "No"} />
                  <InfoLine label="Provider media" value={overview?.storage.quota?.mediaProvider || "Non configurato"} />
                  <InfoLine label="Provider published media" value={overview?.storage.quota?.publishedMediaProvider || "Non configurato"} />
                  <InfoLine label="Soft limit storage" value={overview?.storage.quota ? formatBytes(overview.storage.quota.softLimitBytes) : "Non configurato"} />
                  <InfoLine label="Hard limit storage" value={overview?.storage.quota ? formatBytes(overview.storage.quota.hardLimitBytes) : "Non configurato"} />
                  <InfoLine label="Upload bloccati" value={overview?.storage.quota?.uploadBlocked ? "Si`" : "No"} />
                  <InfoLine label="Publish bloccato" value={overview?.storage.quota?.publishBlocked ? "Si`" : "No"} />
                  <InfoLine label="Plan" value={overview?.subscription?.plan_code || "free"} />
                  <InfoLine label="Subscription" value={overview?.subscription?.status || "active"} />
                  <InfoLine label="Billing state" value={overview?.billing.available ? "Configurato" : "Non configurato"} />
                  <InfoLine label="Billing note" value={overview?.billing.note || "—"} />
                </div>
              </section>
            </div>
          </section>

          <section className="border-t pt-8 scroll-mt-24" style={{ borderColor: "var(--c-border)" }} id="cron">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
              Cron
            </div>
            <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              Stato automazioni e publish programmato
            </h2>
            <div className="mt-5 grid gap-6 xl:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Publish maintenance</h3>
                <div className="mt-3">
                  <InfoLine label="Ultimo run globale" value={formatDateTime(overview?.cron.publishMaintenance?.createdAt)} />
                  <InfoLine label="Ultimo run tenant" value={formatDateTime(overview?.cron.tenantMaintenance?.createdAt)} />
                  <InfoLine
                    label="Articoli programmati pubblicati"
                    value={String(
                      (overview?.cron.publishMaintenance?.metadata?.scheduledArticlesPublished as number | undefined) ?? 0
                    )}
                  />
                  <InfoLine
                    label="Breaking news scadute"
                    value={String(
                      (overview?.cron.publishMaintenance?.metadata?.breakingNewsExpired as number | undefined) ?? 0
                    )}
                  />
                  <InfoLine
                    label="Banner scaduti"
                    value={String(
                      (overview?.cron.publishMaintenance?.metadata?.bannersExpired as number | undefined) ?? 0
                    )}
                  />
                  <InfoLine
                    label="Placement scaduti"
                    value={String(
                      (overview?.cron.publishMaintenance?.metadata?.slotAssignmentsExpired as number | undefined) ?? 0
                    )}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Pianificazione consigliata</h3>
                <div className="mt-3">
                  <InfoLine label="Cron publish" value="*/5 * * * *" mono />
                  <InfoLine label="Cron SEO" value="0 2 * * *" mono />
                  <InfoLine label="Auth" value="Authorization: Bearer CRON_SECRET" mono />
                  <InfoLine label="Effetto" value="Publish layer sempre allineato senza query live dal sito" />
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Controlli tenant</h3>
                <div className="mt-3 space-y-3">
                  <div className="rounded-[1.2rem] border px-4 py-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Publish maintenance</div>
                        <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
                          Pubblica articoli programmati e pulisce contenuti scaduti per questo tenant.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canManageCron || cronSaving}
                        onClick={() =>
                          void updateCronSettings({
                            publishMaintenanceEnabled: !(overview?.cron.settings.publishMaintenanceEnabled ?? true),
                            seoAnalysisEnabled: overview?.cron.settings.seoAnalysisEnabled ?? true,
                          })
                        }
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                        style={{
                          background: overview?.cron.settings.publishMaintenanceEnabled ? "var(--c-accent-soft)" : "var(--c-bg-1)",
                          color: overview?.cron.settings.publishMaintenanceEnabled ? "var(--c-accent)" : "var(--c-text-2)",
                          border: "1px solid var(--c-border)",
                        }}
                      >
                        {overview?.cron.settings.publishMaintenanceEnabled ? "Attivo" : "Disattivato"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border px-4 py-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>SEO analysis</div>
                        <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
                          Consente l’analisi schedulata AI/SEO per questo tenant se il modulo AI e` attivo.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canManageCron || cronSaving}
                        onClick={() =>
                          void updateCronSettings({
                            publishMaintenanceEnabled: overview?.cron.settings.publishMaintenanceEnabled ?? true,
                            seoAnalysisEnabled: !(overview?.cron.settings.seoAnalysisEnabled ?? true),
                          })
                        }
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                        style={{
                          background: overview?.cron.settings.seoAnalysisEnabled ? "var(--c-accent-soft)" : "var(--c-bg-1)",
                          color: overview?.cron.settings.seoAnalysisEnabled ? "var(--c-accent)" : "var(--c-text-2)",
                          border: "1px solid var(--c-border)",
                        }}
                      >
                        {overview?.cron.settings.seoAnalysisEnabled ? "Attivo" : "Disattivato"}
                      </button>
                    </div>
                  </div>
                </div>
                {!canManageCron ? (
                  <p className="mt-3 text-xs" style={{ color: "var(--c-text-3)" }}>
                    Solo super admin e chief editor possono cambiare lo stato dei cron.
                  </p>
                ) : null}
              </section>
            </div>
          </section>

          <section className="border-t pt-8 scroll-mt-24" style={{ borderColor: "var(--c-border)" }} id="api">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
              API pubbliche
            </div>
            <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              Endpoint che il frontend puo` consumare
            </h2>
            <div className="mt-5 overflow-x-auto rounded-[1.4rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Endpoint</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Metodo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Cache</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Descrizione</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ep: "/api/v1/layout", m: "GET", c: "60s", d: "Layout pubblicato o fallback controllato" },
                    { ep: "/api/v1/bridge/site-pack", m: "GET", c: "no-store", d: "Contract tecnico per desktop e AI builder" },
                    { ep: "/api/v1/articles", m: "GET", c: "60s", d: "Lista articoli pubblicati" },
                    { ep: "/api/v1/categories", m: "GET", c: "300s", d: "Categorie pubbliche" },
                    { ep: "/api/v1/tags", m: "GET", c: "300s", d: "Tag pubblici" },
                    { ep: "/api/v1/tenant", m: "GET", c: "300s", d: "Testata e tema" },
                  ].map((row) => (
                    <tr key={row.ep} style={{ borderBottom: "1px solid var(--c-border)" }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--c-accent)" }}>{row.ep}</td>
                      <td className="px-4 py-3" style={{ color: "var(--c-text-1)" }}>{row.m}</td>
                      <td className="px-4 py-3" style={{ color: "var(--c-text-1)" }}>{row.c}</td>
                      <td className="px-4 py-3" style={{ color: "var(--c-text-1)" }}>{row.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border-t pt-8 scroll-mt-24" style={{ borderColor: "var(--c-border)" }} id="console">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
              Console dev
            </div>
            <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              Test comandi senza uscire dal CMS
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
              La console usa la route protetta del CMS e lavora sul tenant corrente. Serve per verifiche tecniche e piccoli test operativi, non per aggirare i flussi normali.
            </p>

            {!canUseCommandConsole ? (
              <div className="mt-5 rounded-[1.2rem] border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)", color: "var(--c-text-2)" }}>
                Disponibile solo per ruoli editoriali autorizzati.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {COMMAND_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition"
                      style={{
                        border: `1px solid ${selectedTemplateId === template.id ? "var(--c-accent)" : "var(--c-border)"}`,
                        background: selectedTemplateId === template.id ? "var(--c-accent-soft)" : "var(--c-bg-0)",
                        color: "var(--c-text-1)",
                      }}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-3)" }}>
                      Payload comando
                    </div>
                    <textarea
                      value={commandJson}
                      onChange={(event) => setCommandJson(event.target.value)}
                      spellCheck={false}
                      rows={18}
                      className="mt-3 w-full rounded-[1.2rem] px-4 py-4 text-xs font-mono focus:outline-none focus:ring-2"
                      style={{ border: "1px solid var(--c-border)", background: "var(--c-bg-0)", color: "var(--c-text-0)" }}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                      onClick={() => void executeCommand("dry")}
                        disabled={commandRunning !== null}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
                        style={{ background: "var(--c-bg-0)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
                      >
                        <FlaskConical className="w-4 h-4" />
                        {commandRunning === "dry" ? "Dry run..." : "Dry Run"}
                      </button>
                      <button
                        type="button"
                      onClick={() => void executeCommand("live")}
                        disabled={commandRunning !== null}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                        style={{ background: "var(--c-accent)" }}
                      >
                        <Play className="w-4 h-4" />
                        {commandRunning === "live" ? "Esecuzione..." : "Esegui"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-3)" }}>
                      Risposta
                    </div>
                    <pre
                      className="mt-3 min-h-[360px] overflow-auto rounded-[1.2rem] px-4 py-4 text-xs"
                      style={{ border: "1px solid var(--c-border)", background: "var(--c-bg-0)", color: "var(--c-text-0)" }}
                    >
                      {commandResponse || "Nessuna risposta ancora."}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
