#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://127.0.0.1:3000';
const PASSWORD = 'CodexTest123!';

const TENANT_A = {
  slug: 'valbrembana',
  name: 'Val Brembana Web',
  user: {
    email: 'codex-ai-test+tenant-a@valbrembana.local',
    name: 'Tenant A Isolation Test',
  },
  pageSlug: 'tenant-a-isolation-page',
  pageTitle: 'Tenant A Isolation Page',
  category: { name: 'Tenant A Categoria', slug: 'tenant-a-categoria' },
  tag: { name: 'Tenant A Tag', slug: 'tenant-a-tag' },
  article: {
    title: 'Tenant A articolo isolamento',
    slug: 'tenant-a-articolo-isolamento',
    token: 'TENANT_A_ISOLATION_TOKEN_2026',
  },
  banner: { name: 'Tenant A Banner Isolation' },
  event: { title: 'Tenant A Evento Isolation' },
  media: { filename: 'tenant-a-isolation.jpg', original_filename: 'tenant-a-isolation.jpg' },
};

const TENANT_B = {
  slug: 'isolamento-test',
  name: 'Isolamento Test',
  user: {
    email: 'codex-ai-test+tenant-b@isolamento.local',
    name: 'Tenant B Isolation Test',
  },
  pageSlug: 'tenant-b-isolation-page',
  pageTitle: 'Tenant B Isolation Page',
  category: { name: 'Tenant B Categoria', slug: 'tenant-b-categoria' },
  tag: { name: 'Tenant B Tag', slug: 'tenant-b-tag' },
  article: {
    title: 'Tenant B articolo isolamento',
    slug: 'tenant-b-articolo-isolamento',
    token: 'TENANT_B_ISOLATION_TOKEN_2026',
  },
  banner: { name: 'Tenant B Banner Isolation' },
  event: { title: 'Tenant B Evento Isolation' },
  media: { filename: 'tenant-b-isolation.jpg', original_filename: 'tenant-b-isolation.jpg' },
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase env mancanti');
  }
  return createClient(url, serviceKey);
}

async function ensureTenant(admin, config) {
  const { data: existing } = await admin
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', config.slug)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await admin
    .from('tenants')
    .insert({
      name: config.name,
      slug: config.slug,
      theme_config: {
        primary_color: config.slug === TENANT_A.slug ? '#8B0000' : '#004C99',
        font_sans: 'Inter',
        font_serif: 'Playfair Display',
      },
      settings: {
        active_modules: ['ai_assistant'],
      },
    })
    .select('id, slug, name')
    .single();

  if (error || !data) {
    throw new Error(error?.message || `Creazione tenant fallita: ${config.slug}`);
  }

  return data;
}

async function ensureUser(admin, email, password, name) {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    throw new Error(listError.message);
  }

  const existing = listed.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    const { data: updated, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error || !updated.user) {
      throw new Error(error?.message || `Update utente fallita: ${email}`);
    }
    return updated.user.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (error || !data.user) {
    throw new Error(error?.message || `Creazione utente fallita: ${email}`);
  }

  return data.user.id;
}

