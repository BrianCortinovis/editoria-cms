"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { requestPublishTrigger } from "@/lib/publish/client";
import { COMPLIANCE_SERVICE_DEFINITIONS } from "@/lib/legal/compliance-services";
import {
  getDefaultTenantComplianceServices,
  type TenantComplianceServiceKey,
  type TenantComplianceServices,
} from "@/lib/legal/compliance-model";
import { useAuthStore } from "@/lib/store";
import AIButton from "@/components/ai/AIButton";
import AIFieldHelper from "@/components/ai/AIFieldHelper";
import { ExternalLink, FileText, Globe, Image as ImageIcon, Save, Settings2 } from "lucide-react";

export function PlatformSiteSettings() {
  const { currentTenant, currentRole, setCurrentTenant } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [loadedSettings, setLoadedSettings] = useState<Record<string, unknown>>({});

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [googleAnalytics, setGoogleAnalytics] = useState("");
  const [googleTagManager, setGoogleTagManager] = useState("");
  const [googleAdsense, setGoogleAdsense] = useState("");
  const [googleSearchConsoleVerification, setGoogleSearchConsoleVerification] = useState("");
  const [googleNewsPublicationName, setGoogleNewsPublicationName] = useState("");
  const [seoRobotsEnabled, setSeoRobotsEnabled] = useState(true);
  const [seoRobotsAllow, setSeoRobotsAllow] = useState("/\n");
  const [seoRobotsDisallow, setSeoRobotsDisallow] = useState("/dashboard\n/admin\n/api\n/auth");
  const [seoExtraSitemaps, setSeoExtraSitemaps] = useState("");
  const [seoCrawlDelay, setSeoCrawlDelay] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [privacyEmail, setPrivacyEmail] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [dpoEmail, setDpoEmail] = useState("");
  const [complianceServices, setComplianceServices] = useState<TenantComplianceServices>(getDefaultTenantComplianceServices());

  const isAdmin = currentRole === "admin";

  useEffect(() => {
    if (!currentTenant) return;
    const tenant = currentTenant;
    const supabase = createClient();

    async function loadTenantSettings() {
      const { data, error } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", tenant.id)
        .single();

      if (error) {
        toast.error("Errore caricamento setup sito");
        return;
      }

      const settings = (data?.settings ?? {}) as Record<string, unknown>;
      const seoSettings =
        settings.seo && typeof settings.seo === "object"
          ? (settings.seo as Record<string, unknown>)
          : {};
      const robotsSettings =
        seoSettings.robots && typeof seoSettings.robots === "object"
          ? (seoSettings.robots as Record<string, unknown>)
          : {};
      const compliance =
        settings.compliance && typeof settings.compliance === "object"
          ? (settings.compliance as Record<string, unknown>)
          : {};
      const contacts =
        compliance.contacts && typeof compliance.contacts === "object"
          ? (compliance.contacts as Record<string, unknown>)
          : {};
      const baseServices = getDefaultTenantComplianceServices();
      const storedServices =
        compliance.services && typeof compliance.services === "object"
          ? (compliance.services as Record<string, unknown>)
          : {};
      const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;
      setLoadedSettings(settings);
      setName(tenant.name);
      setSlug(tenant.slug);
      setDomain(tenant.domain ?? "");
      setLogoUrl(tenant.logo_url ?? "");
      setSiteDescription(typeof settings.site_description === "string" ? settings.site_description : "");
      setGoogleAnalytics(typeof settings.google_analytics === "string" ? settings.google_analytics : "");
      setGoogleTagManager(typeof settings.google_tag_manager === "string" ? settings.google_tag_manager : "");
      setGoogleAdsense(typeof settings.google_adsense === "string" ? settings.google_adsense : "");
      setGoogleSearchConsoleVerification(typeof settings.google_search_console_verification === "string" ? settings.google_search_console_verification : "");
      setGoogleNewsPublicationName(typeof settings.google_news_publication_name === "string" ? settings.google_news_publication_name : "");
      setSeoRobotsEnabled(typeof robotsSettings.enabled === "boolean" ? robotsSettings.enabled : true);
      setSeoRobotsAllow(
        Array.isArray(robotsSettings.allow)
          ? robotsSettings.allow.map((entry) => String(entry || "")).filter(Boolean).join("\n")
          : "/"
      );
      setSeoRobotsDisallow(
        Array.isArray(robotsSettings.disallow)
          ? robotsSettings.disallow.map((entry) => String(entry || "")).filter(Boolean).join("\n")
          : "/dashboard\n/admin\n/api\n/auth"
      );
      setSeoExtraSitemaps(
        Array.isArray(robotsSettings.extraSitemaps)
          ? robotsSettings.extraSitemaps.map((entry) => String(entry || "")).filter(Boolean).join("\n")
          : ""
      );
      setSeoCrawlDelay(
        typeof robotsSettings.crawlDelay === "number" ? String(robotsSettings.crawlDelay) : ""
      );
      setCompanyName(typeof contacts.companyName === "string" ? contacts.companyName : "");
      setContactEmail(typeof contacts.contactEmail === "string" ? contacts.contactEmail : "");
      setPrivacyEmail(typeof contacts.privacyEmail === "string" ? contacts.privacyEmail : "");
      setLegalAddress(typeof contacts.legalAddress === "string" ? contacts.legalAddress : "");
      setVatNumber(typeof contacts.vatNumber === "string" ? contacts.vatNumber : "");
      setDpoEmail(typeof contacts.dpoEmail === "string" ? contacts.dpoEmail : "");
      setComplianceServices({
        contact_forms: {
          ...baseServices.contact_forms,
          ...(typeof storedServices.contact_forms === "object" ? (storedServices.contact_forms as typeof baseServices.contact_forms) : {}),
        },
        newsletter: {
          ...baseServices.newsletter,
          ...(typeof storedServices.newsletter === "object" ? (storedServices.newsletter as typeof baseServices.newsletter) : {}),
        },
        comments: {
          ...baseServices.comments,
          ...(typeof storedServices.comments === "object" ? (storedServices.comments as typeof baseServices.comments) : {}),
        },
        google_analytics: {
          ...baseServices.google_analytics,
          ...(typeof storedServices.google_analytics === "object" ? (storedServices.google_analytics as typeof baseServices.google_analytics) : {}),
          enabled:
            (typeof storedServices.google_analytics === "object" &&
              Boolean((storedServices.google_analytics as Record<string, unknown>).enabled)) ||
            hasText(settings.google_analytics),
        },
        google_tag_manager: {
          ...baseServices.google_tag_manager,
          ...(typeof storedServices.google_tag_manager === "object" ? (storedServices.google_tag_manager as typeof baseServices.google_tag_manager) : {}),
          enabled:
            (typeof storedServices.google_tag_manager === "object" &&
              Boolean((storedServices.google_tag_manager as Record<string, unknown>).enabled)) ||
            hasText(settings.google_tag_manager),
        },
        google_adsense: {
          ...baseServices.google_adsense,
          ...(typeof storedServices.google_adsense === "object" ? (storedServices.google_adsense as typeof baseServices.google_adsense) : {}),
          enabled:
            (typeof storedServices.google_adsense === "object" &&
              Boolean((storedServices.google_adsense as Record<string, unknown>).enabled)) ||
            hasText(settings.google_adsense),
        },
        youtube_embeds: {
          ...baseServices.youtube_embeds,
          ...(typeof storedServices.youtube_embeds === "object" ? (storedServices.youtube_embeds as typeof baseServices.youtube_embeds) : {}),
        },
        social_embeds: {
          ...baseServices.social_embeds,
          ...(typeof storedServices.social_embeds === "object" ? (storedServices.social_embeds as typeof baseServices.social_embeds) : {}),
        },
        payments: {
          ...baseServices.payments,
          ...(typeof storedServices.payments === "object" ? (storedServices.payments as typeof baseServices.payments) : {}),
        },
      });
    }

    void loadTenantSettings();
  }, [currentTenant]);

  const handleSave = async () => {
    if (!currentTenant) return;
    setSaving(true);
    const supabase = createClient();

    const currentCompliance =
      loadedSettings.compliance && typeof loadedSettings.compliance === "object"
        ? (loadedSettings.compliance as Record<string, unknown>)
        : {};
    const currentComplianceContacts =
      currentCompliance.contacts && typeof currentCompliance.contacts === "object"
        ? (currentCompliance.contacts as Record<string, unknown>)
        : {};
    const currentSeo =
      loadedSettings.seo && typeof loadedSettings.seo === "object"
        ? (loadedSettings.seo as Record<string, unknown>)
        : {};

    const parseLines = (value: string) =>
      value
        .split(/\r?\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean);

    const nextSettings = {
      ...loadedSettings,
      site_description: siteDescription,
      google_analytics: googleAnalytics,
      google_tag_manager: googleTagManager,
      google_adsense: googleAdsense,
      google_search_console_verification: googleSearchConsoleVerification,
      google_news_publication_name: googleNewsPublicationName,
      seo: {
        ...currentSeo,
        robots: {
          enabled: seoRobotsEnabled,
          allow: parseLines(seoRobotsAllow),
          disallow: parseLines(seoRobotsDisallow),
          extraSitemaps: parseLines(seoExtraSitemaps),
          crawlDelay: seoCrawlDelay.trim() ? Number(seoCrawlDelay) : null,
        },
      },
      compliance: {
        ...currentCompliance,
        contacts: {
          ...currentComplianceContacts,
          companyName,
          contactEmail,
          privacyEmail,
          legalAddress,
          vatNumber,
          dpoEmail,
        },
        services: complianceServices,
      },
    };

    const { error } = await supabase
      .from("tenants")
      .update({
        name,
        slug,
        domain: domain || null,
        logo_url: logoUrl || null,
        settings: nextSettings,
      })
      .eq("id", currentTenant.id);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    try {
      await requestPublishTrigger(currentTenant.id, [{ type: "settings" }, { type: "menu" }]);
    } catch (publishError) {
      const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
      toast.error(`Configurazione salvata, ma il publish non e' stato aggiornato: ${publishMessage}`);
    }

    setLoadedSettings(nextSettings);
    setCurrentTenant(
      {
        ...currentTenant,
        name,
        slug,
        domain: domain || null,
        logo_url: logoUrl || null,
        theme_config: currentTenant.theme_config ?? {},
        settings: nextSettings,
      },
      currentRole
    );

    toast.success("Setup sito salvato");
    setSaving(false);
  };

  if (!currentTenant) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Seleziona un tenant attivo per gestire identità, dominio e analytics.
      </div>
    );
  }

  const updateComplianceService = (
    key: TenantComplianceServiceKey,
    field: "enabled" | "providerName" | "notes",
    value: boolean | string
  ) => {
    setComplianceServices((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
      },
    }));
  };

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Solo gli Admin del tenant possono modificare configurazione iniziale, SEO e analytics nel profilo platform.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
            Tenant Attivo
          </p>
          <h3 className="mt-2 text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
            Identità, dominio, SEO e analytics
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
            Questa è la configurazione iniziale del sito. Non deve stare nel CMS operativo perché definisce assetto, tracking e parametri strutturali del tenant.
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--c-text-2)" }}>
            Tenant corrente: <strong style={{ color: "var(--c-text-0)" }}>{currentTenant.name}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ background: "var(--c-accent)" }}
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvataggio..." : "Salva setup sito"}
        </button>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
          <h4 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
            Identità editoriale
          </h4>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Nome testata
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Dominio pubblico
            </label>
            <div className="relative mt-1">
              <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--c-text-3)" }} />
              <input
                type="text"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="es: www.example.com"
                className="w-full rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Logo URL
            </label>
            <div className="relative mt-1">
              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--c-text-3)" }} />
              <input
                type="url"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
              />
            </div>
          </div>
        </div>

        {logoUrl ? (
          <div className="mt-4 flex items-center gap-4 border-t pt-4" style={{ borderColor: "var(--c-border)" }}>
            <div className="relative h-14 w-32 shrink-0">
              <Image src={logoUrl} alt="Logo sito" fill className="object-contain object-left" unoptimized />
            </div>
            <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
              Anteprima logo tenant
            </p>
          </div>
        ) : null}

        <div className="mt-4 border-l pl-4" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--c-text-0)" }}>
            <Settings2 className="h-4 w-4" />
            Tema e layout
          </div>
          <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
            Restano gestiti nell’editor desktop e nel flusso publish, non nella config operativa del CMS.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
              <h4 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                SEO e analytics iniziali
              </h4>
            </div>
            <p className="mt-2 text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
              Parametri base del tenant per tracking, Search Console, Google News e descrizione editoriale.
            </p>
          </div>
          <AIButton
            compact
            actions={[
              {
                id: "audit-seo-analytics",
                label: "Audit SEO & Analytics",
                prompt:
                  "Analizza la configurazione SEO e analytics del sito di una testata locale italiana. Evidenzia rischi, campi mancanti, priorita` operative e prossime azioni basandoti su questi dati: {context}",
              },
              {
                id: "tracking-plan",
                label: "Piano tracciamenti",
                prompt:
                  "Prepara un piano pratico per tracking, GA4, Search Console, Google News, sitemap e Open Graph per questo sito CMS. Restituisci checklist operativa e controlli da fare: {context}",
              },
            ]}
            contextData={JSON.stringify(
              {
                tenant: { name, slug, domain },
                settings: {
                  siteDescription,
                  googleAnalytics,
                  googleTagManager,
                  googleAdsense,
                  googleSearchConsoleVerification,
                  googleNewsPublicationName,
                },
              },
              null,
              2
            )}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Descrizione sito
            </label>
            <AIFieldHelper
              compact
              fieldName="Descrizione sito"
              fieldType="description"
              fieldValue={siteDescription}
              context={{
                siteName: name,
                siteSlug: slug,
                domain,
                googleAnalytics,
                googleTagManager,
                googleAdsense,
                googleSearchConsoleVerification,
                googleNewsPublicationName,
              }}
              onGenerate={setSiteDescription}
            />
          </div>
          <textarea
            value={siteDescription}
            onChange={(event) => setSiteDescription(event.target.value)}
            rows={4}
            placeholder="Descrizione editoriale e SEO del sito..."
            className="mt-1 w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{ border: "1px solid var(--c-border)" }}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Google Analytics ID
            </label>
            <input
              type="text"
              value={googleAnalytics}
              onChange={(event) => setGoogleAnalytics(event.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Google Tag Manager ID
            </label>
            <input
              type="text"
              value={googleTagManager}
              onChange={(event) => setGoogleTagManager(event.target.value)}
              placeholder="GTM-XXXXXXX"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Google AdSense Publisher ID
            </label>
            <input
              type="text"
              value={googleAdsense}
              onChange={(event) => setGoogleAdsense(event.target.value)}
              placeholder="ca-pub-XXXXXXXXXX"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Google Search Console verification
            </label>
            <input
              type="text"
              value={googleSearchConsoleVerification}
              onChange={(event) => setGoogleSearchConsoleVerification(event.target.value)}
              placeholder="meta verification token"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Nome pubblicazione Google News
            </label>
            <input
              type="text"
              value={googleNewsPublicationName}
              onChange={(event) => setGoogleNewsPublicationName(event.target.value)}
              placeholder="Val Brembana Web"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                SEO tecnico e crawl
              </p>
              <p className="mt-1 text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
                Robots.txt del tenant, sitemap aggiuntive e crawl delay. Utile quando lavori con SEO specialist e ambienti enterprise.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
              <input type="checkbox" checked={seoRobotsEnabled} onChange={(event) => setSeoRobotsEnabled(event.target.checked)} />
              Indicizzazione sito attiva
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                Robots allow
              </label>
              <textarea
                value={seoRobotsAllow}
                onChange={(event) => setSeoRobotsAllow(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                Robots disallow
              </label>
              <textarea
                value={seoRobotsDisallow}
                onChange={(event) => setSeoRobotsDisallow(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                Sitemap aggiuntive
              </label>
              <textarea
                value={seoExtraSitemaps}
                onChange={(event) => setSeoExtraSitemaps(event.target.value)}
                rows={3}
                placeholder="https://example.com/news-sitemap.xml"
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                Crawl delay
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={seoCrawlDelay}
                onChange={(event) => setSeoCrawlDelay(event.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
              <h4 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                Dati legali del tenant
              </h4>
            </div>
            <p className="mt-2 text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
              Questi dati vengono usati nei documenti GDPR centralizzati per personalizzare automaticamente privacy policy, cookie policy e termini del sito.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Ragione sociale / Titolare
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Editoria Locale S.r.l."
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Email contatti
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="info@example.com"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Email privacy
            </label>
            <input
              type="email"
              value={privacyEmail}
              onChange={(event) => setPrivacyEmail(event.target.value)}
              placeholder="privacy@example.com"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Email DPO / referente
            </label>
            <input
              type="email"
              value={dpoEmail}
              onChange={(event) => setDpoEmail(event.target.value)}
              placeholder="dpo@example.com"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Indirizzo legale
            </label>
            <textarea
              value={legalAddress}
              onChange={(event) => setLegalAddress(event.target.value)}
              rows={3}
              placeholder="Via Roma 1, 20100 Milano (MI)"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              P.IVA / Codice fiscale
            </label>
            <input
              type="text"
              value={vatNumber}
              onChange={(event) => setVatNumber(event.target.value)}
              placeholder="IT12345678901"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
              <h4 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                Servizi attivi per policy automatiche
              </h4>
            </div>
            <p className="mt-2 text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
              Qui dichiari quali moduli, tracker e fornitori sono realmente attivi su questo tenant. Privacy policy e cookie policy useranno questi dati per generare sezioni automatiche in stile Iubenda.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {COMPLIANCE_SERVICE_DEFINITIONS.map((service) => {
            const current = complianceServices[service.key];
            return (
              <div
                key={service.key}
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--c-border)" }}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                        {service.label}
                      </p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                        {service.cookieCategory}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
                      {service.description}
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                    <input
                      type="checkbox"
                      checked={current.enabled}
                      onChange={(event) => updateComplianceService(service.key, "enabled", event.target.checked)}
                    />
                    Attivo
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                      Provider / piattaforma
                    </label>
                    <input
                      type="text"
                      value={current.providerName}
                      onChange={(event) => updateComplianceService(service.key, "providerName", event.target.value)}
                      className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                      Note operative
                    </label>
                    <input
                      type="text"
                      value={current.notes}
                      onChange={(event) => updateComplianceService(service.key, "notes", event.target.value)}
                      placeholder="Es: IP anonimizzato, embed bloccato fino al consenso, provider UE..."
                      className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                      style={{ border: "1px solid var(--c-border)" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
