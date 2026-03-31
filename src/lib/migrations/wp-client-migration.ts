/**
 * Client-side WordPress migration engine.
 * Runs entirely in the browser — writes to Supabase directly via RLS.
 * Only uses Vercel for image uploads to R2.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import slugify from 'slugify';
import type { WpPost, WpComment } from './wp-parser';
import { mapWpStatus } from './wp-parser';

export interface MigrationProgress {
  phase: 'categories' | 'tags' | 'articles' | 'images' | 'comments' | 'redirects' | 'done';
  current: number;
  total: number;
  articlesInserted: number;
  articlesUpdated: number;
  articlesSkipped: number;
  imagesMigrated: number;
  imagesFailed: number;
  commentsMigrated: number;
  redirectsCreated: number;
  failures: Array<{ title: string; reason: string }>;
  currentItem: string;
  cancelled: boolean;
}

export interface MigrationConfig {
  importCategories: boolean;
  importTags: boolean;
  importAuthors: boolean;
  importDates: boolean;
  importComments: boolean;
  importImages: boolean;
  importSlugs: boolean;
}

type CancelToken = { cancelled: boolean };

const categoryCache = new Map<string, string>();
const tagCache = new Map<string, string>();

async function ensureCategory(supabase: SupabaseClient, tenantId: string, name: string): Promise<string> {
  const slug = slugify(name, { lower: true, strict: true, locale: 'it' });
  const key = `${tenantId}:${slug}`;
  if (categoryCache.has(key)) return categoryCache.get(key)!;

  const { data: existing } = await supabase
    .from('categories').select('id').eq('tenant_id', tenantId).eq('slug', slug).maybeSingle();
  if (existing) { categoryCache.set(key, existing.id); return existing.id; }

  const { data, error } = await supabase
    .from('categories').insert({ tenant_id: tenantId, name, slug }).select('id').single();
  if (error) throw error;
  categoryCache.set(key, data.id);
  return data.id;
}

async function ensureTag(supabase: SupabaseClient, tenantId: string, name: string): Promise<string> {
  const slug = slugify(name, { lower: true, strict: true, locale: 'it' });
  const key = `${tenantId}:${slug}`;
  if (tagCache.has(key)) return tagCache.get(key)!;

  const { data: existing } = await supabase
    .from('tags').select('id').eq('tenant_id', tenantId).eq('slug', slug).maybeSingle();
  if (existing) { tagCache.set(key, existing.id); return existing.id; }

  const { data, error } = await supabase
    .from('tags').insert({ tenant_id: tenantId, name, slug }).select('id').single();
  if (error) throw error;
  tagCache.set(key, data.id);
  return data.id;
}

async function ensureUniqueSlug(supabase: SupabaseClient, tenantId: string, desired: string, excludeId?: string): Promise<string> {
  let candidate = desired;
  let suffix = 2;
  for (;;) {
    let q = supabase.from('articles').select('id').eq('tenant_id', tenantId).eq('slug', candidate);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${desired}-${suffix++}`;
  }
}

async function migrateImage(
  tenantId: string,
  tenantSlug: string,
  imageUrl: string,
): Promise<string | null> {
  try {
    // Download image from old WordPress
    const resp = await fetch(imageUrl);
    if (!resp.ok) return null;

    const blob = await resp.blob();
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeName = imageUrl.split('/').pop()?.split('?')[0] || `image.${ext}`;

    // Upload to CMS (which uploads to R2)
    const formData = new FormData();
    formData.append('file', new File([blob], safeName, { type: blob.type || `image/${ext}` }));
    formData.append('tenant_id', tenantId);
    formData.append('tenant_slug', tenantSlug);

    const uploadResp = await fetch('/api/cms/media/upload', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });

    if (!uploadResp.ok) return null;
    const data = await uploadResp.json();
    return data.media?.url || null;
  } catch {
    return null;
  }
}

function replaceImageUrls(html: string, urlMap: Map<string, string>): string {
  let result = html;
  for (const [oldUrl, newUrl] of urlMap) {
    result = result.replaceAll(oldUrl, newUrl);
  }
  return result;
}

export async function runClientMigration(
  supabase: SupabaseClient,
  tenantId: string,
  tenantSlug: string,
  userId: string,
  posts: WpPost[],
  config: MigrationConfig,
  onProgress: (progress: MigrationProgress) => void,
  cancelToken: CancelToken,
): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    phase: 'categories',
    current: 0,
    total: posts.length,
    articlesInserted: 0,
    articlesUpdated: 0,
    articlesSkipped: 0,
    imagesMigrated: 0,
    imagesFailed: 0,
    commentsMigrated: 0,
    redirectsCreated: 0,
    failures: [],
    currentItem: '',
    cancelled: false,
  };

  const report = () => onProgress({ ...progress });

  // Phase 1: Pre-cache categories
  if (config.importCategories) {
    progress.phase = 'categories';
    const allCats = [...new Set(posts.flatMap((p) => p.categories))];
    progress.total = allCats.length;
    for (let i = 0; i < allCats.length; i++) {
      if (cancelToken.cancelled) { progress.cancelled = true; return progress; }
      progress.current = i + 1;
      progress.currentItem = allCats[i];
      report();
      await ensureCategory(supabase, tenantId, allCats[i]);
    }
  }

  // Phase 2: Pre-cache tags
  if (config.importTags) {
    progress.phase = 'tags';
    const allTags = [...new Set(posts.flatMap((p) => p.tags))];
    progress.total = allTags.length;
    progress.current = 0;
    for (let i = 0; i < allTags.length; i++) {
      if (cancelToken.cancelled) { progress.cancelled = true; return progress; }
      progress.current = i + 1;
      progress.currentItem = allTags[i];
      report();
      await ensureTag(supabase, tenantId, allTags[i]);
    }
  }

  // Phase 3: Import articles
  progress.phase = 'articles';
  progress.total = posts.length;
  progress.current = 0;

  const articleImageMap = new Map<string, Map<string, string>>(); // articleId -> old->new URL map

  for (let i = 0; i < posts.length; i++) {
    if (cancelToken.cancelled) { progress.cancelled = true; return progress; }

    const post = posts[i];
    progress.current = i + 1;
    progress.currentItem = post.title;
    report();

    try {
      const baseSlug = slugify(
        config.importSlugs ? post.slug || post.title : post.title,
        { lower: true, strict: true, locale: 'it' }
      );
      if (!baseSlug) { progress.articlesSkipped++; continue; }

      // Check existing by legacy_wp_id or slug
      let existingId: string | undefined;
      if (post.postId) {
        const { data } = await supabase
          .from('articles').select('id').eq('tenant_id', tenantId).eq('legacy_wp_id', post.postId).maybeSingle();
        existingId = data?.id;
      }
      if (!existingId) {
        const { data } = await supabase
          .from('articles').select('id').eq('tenant_id', tenantId).eq('slug', baseSlug).maybeSingle();
        existingId = data?.id;
      }

      const finalSlug = await ensureUniqueSlug(supabase, tenantId, baseSlug, existingId);

      // Resolve categories
      const categoryIds = config.importCategories && post.categories.length > 0
        ? await Promise.all(post.categories.map((c) => ensureCategory(supabase, tenantId, c)))
        : [];
      const primaryCategoryId = [...new Set(categoryIds)][0] || null;

      const finalStatus = mapWpStatus(post.status);
      const pubDate = post.pubDate ? new Date(post.pubDate) : null;
      const isPublished = finalStatus === 'published' && pubDate && !Number.isNaN(pubDate.getTime());

      const payload: Record<string, unknown> = {
        tenant_id: tenantId,
        title: post.title.trim(),
        slug: finalSlug,
        summary: post.excerpt?.trim() || null,
        body: post.content,
        category_id: primaryCategoryId,
        author_id: userId,
        status: finalStatus,
        cover_image_url: post.images[0] || null,
        meta_title: post.title.trim(),
        meta_description: post.excerpt?.trim() || null,
        published_at: isPublished && config.importDates ? pubDate!.toISOString() : null,
        legacy_wp_id: post.postId,
        legacy_permalink: post.permalink || null,
        import_source: 'wordpress',
        imported_at: new Date().toISOString(),
        import_metadata: {
          creator: post.creator,
          original_status: post.status,
          comment_count: post.comments.length,
          image_count: post.images.length,
          extra_categories: post.categories.slice(1),
        },
      };

      let savedId: string;
      if (existingId) {
        const { error } = await supabase.from('articles').update(payload).eq('id', existingId);
        if (error) throw error;
        savedId = existingId;
        progress.articlesUpdated++;
      } else {
        const { data, error } = await supabase.from('articles').insert(payload).select('id').single();
        if (error || !data) throw error || new Error('Insert failed');
        savedId = data.id;
        progress.articlesInserted++;
      }

      // Sync multi-category assignments
      if (categoryIds.length > 1) {
        const uniqueCatIds = [...new Set(categoryIds)];
        for (const catId of uniqueCatIds.slice(1)) {
          try {
            await supabase.from('article_categories').upsert(
              { article_id: savedId, category_id: catId },
              { onConflict: 'article_id,category_id' }
            );
          } catch {}

        }
      }

      // Tags
      if (config.importTags && post.tags.length > 0) {
        await supabase.from('article_tags').delete().eq('article_id', savedId);
        const tagIds = await Promise.all(post.tags.map((t) => ensureTag(supabase, tenantId, t)));
        const uniqueTagIds = [...new Set(tagIds)];
        if (uniqueTagIds.length > 0) {
          await supabase.from('article_tags').insert(
            uniqueTagIds.map((tagId) => ({ article_id: savedId, tag_id: tagId }))
          );
        }
      }

      // Store images for batch phase
      if (config.importImages && post.images.length > 0) {
        articleImageMap.set(savedId, new Map(post.images.map((url) => [url, ''])));
      }

      // Comments
      if (config.importComments && post.comments.length > 0) {
        await supabase.from('article_comments').delete().eq('article_id', savedId);
        const commentRows = post.comments.map((comment: WpComment) => ({
          tenant_id: tenantId,
          article_id: savedId,
          author_name: comment.author,
          author_email: comment.authorEmail || 'unknown@example.com',
          author_url: comment.authorUrl || null,
          body: comment.content,
          status: comment.approved ? 'approved' : 'pending',
          source: 'wordpress',
          is_imported: true,
          published_at: comment.approved && comment.pubDate ? new Date(comment.pubDate).toISOString() : null,
          created_at: comment.pubDate ? new Date(comment.pubDate).toISOString() : new Date().toISOString(),
        }));
        await supabase.from('article_comments').insert(commentRows);
        progress.commentsMigrated += commentRows.length;
      }

      // Redirects
      if (post.permalink) {
        try {
          const sourcePath = new URL(post.permalink).pathname.replace(/\/+$/, '') || '/';
          const targetPath = `/articolo/${finalSlug}`;
          if (sourcePath && sourcePath !== targetPath) {
            await supabase.from('redirects').upsert({
              tenant_id: tenantId,
              source_path: sourcePath,
              target_path: targetPath,
              status_code: 301,
              is_active: true,
            }, { onConflict: 'tenant_id,source_path' });
            progress.redirectsCreated++;
          }
        } catch {}
      }
    } catch (err) {
      progress.failures.push({
        title: post.title,
        reason: err instanceof Error ? err.message : 'Errore sconosciuto',
      });
    }

    report();
  }

  // Phase 4: Migrate images (batch, after all articles are in)
  if (config.importImages && articleImageMap.size > 0) {
    progress.phase = 'images';
    const allImages: Array<{ articleId: string; oldUrl: string }> = [];
    for (const [articleId, urlMap] of articleImageMap) {
      for (const oldUrl of urlMap.keys()) {
        allImages.push({ articleId, oldUrl });
      }
    }
    progress.total = allImages.length;
    progress.current = 0;

    // Deduplicate: same URL across articles → upload once
    const uploadedUrls = new Map<string, string>();

    for (let i = 0; i < allImages.length; i++) {
      if (cancelToken.cancelled) { progress.cancelled = true; return progress; }

      const { articleId, oldUrl } = allImages[i];
      progress.current = i + 1;
      progress.currentItem = oldUrl.split('/').pop() || oldUrl;
      report();

      let newUrl: string | null = uploadedUrls.get(oldUrl) || null;

      if (!newUrl) {
        newUrl = await migrateImage(tenantId, tenantSlug, oldUrl);
        if (newUrl) {
          uploadedUrls.set(oldUrl, newUrl);
          progress.imagesMigrated++;
        } else {
          progress.imagesFailed++;
        }
      } else {
        progress.imagesMigrated++;
      }

      if (newUrl) {
        articleImageMap.get(articleId)!.set(oldUrl, newUrl);
      }
    }

    // Phase 5: Update article bodies with new image URLs
    for (const [articleId, urlMap] of articleImageMap) {
      if (cancelToken.cancelled) { progress.cancelled = true; return progress; }

      const hasNewUrls = [...urlMap.values()].some((v) => v !== '');
      if (!hasNewUrls) continue;

      const { data: article } = await supabase
        .from('articles').select('body, cover_image_url').eq('id', articleId).single();
      if (!article) continue;

      const updatedBody = replaceImageUrls(article.body || '', urlMap);
      const firstNewUrl = [...urlMap.values()].find((v) => v !== '') || article.cover_image_url;

      await supabase.from('articles').update({
        body: updatedBody,
        cover_image_url: firstNewUrl,
      }).eq('id', articleId);
    }
  }

  progress.phase = 'done';
  progress.currentItem = '';
  report();

  return progress;
}
