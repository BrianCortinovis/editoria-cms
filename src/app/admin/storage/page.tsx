import { HardDrive, ShieldAlert, Warehouse } from "lucide-react";
import { getSuperadminOverview } from "@/lib/superadmin/service";
import { StorageControlTable } from "@/components/admin/StorageControlTable";

export default async function AdminStoragePage() {
  const overview = await getSuperadminOverview();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Storage Governance
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Storage
        </h2>
      </div>

      <section className="overflow-hidden border-y" style={{ borderColor: "var(--c-border)" }}>
        <div className="grid gap-0 md:grid-cols-3">
          {[
            { title: "Siti con R2", value: overview.summary.cloudflareMediaSites, icon: Warehouse },
            { title: "Siti con VPS media", value: overview.summary.vpsMediaSites, icon: HardDrive },
            { title: "Upload bloccati", value: overview.summary.blockedUploadSites, icon: ShieldAlert },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="px-4 py-3" style={{ borderLeft: index > 0 ? "1px solid var(--c-border)" : "none" }}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.title}
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>{item.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <StorageControlTable sites={overview.sites} />
    </div>
  );
}
