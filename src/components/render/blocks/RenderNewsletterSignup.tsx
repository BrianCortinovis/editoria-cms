import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
}

export function RenderNewsletterSignup({ block, style }: Props) {
  const title = (block.props.title as string) || 'Resta aggiornato';
  const description = (block.props.description as string) || 'Iscriviti per ricevere le ultime notizie nella tua inbox.';
  const buttonText = (block.props.buttonText as string) || 'Iscriviti';
  const compact = (block.props.compact as boolean) ?? false;

  if (compact) {
    return (
      <div style={{ ...style, display: 'flex', gap: '0.5rem', alignItems: 'center' }} data-block="newsletter-signup">
        <input
          type="email"
          placeholder="Email"
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--e-color-border, #dee2e6)',
            borderRadius: 'var(--e-border-radius, 8px)',
            fontSize: '0.875rem',
          }}
        />
        <button style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--e-color-primary, #8B0000)', color: '#fff', border: 'none', borderRadius: 'var(--e-border-radius, 8px)', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}>
          {buttonText}
        </button>
      </div>
    );
  }

  return (
    <section
      style={{
        ...style,
        padding: style.padding || '3rem 2rem',
        textAlign: 'center',
        backgroundColor: style.backgroundColor || 'var(--e-color-surface, #f8f9fa)',
        borderRadius: 'var(--e-border-radius, 8px)',
      }}
      data-block="newsletter-signup"
    >
      <h3 style={{ fontFamily: 'var(--e-font-heading)', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--e-color-text)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--e-color-textSecondary)', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
        {description}
      </p>
      <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px', margin: '0 auto' }}>
        <input
          type="email"
          placeholder="La tua email"
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid var(--e-color-border, #dee2e6)',
            borderRadius: 'var(--e-border-radius, 8px)',
            fontSize: '1rem',
          }}
        />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--e-color-primary, #8B0000)', color: '#fff', border: 'none', borderRadius: 'var(--e-border-radius, 8px)', fontWeight: '600', cursor: 'pointer' }}>
          {buttonText}
        </button>
      </form>
    </section>
  );
}
