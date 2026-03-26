import type { BlockStyle } from '@/lib/types/block';

export type TemplateBlockStyle = {
  layout?: Partial<BlockStyle['layout']>;
  background?: Partial<NonNullable<BlockStyle['background']>>;
  typography?: Partial<NonNullable<BlockStyle['typography']>>;
  border?: Partial<NonNullable<BlockStyle['border']>>;
  shadow?: BlockStyle['shadow'];
  opacity?: BlockStyle['opacity'];
  transform?: BlockStyle['transform'];
  transition?: BlockStyle['transition'];
  filter?: BlockStyle['filter'];
  backdropFilter?: BlockStyle['backdropFilter'];
  mixBlendMode?: BlockStyle['mixBlendMode'];
  textShadow?: BlockStyle['textShadow'];
  customCss?: BlockStyle['customCss'];
  effects?: BlockStyle['effects'];
};

export interface ContentBlockTemplate {
  id: string;
  blockType: string;
  name: string;
  description: string;
  props: Record<string, unknown>;
  style: TemplateBlockStyle;
}

function template(
  id: string,
  blockType: string,
  name: string,
  description: string,
  props: Record<string, unknown>,
  style: TemplateBlockStyle
): ContentBlockTemplate {
  return { id, blockType, name, description, props, style };
}

export const HERO_TEMPLATES: ContentBlockTemplate[] = [
  template('hero-editorial-impact', 'hero', 'Editorial Impact', 'Hero centrale forte da homepage editoriale.', {
    templateId: 'hero-editorial-impact',
    title: 'La notizia che apre la giornata',
    subtitle: 'Una hero larga, pulita e subito leggibile per testate newsroom e magazine.',
    ctaText: 'Apri dossier',
    ctaUrl: '#',
    textAlign: 'center',
    contentPosition: 'center',
    contentWidth: '860px',
    panelStyle: 'glass',
    height: '72vh',
    overlayOpacity: 0.46,
  }, {
    background: { type: 'gradient', value: 'linear-gradient(135deg,#0f172a 0%,#1d4ed8 55%,#60a5fa 100%)' },
    typography: { color: '#ffffff', textAlign: 'center' },
  }),
  template('hero-breaking-dark', 'hero', 'Breaking Dark', 'Hero scuro e deciso per breaking o live.', {
    templateId: 'hero-breaking-dark',
    title: 'Breaking news e aggiornamenti live',
    subtitle: 'Flusso rapido, tono urgente e gerarchia molto forte.',
    ctaText: 'Segui live',
    ctaUrl: '#',
    textAlign: 'left',
    contentPosition: 'left',
    contentWidth: '760px',
    panelStyle: 'solid-dark',
    height: '64vh',
    overlayOpacity: 0.62,
  }, {
    background: { type: 'color', value: '#020617' },
    typography: { color: '#ffffff', textAlign: 'left' },
  }),
  template('hero-minimal-clean', 'hero', 'Minimal Clean', 'Hero chiara, essenziale e istituzionale.', {
    templateId: 'hero-minimal-clean',
    title: 'Titolo pulito e professionale',
    subtitle: 'Per pagine istituzionali, landing redazionali e dossier ordinati.',
    ctaText: 'Scopri di più',
    ctaUrl: '#',
    textAlign: 'left',
    contentPosition: 'left',
    contentWidth: '680px',
    panelStyle: 'solid-light',
    height: '58vh',
    overlayOpacity: 0.08,
  }, {
    background: { type: 'color', value: '#f8fafc' },
    typography: { color: '#0f172a', textAlign: 'left' },
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '24px' },
  }),
  template('hero-right-feature', 'hero', 'Right Feature', 'Hero con contenuto spostato a destra.', {
    templateId: 'hero-right-feature',
    title: 'Speciale weekend',
    subtitle: 'Una hero più da campaign o verticale tematica, con contenuto laterale.',
    ctaText: 'Apri speciale',
    ctaUrl: '#',
    textAlign: 'right',
    contentPosition: 'right',
    contentWidth: '720px',
    panelStyle: 'glass',
    height: '66vh',
    overlayOpacity: 0.38,
  }, {
    background: { type: 'gradient', value: 'linear-gradient(135deg,#1e293b 0%,#334155 40%,#0f766e 100%)' },
    typography: { color: '#ffffff', textAlign: 'right' },
  }),
];

