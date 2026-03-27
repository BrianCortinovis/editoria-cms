import { mergeNewsletterIntoFooter, type SiteNewsletterConfig } from "@/lib/site/newsletter";

export type NewsletterCampaignStatus = "draft" | "scheduled" | "ready" | "sent";
export type NewsletterTemplateKey = "digest" | "breaking" | "feature";

export interface NewsletterCampaignRecord {
  id: string;
  title: string;
  subject: string;
  preheader: string;
  intro: string;
  featuredArticleId: string | null;
  articleIds: string[];
  status: NewsletterCampaignStatus;
  audienceLabel: string;
  provider: SiteNewsletterConfig["provider"]["provider"];
  templateKey: NewsletterTemplateKey;
  scheduledAt: string | null;
  sentAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterTemplateRecord {
  key: NewsletterTemplateKey;
  label: string;
  description: string;
}

export interface NewsletterModuleState {
  campaigns: NewsletterCampaignRecord[];
  templates: NewsletterTemplateRecord[];
}

export interface NewsletterPreviewArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

export interface NewsletterPreviewResult {
  html: string;
  text: string;
  providerPayload: Record<string, unknown>;
}

const DEFAULT_TEMPLATES: NewsletterTemplateRecord[] = [
  {
    key: "digest",
    label: "Digest editoriale",
    description: "Raccolta ordinata delle storie principali con intro e blocco articoli.",
  },
  {
    key: "breaking",
    label: "Breaking update",
    description: "Issue breve per invii urgenti con focus su un articolo guida.",
  },
  {
    key: "feature",
    label: "Feature curata",
    description: "Newsletter piu` magazine, con storia principale e selezione editoriale.",
  },
];

function asObject(input: unknown) {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function asString(input: unknown, fallback = "") {
  return typeof input === "string" ? input : fallback;
}

function asStringArray(input: unknown) {
  return Array.isArray(input) ? input.map((item) => String(item)).filter(Boolean) : [];
}

function normalizeCampaign(input: unknown): NewsletterCampaignRecord | null {
  const record = asObject(input);
  const id = asString(record.id).trim();
  if (!id) return null;

  const templateKey = asString(record.templateKey, "digest");
  const status = asString(record.status, "draft");

  return {
    id,
    title: asString(record.title, "Nuova campagna"),
    subject: asString(record.subject, ""),
    preheader: asString(record.preheader, ""),
    intro: asString(record.intro, ""),
    featuredArticleId: asString(record.featuredArticleId, "") || null,
    articleIds: asStringArray(record.articleIds),
    status: ["draft", "scheduled", "ready", "sent"].includes(status) ? (status as NewsletterCampaignStatus) : "draft",
    audienceLabel: asString(record.audienceLabel, "Lista principale"),
    provider: ["custom", "mailchimp", "brevo", "sendgrid", "convertkit"].includes(asString(record.provider))
      ? (asString(record.provider) as SiteNewsletterConfig["provider"]["provider"])
      : "custom",
    templateKey: ["digest", "breaking", "feature"].includes(templateKey) ? (templateKey as NewsletterTemplateKey) : "digest",
    scheduledAt: asString(record.scheduledAt, "") || null,
    sentAt: asString(record.sentAt, "") || null,
    notes: asString(record.notes, ""),
    createdAt: asString(record.createdAt, new Date().toISOString()),
    updatedAt: asString(record.updatedAt, new Date().toISOString()),
  };
}

export function normalizeNewsletterModule(footerInput: unknown): NewsletterModuleState {
  const footer = asObject(footerInput);
  const moduleRecord = asObject(footer.newsletterModule);
  const templates = Array.isArray(moduleRecord.templates)
    ? (moduleRecord.templates as unknown[]).map((entry) => {
        const record = asObject(entry);
        const key = asString(record.key);
        if (!["digest", "breaking", "feature"].includes(key)) return null;
        return {
          key: key as NewsletterTemplateKey,
          label: asString(record.label, key),
          description: asString(record.description, ""),
        };
      }).filter((entry): entry is NewsletterTemplateRecord => entry !== null)
    : DEFAULT_TEMPLATES;

  const campaigns = Array.isArray(moduleRecord.campaigns)
    ? moduleRecord.campaigns.map(normalizeCampaign).filter((entry): entry is NewsletterCampaignRecord => entry !== null)
    : [];

  return {
    templates: templates.length > 0 ? templates : DEFAULT_TEMPLATES,
    campaigns: campaigns.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

export function mergeNewsletterModuleIntoFooter(footerInput: unknown, moduleState: NewsletterModuleState) {
  const footer = asObject(footerInput);
  return {
    ...footer,
    newsletterModule: {
      templates: moduleState.templates,
      campaigns: moduleState.campaigns,
    },
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildArticleHref(slug: string) {
  return `/articolo/${slug}`;
}

export function buildNewsletterPreview(
  tenantName: string,
  config: SiteNewsletterConfig,
  campaign: NewsletterCampaignRecord,
  articles: NewsletterPreviewArticle[],
) : NewsletterPreviewResult {
  const featuredArticle =
    articles.find((article) => article.id === campaign.featuredArticleId) ||
    articles[0] ||
    null;
  const remainingArticles = articles.filter((article) => article.id !== featuredArticle?.id);

  const intro = campaign.intro || config.digest.intro || config.description;
  const ctaLabel = config.buttonText || "Leggi l'articolo";

  const featuredHtml = featuredArticle
    ? `
      <section style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #e5e7eb;">
        ${featuredArticle.coverImageUrl ? `<img src="${escapeHtml(featuredArticle.coverImageUrl)}" alt="" style="width:100%;border-radius:16px;display:block;margin-bottom:20px;" />` : ""}
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">Storia principale</p>
        <h2 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#111827;">${escapeHtml(featuredArticle.title)}</h2>
        ${featuredArticle.summary ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">${escapeHtml(featuredArticle.summary)}</p>` : ""}
        <a href="${escapeHtml(buildArticleHref(featuredArticle.slug))}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;">${escapeHtml(ctaLabel)}</a>
      </section>
    `
    : "";

  const listHtml = remainingArticles.length > 0
    ? `
      <section>
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">Selezione redazionale</p>
        ${remainingArticles
          .map(
            (article) => `
              <article style="padding:16px 0;border-top:1px solid #e5e7eb;">
                <h3 style="margin:0 0 8px;font-size:20px;line-height:1.3;color:#111827;">${escapeHtml(article.title)}</h3>
                ${article.summary ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#4b5563;">${escapeHtml(article.summary)}</p>` : ""}
                <a href="${escapeHtml(buildArticleHref(article.slug))}" style="font-size:14px;color:#111827;text-decoration:none;font-weight:600;">Apri articolo</a>
              </article>
            `,
          )
          .join("")}
      </section>
    `
    : "";

  const html = `
    <!doctype html>
    <html lang="it">
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
          <div style="background:#ffffff;border-radius:24px;padding:32px;">
            <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">${escapeHtml(tenantName)}</p>
            <h1 style="margin:0 0 12px;font-size:34px;line-height:1.15;color:#111827;">${escapeHtml(campaign.subject || campaign.title || "Newsletter")}</h1>
            ${campaign.preheader ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#6b7280;">${escapeHtml(campaign.preheader)}</p>` : ""}
            ${intro ? `<p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#374151;">${escapeHtml(intro)}</p>` : ""}
            ${featuredHtml}
            ${listHtml}
            <footer style="margin-top:32px;padding-top:18px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.7;color:#6b7280;">
              Ricevi questa email perche' sei iscritto agli aggiornamenti di ${escapeHtml(tenantName)}.
            </footer>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  const textLines = [
    `${tenantName}`,
    "",
    `${campaign.subject || campaign.title || "Newsletter"}`,
    campaign.preheader || "",
    intro || "",
    featuredArticle ? `Storia principale: ${featuredArticle.title} (${buildArticleHref(featuredArticle.slug)})` : "",
    ...remainingArticles.map((article) => `- ${article.title} (${buildArticleHref(article.slug)})`),
  ].filter(Boolean);

  const providerPayload = {
    provider: campaign.provider || config.provider.provider,
    audienceLabel: campaign.audienceLabel || config.provider.audienceLabel,
    listId: config.provider.listId,
    sender: {
      name: config.provider.senderName,
      email: config.provider.senderEmail,
      replyTo: config.provider.replyTo,
    },
    campaign: {
      id: campaign.id,
      title: campaign.title,
      subject: campaign.subject,
      preheader: campaign.preheader,
      scheduledAt: campaign.scheduledAt,
      status: campaign.status,
    },
    html,
    text: textLines.join("\n"),
  };

  return {
    html,
    text: textLines.join("\n"),
    providerPayload,
  };
}

export function buildNewsletterConfigFooter(
  footerInput: unknown,
  newsletterConfig: SiteNewsletterConfig,
  moduleState: NewsletterModuleState,
) {
  return mergeNewsletterModuleIntoFooter(
    mergeNewsletterIntoFooter(footerInput, newsletterConfig),
    {
      templates: moduleState.templates,
      campaigns: moduleState.campaigns.map((campaign) => ({
        ...campaign,
        updatedAt: campaign.updatedAt || new Date().toISOString(),
      })),
    },
  );
}

export function getDefaultNewsletterComposerState(): NewsletterModuleState {
  return {
    templates: DEFAULT_TEMPLATES,
    campaigns: [],
  };
}
