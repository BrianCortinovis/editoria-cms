"use client";

import type { CSSProperties } from "react";
import { PageBackgroundFrame } from "@/components/render/PageBackgroundFrame";
import { RenderBlockFrame } from "@/components/render/RenderBlockFrame";
import { RenderGeneric } from "@/components/render/blocks/RenderGeneric";
import { RenderNavigation } from "@/components/render/blocks/RenderNavigation";
import { RenderFooter } from "@/components/render/blocks/RenderFooter";
import { RenderText } from "@/components/render/blocks/RenderText";
import { RenderHero } from "@/components/render/blocks/RenderHero";
import { RenderQuote } from "@/components/render/blocks/RenderQuote";
import { RenderAccordion } from "@/components/render/blocks/RenderAccordion";
import { RenderVideo } from "@/components/render/blocks/RenderVideo";
import { RenderDivider } from "@/components/render/blocks/RenderDivider";
import { RenderCounter } from "@/components/render/blocks/RenderCounter";
import { RenderSearchBar } from "@/components/render/blocks/RenderSearchBar";
import { RenderCmsForm } from "@/components/render/blocks/RenderCmsForm";
import { RenderAuthorBio } from "@/components/render/blocks/RenderAuthorBio";
import { RenderImageGallery } from "@/components/render/blocks/RenderImageGallery";
import { RenderTimeline } from "@/components/render/blocks/RenderTimeline";
import { RenderCarousel } from "@/components/render/blocks/RenderCarousel";
import { RenderTabs } from "@/components/render/blocks/RenderTabs";
import { RenderTable } from "@/components/render/blocks/RenderTable";
import { RenderCode } from "@/components/render/blocks/RenderCode";
import { RenderCustomHtml } from "@/components/render/blocks/RenderCustomHtml";
import { RenderAudio } from "@/components/render/blocks/RenderAudio";
import { RenderComparison } from "@/components/render/blocks/RenderComparison";
import { RenderMap } from "@/components/render/blocks/RenderMap";
import { RenderRelatedContent } from "@/components/render/blocks/RenderRelatedContent";
import { RenderSidebar } from "@/components/render/blocks/RenderSidebar";
import { RenderSocial } from "@/components/render/blocks/RenderSocial";
import { RenderSlideshow } from "@/components/render/blocks/RenderSlideshow";
import { RenderBannerAd } from "@/components/render/blocks/RenderBannerAd";
import { RenderArticleGrid } from "@/components/render/blocks/RenderArticleGrid";
import { RenderArticleHero } from "@/components/render/blocks/RenderArticleHero";
import { RenderBreakingTicker } from "@/components/render/blocks/RenderBreakingTicker";
import { RenderCategoryNav } from "@/components/render/blocks/RenderCategoryNav";
import { RenderEventList } from "@/components/render/blocks/RenderEventList";
import { RenderBannerZone } from "@/components/render/blocks/RenderBannerZone";
import { RenderNewsletter } from "@/components/render/blocks/RenderNewsletter";
import { RenderNewsletterSignup } from "@/components/render/blocks/RenderNewsletterSignup";
import type { Block, BlockStyle } from "@/lib/types";
import { buildCssGradient } from "@/lib/shapes/gradients";

interface BuilderLayoutRenderedPreviewProps {
  blocks: Block[];
  meta?: Record<string, unknown> | null;
  tenantSlug?: string;
}

