#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
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

const supabase = createClient(supabaseUrl, serviceRoleKey);

const EMPTY_THEME = {
  fonts: {
    heading: "Georgia, serif",
    body: "system-ui, sans-serif",
    mono: "monospace",
  },
  colors: {
    primary: "#111827",
    accent: "#111827",
    background: "#ffffff",
    surface: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    secondary: "#6b7280",
  },
  spacing: {
    unit: 4,
    sectionGap: "40px",
    containerMax: "1200px",
  },
  borderRadius: "0px",
  layoutPreset: "default",
  mastheadNote: "",
};

const EMPTY_NAVIGATION = {
  primary: [],
  secondary: [],
  mobile: [],
  footer: [],
};

const EMPTY_FOOTER = {
  description: "",
  copyright: "",
  columns: [],
  links: [],
  socialLinks: [],
  newsletter: {
    enabled: false,
    title: "",
    description: "",
    buttonText: "",
    formSlug: "",
  },
  newsletterSettings: {
    enabled: false,
  },
};

const TENANT_TABLES = [
  "article_comments",
  "article_tags",
  "article_categories",
  "slot_assignments",
  "site_page_revisions",
  "page_audit_log",
  "activity_log",
  "seo_analysis_history",
  "form_submissions",
  "site_forms",
  "redirects",
  "layout_slots",
  "layout_templates",
  "site_pages",
  "articles",
  "banners",
  "breaking_news",
  "events",
  "media",
  "categories",
  "tags",
  "notifications",
];

const SITE_TABLES = ["publish_jobs", "publish_releases"];

async function listAllStoragePaths(bucket, prefix) {
  const paths = [];
  const queue = [prefix.replace(/^\/+|\/+$/g, "")];

  while (queue.length > 0) {
    const current = queue.shift();
    const { data, error } = await supabase.storage.from(bucket).list(current, {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw error;
    }

    for (const entry of data || []) {
      if (!entry?.name) continue;
      const path = current ? `${current}/${entry.name}` : entry.name;
      const hasSize = typeof entry.metadata?.size === "number" || entry.id !== null;

      if (hasSize) {
        paths.push(path);
      } else {
        queue.push(path);
      }
    }
  }

  return paths;
}

async function removeStoragePaths(bucket, paths) {
  if (!paths.length) return;

  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100);
    const { error } = await supabase.storage.from(bucket).remove(batch);
    if (error) {
      throw error;
    }
  }
}

async function safeDeleteBy(table, column, value) {
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) {
    const message = String(error.message || "");
    if (
      error.code === "PGRST205" ||
      message.includes(`column ${column} does not exist`) ||
      message.includes(`Could not find the '${column}' column`) ||
      message.includes(`Could not find the table 'public.${table}'`) ||
      message.includes("does not exist")
    ) {
      return false;
    }
    throw error;
  }
  return true;
}