export const ARTICLE_HERO_TEMPLATES: ContentBlockTemplate[] = [
  template('article-hero-cover-story', 'article-hero', 'Cover Story', 'Articolo in evidenza con look da cover story.', {
    templateId: 'article-hero-cover-story',
    overlayColor: '#020617',
    overlayOpacity: 0.48,
    contentAlign: 'left',
    contentWidth: '780px',
    panelStyle: 'none',
    showCategory: true,
    showAuthor: true,
    showDate: true,
    showExcerpt: true,
    height: '560px',
  }, {
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.08)', radius: '24px' },
    shadow: '0 22px 48px rgba(15,23,42,0.26)',
  }),
  template('article-hero-panel-left', 'article-hero', 'Panel Left', 'Hero con pannello testo separato.', {
    templateId: 'article-hero-panel-left',
    overlayColor: '#0f172a',
    overlayOpacity: 0.56,
    contentAlign: 'left',
    contentWidth: '640px',
    panelStyle: 'solid-dark',
    showCategory: true,
    showAuthor: true,
    showDate: true,
    showExcerpt: true,
    height: '520px',
  }, {
    border: { width: '1px', style: 'solid', color: '#1e293b', radius: '20px' },
  }),
  template('article-hero-center-focus', 'article-hero', 'Center Focus', 'Hero centrata per grandi aperture.', {
    templateId: 'article-hero-center-focus',
    overlayColor: '#000000',
    overlayOpacity: 0.42,
    contentAlign: 'center',
    contentWidth: '820px',
    panelStyle: 'glass',
    showCategory: true,
    showAuthor: false,
    showDate: true,
    showExcerpt: true,
    height: '600px',
  }, {
    border: { width: '0px', style: 'solid', color: 'transparent', radius: '28px' },
  }),
  template('article-hero-news-flash', 'article-hero', 'News Flash', 'Hero più compatta da homepage flash.', {
    templateId: 'article-hero-news-flash',
    overlayColor: '#111827',
    overlayOpacity: 0.62,
    contentAlign: 'left',
    contentWidth: '560px',
    panelStyle: 'solid-dark',
    showCategory: true,
    showAuthor: false,
    showDate: true,
    showExcerpt: false,
    height: '420px',
  }, {
    border: { width: '1px', style: 'solid', color: '#111827', radius: '18px' },
  }),
];

export const ARTICLE_GRID_TEMPLATES: ContentBlockTemplate[] = [
  template('article-grid-newsroom-3', 'article-grid', 'Newsroom 3 Col', 'Griglia editoriale classica a 3 colonne.', {
    templateId: 'article-grid-newsroom-3',
    columns: 3,
    limit: 9,
    showImage: true,
    showExcerpt: true,
    showCategory: true,
    showAuthor: true,
    showDate: true,
    cardStyle: 'default',
    imageAspectRatio: '16/9',
    cardPadding: '16px',
  }, {
    layout: { gap: '24px', maxWidth: '1200px' },
  }),
  template('article-grid-magazine-cards', 'article-grid', 'Magazine Cards', 'Card più ricche e ariose da magazine.', {
    templateId: 'article-grid-magazine-cards',
    columns: 3,
    limit: 6,
    showImage: true,
    showExcerpt: true,
    showCategory: true,
    showAuthor: false,
    showDate: true,
    cardStyle: 'magazine',
    imageAspectRatio: '4/3',
    cardPadding: '18px',
  }, {
    layout: { gap: '28px', maxWidth: '1280px' },
  }),
  template('article-grid-compact-list', 'article-grid', 'Compact List', 'Stack verticale rapido per sidebar o stream.', {
    templateId: 'article-grid-compact-list',
    columns: 1,
    limit: 5,
    showImage: true,
    showExcerpt: false,
    showCategory: true,
    showAuthor: false,
    showDate: true,
    cardStyle: 'compact',
    imageAspectRatio: '16/10',
    cardPadding: '12px',
  }, {
    layout: { gap: '12px', maxWidth: '100%' },
  }),
  template('article-grid-minimal-4', 'article-grid', 'Minimal 4 Col', 'Molti articoli puliti in 4 colonne.', {
    templateId: 'article-grid-minimal-4',
    columns: 4,
    limit: 8,
    showImage: false,
    showExcerpt: false,
    showCategory: true,
    showAuthor: false,
    showDate: true,
    cardStyle: 'minimal',
    imageAspectRatio: '16/9',
    cardPadding: '0px',
  }, {
    layout: { gap: '18px', maxWidth: '1320px' },
  }),
  template('article-grid-overlay-feature', 'article-grid', 'Overlay Feature', 'Card con immagine grande e testo in overlay.', {
    templateId: 'article-grid-overlay-feature',
    columns: 2,
    limit: 4,
    showImage: true,
    showExcerpt: true,
    showCategory: true,
    showAuthor: false,
    showDate: true,
    cardStyle: 'overlay',
    imageAspectRatio: '16/10',
    cardPadding: '18px',
  }, {
    layout: { gap: '22px', maxWidth: '1180px' },
  }),
];

