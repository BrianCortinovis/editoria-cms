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
  const linkBaseColor = colorMode === 'accent' ? 'var(--e-color-primary, #8B0000)' : 'var(--e-color-text, #1a1a2e)';

  if (navStyle === 'dropdown') {
    return (
      <details style={style} data-block="category-nav">
        <summary
          style={{
            cursor: 'pointer',
            listStyle: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            border: '1px solid var(--e-color-border, #dbe2ea)',
            background: 'var(--e-color-surface, #fff)',
            color: linkBaseColor,
            fontWeight: 600,
          }}
        >
          Categorie
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.75rem' }}>
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`/site/${tenantSlug}/categoria/${cat.slug}`}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                textDecoration: 'none',
                background: 'var(--e-color-surface, #fff)',
                border: '1px solid var(--e-color-border, #dbe2ea)',
                color: colorMode === 'category' && cat.color ? cat.color : linkBaseColor,
              }}
            >
              {cat.name}
            </a>
          ))}
        </div>
      </details>
    );
  }

  return (
    <nav
      style={{
        ...style,
        display: 'flex',
        flexWrap: navStyle === 'sidebar' ? 'nowrap' : 'wrap',
        flexDirection: navStyle === 'sidebar' ? 'column' : 'row',
        gap: navStyle === 'sidebar' ? '0.55rem' : '0.65rem',
      }}
      data-block="category-nav"
      className="flex flex-wrap"
    >
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
                : linkBaseColor,
            } : navStyle === 'sidebar' ? {
              padding: '10px 14px',
              borderRadius: '14px',
              border: '1px solid var(--e-color-border, #dbe2ea)',
              backgroundColor: 'var(--e-color-surface, #fff)',
              color: colorMode === 'category' && cat.color ? cat.color : linkBaseColor,
              width: '100%',
            } : {
              padding: '8px 0',
              borderBottom: `2px solid ${colorMode === 'category' && cat.color ? cat.color : 'transparent'}`,
              color: colorMode === 'category' && cat.color ? cat.color : linkBaseColor,
            }),
          }}
        >
          {cat.name}
        </a>
      ))}
    </nav>
  );
}
