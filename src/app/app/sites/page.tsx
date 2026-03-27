import Link from "next/link";
import { ArrowRight, Globe2, PlusCircle } from "lucide-react";
import { getPlatformSitesForUser, requirePlatformUser } from "@/lib/platform/server";

export default async function SitesPage() {
  const { user } = await requirePlatformUser();
  const sites = await getPlatformSitesForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between" style={{ borderColor: "var(--c-border)" }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
            Site directory
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
            I tuoi siti
          </h2>
        </div>
        <Link
          href="/app/sites/new"
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
          style={{ background: "var(--c-accent)" }}
        >
          <PlusCircle className="h-4 w-4" />
          Crea nuovo sito
        </Link>
      </div>

      <div className="border-y" style={{ borderColor: "var(--c-border)" }}>
        {sites.map((site) => (
          <article key={site.id} className="flex flex-col gap-4 border-b px-4 py-4 last:border-b-0 md:flex-row md:items-start md:justify-between" style={{ borderColor: "var(--c-border)" }}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                    {site.name}
                  </h3>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                    {site.membershipRole}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="inline-flex items-center gap-2 text-xs" style={{ color: "var(--c-text-1)" }}>
                    <Globe2 className="h-3.5 w-3.5" style={{ color: "var(--c-accent)" }} />
                    {site.primaryDomain || "Nessun dominio attivo"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/app/sites/${site.id}`} className="rounded-full border px-3 py-2 text-sm font-medium" style={{ borderColor: "var(--c-border)", color: "var(--c-text-0)", background: "var(--c-bg-1)" }}>
                  Gestisci sito
                </Link>
                <Link href={`/app/sites/${site.id}/open`} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white" style={{ background: "var(--c-accent)" }}>
                  Apri CMS
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
          </article>
        ))}
      </div>
    </div>
  );
}
