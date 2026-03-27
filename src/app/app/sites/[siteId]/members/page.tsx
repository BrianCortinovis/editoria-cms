import { notFound } from "next/navigation";
import { SiteMembersManager } from "@/components/platform/SiteMembersManager";
import { getPlatformSiteDetailForUser, requirePlatformUser } from "@/lib/platform/server";

export default async function SiteMembersPage({
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
          Team · {site.name}
        </h2>
      </div>
      <SiteMembersManager
        siteId={site.id}
        canManage={["owner", "admin"].includes(site.membershipRole)}
      />
    </div>
  );
}
