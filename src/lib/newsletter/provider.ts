import type { NewsletterCampaignRecord, NewsletterPreviewResult } from "@/lib/newsletter/module";
import type { SiteNewsletterConfig } from "@/lib/site/newsletter";

export interface NewsletterProviderDescriptor {
  id: SiteNewsletterConfig["provider"]["provider"];
  label: string;
  summary: string;
  checklist: string[];
}

const PROVIDER_DESCRIPTORS: Record<SiteNewsletterConfig["provider"]["provider"], NewsletterProviderDescriptor> = {
  custom: {
    id: "custom",
    label: "Provider custom",
    summary: "Usa il CMS come composer e passa HTML, testo e metadata a un flusso esterno personalizzato.",
    checklist: [
      "Configura un endpoint o un operatore che riceva il payload campagna dal CMS.",
      "Gestisci unsubscribe, bounce e suppression list fuori dal CMS.",
      "Tieni il list management nel sistema email esterno, non in Supabase.",
    ],
  },
  brevo: {
    id: "brevo",
    label: "Brevo",
    summary: "Buon fit per campagne editoriali e automazioni leggere con liste e transactional email nello stesso provider.",
    checklist: [
      "Salva `listId`, sender e webhook nel modulo newsletter del sito.",
      "Invia dal CMS solo payload e scheduling, non i contatti reali.",
      "Usa i webhook provider per riportare sent, bounce e unsubscribe.",
    ],
  },
  mailchimp: {
    id: "mailchimp",
    label: "Mailchimp",
    summary: "Adatto se vuoi una libreria template forte e audience gia` presenti su Mailchimp.",
    checklist: [
      "Mappa l'audience del CMS a una audience Mailchimp stabile.",
      "Mantieni segmenti complessi direttamente nel provider.",
      "Usa il CMS come composer editoriale e Mailchimp come delivery/reporting.",
    ],
  },
  sendgrid: {
    id: "sendgrid",
    label: "SendGrid",
    summary: "Più tecnico, utile quando vuoi controllare pipeline, API e delivery in modo molto esplicito.",
    checklist: [
      "Prepara un adapter che trasformi il payload CMS in Mail Send o Marketing Campaign.",
      "Gestisci suppression e tracking nel tenant SendGrid.",
      "Tieni il template HTML generato dal CMS come sorgente campagna.",
    ],
  },
  convertkit: {
    id: "convertkit",
    label: "ConvertKit",
    summary: "Buono per prodotti editoriali email-first con segmenti e funnel semplici.",
    checklist: [
      "Lascia forms, sequence e subscriber state nel provider.",
      "Usa il CMS per decidere contenuti, subject e composizione dei blocchi.",
      "Sincronizza solo metadati campagna e stato invio nel CMS.",
    ],
  },
};

export function getNewsletterProviderDescriptor(provider: SiteNewsletterConfig["provider"]["provider"]) {
  return PROVIDER_DESCRIPTORS[provider] || PROVIDER_DESCRIPTORS.custom;
}

export function buildNewsletterProviderHandoff(
  config: SiteNewsletterConfig,
  campaign: NewsletterCampaignRecord,
  preview: NewsletterPreviewResult,
) {
  const descriptor = getNewsletterProviderDescriptor(campaign.provider || config.provider.provider);

  return {
    provider: descriptor,
    deliveryModel: "external_provider",
    recommendedFlow: [
      "Il CMS compone contenuti, subject e preview.",
      "Il provider esterno gestisce audience, invio, unsubscribe e analytics.",
      "Supabase resta limitato ad auth, config e stato base del modulo.",
    ],
    payload: preview.providerPayload,
  };
}
