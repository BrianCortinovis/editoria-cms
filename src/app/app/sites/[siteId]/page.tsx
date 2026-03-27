import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, ShieldCheck, Wand2 } from "lucide-react";
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
    <div className="space-y-6">
      <section className="rounded-[2rem] border p-6" style={{ borderColor: "var(--c-border)", background: "linear-gradient(135deg, rgba(124,138,170,0.1) 0%, rgba(28,28,31,1) 62%)" }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--c-text-2)" }}>
              Site Overview
            </p>
            <h2 className="mt-3 text-3xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              {site.name}
            </h2>
            <p className="mt-3 text-sm" style={{ color: "var(--c-text-1)" }}>
              {site.primaryDomain || "Dominio non impostato"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app/sites/${site.id}/domains`} className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--c-border)", color: "var(--c-text-0)" }}>
              Gestisci domini
            </Link>
            <Link href={`/app/sites/${site.id}/members`} className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--c-border)", color: "var(--c-text-0)" }}>
              Team
            </Link>
            <Link href={`/app/sites/${site.id}/open`} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--c-accent)" }}>
              Apri CMS
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            label: "Domini attivi",
            value: site.activeDomainCount,
            icon: Globe,
          },
          {
            label: "Ruolo",
            value: site.membershipRole,
            icon: ShieldCheck,
          },
          {
            label: "Template",
            value: site.settings?.feature_flags?.template || "Bootstrap",
            icon: Wand2,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[1.5rem] border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
              <Icon className="h-5 w-5" style={{ color: "var(--c-accent-hover)" }} />
              <p className="mt-3 text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
                {String(card.value)}
              </p>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                {card.label}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
