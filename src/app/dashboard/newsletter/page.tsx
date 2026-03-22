"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, Mail, Send, Users, Layers3 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { mergeNewsletterIntoFooter, normalizeNewsletterConfig, type SiteNewsletterConfig } from "@/lib/site/newsletter";

interface FormOption {
  id: string;
  name: string;
  slug: string;
}

const defaultConfig = normalizeNewsletterConfig({});

export default function NewsletterPage() {
  const { currentTenant } = useAuthStore();
  const [footerRecord, setFooterRecord] = useState<Record<string, unknown>>({});
  const [config, setConfig] = useState<SiteNewsletterConfig>(defaultConfig);
  const [forms, setForms] = useState<FormOption[]>([]);
  const [digestCategories, setDigestCategories] = useState("");
  const [segmentsJson, setSegmentsJson] = useState("[]");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!currentTenant?.id) return;

      const [configResponse] = await Promise.all([
        fetch(`/api/builder/config?tenant_id=${currentTenant.id}`),
      ]);

      const configPayload = await configResponse.json();
      if (cancelled) return;

      const footer = (configPayload.config?.footer && typeof configPayload.config.footer === "object")
        ? (configPayload.config.footer as Record<string, unknown>)
        : {};
      const nextConfig = normalizeNewsletterConfig(footer);

      setFooterRecord(footer);
      setConfig(nextConfig);
      setDigestCategories(nextConfig.digest.categories.join(", "));
      setSegmentsJson(JSON.stringify(nextConfig.segments, null, 2));

      const supabase = createClient();
      const { data } = await supabase
        .from("site_forms")
        .select("id, name, slug")
        .eq("tenant_id", currentTenant.id)
        .eq("is_active", true)
        .order("name");

      if (!cancelled) {
        setForms((data || []) as FormOption[]);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [currentTenant?.id]);

  const updateConfig = <K extends keyof SiteNewsletterConfig>(key: K, value: SiteNewsletterConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!currentTenant?.id) return;

    let parsedSegments: SiteNewsletterConfig["segments"] = [];
    try {
      parsedSegments = JSON.parse(segmentsJson) as SiteNewsletterConfig["segments"];
    } catch {
      toast.error("JSON segmenti non valido");
      return;
    }

    const nextConfig: SiteNewsletterConfig = {
      ...config,
      digest: {
        ...config.digest,
        categories: digestCategories.split(",").map((item) => item.trim()).filter(Boolean),
      },
      segments: parsedSegments,
    };

    const nextFooter = mergeNewsletterIntoFooter(footerRecord, nextConfig);
    setSaving(true);

    const response = await fetch("/api/builder/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: currentTenant.id,
        footer: nextFooter,
      }),
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      toast.error(payload.error || "Errore salvataggio newsletter");
      return;
    }

    setFooterRecord(nextFooter);
    setConfig(nextConfig);
    toast.success("Modulo Newsletter salvato");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Newsletter Professionale</h2>
          <p className="text-sm max-w-4xl" style={{ color: "var(--c-text-2)" }}>
            Modulo editoriale centrale per signup, provider esterno, digest redazionale, posizionamenti globali e segmentazione. I blocchi `Newsletter` e `Iscrizione Newsletter` dell&apos;editor possono usare questa configurazione globale.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
          style={{ background: "var(--c-accent)", opacity: saving ? 0.7 : 1 }}
        >
          <Save className="w-4 h-4 inline mr-2" />
          {saving ? "Salvataggio..." : "Salva modulo"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Mail, label: "Stato", value: config.enabled ? "Attivo" : "Spento" },
          { icon: Send, label: "Output", value: config.mode === "provider" ? "Provider esterno" : (config.formSlug || "Form CMS") },
          { icon: Users, label: "Audience", value: config.provider.audienceLabel || "Lista principale" },
          { icon: Layers3, label: "Placements", value: Object.values(config.placements).filter(Boolean).length.toString() },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <item.icon className="w-4 h-4 mb-2" style={{ color: "var(--c-accent)" }} />
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: "var(--c-text-3)" }}>{item.label}</div>
            <div className="text-base font-semibold mt-1" style={{ color: "var(--c-text-0)" }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Signup Experience</h3>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
            <input type="checkbox" checked={config.enabled} onChange={(event) => updateConfig("enabled", event.target.checked)} />
            Modulo newsletter attivo
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={config.mode} onChange={(event) => updateConfig("mode", event.target.value as SiteNewsletterConfig["mode"])} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }}>
              <option value="form">Usa form CMS</option>
              <option value="provider">Usa provider esterno</option>
            </select>
            <select value={config.theme} onChange={(event) => updateConfig("theme", event.target.value as SiteNewsletterConfig["theme"])} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }}>
              <option value="light">Tema chiaro</option>
              <option value="dark">Tema scuro</option>
              <option value="accent">Tema accent</option>
            </select>
          </div>
          <input value={config.title} onChange={(event) => updateConfig("title", event.target.value)} placeholder="Titolo newsletter" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <textarea value={config.description} onChange={(event) => updateConfig("description", event.target.value)} rows={3} placeholder="Descrizione signup" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={config.placeholder} onChange={(event) => updateConfig("placeholder", event.target.value)} placeholder="Placeholder email" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
            <input value={config.buttonText} onChange={(event) => updateConfig("buttonText", event.target.value)} placeholder="Testo bottone" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={config.formSlug} onChange={(event) => updateConfig("formSlug", event.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }}>
              <option value="">Seleziona form CMS</option>
              {forms.map((form) => (
                <option key={form.id} value={form.slug}>{form.name} ({form.slug})</option>
              ))}
            </select>
            <input value={config.successMessage} onChange={(event) => updateConfig("successMessage", event.target.value)} placeholder="Messaggio di successo" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          </div>
          <textarea value={config.privacyText} onChange={(event) => updateConfig("privacyText", event.target.value)} rows={3} placeholder="Privacy / consenso" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
        </section>

        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Provider & Delivery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={config.provider.provider} onChange={(event) => updateConfig("provider", { ...config.provider, provider: event.target.value as SiteNewsletterConfig["provider"]["provider"] })} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }}>
              <option value="custom">Custom</option>
              <option value="mailchimp">Mailchimp</option>
              <option value="brevo">Brevo</option>
              <option value="sendgrid">Sendgrid</option>
              <option value="convertkit">ConvertKit</option>
            </select>
            <input value={config.provider.audienceLabel} onChange={(event) => updateConfig("provider", { ...config.provider, audienceLabel: event.target.value })} placeholder="Label audience/lista" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          </div>
          <input value={config.provider.formAction} onChange={(event) => updateConfig("provider", { ...config.provider, formAction: event.target.value })} placeholder="Form action provider esterno" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={config.provider.webhookUrl} onChange={(event) => updateConfig("provider", { ...config.provider, webhookUrl: event.target.value })} placeholder="Webhook URL" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
            <input value={config.provider.listId} onChange={(event) => updateConfig("provider", { ...config.provider, listId: event.target.value })} placeholder="List ID / Audience ID" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={config.provider.senderName} onChange={(event) => updateConfig("provider", { ...config.provider, senderName: event.target.value })} placeholder="Sender name" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
            <input value={config.provider.senderEmail} onChange={(event) => updateConfig("provider", { ...config.provider, senderEmail: event.target.value })} placeholder="Sender email" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
            <input value={config.provider.replyTo} onChange={(event) => updateConfig("provider", { ...config.provider, replyTo: event.target.value })} placeholder="Reply-to" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
            <input type="checkbox" checked={config.provider.doubleOptIn} onChange={(event) => updateConfig("provider", { ...config.provider, doubleOptIn: event.target.checked })} />
            Double opt-in attivo
          </label>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Digest Editoriale</h3>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
            <input type="checkbox" checked={config.digest.enabled} onChange={(event) => updateConfig("digest", { ...config.digest, enabled: event.target.checked })} />
            Digest attivo
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={config.digest.frequency} onChange={(event) => updateConfig("digest", { ...config.digest, frequency: event.target.value as SiteNewsletterConfig["digest"]["frequency"] })} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
            <input value={config.digest.sendTime} onChange={(event) => updateConfig("digest", { ...config.digest, sendTime: event.target.value })} placeholder="07:30" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          </div>
          <textarea value={config.digest.intro} onChange={(event) => updateConfig("digest", { ...config.digest, intro: event.target.value })} rows={3} placeholder="Intro digest" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <input value={digestCategories} onChange={(event) => setDigestCategories(event.target.value)} placeholder="Categorie incluse, separate da virgola" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
              <input type="checkbox" checked={config.digest.includeBreaking} onChange={(event) => updateConfig("digest", { ...config.digest, includeBreaking: event.target.checked })} />
              Include breaking
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
              <input type="checkbox" checked={config.digest.includeEvents} onChange={(event) => updateConfig("digest", { ...config.digest, includeEvents: event.target.checked })} />
              Include eventi
            </label>
          </div>
        </section>

        <section className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Placements & Segmenti</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {([
              ["homepage", "Homepage"],
              ["articleInline", "Dentro articolo"],
              ["articleFooter", "Fine articolo"],
              ["categoryHeader", "Header categoria"],
              ["footer", "Footer"],
              ["stickyBar", "Sticky bar"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                <input
                  type="checkbox"
                  checked={config.placements[key]}
                  onChange={(event) => updateConfig("placements", { ...config.placements, [key]: event.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
            <input type="checkbox" checked={config.leadMagnet.enabled} onChange={(event) => updateConfig("leadMagnet", { ...config.leadMagnet, enabled: event.target.checked })} />
            Lead magnet / bonus editoriale attivo
          </label>
          <input value={config.leadMagnet.title} onChange={(event) => updateConfig("leadMagnet", { ...config.leadMagnet, title: event.target.value })} placeholder="Titolo lead magnet" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <textarea value={config.leadMagnet.description} onChange={(event) => updateConfig("leadMagnet", { ...config.leadMagnet, description: event.target.value })} rows={3} placeholder="Descrizione bonus / contenuto premium" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
          <textarea value={segmentsJson} onChange={(event) => setSegmentsJson(event.target.value)} rows={8} className="w-full px-3 py-2 rounded-lg text-xs font-mono" style={{ border: "1px solid var(--c-border)" }} />
        </section>
      </div>
    </div>
  );
}
