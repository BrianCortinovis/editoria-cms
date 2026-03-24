export interface ThemeDataSourceContract {
  id: string;
  label: string;
  endpoint: string;
  method: 'GET' | 'POST';
  description: string;
  requiredParams?: string[];
  optionalParams?: string[];
  cacheHint?: string;
}

export interface ThemeRouteContract {
  id: string;
  path: string;
  kind: 'homepage' | 'page' | 'article' | 'category' | 'search';
  description: string;
  requiredDataSources: string[];
}

export interface ThemeSectionRoleContract {
  id: string;
  label: string;
  description: string;
  suggestedBlockTypes: string[];
  suggestedDataSources?: string[];
}

export interface ThemeContract {
  version: string;
  mode: 'headless-theme' | 'hybrid-theme';
  summary: string;
  tenant: {
    slug?: string | null;
    id?: string | null;
  };
  routes: ThemeRouteContract[];
  dataSources: ThemeDataSourceContract[];
  sectionRoles: ThemeSectionRoleContract[];
  builderCompatibility: {
    supported: boolean;
    notes: string[];
  };
  developmentWorkflow: string[];
}

export const BASE_THEME_CONTRACT: ThemeContract = {
  version: '1.0.0',
  mode: 'hybrid-theme',
  summary:
    'Contratto standard per costruire un frontend custom pienamente compatibile con il CMS editoriale. Il tema può essere totalmente custom ma deve agganciarsi a queste route e sezioni.',
  tenant: {
    slug: null,
    id: null,
  },
  routes: [
    {
      id: 'homepage',
      path: '/site/[tenant]',
      kind: 'homepage',
      description: 'Homepage pubblica della testata.',
      requiredDataSources: ['site-config', 'layout-homepage'],
    },
    {
      id: 'custom-page',
      path: '/site/[tenant]/[...slug]',
      kind: 'page',
      description: 'Pagine CMS pubblicate con blocchi o tema custom.',
      requiredDataSources: ['site-config', 'pages'],
    },
    {
      id: 'article-detail',
      path: '/site/[tenant]/articolo/[articleSlug]',
      kind: 'article',
      description: 'Dettaglio articolo editoriale.',
      requiredDataSources: ['site-config', 'article-detail', 'article-related'],
    },
    {
      id: 'category-archive',
      path: '/site/[tenant]/categoria/[categorySlug]',
      kind: 'category',
      description: 'Archivio categoria pubblica.',
      requiredDataSources: ['site-config', 'category-archive'],
    },
    {
      id: 'search',
      path: '/site/[tenant]/search',
      kind: 'search',
      description: 'Ricerca pubblica del sito.',
      requiredDataSources: ['site-config', 'search'],
    },
  ],
  dataSources: [
    {
      id: 'site-config',
      label: 'Config sito',
      endpoint: '/api/v1/site?tenant={tenantSlug}',
      method: 'GET',
      description: 'Tema, navigazione, footer, favicon, OG defaults e global CSS.',
      requiredParams: ['tenantSlug'],
      cacheHint: '300s public',
    },
    {
      id: 'pages',
      label: 'Pagine pubblicate',
      endpoint: '/api/v1/pages?tenant={tenantSlug}',
      method: 'GET',
      description: 'Pagine CMS pubblicate con blocchi e meta.',
      requiredParams: ['tenantSlug'],
      cacheHint: '300s public',
    },
    {
      id: 'layout-homepage',
      label: 'Layout homepage',
      endpoint: '/api/v1/layout?tenant={tenantSlug}&page=homepage',
      method: 'GET',
      description: 'Slot homepage con contenuti già aggregati.',
      requiredParams: ['tenantSlug'],
      cacheHint: '60s public',
    },
    {
      id: 'article-list',
      label: 'Lista articoli',
      endpoint: '/api/v1/articles?tenant={tenantSlug}',
      method: 'GET',
      description: 'Elenco articoli pubblici.',
      requiredParams: ['tenantSlug'],
      optionalParams: ['category', 'limit', 'page'],
      cacheHint: '60-300s public',
    },
    {
      id: 'article-detail',
      label: 'Dettaglio articolo',
      endpoint: '/api/v1/articles/{slug}?tenant={tenantSlug}',
      method: 'GET',
      description: 'Articolo singolo con contenuto e SEO.',
      requiredParams: ['tenantSlug', 'slug'],
      cacheHint: '60-300s public',
    },
    {
      id: 'article-related',
      label: 'Articoli correlati',
      endpoint: '/api/v1/articles/{slug}/related?tenant={tenantSlug}',
      method: 'GET',
      description: 'Correlati del dettaglio articolo.',
      requiredParams: ['tenantSlug', 'slug'],
      cacheHint: '60-300s public',
    },
    {
      id: 'category-archive',
      label: 'Archivio categoria',
      endpoint: '/site/{tenantSlug}/categoria/{categorySlug}',
      method: 'GET',
      description: 'Route pagina categoria, utile come contratto di navigazione tema.',
      requiredParams: ['tenantSlug', 'categorySlug'],
    },
    {
      id: 'search',
      label: 'Ricerca sito',
      endpoint: '/api/v1/search?tenant={tenantSlug}&q={query}',
      method: 'GET',
      description: 'Ricerca pubblica semplice o semantica.',
      requiredParams: ['tenantSlug', 'query'],
      optionalParams: ['mode'],
      cacheHint: 'short public / no-store when needed',
    },
  ],
  sectionRoles: [
    {
      id: 'hero',
      label: 'Hero',
      description: 'Blocco apertura principale pagina.',
      suggestedBlockTypes: ['hero', 'article-hero', 'video'],
      suggestedDataSources: ['layout-homepage', 'article-detail'],
    },
    {
      id: 'breaking',
      label: 'Breaking / ticker',
      description: 'Fascia live, breaking news o alert.',
      suggestedBlockTypes: ['breaking-ticker', 'text', 'section'],
      suggestedDataSources: ['layout-homepage'],
    },
    {
      id: 'content-grid',
      label: 'Grid contenuti',
      description: 'Griglia articoli o moduli editoriali.',
      suggestedBlockTypes: ['article-grid', 'related-content', 'columns'],
      suggestedDataSources: ['layout-homepage', 'article-list'],
    },
    {
      id: 'sidebar',
      label: 'Sidebar',
      description: 'Rail laterale con supporti editoriali o moduli.',
      suggestedBlockTypes: ['sidebar', 'banner-zone', 'newsletter-signup', 'search-bar'],
      suggestedDataSources: ['layout-homepage'],
    },
    {
      id: 'footer',
      label: 'Footer',
      description: 'Chiusura con menu, link, copyright e social.',
      suggestedBlockTypes: ['footer'],
      suggestedDataSources: ['site-config'],
    },
  ],
  builderCompatibility: {
    supported: true,
    notes: [
      'Il tema custom puo usare il builder solo per pagine speciali o landing.',
      'Le sezioni layoutAssignment dei blocchi sono pensate per mappare le aree del tema custom.',
      'Il tema puo ignorare il renderer visuale del builder e usare solo i datasource del CMS.',
    ],
  },
  developmentWorkflow: [
    'Leggi prima questo contract e, se presente, il file theme.contract.json del progetto.',
    'Scopri tenant, pagine e moduli usando /api/v1/commands o le API pubbliche.',
    'Costruisci un frontend custom con componenti mappati ai section roles.',
    'Mantieni header, footer, homepage slots, articolo e categoria agganciati alle route standard.',
    'Usa il builder solo per pagine speciali o aree che il cliente vuole gestire visualmente.',
  ],
};

export function getThemeContract(input?: { tenantSlug?: string | null; tenantId?: string | null }): ThemeContract {
  return {
    ...BASE_THEME_CONTRACT,
    tenant: {
      slug: input?.tenantSlug ?? null,
      id: input?.tenantId ?? null,
    },
  };
}
