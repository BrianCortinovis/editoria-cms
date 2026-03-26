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
  const cardStyle = String(block.props.cardStyle || 'default');
  const imageAspectRatio = String(block.props.imageAspectRatio || '16/9');
  const cardPadding = String(block.props.cardPadding || '16px');
  const isOverlay = cardStyle === 'overlay';
  const isMinimal = cardStyle === 'minimal';
  const isCompact = cardStyle === 'compact';
  const isMagazine = cardStyle === 'magazine';

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
          style={{
            position: 'relative',
            borderRadius: 'var(--e-border-radius, 8px)',
            border: isMinimal ? 'none' : '1px solid var(--e-color-border, #dee2e6)',
            background: isMagazine ? 'var(--e-color-surface, #fff)' : undefined,
            boxShadow: isMagazine ? '0 14px 34px rgba(15,23,42,0.08)' : undefined,
          }}
        >
          {showImage && article.cover_image_url && (
            <div className="overflow-hidden" style={{ aspectRatio: imageAspectRatio }}>
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}
          <div
            style={{
              padding: isMinimal ? '0.35rem 0' : cardPadding,
              position: isOverlay ? 'absolute' : 'relative',
              inset: isOverlay ? 'auto 0 0 0' : undefined,
              background: isOverlay ? 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.78) 100%)' : undefined,
              color: isOverlay ? '#fff' : undefined,
            }}
          >
            {showCategory && article.categories && (
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: isOverlay ? '#fff' : (article.categories.color || 'var(--e-color-primary, #8B0000)') }}
              >
                {article.categories.name}
              </span>
            )}
            <h3
              className="font-bold mt-1 group-hover:underline"
              style={{ color: isOverlay ? '#fff' : 'var(--e-color-text, #1a1a2e)', fontFamily: 'var(--e-font-heading)', fontSize: isCompact ? '1rem' : isMagazine ? '1.2rem' : '1.05rem' }}
            >
              {article.title}
            </h3>
            {showExcerpt && article.summary && (
              <p className="text-sm mt-2 line-clamp-2" style={{ color: isOverlay ? 'rgba(255,255,255,0.88)' : 'var(--e-color-textSecondary, #6c757d)' }}>
                {article.summary}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: isOverlay ? 'rgba(255,255,255,0.78)' : 'var(--e-color-textSecondary, #6c757d)' }}>
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
