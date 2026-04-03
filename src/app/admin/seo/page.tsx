import Link from "next/link";
import { Globe, Search, ShieldCheck, Waypoints } from "lucide-react";
import { requireSuperAdmin } from "@/lib/superadmin/service";
import { buildTenantPublicUrl } from "@/lib/site/public-url";

type TenantSeoRow = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: Record<string, unknown>;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function yesNo(value: boolean) {
  return value ? "Si" : "No";
}

export default async function AdminSeoPage() {
  const { serviceClient } = await requireSuperAdmin();
  const { data } = await serviceClient
    .from("tenants")
    .select("id, name, slug, domain, settings")
    .order("name");

  const rows = ((data || []) as TenantSeoRow[]).map((tenant) => {
    const settings = asRecord(tenant.settings);
    const seo = asRecord(settings.seo);
    const robots = asRecord(seo.robots);

    return {
      ...tenant,
      settings,
      hasAnalytics: typeof settings.google_analytics === "string" && settings.google_analytics.trim().length > 0,
      hasTagManager: typeof settings.google_tag_manager === "string" && settings.google_tag_manager.trim().length > 0,
      hasAdsense: typeof settings.google_adsense === "string" && settings.google_adsense.trim().length > 0,
      hasSearchConsole:
        typeof settings.google_search_console_verification === "string" &&
        settings.google_search_console_verification.trim().length > 0,
      hasGoogleNews:
        typeof settings.google_news_publication_name === "string" &&
        settings.google_news_publication_name.trim().length > 0,
      hasSiteDescription:
        typeof settings.site_description === "string" && settings.site_description.trim().length > 0,
      hasCustomRobots:
        Array.isArray(robots.allow) ||
        Array.isArray(robots.disallow) ||
        Array.isArray(robots.extraSitemaps) ||
        typeof robots.crawlDelay === "number",
      robotsEnabled: typeof robots.enabled === "boolean" ? robots.enabled : true,
      publicBaseUrl: buildTenantPublicUrl(
        { slug: tenant.slug, domain: tenant.domain },
        "/"
      ),
    };
  });

  const summary = {
    total: rows.length,
    searchConsole: rows.filter((row) => row.hasSearchConsole).length,
    googleNews: rows.filter((row) => row.hasGoogleNews).length,
    robotsCustom: rows.filter((row) => row.hasCustomRobots).length,
    analytics: rows.filter((row) => row.hasAnalytics || row.hasTagManager).length,
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
            SEO Control Plane
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
            Overview tecnica multi-tenant
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
            Vista centrale per controllare readiness SEO, Search Console, Google News, crawl policy e risorse pubbliche di ogni sito registrato in piattaforma.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <Search className="h-5 w-5" style={{ color: "var(--c-accent)" }} />
          <p className="mt-3 text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>{summary.total}</p>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Tenant monitorati</p>
        </div>
        <div className="rounded-3xl border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <ShieldCheck className="h-5 w-5" style={{ color: "var(--c-accent)" }} />
          <p className="mt-3 text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>{summary.searchConsole}</p>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Con Search Console</p>
        </div>
        <div className="rounded-3xl border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <Globe className="h-5 w-5" style={{ color: "var(--c-accent)" }} />
          <p className="mt-3 text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>{summary.googleNews}</p>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Con Google News</p>
        </div>
        <div className="rounded-3xl border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <Waypoints className="h-5 w-5" style={{ color: "var(--c-accent)" }} />
          <p className="mt-3 text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>{summary.robotsCustom}</p>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>Con robots personalizzato</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="grid grid-cols-[1.5fr,1fr,0.7fr,0.7fr,0.7fr,0.8fr,1fr] gap-3 border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
          <span>Sito</span>
          <span>Dominio</span>
          <span>Search Console</span>
          <span>Google News</span>
          <span>Tracking</span>
          <span>Robots</span>
          <span>Risorse</span>
        </div>

        {rows.map((row) => {
          const sitemapUrl = `${row.publicBaseUrl.replace(/\/+$/, "")}/sitemap.xml`;
          const robotsUrl = `${row.publicBaseUrl.replace(/\/+$/, "")}/robots.txt`;

          return (
            <div
              key={row.id}
              className="grid grid-cols-[1.5fr,1fr,0.7fr,0.7fr,0.7fr,0.8fr,1fr] gap-3 border-b px-4 py-4 text-sm last:border-b-0"
              style={{ borderColor: "var(--c-border)" }}
            >
              <div>
                <p className="font-semibold" style={{ color: "var(--c-text-0)" }}>{row.name}</p>
                <p className="mt-1 text-xs font-mono" style={{ color: "var(--c-text-2)" }}>{row.slug}</p>
              </div>
              <div className="text-xs leading-6" style={{ color: "var(--c-text-1)" }}>
                {row.domain || "subpath /site"}
              </div>
              <div style={{ color: "var(--c-text-1)" }}>{yesNo(row.hasSearchConsole)}</div>
              <div style={{ color: "var(--c-text-1)" }}>{yesNo(row.hasGoogleNews)}</div>
              <div style={{ color: "var(--c-text-1)" }}>{yesNo(row.hasAnalytics || row.hasTagManager || row.hasAdsense)}</div>
              <div style={{ color: "var(--c-text-1)" }}>
                {row.robotsEnabled ? (row.hasCustomRobots ? "Custom" : "Default") : "Bloccato"}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Link href={sitemapUrl} target="_blank" className="rounded-full border px-3 py-1" style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)" }}>
                  Sitemap
                </Link>
                <Link href={robotsUrl} target="_blank" className="rounded-full border px-3 py-1" style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)" }}>
                  Robots
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
