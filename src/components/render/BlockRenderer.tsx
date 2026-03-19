import type { Block, BlockStyle } from '@/lib/types/block';
import { resolveBlockData } from '@/lib/site/block-data-resolver';
import { RenderArticleGrid } from './blocks/RenderArticleGrid';
import { RenderArticleHero } from './blocks/RenderArticleHero';
import { RenderBreakingTicker } from './blocks/RenderBreakingTicker';
import { RenderCategoryNav } from './blocks/RenderCategoryNav';
import { RenderEventList } from './blocks/RenderEventList';
import { RenderBannerZone } from './blocks/RenderBannerZone';
import { RenderNewsletterSignup } from './blocks/RenderNewsletterSignup';
import { RenderText } from './blocks/RenderText';
import { RenderHero } from './blocks/RenderHero';
import { RenderQuote } from './blocks/RenderQuote';
import { RenderNewsletter } from './blocks/RenderNewsletter';
import { RenderAccordion } from './blocks/RenderAccordion';
import { RenderVideo } from './blocks/RenderVideo';
import { RenderDivider } from './blocks/RenderDivider';
import { RenderCounter } from './blocks/RenderCounter';
import { RenderNavigation } from './blocks/RenderNavigation';
import { RenderFooter } from './blocks/RenderFooter';
import { RenderSearchBar } from './blocks/RenderSearchBar';
import { RenderAuthorBio } from './blocks/RenderAuthorBio';
import { RenderImageGallery } from './blocks/RenderImageGallery';
import { RenderTimeline } from './blocks/RenderTimeline';
import { RenderCarousel } from './blocks/RenderCarousel';
import { RenderGeneric } from './blocks/RenderGeneric';

interface BlockRendererProps {
  blocks: Block[];
  tenantId: string;
  tenantSlug: string;
}

function blockStyleToCSS(style: BlockStyle): React.CSSProperties {
  const css: React.CSSProperties = {};

  if (style.layout) {
    css.display = style.layout.display;
    if (style.layout.flexDirection) css.flexDirection = style.layout.flexDirection as React.CSSProperties['flexDirection'];
    if (style.layout.justifyContent) css.justifyContent = style.layout.justifyContent;
    if (style.layout.alignItems) css.alignItems = style.layout.alignItems;
    if (style.layout.gap) css.gap = style.layout.gap;
    css.width = style.layout.width;
    css.maxWidth = style.layout.maxWidth;
    if (style.layout.minHeight) css.minHeight = style.layout.minHeight;
    if (style.layout.overflow) css.overflow = style.layout.overflow as React.CSSProperties['overflow'];
    if (style.layout.padding) {
      css.padding = `${style.layout.padding.top} ${style.layout.padding.right} ${style.layout.padding.bottom} ${style.layout.padding.left}`;
    }
    if (style.layout.margin) {
      css.margin = `${style.layout.margin.top} ${style.layout.margin.right} ${style.layout.margin.bottom} ${style.layout.margin.left}`;
    }
  }

  if (style.background?.type === 'color' && style.background.value) {
    css.backgroundColor = style.background.value;
  }
  if (style.background?.type === 'gradient' && style.background.value) {
    css.background = style.background.value;
  }
  if (style.background?.type === 'image' && style.background.value) {
    css.backgroundImage = `url(${style.background.value})`;
    css.backgroundSize = style.background.size || 'cover';
    css.backgroundPosition = style.background.position || 'center';
  }

  if (style.typography) {
    if (style.typography.fontFamily) css.fontFamily = style.typography.fontFamily;
    if (style.typography.fontSize) css.fontSize = style.typography.fontSize;
    if (style.typography.fontWeight) css.fontWeight = style.typography.fontWeight;
    if (style.typography.lineHeight) css.lineHeight = style.typography.lineHeight;
    if (style.typography.color) css.color = style.typography.color;
    if (style.typography.textAlign) css.textAlign = style.typography.textAlign as React.CSSProperties['textAlign'];
  }

  if (style.border) {
    if (style.border.radius) css.borderRadius = style.border.radius;
    if (style.border.width) css.borderWidth = style.border.width;
    if (style.border.style) css.borderStyle = style.border.style as React.CSSProperties['borderStyle'];
    if (style.border.color) css.borderColor = style.border.color;
  }

  if (style.shadow) css.boxShadow = style.shadow;
  if (style.opacity !== undefined) css.opacity = style.opacity;

  return css;
}

