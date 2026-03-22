'use client';

import type { Block } from '@/lib/types/block';
import type { SiteMenuItem } from '@/lib/site/navigation';

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
}

type NavVariant = 'inline' | 'pills' | 'underline' | 'sidebar' | 'floating';
type NavLayout = 'horizontal' | 'vertical';

function normalizeBlockItems(block: Block, data: unknown[]) {
  const mode = String(block.props.mode || 'custom');
  if (mode === 'global' && Array.isArray(data) && data.length > 0) {
    return data as SiteMenuItem[];
  }

  const items = block.props.items;
  return Array.isArray(items) ? (items as SiteMenuItem[]) : [];
}

function itemBaseStyle(variant: NavVariant): React.CSSProperties {
  switch (variant) {
    case 'pills':
      return {
        padding: '0.55rem 0.9rem',
        borderRadius: '999px',
        background: 'var(--e-color-surface, rgba(255,255,255,0.08))',
      };
    case 'underline':
      return {
        paddingBottom: '0.35rem',
        borderBottom: '2px solid var(--e-color-primary, #8B0000)',
      };
    case 'sidebar':
      return {
        padding: '0.6rem 0.8rem',
        borderLeft: '3px solid var(--e-color-primary, #8B0000)',
        background: 'var(--e-color-surface, rgba(255,255,255,0.08))',
      };
    case 'floating':
      return {
        padding: '0.7rem 1rem',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
      };
    default:
      return {};
  }
}

function renderItems(items: SiteMenuItem[], layout: NavLayout, variant: NavVariant, showDescriptions: boolean, depth = 0): React.ReactNode {
  if (!items.length) {
    return null;
  }

  const isHorizontal = layout === 'horizontal' && depth === 0 && variant !== 'sidebar';

  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        gap: depth === 0 ? '0.85rem' : '0.5rem',
        alignItems: isHorizontal ? 'center' : 'stretch',
      }}
    >
      {items.map((item, index) => {
        const children = Array.isArray(item.children) ? item.children : [];
        const content = (
          <>
            <span>{item.label}</span>
            {showDescriptions && item.description && (
              <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginTop: '0.2rem' }}>{item.description}</span>
            )}
          </>
        );

        if (children.length > 0) {
          return (
            <li key={`${item.id || item.url}-${index}`} style={{ position: 'relative' }}>
              <details>
                <summary
                  style={{
                    cursor: 'pointer',
                    listStyle: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--e-color-text, #111827)',
                    ...itemBaseStyle(variant),
                  }}
                >
                  {content}
                </summary>
                <div style={{ marginTop: '0.6rem', paddingLeft: depth === 0 ? '0.35rem' : '0.9rem' }}>
                  {renderItems(children, 'vertical', variant === 'sidebar' ? 'sidebar' : 'inline', showDescriptions, depth + 1)}
                </div>
              </details>
            </li>
          );
        }

        return (
          <li key={`${item.id || item.url}-${index}`}>
            <a
              href={item.url}
              target={item.target || '_self'}
              rel={item.target === '_blank' ? 'noreferrer' : undefined}
              style={{
                display: 'block',
                color: 'var(--e-color-text, #111827)',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                ...itemBaseStyle(variant),
              }}
            >
              {content}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function RenderNavigation({ block, data, style }: Props) {
  const layout = (block.props.layout as NavLayout) || 'horizontal';
  const variant = (block.props.variant as NavVariant) || 'inline';
  const logoText = String(block.props.logoText || (typeof block.props.logo === 'object' ? (block.props.logo as { value?: string })?.value || '' : block.props.logo || ''));
  const logoUrl = String(block.props.logoUrl || '');
  const ctaText = String(block.props.ctaText || (typeof block.props.ctaButton === 'object' ? (block.props.ctaButton as { text?: string })?.text || '' : ''));
  const ctaUrl = String(block.props.ctaUrl || (typeof block.props.ctaButton === 'object' ? (block.props.ctaButton as { url?: string })?.url || '#' : '#'));
  const sticky = (block.props.sticky as boolean) ?? false;
  const justify = String(block.props.justify || 'space-between') as React.CSSProperties['justifyContent'];
  const itemGap = Number(block.props.itemGap || 24);
  const showDescriptions = (block.props.showDescriptions as boolean) ?? false;
  const items = normalizeBlockItems(block, data);

  const isVertical = layout === 'vertical' || variant === 'sidebar';

  return (
    <nav
      style={{
        ...style,
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: isVertical ? 'stretch' : 'center',
        justifyContent: isVertical ? 'flex-start' : justify,
        gap: isVertical ? '1rem' : `${itemGap}px`,
        padding: style.padding || '1rem 1.5rem',
        ...(sticky ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
        ...(variant === 'floating'
          ? {
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
            }
          : {}),
      }}
      data-block="navigation"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {logoUrl && <img src={logoUrl} alt={logoText || 'Logo'} style={{ height: '40px', objectFit: 'contain' }} />}
        {logoText && (
          <span style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--e-color-text)' }}>
            {logoText}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, justifyContent: isVertical ? 'flex-start' : justify }}>
        {renderItems(items, isVertical ? 'vertical' : 'horizontal', variant, showDescriptions)}
      </div>

      {ctaText && (
        <a
          href={ctaUrl}
          style={{
            padding: '0.7rem 1.15rem',
            backgroundColor: 'var(--e-color-primary, #8B0000)',
            color: '#fff',
            borderRadius: 'var(--e-border-radius, 10px)',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
        >
          {ctaText}
        </a>
      )}
    </nav>
  );
}
