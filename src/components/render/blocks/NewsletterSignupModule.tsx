'use client';

import { useMemo, useState } from 'react';
import type { Block } from '@/lib/types/block';
import type { SiteNewsletterConfig } from '@/lib/site/newsletter';

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
  tenantSlug?: string;
  compactDefault?: boolean;
}

function resolveCustomConfig(block: Block): SiteNewsletterConfig {
  return {
    enabled: true,
    mode: String(block.props.mode || 'form') === 'provider' ? 'provider' : 'form',
    title: String(block.props.title || 'Iscriviti alla newsletter'),
    description: String(block.props.description || ''),
    buttonText: String(block.props.buttonText || 'Iscriviti'),
    placeholder: String(block.props.placeholder || 'La tua email'),
    privacyText: String(block.props.privacyText || ''),
    successMessage: String(block.props.successMessage || 'Grazie per l’iscrizione!'),
    formSlug: String(block.props.formSlug || ''),
    compact: Boolean(block.props.compact),
    theme: 'light',
    provider: {
      provider: 'custom',
      audienceLabel: '',
      formAction: String(block.props.formAction || ''),
      webhookUrl: '',
      listId: '',
      senderName: '',
      senderEmail: '',
      replyTo: '',
      doubleOptIn: true,
    },
    digest: {
      enabled: false,
      frequency: 'weekly',
      sendTime: '07:30',
      intro: '',
      categories: [],
      includeBreaking: false,
      includeEvents: false,
    },
    placements: {
      homepage: false,
      articleInline: false,
      articleFooter: false,
      categoryHeader: false,
      footer: false,
      stickyBar: false,
    },
    leadMagnet: {
      enabled: false,
      title: '',
      description: '',
    },
    segments: [],
  };
}

export function NewsletterSignupModule({ block, data, style, tenantSlug, compactDefault = false }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const mode = String(block.props.mode || 'global');
  const globalConfig = (data[0] && typeof data[0] === 'object') ? (data[0] as SiteNewsletterConfig) : null;
  const config = useMemo(() => {
    if (mode === 'global' && globalConfig) {
      return globalConfig;
    }
    return resolveCustomConfig(block);
  }, [block, globalConfig, mode]);

  const compact = compactDefault || config.compact;
  const buttonPaddingX = Number(block.props.buttonPaddingX || 20);
  const buttonPaddingY = Number(block.props.buttonPaddingY || 14);
  const buttonRadius = Number(block.props.buttonRadius || 12);
  const themeStyles = config.theme === 'dark'
    ? { background: '#0f172a', foreground: '#e2e8f0', muted: '#94a3b8', border: '#1e293b' }
    : config.theme === 'accent'
      ? { background: 'rgba(139, 0, 0, 0.08)', foreground: 'var(--e-color-text, #111827)', muted: 'var(--e-color-textSecondary, #64748b)', border: 'rgba(139, 0, 0, 0.22)' }
      : { background: 'var(--e-color-surface, #f8fafc)', foreground: 'var(--e-color-text, #111827)', muted: 'var(--e-color-textSecondary, #64748b)', border: 'var(--e-color-border, #dbe2ea)' };

  const externalAction = config.mode === 'provider' ? config.provider.formAction : '';
  const localFormSlug = config.formSlug;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (externalAction) {
      return;
    }

    event.preventDefault();
    if (!tenantSlug || !localFormSlug) {
      setStatus('error');
      setMessage('Modulo newsletter non collegato a un form CMS o provider esterno.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(`/api/v1/forms/${localFormSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenantSlug,
          payload: { email, source: 'newsletter' },
          source_page: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Errore iscrizione newsletter');
      }

      setStatus('success');
      setMessage(payload.message || config.successMessage);
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Errore iscrizione newsletter');
    }
  };

  if (!config.enabled) {
    return null;
  }

  return (
    <section
      style={{
        ...style,
        background: style.background || themeStyles.background,
        color: themeStyles.foreground,
        border: `1px solid ${themeStyles.border}`,
        borderRadius: style.borderRadius || '18px',
        padding: compact ? '1.25rem' : (style.padding || '2.25rem 1.75rem'),
      }}
      data-block="newsletter-module"
    >
      {config.leadMagnet.enabled && (config.leadMagnet.title || config.leadMagnet.description) && (
        <div style={{ marginBottom: '0.9rem', fontSize: '0.82rem', color: themeStyles.muted }}>
          {config.leadMagnet.title && <strong>{config.leadMagnet.title}</strong>}
          {config.leadMagnet.title && config.leadMagnet.description ? ' · ' : ''}
          {config.leadMagnet.description}
        </div>
      )}

      <div style={{ textAlign: compact ? 'left' : 'center' }}>
        <h3 style={{ fontFamily: 'var(--e-font-heading)', fontSize: compact ? '1.25rem' : '1.85rem', fontWeight: 800, marginBottom: '0.45rem' }}>
          {config.title}
        </h3>
        {config.description && (
          <p style={{ color: themeStyles.muted, margin: compact ? '0 0 1rem' : '0 auto 1rem', maxWidth: compact ? 'none' : '560px', lineHeight: 1.6 }}>
            {config.description}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        action={externalAction || undefined}
        method={externalAction ? 'post' : undefined}
        style={{
          display: 'flex',
          flexDirection: compact ? 'row' : 'row',
          gap: '0.65rem',
          maxWidth: compact ? 'none' : '560px',
          margin: compact ? '0' : '0 auto',
          flexWrap: 'wrap',
          justifyContent: compact ? 'flex-start' : 'center',
        }}
      >
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={config.placeholder}
          style={{
            flex: '1 1 260px',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: `1px solid ${themeStyles.border}`,
            background: '#fff',
            color: '#0f172a',
          }}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
            borderRadius: `${buttonRadius}px`,
            border: 'none',
            background: 'var(--e-color-primary, #8B0000)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: status === 'submitting' ? 0.72 : 1,
          }}
        >
          {status === 'submitting' ? 'Invio...' : config.buttonText}
        </button>
      </form>

      {config.privacyText && (
        <p style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: themeStyles.muted, textAlign: compact ? 'left' : 'center' }}>
          {config.privacyText}
        </p>
      )}

      {config.segments.length > 0 && (
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.95rem', justifyContent: compact ? 'flex-start' : 'center' }}>
          {config.segments.map((segment) => (
            <span
              key={segment.value}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                background: 'rgba(15,23,42,0.06)',
                color: themeStyles.foreground,
              }}
            >
              {segment.label}
            </span>
          ))}
        </div>
      )}

      {message && (
        <div style={{ marginTop: '0.9rem', fontSize: '0.9rem', color: status === 'error' ? '#dc2626' : '#059669', textAlign: compact ? 'left' : 'center' }}>
          {message}
        </div>
      )}
    </section>
  );
}
