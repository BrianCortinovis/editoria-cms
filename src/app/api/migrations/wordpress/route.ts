import { NextRequest, NextResponse } from 'next/server';
import slugify from 'slugify';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { syncArticleCategoryAssignments } from '@/lib/articles/taxonomy';

interface WordPressPost {
  title: string;
  content: string;
  excerpt?: string;
  pubDate: string;
  creator?: string;
  category: string[];
  tags: string[];
  comments: WordPressComment[];
  images: string[];
  slug?: string;
  status?: string;
  postId?: number;
  permalink?: string;
  postType?: string;
}

interface WordPressComment {
  author: string;
  authorEmail: string;
  authorUrl?: string;
  pubDate: string;
  content: string;
  approved: boolean;
}

interface ImportConfig {
  importCategories: boolean;
  importTags: boolean;
  importAuthors: boolean;
  importDates: boolean;
  importComments: boolean;
  importImages: boolean;
  importSlugs: boolean;
}

interface OptionalColumns {
  legacyWpId: boolean;
  legacyPermalink: boolean;
  importSource: boolean;
  importedAt: boolean;
  importMetadata: boolean;
  commentsTable: boolean;
  redirectsTable: boolean;
}

const normalizeWord = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const cleanXmlValue = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

function extractXmlText(content: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}(?:[^>]*?)>([\\s\\S]*?)</${tagName}>`, 'i');
  const result = regex.exec(content);
  if (!result) return '';
  return cleanXmlValue(result[1]);
}

function extractXmlTerms(itemContent: string, domain: 'category' | 'post_tag'): string[] {
  const values: string[] = [];
  const regex = new RegExp(`<category[^>]*domain="${domain}"[^>]*>([\\s\\S]*?)</category>`, 'gi');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(itemContent)) !== null) {
    const value = cleanXmlValue(match[1]);
    if (value) values.push(value);
  }

  return values;
}

function parseXmlContent(xmlString: string): WordPressPost[] {
  const posts: WordPressPost[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemContent = match[1];
    const postType = extractXmlText(itemContent, 'wp:post_type') || 'post';

    if (postType !== 'post') continue;

    const title = extractXmlText(itemContent, 'title');
    const content = extractXmlText(itemContent, 'content:encoded');
    const excerpt = extractXmlText(itemContent, 'excerpt:encoded');
    const pubDate = extractXmlText(itemContent, 'pubDate');
    const creator = extractXmlText(itemContent, 'dc:creator');
    const slug = extractXmlText(itemContent, 'wp:post_name');
    const status = extractXmlText(itemContent, 'wp:status');
    const permalink = extractXmlText(itemContent, 'link');
    const postIdRaw = extractXmlText(itemContent, 'wp:post_id');

    const categories = extractXmlTerms(itemContent, 'category');
    const tags = extractXmlTerms(itemContent, 'post_tag');

    const comments: WordPressComment[] = [];
    const commentRegex = /<wp:comment>([\s\S]*?)<\/wp:comment>/g;
    let commentMatch: RegExpExecArray | null;

    while ((commentMatch = commentRegex.exec(itemContent)) !== null) {
      const commentContent = commentMatch[1];
      const author = extractXmlText(commentContent, 'wp:comment_author');
      const authorEmail = extractXmlText(commentContent, 'wp:comment_author_email');
      const authorUrl = extractXmlText(commentContent, 'wp:comment_author_url');
      const commentPubDate = extractXmlText(commentContent, 'wp:comment_date');
      const commentBody = extractXmlText(commentContent, 'wp:comment_content');
      const approved = extractXmlText(commentContent, 'wp:comment_approved') === '1';

      if (author && commentBody) {
        comments.push({
          author,
          authorEmail,
          authorUrl: authorUrl || undefined,
          pubDate: commentPubDate,
          content: commentBody,
          approved,
        });
      }
    }

    const images: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      images.push(imgMatch[1]);
    }

    if (!title || !(content || excerpt)) continue;

    posts.push({
      title,
      content: content || excerpt || '',
      excerpt: excerpt || undefined,
      pubDate,
      creator: creator || undefined,
      category: categories,
      tags,
      comments,
      images,
      slug: slug || undefined,
      status: status || undefined,
      postId: postIdRaw ? Number(postIdRaw) : undefined,
      permalink: permalink || undefined,
      postType,
    });
  }

  return posts;
}

function parseJsonContent(jsonString: string): WordPressPost[] {
  try {
    const data = JSON.parse(jsonString);
    const posts = Array.isArray(data) ? data : data.posts || [];

    return posts
      .map((post: Record<string, unknown>) => ({
        title: String(post.title || ''),
        content: String(post.content || ''),
        excerpt: post.excerpt ? String(post.excerpt) : undefined,
        pubDate: String(post.pubDate || post.date || new Date().toISOString()),
        creator: post.creator || post.author ? String(post.creator || post.author) : undefined,
        category: Array.isArray(post.category)
          ? post.category.map(String)
          : post.category
            ? [String(post.category)]
            : [],
        tags: Array.isArray(post.tags)
          ? post.tags.map(String)
          : post.tags
            ? [String(post.tags)]
            : [],
        comments: Array.isArray(post.comments) ? (post.comments as WordPressComment[]) : [],
        images: Array.isArray(post.images) ? post.images.map(String) : [],
        slug: post.slug || post.post_name ? String(post.slug || post.post_name) : undefined,
        status: post.status ? String(post.status) : undefined,
        postId: post.postId || post.id ? Number(post.postId || post.id) : undefined,
        permalink: post.permalink || post.link ? String(post.permalink || post.link) : undefined,
        postType: post.postType || post.type ? String(post.postType || post.type) : 'post',
      }))
      .filter((post: WordPressPost) => post.postType === 'post' && post.title && post.content);
  } catch (error) {
    console.error('JSON parse error:', error);
    return [];
  }
}

async function hasColumn(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  table: string,
  column: string
) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function resolveOptionalColumns(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>
): Promise<OptionalColumns> {
  const [legacyWpId, legacyPermalink, importSource, importedAt, importMetadata, commentsTable, redirectsTable] = await Promise.all([
    hasColumn(supabase, 'articles', 'legacy_wp_id'),
    hasColumn(supabase, 'articles', 'legacy_permalink'),
    hasColumn(supabase, 'articles', 'import_source'),
    hasColumn(supabase, 'articles', 'imported_at'),
    hasColumn(supabase, 'articles', 'import_metadata'),
    hasColumn(supabase, 'article_comments', 'id'),
    hasColumn(supabase, 'redirects', 'id'),
  ]);

  return { legacyWpId, legacyPermalink, importSource, importedAt, importMetadata, commentsTable, redirectsTable };
}

async function resolveAuthorId(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  tenantId: string,
  creator: string | undefined,
  fallbackAuthorId: string
) {
  if (!creator) return fallbackAuthorId;

  const { data: memberships } = await supabase
    .from('user_tenants')
    .select('user_id')
    .eq('tenant_id', tenantId);

  const userIds = memberships?.map((membership) => membership.user_id) || [];
  if (userIds.length === 0) return fallbackAuthorId;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  const creatorNormalized = normalizeWord(creator);
  const matched = profiles?.find((profile) => {
    const fullName = normalizeWord(profile.full_name || '');
    const emailPrefix = normalizeWord((profile.email || '').split('@')[0] || '');
    return fullName === creatorNormalized || emailPrefix === creatorNormalized;
  });

  return matched?.id || fallbackAuthorId;
}

async function ensureCategory(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  tenantId: string,
  name: string
) {
  const slug = slugify(name, { lower: true, strict: true, locale: 'it' });
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      tenant_id: tenantId,
      name,
      slug,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function ensureTag(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  tenantId: string,
  name: string
) {
  const slug = slugify(name, { lower: true, strict: true, locale: 'it' });
  const { data: existing } = await supabase
    .from('tags')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('tags')
    .insert({
      tenant_id: tenantId,
      name,
      slug,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  tenantId: string,
  desiredSlug: string,
  currentArticleId?: string
) {
  let candidate = desiredSlug;
  let suffix = 2;

  while (candidate) {
    let query = supabase
      .from('articles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', candidate);

    if (currentArticleId) {
      query = query.neq('id', currentArticleId);
    }

    const { data } = await query.maybeSingle();
    if (!data) return candidate;

    candidate = `${desiredSlug}-${suffix}`;
    suffix += 1;
  }

  return slugify(`${desiredSlug}-${Date.now()}`, { lower: true, strict: true, locale: 'it' });
}

function mapWordPressStatus(status: string | undefined) {
  switch ((status || '').toLowerCase()) {
    case 'publish':
    case 'published':
      return 'published';
    case 'pending':
      return 'in_review';
    case 'future':
      return 'approved';
    case 'private':
    case 'trash':
      return 'archived';
    default:
      return 'draft';
  }
}

function extractPathFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/\/+$/g, '') || '/';
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantId = String(formData.get('tenant_id') || '');
    const defaultAuthorId = String(formData.get('default_author_id') || user.id);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
    }

    const { data: membership } = await authClient
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const importConfig: ImportConfig = {
      importCategories: formData.get('importCategories') === 'true',
      importTags: formData.get('importTags') === 'true',
      importAuthors: formData.get('importAuthors') === 'true',
      importDates: formData.get('importDates') === 'true',
      importComments: formData.get('importComments') === 'true',
      importImages: formData.get('importImages') === 'true',
      importSlugs: formData.get('importSlugs') === 'true',
    };

    const fileContent = await file.text();
    const posts = file.name.endsWith('.json')
      ? parseJsonContent(fileContent)
      : parseXmlContent(fileContent);

    const supabase = await createServiceRoleClient();
    const optionalColumns = await resolveOptionalColumns(supabase);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const failures: Array<{ title: string; reason: string }> = [];

    for (const post of posts) {
      try {
        const baseSlug = slugify(
          importConfig.importSlugs ? post.slug || post.title : post.title,
          { lower: true, strict: true, locale: 'it' }
        );

        if (!baseSlug) {
          skipped += 1;
          continue;
        }

        let existingArticleId: string | undefined;
        if (optionalColumns.legacyWpId && post.postId) {
          const { data: existingByLegacy } = await supabase
            .from('articles')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('legacy_wp_id', post.postId)
            .maybeSingle();

          existingArticleId = existingByLegacy?.id;
        }

        if (!existingArticleId) {
          const { data: existingBySlug } = await supabase
            .from('articles')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('slug', baseSlug)
            .maybeSingle();

          existingArticleId = existingBySlug?.id;
        }

        const finalSlug = await ensureUniqueSlug(supabase, tenantId, baseSlug, existingArticleId);
        const importedCategoryIds = importConfig.importCategories && post.category.length > 0
          ? await Promise.all(post.category.map((categoryName) => ensureCategory(supabase, tenantId, categoryName)))
          : [];
        const uniqueImportedCategoryIds = [...new Set(importedCategoryIds)];
        const primaryCategoryId = uniqueImportedCategoryIds[0] || null;
        const authorId = importConfig.importAuthors
          ? await resolveAuthorId(supabase, tenantId, post.creator, defaultAuthorId)
          : defaultAuthorId;

        const finalStatus = mapWordPressStatus(post.status);
        const publishDate = post.pubDate ? new Date(post.pubDate) : null;
        const isPublished = finalStatus === 'published' && publishDate && !Number.isNaN(publishDate.getTime());
        const isScheduled = (post.status || '').toLowerCase() === 'future' && publishDate && !Number.isNaN(publishDate.getTime());

        const articlePayload: Record<string, unknown> = {
          tenant_id: tenantId,
          title: post.title.trim(),
          slug: finalSlug,
          summary: post.excerpt?.trim() || null,
          body: post.content,
          category_id: primaryCategoryId,
          author_id: authorId,
          status: finalStatus,
          cover_image_url: importConfig.importImages ? post.images[0] || null : null,
          meta_title: post.title.trim(),
          meta_description: post.excerpt?.trim() || null,
          published_at: isPublished && importConfig.importDates ? publishDate!.toISOString() : null,
          scheduled_at: isScheduled && importConfig.importDates ? publishDate!.toISOString() : null,
        };

        if (optionalColumns.legacyWpId && post.postId) {
          articlePayload.legacy_wp_id = post.postId;
        }
        if (optionalColumns.legacyPermalink && post.permalink) {
          articlePayload.legacy_permalink = post.permalink;
        }
        if (optionalColumns.importSource) {
          articlePayload.import_source = 'wordpress';
        }
        if (optionalColumns.importedAt) {
          articlePayload.imported_at = new Date().toISOString();
        }
        if (optionalColumns.importMetadata) {
          articlePayload.import_metadata = {
            creator: post.creator || null,
            original_status: post.status || null,
            comment_count: importConfig.importComments ? post.comments.length : 0,
            image_count: importConfig.importImages ? post.images.length : 0,
            extra_categories: post.category.slice(1),
            source_file: file.name,
          };
        }

        let savedArticleId = existingArticleId;

        if (existingArticleId) {
          const { error } = await supabase
            .from('articles')
            .update(articlePayload)
            .eq('id', existingArticleId);

          if (error) throw error;
          updated += 1;
        } else {
          const { data, error } = await supabase
            .from('articles')
            .insert(articlePayload)
            .select('id')
            .single();

          if (error || !data) throw error || new Error('Insert failed');
          savedArticleId = data.id;
          inserted += 1;
        }

        if (!savedArticleId) {
          throw new Error('Missing saved article id');
        }

        if (uniqueImportedCategoryIds.length > 0) {
          try {
            await syncArticleCategoryAssignments(supabase as never, savedArticleId, uniqueImportedCategoryIds);
          } catch (categoryError) {
            console.warn('WordPress category assignment sync failed:', categoryError);
          }
        }

        if (optionalColumns.commentsTable && importConfig.importComments && post.comments.length > 0) {
          await supabase.from('article_comments').delete().eq('article_id', savedArticleId);

          const approvedStatus = finalStatus === 'published' ? 'approved' : 'pending';
          const commentRows = post.comments.map((comment) => ({
            tenant_id: tenantId,
            article_id: savedArticleId,
            author_name: comment.author,
            author_email: comment.authorEmail || 'unknown@example.com',
            author_url: comment.authorUrl || null,
            body: comment.content,
            status: comment.approved ? 'approved' : approvedStatus,
            source: 'wordpress',
            is_imported: true,
            published_at: comment.approved && comment.pubDate ? new Date(comment.pubDate).toISOString() : null,
            created_at: comment.pubDate ? new Date(comment.pubDate).toISOString() : new Date().toISOString(),
          }));

          if (commentRows.length > 0) {
            await supabase.from('article_comments').insert(commentRows);
          }
        }

        if (optionalColumns.redirectsTable && post.permalink) {
          const sourcePath = extractPathFromUrl(post.permalink);
          const targetPath = `/articolo/${finalSlug}`;

          if (sourcePath && sourcePath !== targetPath) {
            await supabase.from('redirects').upsert({
              tenant_id: tenantId,
              source_path: sourcePath,
              target_path: targetPath,
              status_code: 301,
              is_active: true,
            }, { onConflict: 'tenant_id,source_path' });
          }
        }

        await supabase.from('article_tags').delete().eq('article_id', savedArticleId);

        if (importConfig.importTags && post.tags.length > 0) {
          const tagIds = await Promise.all(
            post.tags.map((tag) => ensureTag(supabase, tenantId, tag))
          );

          const uniqueTagIds = [...new Set(tagIds)];
          if (uniqueTagIds.length > 0) {
            await supabase.from('article_tags').insert(
              uniqueTagIds.map((tagId) => ({
                article_id: savedArticleId!,
                tag_id: tagId,
              }))
            );
          }
        }
      } catch (error) {
        failures.push({
          title: post.title,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: posts.length,
      inserted,
      updated,
      processed: inserted + updated,
      skipped,
      failed: failures.length,
      failures: failures.slice(0, 20),
      message: `Importati ${inserted + updated} contenuti WordPress su ${posts.length}`,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
