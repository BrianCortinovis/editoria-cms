import { getSuperadminOverview } from "@/lib/superadmin/service";
import { SiteModulesControlTable } from "@/components/admin/SiteModulesControlTable";

export default async function AdminSitesPage() {
  const overview = await getSuperadminOverview();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Site Directory
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Siti
        </h2>
      </div>

      <div className="overflow-x-auto border-y" style={{ borderColor: "var(--c-border)" }}>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Sito</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Stack</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Runtime</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Media</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Dominio</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Piano</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>Ultimo publish</th>
            </tr>
          </thead>
          <tbody>
            {overview.sites.map((site) => (
              <tr key={site.siteId} className="border-t" style={{ borderColor: "var(--c-border)" }}>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--c-text-0)" }}>{site.name}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                      {site.slug} · {site.memberCount} membri · {site.status}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--c-text-1)" }}>
                  {site.stackKind || "non assegnato"}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--c-text-1)" }}>
                  <div>
                    <p>{site.deployTargetKind || "non assegnato"}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                      {site.deployTargetLabel || site.publicBaseUrl || "target non configurato"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--c-text-1)" }}>
                  <div>
                    <p>{site.publishedMediaProvider || "non assegnato"}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                      {site.storageHardLimitBytes ? `${Math.round((site.storageHardLimitBytes / 1024 / 1024 / 1024) * 10) / 10} GB hard` : "nessun limite"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--c-text-1)" }}>
                  {site.primaryDomain || "nessun dominio"}
                </td>
                <td className="px-4 py-3">
                  <p style={{ color: "var(--c-text-0)" }}>{site.planCode || "free"}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>{site.subscriptionStatus || "n/d"}</p>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--c-text-1)" }}>
                  {site.lastPublishAt ? new Date(site.lastPublishAt).toLocaleString("it-IT") : "mai"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-3">
        <div className="border-b pb-3" style={{ borderColor: "var(--c-border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
            Tenant Modules
          </p>
          <h3 className="mt-1 text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
            Attivazioni manuali moduli
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
            Qui attivi o disattivi i moduli premium per singolo tenant. Per ora la gestione extra resta manuale dal Superadmin.
          </p>
        </div>
        <SiteModulesControlTable sites={overview.sites} />
      </section>
    </div>
  );
}
