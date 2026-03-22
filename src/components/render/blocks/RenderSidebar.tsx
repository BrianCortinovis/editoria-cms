import Link from 'next/link';
import type { Block } from '@/lib/types/block';

interface SidebarWidget {
  id?: string;
  type: string;
  title: string;
  props?: Record<string, unknown>;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
  tenantSlug: string;
}

export function RenderSidebar({ block, style, tenantSlug }: Props) {
  const widgets = ((block.props.widgets as SidebarWidget[]) || []).filter((widget) => widget?.type);

  return (
    <aside style={style} data-block="sidebar">
      {widgets.map((widget) => (
        <section key={widget.id || widget.title} style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--e-color-border, #dbe2ea)', background: 'var(--e-color-surface, #fff)' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--e-color-text)', marginBottom: '0.8rem' }}>
            {widget.title}
          </h4>

          {widget.type === 'search' && (
            <form action={`/site/${tenantSlug}/search`} style={{ display: 'flex', gap: '0.5rem' }}>
              <input name="q" placeholder={String(widget.props?.placeholder || 'Cerca nel sito...')} style={{ flex: 1, padding: '0.7rem 0.8rem', borderRadius: '10px', border: '1px solid var(--e-color-border, #dbe2ea)' }} />
              <button type="submit" style={{ padding: '0.7rem 0.95rem', borderRadius: '10px', border: 'none', background: 'var(--e-color-primary, #8B0000)', color: '#fff' }}>Vai</button>
            </form>
          )}

          {widget.type === 'recent-posts' && (
            <div style={{ display: 'grid', gap: '0.7rem' }}>
              {((widget.props?.posts as Array<{ title: string; url?: string; date?: string }>) || []).map((post, index) => (
                <div key={index}>
                  <Link href={post.url || '#'} style={{ color: 'var(--e-color-text)', textDecoration: 'none', fontWeight: 600 }}>
                    {post.title}
                  </Link>
                  {post.date && <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--e-color-textSecondary)' }}>{post.date}</div>}
                </div>
              ))}
            </div>
          )}

          {widget.type === 'categories' && (
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              {((widget.props?.categories as Array<{ name: string; count?: number; url?: string }>) || []).map((category, index) => (
                <Link key={index} href={category.url || '#'} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.7rem', color: 'var(--e-color-text)', textDecoration: 'none' }}>
                  <span>{category.name}</span>
                  {typeof category.count === 'number' ? <span style={{ color: 'var(--e-color-textSecondary)' }}>{category.count}</span> : null}
                </Link>
              ))}
            </div>
          )}

          {widget.type === 'tags' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {((widget.props?.tags as string[]) || []).map((tag) => (
                <span key={tag} style={{ padding: '0.3rem 0.65rem', borderRadius: '999px', background: 'var(--e-color-surface, #f8fafc)', border: '1px solid var(--e-color-border, #dbe2ea)', fontSize: '0.78rem' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>
      ))}
    </aside>
  );
}
