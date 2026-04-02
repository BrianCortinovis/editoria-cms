import { NextResponse } from "next/server";
import { readPublishedJson } from "@/lib/publish/storage";
import type { PublishedSettingsDocument } from "@/lib/publish/types";
import { resolvePublicTenantContext } from "@/lib/site/runtime";

function extractPublicActiveModules(themeConfig: Record<string, unknown> | null | undefined): string[] {
  if (!themeConfig || typeof themeConfig !== "object") {
    return [];
  }

  const fromArray = themeConfig.active_modules;
  if (Array.isArray(fromArray)) {
    return fromArray.filter((item): item is string => typeof item === "string");
  }

  const fromMap = themeConfig.public_modules;
  if (fromMap && typeof fromMap === "object") {
    return Object.entries(fromMap)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([moduleId]) => moduleId);
  }

  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const publishedSettings = await readPublishedJson<PublishedSettingsDocument>(`sites/${encodeURIComponent(tenantSlug)}/settings.json`);
  if (publishedSettings?.tenant) {
    const activeModules = (() => {
      const settings = publishedSettings.tenantSettings || {};
      const active = settings.active_modules;
      return Array.isArray(active) ? active.filter((item): item is string => typeof item === "string") : [];
    })();

    return NextResponse.json({ tenant: {
      name: publishedSettings.tenant.name,
      slug: publishedSettings.tenant.slug,
      domain: publishedSettings.tenant.domain,
      logo_url: publishedSettings.tenant.logo_url,
      theme_config: publishedSettings.config?.theme || {},
      active_modules: activeModules,
    } }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  }

  const context = await resolvePublicTenantContext(tenantSlug);
  if (!context) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { tenant, runtimeClient } = context;
  const { data: runtimeTenant, error } = await runtimeClient
    .from("tenants")
    .select("name, slug, domain, logo_url, theme_config")
    .eq("id", tenant.id)
    .single();

  if (error || !runtimeTenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const activeModules = extractPublicActiveModules(
    (runtimeTenant.theme_config as Record<string, unknown> | null | undefined) ?? null
  );

  return NextResponse.json({ tenant: {
    name: runtimeTenant.name,
    slug: runtimeTenant.slug,
    domain: runtimeTenant.domain,
    logo_url: runtimeTenant.logo_url,
    theme_config: runtimeTenant.theme_config,
    active_modules: activeModules,
  } }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
