#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const env = {
  ...loadEnvFile(".env.local"),
  ...process.env,
};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const tenantSlug = process.argv[2] || "valbrembana";
const destinationRoot =
  process.argv[3] || "/Users/briancortinovis/Desktop/Valbrembana Giornale /output/data/cms";
const prefix = `sites/${encodeURIComponent(tenantSlug)}`;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listAllFiles(currentPrefix) {
  const files = [];
  const queue = [currentPrefix];

  while (queue.length > 0) {
    const nextPrefix = queue.shift();
    const { data, error } = await supabase.storage.from("published").list(nextPrefix, {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;

    for (const entry of data || []) {
      if (!entry?.name) continue;
      const fullPath = `${nextPrefix}/${entry.name}`;
      const isFile = typeof entry.metadata?.size === "number" || entry.id !== null;

      if (isFile) {
        files.push(fullPath);
      } else {
        queue.push(fullPath);
      }
    }
  }

  return files;
}

async function main() {
  const files = await listAllFiles(prefix);

  if (!files.length) {
    throw new Error(`No published files found for tenant ${tenantSlug}`);
  }

  fs.rmSync(destinationRoot, { recursive: true, force: true });
  fs.mkdirSync(destinationRoot, { recursive: true });

  for (const publishedPath of files) {
    const relative = publishedPath.slice(prefix.length + 1);
    const destination = path.join(destinationRoot, relative);
    const { data, error } = await supabase.storage.from("published").download(publishedPath);

    if (error || !data) {
      throw error || new Error(`Unable to download ${publishedPath}`);
    }

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, Buffer.from(await data.arrayBuffer()));
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name, domain, logo_url, settings")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    throw tenantError || new Error(`Unable to load tenant ${tenantSlug}`);
  }

  const [{ data: siteConfig }, { data: articles }, { data: banners }, { data: media }, { data: breakingNews }] =
    await Promise.all([
      supabase
        .from("site_config")
        .select("theme, navigation, footer, favicon_url, og_defaults, global_css")
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
      supabase
        .from("articles")
        .select("id, title, subtitle, slug, summary, body, cover_image_url, published_at, reading_time_minutes, meta_title, meta_description, og_image_url, is_featured, is_breaking, is_premium, author_id, category_id")
        .eq("tenant_id", tenant.id)
        .eq("status", "published")
        .order("published_at", { ascending: false }),
      supabase
        .from("banners")
        .select("id, name, position, type, image_url, html_content, link_url, target_device, weight, starts_at, ends_at, advertiser_id, target_categories, is_active")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true),
      supabase
        .from("media")
        .select("id, filename, original_filename, mime_type, size_bytes, width, height, url, thumbnail_url, alt_text, folder, created_at")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("breaking_news")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  const categoryIds = [...new Set((articles || []).map((article) => article.category_id).filter(Boolean))];
  const authorIds = [...new Set((articles || []).map((article) => article.author_id).filter(Boolean))];

  const [{ data: categories }, { data: authors }] = await Promise.all([
    categoryIds.length
      ? supabase
          .from("categories")
          .select("id, name, slug, color, description")
          .in("id", categoryIds)
      : Promise.resolve({ data: [] }),
    authorIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, avatar_url, bio")
          .in("id", authorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const categoryMap = Object.fromEntries((categories || []).map((category) => [category.id, category]));
  const authorMap = Object.fromEntries((authors || []).map((author) => [author.id, author]));

  const generatedAt = new Date().toISOString();

  const settingsPath = path.join(destinationRoot, "settings.json");
  const settingsPayload = {
    type: "settings",
    generatedAt,
    siteId: null,
    tenantId: tenant.id,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain || null,
      logo_url: tenant.logo_url || null,
    },
    config: siteConfig
      ? {
          theme: siteConfig.theme || {},
          navigation: siteConfig.navigation || {},
          footer: siteConfig.footer || {},
          favicon_url: siteConfig.favicon_url || null,
          og_defaults: siteConfig.og_defaults || {},
          global_css: siteConfig.global_css || null,
        }
      : null,
    tenantSettings: tenant.settings || {},
  };
  fs.writeFileSync(settingsPath, JSON.stringify(settingsPayload, null, 2));

  const normalizedArticles = (articles || []).map((article) => ({
    id: article.id,
    title: article.title,
    subtitle: article.subtitle,
    slug: article.slug,
    summary: article.summary,
    body: article.body,
    cover_image_url: article.cover_image_url,
    published_at: article.published_at,
    reading_time_minutes: article.reading_time_minutes,
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    og_image_url: article.og_image_url,
    is_featured: article.is_featured,
    is_breaking: article.is_breaking,
    is_premium: article.is_premium,
    profiles: authorMap[article.author_id] || null,
    categories: article.category_id ? categoryMap[article.category_id] || null : null,
    all_categories: article.category_id && categoryMap[article.category_id] ? [categoryMap[article.category_id]] : [],
  }));

  fs.writeFileSync(
    path.join(destinationRoot, "posts.json"),
    JSON.stringify(
      {
        type: "posts",
        generatedAt,
        tenantId: tenant.id,
        siteId: null,
        articles: normalizedArticles,
        total: normalizedArticles.length,
      },
      null,
      2,
    ),
  );

  const articlesRoot = path.join(destinationRoot, "articles");
  fs.mkdirSync(articlesRoot, { recursive: true });
  for (const article of normalizedArticles) {
    fs.writeFileSync(
      path.join(articlesRoot, `${article.slug}.json`),
      JSON.stringify(
        {
          type: "article",
          generatedAt,
          tenantId: tenant.id,
          siteId: null,
          article,
        },
        null,
        2,
      ),
    );
  }

  fs.writeFileSync(
    path.join(destinationRoot, "banners.json"),
    JSON.stringify(
      {
        type: "banners",
        generatedAt,
        tenantId: tenant.id,
        siteId: null,
        banners: banners || [],
      },
      null,
      2,
    ),
  );

  const mediaItems = Object.fromEntries(
    (media || []).map((item) => [
      item.id,
      {
        id: item.id,
        filename: item.filename,
        originalFilename: item.original_filename,
        mimeType: item.mime_type,
        sizeBytes: item.size_bytes,
        width: item.width,
        height: item.height,
        url: item.url,
        thumbnailUrl: item.thumbnail_url,
        altText: item.alt_text,
        folder: item.folder,
        createdAt: item.created_at,
      },
    ]),
  );

  const mediaByFilename = Object.fromEntries(
    Object.values(mediaItems).map((item) => [item.filename, item.id]),
  );

  fs.writeFileSync(
    path.join(destinationRoot, "media-manifest.json"),
    JSON.stringify(
      {
        type: "media-manifest",
        generatedAt,
        tenantId: tenant.id,
        siteId: null,
        items: mediaItems,
        byFilename: mediaByFilename,
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    path.join(destinationRoot, "breaking-news.json"),
    JSON.stringify(
      {
        type: "breaking-news",
        generatedAt,
        tenantId: tenant.id,
        siteId: null,
        items: breakingNews || [],
      },
      null,
      2,
    ),
  );

  console.log(`Synced ${files.length} files to ${destinationRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