async function RenderBlock({ block, tenantId, tenantSlug }: { block: Block; tenantId: string; tenantSlug: string }) {
  if (block.hidden) return null;

  // Resolve data for data-bound blocks
  let data: unknown[] = [];
  if (block.dataSource) {
    data = await resolveBlockData(tenantId, block.dataSource);
  }

  const style = blockStyleToCSS(block.style);

  // Route to specialized renderers
  switch (block.type) {
    // Editorial data-bound blocks
    case 'article-grid':
      return <RenderArticleGrid block={block} data={data} style={style} tenantSlug={tenantSlug} />;
    case 'article-hero':
      return <RenderArticleHero block={block} data={data} style={style} tenantSlug={tenantSlug} />;
    case 'breaking-ticker':
      return <RenderBreakingTicker block={block} data={data} style={style} />;
    case 'category-nav':
      return <RenderCategoryNav block={block} data={data} style={style} tenantSlug={tenantSlug} />;
    case 'event-list':
      return <RenderEventList block={block} data={data} style={style} />;
    case 'banner-zone':
      return <RenderBannerZone block={block} data={data} style={style} />;
    case 'newsletter-signup':
      return <RenderNewsletterSignup block={block} data={data} style={style} />;
    // Content blocks
    case 'text':
      return <RenderText block={block} style={style} />;
    case 'hero':
      return <RenderHero block={block} style={style} />;
    case 'quote':
      return <RenderQuote block={block} style={style} />;
    case 'newsletter':
      return <RenderNewsletter block={block} style={style} />;
    case 'accordion':
      return <RenderAccordion block={block} style={style} />;
    case 'video':
      return <RenderVideo block={block} style={style} />;
    case 'divider':
      return <RenderDivider block={block} style={style} />;
    case 'counter':
      return <RenderCounter block={block} style={style} />;
    case 'navigation':
      return <RenderNavigation block={block} style={style} />;
    case 'footer':
      return <RenderFooter block={block} style={style} />;
    case 'search-bar':
      return <RenderSearchBar block={block} style={style} tenantSlug={tenantSlug} />;
    case 'author-bio':
      return <RenderAuthorBio block={block} style={style} />;
    case 'image-gallery':
      return <RenderImageGallery block={block} style={style} />;
    case 'timeline':
      return <RenderTimeline block={block} style={style} />;
    case 'carousel':
      return <RenderCarousel block={block} style={style} />;
    // Layout/container blocks — render children
    default:
      return (
        <RenderGeneric block={block} style={style}>
          {block.children.length > 0 && (
            <>
              {block.children.map((child) => (
                <RenderBlock key={child.id} block={child} tenantId={tenantId} tenantSlug={tenantSlug} />
              ))}
            </>
          )}
        </RenderGeneric>
      );
  }
}

function collectResponsiveCSS(blocks: Block[]): string {
  let tablet = '';
  let mobile = '';

  function walk(blocks: Block[]) {
    for (const block of blocks) {
      if (block.responsive?.tablet) {
        const css = partialStyleToCSS(block.responsive.tablet as Partial<BlockStyle>);
        if (css) tablet += `[data-block-id="${block.id}"]{${css}}\n`;
      }
      if (block.responsive?.mobile) {
        const css = partialStyleToCSS(block.responsive.mobile as Partial<BlockStyle>);
        if (css) mobile += `[data-block-id="${block.id}"]{${css}}\n`;
      }
      if (block.children.length > 0) walk(block.children);
    }
  }

  walk(blocks);

  let result = '';
  if (tablet) result += `@media(max-width:1024px){${tablet}}`;
  if (mobile) result += `@media(max-width:768px){${mobile}}`;
  return result;
}

function partialStyleToCSS(style: Partial<BlockStyle>): string {
  const parts: string[] = [];
  if (style.layout) {
    if (style.layout.display) parts.push(`display:${style.layout.display}`);
    if (style.layout.flexDirection) parts.push(`flex-direction:${style.layout.flexDirection}`);
    if (style.layout.gap) parts.push(`gap:${style.layout.gap}`);
    if (style.layout.maxWidth) parts.push(`max-width:${style.layout.maxWidth}`);
    if (style.layout.minHeight) parts.push(`min-height:${style.layout.minHeight}`);
    if (style.layout.padding) {
      const p = style.layout.padding;
      if (p.top || p.right || p.bottom || p.left) {
        parts.push(`padding:${p.top || '0'} ${p.right || '0'} ${p.bottom || '0'} ${p.left || '0'}`);
      }
    }
  }
  if (style.typography) {
    if (style.typography.fontSize) parts.push(`font-size:${style.typography.fontSize}`);
    if (style.typography.textAlign) parts.push(`text-align:${style.typography.textAlign}`);
  }
  return parts.join(';');
}

export async function BlockRenderer({ blocks, tenantId, tenantSlug }: BlockRendererProps) {
  const responsiveCSS = collectResponsiveCSS(blocks);

  return (
    <>
      {responsiveCSS && (
        <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
      )}
      <main>
        {blocks.map((block) => (
          <RenderBlock key={block.id} block={block} tenantId={tenantId} tenantSlug={tenantSlug} />
        ))}
      </main>
    </>
  );
}
