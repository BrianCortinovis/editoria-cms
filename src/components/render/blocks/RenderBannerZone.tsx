import type { Block } from '@/lib/types/block';
import { sanitizeExternalUrl, sanitizeHtml } from '@/lib/security/html';

interface Banner {
  id: string;
  name: string;
  image_url: string | null;
  html_content: string | null;
  link_url: string | null;
  type: string;
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function rotateBanners<T>(items: T[], seed: string): T[] {
  if (items.length <= 1) return items;
  const offset = hashSeed(seed) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function renderBannerContent(banner: Banner) {
  if (banner.type === 'html' && banner.html_content) {
    return (
      <iframe
        title={banner.name}
        srcDoc={`<!doctype html><html><body style="margin:0">${sanitizeHtml(banner.html_content)}</body></html>`}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        style={{ width: '100%', minHeight: '120px', border: 'none', background: 'transparent', display: 'block' }}
      />
    );
  }

  if (banner.image_url) {
    if (sanitizeExternalUrl(banner.link_url)) {
      return (
        <a href={sanitizeExternalUrl(banner.link_url)!} target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-flex', justifyContent: 'center', width: '100%' }}>
          <img src={banner.image_url} alt={banner.name} className="max-w-full h-auto block" loading="lazy" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
        </a>
      );
    }

    return <img src={banner.image_url} alt={banner.name} className="max-w-full h-auto block" loading="lazy" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />;
  }

  return null;
}

export function RenderBannerZone({ block, data, style }: Props) {
  const props = block.props as Record<string, unknown>;
  const sourceMode = String(props.sourceMode || 'rotation');
  const customBanner: Banner | null = sourceMode === 'custom' && (props.customImageUrl || props.customHtml)
    ? {
        id: `${block.id}-custom`,
        name: String(props.customAssetName || block.label || 'Banner custom'),
        image_url: props.customImageUrl ? String(props.customImageUrl) : null,
        html_content: props.customHtml ? String(props.customHtml) : null,
        link_url: props.customLinkUrl ? String(props.customLinkUrl) : null,
        type: props.customHtml ? 'html' : 'image',
      }
    : null;
  const banners = customBanner
    ? [customBanner]
    : (data as Banner[]).filter((banner) => banner.html_content || banner.image_url);
  if (banners.length === 0) {
    const { fallbackHtml } = props;
    if (fallbackHtml) {
      const safeFallbackHtml = sanitizeHtml(fallbackHtml as string);
      return (
        <iframe
          title={String(block.label || 'Banner fallback')}
          srcDoc={`<!doctype html><html><body style="margin:0">${safeFallbackHtml}</body></html>`}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          style={{ ...style, width: '100%', minHeight: '120px', border: 'none', background: 'transparent' }}
        />
      );
    }
    return null;
  }

  const position = String(props.position || '');
  const gap = typeof props.gap === 'number' ? `${props.gap}px` : '12px';
  const minItemWidth = typeof props.minItemWidth === 'number' ? `${props.minItemWidth}px` : '180px';
  const cardFrame = Boolean(props.cardFrame);
  const isScrollingRow = Boolean(props.scrollingRow) || ['header', 'footer', 'topbar'].includes(position);

  if (isScrollingRow) {
    const repeated = Array.from({ length: Math.max(3, Math.ceil(8 / Math.max(banners.length, 1))) })
      .flatMap(() => banners);

    return (
      <div style={{ ...style, overflow: 'hidden' }} data-block="banner-zone">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes bannerZoneMarquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        ` }} />
        <div
          style={{
            display: 'flex',
            gap,
            width: 'max-content',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            animation: 'bannerZoneMarquee 30s linear infinite',
          }}
        >
          {[...repeated, ...repeated].map((banner, index) => (
            <div
              key={`${banner.id}-${index}`}
              style={{
                minWidth: minItemWidth,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: cardFrame ? '10px' : 0,
                borderRadius: cardFrame ? '16px' : 0,
                border: cardFrame ? '1px solid rgba(148,163,184,0.18)' : 'none',
                background: cardFrame ? 'rgba(255,255,255,0.92)' : 'transparent',
              }}
            >
              {renderBannerContent(banner)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rotatedBanners = rotateBanners(banners, `${block.id}:${position}:${block.label || 'banner-zone'}`);
  const maxVisible =
    typeof props.maxVisible === 'number'
      ? Math.max(1, Math.floor(props.maxVisible))
      : banners.length >= 5
        ? 3
        : banners.length >= 2
          ? 2
          : 1;
  const selectedBanners = rotatedBanners.slice(0, Math.min(maxVisible, rotatedBanners.length));

  if (selectedBanners.length > 1) {
    return (
      <div
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
          gap,
          alignItems: 'center',
        }}
        data-block="banner-zone"
      >
        {selectedBanners.map((banner) => (
          <div
            key={banner.id}
            style={{
              width: '100%',
              minHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: cardFrame ? '10px' : 0,
              borderRadius: cardFrame ? '16px' : 0,
              border: cardFrame ? '1px solid rgba(148,163,184,0.18)' : 'none',
              background: cardFrame ? 'rgba(255,255,255,0.92)' : 'transparent',
            }}
          >
            {renderBannerContent(banner)}
          </div>
        ))}
      </div>
    );
  }

  const banner = selectedBanners[0];

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      data-block="banner-zone"
    >
      {renderBannerContent(banner)}
    </div>
  );
}
