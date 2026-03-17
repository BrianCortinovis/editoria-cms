"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Megaphone,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface BannerRevenue {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  advertiser_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export default function ContabilitaPage() {
  const { currentTenant } = useAuthStore();
  const [banners, setBanners] = useState<BannerRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [advertiserCount, setAdvertiserCount] = useState(0);

  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();

    async function load() {
      const [bannersRes, advRes] = await Promise.all([
        supabase.from("banners").select("id, name, impressions, clicks, starts_at, ends_at, is_active, advertisers(name)")
          .eq("tenant_id", currentTenant!.id).order("impressions", { ascending: false }),
        supabase.from("advertisers").select("id", { count: "exact", head: true }).eq("tenant_id", currentTenant!.id),
      ]);

      if (bannersRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setBanners(bannersRes.data.map((b: any) => ({
          ...b, advertiser_name: b.advertisers?.name ?? null,
        })));
      }
      setAdvertiserCount(advRes.count ?? 0);
      setLoading(false);
    }
    load();
  }, [currentTenant]);

  const totalImpressions = banners.reduce((s, b) => s + b.impressions, 0);
  const totalClicks = banners.reduce((s, b) => s + b.clicks, 0);
  const activeBanners = banners.filter(b => b.is_active).length;
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

  const MetricCard = ({ icon: Icon, label, value, sub, color }: {
    icon: typeof Receipt; label: string; value: string | number; sub?: string; color: string;
  }) => (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--c-accent-soft)" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--c-text-0)" }}>{value}</p>
          <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Megaphone} label="Banner attivi" value={activeBanners} color="var(--c-accent)" />
        <MetricCard icon={Users} label="Inserzionisti" value={advertiserCount} color="#22c55e" />
        <MetricCard icon={TrendingUp} label="Impressioni totali" value={totalImpressions.toLocaleString()} color="#a855f7" />
        <MetricCard icon={PieChart} label="CTR medio" value={`${avgCTR}%`} color="#f59e0b" />
      </div>

      {/* Banner Performance Table */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Receipt className="w-4 h-4" /> Performance Banner Pubblicitari
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--c-text-2)" }}>Caricamento...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--c-text-2)" }}>Nessun banner. Crea il primo banner per iniziare a tracciare le performance.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--c-border)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>Banner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold hidden sm:table-cell" style={{ color: "var(--c-text-2)" }}>Inserzionista</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>Impressioni</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>Click</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>CTR</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>Stato</th>
                </tr>
              </thead>
              <tbody>
                {banners.map(b => {
                  const ctr = b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(2) : "0";
                  return (
                    <tr key={b.id} className="border-b" style={{ borderColor: "var(--c-border)" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: "var(--c-text-0)" }}>{b.name}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell" style={{ color: "var(--c-text-1)" }}>{b.advertiser_name || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--c-text-0)" }}>{b.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--c-text-0)" }}>{b.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: parseFloat(ctr) > 1 ? "var(--c-success)" : "var(--c-text-1)" }}>{ctr}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge" style={{
                          background: b.is_active ? "rgba(34,197,94,0.1)" : "var(--c-bg-3)",
                          color: b.is_active ? "var(--c-success)" : "var(--c-text-2)",
                        }}>{b.is_active ? "ON" : "OFF"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Notes */}
      <div className="card">
        <div className="card-header">Note sulla Contabilità</div>
        <div className="p-4">
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
            I dati mostrati sono basati sulle impressioni e click registrati dal CMS.
            Per la contabilità effettiva (fatturato, pagamenti), collega un sistema di fatturazione esterno
            o usa questa sezione come riferimento per le trattative con gli inserzionisti.
          </p>
        </div>
      </div>
    </div>
  );
}
