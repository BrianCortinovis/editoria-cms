import Link from "next/link";
import { Database, Globe, HardDrive, Shield, Users } from "lucide-react";
import { getPlatformCronSettings } from "@/lib/cron/platform-settings";
import { getSuperadminOverview } from "@/lib/superadmin/service";
import PlatformCharts from "@/components/admin/PlatformCharts";

export default async function AdminOverviewPage() {
  const overview = await getSuperadminOverview();
  const cronSettings = await getPlatformCronSettings();
  const { summary } = overview;

  return (
    <div className="space-y-6">
      <section className="border-b pb-5" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--c-text-2)" }}>
          Global Governance
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Panoramica piattaforma
        </h2>
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Utenti", value: summary.totalUsers, icon: Users },
            { label: "Siti", value: summary.totalSites, icon: Database },
            { label: "Domini", value: summary.activeDomains, icon: Globe },
            { label: "Subscription", value: summary.activeSubscriptions, icon: Shield },
            { label: "Upload bloccati", value: summary.blockedUploadSites, icon: HardDrive },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="px-5 py-4"
                style={{
                  borderLeft: index > 0 ? "1px solid var(--c-border)" : "none",
                  borderTop: "none",
                }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <div className="border-b px-5 py-4" style={{ borderColor: "var(--c-border)" }}>
            <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Stato piattaforma</h3>
          </div>
          <div className="divide-y text-sm" style={{ borderColor: "var(--c-border)" }}>
            {[
              ["Tenant", summary.totalTenants],
              ["Shared", summary.sharedSites],
              ["Dedicated", summary.dedicatedSites],
              ["Target VPS cliente", summary.customerVpsTargets],
              ["Published su Cloudflare R2", summary.cloudflareMediaSites],
              ["Published su VPS cliente", summary.vpsMediaSites],
              ["Job publish recenti", overview.publishJobs.length],
              ["Audit recenti", overview.recentAuditLogs.length],
              ["Publish maintenance", cronSettings.publishMaintenanceEnabled ? "Attivo" : "Disattivato"],
              ["SEO analysis", cronSettings.seoAnalysisEnabled ? "Attivo" : "Disattivato"],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between px-5 py-3">
                <span style={{ color: "var(--c-text-2)" }}>{label}</span>
                <strong style={{ color: "var(--c-text-0)" }}>{value}</strong>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 border-t px-5 py-3 text-sm" style={{ borderColor: "var(--c-border)" }}>
            <Link href="/admin/storage" className="font-semibold" style={{ color: "var(--c-danger)" }}>Storage</Link>
            <Link href="/admin/cron" className="font-semibold" style={{ color: "var(--c-danger)" }}>Cron</Link>
            <Link href="/admin/publish" className="font-semibold" style={{ color: "var(--c-danger)" }}>Publish</Link>
            <Link href="/admin/sites" className="font-semibold" style={{ color: "var(--c-danger)" }}>Directory siti</Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <div className="border-b px-5 py-4" style={{ borderColor: "var(--c-border)" }}>
            <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Audit recente</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {overview.recentAuditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="px-5 py-3">
                <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{log.action}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                  {log.resource_type} · {new Date(log.created_at).toLocaleString("it-IT")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--c-border)" }}>
          <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Siti recenti</h3>
          <Link href="/admin/sites" className="text-sm font-semibold" style={{ color: "var(--c-danger)" }}>
            Apri directory
          </Link>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
          {overview.sites.slice(0, 6).map((site) => (
            <div key={site.siteId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: "var(--c-text-0)" }}>{site.name}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                  {site.stackKind || "n/d"} · {site.deployTargetKind || "n/d"} · {site.primaryDomain || "nessun dominio"}
                </p>
              </div>
              <div className="text-right text-xs" style={{ color: "var(--c-text-2)" }}>
                <p>{site.planCode || "free"}</p>
                <p>{site.memberCount} membri</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PlatformCharts sites={overview.sites.map(s => ({
        name: s.name,
        storageUsagePercent: s.storageUsagePercent,
        storageUsedBytes: s.storageUsedBytes,
        storageHardLimitBytes: s.storageHardLimitBytes,
        planCode: s.planCode,
        stackKind: s.stackKind,
        activeModules: s.activeModules,
      }))} />
    </div>
  );
}
