export type SocialPlatformKey =
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'x'
  | 'telegram'
  | 'linkedin'
  | 'whatsapp'
  | 'pinterest'
  | 'reddit'
  | 'mastodon'
  | 'bluesky'
  | 'youtube'
  | 'tiktok';

export interface SocialPlatformSpec {
  key: SocialPlatformKey;
  label: string;
  description: string;
  supportsShareIntent: boolean;
  supportsDirectApi: boolean;
  requiresBusiness: boolean;
  supportsWebhook: boolean;
  primaryFieldLabel: string;
  primaryFieldPlaceholder: string;
  secondaryFieldLabel: string;
  secondaryFieldPlaceholder: string;
}

export interface SocialChannelConfig {
  enabled: boolean;
  primaryValue: string;
  secondaryValue: string;
  webhookUrl: string;
  accessToken: string;
}

export interface SocialAutoConfig {
  siteUrl: string;
  defaultHashtags: string;
  autoGenerateText: boolean;
  publishOnApproval: boolean;
  openShareAfterGenerate: boolean;
  channels: Record<SocialPlatformKey, SocialChannelConfig>;
}

export const SOCIAL_PLATFORMS: SocialPlatformSpec[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    description: 'Pagine Facebook, condivisione link e pubblicazione pagina via API Meta.',
    supportsShareIntent: true,
    supportsDirectApi: true,
    requiresBusiness: true,
    supportsWebhook: true,
    primaryFieldLabel: 'Page ID / URL pagina',
    primaryFieldPlaceholder: 'https://facebook.com/nometestata oppure Page ID',
    secondaryFieldLabel: 'Business App ID',
    secondaryFieldPlaceholder: 'App Meta / Business ID',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'Account business, publish mediato da API Meta con asset immagine/video.',
    supportsShareIntent: false,
    supportsDirectApi: true,
    requiresBusiness: true,
    supportsWebhook: true,
    primaryFieldLabel: 'Account ID / profilo',
    primaryFieldPlaceholder: '@nometestata oppure Instagram Account ID',
    secondaryFieldLabel: 'Business App ID',
    secondaryFieldPlaceholder: 'App Meta / Business ID',
  },
  {
    key: 'threads',
    label: 'Threads',
    description: 'Compatibilità editoriale per copy e collegamento account Meta/Threads.',
    supportsShareIntent: false,
    supportsDirectApi: false,
    requiresBusiness: true,
    supportsWebhook: false,
    primaryFieldLabel: 'Profilo / handle',
    primaryFieldPlaceholder: '@nometestata',
    secondaryFieldLabel: 'Note canale',
    secondaryFieldPlaceholder: 'Workflow interno o future API',
  },
  {
    key: 'x',
    label: 'X / Twitter',
    description: 'Tweet, thread e compatibilità con intent web o API X.',
    supportsShareIntent: true,
    supportsDirectApi: true,
    requiresBusiness: false,
    supportsWebhook: false,
    primaryFieldLabel: 'Handle account',
    primaryFieldPlaceholder: '@nometestata',
    secondaryFieldLabel: 'API Project / client',
    secondaryFieldPlaceholder: 'Project ID o client app',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    description: 'Canali Telegram via bot oppure share diretta a canale/gruppo.',
    supportsShareIntent: true,
    supportsDirectApi: true,
    requiresBusiness: false,
    supportsWebhook: true,
    primaryFieldLabel: 'Canale / chat ID',
    primaryFieldPlaceholder: '@nometestata o chat_id',
    secondaryFieldLabel: 'Bot username',
    secondaryFieldPlaceholder: '@nomebot',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'Pagina aziendale, condivisione link e compatibilità per API pagina.',
    supportsShareIntent: true,
    supportsDirectApi: true,
    requiresBusiness: true,
    supportsWebhook: false,
    primaryFieldLabel: 'Company Page URL / ID',
    primaryFieldPlaceholder: 'https://linkedin.com/company/... oppure organization ID',
    secondaryFieldLabel: 'App client ID',
    secondaryFieldPlaceholder: 'Client ID LinkedIn',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    description: 'Condivisione rapida link e compatibilità con WhatsApp Business.',
    supportsShareIntent: true,
    supportsDirectApi: true,
    requiresBusiness: true,
    supportsWebhook: true,
    primaryFieldLabel: 'Numero business / link',
    primaryFieldPlaceholder: '+39... oppure link canale',
    secondaryFieldLabel: 'Phone number ID',
    secondaryFieldPlaceholder: 'WhatsApp Business phone number ID',
  },
  {
    key: 'pinterest',
    label: 'Pinterest',
    description: 'Pins da immagini e articoli, utile per contenuti evergreen.',
    supportsShareIntent: true,
    supportsDirectApi: true,
    requiresBusiness: false,
    supportsWebhook: false,
    primaryFieldLabel: 'Board / profilo',
    primaryFieldPlaceholder: 'Board URL o handle Pinterest',
    secondaryFieldLabel: 'Board ID',
    secondaryFieldPlaceholder: 'ID board o note operative',
  },
  {
    key: 'reddit',
    label: 'Reddit',
    description: 'Compatibilità per subreddit e condivisione link.',
    supportsShareIntent: true,
    supportsDirectApi: true,
    requiresBusiness: false,
    supportsWebhook: false,
    primaryFieldLabel: 'Subreddit / community',
    primaryFieldPlaceholder: 'r/news o community target',
    secondaryFieldLabel: 'Client app',
    secondaryFieldPlaceholder: 'App Reddit / note',
  },
  {
    key: 'mastodon',
    label: 'Mastodon',
    description: 'Istanza federata, posting via token personale o app.',
    supportsShareIntent: false,
    supportsDirectApi: true,
    requiresBusiness: false,
    supportsWebhook: false,
    primaryFieldLabel: 'Profilo / istanza',
    primaryFieldPlaceholder: '@testata@istanza.social',
    secondaryFieldLabel: 'Base URL istanza',
    secondaryFieldPlaceholder: 'https://istanza.social',
  },
  {
    key: 'bluesky',
    label: 'Bluesky',
    description: 'Compatibilità con handle ATProto e future automazioni dedicate.',
    supportsShareIntent: false,
    supportsDirectApi: true,
    requiresBusiness: false,
    supportsWebhook: false,
    primaryFieldLabel: 'Handle Bluesky',
    primaryFieldPlaceholder: 'testata.bsky.social',
    secondaryFieldLabel: 'DID / app password',
    secondaryFieldPlaceholder: 'DID o nota tecnica',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    description: 'Community post e supporto per video/redazione broadcast.',
    supportsShareIntent: false,
    supportsDirectApi: true,
    requiresBusiness: true,
    supportsWebhook: false,
    primaryFieldLabel: 'Canale YouTube',
    primaryFieldPlaceholder: 'https://youtube.com/@canale oppure channel ID',
    secondaryFieldLabel: 'Google project',
    secondaryFieldPlaceholder: 'Project/client ID',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    description: 'Compatibilità per workflow video short e future API creator/business.',
    supportsShareIntent: false,
    supportsDirectApi: true,
    requiresBusiness: true,
    supportsWebhook: false,
    primaryFieldLabel: 'Profilo TikTok',
    primaryFieldPlaceholder: '@nometestata',
    secondaryFieldLabel: 'App client',
    secondaryFieldPlaceholder: 'Client key / app',
  },
];

