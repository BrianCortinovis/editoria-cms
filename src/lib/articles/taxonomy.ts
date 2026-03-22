import type { SupabaseClient } from '@supabase/supabase-js';

interface MinimalCategory {
  id?: string;
  name: string;
  slug: string;
  color?: string | null;
  description?: string | null;
}

interface ArticleWithCategoryShape {
  id: string;
  category_id?: string | null;
  categories?: MinimalCategory | null;
}

const articleCategoriesSupportCache = new WeakMap<object, Promise<boolean>>();

function normalizeCategoryIds(categoryIds: Array<string | null | undefined>) {
  return [...new Set(categoryIds.filter((value): value is string => Boolean(value)))];
}

export async function supportsArticleCategories(supabase: Pick<SupabaseClient, 'from'>) {
  const cacheKey = supabase as object;
  const cached = articleCategoriesSupportCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const probe = (async () => {
    try {
      const { error } = await supabase
        .from('article_categories')
        .select('article_id', { head: true, count: 'exact' })
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  })();

  articleCategoriesSupportCache.set(cacheKey, probe);
  return probe;
}

export async function loadArticleCategoryIds(
  supabase: Pick<SupabaseClient, 'from'>,
  articleId: string,
  primaryCategoryId?: string | null
) {
  if (!(await supportsArticleCategories(supabase))) {
    return normalizeCategoryIds([primaryCategoryId]);
  }

  const { data, error } = await supabase
    .from('article_categories')
    .select('category_id')
    .eq('article_id', articleId);

  if (error) {
    return normalizeCategoryIds([primaryCategoryId]);
  }

  const categoryIds = normalizeCategoryIds((data || []).map((row: { category_id?: string | null }) => row.category_id));
  if (primaryCategoryId && !categoryIds.includes(primaryCategoryId)) {
    categoryIds.unshift(primaryCategoryId);
  }

  return categoryIds;
}

export async function syncArticleCategoryAssignments(
  supabase: Pick<SupabaseClient, 'from'>,
  articleId: string,
  categoryIds: Array<string | null | undefined>
) {
  if (!(await supportsArticleCategories(supabase))) {
    return;
  }

  const normalizedIds = normalizeCategoryIds(categoryIds);

  const deleteQuery = supabase
    .from('article_categories')
    .delete()
    .eq('article_id', articleId);

  const { error: deleteError } = await deleteQuery;
  if (deleteError) {
    throw deleteError;
  }

  if (normalizedIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('article_categories')
    .insert(
      normalizedIds.map((categoryId) => ({
        article_id: articleId,
        category_id: categoryId,
      }))
    );

  if (insertError) {
    throw insertError;
  }
}

export async function fetchArticleIdsForCategory(
  supabase: Pick<SupabaseClient, 'from'>,
  categoryId: string
) {
  if (!(await supportsArticleCategories(supabase))) {
    return null;
  }

  const { data, error } = await supabase
    .from('article_categories')
    .select('article_id')
    .eq('category_id', categoryId);

  if (error) {
    return null;
  }

  return normalizeCategoryIds((data || []).map((row: { article_id?: string | null }) => row.article_id));
}

export async function enrichArticlesWithCategories<T extends ArticleWithCategoryShape>(
  supabase: Pick<SupabaseClient, 'from'>,
  tenantId: string,
  articles: T[]
): Promise<Array<T & { all_categories: MinimalCategory[]; categories: MinimalCategory | null }>> {
  if (articles.length === 0) {
    return [];
  }

  const supportsAssignments = await supportsArticleCategories(supabase);
  const articleIds = articles.map((article) => article.id);
  const categoryMap = new Map<string, MinimalCategory>();
  const categoryIdsToFetch = new Set<string>();
  const allCategoryIdsByArticle = new Map<string, string[]>();

  if (supportsAssignments) {
    const { data: rows } = await supabase
      .from('article_categories')
      .select('article_id, category_id')
      .in('article_id', articleIds);

    for (const row of rows || []) {
      if (!row.article_id || !row.category_id) {
        continue;
      }

      const current = allCategoryIdsByArticle.get(row.article_id) || [];
      if (!current.includes(row.category_id)) {
        current.push(row.category_id);
      }
      allCategoryIdsByArticle.set(row.article_id, current);
      categoryIdsToFetch.add(row.category_id);
    }
  }

  for (const article of articles) {
    if (article.category_id) {
      categoryIdsToFetch.add(article.category_id);
    }
    if (article.categories?.id) {
      categoryMap.set(article.categories.id, article.categories);
    }
  }

  const categoryIds = [...categoryIdsToFetch];
  if (categoryIds.length > 0) {
    const { data: fetchedCategories } = await supabase
      .from('categories')
      .select('id, name, slug, color, description')
      .eq('tenant_id', tenantId)
      .in('id', categoryIds);

    for (const category of fetchedCategories || []) {
      categoryMap.set(category.id, category);
    }
  }

  return articles.map((article) => {
    const assignedCategoryIds = allCategoryIdsByArticle.get(article.id) || [];
    const orderedCategoryIds = normalizeCategoryIds([
      article.category_id,
      ...assignedCategoryIds,
    ]);
    const allCategories = orderedCategoryIds
      .map((categoryId) => categoryMap.get(categoryId))
      .filter((category): category is MinimalCategory => Boolean(category));
    const primaryCategory = allCategories[0] || article.categories || null;

    return {
      ...article,
      categories: primaryCategory,
      all_categories: allCategories,
    };
  });
}
