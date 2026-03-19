import type { Block } from '@/lib/types/block';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
  tenantSlug: string;
}

export function RenderCategoryNav({ block, data, style, tenantSlug }: Props) {
  const categories = data as Category[];
  const { style: navStyle = 'pills', colorMode = 'category' } = block.props as Record<string, unknown>;

  return (
    <nav style={style} data-block="category-nav" className="flex flex-wrap">
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={`/site/${tenantSlug}/categoria/${cat.slug}`}
          className="text-sm font-medium transition-colors hover:opacity-80"
          style={{
            ...(navStyle === 'pills' ? {
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: colorMode === 'category' && cat.color
                ? `${cat.color}20`
                : 'var(--e-color-surface, #f8f9fa)',
              color: colorMode === 'category' && cat.color
                ? cat.color
                : 'var(--e-color-text, #1a1a2e)',
            } : {
              padding: '8px 0',
              borderBottom: '2px solid transparent',
              color: 'var(--e-color-text, #1a1a2e)',
            }),
          }}
        >
          {cat.name}
        </a>
      ))}
    </nav>
  );
}
