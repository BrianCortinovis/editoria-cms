import { notFound } from "next/navigation";
import { DomainManager } from "@/components/platform/DomainManager";
import { getPlatformSiteDetailForUser, requirePlatformUser } from "@/lib/platform/server";

export default async function SiteDomainsPage({
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
      <div>
        <h2 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Domains · {site.name}
        </h2>
      </div>
      {site.source === "legacy" ? (
        <div className="rounded-[2rem] border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <p className="text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
            Gestione domini non disponibile per questo sito.
          </p>
        </div>
      ) : (
        <DomainManager siteId={site.id} domains={site.domains.filter((domain) => !domain.removed_at)} />
      )}
    </div>
  );
}
