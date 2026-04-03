import type {
  TenantComplianceServiceKey,
  TenantComplianceServices,
  TenantComplianceServiceSetting,
} from "@/lib/legal/compliance-model";

export interface ComplianceServiceDefinition {
  key: TenantComplianceServiceKey;
  label: string;
  description: string;
  cookieCategory: "technical" | "analytics" | "marketing";
  requiresConsent: boolean;
  defaultProviderName: string;
  privacySection: string[];
  cookieSection: string[];
}

export const COMPLIANCE_SERVICE_DEFINITIONS: ComplianceServiceDefinition[] = [
  {
    key: "contact_forms",
    label: "Form di contatto e richieste",
    description: "Raccolta di dati inviati volontariamente dagli utenti tramite moduli del sito.",
    cookieCategory: "technical",
    requiresConsent: false,
    defaultProviderName: "CMS Forms",
    privacySection: [
      "### Form di contatto",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il servizio consente all'utente di inviare richieste o segnalazioni al titolare.",
      "Dati trattati: nome, email, contenuto del messaggio e metadati tecnici della richiesta.",
      "Base giuridica: esecuzione della richiesta dell'interessato e legittimo interesse organizzativo del titolare.",
    ],
    cookieSection: [
      "### Form di contatto",
      "Categoria: tecnici.",
      "Il modulo puo' usare soli elementi tecnici necessari all'invio della richiesta e alla protezione anti-abuso.",
    ],
  },
  {
    key: "newsletter",
    label: "Newsletter",
    description: "Iscrizione e gestione di invii email editoriali o informative.",
    cookieCategory: "technical",
    requiresConsent: false,
    defaultProviderName: "CMS Newsletter",
    privacySection: [
      "### Newsletter",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il servizio gestisce l'iscrizione a comunicazioni editoriali o informative richieste dall'utente.",
      "Dati trattati: email, eventuale nome, preferenze di iscrizione e log del consenso.",
      "Base giuridica: consenso dell'interessato e adempimenti organizzativi connessi alla gestione dell'iscrizione.",
    ],
    cookieSection: [
      "### Newsletter",
      "Categoria: tecnici.",
      "Eventuali cookie o elementi equivalenti sono limitati al corretto funzionamento del modulo di iscrizione e alla registrazione del consenso.",
    ],
  },
  {
    key: "comments",
    label: "Commenti",
    description: "Pubblicazione e moderazione di commenti degli utenti.",
    cookieCategory: "technical",
    requiresConsent: false,
    defaultProviderName: "CMS Comments",
    privacySection: [
      "### Commenti",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il servizio permette la pubblicazione e la moderazione di commenti o reazioni ai contenuti del sito.",
      "Dati trattati: nome, email, contenuto del commento, indirizzo IP e dati tecnici di sicurezza/moderazione.",
      "Base giuridica: esecuzione del servizio richiesto, legittimo interesse alla moderazione e difesa del titolare.",
    ],
    cookieSection: [
      "### Commenti",
      "Categoria: tecnici.",
      "Il servizio puo' impiegare componenti tecniche strettamente necessarie alla pubblicazione, moderazione e prevenzione spam.",
    ],
  },
  {
    key: "google_analytics",
    label: "Google Analytics",
    description: "Misurazione statistiche e traffico del sito.",
    cookieCategory: "analytics",
    requiresConsent: true,
    defaultProviderName: "Google Analytics",
    privacySection: [
      "### Analytics",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il servizio misura traffico, performance e comportamento di navigazione sul sito.",
      "Dati trattati: identificativi online, dati tecnici del browser/dispositivo, eventi di navigazione e statistiche aggregate.",
      "Base giuridica: consenso dell'interessato, salvo i casi in cui lo strumento sia configurato in modo realmente assimilabile ai tecnici secondo la normativa applicabile.",
    ],
    cookieSection: [
      "### Analytics",
      "Categoria: analytics.",
      "Lo strumento viene attivato solo secondo la configurazione del titolare e, quando richiesto, dopo consenso esplicito dell'utente.",
    ],
  },
  {
    key: "google_tag_manager",
    label: "Google Tag Manager",
    description: "Caricamento controllato di script e tag di terze parti.",
    cookieCategory: "marketing",
    requiresConsent: true,
    defaultProviderName: "Google Tag Manager",
    privacySection: [
      "### Tag manager",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il servizio gestisce il caricamento condizionato di script e tag di terze parti.",
      "Dati trattati: dati tecnici di navigazione e informazioni necessarie all'esecuzione dei tag configurati dal titolare.",
      "Base giuridica: consenso dell'interessato quando i tag caricati non rientrano tra i soli strumenti tecnici necessari.",
    ],
    cookieSection: [
      "### Tag manager",
      "Categoria: marketing/terze parti.",
      "Il tag manager e i relativi tag non tecnici vengono eseguiti solo dopo consenso.",
    ],
  },
  {
    key: "google_adsense",
    label: "Google AdSense",
    description: "Erogazione annunci pubblicitari e misurazioni collegate.",
    cookieCategory: "marketing",
    requiresConsent: true,
    defaultProviderName: "Google AdSense",
    privacySection: [
      "### Advertising",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il servizio eroga annunci pubblicitari e puo' trattare dati di navigazione per misurazione o personalizzazione, secondo la configurazione del titolare.",
      "Dati trattati: identificativi online, dati tecnici, informazioni sugli annunci visualizzati/interagiti.",
      "Base giuridica: consenso dell'interessato per cookie o strumenti di profilazione/marketing.",
    ],
    cookieSection: [
      "### Advertising",
      "Categoria: marketing/profilazione.",
      "Gli script pubblicitari non tecnici vengono caricati solo dopo accettazione dell'utente.",
    ],
  },
  {
    key: "youtube_embeds",
    label: "Embed video YouTube",
    description: "Riproduzione di video incorporati nel sito.",
    cookieCategory: "marketing",
    requiresConsent: true,
    defaultProviderName: "YouTube",
    privacySection: [
      "### Video incorporati",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il servizio consente la riproduzione di contenuti video ospitati da terze parti.",
      "Dati trattati: dati tecnici di connessione, informazioni sul dispositivo e dati di fruizione del contenuto video.",
      "Base giuridica: consenso quando l'embed comporta strumenti di tracciamento non tecnici.",
    ],
    cookieSection: [
      "### Video incorporati",
      "Categoria: marketing/terze parti.",
      "Gli embed che comportano chiamate o cookie non tecnici verso la piattaforma video sono attivati solo dopo consenso.",
    ],
  },
  {
    key: "social_embeds",
    label: "Social embed e widget",
    description: "Contenuti incorporati o pulsanti social di terze parti.",
    cookieCategory: "marketing",
    requiresConsent: true,
    defaultProviderName: "Social media embeds",
    privacySection: [
      "### Social embed e widget",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il sito puo' incorporare contenuti, widget o pulsanti provenienti da piattaforme social esterne.",
      "Dati trattati: dati tecnici di connessione, interazioni con il widget e identificativi online gestiti dalla piattaforma terza.",
      "Base giuridica: consenso dell'interessato quando il widget attiva strumenti non tecnici o tracking di terza parte.",
    ],
    cookieSection: [
      "### Social embed e widget",
      "Categoria: marketing/terze parti.",
      "I componenti social non tecnici vengono caricati solo dopo consenso.",
    ],
  },
  {
    key: "payments",
    label: "Pagamenti online",
    description: "Gestione di checkout, pagamenti o abbonamenti.",
    cookieCategory: "technical",
    requiresConsent: false,
    defaultProviderName: "Stripe",
    privacySection: [
      "### Pagamenti",
      "Provider/Tecnologia: {{provider_name}}.",
      "Il servizio consente la gestione di pagamenti, checkout o abbonamenti online.",
      "Dati trattati: dati identificativi, dati di transazione, importo, stato pagamento e metadati antifrode; i dati di carta sono gestiti dal prestatore di pagamento secondo i propri standard.",
      "Base giuridica: esecuzione del contratto o di misure precontrattuali richieste dall'interessato, oltre a obblighi di legge contabili/fiscali.",
    ],
    cookieSection: [
      "### Pagamenti",
      "Categoria: tecnici.",
      "Possono essere usati componenti tecniche strettamente necessarie a checkout, sicurezza della transazione e prevenzione frodi.",
    ],
  },
];

export function getComplianceServiceDefinition(key: TenantComplianceServiceKey) {
  return COMPLIANCE_SERVICE_DEFINITIONS.find((entry) => entry.key === key) || null;
}

export function listEnabledComplianceServices(services: TenantComplianceServices) {
  return COMPLIANCE_SERVICE_DEFINITIONS.filter((definition) => services[definition.key]?.enabled);
}

export function resolveServiceProviderName(
  definition: ComplianceServiceDefinition,
  serviceSetting: TenantComplianceServiceSetting | undefined
) {
  return serviceSetting?.providerName?.trim() || definition.defaultProviderName;
}
