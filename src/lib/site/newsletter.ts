export interface SiteNewsletterProviderConfig {
  provider: 'custom' | 'mailchimp' | 'brevo' | 'sendgrid' | 'convertkit';
  audienceLabel: string;
  formAction: string;
  webhookUrl: string;
  listId: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  doubleOptIn: boolean;
}

export interface SiteNewsletterSubscriptionFieldOption {
  label: string;
  value: string;
}

export interface SiteNewsletterSubscriptionField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  placeholder: string;
  helpText: string;
  width: 'full' | 'half';
  options: SiteNewsletterSubscriptionFieldOption[];
}

export interface SiteNewsletterDigestConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'custom';
  sendTime: string;
  intro: string;
  categories: string[];
  includeBreaking: boolean;
  includeEvents: boolean;
}

export interface SiteNewsletterPlacementConfig {
  homepage: boolean;
  articleInline: boolean;
  articleFooter: boolean;
  categoryHeader: boolean;
  footer: boolean;
  stickyBar: boolean;
}

export interface SiteNewsletterLeadMagnetConfig {
  enabled: boolean;
  title: string;
  description: string;
}

export interface SiteNewsletterConfig {
  enabled: boolean;
  mode: 'form' | 'provider';
  title: string;
  description: string;
  buttonText: string;
  placeholder: string;
  privacyText: string;
  successMessage: string;
  formSlug: string;
  compact: boolean;
  theme: 'light' | 'dark' | 'accent';
  provider: SiteNewsletterProviderConfig;
  digest: SiteNewsletterDigestConfig;
  placements: SiteNewsletterPlacementConfig;
  leadMagnet: SiteNewsletterLeadMagnetConfig;
  segments: Array<{ label: string; value: string }>;
  subscriptionFields: SiteNewsletterSubscriptionField[];
}

const defaultNewsletterConfig: SiteNewsletterConfig = {
  enabled: true,
  mode: 'form',
  title: 'Resta aggiornato con la newsletter della testata',
  description: 'Le notizie essenziali, i migliori articoli e gli approfondimenti più letti direttamente nella tua inbox.',
  buttonText: 'Iscriviti',
  placeholder: 'Inserisci la tua email',
  privacyText: 'Iscrivendoti accetti informativa privacy e comunicazioni editoriali della testata.',
  successMessage: 'Iscrizione completata. Controlla la tua casella email.',
  formSlug: '',
  compact: false,
  theme: 'light',
  provider: {
    provider: 'custom',
    audienceLabel: 'Lista principale',
    formAction: '',
    webhookUrl: '',
    listId: '',
    senderName: '',
    senderEmail: '',
    replyTo: '',
    doubleOptIn: true,
  },
  digest: {
    enabled: true,
    frequency: 'weekly',
    sendTime: '07:30',
    intro: 'Il meglio della settimana, pronto per l’invio redazionale.',
    categories: [],
    includeBreaking: true,
    includeEvents: false,
  },
  placements: {
    homepage: true,
    articleInline: false,
    articleFooter: true,
    categoryHeader: false,
    footer: true,
    stickyBar: false,
  },
  leadMagnet: {
    enabled: false,
    title: '',
    description: '',
  },
  segments: [],
  subscriptionFields: [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Inserisci la tua email',
      helpText: '',
      width: 'full',
      options: [],
    },
    {
      name: 'privacy_consent',
      label: 'Accetto informativa privacy e comunicazioni editoriali della testata.',
      type: 'checkbox',
      required: true,
      placeholder: '',
      helpText: '',
      width: 'full',
      options: [],
    },
  ],
};

function asObject(input: unknown) {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function asString(value: unknown, fallback = '') {
  return value ? String(value) : fallback;
}

function normalizeSegments(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const label = asString(record.label).trim();
      const value = asString(record.value).trim();
      if (!label && !value) {
        return null;
      }
      return {
        label: label || value || 'Segmento',
        value: value || label || 'segmento',
      };
    })
    .filter((entry): entry is { label: string; value: string } => entry !== null);
}

function normalizeSubscriptionFieldOptions(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const label = asString(record.label).trim();
      const value = asString(record.value).trim();
      if (!label && !value) {
        return null;
      }

      return {
        label: label || value,
        value: value || label,
      };
    })
    .filter((entry): entry is SiteNewsletterSubscriptionFieldOption => entry !== null);
}

function normalizeSubscriptionFields(input: unknown) {
  if (!Array.isArray(input)) {
    return defaultNewsletterConfig.subscriptionFields;
  }

  const supportedTypes = new Set(['text', 'email', 'tel', 'textarea', 'select', 'checkbox']);
  const supportedWidths = new Set(['full', 'half']);

  const fields = input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const rawName = asString(record.name).trim().toLowerCase();
      const safeName = rawName.replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '');
      if (!safeName) {
        return null;
      }

      const rawType = asString(record.type, 'text');
      const type = supportedTypes.has(rawType) ? (rawType as SiteNewsletterSubscriptionField['type']) : 'text';
      const widthValue = asString(record.width, 'full');

      return {
        name: safeName,
        label: asString(record.label, safeName),
        type,
        required: asBoolean(record.required, safeName === 'email'),
        placeholder: asString(record.placeholder),
        helpText: asString(record.helpText),
        width: supportedWidths.has(widthValue) ? (widthValue as SiteNewsletterSubscriptionField['width']) : 'full',
        options: normalizeSubscriptionFieldOptions(record.options),
      };
    })
    .filter((entry): entry is SiteNewsletterSubscriptionField => entry !== null);

  if (!fields.some((field) => field.name === 'email' && field.type === 'email')) {
    return defaultNewsletterConfig.subscriptionFields;
  }

  return fields;
}

