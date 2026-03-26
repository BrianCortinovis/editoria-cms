'use client';

import { useState } from 'react';
import type { Block } from '@/lib/types/block';
import { resolveMenuIconGlyph, type SiteMenuItem } from '@/lib/site/navigation';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { Move, Copy, Trash2, Magnet, AlignCenterHorizontal, AlignCenterVertical, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
}

type NavVariant = 'inline' | 'pills' | 'underline' | 'sidebar' | 'floating' | 'minimal' | 'boxed' | 'rail';
type NavLayout = 'horizontal' | 'vertical';
type NavPlacement = 'top' | 'bottom' | 'left' | 'right' | 'inline';
type ButtonShape = 'auto' | 'rounded' | 'square';
type ButtonSize = 'small' | 'medium' | 'large';

function normalizeBlockItems(block: Block, data: unknown[]) {
  const mode = String(block.props.mode || 'custom');
  if (mode === 'global' && Array.isArray(data) && data.length > 0) {
    return data as SiteMenuItem[];
  }

  const items = block.props.items;
  return Array.isArray(items) ? (items as SiteMenuItem[]) : [];
}

function itemBaseStyle(
  variant: NavVariant,
  buttonShape: ButtonShape,
  buttonPaddingX: number,
  buttonPaddingY: number,
  buttonRadius: number,
  iconOnly: boolean,
  buttonBoxSize: number
): React.CSSProperties {
  const resolvedRadius = buttonShape === 'square' ? `${Math.min(buttonRadius, 16)}px` : buttonShape === 'rounded' ? '999px' : `${buttonRadius}px`;
  const basePadding = `${buttonPaddingY}px ${buttonPaddingX}px`;
  const iconOnlyBox = iconOnly
    ? {
        width: `${buttonBoxSize}px`,
        minWidth: `${buttonBoxSize}px`,
        height: `${buttonBoxSize}px`,
        padding: 0,
        justifyContent: 'center',
      }
    : {};

  switch (variant) {
    case 'pills':
      return {
        padding: basePadding,
        borderRadius: resolvedRadius,
        background: 'var(--e-color-surface, rgba(255,255,255,0.08))',
        ...iconOnlyBox,
      };
    case 'underline':
      return {
        padding: iconOnly ? 0 : basePadding,
        borderBottom: '2px solid var(--e-color-primary, #8B0000)',
        ...iconOnlyBox,
      };
    case 'sidebar':
      return {
        padding: basePadding,
        borderLeft: '3px solid var(--e-color-primary, #8B0000)',
        background: 'var(--e-color-surface, rgba(255,255,255,0.08))',
        borderRadius: resolvedRadius,
        ...iconOnlyBox,
      };
    case 'floating':
      return {
        padding: basePadding,
        borderRadius: resolvedRadius,
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
        ...iconOnlyBox,
      };
    case 'boxed':
      return {
        padding: basePadding,
        borderRadius: resolvedRadius,
        border: '1px solid rgba(148,163,184,0.22)',
        background: 'rgba(255,255,255,0.78)',
        ...iconOnlyBox,
      };
    case 'rail':
      return {
        padding: basePadding,
        borderRadius: resolvedRadius,
        borderLeft: '4px solid var(--e-color-primary, #8B0000)',
        background: 'var(--e-color-surface, rgba(15,23,42,0.06))',
        ...iconOnlyBox,
      };
    case 'minimal':
      return {
        padding: iconOnly ? 0 : '0.4rem 0',
        borderRadius: resolvedRadius,
        ...iconOnlyBox,
      };
    default:
      return {
        padding: iconOnly ? 0 : basePadding,
        borderRadius: resolvedRadius,
        ...iconOnlyBox,
      };
  }
}

