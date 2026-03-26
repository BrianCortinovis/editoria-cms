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

  const overlayColor = String(block.props.overlayColor || '#000000');
  const overlayOpacity = Number(block.props.overlayOpacity || 0.5);
  const showCategory = block.props.showCategory !== false;
  const showAuthor = block.props.showAuthor !== false;
  const showDate = block.props.showDate !== false;
  const showExcerpt = block.props.showExcerpt !== false;
  const contentAlign = String(block.props.contentAlign || 'left');
  const contentWidth = String(block.props.contentWidth || '780px');
  const contentOffsetX = Number(block.props.contentOffsetX || 0);
  const contentOffsetY = Number(block.props.contentOffsetY || 0);
  const panelStyle = String(block.props.panelStyle || 'none');
  const height = String(block.props.height || style.minHeight || '500px');
  const panelStyles: Record<string, React.CSSProperties> = {
    none: {},
    glass: {
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.16)',
      borderRadius: '22px',
      boxShadow: '0 20px 42px rgba(15,23,42,0.22)',
    },
    'solid-dark': {
      background: 'rgba(15,23,42,0.78)',
      borderRadius: '22px',
      border: '1px solid rgba(255,255,255,0.08)',
    },
  };

  return (
    <a
      href={`/site/${tenantSlug}/articolo/${article.slug}`}
      className="block relative"
      style={{
        ...style,
        backgroundImage: article.cover_image_url ? `url(${article.cover_image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: height,
      }}
      data-block="article-hero"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
      />
      <div
        className="relative z-10"
        data-article-hero-part="content"
        style={{
          maxWidth: contentWidth,
          textAlign: contentAlign as React.CSSProperties['textAlign'],
          marginLeft: contentAlign === 'right' ? 'auto' : undefined,
          marginRight: contentAlign === 'left' ? 'auto' : undefined,
          padding: panelStyle === 'none' ? 0 : '1.2rem 1.35rem',
          transform: `translate(${contentOffsetX}px, ${contentOffsetY}px)`,
          ...panelStyles[panelStyle],
        }}
      >
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
          {showDate && article.published_at && (
            <time>{new Date(article.published_at).toLocaleDateString('it-IT')}</time>
          )}
        </div>
      </div>
    </a>
  );
}
