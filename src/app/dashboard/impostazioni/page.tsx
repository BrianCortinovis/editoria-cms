"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  Save,
  Globe,
  Palette,
  Share2,
  FileText,
  Shield,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

export default function ImpostazioniPage() {
  const { currentTenant, currentRole, setCurrentTenant } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // General
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Theme
  const [primaryColor, setPrimaryColor] = useState("#8B0000");
  const [fontSerif, setFontSerif] = useState("Playfair Display");
  const [fontSans, setFontSans] = useState("Inter");

  // Social
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [youtube, setYoutube] = useState("");

  // SEO
  const [siteDescription, setSiteDescription] = useState("");
  const [googleAnalytics, setGoogleAnalytics] = useState("");
  const [googleAdsense, setGoogleAdsense] = useState("");

  const isAdmin = currentRole === "super_admin";

  useEffect(() => {
    if (!currentTenant) return;
    setName(currentTenant.name);
    setSlug(currentTenant.slug);
    setDomain(currentTenant.domain ?? "");
    setLogoUrl(currentTenant.logo_url ?? "");

    const theme = (currentTenant.theme_config ?? {}) as Record<string, string>;
    setPrimaryColor(theme.primary_color ?? "#8B0000");
    setFontSerif(theme.font_serif ?? "Playfair Display");
    setFontSans(theme.font_sans ?? "Inter");

    const settings = (currentTenant.settings ?? {}) as Record<string, string>;
    setFacebook(settings.facebook ?? "");
    setInstagram(settings.instagram ?? "");
    setTwitter(settings.twitter ?? "");
    setTelegram(settings.telegram ?? "");
    setYoutube(settings.youtube ?? "");
    setSiteDescription(settings.site_description ?? "");
    setGoogleAnalytics(settings.google_analytics ?? "");
    setGoogleAdsense(settings.google_adsense ?? "");
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
        theme_config: {
          primary_color: primaryColor,
          font_serif: fontSerif,
          font_sans: fontSans,
        },
        settings: {
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
    } else {
      toast.success("Impostazioni salvate");
      // Update local store
      setCurrentTenant(
        {
          ...currentTenant,
          name,
          slug,
          domain: domain || null,
          logo_url: logoUrl || null,
          theme_config: { primary_color: primaryColor, font_serif: fontSerif, font_sans: fontSans },
          settings: { facebook, instagram, twitter, telegram, youtube, site_description: siteDescription, google_analytics: googleAnalytics, google_adsense: googleAdsense },
        },
        currentRole
      );
    }
    setSaving(false);
  };

  const tabs = [
    { id: "general", label: "Generale", icon: Globe },
    { id: "theme", label: "Tema", icon: Palette },
    { id: "social", label: "Social", icon: Share2 },
    { id: "seo", label: "SEO & Analytics", icon: FileText },
    { id: "security", label: "Sicurezza", icon: Shield },
  ];

  if (!isAdmin) {
    return (
      <div className="max-w-2xl text-center py-20">
        <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Solo i Super Admin possono modificare le impostazioni</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto" style={{ borderBottom: "1px solid var(--c-border)" }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap"
              style={activeTab === tab.id
                ? { borderColor: "var(--c-accent)", color: "var(--c-accent)" }
                : { borderColor: "transparent", color: "var(--c-text-2)" }}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg p-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {/* General */}
        {activeTab === "general" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Informazioni Testata</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Nome testata *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ border: "1px solid var(--c-border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Slug</label>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Dominio sito pubblico</label>
                <div className="relative mt-1">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                  <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="es: www.example.com"
                    className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Logo URL</label>
                <div className="relative mt-1">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                  <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png"
                    className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }} />
                </div>
              </div>
            </div>
            {logoUrl && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
                <img src={logoUrl} alt="Logo" className="h-12 w-auto" />
                <span className="text-xs" style={{ color: "var(--c-text-2)" }}>Preview logo</span>
              </div>
            )}
          </div>
        )}

        {/* Theme */}
        {activeTab === "theme" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Personalizzazione Tema</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Colore primario</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer" style={{ border: "1px solid var(--c-border)" }} />
                  <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Font titoli (Serif)</label>
                <select value={fontSerif} onChange={e => setFontSerif(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                  <option>Playfair Display</option>
                  <option>Merriweather</option>
                  <option>Lora</option>
                  <option>Libre Baskerville</option>
                  <option>Cormorant Garamond</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Font corpo (Sans)</label>
                <select value={fontSans} onChange={e => setFontSans(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                  <option>Inter</option>
                  <option>Open Sans</option>
                  <option>Source Sans 3</option>
                  <option>Nunito</option>
                  <option>DM Sans</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ border: "1px solid var(--c-border)", borderLeftColor: primaryColor, borderLeftWidth: 4 }}>
              <p className="text-xs mb-2" style={{ color: "var(--c-text-3)" }}>Anteprima</p>
              <p className="text-xl font-bold" style={{ fontFamily: fontSerif }}>Titolo di esempio della testata</p>
              <p className="text-sm mt-1" style={{ fontFamily: fontSans, color: "var(--c-text-2)" }}>Questo è un esempio di come apparirà il testo del corpo degli articoli.</p>
            </div>
          </div>
        )}

        {/* Social */}
        {activeTab === "social" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Profili Social</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Facebook", value: facebook, set: setFacebook, placeholder: "https://facebook.com/..." },
                { label: "Instagram", value: instagram, set: setInstagram, placeholder: "https://instagram.com/..." },
                { label: "X (Twitter)", value: twitter, set: setTwitter, placeholder: "https://x.com/..." },
                { label: "Telegram", value: telegram, set: setTelegram, placeholder: "https://t.me/..." },
                { label: "YouTube", value: youtube, set: setYoutube, placeholder: "https://youtube.com/..." },
              ].map(s => (
                <div key={s.label}>
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>{s.label}</label>
                  <input type="url" value={s.value} onChange={e => s.set(e.target.value)} placeholder={s.placeholder}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO */}
        {activeTab === "seo" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>SEO & Analytics</h3>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Descrizione sito (meta description globale)</label>
              <textarea value={siteDescription} onChange={e => setSiteDescription(e.target.value)} rows={3}
                placeholder="Descrizione del sito per i motori di ricerca..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 resize-none"
                style={{ border: "1px solid var(--c-border)" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Google Analytics ID</label>
                <input type="text" value={googleAnalytics} onChange={e => setGoogleAnalytics(e.target.value)} placeholder="G-XXXXXXXXXX"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Google AdSense Publisher ID</label>
                <input type="text" value={googleAdsense} onChange={e => setGoogleAdsense(e.target.value)} placeholder="ca-pub-XXXXXXXXXX"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }} />
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === "security" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Sicurezza</h3>
            <div className="p-4 rounded-lg" style={{ background: "rgba(var(--c-success-rgb, 16,185,129), 0.1)", border: "1px solid var(--c-success)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--c-success)" }}>Row Level Security attiva</p>
              <p className="text-xs" style={{ color: "var(--c-success)" }}>Tutti i dati sono isolati per testata tramite RLS di Supabase. Ogni query è filtrata automaticamente per tenant_id.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "var(--c-accent-soft)", border: "1px solid var(--c-accent)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--c-accent)" }}>Autenticazione Magic Link</p>
              <p className="text-xs" style={{ color: "var(--c-accent)" }}>Gli utenti accedono tramite link email sicuro. Nessuna password viene salvata nel sistema.</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--c-text-0)" }}>5 livelli di ruoli</p>
              <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Super Admin, Caporedattore, Redattore, Collaboratore, Commerciale — ogni ruolo ha permessi specifici definiti a livello database.</p>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      {activeTab !== "security" && (
        <div className="flex justify-end mt-6">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            style={{ background: "var(--c-accent)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva Impostazioni
          </button>
        </div>
      )}
    </div>
  );
}
