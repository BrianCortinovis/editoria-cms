import type { MetadataRoute } from "next";
import { resolveTenant } from "@/lib/site/tenant-resolver";
import { buildTenantPublicUrl } from "@/lib/site/public-url";

export default async function robots({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<MetadataRoute.Robots> {
  const { tenant: tenantSlug } = await params;
  const resolved = await resolveTenant(tenantSlug);

  const sitemapUrl = resolved
    ? buildTenantPublicUrl(resolved.tenant, "/sitemap.xml")
    : undefined;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api", "/auth"],
      },
    ],
    ...(sitemapUrl ? { sitemap: sitemapUrl } : {}),
  };
}
