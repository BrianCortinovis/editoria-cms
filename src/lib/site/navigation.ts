export interface SiteMenuItem {
  id?: string;
  label: string;
  url: string;
  description?: string;
  target?: '_self' | '_blank';
  sourceType?: 'custom' | 'page' | 'category' | 'tag' | 'article';
  sourceId?: string;
  children?: SiteMenuItem[];
}

export interface SiteNavigationConfig {
  primary: SiteMenuItem[];
  secondary: SiteMenuItem[];
  mobile: SiteMenuItem[];
  footer: SiteMenuItem[];
}

export type SiteMenuKey = keyof SiteNavigationConfig;

function normalizeMenuItems(input: unknown): SiteMenuItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map<SiteMenuItem | null>((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      const label = String(record.label || '').trim();
      const url = String(record.url || '').trim();

      if (!label && !url) {
        return null;
      }

      return {
        id: record.id ? String(record.id) : undefined,
        label: label || url || 'Voce menu',
        url: url || '#',
        description: record.description ? String(record.description) : undefined,
        target: record.target === '_blank' ? '_blank' : '_self',
        sourceType: ['custom', 'page', 'category', 'tag', 'article'].includes(String(record.sourceType || ''))
          ? (record.sourceType as SiteMenuItem['sourceType'])
          : undefined,
        sourceId: record.sourceId ? String(record.sourceId) : undefined,
        children: normalizeMenuItems(record.children),
      } satisfies SiteMenuItem;
    })
    .filter((item): item is SiteMenuItem => item !== null);
}

export function normalizeNavigationConfig(input: unknown): SiteNavigationConfig {
  if (Array.isArray(input)) {
    return {
      primary: normalizeMenuItems(input),
      secondary: [],
      mobile: [],
      footer: [],
    };
  }

  if (!input || typeof input !== 'object') {
    return {
      primary: [],
      secondary: [],
      mobile: [],
      footer: [],
    };
  }

  const record = input as Record<string, unknown>;

  return {
    primary: normalizeMenuItems(record.primary),
    secondary: normalizeMenuItems(record.secondary),
    mobile: normalizeMenuItems(record.mobile),
    footer: normalizeMenuItems(record.footer),
  };
}

export function getNavigationMenu(input: unknown, menuKey: SiteMenuKey = 'primary'): SiteMenuItem[] {
  const config = normalizeNavigationConfig(input);
  return config[menuKey] || [];
}
