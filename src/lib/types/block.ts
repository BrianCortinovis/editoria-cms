// ============================================
// BLOCK SYSTEM - Core Types
// ============================================

export type BlockType =
  | 'section' | 'container' | 'columns'
  | 'hero' | 'text' | 'image-gallery' | 'video' | 'audio'
  | 'banner-ad' | 'navigation' | 'footer' | 'sidebar'
  | 'social' | 'author-bio' | 'related-content' | 'newsletter'
  | 'timeline' | 'quote' | 'accordion' | 'tabs' | 'map'
  | 'code' | 'table' | 'divider' | 'counter' | 'comparison'
  | 'custom-html' | 'slideshow' | 'carousel'
  // Editorial data-bound blocks
  | 'article-grid' | 'article-hero' | 'breaking-ticker'
  | 'category-nav' | 'event-list' | 'banner-zone'
  | 'search-bar' | 'newsletter-signup';

export type BlockCategory =
  | 'layout' | 'content' | 'media'
  | 'editorial' | 'interactive' | 'monetization';

// === Spacing ===
export interface Spacing {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

// === Block Style ===
export interface BlockStyle {
  layout: {
    display: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    padding: Spacing;
    margin: Spacing;
    width: string;
    maxWidth: string;
    minHeight?: string;
    overflow?: string;
    position?: string;
    zIndex?: number;
  };
  background: {
    type: 'none' | 'color' | 'gradient' | 'image' | 'video';
    value: string;
    overlay?: string;
    parallax?: boolean;
    size?: string;
    position?: string;
    repeat?: string;
  };
  typography: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    color?: string;
    textAlign?: string;
    textTransform?: string;
  };
  border: {
    width?: string;
    style?: string;
    color?: string;
    radius?: string;
  };
  shadow?: string;
  opacity?: number;
  transform?: string;
  transition?: string;
  filter?: string;
  backdropFilter?: string;
  mixBlendMode?: string;
  textShadow?: string;
  customCss?: string;
}

// === Divider Config ===
export type DividerShape = 'diagonal' | 'wave' | 'zigzag' | 'curve' | 'triangle' | 'arrow' | 'custom';

export interface DividerConfig {
  shape: DividerShape;
  height: number;
  flip: boolean;
  invert: boolean;
  color: string;
  svgPath?: string;
}

// === Block Shape ===
export interface BlockShape {
  type: 'clip-path' | 'svg-mask' | 'custom-drawing';
  value: string;
  topDivider?: DividerConfig;
  bottomDivider?: DividerConfig;
}

// === Animation ===
export type AnimationTrigger = 'entrance' | 'scroll' | 'hover';
export type AnimationEffect = 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'zoom-in' | 'zoom-out' | 'rotate' | 'bounce' | 'flip' | 'none';

export interface BlockAnimation {
  trigger: AnimationTrigger;
  effect: AnimationEffect;
  duration: number;
  delay: number;
  easing: string;
}

// === Responsive ===
export interface ResponsiveOverrides {
  tablet?: Partial<BlockStyle>;
  mobile?: Partial<BlockStyle>;
}

// === Data Source (for editorial blocks) ===
export interface BlockDataSource {
  endpoint: string;
  params: Record<string, string>;
  refreshInterval?: number;
}

// === Core Block ===
export interface Block {
  id: string;
  type: BlockType;
  label: string;
  props: Record<string, unknown>;
  style: BlockStyle;
  shape: BlockShape | null;
  responsive: ResponsiveOverrides;
  animation: BlockAnimation | null;
  children: Block[];
  locked: boolean;
  hidden: boolean;
  dataSource?: BlockDataSource;
}

// === Block Definition (Registry) ===
export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  category: BlockCategory;
  defaultProps: Record<string, unknown>;
  defaultStyle: Partial<BlockStyle>;
  supportsChildren: boolean;
  maxChildren?: number;
  allowedChildTypes?: BlockType[];
  defaultDataSource?: BlockDataSource;
}

// === Default Style Factory ===
export function createDefaultStyle(overrides?: Partial<BlockStyle>): BlockStyle {
  const base: BlockStyle = {
    layout: {
      display: 'block',
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
    },
    background: {
      type: 'none',
      value: '',
    },
    typography: {},
    border: {},
  };

  if (!overrides) return base;

  return {
    layout: { ...base.layout, ...overrides.layout },
    background: { ...base.background, ...overrides.background },
    typography: { ...base.typography, ...overrides.typography },
    border: { ...base.border, ...overrides.border },
    shadow: overrides.shadow ?? base.shadow,
    opacity: overrides.opacity ?? base.opacity,
    transform: overrides.transform ?? base.transform,
    transition: overrides.transition ?? base.transition,
    customCss: overrides.customCss ?? base.customCss,
  };
}

// === Block Factory ===
export function createBlock(
  type: BlockType,
  label: string,
  props: Record<string, unknown> = {},
  styleOverrides?: Partial<BlockStyle>,
  dataSource?: BlockDataSource
): Block {
  return {
    id: '',
    type,
    label,
    props,
    style: createDefaultStyle(styleOverrides),
    shape: null,
    responsive: {},
    animation: null,
    children: [],
    locked: false,
    hidden: false,
    ...(dataSource ? { dataSource } : {}),
  };
}
