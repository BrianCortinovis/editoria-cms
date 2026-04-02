"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { requestPublishTrigger } from "@/lib/publish/client";
import { useAuthStore } from "@/lib/store";
import AIButton from "@/components/ai/AIButton";
import AIFieldHelper from "@/components/ai/AIFieldHelper";
import { ExternalLink, FileText, Globe, Image as ImageIcon, Save, Settings2 } from "lucide-react";

export function PlatformSiteSettings() {
  const { currentTenant, currentRole, setCurrentTenant } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [loadedSettings, setLoadedSettings] = useState<Record<string, string>>({});

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

      const settings = (data?.settings ?? {}) as Record<string, string>;
      setLoadedSettings(settings);
      setName(tenant.name);
      setSlug(tenant.slug);
      setDomain(tenant.domain ?? "");
      setLogoUrl(tenant.logo_url ?? "");
      setSiteDescription(settings.site_description ?? "");
      setGoogleAnalytics(settings.google_analytics ?? "");
      setGoogleTagManager(settings.google_tag_manager ?? "");
      setGoogleAdsense(settings.google_adsense ?? "");
      setGoogleSearchConsoleVerification(settings.google_search_console_verification ?? "");
      setGoogleNewsPublicationName(settings.google_news_publication_name ?? "");
    }

    void loadTenantSettings();
  }, [currentTenant]);

  const handleSave = async () => {
    if (!currentTenant) return;
    setSaving(true);
    const supabase = createClient();

    const nextSettings = {
      ...loadedSettings,
      site_description: siteDescription,
      google_analytics: googleAnalytics,
      google_tag_manager: googleTagManager,
      google_adsense: googleAdsense,
      google_search_console_verification: googleSearchConsoleVerification,
      google_news_publication_name: googleNewsPublicationName,
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
      </div>
    </section>
  );
}