export function normalizeNewsletterConfig(input: unknown): SiteNewsletterConfig {
  const footerRecord = asObject(input);
  const legacyNewsletter = asObject(footerRecord.newsletter);
  const settings = asObject(footerRecord.newsletterSettings);
  const provider = asObject(settings.provider);
  const digest = asObject(settings.digest);
  const placements = asObject(settings.placements);
  const leadMagnet = asObject(settings.leadMagnet);

  return {
    enabled: asBoolean(settings.enabled, asBoolean(legacyNewsletter.enabled, defaultNewsletterConfig.enabled)),
    mode: asString(settings.mode, defaultNewsletterConfig.mode) === 'provider' ? 'provider' : 'form',
    title: asString(settings.title, asString(legacyNewsletter.title, defaultNewsletterConfig.title)),
    description: asString(settings.description, asString(legacyNewsletter.description, defaultNewsletterConfig.description)),
    buttonText: asString(settings.buttonText, asString(legacyNewsletter.buttonText, defaultNewsletterConfig.buttonText)),
    placeholder: asString(settings.placeholder, defaultNewsletterConfig.placeholder),
    privacyText: asString(settings.privacyText, defaultNewsletterConfig.privacyText),
    successMessage: asString(settings.successMessage, defaultNewsletterConfig.successMessage),
    formSlug: asString(settings.formSlug, asString(legacyNewsletter.formSlug, defaultNewsletterConfig.formSlug)),
    compact: asBoolean(settings.compact, defaultNewsletterConfig.compact),
    theme: (['light', 'dark', 'accent'].includes(asString(settings.theme)) ? asString(settings.theme) : defaultNewsletterConfig.theme) as SiteNewsletterConfig['theme'],
    provider: {
      provider: (['custom', 'mailchimp', 'brevo', 'sendgrid', 'convertkit'].includes(asString(provider.provider)) ? asString(provider.provider) : defaultNewsletterConfig.provider.provider) as SiteNewsletterProviderConfig['provider'],
      audienceLabel: asString(provider.audienceLabel, defaultNewsletterConfig.provider.audienceLabel),
      formAction: asString(provider.formAction, defaultNewsletterConfig.provider.formAction),
      webhookUrl: asString(provider.webhookUrl, defaultNewsletterConfig.provider.webhookUrl),
      listId: asString(provider.listId, defaultNewsletterConfig.provider.listId),
      senderName: asString(provider.senderName, defaultNewsletterConfig.provider.senderName),
      senderEmail: asString(provider.senderEmail, defaultNewsletterConfig.provider.senderEmail),
      replyTo: asString(provider.replyTo, defaultNewsletterConfig.provider.replyTo),
      doubleOptIn: asBoolean(provider.doubleOptIn, defaultNewsletterConfig.provider.doubleOptIn),
    },
    digest: {
      enabled: asBoolean(digest.enabled, defaultNewsletterConfig.digest.enabled),
      frequency: (['daily', 'weekly', 'custom'].includes(asString(digest.frequency)) ? asString(digest.frequency) : defaultNewsletterConfig.digest.frequency) as SiteNewsletterDigestConfig['frequency'],
      sendTime: asString(digest.sendTime, defaultNewsletterConfig.digest.sendTime),
      intro: asString(digest.intro, defaultNewsletterConfig.digest.intro),
      categories: Array.isArray(digest.categories) ? digest.categories.map((entry) => String(entry)) : defaultNewsletterConfig.digest.categories,
      includeBreaking: asBoolean(digest.includeBreaking, defaultNewsletterConfig.digest.includeBreaking),
      includeEvents: asBoolean(digest.includeEvents, defaultNewsletterConfig.digest.includeEvents),
    },
    placements: {
      homepage: asBoolean(placements.homepage, defaultNewsletterConfig.placements.homepage),
      articleInline: asBoolean(placements.articleInline, defaultNewsletterConfig.placements.articleInline),
      articleFooter: asBoolean(placements.articleFooter, defaultNewsletterConfig.placements.articleFooter),
      categoryHeader: asBoolean(placements.categoryHeader, defaultNewsletterConfig.placements.categoryHeader),
      footer: asBoolean(placements.footer, asBoolean(legacyNewsletter.enabled, defaultNewsletterConfig.placements.footer)),
      stickyBar: asBoolean(placements.stickyBar, defaultNewsletterConfig.placements.stickyBar),
    },
    leadMagnet: {
      enabled: asBoolean(leadMagnet.enabled, defaultNewsletterConfig.leadMagnet.enabled),
      title: asString(leadMagnet.title, defaultNewsletterConfig.leadMagnet.title),
      description: asString(leadMagnet.description, defaultNewsletterConfig.leadMagnet.description),
    },
    segments: normalizeSegments(settings.segments),
    subscriptionFields: normalizeSubscriptionFields(settings.subscriptionFields),
  };
}

export function mergeNewsletterIntoFooter(footerInput: unknown, newsletter: SiteNewsletterConfig) {
  const footerRecord = asObject(footerInput);

  return {
    ...footerRecord,
    newsletter: {
      ...(asObject(footerRecord.newsletter)),
      enabled: newsletter.placements.footer && newsletter.enabled,
      title: newsletter.title,
      description: newsletter.description,
      buttonText: newsletter.buttonText,
      formSlug: newsletter.formSlug,
    },
    newsletterSettings: newsletter,
  };
}
