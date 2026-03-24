"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { SystemPanel } from "@/components/panels/SystemPanel";
import {
  Cpu,
  Globe,
  Database,
  HardDrive,
  Users,
  FileText,
  Image,
  Activity,
  Server,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play,
  FlaskConical,
  TerminalSquare,
} from "lucide-react";

interface TechStats {
  totalArticles: number;
  totalMedia: number;
  totalUsers: number;
  totalEvents: number;
  totalBanners: number;
  dbSize: string;
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
    label: "Leggi Theme Contract",
    description: "Legge il contract standard per frontend custom compatibile col CMS.",
    command: "cms.theme.contract.get",
    payload: {},
  },
  {
    id: "page-list",
    label: "Lista pagine",
    description: "Controlla le pagine reali del tenant.",
    command: "cms.page.list",
    payload: {},
  },
  {
    id: "category-create",
    label: "Crea categoria",
    description: "Esempio rapido di creazione categoria editoriale.",
    command: "cms.category.create",
    payload: {
      name: "Approfondimenti",
      color: "#8B0000",
    },
  },
  {
    id: "event-create",
    label: "Crea evento",
    description: "Crea un evento test con data futura.",
    command: "cms.event.create",
    payload: {
      title: "Evento demo redazione",
      starts_at: "2026-04-15T18:00:00.000Z",
      location: "Piazza Brembana",
      category: "Cultura",
    },
  },
  {
    id: "breaking-create",
    label: "Crea breaking",
    description: "Esempio breaking news da desk.",
    command: "cms.breaking.create",
    payload: {
      text: "Breaking demo: aggiornamento urgente dalla redazione",
      priority: 50,
      is_active: true,
    },
  },
  {
    id: "banner-list",
    label: "Lista banner",
    description: "Controlla le creativita ADV presenti.",
    command: "cms.banner.list",
    payload: {},
  },
  {
    id: "media-list",
    label: "Lista media",
    description: "Legge la libreria media del tenant.",
    command: "cms.media.list",
    payload: {
      limit: 20,
    },
  },
  {
    id: "newsletter-get",
    label: "Leggi newsletter",
    description: "Recupera la configurazione centrale del modulo newsletter.",
    command: "cms.newsletter.get",
    payload: {},
  },
];

