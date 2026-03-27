"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CalendarClock,
  Megaphone,
  MousePointer,
  Plus,
  Receipt,
  Sparkles,
} from "lucide-react";

interface AdvMetrics {
  totalBanners: number;
  activeBanners: number;
  advertisers: number;
  impressions: number;
  clicks: number;
  avgCtr: string;
}

interface CampaignRow {
  id: string;
  name: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  starts_at: string | null;
  ends_at: string | null;
  advertiser_name: string | null;
}

interface AdvertiserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function AdvPage() {
  const { currentTenant } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdvMetrics>({
    totalBanners: 0,
    activeBanners: 0,
    advertisers: 0,
    impressions: 0,
    clicks: 0,
    avgCtr: "0.00",
  });
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserRow[]>([]);

  const loadAdv = useCallback(async () => {
    if (!currentTenant) return;

    setLoading(true);
    const supabase = createClient();
    const [bannerRes, advertiserRes] = await Promise.all([
      supabase
        .from("banners")
        .select("id, name, is_active, impressions, clicks, starts_at, ends_at, advertisers(name)")
        .eq("tenant_id", currentTenant.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("advertisers")
        .select("id, name, email, phone")
        .eq("tenant_id", currentTenant.id)
        .order("name"),
    ]);

    const bannerRows = ((bannerRes.data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id || ""),
      name: String(row.name || "Banner"),
      is_active: Boolean(row.is_active),
      impressions: Number(row.impressions || 0),
      clicks: Number(row.clicks || 0),
      starts_at: row.starts_at ? String(row.starts_at) : null,
      ends_at: row.ends_at ? String(row.ends_at) : null,
      advertiser_name:
        Array.isArray(row.advertisers) && row.advertisers[0]?.name
          ? String(row.advertisers[0].name)
          : null,
    }));

    const advertiserRows = ((advertiserRes.data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id || ""),
      name: String(row.name || "Cliente"),
      email: row.email ? String(row.email) : null,
      phone: row.phone ? String(row.phone) : null,
    }));

    const impressions = bannerRows.reduce((sum, banner) => sum + banner.impressions, 0);
    const clicks = bannerRows.reduce((sum, banner) => sum + banner.clicks, 0);

    setCampaigns(bannerRows.slice(0, 6));
    setAdvertisers(advertiserRows.slice(0, 5));
    setMetrics({
      totalBanners: bannerRows.length,
      activeBanners: bannerRows.filter((banner) => banner.is_active).length,
      advertisers: advertiserRows.length,
      impressions,
      clicks,
      avgCtr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00",
    });
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAdv();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAdv]);

  const cards = [
    { label: "Banner", value: metrics.totalBanners, icon: Megaphone },
    { label: "Attivi", value: metrics.activeBanners, icon: BadgeDollarSign },
    { label: "Clienti", value: metrics.advertisers, icon: Building2 },
    { label: "Impression", value: metrics.impressions.toLocaleString(), icon: BarChart3 },
    { label: "Click", value: metrics.clicks.toLocaleString(), icon: MousePointer },
    { label: "CTR", value: `${metrics.avgCtr}%`, icon: Receipt },
  ];

  const shortcuts = [
    { href: "/dashboard/banner", label: "Gestisci banner", icon: Megaphone },
    { href: "/dashboard/inserzionisti", label: "Gestisci clienti", icon: Building2 },
    { href: "/dashboard/contabilita", label: "Performance e conti", icon: Receipt },
    { href: "/dashboard/layout/content", label: "Slot e regole ADV", icon: CalendarClock },
    { href: "/dashboard/ia", label: "Tool IA campagne", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          ADV
        </h2>
        <p className="text-sm max-w-3xl" style={{ color: "var(--c-text-2)" }}>
          Hub commerciale per banner, clienti e performance pubblicitarie. I moduli restano separati, ma qui hai una vista unica dell&apos;area advertising del CMS.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl p-4"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: "var(--c-accent)" }} />
              <div className="text-2xl font-bold" style={{ color: "var(--c-text-0)" }}>
                {loading ? "…" : card.value}
              </div>
              <div className="text-[11px] font-medium mt-1" style={{ color: "var(--c-text-2)" }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Azioni ADV
          </div>
          <div className="p-3 space-y-2">
            <Link
              href="/dashboard/banner"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-white text-sm font-semibold"
              style={{ background: "var(--c-accent)" }}
            >
              <Plus className="w-4 h-4" />
              Nuovo banner
            </Link>
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition"
                  style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
                    {shortcut.label}
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl overflow-hidden xl:col-span-2" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-2)" }}>
              Campagne recenti
            </span>
            <Link href="/dashboard/banner" className="text-xs font-medium" style={{ color: "var(--c-accent)" }}>
              Apri banner
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {campaigns.length === 0 ? (
              <div className="p-8 text-sm text-center" style={{ color: "var(--c-text-3)" }}>
                Nessuna campagna presente.
              </div>
            ) : (
              campaigns.map((campaign) => {
                const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : "0.00";
                return (
                  <Link
                    key={campaign.id}
                    href="/dashboard/banner"
                    className="flex items-center justify-between gap-4 px-4 py-3 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--c-text-0)" }}>
                        {campaign.name}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                        {campaign.advertiser_name || "Cliente non assegnato"} · {campaign.impressions.toLocaleString()} impression · CTR {ctr}%
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: campaign.is_active ? "rgba(16,185,129,0.14)" : "var(--c-bg-2)",
                        color: campaign.is_active ? "var(--c-success)" : "var(--c-text-2)",
                      }}
                    >
                      {campaign.is_active ? "ON" : "OFF"}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Clienti attivi
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {advertisers.length === 0 ? (
              <div className="p-8 text-sm text-center" style={{ color: "var(--c-text-3)" }}>
                Nessun cliente registrato.
              </div>
            ) : (
              advertisers.map((advertiser) => (
                <Link
                  key={advertiser.id}
                  href="/dashboard/inserzionisti"
                  className="flex items-center justify-between gap-4 px-4 py-3 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--c-text-0)" }}>
                      {advertiser.name}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                      {advertiser.email || "Email non disponibile"}
                      {advertiser.phone ? ` · ${advertiser.phone}` : ""}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "var(--c-text-3)" }} />
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Lettura area ADV
          </div>
          <div className="p-4 space-y-3 text-sm" style={{ color: "var(--c-text-2)" }}>
            <p>
              `ADV` raccoglie tutto il perimetro commerciale: campagne, clienti e performance.
            </p>
            <p>
              `Banner` serve per creatività, posizioni e attivazione campagne.
            </p>
            <p>
              `Clienti` gestisce il parco inserzionisti.
            </p>
            <p>
              `Conti` resta il punto di lettura numerico di impression, click e CTR.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
