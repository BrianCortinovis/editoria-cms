import type { SupabaseClient } from "@supabase/supabase-js";

export interface TranslationLink {
  language: string;
  articleId: string;
  slug: string;
  title: string;
}

export interface HreflangEntry {
  lang: string;
  href: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: "it", name: "Italiano", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "en", name: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "de", name: "Deutsch", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "fr", name: "Fran\u00e7ais", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "es", name: "Espa\u00f1ol", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "pt", name: "Portugu\u00eas", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "nl", name: "Nederlands", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "pl", name: "Polski", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "ro", name: "Rom\u00e2n\u0103", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "hr", name: "Hrvatski", flag: "\u{1F1ED}\u{1F1F7}" },
  { code: "sl", name: "Sloven\u0161\u010dina", flag: "\u{1F1F8}\u{1F1EE}" },
] as const;

interface TranslationRow {
  language: string;
  article_id: string;
  articles: { slug: string; title: string } | null;
}

/**
 * Get all translations for a given article.
 * Returns other articles in the same translation group.
 */
export async function getArticleTranslations(
  supabase: SupabaseClient,
  articleId: string,
): Promise<TranslationLink[]> {
  const { data: membership } = await supabase
    .from("article_translations")
    .select("group_id")
    .eq("article_id", articleId)
    .maybeSingle();

  if (!membership) return [];

  const { data: translations } = await supabase
    .from("article_translations")
    .select("language, article_id, articles!inner(slug, title)")
    .eq("group_id", membership.group_id)
    .neq("article_id", articleId);

  if (!translations) return [];

  return (translations as unknown as TranslationRow[]).map((t) => ({
    language: t.language,
    articleId: t.article_id,
    slug: t.articles?.slug ?? "",
    title: t.articles?.title ?? "",
  }));
}

/**
 * Link two articles as translations of each other.
 * Creates a group if neither article is in one, or adds to existing group.
 */
export async function linkArticleTranslation(
  supabase: SupabaseClient,
  tenantId: string,
  sourceArticleId: string,
  sourceLanguage: string,
  targetArticleId: string,
  targetLanguage: string,
): Promise<{ groupId: string } | { error: string }> {
  // Check if source already in a group
  const { data: existing } = await supabase
    .from("article_translations")
    .select("group_id")
    .eq("article_id", sourceArticleId)
    .maybeSingle();

  let groupId: string;

  if (existing) {
    groupId = existing.group_id;
  } else {
    // Create new group
    const { data: group, error } = await supabase
      .from("article_translation_groups")
      .insert({ tenant_id: tenantId })
      .select("id")
      .single();
    if (error || !group) return { error: "Failed to create translation group" };
    groupId = group.id;

    // Add source to group
    const { error: srcError } = await supabase
      .from("article_translations")
      .insert({
        group_id: groupId,
        article_id: sourceArticleId,
        language: sourceLanguage,
        tenant_id: tenantId,
      });
    if (srcError) return { error: srcError.message };
  }

  // Add target to group (upsert in case it already exists)
  const { error: targetError } = await supabase
    .from("article_translations")
    .upsert(
      {
        group_id: groupId,
        article_id: targetArticleId,
        language: targetLanguage,
        tenant_id: tenantId,
      },
      { onConflict: "article_id" },
    );

  if (targetError) return { error: targetError.message };

  // Update language fields on articles
  await supabase
    .from("articles")
    .update({ language: sourceLanguage })
    .eq("id", sourceArticleId);
  await supabase
    .from("articles")
    .update({ language: targetLanguage })
    .eq("id", targetArticleId);

  return { groupId };
}

/**
 * Remove an article from its translation group.
 */
export async function unlinkArticleTranslation(
  supabase: SupabaseClient,
  articleId: string,
): Promise<void> {
  await supabase
    .from("article_translations")
    .delete()
    .eq("article_id", articleId);
}

/**
 * Get supported languages for a tenant from settings.
 */
export function getTenantLanguages(
  settings: Record<string, unknown>,
): string[] {
  const langs = settings.supported_languages;
  if (Array.isArray(langs) && langs.every((l) => typeof l === "string")) {
    return langs as string[];
  }
  return ["it"];
}

/**
 * Get default language for a tenant.
 */
export function getTenantDefaultLanguage(
  settings: Record<string, unknown>,
): string {
  const lang = settings.default_language;
  return typeof lang === "string" ? lang : "it";
}

/**
 * Build hreflang entries for an article with its translations.
 */
export function buildHreflangEntries(
  currentLang: string,
  currentUrl: string,
  translations: TranslationLink[],
  buildUrl: (slug: string) => string,
): HreflangEntry[] {
  const entries: HreflangEntry[] = [
    { lang: currentLang, href: currentUrl },
  ];

  for (const t of translations) {
    entries.push({ lang: t.language, href: buildUrl(t.slug) });
  }

  // Add x-default pointing to the current (canonical) URL
  entries.push({ lang: "x-default", href: currentUrl });

  return entries;
}
