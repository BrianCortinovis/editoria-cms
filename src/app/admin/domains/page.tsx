import { getSuperadminOverview } from "@/lib/superadmin/service";

export default async function AdminDomainsPage() {
  const overview = await getSuperadminOverview();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Domain Directory
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Domini
        </h2>
      </div>

      <div className="border-y" style={{ borderColor: "var(--c-border)" }}>
        {overview.domains.map((domain) => (
          <article key={domain.id} className="border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--c-border)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{domain.hostname}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                  {domain.kind} · {domain.status}
                </p>
              </div>
              {domain.isPrimary ? (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                  Primary
                </span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-1 text-sm md:grid-cols-2">
              <p style={{ color: "var(--c-text-1)" }}>{domain.siteName || "Sito sconosciuto"}</p>
              <p style={{ color: "var(--c-text-2)" }}>Sito collegato</p>
              <p style={{ color: "var(--c-text-2)" }}>
                Creato: {new Date(domain.createdAt).toLocaleString("it-IT")}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
