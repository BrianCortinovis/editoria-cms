export type DeskToggleDefinition<T extends string> = {
  key: T;
  label: string;
  description: string;
};

export type TenantModuleConfig = Record<string, unknown>;

export type JournalistDeskSettings = {
  allowContributorAccess: boolean;
  allowEditorAccess: boolean;
  allowChiefEditorAccess: boolean;
  allowClassicMode: boolean;
  allowAiMode: boolean;
  allowPhotoUpload: boolean;
  allowVideoUpload: boolean;
  allowAudioUpload: boolean;
  allowCategorySelection: boolean;
  allowCoverEdit: boolean;
  allowSendToReview: boolean;
  allowBreakingNewsManagement: boolean;
  showDeskHeader: boolean;
  showProjectsRail: boolean;
  showWorkflowStatus: boolean;
  showModeSwitcher: boolean;
  showFieldKit: boolean;
  showPreviewPane: boolean;
  showActionBar: boolean;
  showBreakingDesk: boolean;
};

export type CommercialDeskSettings = {
  allowAdvertiserAccess: boolean;
  allowAdminAccess: boolean;
  allowChiefEditorAccess: boolean;
  allowEditorAccess: boolean;
  allowBannerManagement: boolean;
  allowAdvertiserManagement: boolean;
  allowRevenueView: boolean;
  allowQuickLinksToCms: boolean;
  showDeskHeader: boolean;
  showKpiOverview: boolean;
  showQuickLinksBar: boolean;
  showSearchBar: boolean;
  showCampaignList: boolean;
  showClientList: boolean;
};

export const DEFAULT_JOURNALIST_DESK_SETTINGS: JournalistDeskSettings = {
  allowContributorAccess: true,
  allowEditorAccess: true,
  allowChiefEditorAccess: true,
  allowClassicMode: true,
  allowAiMode: true,
  allowPhotoUpload: true,
  allowVideoUpload: true,
  allowAudioUpload: true,
  allowCategorySelection: true,
  allowCoverEdit: true,
  allowSendToReview: true,
  allowBreakingNewsManagement: true,
  showDeskHeader: true,
  showProjectsRail: true,
  showWorkflowStatus: true,
  showModeSwitcher: true,
  showFieldKit: true,
  showPreviewPane: true,
  showActionBar: true,
  showBreakingDesk: true,
};

export const DEFAULT_COMMERCIAL_DESK_SETTINGS: CommercialDeskSettings = {
  allowAdvertiserAccess: true,
  allowAdminAccess: true,
  allowChiefEditorAccess: true,
  allowEditorAccess: false,
  allowBannerManagement: true,
  allowAdvertiserManagement: true,
  allowRevenueView: true,
  allowQuickLinksToCms: true,
  showDeskHeader: true,
  showKpiOverview: true,
  showQuickLinksBar: true,
  showSearchBar: true,
  showCampaignList: true,
  showClientList: true,
};

export const JOURNALIST_ACCESS_TOGGLES: DeskToggleDefinition<keyof JournalistDeskSettings>[] = [
  {
    key: 'allowContributorAccess',
    label: 'Accesso collaboratori',
    description: 'Permette a collaboratori e reporter di entrare nella UI dedicata.',
  },
  {
    key: 'allowEditorAccess',
    label: 'Accesso editor',
    description: 'Abilita l accesso operativo agli editor del tenant.',
  },
  {
    key: 'allowChiefEditorAccess',
    label: 'Accesso caporedattori',
    description: 'Lascia usare il desk anche a caporedazione e coordinamento.',
  },
];

export const JOURNALIST_TOOL_TOGGLES: DeskToggleDefinition<keyof JournalistDeskSettings>[] = [
  {
    key: 'allowClassicMode',
    label: 'Scrittura classica',
    description: 'Mostra l editor tradizionale per scrittura manuale del pezzo.',
  },
  {
    key: 'allowAiMode',
    label: 'Articolo con IA',
    description: 'Sblocca il pannello IA per generare la prima bozza dal desk.',
  },
  {
    key: 'allowPhotoUpload',
    label: 'Upload foto',
    description: 'Permette di caricare immagini dal campo direttamente nel progetto.',
  },
  {
    key: 'allowVideoUpload',
    label: 'Upload video',
    description: 'Permette di raccogliere clip video e collegarle all articolo.',
  },
  {
    key: 'allowAudioUpload',
    label: 'Upload audio',
    description: 'Abilita note vocali e interviste audio dal dispositivo.',
  },
  {
    key: 'allowCategorySelection',
    label: 'Scelta categoria',
    description: 'Lascia al giornalista assegnare o cambiare la categoria del pezzo.',
  },
  {
    key: 'allowCoverEdit',
    label: 'Modifica copertina',
    description: 'Mostra il controllo per definire la cover del contenuto.',
  },
  {
    key: 'allowSendToReview',
    label: 'Invio in revisione',
    description: 'Aggiunge il passaggio formale alla review per chi non pubblica.',
  },
  {
    key: 'allowBreakingNewsManagement',
    label: 'Gestione breaking news',
    description: 'Permette di governare ticker e urgenze dal desk redazionale.',
  },
];

