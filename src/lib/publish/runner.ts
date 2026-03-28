import { createHash, randomUUID } from 'crypto';
import { createServiceRoleClient, createServiceRoleClientForTenant } from '@/lib/supabase/server';
import {
  buildPublishedArticleDocument,
  buildPublishedBannersDocument,
  buildPublishedBannerZonesDocument,
  buildPublishedBreakingNewsDocument,
  buildPublishedCategoryDocument,
  buildPublishedEventsDocument,
  buildPublishedLayoutDocument,
  buildPublishedManifest,
  buildPublishedMediaManifestDocument,
  buildPublishedMenuDocument,
  buildPublishedModulesDocument,
  buildPublishedPageDocument,
  buildPublishedPostsDocument,
  buildPublishedSearchDocument,
  buildPublishedSettingsDocument,
  buildPublishedTagsDocument,
  resolvePublishSiteContext,
} from '@/lib/publish/builders';
import { buildPublishedPath, writePublishedJson } from '@/lib/publish/storage';
import type { PublishedManifest } from '@/lib/publish/types';
import { getSiteStorageQuotaByTenantId } from '@/lib/superadmin/storage';

type PublishTask =
  | { type: 'settings' }
  | { type: 'menu' }
  | { type: 'homepage'; pageId?: string | null }
  | { type: 'page'; pageId: string }
  | { type: 'article'; articleId: string }
  | { type: 'category'; categoryId: string }
  | { type: 'full_rebuild' };

function versionLabel(prefix: string) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `${prefix}-${stamp}-${randomUUID().slice(0, 8)}`;
}

async function startRelease(tenantId: string, initiatedBy?: string | null) {
  const supabase = await createServiceRoleClient();
  const context = await resolvePublishSiteContext(tenantId);

  if (!context) {
    throw new Error('Site context not found for tenant publish');
  }

  const quota = await getSiteStorageQuotaByTenantId(tenantId, supabase);
  if (quota?.publishBlocked) {
    throw new Error('Publish blocked by superadmin policy for this site');
  }

  const { data: release, error } = await supabase
    .from('publish_releases')
    .insert({
      site_id: context.siteId,
      tenant_id: context.tenantId,
      version_label: versionLabel('publish'),
      status: 'building',
      created_by: initiatedBy || null,
      metadata: {
        trigger: 'mvp_publish_runner',
      },
    })
    .select('id, version_label')
    .single();

  if (error || !release) {
    throw error || new Error('Unable to create publish release');
  }

  return { context, releaseId: release.id, versionLabel: release.version_label };
}

async function runJob(siteId: string, tenantId: string, releaseId: string, jobType: string, fn: () => Promise<void>) {
  const supabase = await createServiceRoleClient();
  const { data: job, error: createError } = await supabase
    .from('publish_jobs')
    .insert({
      site_id: siteId,
      tenant_id: tenantId,
      release_id: releaseId,
      job_type: jobType,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (createError || !job) {
    throw createError || new Error(`Unable to start publish job ${jobType}`);
  }

  try {
    await fn();
    await supabase
      .from('publish_jobs')
      .update({
        status: 'succeeded',
        finished_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown publish error';
    await supabase
      .from('publish_jobs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq('id', job.id);
    throw error;
  }
}

async function publishSettings(tenantId: string) {
  const context = await resolvePublishSiteContext(tenantId);
  if (!context) return;
  const document = await buildPublishedSettingsDocument(context);
  await writePublishedJson(buildPublishedPath(context.tenantSlug, 'settings'), document, 'public, max-age=30, stale-while-revalidate=120');
}

async function publishMenu(tenantId: string) {
  const context = await resolvePublishSiteContext(tenantId);
  if (!context) return;
  const document = await buildPublishedMenuDocument(context);
  await writePublishedJson(buildPublishedPath(context.tenantSlug, 'menu'), document, 'public, max-age=30, stale-while-revalidate=120');
}

async function publishIndexes(tenantId: string) {
  const context = await resolvePublishSiteContext(tenantId);
  if (!context) return;
  const supabase = await createServiceRoleClient();

  const [{ data: activeLayouts }, posts, search, tags, events, breakingNews, banners, bannerZones, mediaManifest, modules] = await Promise.all([
    supabase
      .from('layout_templates')
      .select('page_type')
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true),
    buildPublishedPostsDocument(context),
    buildPublishedSearchDocument(context),
    buildPublishedTagsDocument(context),
    buildPublishedEventsDocument(context),
    buildPublishedBreakingNewsDocument(context),
    buildPublishedBannersDocument(context),
    buildPublishedBannerZonesDocument(context),
    buildPublishedMediaManifestDocument(context),
    buildPublishedModulesDocument(context),
  ]);
  const layoutDocuments = (await Promise.all(
    (activeLayouts || []).map(async (layout) => {
      const document = await buildPublishedLayoutDocument(context, layout.page_type);
      return document ? [layout.page_type, document] as const : null;
    })
  )).filter((entry): entry is readonly [string, NonNullable<Awaited<ReturnType<typeof buildPublishedLayoutDocument>>>] => Boolean(entry));

  await Promise.all([
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'posts'), posts, 'public, max-age=20, stale-while-revalidate=60'),
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'search'), search, 'public, max-age=20, stale-while-revalidate=60'),
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'tags'), tags, 'public, max-age=60, stale-while-revalidate=300'),
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'events'), events, 'public, max-age=30, stale-while-revalidate=120'),
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'breaking-news'), breakingNews, 'public, max-age=15, stale-while-revalidate=60'),
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'banners'), banners, 'public, max-age=15, stale-while-revalidate=60'),
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'banner-zones'), bannerZones, 'public, max-age=15, stale-while-revalidate=60'),
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'media-manifest'), mediaManifest, 'public, max-age=60, stale-while-revalidate=300'),
    writePublishedJson(buildPublishedPath(context.tenantSlug, 'modules'), modules, 'public, max-age=20, stale-while-revalidate=60'),
    ...layoutDocuments.map(([pageType, document]) =>
      writePublishedJson(buildPublishedPath(context.tenantSlug, 'layout', pageType), document, 'public, max-age=20, stale-while-revalidate=60')
    ),
  ]);
}

