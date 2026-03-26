import type { Block } from '@/lib/types/block';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  price: string | null;
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
}

export function RenderEventList({ block, data, style }: Props) {
  const allEvents = data as Event[];
  const limit = Math.max(1, Number(block.props.limit || 5));
  const layout = String(block.props.layout || 'list');
  const showLocation = block.props.showLocation !== false;
  const showPrice = block.props.showPrice === true;
  const events = allEvents.slice(0, limit);

  return (
    <section
      style={{
        ...style,
        display: 'grid',
        gap: layout === 'compact' ? '0.65rem' : '1rem',
        gridTemplateColumns: layout === 'cards' ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr',
      }}
      data-block="event-list"
    >
      {events.map((event) => {
        const date = new Date(event.starts_at);
        return (
          <article
            key={event.id}
            className="flex gap-4 rounded-lg hover:bg-black/5 transition"
            style={{
              padding: layout === 'compact' ? '0.85rem 1rem' : '1rem',
              borderBottom: layout === 'cards' ? 'none' : '1px solid var(--e-color-border, #dee2e6)',
              border: layout === 'cards' ? '1px solid var(--e-color-border, #dee2e6)' : undefined,
              background: layout === 'cards' ? 'var(--e-color-surface, #fff)' : undefined,
              boxShadow: layout === 'cards' ? '0 10px 24px rgba(15,23,42,0.06)' : undefined,
            }}
          >
            <div className="shrink-0 w-14 text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--e-color-primary, #8B0000)' }}>
                {date.getDate()}
              </div>
              <div className="text-xs uppercase" style={{ color: 'var(--e-color-textSecondary)' }}>
                {date.toLocaleDateString('it-IT', { month: 'short' })}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold" style={{ color: 'var(--e-color-text)', fontFamily: 'var(--e-font-heading)' }}>
                {event.title}
              </h3>
              {event.description && (
                <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--e-color-textSecondary)' }}>
                  {event.description}
                </p>
              )}
              <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--e-color-textSecondary)' }}>
                <span>{date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                {showLocation && event.location && <span>{event.location}</span>}
                {showPrice && event.price && <span>{event.price}</span>}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
