import type { Block } from '@/lib/types/block';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number;
  profiles: { full_name: string; avatar_url: string | null };
  categories: { name: string; slug: string; color: string | null } | null;
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
  tenantSlug: string;
}

export function RenderArticleGrid({ block, data, style, tenantSlug }: Props) {
  const articles = data as Article[];
  const columns = (block.props.columns as number) ?? 3;
  const showImage = block.props.showImage !== false;
  const showExcerpt = block.props.showExcerpt !== false;
  const showCategory = block.props.showCategory !== false;
  const showAuthor = block.props.showAuthor !== false;
  const showDate = block.props.showDate !== false;

  return (
    <section
      style={{ ...style, gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      data-block="article-grid"
    >
      {articles.map((article) => (
        <a
          key={article.id}
          href={`/site/${tenantSlug}/articolo/${article.slug}`}
          className="group block overflow-hidden"
          style={{ borderRadius: 'var(--e-border-radius, 8px)', border: '1px solid var(--e-color-border, #dee2e6)' }}
        >
          {showImage && article.cover_image_url && (
            <div className="aspect-video overflow-hidden">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}
          <div style={{ padding: '16px' }}>
            {showCategory && article.categories && (
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: article.categories.color || 'var(--e-color-primary, #8B0000)' }}
              >
                {article.categories.name}
              </span>
            )}
            <h3
              className="font-bold mt-1 group-hover:underline"
              style={{ color: 'var(--e-color-text, #1a1a2e)', fontFamily: 'var(--e-font-heading)' }}
            >
              {article.title}
            </h3>
            {showExcerpt && article.summary && (
              <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--e-color-textSecondary, #6c757d)' }}>
                {article.summary}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: 'var(--e-color-textSecondary, #6c757d)' }}>
              {showAuthor && <span>{article.profiles?.full_name}</span>}
              {showDate && article.published_at && (
                <time>{new Date(article.published_at).toLocaleDateString('it-IT')}</time>
              )}
              <span>{article.reading_time_minutes} min</span>
            </div>
          </div>
        </a>
      ))}
    </section>
  );
}
