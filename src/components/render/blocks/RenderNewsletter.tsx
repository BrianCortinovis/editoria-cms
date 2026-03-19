import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderNewsletter({ block, style }: Props) {
  const title = (block.props.title as string) || 'Iscriviti alla newsletter';
  const description = (block.props.description as string) || '';
  const buttonText = (block.props.buttonText as string) || 'Iscriviti';
  const placeholder = (block.props.placeholder as string) || 'La tua email';

  return (
    <section
      style={{
        ...style,
        padding: style.padding || '3rem 2rem',
        textAlign: 'center',
      }}
      data-block="newsletter"
    >
      <h2
        style={{
          fontFamily: 'var(--e-font-heading)',
          fontSize: '1.75rem',
          fontWeight: 'bold',
          color: 'var(--e-color-text)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h2>
      {description && (
        <p style={{ color: 'var(--e-color-textSecondary)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
          {description}
        </p>
      )}
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{
          display: 'flex',
          gap: '0.5rem',
          maxWidth: '480px',
          margin: '0 auto',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <input
          type="email"
          placeholder={placeholder}
          style={{
            flex: '1 1 250px',
            padding: '0.75rem 1rem',
            border: '1px solid var(--e-color-border, #dee2e6)',
            borderRadius: 'var(--e-border-radius, 8px)',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--e-color-primary, #8B0000)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--e-border-radius, 8px)',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {buttonText}
        </button>
      </form>
    </section>
  );
}
