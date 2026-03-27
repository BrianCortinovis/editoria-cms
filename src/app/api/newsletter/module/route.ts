import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import {
  buildNewsletterConfigFooter,
  normalizeNewsletterModule,
  type NewsletterModuleState,
} from "@/lib/newsletter/module";
import { normalizeNewsletterConfig, type SiteNewsletterConfig } from "@/lib/site/newsletter";

const NEWSLETTER_EDIT_ROLES = new Set(["super_admin", "chief_editor", "editor"]);

function asObject(input: unknown) {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

async function getTenantAccess(tenantId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, role: null as string | null };
  }

  const { data: membership } = await supabase
    .from("user_tenants")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, role: membership?.role || null };
}

async function ensureSiteConfig(tenantId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!error && data) {
    return { supabase, config: data };
  }

  const { data: created, error: createError } = await supabase
    .from("site_config")
    .insert({ tenant_id: tenantId })
    .select("*")
    .single();

  if (createError || !created) {
    throw new Error(createError?.message || "Unable to initialize site config");
  }

  return { supabase, config: created };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await getTenantAccess(tenantId);
  if (!access.user || !access.role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { supabase, config } = await ensureSiteConfig(tenantId);
    const footerRecord = asObject(config.footer);

    const [formsRes, categoriesRes, articlesRes] = await Promise.all([
      supabase
        .from("site_forms")
        .select("id, name, slug")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("categories")
        .select("id, name, slug, sort_order")
        .eq("tenant_id", tenantId)
        .order("sort_order")
        .order("name"),
      supabase
        .from("articles")
        .select("id, title, slug, summary, cover_image_url, published_at, categories:categories!articles_category_id_fkey(name, slug)")
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(40),
    ]);

    return NextResponse.json({
      config: normalizeNewsletterConfig(footerRecord),
      moduleState: normalizeNewsletterModule(footerRecord),
      forms: formsRes.data || [],
      categories: categoriesRes.data || [],
      articles: (articlesRes.data || []).map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        coverImageUrl: article.cover_image_url,
        publishedAt: article.published_at,
        categoryName:
          article.categories && typeof article.categories === "object" && "name" in article.categories
            ? String(article.categories.name || "")
            : null,
        categorySlug:
          article.categories && typeof article.categories === "object" && "slug" in article.categories
            ? String(article.categories.slug || "")
            : null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load newsletter module";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  const config = body?.config as SiteNewsletterConfig | undefined;
  const moduleState = body?.moduleState as NewsletterModuleState | undefined;

  if (!tenantId || !config || !moduleState) {
    return NextResponse.json({ error: "tenant_id, config and moduleState required" }, { status: 400 });
  }

  const { supabase, user, role } = await getTenantAccess(tenantId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!role || !NEWSLETTER_EDIT_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { config: existingConfig } = await ensureSiteConfig(tenantId);
    const currentFooter = asObject(existingConfig.footer);
    const currentNewsletter = normalizeNewsletterConfig(currentFooter);
    const nextFooter = buildNewsletterConfigFooter(currentFooter, config, moduleState);

    const { data, error } = await supabase
      .from("site_config")
      .update({ footer: nextFooter })
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to save newsletter module" }, { status: 500 });
    }

    await writeActivityLog({
      tenantId,
      userId: user.id,
      action: "newsletter.module.update",
      entityType: "site_config",
      details: {
        campaigns: moduleState.campaigns.length,
        provider: config.provider.provider,
      },
    });

    if (JSON.stringify(currentNewsletter) !== JSON.stringify(config)) {
      await triggerPublish(tenantId, [{ type: "settings" }], user.id);
    }

    return NextResponse.json({
      ok: true,
      config: normalizeNewsletterConfig(asObject(data.footer)),
      moduleState: normalizeNewsletterModule(asObject(data.footer)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save newsletter module";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
