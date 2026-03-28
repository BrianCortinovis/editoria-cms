"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { normalizeFooterConfig } from "@/lib/site/footer";
import { mergeNewsletterIntoFooter, normalizeNewsletterConfig } from "@/lib/site/newsletter";
import AIButton from "@/components/ai/AIButton";

export default function FooterPage() {
  const { currentTenant } = useAuthStore();
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [copyright, setCopyright] = useState("");
  const [columnsJson, setColumnsJson] = useState("[]");
  const [linksJson, setLinksJson] = useState("[]");
  const [socialJson, setSocialJson] = useState("[]");
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [newsletterTitle, setNewsletterTitle] = useState("");
  const [newsletterDescription, setNewsletterDescription] = useState("");
  const [newsletterButtonText, setNewsletterButtonText] = useState("Iscriviti");
  const [newsletterFormSlug, setNewsletterFormSlug] = useState("");
  const [footerRecord, setFooterRecord] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const run = async () => {
        if (!currentTenant?.id) return;
        const response = await fetch(`/api/builder/config?tenant_id=${currentTenant.id}`);
        const payload = await response.json();
        if (cancelled) return;

        const rawFooter = (payload.config?.footer && typeof payload.config.footer === "object")
          ? (payload.config.footer as Record<string, unknown>)
          : {};
        const footer = normalizeFooterConfig(rawFooter);
        const newsletter = normalizeNewsletterConfig(rawFooter);
        setFooterRecord(rawFooter);
        setLogoUrl(footer.logoUrl || "");
        setDescription(footer.description || "");
        setCopyright(footer.copyright || "");
        setColumnsJson(JSON.stringify(footer.columns, null, 2));
        setLinksJson(JSON.stringify(footer.links, null, 2));
        setSocialJson(JSON.stringify(footer.socialLinks, null, 2));
        setNewsletterEnabled(Boolean(newsletter.placements.footer && newsletter.enabled));
        setNewsletterTitle(newsletter.title || "");
        setNewsletterDescription(newsletter.description || "");
        setNewsletterButtonText(newsletter.buttonText || "Iscriviti");
        setNewsletterFormSlug(newsletter.formSlug || "");
      };

      void run();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentTenant]);

  const handleSave = async () => {
    if (!currentTenant?.id) return;

    let columns;
    let links;
    let socialLinks;
    try {
      columns = JSON.parse(columnsJson);
      links = JSON.parse(linksJson);
      socialLinks = JSON.parse(socialJson);
    } catch {
      toast.error("JSON footer non valido");
      return;
    }

    const mergedFooter = mergeNewsletterIntoFooter(
      {
        ...footerRecord,
        logoUrl,
        description,
        columns,
        links,
        socialLinks,
        copyright,
      },
      {
        ...normalizeNewsletterConfig(footerRecord),
        enabled: newsletterEnabled,
        title: newsletterTitle,
        description: newsletterDescription,
        buttonText: newsletterButtonText,
        formSlug: newsletterFormSlug,
        placements: {
          ...normalizeNewsletterConfig(footerRecord).placements,
          footer: newsletterEnabled,
        },
      }
    );

    setSaving(true);
    const response = await fetch("/api/builder/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: currentTenant.id,
        footer: mergedFooter,
      }),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      toast.error(payload.error || "Errore salvataggio footer");
      return;
    }

    toast.success("Footer salvato");
    setFooterRecord(mergedFooter);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Footer Globale</h2>
          <p className="text-sm max-w-3xl" style={{ color: "var(--c-text-2)" }}>
            Gestione centralizzata del pie di pagina del sito. Il blocco `Footer` dell&apos;editor può usare questa configurazione globale oppure restare completamente custom.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIButton
            compact
            actions={[
              {
                id: "footer-audit",
                label: "Audit footer",
                prompt: "Analizza footer, colonne, link rapidi, social e box newsletter. Suggerisci miglioramenti di UX, SEO, conversione e ordine informativo: {context}",
              },
              {
                id: "footer-copy",
                label: "Testi footer",
                prompt: "Rivedi descrizioni, copyright, link e box newsletter del footer. Proponi copy piu` chiaro, istituzionale e utile per il sito: {context}",
              },
            ]}
            contextData={JSON.stringify({
              tenant: currentTenant,
              footerRecord,
              draft: {
                logoUrl,
                description,
                copyright,
                columnsJson,
                linksJson,
                socialJson,
                newsletterEnabled,
                newsletterTitle,
                newsletterDescription,
                newsletterButtonText,
                newsletterFormSlug,
              },
            }, null, 2)}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ background: "var(--c-accent)", opacity: saving ? 0.7 : 1 }}
          >
            <Save className="w-4 h-4 inline mr-2" />
            {saving ? "Salvataggio..." : "Salva footer"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Base</h3>
          <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="URL logo footer" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Descrizione footer" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <textarea value={copyright} onChange={(event) => setCopyright(event.target.value)} rows={2} placeholder="Copyright" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
        </section>

        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Newsletter Footer</h3>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
            Questa sezione controlla il box footer, ma le impostazioni avanzate del modulo stanno ora in Redazione &gt; Newsletter.
          </p>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
            <input type="checkbox" checked={newsletterEnabled} onChange={(event) => setNewsletterEnabled(event.target.checked)} />
            Abilita box newsletter nel footer
          </label>
          <input value={newsletterTitle} onChange={(event) => setNewsletterTitle(event.target.value)} placeholder="Titolo newsletter" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <textarea value={newsletterDescription} onChange={(event) => setNewsletterDescription(event.target.value)} rows={3} placeholder="Descrizione newsletter" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newsletterButtonText} onChange={(event) => setNewsletterButtonText(event.target.value)} placeholder="Testo bottone" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
            <input value={newsletterFormSlug} onChange={(event) => setNewsletterFormSlug(event.target.value)} placeholder="Slug form CMS" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Colonne</h3>
          <textarea value={columnsJson} onChange={(event) => setColumnsJson(event.target.value)} rows={16} className="w-full px-3 py-2 rounded-lg text-xs font-mono" style={{ border: "1px solid var(--c-border)" }} />
        </section>

        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Link rapidi</h3>
          <textarea value={linksJson} onChange={(event) => setLinksJson(event.target.value)} rows={16} className="w-full px-3 py-2 rounded-lg text-xs font-mono" style={{ border: "1px solid var(--c-border)" }} />
        </section>

        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Social</h3>
          <textarea value={socialJson} onChange={(event) => setSocialJson(event.target.value)} rows={16} className="w-full px-3 py-2 rounded-lg text-xs font-mono" style={{ border: "1px solid var(--c-border)" }} />
        </section>
      </div>
    </div>
  );
}
