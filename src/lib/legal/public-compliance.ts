import type { ResolvedTenant, TenantSettings } from "@/lib/site/tenant-resolver";
import { buildTenantPublicUrl } from "@/lib/site/public-url";
import {
  getDefaultTenantComplianceServices,
  type TenantComplianceServices,
} from "@/lib/legal/compliance-model";
import {
  normalizeTenantComplianceSettings,
  type ComplianceDocument,
  type ComplianceDocumentKey,
} from "@/lib/legal/compliance-pack";
import {
  listEnabledComplianceServices,
  resolveServiceProviderName,
} from "@/lib/legal/compliance-services";

export interface ResolvedCompliancePage {
  key: ComplianceDocumentKey;
  path: string;
  title: string;
  summary: string;
  updatedAt: string;
  content: string;
}

function replaceTokens(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_match, rawKey) => {
    const key = String(rawKey || "").trim().toLowerCase();
    return values[key] ?? "";
  });
}

function normalizePath(path: string) {
  const value = `/${String(path || "").trim().replace(/^\/+/, "")}`.replace(/\/+/g, "/");
  return value === "/" ? "/" : value.replace(/\/+$/g, "");
}

function buildPlaceholderMap(tenant: ResolvedTenant, tenantSettings: TenantSettings) {
  const settings = normalizeTenantComplianceSettings(tenantSettings.compliance);
  const contacts = settings.contacts;
  const siteUrl = buildTenantPublicUrl(tenant, "/");
  const siteDomain = tenant.domain || buildTenantPublicUrl(tenant, "/").replace(/^https?:\/\//, "");

  return {
    site_name: tenant.name,
    site_slug: tenant.slug,
    site_domain: siteDomain,
    site_url: siteUrl,
    company_name: contacts.companyName || tenant.name,
    contact_email: contacts.contactEmail || contacts.privacyEmail || `info@${siteDomain.replace(/\/.*$/, "")}`,
    privacy_email: contacts.privacyEmail || contacts.contactEmail || `privacy@${siteDomain.replace(/\/.*$/, "")}`,
    legal_address: contacts.legalAddress || "",
    vat_number: contacts.vatNumber || "",
    dpo_email: contacts.dpoEmail || contacts.privacyEmail || contacts.contactEmail || "",
    pack_updated_at: settings.globalPackUpdatedAt || settings.lastSyncedAt || new Date().toISOString().slice(0, 10),
  };
}

function resolveEffectiveComplianceServices(tenantSettings: TenantSettings): TenantComplianceServices {
  const settings = normalizeTenantComplianceSettings(tenantSettings.compliance);
  const services = {
    ...getDefaultTenantComplianceServices(),
    ...settings.services,
  };

  const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;

  if (hasText(tenantSettings.google_analytics)) {
    services.google_analytics = {
      ...services.google_analytics,
      enabled: true,
    };
  }

  if (hasText(tenantSettings.google_tag_manager)) {
    services.google_tag_manager = {
      ...services.google_tag_manager,
      enabled: true,
    };
  }

  if (hasText(tenantSettings.google_adsense)) {
    services.google_adsense = {
      ...services.google_adsense,
      enabled: true,
    };
  }

  return services;
}

function renderGeneratedServicePrivacySections(tenantSettings: TenantSettings) {
  const effectiveServices = resolveEffectiveComplianceServices(tenantSettings);
  const enabledServices = listEnabledComplianceServices(effectiveServices);

  if (enabledServices.length === 0) {
    return "Nessun modulo opzionale aggiuntivo dichiarato nella configurazione compliance del tenant.";
  }

  return enabledServices
    .flatMap((definition) => {
      const serviceSetting = effectiveServices[definition.key];
      const providerName = resolveServiceProviderName(definition, serviceSetting);
      const sectionLines = definition.privacySection.map((line) => line.replace(/\{\{\s*provider_name\s*\}\}/gi, providerName));

      if (serviceSetting?.notes?.trim()) {
        sectionLines.push(`Nota operativa del titolare: ${serviceSetting.notes.trim()}`);
      }

      return [...sectionLines, ""];
    })
    .join("\n")
    .trim();
}

function renderGeneratedServiceCookieSections(tenantSettings: TenantSettings) {
  const effectiveServices = resolveEffectiveComplianceServices(tenantSettings);
  const enabledServices = listEnabledComplianceServices(effectiveServices);

  if (enabledServices.length === 0) {
    return "Nessun servizio opzionale aggiuntivo dichiarato nella configurazione cookie del tenant.";
  }

  return enabledServices
    .flatMap((definition) => {
      const serviceSetting = effectiveServices[definition.key];
      const providerName = resolveServiceProviderName(definition, serviceSetting);
      const sectionLines = definition.cookieSection.map((line) => line.replace(/\{\{\s*provider_name\s*\}\}/gi, providerName));

      if (serviceSetting?.notes?.trim()) {
        sectionLines.push(`Nota operativa del titolare: ${serviceSetting.notes.trim()}`);
      }

      sectionLines.push(
        `Consenso richiesto: ${definition.requiresConsent ? "si" : "no, salvo trattamenti ulteriori non tecnici"}`
      );

      return [...sectionLines, ""];
    })
    .join("\n")
    .trim();
}

function resolveDocumentPath(document: ComplianceDocument) {
  return normalizePath(document.slug);
}

function materializeDocument(
  tenant: ResolvedTenant,
  tenantSettings: TenantSettings,
  key: ComplianceDocumentKey,
  document: ComplianceDocument
): ResolvedCompliancePage {
  const tokens = {
    ...buildPlaceholderMap(tenant, tenantSettings),
    generated_service_privacy_sections: renderGeneratedServicePrivacySections(tenantSettings),
    generated_cookie_service_sections: renderGeneratedServiceCookieSections(tenantSettings),
  };
  const content = replaceTokens(document.content, tokens);
  const generatedSections =
    key === "privacy"
      ? tokens.generated_service_privacy_sections
      : key === "cookie"
        ? tokens.generated_cookie_service_sections
        : "";
  const finalContent =
    generatedSections && !content.includes(generatedSections) && !/\{\{\s*generated_/i.test(document.content)
      ? `${content}\n\n## Moduli e servizi attivi\n${generatedSections}`
      : content;

  return {
    key,
    path: resolveDocumentPath(document),
    title: replaceTokens(document.title, tokens),
    summary: replaceTokens(document.summary, tokens),
    updatedAt: document.updatedAt,
    content: finalContent,
  };
}

export function getResolvedCompliancePages(tenant: ResolvedTenant, tenantSettings: TenantSettings) {
  const settings = normalizeTenantComplianceSettings(tenantSettings.compliance);
  const pages = Object.entries(settings.documents)
    .filter((entry): entry is [ComplianceDocumentKey, ComplianceDocument] => Boolean(entry[1]?.enabled))
    .map(([key, document]) => materializeDocument(tenant, tenantSettings, key, document));

  return {
    compliance: settings,
    pages,
  };
}

export function resolveCompliancePageBySlug(
  tenant: ResolvedTenant,
  tenantSettings: TenantSettings,
  slugSegments: string[]
) {
  const slug = normalizePath(slugSegments.join("/"));
  const { pages } = getResolvedCompliancePages(tenant, tenantSettings);
  return pages.find((page) => page.path === slug) || null;
}

export function getComplianceFooterLinks(tenant: ResolvedTenant, tenantSettings: TenantSettings) {
  const { compliance, pages } = getResolvedCompliancePages(tenant, tenantSettings);
  if (!compliance.footer.enabled) {
    return [];
  }

  return pages.map((page) => ({
    label: page.title,
    url: buildTenantPublicUrl(tenant, page.path),
  }));
}
