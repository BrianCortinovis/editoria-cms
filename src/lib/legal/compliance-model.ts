export interface TenantComplianceContacts {
  companyName: string;
  contactEmail: string;
  privacyEmail: string;
  legalAddress: string;
  vatNumber: string;
  dpoEmail: string;
}

export type TenantComplianceServiceKey =
  | "contact_forms"
  | "newsletter"
  | "comments"
  | "google_analytics"
  | "google_tag_manager"
  | "google_adsense"
  | "youtube_embeds"
  | "social_embeds"
  | "payments";

export interface TenantComplianceServiceSetting {
  enabled: boolean;
  providerName: string;
  notes: string;
}

export type TenantComplianceServices = Record<TenantComplianceServiceKey, TenantComplianceServiceSetting>;

export function getDefaultTenantComplianceServices(): TenantComplianceServices {
  return {
    contact_forms: { enabled: false, providerName: "CMS Forms", notes: "" },
    newsletter: { enabled: false, providerName: "CMS Newsletter", notes: "" },
    comments: { enabled: false, providerName: "CMS Comments", notes: "" },
    google_analytics: { enabled: false, providerName: "Google Analytics", notes: "" },
    google_tag_manager: { enabled: false, providerName: "Google Tag Manager", notes: "" },
    google_adsense: { enabled: false, providerName: "Google AdSense", notes: "" },
    youtube_embeds: { enabled: false, providerName: "YouTube", notes: "" },
    social_embeds: { enabled: false, providerName: "Social media embeds", notes: "" },
    payments: { enabled: false, providerName: "Stripe", notes: "" },
  };
}
