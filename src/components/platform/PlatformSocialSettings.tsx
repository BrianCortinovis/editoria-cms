"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { requestPublishTrigger } from "@/lib/publish/client";
import { useAuthStore } from "@/lib/store";
import {
  SOCIAL_PLATFORMS,
  normalizeSocialAutoConfig,
  type SocialAutoConfig,
  type SocialPlatformKey,
} from "@/lib/social/platforms";
import { Link2, Save, Settings2, ShieldCheck } from "lucide-react";

export function PlatformSocialSettings() {
  const { currentTenant, currentRole } = useAuthStore();
  const [config, setConfig] = useState<SocialAutoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canManage = currentRole === "admin";

  useEffect(() => {
    if (!currentTenant || !canManage) {
      setLoading(false);
      return;
    }
    const tenantId = currentTenant.id;

    async function load() {
      try {
        const response = await fetch(`/api/cms/social/channels?tenant_id=${encodeURIComponent(tenantId)}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || "Impossibile caricare la configurazione social");
        }
        setConfig(normalizeSocialAutoConfig(payload?.config));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Errore caricamento social");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [canManage, currentTenant]);

  const updateGlobal = <K extends keyof SocialAutoConfig>(key: K, value: SocialAutoConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateChannel = (
    key: SocialPlatformKey,
    patch: Partial<SocialAutoConfig["channels"][SocialPlatformKey]>
  ) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        channels: {
          ...prev.channels,
          [key]: {
            ...prev.channels[key],
            ...patch,
          },
        },
      };
    });
  };

  const handleSave = async () => {
    if (!currentTenant || !config) return;
    setSaving(true);

    try {
      const response = await fetch("/api/cms/social/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          config,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Salvataggio configurazione social non riuscito");
      }

      try {
        await requestPublishTrigger(currentTenant.id, [{ type: "settings" }]);
      } catch (publishError) {
        const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
        toast.error(`Configurazione social salvata, ma il publish non e' stato aggiornato: ${publishMessage}`);
      }

      toast.success("Impostazioni social platform salvate");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore salvataggio social");
    } finally {
      setSaving(false);
    }
  };

  if (!currentTenant) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Seleziona un tenant attivo per configurare i social a livello platform.
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Solo gli Admin del tenant possono gestire configurazioni social e credenziali dal profilo platform.
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Caricamento impostazioni social platform...
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
            Social e integrazioni iniziali
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
            Qui imposti i dati generali del tenant e le credenziali/API social. Nel CMS operativo resteranno solo attivazione canali, programmazione e pubblicazione.
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
          {saving ? "Salvataggio..." : "Salva social platform"}
        </button>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
          <h4 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
            Impostazioni generali
          </h4>
        </div>
        <p className="mt-2 text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
          Questi valori sono strutturali e non devono stare nel CMS operativo.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>URL pubblico base</span>
            <input
              value={config.siteUrl}
              onChange={(event) => updateGlobal("siteUrl", event.target.value)}
              placeholder="https://testata.it"
              className="input w-full text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Hashtag di default</span>
            <input
              value={config.defaultHashtags}
              onChange={(event) => updateGlobal("defaultHashtags", event.target.value)}
              placeholder="#news #territorio #ultime"
              className="input w-full text-sm"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { key: "autoGenerateText", label: "Genera copy social con IA" },
            { key: "publishOnApproval", label: "Pubblica all'approvazione" },
            { key: "openShareAfterGenerate", label: "Apri share dopo generazione" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => updateGlobal(item.key as keyof SocialAutoConfig, !config[item.key as keyof SocialAutoConfig] as never)}
              className="rounded-2xl px-4 py-3 text-left transition"
              style={{
                background: (config[item.key as keyof SocialAutoConfig] as boolean) ? "var(--c-accent-soft)" : "var(--c-bg-2)",
                border: "1px solid var(--c-border)",
              }}
            >
              <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{item.label}</div>
              <div className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                {(config[item.key as keyof SocialAutoConfig] as boolean) ? "Attivo" : "Disattivo"}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
          <h4 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
            Credenziali, handle e API per canale
          </h4>
        </div>
        <p className="mt-2 text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
          Qui salvi i collegamenti veri dei social. Nel CMS operativo il redattore troverà solo attivazione, composizione e programmazione.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const channel = config.channels[platform.key];
            return (
              <div
                key={platform.key}
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                    {platform.label}
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
                    {platform.supportsDirectApi ? "API" : "Assistito"}
                  </span>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
                    {platform.requiresBusiness ? "Business" : "Standard"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
                  {platform.description}
                </p>

                <div className="mt-4 grid gap-3">
                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                      {platform.primaryFieldLabel}
                    </span>
                    <input
                      value={channel.primaryValue}
                      onChange={(event) => updateChannel(platform.key, { primaryValue: event.target.value.trim() })}
                      placeholder={platform.primaryFieldPlaceholder}
                      className="input w-full text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                      {platform.secondaryFieldLabel}
                    </span>
                    <input
                      value={channel.secondaryValue}
                      onChange={(event) => updateChannel(platform.key, { secondaryValue: event.target.value })}
                      placeholder={platform.secondaryFieldPlaceholder}
                      className="input w-full text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                      Webhook / endpoint
                    </span>
                    <input
                      value={channel.webhookUrl}
                      onChange={(event) => updateChannel(platform.key, { webhookUrl: event.target.value.trim() })}
                      placeholder="https://example.com/webhook/social"
                      className="input w-full text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                      Token / credenziale
                    </span>
                    <input
                      type="password"
                      value={channel.accessToken}
                      onChange={(event) => updateChannel(platform.key, { accessToken: event.target.value.trim() })}
                      placeholder="Token, secret o app password"
                      className="input w-full text-sm"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-2)" }}>
        <div className="inline-flex items-center gap-2 font-semibold" style={{ color: "var(--c-text-0)" }}>
          <Link2 className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
          Nota operativa
        </div>
        <p className="mt-2 leading-6">
          Queste impostazioni si applicano al tenant attivo selezionato nella platform app. Se cambi tenant, qui configuri i social del nuovo sito attivo.
        </p>
      </div>
    </section>
  );
}