async function resetSiteConfig(tenantId) {
  const { error } = await supabase.from("site_config").upsert(
    {
      tenant_id: tenantId,
      theme: EMPTY_THEME,
      navigation: EMPTY_NAVIGATION,
      footer: EMPTY_FOOTER,
      global_css: null,
      global_head: null,
      favicon_url: null,
      og_defaults: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" }
  );

  if (error) {
    throw error;
  }
}

function buildPublishedPath(slug, kind) {
  return `sites/${encodeURIComponent(slug)}/${kind}.json`;
}

async function writePublishedJson(path, payload, cacheControl = "public, max-age=30, stale-while-revalidate=120") {
  const { error } = await supabase.storage.from("published").upload(path, JSON.stringify(payload, null, 2), {
    contentType: "application/json",
    cacheControl,
    upsert: true,
  });

  if (error) {
    throw error;
  }
}

async function createEmptyPublishedLayer({ site, tenant, config }) {
  const generatedAt = new Date().toISOString();
  const releaseId = randomUUID();

  const manifest = {
    siteId: site.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    releaseId,
    generatedAt,
    documents: {
      settings: buildPublishedPath(tenant.slug, "settings"),
      menu: buildPublishedPath(tenant.slug, "menu"),
      homepage: null,
      posts: buildPublishedPath(tenant.slug, "posts"),
      search: buildPublishedPath(tenant.slug, "search"),
      tags: buildPublishedPath(tenant.slug, "tags"),
      events: buildPublishedPath(tenant.slug, "events"),
      breakingNews: buildPublishedPath(tenant.slug, "breaking-news"),
      banners: buildPublishedPath(tenant.slug, "banners"),
      layouts: {},
    },
    pages: {},
    articles: {},
    categories: {},
  };

  const settings = {
    type: "settings",
    generatedAt,
    siteId: site.id,
    tenantId: tenant.id,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      logo_url: tenant.logo_url || null,
    },
    config,
    tenantSettings: tenant.settings || {},
  };

  const menu = {
    type: "menu",
    generatedAt,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    navigation: EMPTY_NAVIGATION,
    footer: EMPTY_FOOTER,
  };

  const emptyDocs = [
    { path: buildPublishedPath(tenant.slug, "posts"), body: { type: "posts", generatedAt, tenantId: tenant.id, siteId: site.id, articles: [], total: 0 } },
    { path: buildPublishedPath(tenant.slug, "search"), body: { type: "search", generatedAt, tenantId: tenant.id, siteId: site.id, entries: [] } },
    { path: buildPublishedPath(tenant.slug, "tags"), body: { type: "tags", generatedAt, tenantId: tenant.id, siteId: site.id, tags: [] } },
    { path: buildPublishedPath(tenant.slug, "events"), body: { type: "events", generatedAt, tenantId: tenant.id, siteId: site.id, events: [] } },
    { path: buildPublishedPath(tenant.slug, "breaking-news"), body: { type: "breaking-news", generatedAt, tenantId: tenant.id, siteId: site.id, items: [] } },
    { path: buildPublishedPath(tenant.slug, "banners"), body: { type: "banners", generatedAt, tenantId: tenant.id, siteId: site.id, banners: [] } },
  ];

  await Promise.all([
    writePublishedJson(buildPublishedPath(tenant.slug, "settings"), settings),
    writePublishedJson(buildPublishedPath(tenant.slug, "menu"), menu),
    writePublishedJson(`sites/${encodeURIComponent(tenant.slug)}/manifest.json`, manifest, "public, max-age=10, stale-while-revalidate=30"),
    ...emptyDocs.map((entry) => writePublishedJson(entry.path, entry.body)),
  ]);

  const { error: releaseError } = await supabase.from("publish_releases").insert({
    id: releaseId,
    site_id: site.id,
    tenant_id: tenant.id,
    version_label: `reset-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    status: "active",
    manifest_path: `sites/${encodeURIComponent(tenant.slug)}/manifest.json`,
    payload_checksum: null,
    activated_at: generatedAt,
    created_by: null,
    metadata: {
      trigger: "cms_reset",
      emptied: true,
    },
  });

  if (releaseError) {
    throw releaseError;
  }

  const { error: jobError } = await supabase.from("publish_jobs").insert({
    site_id: site.id,
    tenant_id: tenant.id,
    release_id: releaseId,
    job_type: "content_reset",
    status: "succeeded",
    started_at: generatedAt,
    finished_at: generatedAt,
  });

  if (jobError) {
    throw jobError;
  }

  const { error: infraError } = await supabase
    .from("site_infrastructure")
    .update({ last_publish_at: generatedAt })
    .eq("site_id", site.id);

  if (infraError) {
    throw infraError;
  }
}

async function verifyTenantIsEmpty(tenantId, siteId) {
  const checks = [
    ["site_pages", "tenant_id"],
    ["articles", "tenant_id"],
    ["categories", "tenant_id"],
    ["tags", "tenant_id"],
    ["banners", "tenant_id"],
    ["breaking_news", "tenant_id"],
    ["events", "tenant_id"],
    ["media", "tenant_id"],
    ["publish_releases", "site_id"],
  ];

  const result = {};

  for (const [table, column] of checks) {
    const value = column === "site_id" ? siteId : tenantId;
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value);
    if (error) {
      throw error;
    }
    result[table] = count ?? 0;
  }

  return result;
}

async function resetTenant(site, tenant) {
  console.log(`\nReset ${tenant.slug} (${tenant.id})`);

  const { data: mediaRows, error: mediaError } = await supabase
    .from("media")
    .select("filename")
    .eq("tenant_id", tenant.id);

  if (mediaError) {
    throw mediaError;
  }

  const publishedFiles = await listAllStoragePaths("published", `sites/${tenant.slug}`);
  const mediaFiles = (mediaRows || [])
    .map((row) => String(row.filename || "").trim())
    .filter(Boolean);

  await removeStoragePaths("published", publishedFiles);
  await removeStoragePaths("media", mediaFiles);

  for (const table of SITE_TABLES) {
    await safeDeleteBy(table, "site_id", site.id);
  }

  for (const table of TENANT_TABLES) {
    await safeDeleteBy(table, "tenant_id", tenant.id);
  }

  await resetSiteConfig(tenant.id);

  const cleanConfig = {
    theme: EMPTY_THEME,
    navigation: EMPTY_NAVIGATION,
    footer: EMPTY_FOOTER,
    favicon_url: null,
    og_defaults: {},
    global_css: null,
  };

  await createEmptyPublishedLayer({ site, tenant, config: cleanConfig });

  const summary = await verifyTenantIsEmpty(tenant.id, site.id);
  console.log(JSON.stringify(summary, null, 2));
}

async function main() {
  const { data: tenants, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug, domain, logo_url, settings")
    .order("created_at", { ascending: true });

  if (tenantError || !tenants) {
    throw tenantError || new Error("Unable to load tenants");
  }

  const { data: sites, error: siteError } = await supabase
    .from("sites")
    .select("id, tenant_id, slug, name")
    .is("deleted_at", null);

  if (siteError || !sites) {
    throw siteError || new Error("Unable to load sites");
  }

  for (const tenant of tenants) {
    const site = sites.find((entry) => entry.tenant_id === tenant.id);
    if (!site) {
      console.log(`Skip ${tenant.slug}: no site linked`);
      continue;
    }
    await resetTenant(site, tenant);
  }

  console.log("\nCMS content reset completed for all active tenants.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
