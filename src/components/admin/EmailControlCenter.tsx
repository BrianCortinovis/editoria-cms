"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Save, Send, Settings } from "lucide-react";

interface PlatformConfig {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  senderDomain: string;
  newsletterProvider: "brevo" | "dedicated";
  notes: string;
}

interface SiteSenderConfig {
  senderMode: "platform_default" | "custom";
  fromName: string;
  fromEmail: string;
  replyTo: string;
  senderDomain: string;
  notes: string;
}

interface SiteRow {
  siteId: string;
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  memberCount: number;
  sender: SiteSenderConfig;
  effectiveSender: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
    senderDomain: string;
    source: "platform_default" | "site_custom";
  };
}

interface ControlPayload {
  platformConfig: PlatformConfig;
  transport: {
    mode: string;
    resendConfigured: boolean;
  };
  newsletterPolicy: {
    provider: "brevo" | "dedicated";
    deliveryModel: string;
  };
  counts: {
    users: number;
    sites: number;
  };
  sites: SiteRow[];
}

const emptyPlatformConfig: PlatformConfig = {
  fromName: "Editoria CMS",
  fromEmail: "",
  replyTo: "",
  senderDomain: "",
  newsletterProvider: "brevo",
  notes: "",
};

export function EmailControlCenter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(emptyPlatformConfig);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [transportMode, setTransportMode] = useState<string>("console");
  const [resendConfigured, setResendConfigured] = useState(false);
  const [counts, setCounts] = useState({ users: 0, sites: 0 });
  const [compose, setCompose] = useState({
    audience: "platform_users" as "platform_users" | "site_members" | "custom_emails",
    subject: "",
    messageText: "",
    customEmails: "",
    siteId: "",
  });

  async function loadState() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/email/control", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as ControlPayload | null;
    if (!response.ok || !payload) {
      setMessage(payload && "error" in payload ? String((payload as { error?: string }).error || "Errore caricamento") : "Errore caricamento");
      setLoading(false);
      return;
    }

    setPlatformConfig(payload.platformConfig);
    setSites(payload.sites);
    setTransportMode(payload.transport.mode);
    setResendConfigured(payload.transport.resendConfigured);
    setCounts(payload.counts);
    setSelectedSiteId(payload.sites[0]?.siteId || "");
    setCompose((current) => ({
      ...current,
      siteId: current.siteId || payload.sites[0]?.siteId || "",
    }));
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadState();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const selectedSite = useMemo(
    () => sites.find((site) => site.siteId === selectedSiteId) || null,
    [selectedSiteId, sites],
  );

  async function savePlatformConfig() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/email/control", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        scope: "platform",
        platformConfig,
      }),
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? "Configurazione piattaforma salvata." : payload?.error || "Errore salvataggio piattaforma");
    if (response.ok) {
      await loadState();
    }
  }

  async function saveSiteSender() {
    if (!selectedSite) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/email/control", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        scope: "site",
        siteId: selectedSite.siteId,
        sender: selectedSite.sender,
      }),
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? `Sender salvato per ${selectedSite.name}.` : payload?.error || "Errore salvataggio sito");
    if (response.ok) {
      await loadState();
    }
  }

  async function sendBroadcast() {
    setSending(true);
    setMessage("");
    const response = await fetch("/api/admin/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        audience: compose.audience,
        siteId: compose.audience === "site_members" ? compose.siteId : undefined,
        subject: compose.subject,
        messageText: compose.messageText,
        emails: compose.customEmails
          .split(/[\n,;]+/)
          .map((value) => value.trim())
          .filter(Boolean),
      }),
    });
    const payload = await response.json().catch(() => null);
    setSending(false);
    if (!response.ok) {
      setMessage(payload?.error || "Errore invio email");
      return;
    }

    setMessage(`Invio completato. Spedite: ${payload?.sent || 0}, fallite: ${payload?.failed || 0}.`);
  }

  function patchSelectedSite(patch: Partial<SiteSenderConfig>) {
    setSites((current) => current.map((site) => {
      if (site.siteId !== selectedSiteId) return site;
      return {
        ...site,
        sender: {
          ...site.sender,
          ...patch,
        },
      };
    }));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.5rem] border p-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
              Transactional Email
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
              Control Plane email
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
              Qui governi le mail normali del CMS: broadcast superadmin, invii ai membri dei siti e sender per-tenant. La newsletter resta separata e orientata a Brevo o provider dedicato.
            </p>
          </div>
          <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
            <div><strong>Transport:</strong> {transportMode}</div>
            <div><strong>Resend:</strong> {resendConfigured ? "configurato" : "non configurato"}</div>
            <div><strong>Utenti:</strong> {counts.users}</div>
            <div><strong>Siti:</strong> {counts.sites}</div>
          </div>
        </div>
        {message ? (
          <div className="mt-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
            {message}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.5rem] border p-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" style={{ color: "var(--c-accent)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Sender piattaforma</h3>
          </div>
          <div className="mt-5 grid gap-4">
            <input value={platformConfig.fromName} onChange={(event) => setPlatformConfig((current) => ({ ...current, fromName: event.target.value }))} placeholder="From name" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
            <input value={platformConfig.fromEmail} onChange={(event) => setPlatformConfig((current) => ({ ...current, fromEmail: event.target.value }))} placeholder="from@mail.tuapiattaforma.it" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
            <input value={platformConfig.replyTo} onChange={(event) => setPlatformConfig((current) => ({ ...current, replyTo: event.target.value }))} placeholder="reply-to@tuapiattaforma.it" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
            <input value={platformConfig.senderDomain} onChange={(event) => setPlatformConfig((current) => ({ ...current, senderDomain: event.target.value }))} placeholder="mail.tuapiattaforma.it" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
            <select value={platformConfig.newsletterProvider} onChange={(event) => setPlatformConfig((current) => ({ ...current, newsletterProvider: event.target.value as "brevo" | "dedicated" }))} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
              <option value="brevo">Newsletter su Brevo</option>
              <option value="dedicated">Newsletter su provider dedicato</option>
            </select>
            <textarea value={platformConfig.notes} onChange={(event) => setPlatformConfig((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="Note operative su domini, DNS o policy di invio" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
            <button type="button" onClick={savePlatformConfig} disabled={saving || loading} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--c-accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
              <Save className="h-4 w-4" />
              Salva sender piattaforma
            </button>
          </div>
        </div>

        <div className="rounded-[1.5rem] border p-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5" style={{ color: "var(--c-accent)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Sender per sito</h3>
          </div>
          <div className="mt-5 grid gap-4">
            <select value={selectedSiteId} onChange={(event) => setSelectedSiteId(event.target.value)} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
              {sites.map((site) => (
                <option key={site.siteId} value={site.siteId}>{site.name} ({site.memberCount} membri)</option>
              ))}
            </select>

            {selectedSite ? (
              <>
                <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                  <div><strong>Sito:</strong> {selectedSite.name}</div>
                  <div><strong>Slug:</strong> {selectedSite.slug}</div>
                  <div><strong>Effective sender:</strong> {selectedSite.effectiveSender.fromEmail || "non configurato"}</div>
                </div>
                <select value={selectedSite.sender.senderMode} onChange={(event) => patchSelectedSite({ senderMode: event.target.value as SiteSenderConfig["senderMode"] })} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                  <option value="platform_default">Usa sender piattaforma</option>
                  <option value="custom">Usa sender custom sito</option>
                </select>
                <input value={selectedSite.sender.fromName} onChange={(event) => patchSelectedSite({ fromName: event.target.value })} placeholder="From name sito" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <input value={selectedSite.sender.fromEmail} onChange={(event) => patchSelectedSite({ fromEmail: event.target.value })} placeholder="noreply@mail.cliente.it" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <input value={selectedSite.sender.replyTo} onChange={(event) => patchSelectedSite({ replyTo: event.target.value })} placeholder="redazione@cliente.it" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <input value={selectedSite.sender.senderDomain} onChange={(event) => patchSelectedSite({ senderDomain: event.target.value })} placeholder="mail.cliente.it" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <textarea value={selectedSite.sender.notes} onChange={(event) => patchSelectedSite({ notes: event.target.value })} rows={3} placeholder="Note DNS / verifiche dominio / policy sito" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <button type="button" onClick={saveSiteSender} disabled={saving || loading} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--c-accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                  <Save className="h-4 w-4" />
                  Salva sender sito
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border p-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-center gap-3">
          <Send className="h-5 w-5" style={{ color: "var(--c-accent)" }} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Broadcast transactional</h3>
        </div>
        <div className="mt-5 grid gap-4">
          <select value={compose.audience} onChange={(event) => setCompose((current) => ({ ...current, audience: event.target.value as typeof current.audience }))} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
            <option value="platform_users">Tutti gli utenti CMS registrati</option>
            <option value="site_members">Membri di un sito</option>
            <option value="custom_emails">Email custom</option>
          </select>

          {(compose.audience === "site_members" || compose.audience === "platform_users") ? (
            <select value={compose.siteId} onChange={(event) => setCompose((current) => ({ ...current, siteId: event.target.value }))} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
              {sites.map((site) => (
                <option key={site.siteId} value={site.siteId}>{site.name}</option>
              ))}
            </select>
          ) : null}

          {compose.audience === "custom_emails" ? (
            <textarea value={compose.customEmails} onChange={(event) => setCompose((current) => ({ ...current, customEmails: event.target.value }))} rows={4} placeholder="email1@dominio.it, email2@dominio.it" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
          ) : null}

          <input value={compose.subject} onChange={(event) => setCompose((current) => ({ ...current, subject: event.target.value }))} placeholder="Oggetto email" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
          <textarea value={compose.messageText} onChange={(event) => setCompose((current) => ({ ...current, messageText: event.target.value }))} rows={10} placeholder="Scrivi il messaggio. Verrà convertito in HTML semplice e inviato individualmente a ciascun destinatario." className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />

          <button type="button" onClick={sendBroadcast} disabled={sending || loading} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--c-danger)", color: "#fff", opacity: sending ? 0.7 : 1 }}>
            <Send className="h-4 w-4" />
            {sending ? "Invio in corso..." : "Invia email"}
          </button>
        </div>
      </section>
    </div>
  );
}