export const SLIDESHOW_TEMPLATES: ContentBlockTemplate[] = [
  template('slideshow-editorial-hero', 'slideshow', 'Editorial Hero', 'Slideshow hero classica da homepage.', {
    templateId: 'slideshow-editorial-hero',
    autoplay: true,
    interval: 5200,
    showDots: true,
    showArrows: true,
    height: '540px',
    objectFit: 'cover',
    contentPosition: 'bottom-left',
    arrowStyle: 'circle',
    panelStyle: 'none',
  }, {
    border: { width: '0px', style: 'solid', color: 'transparent', radius: '24px' },
  }),
  template('slideshow-glass-story', 'slideshow', 'Glass Story', 'Slideshow con pannello blur sul testo.', {
    templateId: 'slideshow-glass-story',
    autoplay: true,
    interval: 6000,
    showDots: true,
    showArrows: true,
    height: '520px',
    objectFit: 'cover',
    contentPosition: 'bottom-left',
    arrowStyle: 'circle',
    panelStyle: 'glass',
  }, {
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.18)', radius: '24px' },
    backdropFilter: 'blur(14px)',
  }),
  template('slideshow-newsroom-split', 'slideshow', 'Newsroom Split', 'Testo più compatto e navigazione netta.', {
    templateId: 'slideshow-newsroom-split',
    autoplay: false,
    interval: 5000,
    showDots: true,
    showArrows: true,
    height: '460px',
    objectFit: 'cover',
    contentPosition: 'center-left',
    arrowStyle: 'square',
    panelStyle: 'solid-dark',
  }, {
    border: { width: '1px', style: 'solid', color: '#1f2937', radius: '20px' },
  }),
  template('slideshow-minimal-clean', 'slideshow', 'Minimal Clean', 'Slideshow pulita e luminosa.', {
    templateId: 'slideshow-minimal-clean',
    autoplay: true,
    interval: 4800,
    showDots: true,
    showArrows: false,
    height: '420px',
    objectFit: 'cover',
    contentPosition: 'bottom-left',
    arrowStyle: 'minimal',
    panelStyle: 'solid-light',
  }, {
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '20px' },
  }),
];

export const IMAGE_GALLERY_TEMPLATES: ContentBlockTemplate[] = [
  template('gallery-editorial-grid', 'image-gallery', 'Editorial Grid', 'Galleria 3 colonne classica.', {
    templateId: 'gallery-editorial-grid',
    layout: 'grid',
    columns: 3,
    gap: '12px',
    aspectRatio: '4/3',
    borderRadius: '14px',
    showCaptions: true,
    captionPosition: 'below',
    hoverEffect: 'zoom',
  }, {
    layout: { maxWidth: '1200px' },
  }),
  template('gallery-masonry-story', 'image-gallery', 'Masonry Story', 'Galleria masonry da racconto fotografico.', {
    templateId: 'gallery-masonry-story',
    layout: 'masonry',
    columns: 3,
    gap: '16px',
    aspectRatio: 'auto',
    borderRadius: '16px',
    showCaptions: true,
    captionPosition: 'below',
    hoverEffect: 'none',
  }, {
    layout: { maxWidth: '1280px' },
  }),
  template('gallery-overlay-captions', 'image-gallery', 'Overlay Captions', 'Caption sopra la foto, look magazine.', {
    templateId: 'gallery-overlay-captions',
    layout: 'grid',
    columns: 2,
    gap: '18px',
    aspectRatio: '16/10',
    borderRadius: '18px',
    showCaptions: true,
    captionPosition: 'overlay',
    hoverEffect: 'zoom',
  }, {
    layout: { maxWidth: '1180px' },
  }),
  template('gallery-strip-landscape', 'image-gallery', 'Strip Landscape', 'Fila larga per immagini orizzontali.', {
    templateId: 'gallery-strip-landscape',
    layout: 'grid',
    columns: 4,
    gap: '10px',
    aspectRatio: '16/9',
    borderRadius: '12px',
    showCaptions: false,
    captionPosition: 'below',
    hoverEffect: 'fade',
  }, {
    layout: { maxWidth: '1320px' },
  }),
];

