"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Eye,
  FilePlus2,
  Mail,
  RefreshCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { GuideSheet } from "@/components/help/GuideSheet";
import {
  getDefaultNewsletterComposerState,
  type NewsletterCampaignRecord,
  type NewsletterModuleState,
  type NewsletterPreviewArticle,
  type NewsletterPreviewResult,
} from "@/lib/newsletter/module";
import { getNewsletterProviderDescriptor } from "@/lib/newsletter/provider";
import { normalizeNewsletterConfig, type SiteNewsletterConfig } from "@/lib/site/newsletter";

interface FormOption {
  id: string;
  name: string;
  slug: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  sort_order?: number | null;
}

interface PreviewState {
  preview: NewsletterPreviewResult;
  handoff: {
    provider: {
      label: string;
      summary: string;
      checklist: string[];
    };
    deliveryModel: string;
    recommendedFlow: string[];
    payload: Record<string, unknown>;
  };
}

const defaultConfig = normalizeNewsletterConfig({});

function makeCampaign(): NewsletterCampaignRecord {
  const now = new Date().toISOString();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `nl-${Date.now()}`;

  return {
    id,
    title: "Nuova campagna",
    subject: "",
    preheader: "",
    intro: "",
    featuredArticleId: null,
    articleIds: [],
    status: "draft",
    audienceLabel: "Lista principale",
    provider: "custom",
    templateKey: "digest",
    scheduledAt: null,
    sentAt: null,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

function formatDate(value: string | null) {
  if (!value) return "Non pianificata";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NewsletterPage() {
  const { currentTenant } = useAuthStore();
  const [config, setConfig] = useState<SiteNewsletterConfig>(defaultConfig);
  const [moduleState, setModuleState] = useState<NewsletterModuleState>(getDefaultNewsletterComposerState());
  const [forms, setForms] = useState<FormOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [articles, setArticles] = useState<NewsletterPreviewArticle[]>([]);
  const [digestCategories, setDigestCategories] = useState("");
  const [segmentsJson, setSegmentsJson] = useState("[]");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!currentTenant?.id) return;
      setLoading(true);

      const response = await fetch(`/api/newsletter/module?tenant_id=${currentTenant.id}`);
      const payload = await response.json().catch(() => null);
      if (cancelled) return;

      if (!response.ok) {
        toast.error(payload?.error || "Errore caricamento modulo newsletter");
        setLoading(false);
        return;
      }

      const nextConfig = normalizeNewsletterConfig({ newsletterSettings: payload.config });
      const nextModule = payload.moduleState as NewsletterModuleState;
      const nextCampaignId = nextModule.campaigns[0]?.id || null;

      setConfig(nextConfig);
      setModuleState(nextModule);
      setForms((payload.forms || []) as FormOption[]);
      setCategories((payload.categories || []) as CategoryOption[]);
      setArticles((payload.articles || []) as NewsletterPreviewArticle[]);
      setDigestCategories(nextConfig.digest.categories.join(", "));
      setSegmentsJson(JSON.stringify(nextConfig.segments, null, 2));
      setSelectedCampaignId((current) => current || nextCampaignId);
      setPreviewState(null);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [currentTenant?.id]);

  const selectedCampaign = useMemo(
    () => moduleState.campaigns.find((campaign) => campaign.id === selectedCampaignId) || null,
    [moduleState.campaigns, selectedCampaignId],
  );

  const updateConfig = <K extends keyof SiteNewsletterConfig>(key: K, value: SiteNewsletterConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const patchCampaign = (patch: Partial<NewsletterCampaignRecord>) => {
    if (!selectedCampaignId) return;
    setModuleState((current) => ({
      ...current,
      campaigns: current.campaigns.map((campaign) =>
        campaign.id === selectedCampaignId
          ? { ...campaign, ...patch, updatedAt: new Date().toISOString() }
          : campaign
      ),
    }));
  };

  const toggleArticleSelection = (articleId: string) => {
    if (!selectedCampaign) return;
    const exists = selectedCampaign.articleIds.includes(articleId);
    const articleIds = exists
      ? selectedCampaign.articleIds.filter((id) => id !== articleId)
      : [...selectedCampaign.articleIds, articleId];

    patchCampaign({ articleIds });
  };

  const handleCreateCampaign = () => {
    const campaign = makeCampaign();
    setModuleState((current) => ({
      ...current,
      campaigns: [campaign, ...current.campaigns],
    }));
    setSelectedCampaignId(campaign.id);
    setPreviewState(null);
  };

  const handleDeleteCampaign = () => {
    if (!selectedCampaignId) return;
    setModuleState((current) => {
      const campaigns = current.campaigns.filter((campaign) => campaign.id !== selectedCampaignId);
      setSelectedCampaignId(campaigns[0]?.id || null);
      return { ...current, campaigns };
    });
    setPreviewState(null);
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

    setSaving(true);
    const response = await fetch("/api/newsletter/module", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: currentTenant.id,
        config: nextConfig,
        moduleState,
      }),
    });

    const payload = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      toast.error(payload?.error || "Errore salvataggio modulo newsletter");
      return;
    }

    setConfig(normalizeNewsletterConfig({ newsletterSettings: payload.config }));
    setModuleState(payload.moduleState as NewsletterModuleState);
    setDigestCategories(nextConfig.digest.categories.join(", "));
    toast.success("Modulo newsletter salvato");
  };

  const handleGeneratePreview = async () => {
    if (!currentTenant?.id || !selectedCampaign) return;

    setPreviewing(true);
    const response = await fetch("/api/newsletter/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: currentTenant.id,
        config,
        campaign: selectedCampaign,
      }),
    });

    const payload = await response.json().catch(() => null);
    setPreviewing(false);

    if (!response.ok) {
      toast.error(payload?.error || "Errore generazione anteprima");
      return;
    }

    setPreviewState(payload as PreviewState);
    toast.success("Anteprima aggiornata");
  };

  const providerDescriptor = getNewsletterProviderDescriptor(
    selectedCampaign?.provider || config.provider.provider,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <GuideSheet
        eyebrow="Newsletter"
        title="Composer newsletter e bridge provider"
        intro="La newsletter si compone dal CMS per pescare contenuti, articoli e tassonomia in modo nativo. L'invio reale resta esterno: il CMS prepara campagne, preview e payload handoff; il provider gestisce delivery, liste e unsubscribe."
        icon={Mail}
        summary={[
          "Supabase resta limitato ad auth, configurazione e stato base del modulo.",
          "Le campagne stanno nel CMS e possono riusare articoli gia` pubblicati.",
          "Preview HTML, testo e payload provider vengono generati lato server.",
          "Il provider esterno riceve il pacchetto finale, non il controllo del CMS.",
        ]}
        sections={[
          {
            id: "modello",
            label: "Modello",
            title: "Come funziona il modulo",
            body: [
              "Il CMS e` il punto di composizione editoriale. Qui scegli subject, preheader, articoli, ordine dei blocchi e provider target della campagna.",
              "Supabase non diventa un motore email: conserva solo autenticazione, configurazione del sito, campagne bozza e stato base del modulo.",
            ],
            bullets: [
              "Composizione e preview dentro il CMS.",
              "Audience, invio, bounce e unsubscribe nel provider esterno.",
              "Nessun lock su un provider unico: il payload viene preparato in forma neutra.",
            ],
          },
          {
            id: "operativo",
            label: "Operativo",
            title: "Flusso redazionale consigliato",
            body: [
              "Prima definisci signup, audience e sender. Poi crei una campagna, scegli gli articoli pubblicati e generi l'anteprima. Quando il contenuto e` pronto, la campagna passa a ready o scheduled e il team tecnico la passa al provider.",
            ],
            bullets: [
              "Draft per lavorazione redazionale.",
              "Ready quando preview e payload sono allineati.",
              "Scheduled quando il provider dovra` inviare a data stabilita.",
            ],
          },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Mail, label: "Provider", value: config.provider.provider.toUpperCase() },
          { icon: Users, label: "Audience", value: config.provider.audienceLabel || "Lista principale" },
          { icon: Sparkles, label: "Campagne", value: String(moduleState.campaigns.length) },
          { icon: Send, label: "Placements", value: String(Object.values(config.placements).filter(Boolean).length) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border px-5 py-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
            <item.icon className="mb-2 h-4 w-4" style={{ color: "var(--c-accent)" }} />
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>{item.label}</div>
            <div className="mt-1 text-base font-semibold" style={{ color: "var(--c-text-0)" }}>{item.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-8 xl:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Campagne</h2>
              <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Bozze, invii schedulati e handoff provider.</p>
            </div>
            <button
              type="button"
              onClick={handleCreateCampaign}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--c-accent)", color: "#fff" }}
            >
              <FilePlus2 className="h-4 w-4" />
              Nuova
            </button>
          </div>

          <div className="space-y-2">
            {moduleState.campaigns.length === 0 ? (
              <div className="rounded-2xl border px-4 py-5 text-sm" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-2)" }}>
                Nessuna campagna ancora. Parti da una bozza e collega gli articoli gia` pubblicati del sito.
              </div>
            ) : (
              moduleState.campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => {
                    setSelectedCampaignId(campaign.id);
                    setPreviewState(null);
                  }}
                  className="w-full rounded-2xl border px-4 py-4 text-left transition-colors"
                  style={{
                    borderColor: campaign.id === selectedCampaignId ? "var(--c-accent)" : "var(--c-border)",
                    background: campaign.id === selectedCampaignId ? "color-mix(in srgb, var(--c-accent) 8%, var(--c-bg-1))" : "var(--c-bg-1)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{campaign.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>{campaign.status}</div>
                    </div>
                    <div className="text-right text-xs" style={{ color: "var(--c-text-2)" }}>
                      <div>{campaign.provider}</div>
                      <div>{formatDate(campaign.scheduledAt)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="space-y-8">
          <section className="rounded-3xl border px-6 py-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>Setup provider e iscrizione</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
                  Questa parte governa il modulo newsletter pubblico del sito e i metadata per l&apos;handoff ai provider esterni. Il CMS non invia in proprio: prepara soltanto il materiale giusto.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                style={{ background: "var(--c-accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvataggio..." : "Salva modulo"}
              </button>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                  <input type="checkbox" checked={config.enabled} onChange={(event) => updateConfig("enabled", event.target.checked)} />
                  Modulo newsletter attivo
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <select value={config.mode} onChange={(event) => updateConfig("mode", event.target.value as SiteNewsletterConfig["mode"])} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                    <option value="form">Usa form CMS</option>
                    <option value="provider">Usa provider esterno</option>
                  </select>
                  <select value={config.formSlug} onChange={(event) => updateConfig("formSlug", event.target.value)} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                    <option value="">Seleziona form CMS</option>
                    {forms.map((form) => (
                      <option key={form.id} value={form.slug}>{form.name}</option>
                    ))}
                  </select>
                </div>

                <input value={config.title} onChange={(event) => updateConfig("title", event.target.value)} placeholder="Titolo signup" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <textarea value={config.description} onChange={(event) => updateConfig("description", event.target.value)} rows={3} placeholder="Descrizione modulo" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={config.placeholder} onChange={(event) => updateConfig("placeholder", event.target.value)} placeholder="Placeholder email" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                  <input value={config.buttonText} onChange={(event) => updateConfig("buttonText", event.target.value)} placeholder="Label bottone" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                </div>
                <textarea value={config.privacyText} onChange={(event) => updateConfig("privacyText", event.target.value)} rows={3} placeholder="Privacy e consenso" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--c-border)" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Provider attivo</div>
                  <h3 className="mt-2 text-base font-semibold" style={{ color: "var(--c-text-0)" }}>{providerDescriptor.label}</h3>
                  <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>{providerDescriptor.summary}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <select value={config.provider.provider} onChange={(event) => updateConfig("provider", { ...config.provider, provider: event.target.value as SiteNewsletterConfig["provider"]["provider"] })} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                    <option value="custom">Custom</option>
                    <option value="brevo">Brevo</option>
                    <option value="mailchimp">Mailchimp</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="convertkit">ConvertKit</option>
                  </select>
                  <input value={config.provider.audienceLabel} onChange={(event) => updateConfig("provider", { ...config.provider, audienceLabel: event.target.value })} placeholder="Audience label" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input value={config.provider.listId} onChange={(event) => updateConfig("provider", { ...config.provider, listId: event.target.value })} placeholder="List ID / Audience ID" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                  <input value={config.provider.formAction} onChange={(event) => updateConfig("provider", { ...config.provider, formAction: event.target.value })} placeholder="Form action / endpoint" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <input value={config.provider.senderName} onChange={(event) => updateConfig("provider", { ...config.provider, senderName: event.target.value })} placeholder="Sender name" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                  <input value={config.provider.senderEmail} onChange={(event) => updateConfig("provider", { ...config.provider, senderEmail: event.target.value })} placeholder="Sender email" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                  <input value={config.provider.replyTo} onChange={(event) => updateConfig("provider", { ...config.provider, replyTo: event.target.value })} placeholder="Reply-to" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                </div>

                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                  <input type="checkbox" checked={config.provider.doubleOptIn} onChange={(event) => updateConfig("provider", { ...config.provider, doubleOptIn: event.target.checked })} />
                  Double opt-in attivo
                </label>

                <ul className="space-y-2">
                  {providerDescriptor.checklist.map((item) => (
                    <li key={item} className="text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
                      <span style={{ color: "var(--c-text-3)" }}>• </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Digest e placements</h3>
                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                  <input type="checkbox" checked={config.digest.enabled} onChange={(event) => updateConfig("digest", { ...config.digest, enabled: event.target.checked })} />
                  Digest attivo
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <select value={config.digest.frequency} onChange={(event) => updateConfig("digest", { ...config.digest, frequency: event.target.value as SiteNewsletterConfig["digest"]["frequency"] })} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input value={config.digest.sendTime} onChange={(event) => updateConfig("digest", { ...config.digest, sendTime: event.target.value })} placeholder="07:30" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                </div>
                <textarea value={config.digest.intro} onChange={(event) => updateConfig("digest", { ...config.digest, intro: event.target.value })} rows={3} placeholder="Intro digest" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <input value={digestCategories} onChange={(event) => setDigestCategories(event.target.value)} placeholder="Categorie incluse, separate da virgola" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
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

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Lead magnet e segmenti</h3>
                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                  <input type="checkbox" checked={config.leadMagnet.enabled} onChange={(event) => updateConfig("leadMagnet", { ...config.leadMagnet, enabled: event.target.checked })} />
                  Lead magnet attivo
                </label>
                <input value={config.leadMagnet.title} onChange={(event) => updateConfig("leadMagnet", { ...config.leadMagnet, title: event.target.value })} placeholder="Titolo bonus" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <textarea value={config.leadMagnet.description} onChange={(event) => updateConfig("leadMagnet", { ...config.leadMagnet, description: event.target.value })} rows={3} placeholder="Descrizione bonus editoriale" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <textarea value={segmentsJson} onChange={(event) => setSegmentsJson(event.target.value)} rows={10} className="w-full rounded-xl px-3 py-2 font-mono text-xs" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                <p className="text-xs leading-6" style={{ color: "var(--c-text-3)" }}>
                  I segmenti restano metadata editoriali e di handoff. Il list management vero deve stare nel provider.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border px-6 py-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>Composer campagna</h2>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
                  Qui costruisci il numero newsletter usando articoli gia` pubblicati del tenant. L&apos;HTML email viene generato lato server per evitare discrepanze tra editor e payload finale.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={!selectedCampaign || previewing}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                  style={{ border: "1px solid var(--c-border)", color: "var(--c-text-1)" }}
                >
                  <Eye className="h-4 w-4" />
                  {previewing ? "Generazione..." : "Genera anteprima"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCampaign}
                  disabled={!selectedCampaign}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                  style={{ border: "1px solid var(--c-border)", color: "var(--c-text-1)" }}
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </button>
              </div>
            </div>

            {!selectedCampaign ? (
              <div className="mt-6 rounded-2xl border px-4 py-5 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
                Crea una campagna per iniziare il composer.
              </div>
            ) : (
              <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr),380px]">
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={selectedCampaign.title} onChange={(event) => patchCampaign({ title: event.target.value })} placeholder="Titolo campagna" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                    <select value={selectedCampaign.status} onChange={(event) => patchCampaign({ status: event.target.value as NewsletterCampaignRecord["status"] })} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="sent">Sent</option>
                    </select>
                  </div>

                  <input value={selectedCampaign.subject} onChange={(event) => patchCampaign({ subject: event.target.value })} placeholder="Subject" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                  <input value={selectedCampaign.preheader} onChange={(event) => patchCampaign({ preheader: event.target.value })} placeholder="Preheader" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                  <textarea value={selectedCampaign.intro} onChange={(event) => patchCampaign({ intro: event.target.value })} rows={4} placeholder="Intro editoriale" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />

                  <div className="grid gap-3 md:grid-cols-3">
                    <select value={selectedCampaign.templateKey} onChange={(event) => patchCampaign({ templateKey: event.target.value as NewsletterCampaignRecord["templateKey"] })} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                      {moduleState.templates.map((template) => (
                        <option key={template.key} value={template.key}>{template.label}</option>
                      ))}
                    </select>
                    <select value={selectedCampaign.provider} onChange={(event) => patchCampaign({ provider: event.target.value as NewsletterCampaignRecord["provider"] })} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                      <option value="custom">Custom</option>
                      <option value="brevo">Brevo</option>
                      <option value="mailchimp">Mailchimp</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="convertkit">ConvertKit</option>
                    </select>
                    <input value={selectedCampaign.audienceLabel} onChange={(event) => patchCampaign({ audienceLabel: event.target.value })} placeholder="Audience label" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />
                  </div>

                  <input
                    type="datetime-local"
                    value={selectedCampaign.scheduledAt ? selectedCampaign.scheduledAt.slice(0, 16) : ""}
                    onChange={(event) => patchCampaign({ scheduledAt: event.target.value ? new Date(event.target.value).toISOString() : null })}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ border: "1px solid var(--c-border)", background: "transparent" }}
                  />

                  <textarea value={selectedCampaign.notes} onChange={(event) => patchCampaign({ notes: event.target.value })} rows={3} placeholder="Note operative per redazione o team tecnico" className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }} />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Articolo guida e selezione</h3>
                    <select value={selectedCampaign.featuredArticleId || ""} onChange={(event) => patchCampaign({ featuredArticleId: event.target.value || null })} className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--c-border)", background: "transparent" }}>
                      <option value="">Nessun articolo guida</option>
                      {articles.map((article) => (
                        <option key={article.id} value={article.id}>
                          {article.title}
                        </option>
                      ))}
                    </select>

                    <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                      {articles.length === 0 ? (
                        <div className="rounded-2xl border px-4 py-5 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
                          Nessun articolo pubblicato disponibile sul tenant.
                        </div>
                      ) : (
                        articles.map((article) => {
                          const checked = selectedCampaign.articleIds.includes(article.id);
                          return (
                            <label
                              key={article.id}
                              className="flex items-start gap-3 rounded-2xl border px-4 py-4"
                              style={{ borderColor: checked ? "var(--c-accent)" : "var(--c-border)" }}
                            >
                              <input type="checkbox" checked={checked} onChange={() => toggleArticleSelection(article.id)} className="mt-1" />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{article.title}</span>
                                <span className="mt-1 block text-xs" style={{ color: "var(--c-text-2)" }}>
                                  {article.categoryName || "Senza categoria"} · {formatDate(article.publishedAt)}
                                </span>
                                {article.summary ? (
                                  <span className="mt-2 block text-sm leading-6" style={{ color: "var(--c-text-2)" }}>{article.summary}</span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--c-border)" }}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Template corrente</div>
                    <div className="mt-2 text-base font-semibold" style={{ color: "var(--c-text-0)" }}>
                      {moduleState.templates.find((template) => template.key === selectedCampaign.templateKey)?.label || "Template"}
                    </div>
                    <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
                      {moduleState.templates.find((template) => template.key === selectedCampaign.templateKey)?.description || "Template redazionale della campagna."}
                    </p>
                  </div>

                  <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--c-border)" }}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Tassonomia disponibile</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <span key={category.id} className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--c-border)" }}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Stato campagna</div>
                    <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
                      <li><span style={{ color: "var(--c-text-3)" }}>• </span>Articoli selezionati: {selectedCampaign.articleIds.length}</li>
                      <li><span style={{ color: "var(--c-text-3)" }}>• </span>Articolo guida: {selectedCampaign.featuredArticleId ? "Presente" : "Non impostato"}</li>
                      <li><span style={{ color: "var(--c-text-3)" }}>• </span>Pianificazione: {formatDate(selectedCampaign.scheduledAt)}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border px-6 py-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>Anteprima e handoff tecnico</h2>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
                  L&apos;anteprima viene resa dal server, quindi quello che vedi qui e` gia` allineato con il pacchetto da passare al provider esterno.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={!selectedCampaign || previewing}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                style={{ border: "1px solid var(--c-border)", color: "var(--c-text-1)" }}
              >
                <RefreshCcw className="h-4 w-4" />
                Aggiorna
              </button>
            </div>

            {!previewState ? (
              <div className="mt-6 rounded-2xl border px-4 py-5 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
                Genera l&apos;anteprima per vedere HTML email, testo semplice e payload provider.
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--c-border)" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Anteprima HTML</div>
                  <div className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--c-border)", background: "#fff" }}>
                    <div className="max-h-[640px] overflow-auto p-2">
                      <div dangerouslySetInnerHTML={{ __html: previewState.preview.html }} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--c-border)" }}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Versione testo</div>
                    <pre className="mt-4 whitespace-pre-wrap text-xs leading-6" style={{ color: "var(--c-text-1)" }}>
                      {previewState.preview.text}
                    </pre>
                  </div>

                  <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--c-border)" }}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Payload provider</div>
                    <pre className="mt-4 overflow-auto whitespace-pre-wrap text-xs leading-6" style={{ color: "var(--c-text-1)" }}>
                      {JSON.stringify(previewState.handoff.payload, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--c-border)" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>Bridge tecnico</div>
                  <h3 className="mt-2 text-base font-semibold" style={{ color: "var(--c-text-0)" }}>{previewState.handoff.provider.label}</h3>
                  <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>{previewState.handoff.provider.summary}</p>
                  <ul className="mt-4 space-y-2 text-sm leading-7" style={{ color: "var(--c-text-2)" }}>
                    {previewState.handoff.recommendedFlow.map((item) => (
                      <li key={item}><span style={{ color: "var(--c-text-3)" }}>• </span>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
