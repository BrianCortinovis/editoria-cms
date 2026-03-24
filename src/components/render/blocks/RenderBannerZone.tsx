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

function renderBannerContent(banner: Banner) {
  if (banner.type === 'html' && banner.html_content) {
    return (
      <iframe
        title={banner.name}
        srcDoc={`<!doctype html><html><body style="margin:0">${sanitizeHtml(banner.html_content)}</body></html>`}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        style={{ width: '100%', minHeight: '120px', border: 'none', background: 'transparent' }}
      />
    );
  }

  if (banner.image_url) {
    if (sanitizeExternalUrl(banner.link_url)) {
      return (
        <a href={sanitizeExternalUrl(banner.link_url)!} target="_blank" rel="noopener noreferrer sponsored">
          <img src={banner.image_url} alt={banner.name} className="max-w-full h-auto block" loading="lazy" />
        </a>
      );
    }

    return <img src={banner.image_url} alt={banner.name} className="max-w-full h-auto block" loading="lazy" />;
  }

  return null;
}

export function RenderBannerZone({ block, data, style }: Props) {
  const banners = (data as Banner[]).filter((banner) => banner.html_content || banner.image_url);
  if (banners.length === 0) {
    const { fallbackHtml } = block.props as Record<string, unknown>;
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

  const props = block.props as Record<string, unknown>;
  const position = String(props.position || '');
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
            gap: '24px',
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
                minWidth: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {renderBannerContent(banner)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const banner = banners[0];

  return (
    <div style={style} data-block="banner-zone">
      {renderBannerContent(banner)}
    </div>
  );
}
