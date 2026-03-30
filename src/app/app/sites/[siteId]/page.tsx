import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, ShieldCheck, Wand2, ExternalLink, Users, Settings } from "lucide-react";
import { getPlatformSiteDetailForUser, requirePlatformUser } from "@/lib/platform/server";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const { user } = await requirePlatformUser();
  const site = await getPlatformSiteDetailForUser(user.id, siteId);

  if (!site) {
    notFound();
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--c-text-2)" }}
            >
              Site Overview
            </p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-tight"
              style={{ color: "var(--c-text-0)" }}
            >
              {site.name}
            </h2>
            {site.primaryDomain ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm" style={{ color: "var(--c-accent)" }}>
                <Globe className="h-3.5 w-3.5" />
                {site.primaryDomain}
              </p>
            ) : (
              <p className="mt-1.5 text-sm" style={{ color: "var(--c-text-2)" }}>
                Dominio non impostato
              </p>
            )}
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Link
              href={`/app/sites/${site.id}/open`}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition"
              style={{ background: "var(--c-accent)" }}
            >
              Apri CMS
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Domini attivi", value: site.activeDomainCount, icon: Globe },
          { label: "Ruolo", value: site.membershipRole, icon: ShieldCheck },
          { label: "Template", value: site.settings?.feature_flags?.template || "Bootstrap", icon: Wand2 },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: "var(--c-accent-soft)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-lg font-semibold leading-tight"
                    style={{ color: "var(--c-text-0)" }}
                  >
                    {String(card.value)}
                  </p>
                  <p
                    className="text-[11px] uppercase tracking-[0.12em]"
                    style={{ color: "var(--c-text-2)" }}
                  >
                    {card.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Actions */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/app/sites/${site.id}/domains`}
          className="flex items-center gap-4 rounded-xl border p-4 transition"
          style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "var(--c-accent-soft)" }}
          >
            <Settings className="h-4.5 w-4.5" style={{ color: "var(--c-accent)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              Gestisci domini
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--c-text-2)" }}>
              Aggiungi, verifica e configura i domini del sito
            </p>
          </div>
        </Link>
        <Link
          href={`/app/sites/${site.id}/members`}
          className="flex items-center gap-4 rounded-xl border p-4 transition"
          style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "var(--c-accent-soft)" }}
          >
            <Users className="h-4.5 w-4.5" style={{ color: "var(--c-accent)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              Gestisci team
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--c-text-2)" }}>
              Invita membri, assegna ruoli e permessi
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