async function ensureProfile(admin, userId, email, name) {
  const { error } = await admin.from('profiles').upsert({
    id: userId,
    email,
    full_name: name,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureSingleMembership(admin, userId, tenantId, role = 'editor') {
  const { error: deleteError } = await admin
    .from('user_tenants')
    .delete()
    .eq('user_id', userId)
    .neq('tenant_id', tenantId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { data: existing } = await admin
    .from('user_tenants')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('user_tenants')
      .update({ role })
      .eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await admin.from('user_tenants').insert({
    user_id: userId,
    tenant_id: tenantId,
    role,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function ensurePage(admin, tenantId, userId, title, slug) {
  const { data: existing } = await admin
    .from('site_pages')
    .select('id, slug, tenant_id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle();

  const payload = {
    tenant_id: tenantId,
    title,
    slug,
    page_type: 'custom',
    is_published: true,
    created_by: userId,
    meta: {
      title,
      metaTitle: title,
      canonicalPath: `/${slug}`,
      metaDescription: `Pagina di test isolamento per ${title}`,
    },
    blocks: [],
  };

  if (existing) {
    const { data, error } = await admin
      .from('site_pages')
      .update(payload)
      .eq('id', existing.id)
      .select('id, slug, tenant_id')
      .single();
    if (error || !data) {
      throw new Error(error?.message || `Update pagina fallito: ${slug}`);
    }
    return data;
  }

  const { data, error } = await admin
    .from('site_pages')
    .insert(payload)
    .select('id, slug, tenant_id')
    .single();

  if (error || !data) {
    throw new Error(error?.message || `Creazione pagina fallita: ${slug}`);
  }

  return data;
}

async function ensureCategory(admin, tenantId, category) {
  const payload = {
    tenant_id: tenantId,
    name: category.name,
    slug: category.slug,
    description: `${category.name} description`,
    color: '#3366cc',
    sort_order: 1,
  };

  const { data: existing } = await admin
    .from('categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', category.slug)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('categories')
      .update(payload)
      .eq('id', existing.id)
      .select('id, name, slug')
      .single();
    if (error || !data) throw new Error(error?.message || `Update categoria fallita: ${category.slug}`);
    return data;
  }

  const { data, error } = await admin
    .from('categories')
    .insert(payload)
    .select('id, name, slug')
    .single();
  if (error || !data) throw new Error(error?.message || `Creazione categoria fallita: ${category.slug}`);
  return data;
}

async function ensureTag(admin, tenantId, tag) {
  const payload = { tenant_id: tenantId, name: tag.name, slug: tag.slug };
  const { data: existing } = await admin
    .from('tags')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', tag.slug)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('tags')
      .update(payload)
      .eq('id', existing.id)
      .select('id, name, slug')
      .single();
    if (error || !data) throw new Error(error?.message || `Update tag fallito: ${tag.slug}`);
    return data;
  }

  const { data, error } = await admin
    .from('tags')
    .insert(payload)
    .select('id, name, slug')
    .single();
  if (error || !data) throw new Error(error?.message || `Creazione tag fallita: ${tag.slug}`);
  return data;
}

async function ensureArticle(admin, tenantId, authorId, categoryId, tagId, article) {
  const payload = {
    tenant_id: tenantId,
    title: article.title,
    slug: article.slug,
    summary: `Summary ${article.token}`,
    body: `<p>Body ${article.token}</p>`,
    cover_image_url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    category_id: categoryId,
    author_id: authorId,
    status: 'published',
    is_featured: true,
    is_breaking: false,
    is_premium: false,
    meta_title: article.title,
    meta_description: `Meta ${article.token}`,
    og_image_url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    published_at: new Date().toISOString(),
    import_source: 'tenant-isolation-test',
    imported_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from('articles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', article.slug)
    .maybeSingle();

  let articleRow;
  if (existing) {
    const { data, error } = await admin
      .from('articles')
      .update(payload)
      .eq('id', existing.id)
      .select('id, slug, title')
      .single();
    if (error || !data) throw new Error(error?.message || `Update articolo fallito: ${article.slug}`);
    articleRow = data;
  } else {
    const { data, error } = await admin
      .from('articles')
      .insert(payload)
      .select('id, slug, title')
      .single();
    if (error || !data) throw new Error(error?.message || `Creazione articolo fallita: ${article.slug}`);
    articleRow = data;
  }

  await admin.from('article_categories').upsert({ article_id: articleRow.id, category_id: categoryId });
  await admin.from('article_authors').upsert({
    article_id: articleRow.id,
    author_id: authorId,
    role: 'Autore',
    sort_order: 0,
    is_primary: true,
  });
  await admin.from('article_tags').delete().eq('article_id', articleRow.id);
  await admin.from('article_tags').insert([{ article_id: articleRow.id, tag_id: tagId }]);
  return articleRow;
}

async function ensureBanner(admin, tenantId, banner) {
  const payload = {
    tenant_id: tenantId,
    name: banner.name,
    position: 'header',
    type: 'image',
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
    link_url: '#',
    target_categories: [],
    target_device: 'all',
    weight: 10,
    is_active: true,
  };

  const { data: existing } = await admin
    .from('banners')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('name', banner.name)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('banners')
      .update(payload)
      .eq('id', existing.id)
      .select('id, name')
      .single();
    if (error || !data) throw new Error(error?.message || `Update banner fallito: ${banner.name}`);
    return data;
  }

  const { data, error } = await admin
    .from('banners')
    .insert(payload)
    .select('id, name')
    .single();
  if (error || !data) throw new Error(error?.message || `Creazione banner fallita: ${banner.name}`);
  return data;
}

async function ensureEvent(admin, tenantId, event) {
  const payload = {
    tenant_id: tenantId,
    title: event.title,
    description: `${event.title} description`,
    location: 'Local test venue',
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    category: 'Test',
    price: 'Free',
    ticket_url: '#',
    starts_at: new Date(Date.now() + 86400000).toISOString(),
    ends_at: new Date(Date.now() + 90000000).toISOString(),
    is_recurring: false,
  };

  const { data: existing } = await admin
    .from('events')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('title', event.title)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('events')
      .update(payload)
      .eq('id', existing.id)
      .select('id, title')
      .single();
    if (error || !data) throw new Error(error?.message || `Update evento fallito: ${event.title}`);
    return data;
  }

  const { data, error } = await admin
    .from('events')
    .insert(payload)
    .select('id, title')
    .single();
  if (error || !data) throw new Error(error?.message || `Creazione evento fallita: ${event.title}`);
  return data;
}

async function ensureMedia(admin, tenantId, userId, media) {
  const payload = {
    tenant_id: tenantId,
    filename: media.filename,
    original_filename: media.original_filename,
    mime_type: 'image/jpeg',
    size_bytes: 12345,
    width: 1200,
    height: 800,
    url: `https://example.com/${media.filename}`,
    thumbnail_url: `https://example.com/${media.filename}`,
    uploaded_by: userId,
  };

  const { data: existing } = await admin
    .from('media')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('filename', media.filename)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('media')
      .update(payload)
      .eq('id', existing.id)
      .select('id, original_filename')
      .single();
    if (error || !data) throw new Error(error?.message || `Update media fallito: ${media.filename}`);
    return data;
  }

  const { data, error } = await admin
    .from('media')
    .insert(payload)
    .select('id, original_filename')
    .single();
  if (error || !data) throw new Error(error?.message || `Creazione media fallita: ${media.filename}`);
  return data;
}

async function ensureComment(admin, tenantId, articleId, token) {
  const body = `Comment ${token}`;
  const { data: existing } = await admin
    .from('article_comments')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('article_id', articleId)
    .eq('body', body)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await admin
    .from('article_comments')
    .insert({
      tenant_id: tenantId,
      article_id: articleId,
      author_name: 'Isolation Tester',
      author_email: `isolation-${token.toLowerCase()}@example.com`,
      body,
      status: 'approved',
      source: 'website',
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message || `Creazione commento fallita: ${token}`);
  return data;
}

async function clickButtonByText(page, text) {
  await page.waitForFunction((needle) => {
    return [...document.querySelectorAll('button, a')].some((el) => el.textContent?.trim().includes(needle));
  }, {}, text);

  await page.evaluate((needle) => {
    const el = [...document.querySelectorAll('button, a')].find((candidate) => candidate.textContent?.trim().includes(needle));
    if (!(el instanceof HTMLElement)) {
      throw new Error(`Elemento ${needle} non trovato`);
    }
    el.click();
  }, text);
}

async function login(page, email, password) {
  console.log(`[tenant-test] login ${email}`);
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForFunction(() => {
      return window.location.pathname !== '/auth/login';
    }, { timeout: 30000 });
  } catch (error) {
    const debugText = await page.evaluate(() => document.body.innerText || '');
    throw new Error(`Login non completato per ${email}. Stato pagina: ${debugText.slice(0, 500)}`);
  }
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
}

async function api(page, path, options = {}) {
  return page.evaluate(async ({ path: requestPath, options: requestOptions }) => {
    const response = await fetch(requestPath, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(requestOptions.headers || {}),
      },
    });

    let json = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    return {
      status: response.status,
      ok: response.ok,
      json,
    };
  }, { path, options });
}

async function pageContainsText(page, path, ownNeedle, otherNeedle) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const text = await page.evaluate(() => document.body.innerText || '');
  return {
    ownVisible: text.includes(ownNeedle),
    otherHidden: !text.includes(otherNeedle),
  };
}

async function runChecks(page, actor, own, other) {
  await login(page, actor.email, PASSWORD);
  console.log(`[tenant-test] checks for ${actor.email}`);

  const ownPages = await api(page, `/api/builder/pages?tenant_id=${own.tenant.id}`);
  const otherPages = await api(page, `/api/builder/pages?tenant_id=${other.tenant.id}`);
  const ownPageGet = await api(page, `/api/builder/pages/${own.page.id}`);
  const otherPageGet = await api(page, `/api/builder/pages/${other.page.id}`);
  const otherPagePut = await api(page, `/api/builder/pages/${other.page.id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: `${other.page.slug}-tampered` }),
  });
  const publicOwnPages = await api(page, `/api/v1/pages?tenant=${own.tenant.slug}`);
  const publicOtherPages = await api(page, `/api/v1/pages?tenant=${other.tenant.slug}`);
  const commandsOther = await api(page, `/api/v1/commands?tenant_id=${other.tenant.id}`);
  const publicArticles = await api(page, `/api/v1/articles?tenant=${own.tenant.slug}&limit=20`);
  const ownArticleDetail = await api(page, `/api/v1/articles/${own.article.slug}?tenant=${own.tenant.slug}`);
  const otherArticleDetail = await api(page, `/api/v1/articles/${other.article.slug}?tenant=${own.tenant.slug}`);
  const publicCategories = await api(page, `/api/v1/categories?tenant=${own.tenant.slug}`);
  const publicTags = await api(page, `/api/v1/tags?tenant=${own.tenant.slug}`);
  const publicEvents = await api(page, `/api/v1/events?tenant=${own.tenant.slug}`);
  const publicBanners = await api(page, `/api/v1/banners?tenant=${own.tenant.slug}&position=header`);
  const searchOwn = await api(page, `/api/v1/search?tenant=${own.tenant.slug}&q=${own.article.token}`);
  const searchOther = await api(page, `/api/v1/search?tenant=${other.tenant.slug}&q=${own.article.token}`);
  const commentsOwn = await api(page, `/api/v1/articles/${own.article.slug}/comments?tenant=${own.tenant.slug}`);
  const commentsOther = await api(page, `/api/v1/articles/${other.article.slug}/comments?tenant=${own.tenant.slug}`);
  const mediaDashboard = await pageContainsText(page, '/dashboard/media', own.media.original_filename, other.media.original_filename);
  const bannerDashboard = await pageContainsText(page, '/dashboard/banner', own.banner.name, other.banner.name);
  const articlesDashboard = await pageContainsText(page, '/dashboard/articoli', own.article.title, other.article.title);

  return {
    actor: actor.email,
    ownTenant: own.tenant.slug,
    blockedListOtherTenant: otherPages.status === 403,
    hiddenOtherPage: otherPageGet.status === 403 || otherPageGet.status === 404,
    blockedPutOtherPage: otherPagePut.status === 403,
    blockedCommandsOtherTenant: commandsOther.status === 403,
    ownListOk: ownPages.status === 200,
    ownGetOk: ownPageGet.status === 200,
    publicArticlesOwnOnly: Array.isArray(publicArticles.json?.articles)
      ? publicArticles.json.articles.some((item) => item.slug === own.article.slug) &&
        !publicArticles.json.articles.some((item) => item.slug === other.article.slug)
      : false,
    articleDetailOwnOnly: ownArticleDetail.status === 200 && otherArticleDetail.status === 404,
    publicCategoriesOwnOnly: Array.isArray(publicCategories.json?.categories)
      ? publicCategories.json.categories.some((item) => item.slug === own.category.slug) &&
        !publicCategories.json.categories.some((item) => item.slug === other.category.slug)
      : false,
    publicTagsOwnOnly: Array.isArray(publicTags.json?.tags)
      ? publicTags.json.tags.some((item) => item.slug === own.tag.slug) &&
        !publicTags.json.tags.some((item) => item.slug === other.tag.slug)
      : false,
    publicEventsOwnOnly: Array.isArray(publicEvents.json?.events)
      ? publicEvents.json.events.some((item) => item.title === own.event.title) &&
        !publicEvents.json.events.some((item) => item.title === other.event.title)
      : false,
    publicBannersNoLeak: Array.isArray(publicBanners.json?.banners)
      ? !publicBanners.json.banners.some((item) => item.name === other.banner.name)
      : false,
    searchOwnNoLeak: Array.isArray(searchOwn.json?.results)
      ? !searchOwn.json.results.some((item) => JSON.stringify(item).includes(other.article.token))
      : false,
    searchOtherNoLeak: Array.isArray(searchOther.json?.results)
      ? !searchOther.json.results.some((item) => JSON.stringify(item).includes(own.article.token))
      : false,
    commentsOwnOnly: commentsOwn.status === 200 && commentsOther.status === 404,
    mediaDashboardNoLeak: mediaDashboard.otherHidden,
    bannerDashboardNoLeak: bannerDashboard.otherHidden,
    articlesDashboardNoLeak: articlesDashboard.otherHidden,
    publicOwnHasOwnPage: Array.isArray(publicOwnPages.json?.pages)
      ? publicOwnPages.json.pages.some((item) => item.slug === own.page.slug)
      : false,
    publicOtherExcludesOwnPage: Array.isArray(publicOtherPages.json?.pages)
      ? !publicOtherPages.json.pages.some((item) => item.slug === own.page.slug)
      : false,
    debug: {
      ownPagesStatus: ownPages.status,
      otherPagesStatus: otherPages.status,
      ownPageGetStatus: ownPageGet.status,
      otherPageGetStatus: otherPageGet.status,
      otherPagePutStatus: otherPagePut.status,
      commandsOtherStatus: commandsOther.status,
      ownArticleDetailStatus: ownArticleDetail.status,
      otherArticleDetailStatus: otherArticleDetail.status,
      commentsOwnStatus: commentsOwn.status,
      commentsOtherStatus: commentsOther.status,
    },
  };
}

async function main() {
  const admin = getAdminClient();
  console.log('[tenant-test] prepare tenants');

  const tenantA = await ensureTenant(admin, TENANT_A);
  const tenantB = await ensureTenant(admin, TENANT_B);
  console.log('[tenant-test] prepare users');

  const userAId = await ensureUser(admin, TENANT_A.user.email, PASSWORD, TENANT_A.user.name);
  const userBId = await ensureUser(admin, TENANT_B.user.email, PASSWORD, TENANT_B.user.name);

  await ensureProfile(admin, userAId, TENANT_A.user.email, TENANT_A.user.name);
  await ensureProfile(admin, userBId, TENANT_B.user.email, TENANT_B.user.name);

  await ensureSingleMembership(admin, userAId, tenantA.id, 'editor');
  await ensureSingleMembership(admin, userBId, tenantB.id, 'editor');
  console.log('[tenant-test] prepare pages');

  const pageA = await ensurePage(admin, tenantA.id, userAId, TENANT_A.pageTitle, TENANT_A.pageSlug);
  const pageB = await ensurePage(admin, tenantB.id, userBId, TENANT_B.pageTitle, TENANT_B.pageSlug);
  const categoryA = await ensureCategory(admin, tenantA.id, TENANT_A.category);
  const categoryB = await ensureCategory(admin, tenantB.id, TENANT_B.category);
  const tagA = await ensureTag(admin, tenantA.id, TENANT_A.tag);
  const tagB = await ensureTag(admin, tenantB.id, TENANT_B.tag);
  const articleA = await ensureArticle(admin, tenantA.id, userAId, categoryA.id, tagA.id, TENANT_A.article);
  const articleB = await ensureArticle(admin, tenantB.id, userBId, categoryB.id, tagB.id, TENANT_B.article);
  const bannerA = await ensureBanner(admin, tenantA.id, TENANT_A.banner);
  const bannerB = await ensureBanner(admin, tenantB.id, TENANT_B.banner);
  const eventA = await ensureEvent(admin, tenantA.id, TENANT_A.event);
  const eventB = await ensureEvent(admin, tenantB.id, TENANT_B.event);
  const mediaA = await ensureMedia(admin, tenantA.id, userAId, TENANT_A.media);
  const mediaB = await ensureMedia(admin, tenantB.id, userBId, TENANT_B.media);
  await ensureComment(admin, tenantA.id, articleA.id, TENANT_A.article.token);
  await ensureComment(admin, tenantB.id, articleB.id, TENANT_B.article.token);
  console.log('[tenant-test] launch browser');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const contextA = await browser.createBrowserContext();
    const pageForA = await contextA.newPage();
    pageForA.setDefaultTimeout(120000);
    const resultA = await runChecks(
      pageForA,
      TENANT_A.user,
      { tenant: tenantA, page: pageA, article: articleA, category: categoryA, tag: tagA, banner: bannerA, event: eventA, media: mediaA },
      { tenant: tenantB, page: pageB, article: articleB, category: categoryB, tag: tagB, banner: bannerB, event: eventB, media: mediaB }
    );
    await pageForA.close();
    await contextA.close();

    const contextB = await browser.createBrowserContext();
    const pageForB = await contextB.newPage();
    pageForB.setDefaultTimeout(120000);
    const resultB = await runChecks(
      pageForB,
      TENANT_B.user,
      { tenant: tenantB, page: pageB, article: articleB, category: categoryB, tag: tagB, banner: bannerB, event: eventB, media: mediaB },
      { tenant: tenantA, page: pageA, article: articleA, category: categoryA, tag: tagA, banner: bannerA, event: eventA, media: mediaA }
    );
    await pageForB.close();
    await contextB.close();

    console.log(JSON.stringify({
      tenantA: { id: tenantA.id, slug: tenantA.slug, pageId: pageA.id, user: TENANT_A.user.email },
      tenantB: { id: tenantB.id, slug: tenantB.slug, pageId: pageB.id, user: TENANT_B.user.email },
      checks: [resultA, resultB],
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