function blockStyleToCSS(style: BlockStyle): CSSProperties {
  const css: CSSProperties = {};

  if (style.layout) {
    css.display = style.layout.display;
    if (style.layout.flexDirection) css.flexDirection = style.layout.flexDirection as CSSProperties["flexDirection"];
    if (style.layout.justifyContent) css.justifyContent = style.layout.justifyContent;
    if (style.layout.alignItems) css.alignItems = style.layout.alignItems;
    if (style.layout.gap) css.gap = style.layout.gap;
    css.width = style.layout.width;
    css.maxWidth = style.layout.maxWidth;
    if (style.layout.minHeight) css.minHeight = style.layout.minHeight;
    if (style.layout.overflow) css.overflow = style.layout.overflow as CSSProperties["overflow"];
    if (style.layout.padding) {
      css.padding = `${style.layout.padding.top} ${style.layout.padding.right} ${style.layout.padding.bottom} ${style.layout.padding.left}`;
    }
    if (style.layout.margin) {
      css.margin = `${style.layout.margin.top} ${style.layout.margin.right} ${style.layout.margin.bottom} ${style.layout.margin.left}`;
    }
    if (style.layout.position) css.position = style.layout.position as CSSProperties["position"];
    if (style.layout.zIndex !== undefined) css.zIndex = style.layout.zIndex;
  }

  if (style.background?.type === "color" && style.background.value) css.backgroundColor = style.background.value;
  if (style.background?.type === "gradient" && style.background.value) css.background = style.background.value;
  if (style.background?.advancedGradient) css.backgroundImage = buildCssGradient(style.background.advancedGradient);
  if (style.background?.type === "image" && style.background.value) {
    css.backgroundImage = `url(${style.background.value})`;
    css.backgroundSize = style.background.size || "cover";
    css.backgroundPosition = style.background.position || "center";
    css.backgroundRepeat = style.background.repeat || "no-repeat";
    if (style.background.parallax) css.backgroundAttachment = "fixed";
  }

  if (style.typography) {
    if (style.typography.fontFamily) css.fontFamily = style.typography.fontFamily;
    if (style.typography.fontSize) css.fontSize = style.typography.fontSize;
    if (style.typography.fontWeight) css.fontWeight = style.typography.fontWeight;
    if (style.typography.lineHeight) css.lineHeight = style.typography.lineHeight;
    if (style.typography.letterSpacing) css.letterSpacing = style.typography.letterSpacing;
    if (style.typography.color) css.color = style.typography.color;
    if (style.typography.textAlign) css.textAlign = style.typography.textAlign as CSSProperties["textAlign"];
    if (style.typography.textTransform) css.textTransform = style.typography.textTransform as CSSProperties["textTransform"];
  }

  if (style.border) {
    if (style.border.radius) css.borderRadius = style.border.radius;
    if (style.border.width) css.borderWidth = style.border.width;
    if (style.border.style) css.borderStyle = style.border.style as CSSProperties["borderStyle"];
    if (style.border.color) css.borderColor = style.border.color;
  }

  if (style.shadow) css.boxShadow = style.shadow;
  if (style.opacity !== undefined) css.opacity = style.opacity;
  if (style.transform) css.transform = style.transform;
  if (style.transition) css.transition = style.transition;
  if (style.filter) css.filter = style.filter;
  if (style.backdropFilter) {
    css.backdropFilter = style.backdropFilter;
    (css as Record<string, unknown>).WebkitBackdropFilter = style.backdropFilter;
  }
  if (style.mixBlendMode) css.mixBlendMode = style.mixBlendMode as CSSProperties["mixBlendMode"];
  if (style.textShadow) css.textShadow = style.textShadow;

  return css;
}

