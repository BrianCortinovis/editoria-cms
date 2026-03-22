export interface SiteFooterLink {
  label: string;
  url: string;
  target?: '_self' | '_blank';
}

export interface SiteFooterColumn {
  title: string;
  text?: string;
  links?: SiteFooterLink[];
}

export interface SiteFooterNewsletter {
  enabled: boolean;
  title?: string;
  description?: string;
  buttonText?: string;
  formSlug?: string;
}

export interface SiteFooterConfig {
  logoUrl?: string;
  description?: string;
  columns: SiteFooterColumn[];
  links: SiteFooterLink[];
  socialLinks: Array<{ platform: string; url: string }>;
  newsletter: SiteFooterNewsletter;
  copyright: string;
}

function normalizeLinks(input: unknown): SiteFooterLink[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map<SiteFooterLink | null>((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const label = String(record.label || '').trim();
      const url = String(record.url || '').trim();

      if (!label && !url) {
        return null;
      }

      return {
        label: label || url || 'Link',
        url: url || '#',
        target: record.target === '_blank' ? '_blank' : '_self',
      };
    })
    .filter((entry): entry is SiteFooterLink => entry !== null);
}

function normalizeColumns(input: unknown): SiteFooterColumn[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map<SiteFooterColumn | null>((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const title = String(record.title || '').trim();
      const text = record.text ? String(record.text) : '';
      const links = normalizeLinks(record.links);

      if (!title && !text && links.length === 0) {
        return null;
      }

      return {
        title: title || 'Colonna',
        text: text || undefined,
        links,
      };
    })
    .filter((entry): entry is SiteFooterColumn => entry !== null);
}

export function normalizeFooterConfig(input: unknown): SiteFooterConfig {
  if (!input || typeof input !== 'object') {
    return {
      logoUrl: '',
      description: '',
      columns: [],
      links: [],
      socialLinks: [],
      newsletter: { enabled: false, title: '', description: '', buttonText: 'Iscriviti', formSlug: '' },
      copyright: '',
    };
  }

  const record = input as Record<string, unknown>;
  const newsletterRecord = (record.newsletter && typeof record.newsletter === 'object')
    ? (record.newsletter as Record<string, unknown>)
    : {};

  return {
    logoUrl: record.logoUrl ? String(record.logoUrl) : '',
    description: record.description ? String(record.description) : '',
    columns: normalizeColumns(record.columns),
    links: normalizeLinks(record.links),
    socialLinks: Array.isArray(record.socialLinks)
      ? record.socialLinks
          .map((entry) => {
            if (!entry || typeof entry !== 'object') {
              return null;
            }
            const item = entry as Record<string, unknown>;
            const platform = String(item.platform || '').trim();
            const url = String(item.url || '').trim();
            if (!platform && !url) {
              return null;
            }
            return { platform: platform || 'social', url: url || '#' };
          })
          .filter((entry): entry is { platform: string; url: string } => entry !== null)
      : [],
    newsletter: {
      enabled: Boolean(newsletterRecord.enabled),
      title: newsletterRecord.title ? String(newsletterRecord.title) : '',
      description: newsletterRecord.description ? String(newsletterRecord.description) : '',
      buttonText: newsletterRecord.buttonText ? String(newsletterRecord.buttonText) : 'Iscriviti',
      formSlug: newsletterRecord.formSlug ? String(newsletterRecord.formSlug) : '',
    },
    copyright: record.copyright ? String(record.copyright) : '',
  };
}
