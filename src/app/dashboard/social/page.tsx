'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { requestPublishTrigger } from '@/lib/publish/client';
import { useAuthStore } from '@/lib/store';
import {
  SOCIAL_PLATFORMS,
  buildSocialShareUrl,
  normalizeSocialAutoConfig,
  type SocialPlatformKey,
  type SocialAutoConfig,
} from '@/lib/social/platforms';
import { CheckCircle2, ExternalLink, Link2, Save, Send, Share2, ShieldCheck, Sparkles } from 'lucide-react';
import AIButton from '@/components/ai/AIButton';

export default function SocialPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [config, setConfig] = useState<SocialAutoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [composerTitle, setComposerTitle] = useState('Nuovo progetto green in Val Brembana');
  const [composerText, setComposerText] = useState(
    'Scopri il nuovo progetto sul territorio e leggi l’articolo completo sul sito della testata.'
  );
  const [composerUrl, setComposerUrl] = useState('https://esempio.it/articolo/progetto-green-val-brembana');
  const canManageSocial = currentRole === 'admin';

  useEffect(() => {
    if (!canManageSocial) return;
    if (!currentTenant) return;
    const tenantId = currentTenant.id;

    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single();

      if (error) {
        console.error(error);
        toast.error('Errore caricamento configurazione social');
        setLoading(false);
        return;
      }

      const settings = (data?.settings || {}) as Record<string, unknown>;
      const moduleConfig =
        settings.module_config && typeof settings.module_config === 'object'
          ? (settings.module_config as Record<string, unknown>)
          : {};

      setConfig(normalizeSocialAutoConfig(moduleConfig.social_auto));
      setLoading(false);
    }

    void load();
  }, [currentTenant, canManageSocial]);

  const enabledPlatforms = useMemo(
    () =>
      config
        ? SOCIAL_PLATFORMS.filter((platform) => config.channels[platform.key].enabled)
        : [],
    [config]
  );

  const shareLinks = useMemo(() => {
    if (!config) return [];
    return enabledPlatforms
      .map((platform) => ({
        platform,
        url: buildSocialShareUrl(platform.key, {
          title: composerTitle,
          text: [composerText, config.defaultHashtags].filter(Boolean).join(' ').trim(),
          url: composerUrl,
        }),
      }))
      .filter((item) => item.url);
  }, [composerText, composerTitle, composerUrl, config, enabledPlatforms]);

  const updateGlobal = <K extends keyof SocialAutoConfig>(key: K, value: SocialAutoConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateChannel = (
    key: SocialPlatformKey,
    patch: Partial<SocialAutoConfig['channels'][SocialPlatformKey]>
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
    const supabase = createClient();

    const { data: tenantData, error: loadError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', currentTenant.id)
      .single();

    if (loadError) {
      console.error(loadError);
      toast.error('Errore lettura tenant');
      setSaving(false);
      return;
    }

    const currentSettings = (tenantData?.settings || {}) as Record<string, unknown>;
    const currentModuleConfig =
      currentSettings.module_config && typeof currentSettings.module_config === 'object'
        ? (currentSettings.module_config as Record<string, unknown>)
        : {};

    const { error } = await supabase
      .from('tenants')
      .update({
        settings: {
          ...currentSettings,
          module_config: {
            ...currentModuleConfig,
            social_auto: config,
          },
        },
      })
      .eq('id', currentTenant.id);

    setSaving(false);
    if (error) {
      console.error(error);
      toast.error('Salvataggio social non riuscito');
      return;
    }

    try {
      await requestPublishTrigger(currentTenant.id, [{ type: 'settings' }]);
    } catch (publishError) {
      const publishMessage = publishError instanceof Error ? publishError.message : 'Publish non aggiornato';
      toast.error(`Configurazione salvata, ma il publish non e' stato aggiornato: ${publishMessage}`);
    }

    toast.success('Compatibilità social salvata');
  };

  if (!canManageSocial) {
    return (
      <div className="max-w-2xl text-center py-20">
        <Share2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--c-text-3)' }} />
        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
          Solo gli Admin possono gestire token, webhook e configurazioni social del tenant.
        </p>
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="py-10 text-sm" style={{ color: 'var(--c-text-2)' }}>
        Caricamento configurazione social...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Share2 size={24} style={{ color: 'var(--c-accent)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--c-text-0)' }}>
              Social Publishing
            </h2>
          </div>
          <AIButton
            compact
            actions={[
              {
                id: 'social-strategy',
                label: 'Strategia social',
                prompt: 'Analizza configurazione social, canali attivi, hashtag e link di share di questo tenant. Suggerisci miglioramenti pratici di workflow e compatibilita`: {context}',
              },
              {
                id: 'social-checklist',
                label: 'Checklist pubblicazione',
                prompt: 'Prepara una checklist operativa per pubblicare bene sui social da questo CMS: copy, URL, hashtag, token, canali e controlli finali: {context}',
              },
            ]}
            contextData={JSON.stringify({
              tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
              config,
              enabledPlatforms: enabledPlatforms.map((platform) => platform.key),
              shareLinks,
            }, null, 2)}
          />
        </div>
        <p className="text-sm max-w-4xl" style={{ color: 'var(--c-text-2)' }}>
          Base unica per rendere il CMS compatibile con il maggior numero possibile di canali social. Qui prepari account, webhook, handle, token e comportamento di pubblicazione. I publish automatici veri richiedono poi credenziali e approvazioni delle singole piattaforme.
        </p>
      </div>

      <section className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(59,130,246,0.04))', border: '1px solid var(--c-border)' }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: 'var(--c-accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Compatibilità massima, pubblicazione reale a step
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
              Questo modulo prepara il CMS per Facebook, Instagram, Threads, X, Telegram, LinkedIn, WhatsApp, Pinterest, Reddit, Mastodon, Bluesky, YouTube e TikTok. Dove esiste solo share intent o dove l&apos;API è limitata, il sistema resta comunque pronto per copy, link, webhook o workflow misti.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--c-accent)' }}
          >
            <Save size={16} />
            {saving ? 'Salvataggio...' : 'Salva configurazione'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
        <section className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
              Impostazioni globali
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
              Questi valori aiutano il CMS a generare link, copy e workflow social coerenti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>URL pubblico base</span>
              <input
                value={config.siteUrl}
                onChange={(event) => updateGlobal('siteUrl', event.target.value)}
                placeholder="https://testata.it"
                className="input w-full text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>Hashtag di default</span>
              <input
                value={config.defaultHashtags}
                onChange={(event) => updateGlobal('defaultHashtags', event.target.value)}
                placeholder="#news #valbrembana #territorio"
                className="input w-full text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                key: 'autoGenerateText',
                label: 'Genera copy social con IA',
              },
              {
                key: 'publishOnApproval',
                label: 'Pubblica al passaggio approvato',
              },
              {
                key: 'openShareAfterGenerate',
                label: 'Apri share link dopo generazione',
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => updateGlobal(item.key as keyof SocialAutoConfig, !config[item.key as keyof SocialAutoConfig] as never)}
                className="rounded-2xl px-4 py-3 text-left transition"
                style={{
                  background: (config[item.key as keyof SocialAutoConfig] as boolean) ? 'var(--c-accent-soft)' : 'var(--c-bg-2)',
                  border: '1px solid var(--c-border)',
                }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                  {item.label}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
                  {(config[item.key as keyof SocialAutoConfig] as boolean) ? 'Attivo' : 'Disattivo'}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: 'var(--c-accent)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Composer social compatibile
              </h3>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
              Anteprima link e share intent sulle piattaforme abilitate. Utile anche come fallback quando la pubblicazione API non è ancora attiva.
            </p>
          </div>

          <div className="space-y-3">
            <input
              value={composerTitle}
              onChange={(event) => setComposerTitle(event.target.value)}
              className="input w-full text-sm"
              placeholder="Titolo social"
            />
            <textarea
              value={composerText}
              onChange={(event) => setComposerText(event.target.value)}
              rows={4}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: '1px solid var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}
              placeholder="Testo post"
            />
            <input
              value={composerUrl}
              onChange={(event) => setComposerUrl(event.target.value)}
              className="input w-full text-sm"
              placeholder="URL articolo o pagina"
            />
          </div>

          <div className="space-y-2">
            {shareLinks.length === 0 ? (
              <div className="rounded-xl px-3 py-3 text-sm" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>
                Abilita almeno una piattaforma con share intent per vedere i link rapidi.
              </div>
            ) : (
              shareLinks.map(({ platform, url }) => (
                <div
                  key={platform.key}
                  className="rounded-xl px-3 py-3 flex items-center justify-between gap-3"
                  style={{ background: 'var(--c-bg-2)', border: '1px solid var(--c-border)' }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                      {platform.label}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--c-text-2)' }}>
                      {url}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(url || '')}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                    >
                      <Link2 size={13} />
                      Copia
                    </button>
                    <a
                      href={url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                    >
                      <ExternalLink size={13} />
                      Apri
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
            Canali social supportati
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
            Attiva i canali che vuoi preparare ora. Puoi già salvare handle, webhook, token e note tecniche anche se la pubblicazione diretta arriverà dopo.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {SOCIAL_PLATFORMS.map((platform) => {
            const channel = config.channels[platform.key];
            return (
              <div
                key={platform.key}
                className="rounded-2xl p-4 space-y-4"
                style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                        {platform.label}
                      </h4>
                      {channel.enabled ? <CheckCircle2 size={14} style={{ color: 'var(--c-success)' }} /> : null}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
                      {platform.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateChannel(platform.key, { enabled: !channel.enabled })}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: channel.enabled ? 'var(--c-accent-soft)' : 'var(--c-bg-2)',
                      color: channel.enabled ? 'var(--c-accent)' : 'var(--c-text-2)',
                    }}
                  >
                    {channel.enabled ? 'Attivo' : 'Disattivo'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}>
                    {platform.supportsDirectApi ? 'Direct API' : 'Assistito'}
                  </span>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}>
                    {platform.supportsShareIntent ? 'Share Intent' : 'No share intent'}
                  </span>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}>
                    {platform.supportsWebhook ? 'Webhook' : 'No webhook'}
                  </span>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}>
                    {platform.requiresBusiness ? 'Business' : 'Standard'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
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
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      {platform.secondaryFieldLabel}
                    </span>
                    <input
                      value={channel.secondaryValue}
                      onChange={(event) => updateChannel(platform.key, { secondaryValue: event.target.value })}
                      placeholder={platform.secondaryFieldPlaceholder}
                      className="input w-full text-sm"
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Webhook / endpoint opzionale
                    </span>
                    <input
                      value={channel.webhookUrl}
                      onChange={(event) => updateChannel(platform.key, { webhookUrl: event.target.value.trim() })}
                      placeholder="https://example.com/social-hook"
                      className="input w-full text-sm"
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Token / credenziale applicativa
                    </span>
                    <input
                      type="password"
                      value={channel.accessToken}
                      onChange={(event) => updateChannel(platform.key, { accessToken: event.target.value.trim() })}
                      placeholder="Access token, app password o credential secret"
                      className="input w-full text-sm"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Send size={16} style={{ color: 'var(--c-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
            Stato attuale del modulo
          </h3>
        </div>
        <div className="space-y-2 text-sm" style={{ color: 'var(--c-text-2)' }}>
          <div>1. Il CMS è ora predisposto per quasi tutti i canali social principali.</div>
          <div>2. Hai una configurazione unica tenant-based per account, token, handle e webhook.</div>
          <div>3. Hai share link rapidi dove disponibili, utili come fallback immediato.</div>
          <div>4. Il publish automatico reale richiede il passo successivo: collegare le API delle piattaforme per cui avrai credenziali valide.</div>
        </div>
      </section>
    </div>
  );
}
