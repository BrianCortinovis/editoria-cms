import { getThemeContract, type ThemeContract } from "@/lib/theme-contract";

export interface BridgePageSummary {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  updatedAt: string | null;
  seo: {
    title: string | null;
    description: string | null;
    canonicalPath: string | null;
  };
}

export interface BridgeSlotSummary {
  id: string;
  slotKey: string;
  label: string;
  contentType: string;
  categorySlug: string | null;
  assignmentMode: string;
  maxItems: number;
  placementDurationHours: number | null;
  pageType: string;
}

export interface SiteBridgePack {
  version: string;
  generatedAt: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
  };
  publicRuntime: {
    homepage: string;
    articlePattern: string;
    categoryPattern: string;
    pagePattern: string;
    searchPattern: string;
  };
  publicApis: {
    site: string;
    pages: string;
    layout: string;
    articles: string;
    search: string;
    themeContract: string;
  };
  publishedLayer: {
    manifest: string;
    settings: string;
    menu: string;
    posts: string;
    search: string;
    modules: string;
    mediaManifest: string;
    bannerZones: string;
    articlePattern: string;
    categoryPattern: string;
    pagePattern: string;
    recommendedConsumption: "internal_loaders_first";
  };
  nativeLinking: {
    pageHrefPrefix: string;
    articleHrefPrefix: string;
    categoryHrefPrefix: string;
    menuSource: "cms.navigation";
    footerSource: "cms.footer";
    rules: string[];
  };
  seoConventions: {
    sourceOfTruth: string[];
    requiredFields: string[];
    notes: string[];
  };
  contentModel: {
    pages: BridgePageSummary[];
    slots: BridgeSlotSummary[];
    categories: Array<{ id: string; slug: string; name: string; color: string | null }>;
  };
  siteConfig: {
    theme: Record<string, unknown>;
    navigation: Record<string, unknown>;
    footer: Record<string, unknown>;
    faviconUrl: string | null;
    ogDefaults: Record<string, unknown>;
    globalCss: string | null;
  };
  themeContract: ThemeContract;
  aiBuilderBridge: {
    objective: string;
    hardRules: string[];
    workflow: string[];
    preferredOutputs: string[];
  };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getSeoMeta(metaInput: unknown) {
  const meta = asRecord(metaInput);
  return {
    title: typeof meta.title === "string" ? meta.title : null,
    description: typeof meta.description === "string" ? meta.description : null,
    canonicalPath: typeof meta.canonicalPath === "string" ? meta.canonicalPath : null,
  };
}