async function publishHomepage(tenantId: string, pageId?: string | null) {
  const context = await resolvePublishSiteContext(tenantId);
  if (!context) return;
  const supabase = await createServiceRoleClient();
  let targetPageId = pageId || null;

  if (!targetPageId) {
    const { data: homepage } = await supabase
      .from('site_pages')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('is_published', true)
      .eq('page_type', 'homepage')
      .maybeSingle();
    targetPageId = homepage?.id || null;
  }

  if (!targetPageId) {
    return;
  }

  const document = await buildPublishedPageDocument(context, targetPageId);
  if (!document) return;
  await writePublishedJson(buildPublishedPath(context.tenantSlug, 'homepage'), document, 'public, max-age=30, stale-while-revalidate=120');
}

async function publishPage(tenantId: string, pageId: string) {
  const context = await resolvePublishSiteContext(tenantId);
  if (!context) return;
  const document = await buildPublishedPageDocument(context, pageId);
  if (!document) return;

  const isHomepage = document.page.pageType === 'homepage' || document.page.slug === 'homepage' || document.page.slug === '/';
  const path = isHomepage
    ? buildPublishedPath(context.tenantSlug, 'homepage')
    : buildPublishedPath(context.tenantSlug, 'page', document.page.slug);

  await writePublishedJson(path, document, 'public, max-age=30, stale-while-revalidate=120');
}

async function publishArticle(tenantId: string, articleId: string) {
  const context = await resolvePublishSiteContext(tenantId);
  if (!context) return;
  const document = await buildPublishedArticleDocument(context, articleId);
  if (!document) return;
  await writePublishedJson(buildPublishedPath(context.tenantSlug, 'article', document.article.slug), document, 'public, max-age=15, stale-while-revalidate=60');
}

async function publishCategory(tenantId: string, categoryId: string) {
  const context = await resolvePublishSiteContext(tenantId);
  if (!context) return;
  const document = await buildPublishedCategoryDocument(context, categoryId);
  if (!document) return;
  await writePublishedJson(buildPublishedPath(context.tenantSlug, 'category', document.category.slug), document, 'public, max-age=30, stale-while-revalidate=120');
}

async function publishAllPages(tenantId: string) {
  // Editorial data: use tenant-aware client (dedicated DB for enterprise)
  const supabase = await createServiceRoleClientForTenant(tenantId);
  const { data: pages } = await supabase
    .from('site_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_published', true);

  for (const page of pages || []) {
    await publishPage(tenantId, page.id);
  }
}

async function finalizeRelease(tenantId: string, releaseId: string, taskTypes: string[]) {
  const supabase = await createServiceRoleClient();
  const context = await resolvePublishSiteContext(tenantId);

  if (!context) {
    throw new Error('Unable to resolve publish context during finalize');
  }

  const manifest = await buildPublishedManifest(context, releaseId);
  const manifestPath = buildPublishedPath(context.tenantSlug, 'manifest');
  const checksum = createHash('sha256').update(JSON.stringify(manifest)).digest('hex');

  await writePublishedJson(manifestPath, manifest, 'public, max-age=10, stale-while-revalidate=30');

  await supabase
    .from('publish_releases')
    .update({ status: 'ready' })
    .eq('site_id', context.siteId)
    .eq('status', 'active');

  const { error: releaseError } = await supabase
    .from('publish_releases')
    .update({
      status: 'active',
      manifest_path: manifestPath,
      payload_checksum: checksum,
      activated_at: new Date().toISOString(),
      metadata: {
        changedTasks: taskTypes,
      },
    })
    .eq('id', releaseId);

  if (releaseError) {
    throw releaseError;
  }

  await supabase
    .from('site_infrastructure')
    .update({
      last_publish_at: new Date().toISOString(),
    })
    .eq('site_id', context.siteId);

  return manifest;
}