export const JOURNALIST_LAYOUT_TOGGLES: DeskToggleDefinition<keyof JournalistDeskSettings>[] = [
  {
    key: 'showDeskHeader',
    label: 'Header desk',
    description: 'Mostra testata, contesto tenant e introduzione operativa.',
  },
  {
    key: 'showProjectsRail',
    label: 'Colonna progetti',
    description: 'Visualizza la rail laterale con bozze, selezione progetto e nuovo articolo.',
  },
  {
    key: 'showWorkflowStatus',
    label: 'Stato workflow',
    description: 'Mostra badge stato articolo e primo publish nel workspace.',
  },
  {
    key: 'showModeSwitcher',
    label: 'Switcher modalita',
    description: 'Permette di alternare scrittura classica e IA dal desk.',
  },
  {
    key: 'showFieldKit',
    label: 'Raccolta campo',
    description: 'Mostra il blocco media con upload, riordino e inserimento nel testo.',
  },
  {
    key: 'showPreviewPane',
    label: 'Preview articolo',
    description: 'Mostra anteprima pubblica con iframe del template reale del sito.',
  },
  {
    key: 'showActionBar',
    label: 'Barra azioni',
    description: 'Mantiene i pulsanti finali di salvataggio, review e publish.',
  },
  {
    key: 'showBreakingDesk',
    label: 'Desk breaking',
    description: 'Visualizza il modulo completo per ticker e breaking news.',
  },
];

export const COMMERCIAL_ACCESS_TOGGLES: DeskToggleDefinition<keyof CommercialDeskSettings>[] = [
  {
    key: 'allowAdvertiserAccess',
    label: 'Accesso commerciale',
    description: 'Permette al ruolo commerciale di usare la shell dedicata.',
  },
  {
    key: 'allowAdminAccess',
    label: 'Accesso admin',
    description: 'Mantiene l accesso operativo anche agli admin del sito.',
  },
  {
    key: 'allowChiefEditorAccess',
    label: 'Accesso caporedattore',
    description: 'Lascia visibile il desk commerciale a caporedazione e coordinamento.',
  },
  {
    key: 'allowEditorAccess',
    label: 'Accesso editor',
    description: 'Apre il desk commerciale anche agli editor del tenant.',
  },
];

export const COMMERCIAL_TOOL_TOGGLES: DeskToggleDefinition<keyof CommercialDeskSettings>[] = [
  {
    key: 'allowBannerManagement',
    label: 'Gestione banner',
    description: 'Sblocca campagne, slot e banner nel desk commerciale.',
  },
  {
    key: 'allowAdvertiserManagement',
    label: 'Gestione clienti',
    description: 'Mostra clienti, contatti e operativita commerciale.',
  },
  {
    key: 'allowRevenueView',
    label: 'Vista conti',
    description: 'Rende disponibili KPI e lettura economica delle campagne.',
  },
  {
    key: 'allowQuickLinksToCms',
    label: 'Link rapidi ai moduli',
    description: 'Aggiunge accessi diretti ai moduli completi del backoffice.',
  },
];

export const COMMERCIAL_LAYOUT_TOGGLES: DeskToggleDefinition<keyof CommercialDeskSettings>[] = [
  {
    key: 'showDeskHeader',
    label: 'Header desk',
    description: 'Mostra introduzione, tenant attivo e contesto della shell commerciale.',
  },
  {
    key: 'showKpiOverview',
    label: 'Panoramica KPI',
    description: 'Visualizza overview numerica con banner, attivi, clienti e CTR medio.',
  },
  {
    key: 'showQuickLinksBar',
    label: 'Barra link rapidi',
    description: 'Mostra collegamenti veloci ai moduli banner, clienti e conti.',
  },
  {
    key: 'showSearchBar',
    label: 'Ricerca veloce',
    description: 'Permette di filtrare clienti e campagne dalla shell commerciale.',
  },
  {
    key: 'showCampaignList',
    label: 'Lista campagne',
    description: 'Visualizza elenco banner, stato campagne e metriche essenziali.',
  },
  {
    key: 'showClientList',
    label: 'Lista clienti',
    description: 'Mostra clienti, contatti e riepilogo dei banner assegnati.',
  },
];

function normalizeBooleanRecord<T extends Record<string, boolean>>(defaults: T, raw: unknown): T {
  if (!raw || typeof raw !== 'object') {
    return { ...defaults };
  }

  const source = raw as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(defaults).map((key) => [
      key,
      typeof source[key] === 'boolean' ? source[key] : defaults[key as keyof T],
    ])
  ) as T;
}

export function normalizeJournalistDeskSettings(raw: unknown): JournalistDeskSettings {
  return normalizeBooleanRecord(DEFAULT_JOURNALIST_DESK_SETTINGS, raw);
}

export function normalizeCommercialDeskSettings(raw: unknown): CommercialDeskSettings {
  return normalizeBooleanRecord(DEFAULT_COMMERCIAL_DESK_SETTINGS, raw);
}

export function getTenantModuleConfig(settings: unknown): TenantModuleConfig {
  if (!settings || typeof settings !== 'object') return {};
  const record = settings as Record<string, unknown>;
  const moduleConfig = record.module_config;
  if (!moduleConfig || typeof moduleConfig !== 'object') return {};
  return moduleConfig as TenantModuleConfig;
}

export function getJournalistDeskSettingsFromTenant(settings: unknown): JournalistDeskSettings {
  const moduleConfig = getTenantModuleConfig(settings);
  return normalizeJournalistDeskSettings(moduleConfig.journalist_desk);
}

export function getCommercialDeskSettingsFromTenant(settings: unknown): CommercialDeskSettings {
  const moduleConfig = getTenantModuleConfig(settings);
  return normalizeCommercialDeskSettings(moduleConfig.commercial_desk);
}
