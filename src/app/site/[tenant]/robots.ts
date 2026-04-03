import type { MetadataRoute } from "next";
import { resolveTenant } from "@/lib/site/tenant-resolver";
import { buildTenantPublicUrl } from "@/lib/site/public-url";
import { getTenantRobotsSettings } from "@/lib/seo/runtime";

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
  const robotsSettings = getTenantRobotsSettings(resolved?.tenantSettings);

  return {
    rules: robotsSettings.enabled
      ? [
          {
            userAgent: "*",
            allow: robotsSettings.allow,
            disallow: robotsSettings.disallow,
            ...(typeof robotsSettings.crawlDelay === "number"
              ? { crawlDelay: robotsSettings.crawlDelay }
              : {}),
          },
        ]
      : [
          {
            userAgent: "*",
            disallow: "/",
          },
        ],
    ...(sitemapUrl || robotsSettings.extraSitemaps.length > 0
      ? {
          sitemap: [sitemapUrl, ...robotsSettings.extraSitemaps].filter(
            (value): value is string => typeof value === "string" && value.length > 0
          ),
        }
      : {}),
  };
}
