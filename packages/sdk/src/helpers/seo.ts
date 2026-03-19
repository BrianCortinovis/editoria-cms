import type { Article, SiteInfo } from '../types';

/**
 * Generate meta tags for an article page.
 * Pure function — no network calls.
 */
export function generateArticleMeta(article: Article, siteName?: string) {
  return {
    title: article.title,
    description: article.summary || '',
    openGraph: {
      title: article.title,
      description: article.summary || '',
      type: 'article' as const,
      publishedTime: article.published_at || undefined,
      authors: article.author ? [article.author.full_name] : [],
      section: article.category?.name,
      images: article.cover_image_url ? [{ url: article.cover_image_url }] : [],
      siteName,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: article.title,
      description: article.summary || '',
      images: article.cover_image_url ? [article.cover_image_url] : [],
    },
  };
}

/**
 * Generate JSON-LD structured data for an article.
 */
export function generateJsonLd(article: Article, siteUrl: string, siteName?: string): string {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary || '',
    image: article.cover_image_url || undefined,
    datePublished: article.published_at || undefined,
    author: article.author
      ? { '@type': 'Person', name: article.author.full_name }
      : undefined,
    publisher: siteName
      ? { '@type': 'Organization', name: siteName }
      : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/articolo/${article.slug}`,
    },
    wordCount: article.reading_time_minutes * 200,
    articleSection: article.category?.name,
  };

  return JSON.stringify(ld);
}

/**
 * Generate a sitemap XML string from a list of articles.
 */
export function generateSitemap(
  articles: Pick<Article, 'slug' | 'published_at'>[],
  siteUrl: string
): string {
  const urls = articles.map((a) => {
    const lastmod = a.published_at ? `<lastmod>${new Date(a.published_at).toISOString()}</lastmod>` : '';
    return `  <url><loc>${siteUrl}/articolo/${a.slug}</loc>${lastmod}<changefreq>daily</changefreq></url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>
${urls.join('\n')}
</urlset>`;
}

/**
 * Generate RSS 2.0 feed from articles.
 */
export function generateRSS(
  articles: Article[],
  siteUrl: string,
  siteName: string,
  siteDescription?: string
): string {
  const items = articles.map((a) => `    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${siteUrl}/articolo/${a.slug}</link>
      <description><![CDATA[${a.summary || ''}]]></description>
      <pubDate>${a.published_at ? new Date(a.published_at).toUTCString() : ''}</pubDate>
      <guid isPermaLink="true">${siteUrl}/articolo/${a.slug}</guid>
      ${a.category ? `<category>${a.category.name}</category>` : ''}
      ${a.author ? `<dc:creator>${a.author.full_name}</dc:creator>` : ''}
    </item>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription || siteName}</description>
    <language>it</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>`;
}
