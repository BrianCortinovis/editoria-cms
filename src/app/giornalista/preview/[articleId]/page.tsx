import { notFound } from "next/navigation";
import Image from "next/image";
import { requireAuth } from "@/lib/auth";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { resolveTenant } from "@/lib/site/tenant-resolver";
import { SiteLayout } from "@/components/render/SiteLayout";
import { sanitizeHtml } from "@/lib/security/html";
import { enrichArticlesWithCategories } from "@/lib/articles/taxonomy";

interface Props {
  params: Promise<{ articleId: string }>;
}

interface PreviewArticleRecord {
  id: string;
  tenant_id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  summary: string | null;
  body: string;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  language?: string | null;
  category_id?: string | null;
  profiles?: { full_name: string; avatar_url: string | null; bio: string | null } | null;
  categories?: { name: string; slug: string; color: string | null } | null;
  all_categories?: Array<{ name: string; slug: string; color: string | null }>;
}

export default async function JournalistArticlePreviewPage({ params }: Props) {
  const { articleId } = await params;
  const user = await requireAuth();
  const sessionClient = await createServerSupabaseClient();
  const serviceClient = await createServiceRoleClient();

  const { data: article } = await serviceClient
    .from("articles")
    .select("id, tenant_id, title, subtitle, slug, summary, body, cover_image_url, published_at, reading_time_minutes, meta_title, meta_description, og_image_url, language, category_id, profiles!articles_author_id_fkey(full_name, avatar_url, bio), categories:categories!articles_category_id_fkey(id, name, slug, color)")
    .eq("id", articleId)
    .maybeSingle();

  if (!article) {
    notFound();
  }

  const { data: membership } = await sessionClient
    .from("user_tenants")
    .select("role")
    .eq("tenant_id", article.tenant_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: tenantRow } = await serviceClient
    .from("tenants")
    .select("slug")
    .eq("id", article.tenant_id)
    .maybeSingle();

  if (!tenantRow?.slug) {
    notFound();
  }

  const resolved = await resolveTenant(tenantRow.slug);
  if (!resolved) {
    notFound();
  }

  const [enrichedArticle] = await enrichArticlesWithCategories(
    serviceClient as never,
    article.tenant_id,
    [article as unknown as PreviewArticleRecord],
  );

  const previewArticle = enrichedArticle as PreviewArticleRecord;
  const categories = previewArticle.all_categories || [];
  const author = previewArticle.profiles as {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  const publishedAt = previewArticle.published_at || new Date().toISOString();

  return (
    <SiteLayout
      tenant={resolved.tenant}
      config={resolved.config}
      tenantSettings={resolved.tenantSettings}
    >
      <article style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--e-section-gap, 48px) 0" }}>
        <div
          style={{
            marginBottom: "18px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "999px",
            background: "color-mix(in srgb, var(--e-color-primary, #2563eb) 10%, transparent)",
            color: "var(--e-color-primary, #2563eb)",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Anteprima giornalista
        </div>

        {categories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {categories.map((category) => (
              <span
                key={category.slug}
                style={{
                  color: category.color || "var(--e-color-primary)",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        <h1
          style={{
            fontFamily: "var(--e-font-heading)",
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 800,
            lineHeight: 1.15,
            marginTop: "12px",
            color: "var(--e-color-text)",
          }}
        >
          {previewArticle.title}
        </h1>

        {previewArticle.subtitle ? (
          <p style={{ fontSize: "20px", color: "var(--e-color-textSecondary)", marginTop: "12px", lineHeight: 1.4 }}>
            {previewArticle.subtitle}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "24px",
            paddingBottom: "24px",
            borderBottom: "1px solid var(--e-color-border)",
            fontSize: "14px",
            color: "var(--e-color-textSecondary)",
            flexWrap: "wrap",
          }}
        >
          {author ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {author.avatar_url ? (
                <Image
                  src={author.avatar_url}
                  alt={author.full_name}
                  width={32}
                  height={32}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : null}
              <span style={{ fontWeight: 600 }}>{author.full_name}</span>
            </div>
          ) : null}
          <time dateTime={publishedAt}>
            {previewArticle.published_at ? "Pubblicato il" : "Anteprima data"}{" "}
            {new Date(publishedAt).toLocaleString("it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          <span>{previewArticle.reading_time_minutes || 1} min di lettura</span>
        </div>

        {previewArticle.cover_image_url ? (
          <Image
            src={previewArticle.cover_image_url}
            alt={previewArticle.title}
            width={800}
            height={450}
            priority
            sizes="(max-width: 768px) 100vw, 800px"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "var(--e-border-radius, 8px)",
              marginTop: "32px",
            }}
          />
        ) : null}

        <div
          className="article-body prose prose-lg max-w-none"
          style={{ marginTop: "32px", lineHeight: 1.8, fontSize: "18px" }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewArticle.body || "") }}
        />

        <style>{`
          .article-body iframe,
          .article-body video {
            width: 100%;
            max-width: 100%;
            border: 0;
            border-radius: 12px;
          }

          .article-body iframe {
            aspect-ratio: 16 / 9;
          }

          .article-body audio {
            width: 100%;
            margin: 12px 0;
          }

          .article-body figure {
            margin: 24px 0;
          }

          .article-body figcaption {
            margin-top: 8px;
            font-size: 14px;
            color: var(--e-color-textSecondary);
          }

          .article-body [data-media-gallery="grid"] {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin: 28px 0;
          }

          .article-body [data-media-gallery="grid"] .desk-gallery-item {
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px;
            border-radius: 16px;
            background: color-mix(in srgb, var(--e-color-surface, #f8fafc) 84%, white 16%);
          }

          .article-body [data-media-gallery="grid"] img,
          .article-body [data-media-gallery="grid"] video {
            width: 100%;
            height: auto;
            border-radius: 12px;
            object-fit: cover;
          }

          .article-body [data-media-gallery="grid"] audio {
            width: 100%;
          }

          @media (max-width: 640px) {
            .article-body [data-media-gallery="grid"] {
              grid-template-columns: 1fr;
            }
          }

          .article-body::after {
            content: "";
            display: table;
            clear: both;
          }
        `}</style>

        {author?.bio ? (
          <div
            style={{
              marginTop: "48px",
              padding: "24px",
              backgroundColor: "var(--e-color-surface)",
              borderRadius: "var(--e-border-radius, 8px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              {author.avatar_url ? (
                <Image
                  src={author.avatar_url}
                  alt={author.full_name}
                  width={48}
                  height={48}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : null}
              <div style={{ fontWeight: 700 }}>{author.full_name}</div>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "var(--e-color-textSecondary)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {author.bio}
            </p>
          </div>
        ) : null}
      </article>
    </SiteLayout>
  );
}
