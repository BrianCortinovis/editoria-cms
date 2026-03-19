import type { Block } from '@/lib/types/block';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  profiles: { full_name: string };
  categories: { name: string; color: string | null } | null;
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
  tenantSlug: string;
}

export function RenderArticleHero({ block, data, style, tenantSlug }: Props) {
  const article = (data as Article[])[0];
  if (!article) return null;

  const overlayColor = (block.props.overlayColor as string) ?? 'rgba(0,0,0,0.5)';
  const showCategory = block.props.showCategory !== false;
  const showAuthor = block.props.showAuthor !== false;
  const showExcerpt = block.props.showExcerpt !== false;

  return (
    <a
      href={`/site/${tenantSlug}/articolo/${article.slug}`}
      className="block relative"
      style={{
        ...style,
        backgroundImage: article.cover_image_url ? `url(${article.cover_image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-block="article-hero"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor as string }}
      />
      <div className="relative z-10 max-w-3xl">
        {showCategory && article.categories && (
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded"
            style={{ backgroundColor: article.categories.color || 'var(--e-color-primary)', color: '#fff' }}>
            {article.categories.name}
          </span>
        )}
        <h1 className="text-3xl md:text-5xl font-bold mt-3" style={{ fontFamily: 'var(--e-font-heading)', color: '#fff' }}>
          {article.title}
        </h1>
        {showExcerpt && article.summary && (
          <p className="text-lg mt-3 opacity-90 line-clamp-2" style={{ color: '#fff' }}>
            {article.summary}
          </p>
        )}
        <div className="flex items-center gap-3 mt-4 text-sm opacity-80" style={{ color: '#fff' }}>
          {showAuthor && <span>{article.profiles?.full_name}</span>}
          {article.published_at && (
            <time>{new Date(article.published_at).toLocaleDateString('it-IT')}</time>
          )}
        </div>
      </div>
    </a>
  );
}
