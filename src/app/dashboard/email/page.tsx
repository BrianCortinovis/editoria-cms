"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

export default function DashboardEmailPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [audience, setAudience] = useState<"site_members" | "custom_emails">("site_members");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [customEmails, setCustomEmails] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = currentRole === "admin" || currentRole === "chief_editor";

  async function handleSend() {
    if (!currentTenant) return;
    setSending(true);
    const response = await fetch("/api/cms/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        tenant_id: currentTenant.id,
        audience,
        subject,
        messageText,
        emails: customEmails
          .split(/[\n,;]+/)
          .map((value) => value.trim())
          .filter(Boolean),
      }),
    });

    const payload = await response.json().catch(() => null);
    setSending(false);

    if (!response.ok) {
      toast.error(payload?.error || "Errore invio email");
      return;
    }

    toast.success(`Invio completato. Spedite ${payload?.sent || 0} email.`);
  }

  if (!canSend) {
    return (
      <div className="max-w-3xl rounded-3xl border px-6 py-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>Email sito</h2>
        <p className="mt-3 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
          Questo modulo e&apos; riservato ad admin e caporedattore. Il sender e i domini mittente vengono configurati dal superadmin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-3xl border px-6 py-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5" style={{ color: "var(--c-accent)" }} />
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>Email sito</h2>
            <p className="mt-1 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
              Invia comunicazioni operative dal sito ai membri registrati oppure a una lista custom. Le newsletter restano nel modulo dedicato e vanno su Brevo/provider esterno.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border px-6 py-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="grid gap-4">
          <select value={audience} onChange={(event) => setAudience(event.target.value as typeof audience)} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
            <option value="site_members">Tutti i membri registrati del sito</option>
            <option value="custom_emails">Email custom</option>
          </select>

          {audience === "custom_emails" ? (
            <textarea value={customEmails} onChange={(event) => setCustomEmails(event.target.value)} rows={4} placeholder="email1@dominio.it, email2@dominio.it" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
          ) : null}

          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Oggetto email" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
          <textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} rows={12} placeholder="Scrivi il messaggio operativo da inviare. Il CMS lo trasforma in una email HTML semplice e lo spedisce in modo individuale." className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />

          <button type="button" onClick={handleSend} disabled={sending || !currentTenant} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--c-accent)", color: "#fff", opacity: sending ? 0.7 : 1 }}>
            <Send className="h-4 w-4" />
            {sending ? "Invio in corso..." : "Invia email"}
          </button>
        </div>
      </section>
    </div>
  );
}