function renderItems(
  items: SiteMenuItem[],
  layout: NavLayout,
  variant: NavVariant,
  showDescriptions: boolean,
  showIcons: boolean,
  showBadges: boolean,
  compact: boolean,
  iconOnly: boolean,
  buttonShape: ButtonShape,
  buttonPaddingX: number,
  buttonPaddingY: number,
  buttonRadius: number,
  iconSize: number,
  buttonBoxSize: number,
  depth = 0
): React.ReactNode {
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
        const iconGlyph = showIcons ? resolveMenuIconGlyph(item.icon) : '';
        const content = (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? '0.35rem' : '0.55rem' }}>
              {iconGlyph && (
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: `${iconSize}px`,
                    fontSize: `${iconSize}px`,
                    opacity: 0.82,
                  }}
                >
                  {iconGlyph}
                </span>
              )}
              {!iconOnly && <span>{item.label}</span>}
              {showBadges && item.badge && (
                <span
                  style={{
                    padding: compact ? '0.1rem 0.35rem' : '0.16rem 0.46rem',
                    borderRadius: '999px',
                    background: 'var(--e-color-primary, #8B0000)',
                    color: '#fff',
                    fontSize: compact ? '0.62rem' : '0.68rem',
                    lineHeight: 1.1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    ...itemBaseStyle(variant, buttonShape, buttonPaddingX, buttonPaddingY, buttonRadius, iconOnly, buttonBoxSize),
                  }}
                >
                  {content}
                </summary>
                <div style={{ marginTop: '0.6rem', paddingLeft: depth === 0 ? '0.35rem' : '0.9rem' }}>
                  {renderItems(children, 'vertical', variant === 'sidebar' ? 'sidebar' : 'inline', showDescriptions, showIcons, showBadges, compact, iconOnly, buttonShape, buttonPaddingX, buttonPaddingY, buttonRadius, iconSize, buttonBoxSize, depth + 1)}
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
                color: 'var(--e-color-text, #111827)',
                textDecoration: 'none',
                fontSize: compact ? '0.88rem' : '0.95rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                ...itemBaseStyle(variant, buttonShape, buttonPaddingX, buttonPaddingY, buttonRadius, iconOnly, buttonBoxSize),
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
  const [toolbarExpanded, setToolbarExpanded] = useState(true);
  const [toolbarOffset, setToolbarOffset] = useState({ x: 0, y: 0 });
  const { updateBlockStyle } = usePageStore();
  const { snapEnabled } = useUiStore();

  // Parse transform to get current position
  const parseTranslate = (transform: string | undefined) => {
    if (!transform) return { x: 0, y: 0 };
    const match = transform.match(/translate\(([^,]+)px?,?\s*([^)]*)/);
    return { x: parseInt(match?.[1] || '0'), y: parseInt(match?.[2] || '0') };
  };

  // Center on page function
  const centerOnPage = (axis: 'h' | 'v' | 'both') => {
    const cur = parseTranslate(block.style.transform || '');
    const navRef = document.querySelector(`[data-block="navigation"]`);
    if (!navRef) return;
    const rect = navRef.getBoundingClientRect();
    const myW = Math.round(rect.width);
    const myH = Math.round(rect.height);

    const pageEl = document.querySelector('[data-page-surface="true"]') as HTMLElement;
    if (!pageEl) return;
    const pageRect = pageEl.getBoundingClientRect();
    const pageW = Math.round(pageRect.width);
    const pageH = Math.round(pageRect.height);

    const relX = Math.round(rect.left - pageRect.left) - cur.x;
    const relY = Math.round(rect.top - pageRect.top) - cur.y;

    let newX = cur.x, newY = cur.y;
    if (axis === 'h' || axis === 'both') {
      newX = Math.round((pageW - myW) / 2) - relX;
    }
    if (axis === 'v' || axis === 'both') {
      newY = Math.round((pageH - myH) / 2) - relY;
    }
    updateBlockStyle(block.id, {
      transform: `translate(${newX}px, ${newY}px)`,
    });
  };

  const layout = (block.props.layout as NavLayout) || 'horizontal';
  const variant = (block.props.variant as NavVariant) || 'inline';
  const logoText = String(block.props.logoText || (typeof block.props.logo === 'object' ? (block.props.logo as { value?: string })?.value || '' : block.props.logo || ''));
  const logoUrl = String(block.props.logoUrl || '');
  const ctaText = String(block.props.ctaText || (typeof block.props.ctaButton === 'object' ? (block.props.ctaButton as { text?: string })?.text || '' : ''));
  const ctaUrl = String(block.props.ctaUrl || (typeof block.props.ctaButton === 'object' ? (block.props.ctaButton as { url?: string })?.url || '#' : '#'));
  const sticky = (block.props.sticky as boolean) ?? false;
  const placement = (block.props.placement as NavPlacement) || 'top';
  const justify = String(block.props.justify || 'space-between') as React.CSSProperties['justifyContent'];
  const itemGap = Number(block.props.itemGap || 24);
  const showDescriptions = (block.props.showDescriptions as boolean) ?? false;
  const showIcons = (block.props.showIcons as boolean) ?? true;
  const showBadges = (block.props.showBadges as boolean) ?? true;
  const compact = (block.props.compact as boolean) ?? false;
  const iconOnly = (block.props.iconOnly as boolean) ?? false;
  const buttonShape = (String(block.props.buttonShape || 'auto') as ButtonShape);
  const buttonSize = (String(block.props.buttonSize || 'medium') as ButtonSize);
  const buttonPaddingX = Number(block.props.buttonPaddingX || 16);
  const buttonPaddingY = Number(block.props.buttonPaddingY || 10);
  const buttonRadius = Number(block.props.buttonRadius || 12);
  const iconSize = Number(block.props.iconSize || (compact ? 14 : 15));
  const buttonBoxSize = buttonSize === 'small' ? 42 : buttonSize === 'large' ? 58 : 50;
  const logoPosition = String(block.props.logoPosition || 'left');
  const ctaPaddingX = Number(block.props.ctaPaddingX || 18);
  const ctaPaddingY = Number(block.props.ctaPaddingY || 11);
  const ctaRadius = Number(block.props.ctaRadius || 12);
  const items = normalizeBlockItems(block, data);

  const isVertical = layout === 'vertical' || variant === 'sidebar' || variant === 'rail' || placement === 'left' || placement === 'right';
  const logoStacked = logoPosition === 'top' || logoPosition === 'stacked';
  const stickyPositionStyles = sticky
    ? placement === 'bottom'
      ? { position: 'sticky' as const, bottom: 0, zIndex: 100 }
      : { position: 'sticky' as const, top: 0, zIndex: 100 }
    : {};
  const placementStyles: React.CSSProperties =
    placement === 'left'
      ? { alignSelf: 'stretch', maxWidth: '320px' }
      : placement === 'right'
        ? { alignSelf: 'stretch', marginLeft: 'auto', maxWidth: '320px' }
        : {};

  return (
    <div style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: toolbarOffset.y === 0 ? '-40px' : 'auto',
          left: toolbarOffset.x === 0 ? '12px' : 'auto',
          zIndex: 9999,
          ...(toolbarOffset.x !== 0 || toolbarOffset.y !== 0 ? {
            transform: `translate(${toolbarOffset.x}px, ${toolbarOffset.y}px)`,
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
          } : {}),
        }}
      >
        <div className="flex items-center gap-1 rounded-lg px-1.5 py-1.5 shadow-xl border border-blue-400" style={{ background: '#1e40af', backdropFilter: 'blur(8px)' }}>
          {/* Grab/Move icon */}
          <div
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-blue-600 transition-colors shrink-0"
            style={{ color: '#fff' }}
            title="Trascina per spostare"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const navElement = document.querySelector('[data-block="navigation"]');
              if (navElement) {
                const startX = e.clientX;
                const startY = e.clientY;
                const cur = parseTranslate(block.style.transform);
                const onMove = (moveEvent: MouseEvent) => {
                  const dx = moveEvent.clientX - startX;
                  const dy = moveEvent.clientY - startY;
                  updateBlockStyle(block.id, {
                    transform: `translate(${cur.x + dx}px, ${cur.y + dy}px)`,
                  });
                };
                const onUp = () => {
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }
            }}
          >
            <Move size={16} style={{ color: '#fff', flexShrink: 0 }} />
          </div>

          {/* Expand/collapse */}
          <button
            className="p-1 rounded hover:bg-blue-600 transition-colors shrink-0"
            onClick={() => setToolbarExpanded(!toolbarExpanded)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            title={toolbarExpanded ? 'Riduci toolbar' : 'Espandi toolbar'}
          >
            {toolbarExpanded ? (
              <ChevronDown size={14} style={{ color: '#fff' }} />
            ) : (
              <ChevronRight size={14} style={{ color: '#fff' }} />
            )}
          </button>

          {/* Collapsed label */}
          {!toolbarExpanded && (
            <span className="text-xs px-1 font-semibold select-none truncate" style={{ color: '#fff' }}>
              Nav
            </span>
          )}

          {/* Expanded tools */}
          {toolbarExpanded && (
            <>
              <div className="h-4 w-px bg-blue-300 opacity-50" />

              {/* Duplica */}
              <button
                className="p-1 rounded hover:bg-blue-600 transition-colors shrink-0"
                onClick={() => {
                  const { duplicateBlock } = usePageStore.getState();
                  duplicateBlock(block.id);
                }}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                title="Duplica"
              >
                <Copy size={14} style={{ color: '#fff' }} />
              </button>

              {/* Elimina */}
              <button
                className="p-1 rounded hover:bg-blue-600 transition-colors shrink-0"
                onClick={() => {
                  const { removeBlock } = usePageStore.getState();
                  removeBlock(block.id);
                }}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                title="Elimina"
              >
                <Trash2 size={14} style={{ color: '#fff' }} />
              </button>

              {/* Snap */}
              <button
                className="p-1 rounded hover:bg-blue-600 transition-colors shrink-0"
                onClick={() => {
                  const { toggleSnapEnabled } = useUiStore.getState();
                  toggleSnapEnabled?.();
                }}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: snapEnabled ? 1 : 0.5 }}
                title="Magneti"
              >
                <Magnet size={14} style={{ color: '#fff' }} />
              </button>

              <div className="h-4 w-px bg-blue-300 opacity-50" />

              {/* Center H */}
              <button
                className="p-1 rounded hover:bg-blue-600 transition-colors shrink-0"
                onClick={() => centerOnPage('h')}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                title="Centra H"
              >
                <AlignCenterHorizontal size={14} style={{ color: '#fff' }} />
              </button>

              {/* Center V */}
              <button
                className="p-1 rounded hover:bg-blue-600 transition-colors shrink-0"
                onClick={() => centerOnPage('v')}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                title="Centra V"
              >
                <AlignCenterVertical size={14} style={{ color: '#fff' }} />
              </button>

              {/* Toolbar grab area */}
              <div
                className="cursor-grab active:cursor-grabbing ml-2 px-3 py-1.5 rounded hover:bg-blue-600 transition-colors"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const onMove = (moveEvent: MouseEvent) => {
                    setToolbarOffset({
                      x: toolbarOffset.x + (moveEvent.clientX - startX),
                      y: toolbarOffset.y + (moveEvent.clientY - startY),
                    });
                  };
                  const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                  };
                  document.addEventListener('mousemove', onMove);
                  document.addEventListener('mouseup', onUp);
                }}
                title="Trascina la toolbar"
                style={{ minWidth: '24px', minHeight: '24px' }}
              />
            </>
          )}
        </div>
      </div>

      <nav
        style={{
          ...style,
          display: 'flex',
          flexDirection: isVertical || logoStacked ? 'column' : 'row',
          alignItems: isVertical ? 'stretch' : 'center',
          justifyContent: isVertical ? 'flex-start' : justify,
          gap: isVertical ? (compact ? '0.6rem' : '1rem') : `${itemGap}px`,
          padding: style.padding || (compact ? '0.8rem 1rem' : '1rem 1.5rem'),
          ...stickyPositionStyles,
          ...placementStyles,
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
      <div style={{ display: 'flex', flexDirection: logoStacked ? 'column' : 'row', alignItems: logoStacked ? 'flex-start' : 'center', gap: '0.75rem' }}>
        {logoUrl && <img src={logoUrl} alt={logoText || 'Logo'} style={{ height: '40px', objectFit: 'contain' }} />}
        {logoText && (
          <span style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--e-color-text)' }}>
            {logoText}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flex: isVertical ? undefined : 1, justifyContent: isVertical ? 'flex-start' : justify }}>
        {renderItems(items, isVertical ? 'vertical' : 'horizontal', variant, showDescriptions, showIcons, showBadges, compact, iconOnly, buttonShape, buttonPaddingX, buttonPaddingY, buttonRadius, iconSize, buttonBoxSize)}
      </div>

      {ctaText && (
        <a
          href={ctaUrl}
          style={{
            padding: `${ctaPaddingY}px ${ctaPaddingX}px`,
            backgroundColor: 'var(--e-color-primary, #8B0000)',
            color: '#fff',
            borderRadius: `${ctaRadius}px`,
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
        >
          {ctaText}
        </a>
      )}
    </nav>
    </div>
  );
}
