import Link from "next/link";
import { ArrowRight, Globe, ShieldCheck, Sparkles, Activity, CheckCircle2, Bell, PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { getPlatformSitesForUser, requirePlatformUser } from "@/lib/platform/server";
import { isUserSuperAdmin } from "@/lib/superadmin/service";

export default async function PlatformHomePage() {
  const { user, profile } = await requirePlatformUser();
  const isSuperAdmin = await isUserSuperAdmin(user.id);
  const sites = await getPlatformSitesForUser(user.id);

  if (isSuperAdmin && sites.length === 0) {
    redirect("/admin");
  }

  if (sites.length === 0) {
    redirect("/app/onboarding");
  }

  const recentSites = sites.slice(0, 3);
  const userLabel =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user.email?.split("@")[0] ||
    "Account";
  const sitesWithDomain = sites.filter((site) => Boolean(site.primaryDomain)).length;
  const sitesWithoutDomain = sites.length - sitesWithDomain;
  const latestSite = sites[0] || null;

  return (
    <div className="space-y-6">
      <section className="border-b pb-5" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Workspace overview
        </p>
        <h2 className="mt-2 max-w-4xl text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          {profile?.first_name || "Bentornato"}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/app/sites"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--c-accent)" }}
          >
            Vai ai siti
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/app/sites/new"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)", background: "var(--c-bg-1)" }}
          >
            <PlusCircle className="h-4 w-4" />
            Crea nuovo sito
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="grid gap-0 md:grid-cols-3">
          {[
            { label: "Siti attivi", value: sites.length, helper: `${sitesWithDomain} con dominio` , icon: Globe},
            { label: "Sicurezza", value: "Attiva", helper: "Controlli accesso", icon: ShieldCheck},
            { label: "Stato account", value: unreadCountLabel(sitesWithoutDomain), helper: sitesWithoutDomain > 0 ? "Siti da completare" : "Workspace pronto", icon: Bell},
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="px-5 py-4"
                style={{ borderLeft: index > 0 ? "1px solid var(--c-border)" : "none" }}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
                  {item.value}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>{item.helper}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--c-border)" }}>
            <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>I tuoi siti</h3>
            <Link href="/app/sites" className="text-sm font-medium" style={{ color: "var(--c-accent-hover)" }}>
              Vedi tutti
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {recentSites.map((site) => (
              <article key={site.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                      {site.name}
                    </p>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                      {site.membershipRole}
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                    {site.primaryDomain || "Dominio da collegare"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/app/sites/${site.id}`} className="rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--c-border)", color: "var(--c-text-0)", background: "var(--c-bg-1)" }}>
                    Gestisci
                  </Link>
                  <Link href={`/app/sites/${site.id}/open`} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--c-accent)" }}>
                    Apri CMS
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <div className="border-b px-5 py-4" style={{ borderColor: "var(--c-border)" }}>
            <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Profilo</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {[
              { label: "Utente", value: userLabel, icon: Sparkles },
              { label: "Email", value: user.email || "Non disponibile", icon: CheckCircle2 },
              { label: "Ultimo sito", value: latestSite?.name || "Nessun sito recente", icon: Activity },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 px-5 py-3">
                  <Icon className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
                  <span className="min-w-24 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>
                    {item.label}
                  </span>
                  <span className="truncate text-sm font-medium" style={{ color: "var(--c-text-0)" }}>
                    {item.value}
                  </span>
                </div>
              );
            })}
            {[
              "Collega il dominio principale.",
              "Invita il team.",
              "Apri il CMS.",
            ].map((step, index) => (
              <div key={step} className="flex gap-3 px-5 py-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                  {index + 1}
                </span>
                <p className="text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function unreadCountLabel(sitesWithoutDomain: number) {
  if (sitesWithoutDomain > 0) {
    return `${sitesWithoutDomain}`;
  }

  return "OK";
}
