'use client';

import { useMemo, useState } from 'react';
import type { Block } from '@/lib/types/block';
import { isTurnstileWidgetConfigured, TurnstileWidget } from '@/components/public/TurnstileWidget';

interface CmsFormField {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label?: string; value?: string } | string>;
}

interface CmsFormData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  success_message: string | null;
  fields: CmsFormField[];
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
  tenantSlug: string;
}

function normalizeOptions(options?: CmsFormField['options']) {
  return (options || []).map((option) => {
    if (typeof option === 'string') {
      return { label: option, value: option };
    }

    return {
      label: option.label || option.value || 'Opzione',
      value: option.value || option.label || 'option',
    };
  });
}

function renderField(
  field: CmsFormField,
  values: Record<string, string | boolean>,
  onChange: (name: string, value: string | boolean) => void,
  visualStyle: string
) {
  const isDark = visualStyle === 'dark';
  const isGlass = visualStyle === 'glass';
  const commonStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 0.9rem',
    border: isGlass ? '1px solid rgba(255,255,255,0.22)' : '1px solid var(--e-color-border, #d1d5db)',
    borderRadius: 'var(--e-border-radius, 10px)',
    fontSize: '0.95rem',
    color: isDark ? '#f8fafc' : 'var(--e-color-text, #111827)',
    background: isGlass ? 'rgba(255,255,255,0.12)' : isDark ? 'rgba(255,255,255,0.04)' : 'var(--e-color-surface, #ffffff)',
  };

  const label = field.label || field.name;
  const required = Boolean(field.required);
  const type = field.type || 'text';

  if (type === 'textarea') {
    return (
      <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {label}
          {required ? ' *' : ''}
        </span>
        <textarea
          name={field.name}
          required={required}
          placeholder={field.placeholder || ''}
          value={String(values[field.name] || '')}
          onChange={(event) => onChange(field.name, event.target.value)}
          rows={5}
          style={{ ...commonStyle, resize: 'vertical', minHeight: '140px' }}
        />
      </label>
    );
  }

  if (type === 'select') {
    const options = normalizeOptions(field.options);
    return (
      <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {label}
          {required ? ' *' : ''}
        </span>
        <select
          name={field.name}
          required={required}
          value={String(values[field.name] || '')}
          onChange={(event) => onChange(field.name, event.target.value)}
          style={commonStyle}
        >
          <option value="">Seleziona</option>
          {options.map((option) => (
            <option key={`${field.name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === 'checkbox') {
    return (
      <label key={field.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.92rem' }}>
        <input
          type="checkbox"
          name={field.name}
          checked={Boolean(values[field.name])}
          onChange={(event) => onChange(field.name, event.target.checked)}
        />
        <span>
          {label}
          {required ? ' *' : ''}
        </span>
      </label>
    );
  }

  return (
    <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        type={type}
        name={field.name}
        required={required}
        placeholder={field.placeholder || ''}
        value={String(values[field.name] || '')}
        onChange={(event) => onChange(field.name, event.target.value)}
        style={commonStyle}
      />
    </label>
  );
}

export function RenderCmsForm({ block, data, style, tenantSlug }: Props) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  const forms = data as CmsFormData[];
  const configuredSlug = String(block.props.formSlug || '');
  const form = useMemo(
    () => forms.find((item) => item.slug === configuredSlug) || forms[0] || null,
    [configuredSlug, forms]
  );

  const submitButtonText = String(block.props.submitButtonText || '').trim() || 'Invia';
  const buttonPaddingX = Number(block.props.buttonPaddingX || 20);
  const buttonPaddingY = Number(block.props.buttonPaddingY || 14);
  const buttonRadius = Number(block.props.buttonRadius || 12);
  const showTitle = (block.props.showTitle as boolean) ?? true;
  const showDescription = (block.props.showDescription as boolean) ?? true;
  const layout = String(block.props.layout || 'stacked');
  const visualStyle = String(block.props.visualStyle || 'editorial');
  const introBadge = String(block.props.introBadge || '').trim();
  const supportText = String(block.props.supportText || '').trim();
  const isSplit = layout === 'split';
  const isGlass = visualStyle === 'glass';
  const isDark = visualStyle === 'dark';
  const wrapperStyle: React.CSSProperties = {
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: isSplit ? 'minmax(220px, 0.9fr) minmax(0, 1.1fr)' : '1fr',
    alignItems: 'start',
  };
  const formStyle: React.CSSProperties = {
    display: 'grid',
    gap: visualStyle === 'compact' ? '0.8rem' : '1rem',
    gridTemplateColumns: layout === 'inline' ? 'repeat(2, minmax(0, 1fr))' : '1fr',
  };
  const submitStyle: React.CSSProperties = {
    padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
    border: 'none',
    borderRadius: `${buttonRadius}px`,
    background: isDark ? '#f8fafc' : 'var(--e-color-primary, #8b0000)',
    color: isDark ? '#0f172a' : '#fff',
    fontWeight: 700,
    cursor: sending ? 'wait' : 'pointer',
    opacity: sending ? 0.8 : 1,
    boxShadow: isGlass ? '0 12px 28px rgba(15,23,42,0.12)' : 'none',
  };

  const handleChange = (name: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form) {
      return;
    }

    setSending(true);
    setError(null);
    setMessage(null);

    if (isTurnstileWidgetConfigured() && process.env.NODE_ENV === 'production' && !turnstileReady) {
      setSending(false);
      setError('Protezione modulo non pronta. Riprova tra qualche secondo.');
      return;
    }

    try {
      const response = await fetch(`/api/v1/forms/${form.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenantSlug,
          payload: values,
          source_page: window.location.pathname,
          turnstile_token: turnstileToken,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Invio non riuscito');
      }

      setMessage(payload.message || form.success_message || 'Invio ricevuto correttamente.');
      setValues({});
      setTurnstileResetSignal((current) => current + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Invio non riuscito');
      setTurnstileResetSignal((current) => current + 1);
    } finally {
      setSending(false);
    }
  };

  if (!form) {
    return (
      <section style={style} data-block="cms-form">
        <div
          style={{
            border: '1px dashed var(--e-color-border, #d1d5db)',
            borderRadius: '12px',
            padding: '1rem',
            color: 'var(--e-color-textSecondary, #6b7280)',
          }}
        >
          Nessun form CMS collegato. Seleziona un form nel blocco e assicurati che il modulo `Form` sia attivo.
        </div>
      </section>
    );
  }

  return (
    <section style={style} data-block="cms-form">
      <div style={wrapperStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {introBadge && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'fit-content',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(139,0,0,0.1)',
                color: isDark ? '#f8fafc' : 'var(--e-color-primary, #8b0000)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {introBadge}
            </span>
          )}
          {showTitle && (
            <h3 style={{ fontFamily: 'var(--e-font-heading)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {form.name}
            </h3>
          )}
          {showDescription && form.description && (
            <p style={{ color: isDark ? 'rgba(248,250,252,0.78)' : 'var(--e-color-textSecondary, #6b7280)', margin: 0 }}>{form.description}</p>
          )}
          {supportText && (
            <p style={{ color: isDark ? 'rgba(248,250,252,0.74)' : 'var(--e-color-textSecondary, #64748b)', margin: 0 }}>
              {supportText}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} data-form="cms-form" style={formStyle}>
          {form.fields.map((field) => renderField(field, values, handleChange, visualStyle))}
          <input type="text" name="website" value="" onChange={() => undefined} tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
            {isTurnstileWidgetConfigured() ? (
              <TurnstileWidget
                onTokenChange={setTurnstileToken}
                onReadyStateChange={setTurnstileReady}
                resetSignal={turnstileResetSignal}
                theme={isDark ? 'dark' : 'light'}
              />
            ) : null}
            <button type="submit" disabled={sending} style={submitStyle}>
              {sending ? 'Invio in corso...' : submitButtonText}
            </button>
            {message && <p style={{ color: 'var(--e-color-success, #047857)', margin: 0 }}>{message}</p>}
            {error && <p style={{ color: 'var(--e-color-danger, #b91c1c)', margin: 0 }}>{error}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