function emptyChannel(): SocialChannelConfig {
  return {
    enabled: false,
    primaryValue: '',
    secondaryValue: '',
    webhookUrl: '',
    accessToken: '',
  };
}

export function getDefaultSocialAutoConfig(): SocialAutoConfig {
  return {
    siteUrl: '',
    defaultHashtags: '',
    autoGenerateText: true,
    publishOnApproval: false,
    openShareAfterGenerate: false,
    channels: SOCIAL_PLATFORMS.reduce(
      (acc, platform) => {
        acc[platform.key] = emptyChannel();
        return acc;
      },
      {} as Record<SocialPlatformKey, SocialChannelConfig>
    ),
  };
}

export function normalizeSocialAutoConfig(input: unknown): SocialAutoConfig {
  const defaults = getDefaultSocialAutoConfig();
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const rawChannels =
    record.channels && typeof record.channels === 'object'
      ? (record.channels as Record<string, unknown>)
      : {};

  const channels = SOCIAL_PLATFORMS.reduce(
    (acc, platform) => {
      const raw = rawChannels[platform.key];
      const channel = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
      acc[platform.key] = {
        enabled: Boolean(channel.enabled),
        primaryValue: typeof channel.primaryValue === 'string' ? channel.primaryValue : '',
        secondaryValue: typeof channel.secondaryValue === 'string' ? channel.secondaryValue : '',
        webhookUrl: typeof channel.webhookUrl === 'string' ? channel.webhookUrl : '',
        accessToken: typeof channel.accessToken === 'string' ? channel.accessToken : '',
      };
      return acc;
    },
    {} as Record<SocialPlatformKey, SocialChannelConfig>
  );

  return {
    siteUrl: typeof record.siteUrl === 'string' ? record.siteUrl : defaults.siteUrl,
    defaultHashtags: typeof record.defaultHashtags === 'string' ? record.defaultHashtags : defaults.defaultHashtags,
    autoGenerateText: typeof record.autoGenerateText === 'boolean' ? record.autoGenerateText : defaults.autoGenerateText,
    publishOnApproval: typeof record.publishOnApproval === 'boolean' ? record.publishOnApproval : defaults.publishOnApproval,
    openShareAfterGenerate: typeof record.openShareAfterGenerate === 'boolean' ? record.openShareAfterGenerate : defaults.openShareAfterGenerate,
    channels,
  };
}

export function buildSocialShareUrl(
  platform: SocialPlatformKey,
  payload: { url: string; title: string; text: string }
): string | null {
  const encodedUrl = encodeURIComponent(payload.url);
  const encodedTitle = encodeURIComponent(payload.title);
  const encodedText = encodeURIComponent(payload.text || payload.title);

  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${payload.text} ${payload.url}`)}`;
    case 'pinterest':
      return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
    case 'reddit':
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    default:
      return null;
  }
}
