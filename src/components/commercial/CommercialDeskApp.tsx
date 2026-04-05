'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import {
  COMMERCIAL_ACCESS_TOGGLES,
  COMMERCIAL_LAYOUT_TOGGLES,
  COMMERCIAL_TOOL_TOGGLES,
  DEFAULT_COMMERCIAL_DESK_SETTINGS,
  normalizeCommercialDeskSettings,
  type CommercialDeskSettings,
} from '@/lib/desk/uix';
import { useAuthStore } from '@/lib/store';
import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  CheckCircle2,
  Eye,
  Megaphone,
  Monitor,
  Phone,
  Plus,
  Receipt,
  Smartphone,
  Tablet,
  Users,
} from 'lucide-react';

type CommercialBanner = {
  id: string;
  name: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  advertiser_name: string | null;
  advertiser_id: string | null;
  position: string;
  starts_at: string | null;
  ends_at: string | null;
};

type CommercialAdvertiser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type CommercialDeskAppProps = {
  showSettings?: boolean;
  standalone?: boolean;
  previewDevice?: 'phone' | 'tablet' | 'desktop';
  embeddedPreview?: boolean;
};

function numberLabel(value: number) {
  return value.toLocaleString('it-IT');
}

export default function CommercialDeskApp({
  showSettings = false,
  standalone = false,
  previewDevice = 'desktop',
  embeddedPreview = false,
}: CommercialDeskAppProps) {
  const supabase = useMemo(() => createClient(), []);
  const { currentTenant, currentRole } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState<CommercialDeskSettings>(DEFAULT_COMMERCIAL_DESK_SETTINGS);
  const [banners, setBanners] = useState<CommercialBanner[]>([]);
  const [advertisers, setAdvertisers] = useState<CommercialAdvertiser[]>([]);
  const [query, setQuery] = useState('');
  const [mobileSection, setMobileSection] = useState<'overview' | 'campaigns' | 'clients'>('overview');
  const [commercialPreviewDevice, setCommercialPreviewDevice] = useState<'phone' | 'tablet' | 'desktop'>('phone');
  const [previewNonce, setPreviewNonce] = useState(() => Date.now());

  const canConfigure = currentRole === 'admin' || currentRole === 'chief_editor';
  const canUseCommercial =
    (currentRole === 'advertiser' && settings.allowAdvertiserAccess) ||
    (currentRole === 'admin' && settings.allowAdminAccess) ||
    (currentRole === 'chief_editor' && settings.allowChiefEditorAccess) ||
    (currentRole === 'editor' && settings.allowEditorAccess);
  const showQuickLinks = settings.allowQuickLinksToCms && settings.showQuickLinksBar;
  const showCampaignList = settings.showCampaignList && settings.allowBannerManagement;
  const showClientList = settings.showClientList && settings.allowAdvertiserManagement;

  const previewClassName =
    previewDevice === 'phone'
      ? 'max-w-[430px]'
      : previewDevice === 'tablet'
        ? 'max-w-[820px]'
        : 'max-w-[1320px]';

  const loadCommercialDesk = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);

    const [tenantRes, bannersRes, advertisersRes] = await Promise.all([
      supabase
        .from('tenants')
        .select('settings')
        .eq('id', currentTenant.id)
        .single(),
      supabase
        .from('banners')
        .select('id, name, is_active, impressions, clicks, advertiser_id, position, starts_at, ends_at, advertisers(name)')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('advertisers')
        .select('id, name, email, phone, notes')
        .eq('tenant_id', currentTenant.id)
        .order('name'),
    ]);

    if (tenantRes.error || bannersRes.error || advertisersRes.error) {
      toast.error('Errore caricamento app commerciale');
      setLoading(false);
      return;
    }

    const tenantSettings = (tenantRes.data?.settings || {}) as Record<string, unknown>;
    const moduleConfig =
      tenantSettings.module_config && typeof tenantSettings.module_config === 'object'
        ? (tenantSettings.module_config as Record<string, unknown>)
        : {};

    const rawCommercial =
      moduleConfig.commercial_desk && typeof moduleConfig.commercial_desk === 'object'
        ? (moduleConfig.commercial_desk as Record<string, unknown>)
        : {};
    setSettings(normalizeCommercialDeskSettings(rawCommercial));

    const normalizedBanners = ((bannersRes.data || []) as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id || ''),
      name: String(item.name || 'Banner'),
      is_active: Boolean(item.is_active),
      impressions: Number(item.impressions || 0),
      clicks: Number(item.clicks || 0),
      advertiser_id: item.advertiser_id ? String(item.advertiser_id) : null,
      advertiser_name:
        Array.isArray(item.advertisers) && item.advertisers[0]?.name
          ? String(item.advertisers[0].name)
          : null,
      position: String(item.position || 'sidebar'),
      starts_at: item.starts_at ? String(item.starts_at) : null,
      ends_at: item.ends_at ? String(item.ends_at) : null,
    }));

    const normalizedAdvertisers = ((advertisersRes.data || []) as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id || ''),
      name: String(item.name || 'Cliente'),
      email: item.email ? String(item.email) : null,
      phone: item.phone ? String(item.phone) : null,
      notes: item.notes ? String(item.notes) : null,
    }));

    setBanners(normalizedBanners);
    setAdvertisers(normalizedAdvertisers);
    setLoading(false);
  }, [currentTenant, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCommercialDesk();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCommercialDesk]);

  const saveSettings = async () => {
    if (!currentTenant || !canConfigure) return;
    setSavingSettings(true);

    const { data, error } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', currentTenant.id)
      .single();

    if (error) {
      toast.error('Impossibile leggere le impostazioni del tenant');
      setSavingSettings(false);
      return;
    }

    const currentSettings = (data?.settings || {}) as Record<string, unknown>;
    const currentModuleConfig =
      currentSettings.module_config && typeof currentSettings.module_config === 'object'
        ? (currentSettings.module_config as Record<string, unknown>)
        : {};

    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        settings: {
          ...currentSettings,
          module_config: {
            ...currentModuleConfig,
            commercial_desk: settings,
          },
        },
      })
      .eq('id', currentTenant.id);

    setSavingSettings(false);
    if (updateError) {
      toast.error('Salvataggio settaggi app commerciale non riuscito');
      return;
    }

    toast.success('Settaggi app commerciale salvati');
  };

  const filteredBanners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return banners;
    return banners.filter((banner) =>
      [banner.name, banner.advertiser_name, banner.position].some((value) =>
        String(value || '').toLowerCase().includes(normalizedQuery)
      )
    );
  }, [banners, query]);

  const filteredAdvertisers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return advertisers;
    return advertisers.filter((advertiser) =>
      [advertiser.name, advertiser.email, advertiser.phone].some((value) =>
        String(value || '').toLowerCase().includes(normalizedQuery)
      )
    );
  }, [advertisers, query]);

  const totalImpressions = banners.reduce((sum, banner) => sum + banner.impressions, 0);
  const totalClicks = banners.reduce((sum, banner) => sum + banner.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const activeBanners = banners.filter((banner) => banner.is_active).length;

  const quickLinks = [
    { href: '/dashboard/banner', label: 'Banner', enabled: settings.allowBannerManagement, icon: Megaphone },
    { href: '/dashboard/inserzionisti', label: 'Clienti', enabled: settings.allowAdvertiserManagement, icon: Building2 },
    { href: '/dashboard/contabilita', label: 'Conti', enabled: settings.allowRevenueView, icon: Receipt },
  ].filter((item) => item.enabled);
  const commercialSettingGroups = [
    {
      title: 'Accessi',
      description: 'Chi puo usare il desk commerciale del tenant.',
      items: COMMERCIAL_ACCESS_TOGGLES,
    },
    {
      title: 'Strumenti',
      description: 'Quali funzioni operative sono disponibili nella shell commerciale.',
      items: COMMERCIAL_TOOL_TOGGLES,
    },
    {
      title: 'Layout UIX',
      description: 'Quali blocchi compongono davvero l esperienza dedicata commerciale.',
      items: COMMERCIAL_LAYOUT_TOGGLES,
    },
  ] as const;

  const commercialPreviewUrl = `/commerciale?frame=1&device=${commercialPreviewDevice}&preview=${previewNonce}`;

  if (!canUseCommercial && !showSettings) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <BadgeDollarSign className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--c-text-3)' }} />
        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
          L&apos;app commerciale è disponibile solo per i ruoli abilitati dal tenant. Con il ruolo attuale non puoi usare questa interfaccia.
        </p>
      </div>
    );
  }

  return (
    <div
      className={[
        embeddedPreview ? 'mx-auto w-full' : `mx-auto w-full ${previewClassName}`,
        standalone ? 'space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8' : 'space-y-6',
      ].join(' ')}
    >
      {settings.showDeskHeader ? (
        <section className="rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5" style={{ color: 'var(--c-accent)' }} />
              <h2 className="text-xl font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Commercial Desk
              </h2>
            </div>
            <p className="max-w-3xl text-sm leading-6" style={{ color: 'var(--c-text-2)' }}>
              Interfaccia dedicata per commerciale e ADV: clienti, campagne banner, snapshot performance e accessi rapidi ai moduli veri del CMS.
            </p>
            {currentTenant ? (
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--c-text-3)' }}>
                Tenant attivo: {currentTenant.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {([
              ['phone', 'Smartphone', Smartphone],
              ['tablet', 'Tablet', Tablet],
              ['desktop', 'Desktop', Monitor],
            ] as const).map(([device, label, Icon]) => (
              <span
                key={device}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: previewDevice === device ? 'var(--c-accent-soft)' : 'var(--c-bg-2)',
                  color: previewDevice === device ? 'var(--c-accent)' : 'var(--c-text-2)',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 md:hidden">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['overview', 'Overview'],
              ['campaigns', 'Campagne'],
              ['clients', 'Clienti'],
            ].map(([section, label]) => (
              <button
                key={section}
                type="button"
                onClick={() => setMobileSection(section as typeof mobileSection)}
                className="rounded-2xl px-3 py-2 text-xs font-semibold"
                style={{
                  background: mobileSection === section ? 'var(--c-accent-soft)' : 'var(--c-bg-2)',
                  color: mobileSection === section ? 'var(--c-accent)' : 'var(--c-text-2)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        </section>
      ) : null}

      {showSettings && canConfigure ? (
        <section className="rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Settaggi app commerciale
              </h3>
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
                Qui nel CMS completo decidi chi può usare l&apos;app commerciale e quali blocchi operativi rendere visibili.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--c-accent)' }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {savingSettings ? 'Salvataggio...' : 'Salva settaggi'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/commerciale"
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
            >
              Apri app commerciale reale
            </Link>
            <div className="text-xs" style={{ color: 'var(--c-text-2)' }}>
              Questa apertura mostra la shell finale dedicata al team commerciale, fuori dal backoffice completo.
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {commercialSettingGroups.map((group) => (
              <section
                key={group.title}
                className="rounded-[24px] border px-4 py-4"
                style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}
              >
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                    {group.title}
                  </h4>
                  <p className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
                    {group.description}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      className="w-full rounded-2xl border px-4 py-3 text-left transition"
                      style={{
                        background: settings[item.key] ? 'var(--c-accent-soft)' : 'var(--c-bg-1)',
                        color: settings[item.key] ? 'var(--c-accent)' : 'var(--c-text-2)',
                        borderColor: 'var(--c-border)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                            {item.label}
                          </div>
                          <div className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
                            {item.description}
                          </div>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: settings[item.key] ? 'rgba(14,165,233,0.14)' : 'var(--c-bg-2)', color: settings[item.key] ? 'var(--c-accent)' : 'var(--c-text-2)' }}>
                          {settings[item.key] ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-4 rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                  Anteprima app commerciale
                </h4>
                <p className="mt-1 text-xs" style={{ color: 'var(--c-text-2)' }}>
                  Switcha tra smartphone, tablet e desktop per vedere dal CMS come apparirà la desk commerciale reale.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ['phone', 'Smartphone', Smartphone],
                  ['tablet', 'Tablet', Tablet],
                  ['desktop', 'Desktop', Monitor],
                ] as const).map(([device, label, Icon]) => (
                  <button
                    key={device}
                    type="button"
                    onClick={() => setCommercialPreviewDevice(device)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                    style={
                      commercialPreviewDevice === device
                        ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }
                        : { background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }
                    }
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPreviewNonce(Date.now())}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                >
                  Aggiorna preview
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-auto rounded-2xl p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <div
                className="mx-auto rounded-[28px] p-2 shadow-xl"
                style={{
                  width: `${{
                    phone: 390,
                    tablet: 820,
                    desktop: 1180,
                  }[commercialPreviewDevice]}px`,
                  maxWidth: '100%',
                  background: 'var(--c-bg-3)',
                  border: '1px solid var(--c-border)',
                }}
              >
                <iframe
                  key={`${commercialPreviewDevice}-${previewNonce}`}
                  src={commercialPreviewUrl}
                  title={`Anteprima app commerciale ${commercialPreviewDevice}`}
                  className="block w-full rounded-[20px] border-0"
                  style={{
                    height: `${{
                      phone: 844,
                      tablet: 960,
                      desktop: 780,
                    }[commercialPreviewDevice]}px`,
                    background: 'var(--c-bg-0)',
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {settings.showKpiOverview ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Banner', value: banners.length, icon: Megaphone },
          { label: 'Attivi', value: activeBanners, icon: Eye },
          { label: 'Clienti', value: advertisers.length, icon: Users },
          { label: 'CTR medio', value: `${avgCtr}%`, icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border p-4" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
              <Icon className="mb-2 h-5 w-5" style={{ color: 'var(--c-accent)' }} />
              <div className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--c-text-0)' }}>
                {loading ? '…' : item.value}
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--c-text-2)' }}>
                {item.label}
              </div>
            </div>
          );
        })}
        </section>
      ) : null}

      {showQuickLinks ? (
        <section className="rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
          <div className="flex flex-wrap items-center gap-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                >
                  <Icon className="h-4 w-4" style={{ color: 'var(--c-accent)' }} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/dashboard/banner"
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'var(--c-accent)' }}
            >
              <Plus className="h-4 w-4" />
              Nuova campagna
            </Link>
          </div>
        </section>
      ) : null}

      {settings.showSearchBar ? (
        <section className="rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
              Ricerca veloce
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--c-text-2)' }}>
              Cerca tra clienti e campagne senza entrare subito nei moduli completi.
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca cliente, banner o posizione"
            className="input w-full lg:max-w-sm text-sm"
          />
        </div>
        </section>
      ) : null}

      {showCampaignList || showClientList ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {showCampaignList ? (
          <section
          className={`rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5 ${mobileSection === 'clients' ? 'hidden md:block' : ''}`}
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}
        >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Campagne e banner
              </h3>
              <span className="text-xs" style={{ color: 'var(--c-text-2)' }}>
                {filteredBanners.length} elementi
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="text-sm" style={{ color: 'var(--c-text-2)' }}>Caricamento campagne...</div>
              ) : filteredBanners.length === 0 ? (
                <div className="rounded-2xl px-4 py-4 text-sm" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>
                  Nessuna campagna trovata con i filtri attuali.
                </div>
              ) : (
                filteredBanners.slice(0, 12).map((banner) => {
                  const ctr = banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(2) : '0.00';
                  return (
                    <div key={banner.id} className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>
                            {banner.name}
                          </div>
                          <div className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
                            {banner.advertiser_name || 'Cliente non assegnato'} · {banner.position} · CTR {ctr}%
                          </div>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            background: banner.is_active ? 'var(--c-accent-soft)' : 'var(--c-bg-2)',
                            color: banner.is_active ? 'var(--c-accent)' : 'var(--c-text-2)',
                          }}
                        >
                          {banner.is_active ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--c-bg-2)' }}>
                          <div style={{ color: 'var(--c-text-2)' }}>Impression</div>
                          <strong style={{ color: 'var(--c-text-0)' }}>{numberLabel(banner.impressions)}</strong>
                        </div>
                        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--c-bg-2)' }}>
                          <div style={{ color: 'var(--c-text-2)' }}>Click</div>
                          <strong style={{ color: 'var(--c-text-0)' }}>{numberLabel(banner.clicks)}</strong>
                        </div>
                        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--c-bg-2)' }}>
                          <div style={{ color: 'var(--c-text-2)' }}>Periodo</div>
                          <strong style={{ color: 'var(--c-text-0)' }}>
                            {banner.starts_at ? new Date(banner.starts_at).toLocaleDateString('it-IT') : 'Sempre'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ) : null}

        {showClientList ? (
          <section
          className={`rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5 ${mobileSection === 'campaigns' ? 'hidden md:block' : ''}`}
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}
        >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Clienti e contatti
              </h3>
              <span className="text-xs" style={{ color: 'var(--c-text-2)' }}>
                {filteredAdvertisers.length} elementi
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="text-sm" style={{ color: 'var(--c-text-2)' }}>Caricamento clienti...</div>
              ) : filteredAdvertisers.length === 0 ? (
                <div className="rounded-2xl px-4 py-4 text-sm" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>
                  Nessun cliente trovato con i filtri attuali.
                </div>
              ) : (
                filteredAdvertisers.slice(0, 10).map((advertiser) => {
                  const ownedBanners = banners.filter((banner) => banner.advertiser_id === advertiser.id).length;
                  return (
                    <div key={advertiser.id} className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
                      <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                        {advertiser.name}
                      </div>
                      <div className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
                        {advertiser.email || 'Email non disponibile'}
                        {advertiser.phone ? ` · ${advertiser.phone}` : ''}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}>
                          {ownedBanners} banner
                        </span>
                        {advertiser.phone ? (
                          <a
                            href={`tel:${advertiser.phone}`}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                          >
                            <Phone className="h-3 w-3" />
                            Chiama
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ) : null}
        </div>
      ) : null}
    </div>
  );
}
