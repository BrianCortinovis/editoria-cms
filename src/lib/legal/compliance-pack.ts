import { triggerPublish } from "@/lib/publish/runner";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  getDefaultTenantComplianceServices,
  type TenantComplianceContacts,
  type TenantComplianceServiceKey,
  type TenantComplianceServices,
} from "@/lib/legal/compliance-model";

export const GLOBAL_COMPLIANCE_PACK_ACTION = "platform.compliance.pack";

export type ComplianceDocumentKey = "privacy" | "cookie" | "terms";

export interface ComplianceDocument {
  key: ComplianceDocumentKey;
  slug: string;
  title: string;
  summary: string;
  content: string;
  enabled: boolean;
  updatedAt: string;
}

export interface ComplianceFooterConfig {
  enabled: boolean;
}

export interface ComplianceBannerConfig {
  enabled: boolean;
  scriptUrl: string;
  inlineScript: string;
  noscriptIframeUrl: string;
}

export interface GlobalCompliancePack {
  version: string;
  updatedAt: string;
  updatedBy: string | null;
  footer: ComplianceFooterConfig;
  cookieBanner: ComplianceBannerConfig;
  documents: Record<ComplianceDocumentKey, ComplianceDocument>;
}

export interface TenantComplianceSettings {
  inheritGlobalPack: boolean;
  globalPackVersion: string;
  globalPackUpdatedAt: string;
  lastSyncedAt: string;
  footer: ComplianceFooterConfig;
  cookieBanner: ComplianceBannerConfig;
  documents: Record<ComplianceDocumentKey, ComplianceDocument>;
  contacts: TenantComplianceContacts;
  services: TenantComplianceServices;
}

