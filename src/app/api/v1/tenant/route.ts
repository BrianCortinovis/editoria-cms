import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { readPublishedJson } from "@/lib/publish/storage";
import type { PublishedSettingsDocument } from "@/lib/publish/types";

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

  const supabase = await createServiceRoleClient();

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("name, slug, domain, logo_url, theme_config")
    .eq("slug", tenantSlug)
    .single();

  if (error || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const activeModules = extractPublicActiveModules(
    (tenant.theme_config as Record<string, unknown> | null | undefined) ?? null
  );

  return NextResponse.json({ tenant: {
    name: tenant.name,
    slug: tenant.slug,
    domain: tenant.domain,
    logo_url: tenant.logo_url,
    theme_config: tenant.theme_config,
    active_modules: activeModules,
  } }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