function LayoutRenderedBlock({
  block,
  tenantSlug,
}: {
  block: Block;
  tenantSlug: string;
}) {
  if (block.hidden) return null;

  const style = blockStyleToCSS(block.style);
  const emptyData: unknown[] = [];
  let content: React.ReactNode;

  switch (block.type) {
    case "article-grid":
      content = <RenderArticleGrid block={block} data={emptyData} style={style} tenantSlug={tenantSlug} />;
      break;
    case "article-hero":
      content = <RenderArticleHero block={block} data={emptyData} style={style} tenantSlug={tenantSlug} />;
      break;
    case "breaking-ticker":
      content = <RenderBreakingTicker block={block} data={emptyData} style={style} />;
      break;
    case "category-nav":
      content = <RenderCategoryNav block={block} data={emptyData} style={style} tenantSlug={tenantSlug} />;
      break;
    case "event-list":
      content = <RenderEventList block={block} data={emptyData} style={style} />;
      break;
    case "banner-zone":
      content = <RenderBannerZone block={block} data={emptyData} style={style} />;
      break;
    case "newsletter-signup":
      content = <RenderNewsletterSignup block={block} data={emptyData} style={style} tenantSlug={tenantSlug} />;
      break;
    case "text":
      content = <RenderText block={block} style={style} />;
      break;
    case "hero":
      content = <RenderHero block={block} style={style} />;
      break;
    case "quote":
      content = <RenderQuote block={block} style={style} />;
      break;
    case "newsletter":
      content = <RenderNewsletter block={block} data={emptyData} style={style} tenantSlug={tenantSlug} />;
      break;
    case "accordion":
      content = <RenderAccordion block={block} style={style} />;
      break;
    case "video":
      content = <RenderVideo block={block} style={style} />;
      break;
    case "divider":
      content = <RenderDivider block={block} style={style} />;
      break;
    case "counter":
      content = <RenderCounter block={block} style={style} />;
      break;
    case "navigation":
      content = <RenderNavigation block={block} data={emptyData} style={style} />;
      break;
    case "footer":
      content = <RenderFooter block={block} data={emptyData} style={style} />;
      break;
    case "search-bar":
      content = <RenderSearchBar block={block} style={style} tenantSlug={tenantSlug} />;
      break;
    case "cms-form":
      content = <RenderCmsForm block={block} data={emptyData} style={style} tenantSlug={tenantSlug} />;
      break;
    case "author-bio":
      content = <RenderAuthorBio block={block} style={style} />;
      break;
    case "image-gallery":
      content = <RenderImageGallery block={block} style={style} />;
      break;
    case "timeline":
      content = <RenderTimeline block={block} style={style} />;
      break;
    case "carousel":
      content = <RenderCarousel block={block} style={style} />;
      break;
    case "tabs":
      content = <RenderTabs block={block} style={style} />;
      break;
    case "table":
      content = <RenderTable block={block} style={style} />;
      break;
    case "code":
      content = <RenderCode block={block} style={style} />;
      break;
    case "custom-html":
      content = <RenderCustomHtml block={block} style={style} />;
      break;
    case "audio":
      content = <RenderAudio block={block} style={style} />;
      break;
    case "comparison":
      content = <RenderComparison block={block} style={style} />;
      break;
    case "map":
      content = <RenderMap block={block} style={style} />;
      break;
    case "related-content":
      content = <RenderRelatedContent block={block} data={emptyData} style={style} tenantSlug={tenantSlug} />;
      break;
    case "sidebar":
      content = <RenderSidebar block={block} style={style} tenantSlug={tenantSlug} />;
      break;
    case "social":
      content = <RenderSocial block={block} style={style} />;
      break;
    case "slideshow":
      content = <RenderSlideshow block={block} style={style} />;
      break;
    case "banner-ad":
      content = <RenderBannerAd block={block} style={style} />;
      break;
    default:
      content = (
        <RenderGeneric block={block} style={style}>
          {block.children.map((child) => (
            <LayoutRenderedBlock key={child.id} block={child} tenantSlug={tenantSlug} />
          ))}
        </RenderGeneric>
      );
      break;
  }

  return (
    <div
      className="relative rounded-xl"
      style={{
        outline: "1.5px dashed rgba(37,99,235,0.75)",
        outlineOffset: "2px",
      }}
    >
      <div
        className="absolute right-2 top-2 z-20 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]"
        style={{
          background: "rgba(37,99,235,0.12)",
          color: "var(--c-accent)",
          backdropFilter: "blur(8px)",
        }}
      >
        {block.type}
      </div>
      <RenderBlockFrame block={block} style={style}>
        {content}
      </RenderBlockFrame>
    </div>
  );
}

export default function BuilderLayoutRenderedPreview({
  blocks,
  meta,
  tenantSlug = "preview",
}: BuilderLayoutRenderedPreviewProps) {
  if (blocks.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed px-6 py-10 text-center"
        style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}
      >
        <div className="text-sm font-medium" style={{ color: "var(--c-text-2)" }}>
          Nessun blocco builder presente.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "2px solid var(--c-border)", background: "var(--c-bg-1)" }}
    >
      <div className="flex items-center justify-between px-3 py-2" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--c-accent)" }}>
          Render Pagina
        </div>
        <div className="text-[10px] font-mono" style={{ color: "var(--c-text-3)" }}>
          blocchi reali con contorni
        </div>
      </div>
      <div className="p-4">
        <div
          className="mx-auto rounded-[22px] overflow-hidden"
          style={{
            width: "100%",
            maxWidth: 1180,
            border: "1px solid var(--c-border)",
            background: "#fff",
            boxShadow: "0 18px 60px rgba(0,0,0,0.14)",
          }}
        >
          <PageBackgroundFrame meta={meta} scopeId="layout-rendered-preview" className="min-h-[720px]">
            <div className="space-y-4 p-4">
              {blocks.map((block) => (
                <LayoutRenderedBlock key={block.id} block={block} tenantSlug={tenantSlug} />
              ))}
            </div>
          </PageBackgroundFrame>
        </div>
      </div>
    </div>
  );
}