export interface ComplianceSyncSummary {
  processedAt: string;
  packVersion: string;
  changedTenantIds: string[];
  skippedTenantIds: string[];
  publishResults: Array<{
    tenantId: string;
    ok: boolean;
    message?: string;
  }>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function defaultDocument(
  key: ComplianceDocumentKey,
  slug: string,
  title: string,
  summary: string,
  content: string
): ComplianceDocument {
  return {
    key,
    slug,
    title,
    summary,
    content,
    enabled: true,
    updatedAt: new Date("2026-04-03T00:00:00.000Z").toISOString(),
  };
}

export function getDefaultGlobalCompliancePack(): GlobalCompliancePack {
  return {
    version: new Date("2026-04-03T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-04-03T00:00:00.000Z").toISOString(),
    updatedBy: null,
    footer: {
      enabled: true,
    },
    cookieBanner: {
      enabled: false,
      scriptUrl: "",
      inlineScript: "",
      noscriptIframeUrl: "",
    },
    documents: {
      privacy: defaultDocument(
        "privacy",
        "privacy-policy",
        "Privacy Policy",
        "Informativa sul trattamento dei dati personali del sito.",
        [
          "# Informativa privacy",
          "",
          "Ultimo aggiornamento: {{pack_updated_at}}",
          "",
          "## Titolare del trattamento",
          "{{company_name}} gestisce il sito {{site_name}} e puo' essere contattata all'indirizzo {{privacy_email}}.",
          "{{legal_address}}",
          "P.IVA / Codice Fiscale: {{vat_number}}",
          "Contatto generale: {{contact_email}}",
          "Contatto privacy / DPO: {{dpo_email}}",
          "",
          "## Dati trattati",
          "Il sito puo' trattare dati di navigazione, dati forniti volontariamente nei moduli di contatto, iscrizione newsletter, commenti e richieste editoriali.",
          "- dati tecnici di navigazione e log di sicurezza",
          "- dati inseriti volontariamente nei form del sito",
          "- dati relativi a newsletter, commenti, segnalazioni o candidature, se attivi",
          "- eventuali dati raccolti tramite cookie o strumenti di tracciamento, solo nei limiti dei consensi prestati",
          "",
          "## Finalita'",
          "I dati sono trattati per erogare i servizi richiesti, gestire il sito, tutelare la sicurezza della piattaforma, adempiere obblighi di legge e migliorare l'esperienza editoriale.",
          "- erogazione dei contenuti e gestione tecnica del sito",
          "- risposta alle richieste inviate dagli utenti",
          "- invio di newsletter o comunicazioni richieste dall'utente",
          "- prevenzione abusi, difesa in giudizio e adempimenti normativi",
          "",
          "## Base giuridica",
          "Esecuzione del servizio richiesto, obblighi di legge, legittimo interesse del titolare e consenso quando necessario.",
          "",
          "## Destinatari e fornitori",
          "I dati possono essere trattati da fornitori tecnici, hosting provider, piattaforme di invio e soggetti che supportano il titolare nell'erogazione del servizio, nominati quando necessario responsabili del trattamento.",
          "",
          "## Trasferimenti extra SEE",
          "Qualora siano usati fornitori stabiliti fuori dallo Spazio Economico Europeo, il titolare adotta le garanzie richieste dalla normativa vigente e verifica la liceita' dei trasferimenti caso per caso.",
          "",
          "## Conservazione",
          "I dati sono conservati per il tempo strettamente necessario alle finalita' dichiarate e secondo gli obblighi normativi applicabili.",
          "- dati di contatto: per il tempo necessario a gestire la richiesta",
          "- dati newsletter: fino a revoca del consenso o disiscrizione",
          "- log tecnici e di sicurezza: per il tempo necessario a sicurezza, audit e obblighi di legge",
          "",
          "## Diritti dell'interessato",
          "Puoi richiedere accesso, rettifica, cancellazione, limitazione, opposizione e portabilita' scrivendo a {{privacy_email}}.",
          "",
          "## Attivita' giornalistica",
          "Per i trattamenti svolti per finalita' giornalistiche restano ferme le regole speciali applicabili all'attivita' di informazione e cronaca, incluse le pertinenti regole deontologiche.",
          "",
          "## Reclami",
          "Se ritieni che il trattamento non sia conforme, puoi proporre reclamo all'Autorita' Garante per la protezione dei dati personali.",
          "",
          "## Moduli e servizi attivi",
          "{{generated_service_privacy_sections}}",
        ].join("\n")
      ),
      cookie: defaultDocument(
        "cookie",
        "cookie-policy",
        "Cookie Policy",
        "Informativa sui cookie tecnici, statistici e di terze parti.",
        [
          "# Cookie policy",
          "",
          "Ultimo aggiornamento: {{pack_updated_at}}",
          "",
          "## Cosa sono i cookie",
          "I cookie sono piccoli file di testo che il sito {{site_name}} salva sul dispositivo dell'utente per garantire il corretto funzionamento del servizio e ricordare preferenze o consensi.",
          "",
          "## Cookie tecnici",
          "Il sito utilizza cookie tecnici necessari alla navigazione, alla sicurezza e al corretto funzionamento delle funzionalita' essenziali.",
          "- gestione sessione e sicurezza",
          "- memorizzazione delle preferenze tecniche",
          "- registrazione dello stato dei consensi privacy/cookie",
          "",
          "## Cookie analytics",
          "Gli eventuali strumenti analytics sono attivati solo secondo la configurazione del titolare e, se necessario, dopo il consenso dell'utente. Il titolare deve verificare la conformita' del fornitore analytics e dei relativi trasferimenti di dati.",
          "",
          "## Cookie di marketing e terze parti",
          "Cookie pubblicitari, tag manager, advertising pixel, embed o altri strumenti di tracciamento non tecnici vengono attivati solo dopo consenso libero, specifico e revocabile.",
          "",
          "## Gestione del consenso",
          "Al primo accesso il sito mantiene le impostazioni di default senza tracker non tecnici. Il consenso puo' essere accettato, rifiutato o personalizzato dal banner cookie e modificato in ogni momento tramite il pulsante \"I miei consensi\".",
          "",
          "## Durata delle preferenze",
          "Le scelte sul banner vengono memorizzate con un cookie tecnico e vengono riproposte quando cambiano in modo rilevante le condizioni del trattamento oppure, in via ordinaria, dopo sei mesi.",
          "",
          "## Come disattivare i cookie dal browser",
          "L'utente puo' inoltre intervenire dalle impostazioni del proprio browser per limitare o cancellare i cookie gia' presenti sul dispositivo.",
          "",
          "## Elenco sintetico categorie",
          "- tecnici: sempre attivi, necessari al funzionamento",
          "- analytics: facoltativi o assimilati ai tecnici solo nei casi consentiti dalla normativa",
          "- marketing/profilazione: attivati solo previa accettazione",
          "",
          "## Contatti",
          "Per informazioni sul trattamento dei dati e sull'uso dei cookie scrivi a {{privacy_email}}.",
          "",
          "## Servizi attivi sul sito",
          "{{generated_cookie_service_sections}}",
        ].join("\n")
      ),
      terms: defaultDocument(
        "terms",
        "termini-e-condizioni",
        "Termini e Condizioni",
        "Condizioni generali di utilizzo del sito e dei contenuti.",
        [
          "# Termini e condizioni",
          "",
          "Ultimo aggiornamento: {{pack_updated_at}}",
          "",
          "## Oggetto del servizio",
          "{{site_name}} mette a disposizione contenuti editoriali, servizi informativi, newsletter e strumenti digitali correlati.",
          "",
          "## Utilizzo consentito",
          "L'utente si impegna a utilizzare il sito in modo lecito, corretto e conforme alle presenti condizioni.",
          "",
          "## Proprieta' intellettuale",
          "Contenuti, marchi, layout, immagini e materiali pubblicati sul sito restano di titolarita' del relativo editore o dei rispettivi aventi diritto.",
          "",
          "## Limitazioni di responsabilita'",
          "Il titolare adotta misure ragionevoli per mantenere il sito aggiornato e sicuro, ma non garantisce l'assenza assoluta di interruzioni o errori.",
          "",
          "## Link esterni",
          "Il sito puo' contenere collegamenti a siti di terzi. Il titolare non risponde dei contenuti o delle policy di tali siti esterni.",
          "",
          "## Legge applicabile",
          "Le presenti condizioni sono regolate dalla legge italiana, salvo diverse disposizioni inderogabili applicabili al consumatore.",
          "",
          "## Contatti",
          "Per richieste amministrative o legali contatta {{contact_email}}.",
        ].join("\n")
      ),
    },
  };
}

function normalizeDocument(
  key: ComplianceDocumentKey,
  input: unknown,
  fallback: ComplianceDocument
): ComplianceDocument {
  const record = asRecord(input);

  return {
    key,
    slug: asString(record.slug, fallback.slug) || fallback.slug,
    title: asString(record.title, fallback.title) || fallback.title,
    summary: asString(record.summary, fallback.summary) || fallback.summary,
    content: asString(record.content, fallback.content) || fallback.content,
    enabled: asBoolean(record.enabled, fallback.enabled),
    updatedAt: asString(record.updatedAt, fallback.updatedAt) || fallback.updatedAt,
  };
}

export function normalizeGlobalCompliancePack(input: unknown): GlobalCompliancePack {
  const fallback = getDefaultGlobalCompliancePack();
  const record = asRecord(input);
  const footer = asRecord(record.footer);
  const cookieBanner = asRecord(record.cookieBanner);
  const documents = asRecord(record.documents);

  return {
    version: asString(record.version, fallback.version) || fallback.version,
    updatedAt: asString(record.updatedAt, fallback.updatedAt) || fallback.updatedAt,
    updatedBy: asString(record.updatedBy) || null,
    footer: {
      enabled: asBoolean(footer.enabled, fallback.footer.enabled),
    },
    cookieBanner: {
      enabled: asBoolean(cookieBanner.enabled, fallback.cookieBanner.enabled),
      scriptUrl: asString(cookieBanner.scriptUrl, fallback.cookieBanner.scriptUrl),
      inlineScript: asString(cookieBanner.inlineScript, fallback.cookieBanner.inlineScript),
      noscriptIframeUrl: asString(cookieBanner.noscriptIframeUrl, fallback.cookieBanner.noscriptIframeUrl),
    },
    documents: {
      privacy: normalizeDocument("privacy", documents.privacy, fallback.documents.privacy),
      cookie: normalizeDocument("cookie", documents.cookie, fallback.documents.cookie),
      terms: normalizeDocument("terms", documents.terms, fallback.documents.terms),
    },
  };
}

export function normalizeTenantComplianceSettings(input: unknown): TenantComplianceSettings {
  const fallback = getDefaultGlobalCompliancePack();
  const fallbackServices = getDefaultTenantComplianceServices();
  const record = asRecord(input);
  const footer = asRecord(record.footer);
  const cookieBanner = asRecord(record.cookieBanner);
  const documents = asRecord(record.documents);
  const contacts = asRecord(record.contacts);
  const services = asRecord(record.services);

  function normalizeService(key: TenantComplianceServiceKey) {
    const source = asRecord(services[key]);
    const defaults = fallbackServices[key];
    return {
      enabled: asBoolean(source.enabled, defaults.enabled),
      providerName: asString(source.providerName, defaults.providerName) || defaults.providerName,
      notes: asString(source.notes, defaults.notes),
    };
  }

  return {
    inheritGlobalPack: asBoolean(record.inheritGlobalPack, true),
    globalPackVersion: asString(record.globalPackVersion),
    globalPackUpdatedAt: asString(record.globalPackUpdatedAt),
    lastSyncedAt: asString(record.lastSyncedAt),
    footer: {
      enabled: asBoolean(footer.enabled, fallback.footer.enabled),
    },
    cookieBanner: {
      enabled: asBoolean(cookieBanner.enabled, fallback.cookieBanner.enabled),
      scriptUrl: asString(cookieBanner.scriptUrl, fallback.cookieBanner.scriptUrl),
      inlineScript: asString(cookieBanner.inlineScript, fallback.cookieBanner.inlineScript),
      noscriptIframeUrl: asString(cookieBanner.noscriptIframeUrl, fallback.cookieBanner.noscriptIframeUrl),
    },
    documents: {
      privacy: normalizeDocument("privacy", documents.privacy, fallback.documents.privacy),
      cookie: normalizeDocument("cookie", documents.cookie, fallback.documents.cookie),
      terms: normalizeDocument("terms", documents.terms, fallback.documents.terms),
    },
    contacts: {
      companyName: asString(contacts.companyName),
      contactEmail: asString(contacts.contactEmail),
      privacyEmail: asString(contacts.privacyEmail),
      legalAddress: asString(contacts.legalAddress),
      vatNumber: asString(contacts.vatNumber),
      dpoEmail: asString(contacts.dpoEmail),
    },
    services: {
      contact_forms: normalizeService("contact_forms"),
      newsletter: normalizeService("newsletter"),
      comments: normalizeService("comments"),
      google_analytics: normalizeService("google_analytics"),
      google_tag_manager: normalizeService("google_tag_manager"),
      google_adsense: normalizeService("google_adsense"),
      youtube_embeds: normalizeService("youtube_embeds"),
      social_embeds: normalizeService("social_embeds"),
      payments: normalizeService("payments"),
    },
  };
}

export async function getGlobalCompliancePack() {
  const serviceClient = await createServiceRoleClient();
  const { data, error } = await serviceClient
    .from("audit_logs")
    .select("metadata, actor_user_id, created_at")
    .eq("action", GLOBAL_COMPLIANCE_PACK_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return getDefaultGlobalCompliancePack();
  }

  return normalizeGlobalCompliancePack({
    ...(asRecord(data.metadata)),
    updatedBy: data.actor_user_id || null,
    updatedAt: data.created_at || undefined,
  });
}

export async function saveGlobalCompliancePack(input: unknown, actorUserId: string | null) {
  const serviceClient = await createServiceRoleClient();
  const timestamp = new Date().toISOString();
  const rawInput = asRecord(input);
  const rawDocuments = asRecord(rawInput.documents);
  const normalized = normalizeGlobalCompliancePack({
    ...rawInput,
    version: timestamp,
    updatedAt: timestamp,
    updatedBy: actorUserId,
    documents: {
      privacy: {
        ...asRecord(rawDocuments.privacy),
        updatedAt: timestamp,
      },
      cookie: {
        ...asRecord(rawDocuments.cookie),
        updatedAt: timestamp,
      },
      terms: {
        ...asRecord(rawDocuments.terms),
        updatedAt: timestamp,
      },
    },
  });

  const { error } = await serviceClient.from("audit_logs").insert({
    actor_user_id: actorUserId,
    tenant_id: null,
    site_id: null,
    action: GLOBAL_COMPLIANCE_PACK_ACTION,
    resource_type: "platform_runtime",
    resource_id: "global-compliance-pack",
    metadata: normalized,
  });

  if (error) {
    throw error;
  }

  return normalized;
}

export async function syncGlobalCompliancePackToTenants(options?: {
  actorUserId?: string | null;
  tenantIds?: string[];
  republish?: boolean;
}) {
  const processedAt = new Date().toISOString();
  const actorUserId = options?.actorUserId || null;
  const republish = options?.republish !== false;
  const serviceClient = await createServiceRoleClient();
  const pack = await getGlobalCompliancePack();

  let targetTenantIds = unique(options?.tenantIds || []);

  if (targetTenantIds.length === 0) {
    const { data: sites, error: sitesError } = await serviceClient
      .from("sites")
      .select("tenant_id")
      .is("deleted_at", null);

    if (sitesError) {
      throw sitesError;
    }

    targetTenantIds = unique((sites || []).map((site) => site.tenant_id));
  }

  if (targetTenantIds.length === 0) {
    return {
      processedAt,
      packVersion: pack.version,
      changedTenantIds: [],
      skippedTenantIds: [],
      publishResults: [],
    } satisfies ComplianceSyncSummary;
  }

  const { data: tenants, error: tenantsError } = await serviceClient
    .from("tenants")
    .select("id, settings")
    .in("id", targetTenantIds);

  if (tenantsError) {
    throw tenantsError;
  }

  const changedTenantIds: string[] = [];
  const skippedTenantIds: string[] = [];
  const publishResults: ComplianceSyncSummary["publishResults"] = [];

  for (const tenant of tenants || []) {
    const settings = asRecord(tenant.settings);
    const compliance = normalizeTenantComplianceSettings(settings.compliance);

    if (!compliance.inheritGlobalPack) {
      skippedTenantIds.push(tenant.id);
      continue;
    }

    if (compliance.globalPackVersion === pack.version) {
      continue;
    }

    const nextCompliance: TenantComplianceSettings = {
      ...compliance,
      globalPackVersion: pack.version,
      globalPackUpdatedAt: pack.updatedAt,
      lastSyncedAt: processedAt,
      footer: { ...pack.footer },
      cookieBanner: { ...pack.cookieBanner },
      documents: {
        privacy: { ...pack.documents.privacy },
        cookie: { ...pack.documents.cookie },
        terms: { ...pack.documents.terms },
      },
    };

    const { error: updateError } = await serviceClient
      .from("tenants")
      .update({
        settings: {
          ...settings,
          compliance: nextCompliance,
        },
      })
      .eq("id", tenant.id);

    if (updateError) {
      publishResults.push({
        tenantId: tenant.id,
        ok: false,
        message: updateError.message,
      });
      continue;
    }

    changedTenantIds.push(tenant.id);
  }

  if (republish) {
    for (const tenantId of changedTenantIds) {
      try {
        await triggerPublish(tenantId, [{ type: "settings" }], actorUserId);
        publishResults.push({ tenantId, ok: true });
      } catch (error) {
        publishResults.push({
          tenantId,
          ok: false,
          message: error instanceof Error ? error.message : "Publish failed",
        });
      }
    }
  }

  await serviceClient.from("audit_logs").insert({
    actor_user_id: actorUserId,
    tenant_id: null,
    site_id: null,
    action: "platform.compliance.sync",
    resource_type: "cron_run",
    resource_id: "global-compliance-pack",
    metadata: {
      processedAt,
      packVersion: pack.version,
      changedTenantIds,
      skippedTenantIds,
      publishResults,
    },
  });

  return {
    processedAt,
    packVersion: pack.version,
    changedTenantIds,
    skippedTenantIds,
    publishResults,
  } satisfies ComplianceSyncSummary;
}