export function buildSiteBridgePack(input: {
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
  };
  siteConfig: {
    theme?: unknown;
    navigation?: unknown;
    footer?: unknown;
    favicon_url?: string | null;
    og_defaults?: unknown;
    global_css?: string | null;
  } | null;
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    is_published?: boolean | null;
    updated_at?: string | null;
    meta?: unknown;
  }>;
  slots: Array<{
    id: string;
    slot_key: string;
    label: string;
    content_type: string;
    assignment_mode?: string | null;
    max_items?: number | null;
    placement_duration_hours?: number | null;
    categories?: { slug?: string | null } | null;
    layout_templates?: { page_type?: string | null } | null;
  }>;
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    color: string | null;
  }>;
}): SiteBridgePack {
  const tenantSlug = input.tenant.slug;

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    tenant: input.tenant,
    publicRuntime: {
      homepage: `/site/${tenantSlug}`,
      articlePattern: `/site/${tenantSlug}/articolo/{articleSlug}`,
      categoryPattern: `/site/${tenantSlug}/categoria/{categorySlug}`,
      pagePattern: `/site/${tenantSlug}/{pageSlug}`,
      searchPattern: `/site/${tenantSlug}/search?q={query}`,
    },
    publicApis: {
      site: `/api/v1/site?tenant=${tenantSlug}`,
      pages: `/api/v1/pages?tenant=${tenantSlug}`,
      layout: `/api/v1/layout?tenant=${tenantSlug}&page={pageType}`,
      articles: `/api/v1/articles?tenant=${tenantSlug}`,
      search: `/api/v1/search?tenant=${tenantSlug}&q={query}`,
      themeContract: `/api/v1/theme-contract?tenant=${tenantSlug}`,
    },
    publishedLayer: {
      manifest: `sites/${tenantSlug}/manifest.json`,
      settings: `sites/${tenantSlug}/settings.json`,
      menu: `sites/${tenantSlug}/menu.json`,
      posts: `sites/${tenantSlug}/posts.json`,
      search: `sites/${tenantSlug}/search.json`,
      modules: `sites/${tenantSlug}/modules.json`,
      mediaManifest: `sites/${tenantSlug}/media-manifest.json`,
      bannerZones: `sites/${tenantSlug}/banner-zones.json`,
      articlePattern: `sites/${tenantSlug}/articles/{articleSlug}.json`,
      categoryPattern: `sites/${tenantSlug}/categories/{categorySlug}.json`,
      pagePattern: `sites/${tenantSlug}/pages/{pageSlug}.json`,
      recommendedConsumption: "internal_loaders_first",
    },
    nativeLinking: {
      pageHrefPrefix: `/site/${tenantSlug}/`,
      articleHrefPrefix: `/site/${tenantSlug}/articolo/`,
      categoryHrefPrefix: `/site/${tenantSlug}/categoria/`,
      menuSource: "cms.navigation",
      footerSource: "cms.footer",
      rules: [
        "Le pagine CMS vanno linkate usando il loro slug reale pubblicato.",
        "Le categorie vanno linkate usando il pattern /categoria/{categorySlug}.",
        "Gli articoli vanno linkati usando il pattern /articolo/{articleSlug}.",
        "Menu e footer vanno letti dal CMS, non ricostruiti liberamente se il progetto vuole compatibilita` nativa.",
        "Canonical, meta title e meta description devono restare coerenti con i meta della pagina CMS.",
      ],
    },
    seoConventions: {
      sourceOfTruth: [
        "site_pages.meta",
        "articles.meta_title",
        "articles.meta_description",
        "site_config.og_defaults",
      ],
      requiredFields: [
        "meta title",
        "meta description",
        "canonicalPath",
        "Open Graph image quando disponibile",
      ],
      notes: [
        "L'editor desktop puo` proporre SEO e linking, ma il CMS resta il source of truth pubblicato.",
        "Il sito custom deve rispettare le route native del CMS per mantenere breadcrumb, sitemap e linking coerenti.",
      ],
    },
    contentModel: {
      pages: input.pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        isPublished: Boolean(page.is_published),
        updatedAt: page.updated_at ?? null,
        seo: getSeoMeta(page.meta),
      })),
      slots: input.slots.map((slot) => ({
        id: slot.id,
        slotKey: slot.slot_key,
        label: slot.label,
        contentType: slot.content_type,
        categorySlug: slot.categories?.slug ?? null,
        assignmentMode: slot.assignment_mode ?? "auto",
        maxItems: slot.max_items ?? 0,
        placementDurationHours: slot.placement_duration_hours ?? null,
        pageType: slot.layout_templates?.page_type ?? "unknown",
      })),
      categories: input.categories,
    },
    siteConfig: {
      theme: asRecord(input.siteConfig?.theme),
      navigation: asRecord(input.siteConfig?.navigation),
      footer: asRecord(input.siteConfig?.footer),
      faviconUrl: input.siteConfig?.favicon_url ?? null,
      ogDefaults: asRecord(input.siteConfig?.og_defaults),
      globalCss: input.siteConfig?.global_css ?? null,
    },
    themeContract: getThemeContract({ tenantId: input.tenant.id, tenantSlug }),
    aiBuilderBridge: {
      objective:
        "Permettere all'IA desktop di costruire un frontend custom ottimizzato, ma nativamente agganciato al CMS per route, linking, menu, footer, SEO e datasource.",
      hardRules: [
        "Non inventare route diverse da quelle native del CMS senza mapping esplicito.",
        "Non duplicare menu e footer se il CMS li governa gia`.",
        "Usa i datasource e i pattern di linking definiti in questo pack come contratto base.",
        "Considera il CMS la fonte finale dei metadati pubblicati.",
        "Per siti enterprise o VPS separati usa il published layer come sorgente runtime, non API live del CMS.",
      ],
      workflow: [
        "Leggi il site bridge pack.",
        "Costruisci struttura e componenti del frontend desktop usando questo contratto.",
        "Mappa homepage, pagine, articoli e categorie alle route native.",
        "Prepara export e sync in modo che il CMS possa restare il source of truth online.",
        "Consuma moduli, media manifest e banner zones dal published layer con loader interni condivisi.",
      ],
      preferredOutputs: [
        "mappa route -> template",
        "mappa slot -> datasource",
        "schema linking interno",
        "schema SEO e canonical",
        "note di sync verso CMS",
        "mappa modulo -> loader published",
      ],
    },
  };
}
