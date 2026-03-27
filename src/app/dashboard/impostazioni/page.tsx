"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { ExternalLink, FileText, Globe, Image as ImageIcon, Loader2, Save, Settings2, Shield, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { requestPublishTrigger } from "@/lib/publish/client";
import { useAuthStore } from "@/lib/store";

type SettingsTab = "identity" | "social" | "seo" | "security";

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Globe }> = [
  { id: "identity", label: "Identita`", icon: Globe },
  { id: "social", label: "Social", icon: Share2 },
  { id: "seo", label: "SEO & Analytics", icon: FileText },
  { id: "security", label: "Sicurezza", icon: Shield },
];

export default function ImpostazioniPage() {
  const { currentTenant, currentRole, setCurrentTenant } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("identity");
  const [loadedSettings, setLoadedSettings] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [youtube, setYoutube] = useState("");

  const [siteDescription, setSiteDescription] = useState("");
  const [googleAnalytics, setGoogleAnalytics] = useState("");
  const [googleAdsense, setGoogleAdsense] = useState("");

  const isAdmin = currentRole === "super_admin";

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
        toast.error("Errore caricamento impostazioni");
        return;
      }

      setName(tenant.name);
      setSlug(tenant.slug);
      setDomain(tenant.domain ?? "");
      setLogoUrl(tenant.logo_url ?? "");

      const settings = (data?.settings ?? {}) as Record<string, string>;
      setLoadedSettings(settings);
      setFacebook(settings.facebook ?? "");
      setInstagram(settings.instagram ?? "");
      setTwitter(settings.twitter ?? "");
      setTelegram(settings.telegram ?? "");
      setYoutube(settings.youtube ?? "");
      setSiteDescription(settings.site_description ?? "");
      setGoogleAnalytics(settings.google_analytics ?? "");
      setGoogleAdsense(settings.google_adsense ?? "");
    }

    void loadTenantSettings();
  }, [currentTenant]);

  const handleSave = async () => {
    if (!currentTenant) return;

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("tenants")
      .update({
        name,
        slug,
        domain: domain || null,
        logo_url: logoUrl || null,
        settings: {
          ...loadedSettings,
          facebook,
          instagram,
          twitter,
          telegram,
          youtube,
          site_description: siteDescription,
          google_analytics: googleAnalytics,
          google_adsense: googleAdsense,
        },
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
      toast.error(`Impostazioni salvate, ma il publish non e' stato aggiornato: ${publishMessage}`);
    }

    setCurrentTenant(
      {
        ...currentTenant,
        name,
        slug,
        domain: domain || null,
        logo_url: logoUrl || null,
        theme_config: currentTenant.theme_config ?? {},
        settings: {
          ...loadedSettings,
          facebook,
          instagram,
          twitter,
          telegram,
          youtube,
          site_description: siteDescription,
          google_analytics: googleAnalytics,
          google_adsense: googleAdsense,
        },
      },
      currentRole
    );

    toast.success("Impostazioni salvate");
    setSaving(false);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl py-20 text-center">
        <Shield className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--c-text-3)" }} />
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
          Solo i Super Admin possono modificare le impostazioni del sito.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8 border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--c-text-3)" }}>
              Config CMS
            </div>
            <h1 className="mt-2 text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              Configurazione sito e pubblicazione
            </h1>
          </div>

          <Link
            href="/dashboard/desktop-bridge"
            className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--c-accent)" }}
          >
            Apri Desktop Bridge
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b" style={{ borderColor: "var(--c-border)" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition"
              style={
                isActive
                  ? { borderColor: "var(--c-accent)", color: "var(--c-accent)" }
                  : { borderColor: "transparent", color: "var(--c-text-2)" }
              }
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="space-y-6">
        {activeTab === "identity" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
                Identita` editoriale
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="flex items-center gap-4 border-b pb-5" style={{ borderColor: "var(--c-border)" }}>
                <div className="relative h-14 w-32 shrink-0">
                  <Image src={logoUrl} alt="Logo sito" fill className="object-contain object-left" unoptimized />
                </div>
                <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
                  Anteprima logo
                </p>
              </div>
            ) : null}

            <div className="border-l pl-4" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--c-text-0)" }}>
                <Settings2 className="h-4 w-4" />
                Tema e layout
              </div>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>Gestiti nell&apos;editor desktop.</p>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
                Profili social
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Facebook", value: facebook, setter: setFacebook, placeholder: "https://facebook.com/..." },
                { label: "Instagram", value: instagram, setter: setInstagram, placeholder: "https://instagram.com/..." },
                { label: "X (Twitter)", value: twitter, setter: setTwitter, placeholder: "https://x.com/..." },
                { label: "Telegram", value: telegram, setter: setTelegram, placeholder: "https://t.me/..." },
                { label: "YouTube", value: youtube, setter: setYoutube, placeholder: "https://youtube.com/..." },
              ].map((item) => (
                <div key={item.label}>
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                    {item.label}
                  </label>
                  <input
                    type="url"
                    value={item.value}
                    onChange={(event) => item.setter(event.target.value)}
                    placeholder={item.placeholder}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
                SEO e analytics
              </h2>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                Descrizione sito
              </label>
              <textarea
                value={siteDescription}
                onChange={(event) => setSiteDescription(event.target.value)}
                rows={4}
                placeholder="Descrizione editoriale e SEO del sito..."
                className="mt-1 w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
                Sicurezza
              </h2>
            </div>

            <div className="space-y-4 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
              <p>Protezione dati attiva.</p>
              <p>Chiavi sensibili non esposte.</p>
              <p>Accessi controllati.</p>
              <p>Pubblicazione protetta.</p>
            </div>
          </div>
        )}
      </section>

      {activeTab !== "security" ? (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: "var(--c-accent)" }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "var(--c-accent-hover)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "var(--c-accent)";
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salva impostazioni
          </button>
        </div>
      ) : null}
    </div>
  );
}
