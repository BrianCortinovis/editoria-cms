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
        <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Solo i Super Admin possono modificare le impostazioni</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#8B0000] text-[#8B0000]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* General */}
        {activeTab === "general" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Informazioni Testata</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nome testata *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Slug</label>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Dominio sito pubblico</label>
                <div className="relative mt-1">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="www.valbrembana.web"
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Logo URL</label>
                <div className="relative mt-1">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
                </div>
              </div>
            </div>
            {logoUrl && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img src={logoUrl} alt="Logo" className="h-12 w-auto" />
                <span className="text-xs text-gray-500">Preview logo</span>
              </div>
            )}
          </div>
        )}

        {/* Theme */}
        {activeTab === "theme" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Personalizzazione Tema</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Colore primario</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                  <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Font titoli (Serif)</label>
                <select value={fontSerif} onChange={e => setFontSerif(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]">
                  <option>Playfair Display</option>
                  <option>Merriweather</option>
                  <option>Lora</option>
                  <option>Libre Baskerville</option>
                  <option>Cormorant Garamond</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Font corpo (Sans)</label>
                <select value={fontSans} onChange={e => setFontSans(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]">
                  <option>Inter</option>
                  <option>Open Sans</option>
                  <option>Source Sans 3</option>
                  <option>Nunito</option>
                  <option>DM Sans</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-gray-200" style={{ borderLeftColor: primaryColor, borderLeftWidth: 4 }}>
              <p className="text-xs text-gray-400 mb-2">Anteprima</p>
              <p className="text-xl font-bold" style={{ fontFamily: fontSerif }}>Titolo di esempio della testata</p>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: fontSans }}>Questo è un esempio di come apparirà il testo del corpo degli articoli.</p>
            </div>
          </div>
        )}

        {/* Social */}
        {activeTab === "social" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Profili Social</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Facebook", value: facebook, set: setFacebook, placeholder: "https://facebook.com/..." },
                { label: "Instagram", value: instagram, set: setInstagram, placeholder: "https://instagram.com/..." },
                { label: "X (Twitter)", value: twitter, set: setTwitter, placeholder: "https://x.com/..." },
                { label: "Telegram", value: telegram, set: setTelegram, placeholder: "https://t.me/..." },
                { label: "YouTube", value: youtube, set: setYoutube, placeholder: "https://youtube.com/..." },
              ].map(s => (
                <div key={s.label}>
                  <label className="text-xs text-gray-500 font-medium">{s.label}</label>
                  <input type="url" value={s.value} onChange={e => s.set(e.target.value)} placeholder={s.placeholder}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO */}
        {activeTab === "seo" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">SEO & Analytics</h3>
            <div>
              <label className="text-xs text-gray-500 font-medium">Descrizione sito (meta description globale)</label>
              <textarea value={siteDescription} onChange={e => setSiteDescription(e.target.value)} rows={3}
                placeholder="Descrizione del sito per i motori di ricerca..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000] resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Google Analytics ID</label>
                <input type="text" value={googleAnalytics} onChange={e => setGoogleAnalytics(e.target.value)} placeholder="G-XXXXXXXXXX"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Google AdSense Publisher ID</label>
                <input type="text" value={googleAdsense} onChange={e => setGoogleAdsense(e.target.value)} placeholder="ca-pub-XXXXXXXXXX"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B0000]" />
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === "security" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sicurezza</h3>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-1">Row Level Security attiva</p>
              <p className="text-xs text-green-600">Tutti i dati sono isolati per testata tramite RLS di Supabase. Ogni query è filtrata automaticamente per tenant_id.</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">Autenticazione Magic Link</p>
              <p className="text-xs text-blue-600">Gli utenti accedono tramite link email sicuro. Nessuna password viene salvata nel sistema.</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-medium text-purple-800 mb-1">5 livelli di ruoli</p>
              <p className="text-xs text-purple-600">Super Admin, Caporedattore, Redattore, Collaboratore, Commerciale — ogni ruolo ha permessi specifici definiti a livello database.</p>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      {activeTab !== "security" && (
        <div className="flex justify-end mt-6">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva Impostazioni
          </button>
        </div>
      )}
    </div>
  );
}