let _revalidationSecretWarned = false;

async function triggerRevalidation(tenantSlug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!baseUrl) return;

  if (!process.env.REVALIDATION_SECRET) {
    if (!_revalidationSecretWarned) {
      console.warn("[PUBLISH] REVALIDATION_SECRET non configurata - revalidation disabilitata");
      _revalidationSecretWarned = true;
    }
    return;
  }

  try {
    await fetch(`${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidation-secret": process.env.REVALIDATION_SECRET,
      },
      body: JSON.stringify({ tenantSlug, type: "full" }),
    });
  } catch (error) {
    console.error("Revalidation trigger failed:", error);
  }
}

export async function triggerPublish(tenantId: string, tasks: PublishTask[], initiatedBy?: string | null): Promise<PublishedManifest> {
  const { context, releaseId } = await startRelease(tenantId, initiatedBy);
  const executedTasks: string[] = [];
  const uniqueTasks = tasks.length > 0 ? tasks : [{ type: 'full_rebuild' } satisfies PublishTask];

  try {
    for (const task of uniqueTasks) {
      switch (task.type) {
        case 'settings':
          await runJob(context.siteId, context.tenantId, releaseId, 'publish_settings', async () => {
            await publishSettings(context.tenantId);
          });
          executedTasks.push(task.type);
          break;
        case 'menu':
          await runJob(context.siteId, context.tenantId, releaseId, 'publish_menu', async () => {
            await publishMenu(context.tenantId);
          });
          executedTasks.push(task.type);
          break;
        case 'homepage':
          await runJob(context.siteId, context.tenantId, releaseId, 'publish_homepage', async () => {
            await publishHomepage(context.tenantId, task.pageId);
          });
          executedTasks.push(task.type);
          break;
        case 'page':
          await runJob(context.siteId, context.tenantId, releaseId, 'publish_page', async () => {
            await publishPage(context.tenantId, task.pageId);
          });
          executedTasks.push(`${task.type}:${task.pageId}`);
          break;
        case 'article':
          await runJob(context.siteId, context.tenantId, releaseId, 'publish_article', async () => {
            await publishArticle(context.tenantId, task.articleId);
          });
          executedTasks.push(`${task.type}:${task.articleId}`);
          break;
        case 'category':
          await runJob(context.siteId, context.tenantId, releaseId, 'publish_category', async () => {
            await publishCategory(context.tenantId, task.categoryId);
          });
          executedTasks.push(`${task.type}:${task.categoryId}`);
          break;
        case 'full_rebuild':
          await runJob(context.siteId, context.tenantId, releaseId, 'full_rebuild', async () => {
            await publishSettings(context.tenantId);
            await publishMenu(context.tenantId);
            await publishAllPages(context.tenantId);

            const supabase = await createServiceRoleClient();
            const [{ data: articles }, { data: categories }] = await Promise.all([
              supabase
                .from('articles')
                .select('id')
                .eq('tenant_id', context.tenantId)
                .eq('status', 'published'),
              supabase
                .from('categories')
                .select('id')
                .eq('tenant_id', context.tenantId),
            ]);

            for (const article of articles || []) {
              await publishArticle(context.tenantId, article.id);
            }

            for (const category of categories || []) {
              await publishCategory(context.tenantId, category.id);
            }
          });
          executedTasks.push(task.type);
          break;
      }
    }

    await runJob(context.siteId, context.tenantId, releaseId, 'publish_indexes', async () => {
      await publishIndexes(context.tenantId);
    });
    executedTasks.push('posts');
    executedTasks.push('search');
    executedTasks.push('layouts');
    executedTasks.push('modules');
    executedTasks.push('media-manifest');
    executedTasks.push('banner-zones');

    const manifest = await finalizeRelease(context.tenantId, releaseId, executedTasks);

    // Invalidate cached pages so visitors see fresh content immediately
    await triggerRevalidation(context.tenantSlug);

    return manifest;
  } catch (error) {
    const supabase = await createServiceRoleClient();
    const message = error instanceof Error ? error.message : 'Unknown publish failure';
    await supabase
      .from('publish_releases')
      .update({
        status: 'failed',
        metadata: {
          error: message,
          changedTasks: executedTasks,
        },
      })
      .eq('id', releaseId);
    throw error;
  }
}

export type { PublishTask };