export default function TecnicoPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [stats, setStats] = useState<TechStats | null>(null);
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

  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();

    async function loadStats() {
      const tenantId = currentTenant!.id;
      const [articles, media, users, events, banners] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("media").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("user_tenants").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("banners").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      ]);

      setStats({
        totalArticles: articles.count ?? 0,
        totalMedia: media.count ?? 0,
        totalUsers: users.count ?? 0,
        totalEvents: events.count ?? 0,
        totalBanners: banners.count ?? 0,
        dbSize: "~",
      });
    }

    loadStats();
  }, [currentTenant]);
  const canUseCommandConsole = ["super_admin", "chief_editor", "editor"].includes(currentRole ?? "");

  const StatCard = ({ icon: Icon, label, value, color }: { icon: typeof Cpu; label: string; value: string | number; color: string }) => (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--c-accent-soft)" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums" style={{ color: "var(--c-text-0)" }}>{value}</p>
          <p className="text-[11px] font-medium" style={{ color: "var(--c-text-2)" }}>{label}</p>
        </div>
      </div>
    </div>
  );

  const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "var(--c-border)" }}>
      <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>{label}</span>
      <span className={`text-xs ${mono ? "font-mono" : ""}`} style={{ color: "var(--c-text-0)" }}>{value}</span>
    </div>
  );

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

  return (
    <div className="max-w-5xl space-y-6">
      {/* System Panel */}
      <div className="card" style={{ height: "500px", display: "flex", flexDirection: "column" }}>
        <SystemPanel />
      </div>

      {/* Resource Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={FileText} label="Articoli" value={stats?.totalArticles ?? "—"} color="var(--c-accent)" />
        <StatCard icon={Image} label="Media files" value={stats?.totalMedia ?? "—"} color="#a855f7" />
        <StatCard icon={Users} label="Utenti" value={stats?.totalUsers ?? "—"} color="#22c55e" />
        <StatCard icon={Activity} label="Eventi" value={stats?.totalEvents ?? "—"} color="#f59e0b" />
        <StatCard icon={Zap} label="Banner" value={stats?.totalBanners ?? "—"} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hosting Info */}
        <div className="card">
          <div className="card-header flex items-center gap-2"><Server className="w-4 h-4" /> Hosting & Infrastruttura</div>
          <div className="p-4">
            <InfoRow label="Platform" value="Vercel Pro" />
            <InfoRow label="Runtime" value="Next.js 16 (Edge + Serverless)" />
            <InfoRow label="Region" value="Washington D.C. (iad1)" />
            <InfoRow label="CDN" value="Vercel Edge Network (Global)" />
            <InfoRow label="SSL" value="Auto (Let's Encrypt)" />
            <InfoRow label="HTTP/3" value="Attivo" />
          </div>
        </div>

        {/* Database Info */}
        <div className="card">
          <div className="card-header flex items-center gap-2"><Database className="w-4 h-4" /> Database</div>
          <div className="p-4">
            <InfoRow label="Provider" value="Supabase Pro" />
            <InfoRow label="Engine" value="PostgreSQL 15" />
            <InfoRow label="Region" value="EU West (Frankfurt)" />
            <InfoRow label="Connection Pooler" value="Supavisor (attivo)" />
            <InfoRow label="RLS" value="Attiva su tutte le tabelle" />
            <InfoRow label="Tabelle" value="17" />
            <InfoRow label="Indici" value="12" />
          </div>
        </div>

        {/* Domain Info */}
        <div className="card">
          <div className="card-header flex items-center gap-2"><Globe className="w-4 h-4" /> Dominio & DNS</div>
          <div className="p-4">
            <InfoRow label="CMS URL" value="editoria-cms.vercel.app" mono />
            <InfoRow label="Dominio sito" value={currentTenant?.domain || "Non configurato"} mono />
            <InfoRow label="Tenant slug" value={currentTenant?.slug || "—"} mono />
            <InfoRow label="Supabase URL" value="xtyoeajjxgeeemwlcotk.supabase.co" mono />
          </div>
        </div>

        {/* Storage */}
        <div className="card">
          <div className="card-header flex items-center gap-2"><HardDrive className="w-4 h-4" /> Storage & Limiti</div>
          <div className="p-4">
            <InfoRow label="Storage provider" value="Supabase Storage" />
            <InfoRow label="Bucket" value="media (pubblico)" />
            <InfoRow label="Max file size" value="50 MB" />
            <InfoRow label="Formati accettati" value="JPG, PNG, WebP, PDF, MP4" />
            <InfoRow label="Piano Supabase" value="Pro (8GB DB, 250GB storage)" />
            <InfoRow label="Piano Vercel" value="Pro (1TB bandwidth/mese)" />
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="card">
        <div className="card-header flex items-center gap-2"><Cpu className="w-4 h-4" /> API Endpoints (per frontend)</div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--c-border)" }}>
                <th className="text-left py-2 font-semibold" style={{ color: "var(--c-text-2)" }}>Endpoint</th>
                <th className="text-left py-2 font-semibold" style={{ color: "var(--c-text-2)" }}>Metodo</th>
                <th className="text-left py-2 font-semibold" style={{ color: "var(--c-text-2)" }}>Cache</th>
                <th className="text-left py-2 font-semibold" style={{ color: "var(--c-text-2)" }}>Descrizione</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ep: "/api/v1/layout", m: "GET", c: "60s", d: "Layout con contenuti pre-fetchati" },
                { ep: "/api/v1/articles", m: "GET", c: "60s", d: "Lista articoli pubblicati" },
                { ep: "/api/v1/articles/[slug]", m: "GET", c: "60s", d: "Singolo articolo" },
                { ep: "/api/v1/categories", m: "GET", c: "300s", d: "Categorie" },
                { ep: "/api/v1/tags", m: "GET", c: "300s", d: "Tags" },
                { ep: "/api/v1/events", m: "GET", c: "120s", d: "Eventi" },
                { ep: "/api/v1/banners", m: "GET", c: "no-cache", d: "Banner con rotazione pesata" },
                { ep: "/api/v1/breaking-news", m: "GET", c: "no-cache", d: "Breaking news attive" },
                { ep: "/api/v1/tenant", m: "GET", c: "300s", d: "Info testata + tema" },
                { ep: "/api/revalidate", m: "POST", c: "—", d: "On-demand ISR revalidation" },
              ].map(r => (
                <tr key={r.ep} className="border-b" style={{ borderColor: "var(--c-border)" }}>
                  <td className="py-2 font-mono" style={{ color: "var(--c-accent)" }}>{r.ep}</td>
                  <td className="py-2"><span className="badge" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>{r.m}</span></td>
                  <td className="py-2" style={{ color: "var(--c-text-1)" }}>{r.c}</td>
                  <td className="py-2" style={{ color: "var(--c-text-1)" }}>{r.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center gap-2"><TerminalSquare className="w-4 h-4" /> Console Comandi Dev</div>
        <div className="p-4 space-y-4">
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
            Console interna per testare i comandi di <span className="font-mono">/api/v1/commands</span> senza uscire dal CMS. Non apre nuove API:
            usa la stessa route protetta, il tenant corrente e i permessi del tuo utente.
          </p>

          {!canUseCommandConsole ? (
            <div className="rounded-lg p-4 text-sm" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
              Disponibile solo per ruoli editoriali autorizzati.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {COMMAND_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className="text-left rounded-lg p-3 transition"
                    style={{
                      border: `1px solid ${selectedTemplateId === template.id ? "var(--c-accent)" : "var(--c-border)"}`,
                      background: selectedTemplateId === template.id ? "var(--c-accent-soft)" : "var(--c-bg-1)",
                    }}
                  >
                    <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{template.label}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>{template.description}</div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
                <div className="space-y-3">
                  <div className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Payload comando</div>
                  <textarea
                    value={commandJson}
                    onChange={(event) => setCommandJson(event.target.value)}
                    spellCheck={false}
                    rows={18}
                    className="w-full rounded-lg px-3 py-3 text-xs font-mono focus:outline-none focus:ring-2"
                    style={{ border: "1px solid var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-0)" }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => executeCommand("dry")}
                      disabled={commandRunning !== null}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
                      style={{ background: "var(--c-bg-2)", color: "var(--c-text-0)", border: "1px solid var(--c-border)" }}
                    >
                      <FlaskConical className="w-4 h-4" />
                      {commandRunning === "dry" ? "Dry run..." : "Dry Run"}
                    </button>
                    <button
                      type="button"
                      onClick={() => executeCommand("live")}
                      disabled={commandRunning !== null}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
                      style={{ background: "var(--c-accent)" }}
                    >
                      <Play className="w-4 h-4" />
                      {commandRunning === "live" ? "Esecuzione..." : "Esegui"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Risposta API</div>
                  <pre
                    className="rounded-lg p-3 text-xs overflow-auto min-h-[360px]"
                    style={{ border: "1px solid var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-0)" }}
                  >
                    {commandResponse || "Nessuna risposta ancora."}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Performance Tips */}
      <div className="card">
        <div className="card-header flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Performance & Monitoraggio</div>
        <div className="p-4 space-y-3">
          <div className="flex gap-3 p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--c-warning)" }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--c-text-0)" }}>Vercel Analytics</p>
              <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>Vai su vercel.com/analytics per Web Vitals, visitor count e performance real-time</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
            <Database className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--c-accent)" }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--c-text-0)" }}>Supabase Dashboard</p>
              <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>Database stats, query performance, storage usage su supabase.com/dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
