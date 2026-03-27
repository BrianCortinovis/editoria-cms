import slugify from "slugify";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildDefaultHostname, getPlatformBaseDomain, RESERVED_SUBDOMAINS } from "@/lib/platform/constants";
import type { PlatformMembershipRole } from "@/lib/platform/types";
import type { UserRole } from "@/types/database";

export interface CreateSiteInput {
  name: string;
  slug: string;
  languageCode: string;
  templateKey?: string | null;
  category?: string | null;
}

export function normalizeSiteSlug(value: string): string {
  return slugify(value, { lower: true, strict: true, trim: true });
}

export function mapPlatformRoleToCmsRole(role: PlatformMembershipRole): UserRole {
  switch (role) {
    case "owner":
      return "super_admin";
    case "admin":
      return "chief_editor";
    case "editor":
      return "editor";
    case "viewer":
    default:
      return "contributor";
  }
}

export async function createSiteForCurrentUser(input: CreateSiteInput) {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const slug = normalizeSiteSlug(input.slug || input.name);
  if (!slug) {
    throw new Error("Inserisci uno slug valido");
  }
  if (slug.length < 3) {
    throw new Error("Lo slug deve avere almeno 3 caratteri");
  }
  if (RESERVED_SUBDOMAINS.has(slug)) {
    throw new Error("Questo slug e` riservato dalla piattaforma");
  }

  const { data, error } = await sessionClient.rpc("create_platform_site", {
    p_name: input.name.trim(),
    p_slug: slug,
    p_language_code: input.languageCode || "it",
    p_template_key: input.templateKey || null,
    p_category: input.category || null,
    p_platform_domain_suffix: getPlatformBaseDomain(),
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      throw new Error("Nome host o slug gia` in uso. Prova una variante.");
    }
    throw error;
  }

  const created = Array.isArray(data) ? data[0] : data;
  return {
    siteId: created.site_id as string,
    tenantId: created.tenant_id as string,
    defaultHostname: (created.default_hostname as string) || buildDefaultHostname(slug),
  };
}
