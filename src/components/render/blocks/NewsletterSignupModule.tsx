'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Block } from '@/lib/types/block';
import type { SiteNewsletterConfig, SiteNewsletterSubscriptionField } from '@/lib/site/newsletter';
import { isTurnstileWidgetConfigured, TurnstileWidget } from '@/components/public/TurnstileWidget';

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
  tenantSlug?: string;
  compactDefault?: boolean;
}

interface CardProps {
  config: SiteNewsletterConfig;
  tenantSlug?: string;
  style: React.CSSProperties;
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
    subscriptionFields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: String(block.props.placeholder || 'La tua email'),
        helpText: '',
        width: 'full',
        options: [],
      },
      {
        name: 'privacy_consent',
        label: String(block.props.privacyText || 'Accetto informativa privacy e comunicazioni editoriali della testata.'),
        type: 'checkbox',
        required: true,
        placeholder: '',
        helpText: '',
        width: 'full',
        options: [],
      },
    ],
  };
}

function getInitialValues(fields: SiteNewsletterSubscriptionField[]) {
  return Object.fromEntries(
    fields.map((field) => [field.name, field.type === 'checkbox' ? false : '']),
  ) as Record<string, string | boolean>;
}

function renderField(
  field: SiteNewsletterSubscriptionField,
  values: Record<string, string | boolean>,
  setValues: React.Dispatch<React.SetStateAction<Record<string, string | boolean>>>,
  compact: boolean,
  mutedColor: string,
  borderColor: string,
) {
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: `1px solid ${borderColor}`,
    background: '#fff',
    color: '#0f172a',
    fontSize: '0.95rem',
  };

  const label = (
    <span style={{ fontSize: compact ? '0.82rem' : '0.85rem', fontWeight: 600 }}>
      {field.label}
      {field.required ? ' *' : ''}
    </span>
  );

  const help = field.helpText ? (
    <span style={{ fontSize: '0.75rem', color: mutedColor }}>{field.helpText}</span>
  ) : null;

  const updateValue = (nextValue: string | boolean) => {
    setValues((current) => ({ ...current, [field.name]: nextValue }));
  };

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    gridColumn: field.width === 'half' && !compact ? 'span 1' : '1 / -1',
  };

  if (field.type === 'checkbox') {
    return (
      <label key={field.name} style={{ ...wrapperStyle, flexDirection: 'row', alignItems: 'flex-start', gap: '0.7rem' }}>
        <input
          type="checkbox"
          checked={Boolean(values[field.name])}
          onChange={(event) => updateValue(event.target.checked)}
          style={{ marginTop: '0.25rem' }}
        />
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {label}
          {help}
        </span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label key={field.name} style={wrapperStyle}>
        {label}
        <textarea
          name={field.name}
          required={field.required}
          value={String(values[field.name] || '')}
          onChange={(event) => updateValue(event.target.value)}
          placeholder={field.placeholder || ''}
          rows={4}
          style={{ ...fieldStyle, resize: 'vertical', minHeight: '120px' }}
        />
        {help}
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label key={field.name} style={wrapperStyle}>
        {label}
        <select
          name={field.name}
          required={field.required}
          value={String(values[field.name] || '')}
          onChange={(event) => updateValue(event.target.value)}
          style={fieldStyle}
        >
          <option value="">Seleziona</option>
          {field.options.map((option) => (
            <option key={`${field.name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {help}
      </label>
    );
  }

  return (
    <label key={field.name} style={wrapperStyle}>
      {label}
      <input
        type={field.type}
        name={field.name}
        required={field.required}
        value={String(values[field.name] || '')}
        onChange={(event) => updateValue(event.target.value)}
        placeholder={field.placeholder || ''}
        style={fieldStyle}
      />
      {help}
    </label>
  );
}

export function NewsletterSignupCard({ config, tenantSlug, style, compactDefault = false }: CardProps) {
  const fields = config.subscriptionFields.length > 0 ? config.subscriptionFields : resolveCustomConfig({ props: {} } as Block).subscriptionFields;
  const [values, setValues] = useState<Record<string, string | boolean>>(() => getInitialValues(fields));
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  const compact = compactDefault || config.compact;
  const buttonPaddingX = 20;
  const buttonPaddingY = 14;
  const buttonRadius = 12;
  const themeStyles = config.theme === 'dark'
    ? { background: '#0f172a', foreground: '#e2e8f0', muted: '#94a3b8', border: '#1e293b' }
    : config.theme === 'accent'
      ? { background: 'rgba(139, 0, 0, 0.08)', foreground: 'var(--e-color-text, #111827)', muted: 'var(--e-color-textSecondary, #64748b)', border: 'rgba(139, 0, 0, 0.22)' }
      : { background: 'var(--e-color-surface, #f8fafc)', foreground: 'var(--e-color-text, #111827)', muted: 'var(--e-color-textSecondary, #64748b)', border: 'var(--e-color-border, #dbe2ea)' };

  const externalAction = config.mode === 'provider' ? config.provider.formAction : '';

  useEffect(() => {
    setValues(getInitialValues(fields));
  }, [fields]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (externalAction) {
      return;
    }

    event.preventDefault();
    if (!tenantSlug) {
      setStatus('error');
      setMessage('Tenant non disponibile per l’iscrizione.');
      return;
    }

    if (isTurnstileWidgetConfigured() && process.env.NODE_ENV === 'production' && !turnstileReady) {
      setStatus('error');
      setMessage('Protezione anti-bot non pronta. Riprova tra qualche secondo.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenantSlug,
          payload: values,
          source_page: typeof window !== 'undefined' ? window.location.pathname : null,
          turnstile_token: turnstileToken,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Errore iscrizione newsletter');
      }

      setStatus('success');
      setMessage(payload.message || config.successMessage);
      setValues(getInitialValues(fields));
      setTurnstileResetSignal((current) => current + 1);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Errore iscrizione newsletter');
      setTurnstileResetSignal((current) => current + 1);
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
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          maxWidth: compact ? 'none' : '720px',
          margin: compact ? '0' : '0 auto',
        }}
      >
        {fields.map((field) => renderField(field, values, setValues, compact, themeStyles.muted, themeStyles.border))}
        <input type="text" name="website" value="" onChange={() => undefined} tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
        {!externalAction && isTurnstileWidgetConfigured() ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <TurnstileWidget
              onTokenChange={setTurnstileToken}
              onReadyStateChange={setTurnstileReady}
              resetSignal={turnstileResetSignal}
              theme={config.theme === 'dark' ? 'dark' : 'light'}
            />
          </div>
        ) : null}
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: compact ? 'stretch' : 'center' }}>
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
          {message ? (
            <div style={{ fontSize: '0.9rem', color: status === 'error' ? '#dc2626' : '#059669', textAlign: compact ? 'left' : 'center' }}>
              {message}
            </div>
          ) : null}
        </div>
      </form>

      {config.privacyText && !fields.some((field) => field.name === 'privacy_consent') && (
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
    </section>
  );
}

export function NewsletterSignupModule({ block, data, style, tenantSlug, compactDefault = false }: Props) {
  const mode = String(block.props.mode || 'global');
  const globalConfig = (data[0] && typeof data[0] === 'object') ? (data[0] as SiteNewsletterConfig) : null;
  const config = useMemo(() => {
    if (mode === 'global' && globalConfig) {
      return globalConfig;
    }
    return resolveCustomConfig(block);
  }, [block, globalConfig, mode]);

  return (
    <NewsletterSignupCard
      config={config}
      tenantSlug={tenantSlug}
      style={style}
      compactDefault={compactDefault}
    />
  );
}