export const CAROUSEL_TEMPLATES: ContentBlockTemplate[] = [
  template('carousel-editorial-rail', 'carousel', 'Editorial Rail', 'Rail editoriale per articoli e card.', {
    templateId: 'carousel-editorial-rail',
    cardWidth: '320px',
    gap: '1rem',
    showArrows: true,
    showDots: true,
    cardStyle: 'elevated',
    showCategory: true,
    showDate: true,
    showAuthor: false,
    showExcerpt: true,
    arrowStyle: 'circle',
  }, {
    layout: { maxWidth: '1280px' },
  }),
  template('carousel-compact-news', 'carousel', 'Compact News', 'Carosello più fitto da home newsroom.', {
    templateId: 'carousel-compact-news',
    cardWidth: '260px',
    gap: '0.75rem',
    showArrows: true,
    showDots: false,
    cardStyle: 'compact',
    showCategory: true,
    showDate: true,
    showAuthor: false,
    showExcerpt: false,
    arrowStyle: 'minimal',
  }, {
    layout: { maxWidth: '100%' },
  }),
  template('carousel-dark-media', 'carousel', 'Dark Media', 'Carosello scuro per video e media.', {
    templateId: 'carousel-dark-media',
    cardWidth: '340px',
    gap: '1.1rem',
    showArrows: true,
    showDots: true,
    cardStyle: 'dark',
    showCategory: true,
    showDate: false,
    showAuthor: false,
    showExcerpt: true,
    arrowStyle: 'square',
  }, {
    background: { type: 'color', value: '#020617' },
    typography: { color: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: '#1e293b', radius: '20px' },
  }),
  template('carousel-minimal-cards', 'carousel', 'Minimal Cards', 'Schede pulite per landing e approfondimenti.', {
    templateId: 'carousel-minimal-cards',
    cardWidth: '300px',
    gap: '1rem',
    showArrows: false,
    showDots: true,
    cardStyle: 'minimal',
    showCategory: false,
    showDate: false,
    showAuthor: false,
    showExcerpt: true,
    arrowStyle: 'minimal',
  }, {
    layout: { maxWidth: '1180px' },
  }),
];

export const BANNER_ZONE_TEMPLATES: ContentBlockTemplate[] = [
  template('banner-sidebar-single', 'banner-zone', 'Sidebar Single', 'Singolo banner laterale pulito.', {
    templateId: 'banner-sidebar-single',
    position: 'sidebar',
    scrollingRow: false,
    maxVisible: 1,
    gap: 12,
    minItemWidth: 220,
    cardFrame: false,
  }, {
    layout: { minHeight: '120px' },
  }),
  template('banner-top-scroll', 'banner-zone', 'Top Scroll', 'Riga banner scorrevole da header.', {
    templateId: 'banner-top-scroll',
    position: 'topbar',
    scrollingRow: true,
    maxVisible: 6,
    gap: 24,
    minItemWidth: 180,
    cardFrame: false,
  }, {
    layout: { minHeight: '96px' },
  }),
  template('banner-editorial-grid', 'banner-zone', 'Editorial Grid', 'Più creatività ADV in griglia ordinata.', {
    templateId: 'banner-editorial-grid',
    position: 'sidebar',
    scrollingRow: false,
    maxVisible: 3,
    gap: 16,
    minItemWidth: 220,
    cardFrame: true,
  }, {
    background: { type: 'color', value: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '16px' },
  }),
  template('banner-footer-strip', 'banner-zone', 'Footer Strip', 'Strip adv bassa più compatta.', {
    templateId: 'banner-footer-strip',
    position: 'footer',
    scrollingRow: false,
    maxVisible: 2,
    gap: 18,
    minItemWidth: 240,
    cardFrame: false,
  }, {
    layout: { minHeight: '100px' },
  }),
];

export function getTemplatesForBlock(blockType: string): ContentBlockTemplate[] {
  switch (blockType) {
    case 'hero':
      return HERO_TEMPLATES;
    case 'article-hero':
      return ARTICLE_HERO_TEMPLATES;
    case 'article-grid':
      return ARTICLE_GRID_TEMPLATES;
    case 'slideshow':
      return SLIDESHOW_TEMPLATES;
    case 'image-gallery':
      return IMAGE_GALLERY_TEMPLATES;
    case 'carousel':
      return CAROUSEL_TEMPLATES;
    case 'banner-zone':
      return BANNER_ZONE_TEMPLATES;
    default:
      return [];
  }
}

export function getContentBlockTemplate(blockType: string, templateId: string) {
  return getTemplatesForBlock(blockType).find((template) => template.id === templateId) || null;
}
