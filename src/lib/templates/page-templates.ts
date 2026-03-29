/**
 * Page-level layout templates for the Desktop Editor.
 * Pre-built Block[] arrays that users select when creating a new page.
 */

import { createBlock, createDefaultStyle, type Block, type BlockStyle } from '@/lib/types/block';
import { generateId } from '@/lib/utils/id';

// ---------------------------------------------------------------------------
// Template interface
// ---------------------------------------------------------------------------

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'editorial' | 'business' | 'generic';
  previewColor: string;
  blocks: Block[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a block with a unique ID and optional dataSource. */
function b(
  type: Block['type'],
  label: string,
  props: Record<string, unknown> = {},
  styleOverrides?: Partial<BlockStyle>,
  dataSource?: Block['dataSource'],
  children?: Block[],
): Block {
  const block = createBlock(type, label, props, styleOverrides);
  block.id = generateId();
  if (dataSource) block.dataSource = dataSource;
  if (children) block.children = children;
  return block;
}

// ---------------------------------------------------------------------------
// 1. Homepage Giornalistica
// ---------------------------------------------------------------------------

const homepageGiornalistica: PageTemplate = {
  id: 'homepage-giornalistica',
  name: 'Homepage Giornalistica',
  description: 'Breaking ticker, hero articolo, griglia ultimi 6, sidebar con categorie e trending, zona banner, newsletter',
  category: 'editorial',
  previewColor: '#8B0000',
  blocks: [
    // Navigation
    b('navigation', 'Navigazione', {
      mode: 'custom',
      menuKey: 'primary',
      logoText: 'Testata',
      templateId: 'top-classic',
      sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '32px', bottom: '12px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    // Breaking ticker
    b('breaking-ticker', 'Ultima Ora', {
      speed: 50,
      label: 'ULTIMA ORA',
      direction: 'left',
    }, {
      layout: {
        display: 'flex', alignItems: 'center',
        padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
      background: { type: 'color', value: '#8B0000' },
      typography: { color: '#ffffff', fontWeight: '600', fontSize: '14px' },
    }, { endpoint: 'breaking-news', params: {} }),

    // Hero article
    b('article-hero', 'Articolo in Evidenza', {
      templateId: 'article-hero-cover-story',
      sourceMode: 'automatic',
      autoSource: 'featured',
      overlayColor: '#000000',
      overlayOpacity: 0.5,
      contentAlign: 'left',
      showCategory: true,
      showAuthor: true,
      showDate: true,
      showExcerpt: true,
      height: '500px',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '500px', overflow: 'hidden',
      },
      background: { type: 'image', value: '' },
      typography: { color: '#ffffff' },
    }, { endpoint: 'articles', params: { sourceMode: 'automatic', autoSource: 'featured', featured: 'true', limit: '1' } }),

    // Article grid - latest 6
    b('article-grid', 'Ultimi Articoli', {
      templateId: 'article-grid-newsroom-3',
      sourceMode: 'automatic',
      autoSource: 'latest',
      columns: 3,
      limit: 6,
      showImage: true,
      showExcerpt: true,
      showCategory: true,
      showAuthor: true,
      showDate: true,
    }, {
      layout: {
        display: 'grid', gap: '24px',
        padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }, { endpoint: 'articles', params: { limit: '6', sourceMode: 'automatic', autoSource: 'latest' } }),

    // Sidebar with categories + trending
    b('sidebar', 'Sidebar', {
      widgets: [
        { id: '1', type: 'categories', title: 'Categorie', props: { categories: [] } },
        { id: '2', type: 'recent-posts', title: 'Di Tendenza', props: { posts: [] } },
        { id: '3', type: 'tags', title: 'Tag', props: { tags: [] } },
      ],
      position: 'right',
      sticky: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '24px',
        padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '320px',
      },
    }),

    // Banner zone
    b('banner-zone', 'Zona Banner', {
      templateId: 'banner-sidebar-single',
      sourceMode: 'rotation',
      position: 'leaderboard',
      maxVisible: 1,
    }, {
      layout: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '100%', minHeight: '90px',
      },
      background: { type: 'color', value: '#f8f9fa' },
    }, { endpoint: 'banners', params: { sourceMode: 'rotation', position: 'leaderboard' } }),

    // Newsletter signup
    b('newsletter-signup', 'Iscrizione Newsletter', {
      mode: 'global',
      title: 'Resta aggiornato',
      description: 'Iscriviti alla nostra newsletter per ricevere le notizie più importanti.',
      buttonText: 'Iscriviti',
      placeholder: 'La tua email',
      compact: false,
      style: 'inline',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '600px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { radius: '12px' },
      typography: { textAlign: 'center' },
    }, { endpoint: 'site-newsletter', params: {} }),

    // Footer
    b('footer', 'Footer', {
      mode: 'global',
      variant: 'columns',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// 2. Homepage Magazine
// ---------------------------------------------------------------------------

const homepageMagazine: PageTemplate = {
  id: 'homepage-magazine',
  name: 'Homepage Magazine',
  description: 'Slideshow full-width, articolo in evidenza, griglia 2 colonne, navigazione categorie, footer',
  category: 'editorial',
  previewColor: '#2d3436',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Magazine', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('slideshow', 'Slideshow Principale', {
      templateId: 'slideshow-editorial-hero',
      autoplay: true,
      interval: 5000,
      transition: 'fade',
      loop: true,
      showDots: true,
      showArrows: true,
      height: '500px',
      objectFit: 'cover',
      slides: [
        { id: '1', type: 'image', image: '', title: 'Slide 1', description: 'Primo articolo in evidenza', link: '', overlay: { enabled: true, color: 'rgba(0,0,0,0.4)', position: 'bottom-left' }, buttons: [], textStyle: { titleSize: '36px', titleWeight: '700', descSize: '16px', color: '#ffffff' } },
        { id: '2', type: 'image', image: '', title: 'Slide 2', description: 'Secondo articolo', link: '', overlay: { enabled: true, color: 'rgba(0,0,0,0.3)', position: 'center' }, buttons: [], textStyle: { titleSize: '36px', titleWeight: '700', descSize: '16px', color: '#ffffff' } },
      ],
    }, {
      layout: {
        display: 'block',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
    }),

    b('article-hero', 'Articolo in Evidenza', {
      templateId: 'article-hero-cover-story',
      sourceMode: 'automatic',
      autoSource: 'featured',
      overlayColor: '#000000',
      overlayOpacity: 0.4,
      contentAlign: 'center',
      showCategory: true,
      showAuthor: true,
      showDate: true,
      showExcerpt: true,
      height: '400px',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '400px',
      },
      background: { type: 'image', value: '' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }, { endpoint: 'articles', params: { sourceMode: 'automatic', autoSource: 'featured', featured: 'true', limit: '1' } }),

    b('category-nav', 'Navigazione Categorie', {
      style: 'pills',
      showCount: true,
      colorMode: 'category',
    }, {
      layout: {
        display: 'flex', gap: '8px',
        padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }, { endpoint: 'categories', params: {} }),

    b('article-grid', 'Griglia Articoli', {
      templateId: 'article-grid-newsroom-3',
      sourceMode: 'automatic',
      autoSource: 'latest',
      columns: 2,
      limit: 8,
      showImage: true,
      showExcerpt: true,
      showCategory: true,
      showAuthor: true,
      showDate: true,
      cardStyle: 'default',
    }, {
      layout: {
        display: 'grid', gap: '24px',
        padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }, { endpoint: 'articles', params: { limit: '8', sourceMode: 'automatic', autoSource: 'latest' } }),

    b('footer', 'Footer', {
      mode: 'global', variant: 'columns',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// 3. Landing Page
// ---------------------------------------------------------------------------

const landingPage: PageTemplate = {
  id: 'landing-page',
  name: 'Landing Page',
  description: 'Hero con CTA, sezione 3 colonne feature, citazioni testimonial, newsletter, footer',
  category: 'business',
  previewColor: '#0984e3',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Brand', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }),

    b('hero', 'Hero Principale', {
      templateId: 'hero-editorial-impact',
      title: 'Titolo della Landing Page',
      subtitle: 'Descrizione breve del prodotto o servizio offerto',
      ctaText: 'Inizia ora',
      ctaUrl: '#',
      ctaStyle: 'primary',
      alignment: 'center',
      textAlign: 'center',
      height: '70vh',
      overlayOpacity: 0.5,
      overlayColor: '#000000',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '120px', right: '48px', bottom: '120px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '500px',
      },
      background: { type: 'color', value: '#0984e3' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    // Features - 3 text blocks as feature columns
    b('text', 'Feature 1', {
      content: '<h3>Veloce</h3><p>Prestazioni ottimizzate per la migliore esperienza utente.</p>',
      columns: 1,
    }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '360px',
      },
      typography: { textAlign: 'center', color: '#333333', fontSize: '16px', lineHeight: '1.6' },
    }),

    b('text', 'Feature 2', {
      content: '<h3>Sicuro</h3><p>Protezione dei dati e privacy al primo posto.</p>',
      columns: 1,
    }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '360px',
      },
      typography: { textAlign: 'center', color: '#333333', fontSize: '16px', lineHeight: '1.6' },
    }),

    b('text', 'Feature 3', {
      content: '<h3>Scalabile</h3><p>Cresce con il tuo business senza limiti.</p>',
      columns: 1,
    }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '360px',
      },
      typography: { textAlign: 'center', color: '#333333', fontSize: '16px', lineHeight: '1.6' },
    }),

    // Testimonial quotes
    b('quote', 'Testimonial 1', {
      text: 'Un prodotto eccezionale che ha trasformato il nostro workflow.',
      author: 'Mario Rossi',
      source: 'CEO, Azienda',
      style: 'default',
    }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '48px', bottom: '32px', left: '48px' },
        margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      typography: { fontFamily: 'Georgia, serif', fontSize: '22px', lineHeight: '1.5', color: '#333333', textAlign: 'center' },
      border: { width: '0 0 0 4px', style: 'solid', color: '#0984e3' },
    }),

    b('quote', 'Testimonial 2', {
      text: 'Finalmente una soluzione che funziona davvero.',
      author: 'Laura Bianchi',
      source: 'Marketing Director',
      style: 'default',
    }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '48px', bottom: '32px', left: '48px' },
        margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      typography: { fontFamily: 'Georgia, serif', fontSize: '22px', lineHeight: '1.5', color: '#333333', textAlign: 'center' },
      border: { width: '0 0 0 4px', style: 'solid', color: '#0984e3' },
    }),

    b('newsletter-signup', 'Iscrizione Newsletter', {
      mode: 'global',
      title: 'Non perderti nessuna novità',
      description: 'Iscriviti alla newsletter per aggiornamenti e offerte esclusive.',
      buttonText: 'Iscriviti',
      placeholder: 'La tua email',
      compact: false,
      style: 'inline',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '600px',
      },
      background: { type: 'color', value: '#f0f7ff' },
      border: { radius: '12px' },
      typography: { textAlign: 'center' },
    }, { endpoint: 'site-newsletter', params: {} }),

    b('footer', 'Footer', {
      mode: 'global', variant: 'columns',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// 4. Chi Siamo
// ---------------------------------------------------------------------------

const chiSiamo: PageTemplate = {
  id: 'chi-siamo',
  name: 'Chi Siamo',
  description: 'Hero, testo contenuto, galleria immagini, sezione team, form contatti',
  category: 'business',
  previewColor: '#6c5ce7',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Brand', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }),

    b('hero', 'Hero Chi Siamo', {
      templateId: 'hero-editorial-impact',
      title: 'Chi Siamo',
      subtitle: 'La nostra storia, la nostra missione',
      ctaText: '',
      alignment: 'center',
      textAlign: 'center',
      height: '50vh',
      overlayOpacity: 0.5,
      overlayColor: '#000000',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '400px',
      },
      background: { type: 'color', value: '#6c5ce7' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('text', 'La Nostra Storia', {
      content: '<h2>La Nostra Storia</h2><p>Racconta la storia della tua organizzazione. Da dove siete partiti, cosa vi ha motivato, e dove state andando. Questo spazio è perfetto per condividere i valori e la missione che vi guidano.</p>',
      columns: 1,
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      typography: { fontFamily: 'Georgia, serif', fontSize: '18px', lineHeight: '1.7', color: '#333333' },
    }),

    b('image-gallery', 'Galleria', {
      templateId: 'gallery-editorial-grid',
      layout: 'grid',
      columns: 3,
      gap: '12px',
      aspectRatio: '4/3',
      objectFit: 'cover',
      borderRadius: '8px',
      hoverEffect: 'zoom',
      lightbox: true,
      showCaptions: true,
      items: [
        { id: '1', type: 'image', src: '', alt: 'Immagine 1', caption: 'La nostra sede', overlay: { enabled: false }, buttons: [], badge: '', link: '' },
        { id: '2', type: 'image', src: '', alt: 'Immagine 2', caption: 'Il team', overlay: { enabled: false }, buttons: [], badge: '', link: '' },
        { id: '3', type: 'image', src: '', alt: 'Immagine 3', caption: 'I nostri valori', overlay: { enabled: false }, buttons: [], badge: '', link: '' },
      ],
    }, {
      layout: {
        display: 'block',
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }),

    // Team section - author bio blocks
    b('author-bio', 'Membro Team 1', {
      name: 'Nome Cognome',
      role: 'Direttore',
      bio: 'Breve biografia del membro del team.',
      avatar: '',
      layout: 'horizontal',
    }, {
      layout: {
        display: 'flex', alignItems: 'center', gap: '24px',
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
        margin: { top: '16px', right: 'auto', bottom: '16px', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { radius: '12px' },
    }),

    b('author-bio', 'Membro Team 2', {
      name: 'Nome Cognome',
      role: 'Redattore',
      bio: 'Breve biografia del membro del team.',
      avatar: '',
      layout: 'horizontal',
    }, {
      layout: {
        display: 'flex', alignItems: 'center', gap: '24px',
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
        margin: { top: '16px', right: 'auto', bottom: '16px', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { radius: '12px' },
    }),

    b('cms-form', 'Form Contatti', {
      templateId: 'form-editorial-card',
      formSlug: '',
      showTitle: true,
      showDescription: true,
      layout: 'stacked',
      visualStyle: 'editorial',
      introBadge: 'Contattaci',
      supportText: 'Rispondiamo entro 24 ore',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '16px',
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
        margin: { top: '32px', right: 'auto', bottom: '32px', left: 'auto' },
        width: '100%', maxWidth: '720px',
      },
      background: { type: 'color', value: '#ffffff' },
      border: { width: '1px', style: 'solid', color: '#e5e7eb', radius: '16px' },
    }, { endpoint: 'forms', params: {} }),

    b('footer', 'Footer', {
      mode: 'global', variant: 'columns',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// 5. Contatti
// ---------------------------------------------------------------------------

const contatti: PageTemplate = {
  id: 'contatti',
  name: 'Contatti',
  description: 'Hero, form CMS, mappa, testo con indirizzo e telefono, link social',
  category: 'business',
  previewColor: '#00b894',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Brand', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }),

    b('hero', 'Hero Contatti', {
      templateId: 'hero-editorial-impact',
      title: 'Contattaci',
      subtitle: 'Siamo qui per aiutarti',
      ctaText: '',
      alignment: 'center',
      textAlign: 'center',
      height: '40vh',
      overlayOpacity: 0.5,
      overlayColor: '#000000',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '300px',
      },
      background: { type: 'color', value: '#00b894' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('cms-form', 'Form Contatti', {
      templateId: 'form-editorial-card',
      formSlug: '',
      showTitle: true,
      showDescription: true,
      submitButtonText: 'Invia messaggio',
      layout: 'stacked',
      visualStyle: 'editorial',
      introBadge: 'Scrivici',
      supportText: 'Rispondiamo entro 24 ore',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '16px',
        padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '32px', right: 'auto', bottom: '32px', left: 'auto' },
        width: '100%', maxWidth: '720px',
      },
      background: { type: 'color', value: '#ffffff' },
      border: { width: '1px', style: 'solid', color: '#e5e7eb', radius: '16px' },
    }, { endpoint: 'forms', params: {} }),

    b('map', 'Mappa', {
      address: 'Milano, Italia',
      lat: 45.4642,
      lng: 9.19,
      zoom: 14,
      mapType: 'roadmap',
      height: '400px',
      showMarker: true,
    }, {
      layout: {
        display: 'block',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
      border: { radius: '0' },
    }),

    b('text', 'Recapiti', {
      content: '<h2>I Nostri Recapiti</h2><p><strong>Indirizzo:</strong> Via Roma 1, 20100 Milano (MI)</p><p><strong>Telefono:</strong> +39 02 1234567</p><p><strong>Email:</strong> info@example.com</p><p><strong>Orari:</strong> Lun-Ven 9:00-18:00</p>',
      columns: 1,
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      typography: { fontSize: '16px', lineHeight: '1.8', color: '#333333' },
    }),

    b('social', 'Link Social', {
      mode: 'links',
      templateId: 'social-editorial-row',
      title: 'Seguici',
      description: 'I nostri canali social',
      style: 'pill',
      size: 'medium',
      colorMode: 'brand',
      alignment: 'center',
      showLabels: true,
      platforms: [
        { id: 'fb', platform: 'facebook', label: 'Facebook', handle: '', url: '#', enabled: true },
        { id: 'ig', platform: 'instagram', label: 'Instagram', handle: '', url: '#', enabled: true },
        { id: 'tw', platform: 'x', label: 'X', handle: '', url: '#', enabled: true },
        { id: 'li', platform: 'linkedin', label: 'LinkedIn', handle: '', url: '#', enabled: true },
      ],
    }, {
      layout: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px',
        padding: { top: '32px', right: '16px', bottom: '32px', left: '16px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
    }),

    b('footer', 'Footer', {
      mode: 'global', variant: 'columns',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// 6. Categoria
// ---------------------------------------------------------------------------

const categoria: PageTemplate = {
  id: 'categoria',
  name: 'Categoria',
  description: 'Navigazione categorie, lista articoli con sidebar, zona banner, newsletter',
  category: 'editorial',
  previewColor: '#e17055',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Testata', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '32px', bottom: '12px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('category-nav', 'Navigazione Categorie', {
      style: 'pills',
      showCount: true,
      colorMode: 'category',
    }, {
      layout: {
        display: 'flex', gap: '8px',
        padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }, { endpoint: 'categories', params: {} }),

    b('article-grid', 'Lista Articoli', {
      templateId: 'article-grid-newsroom-3',
      sourceMode: 'automatic',
      autoSource: 'latest',
      columns: 2,
      limit: 12,
      showImage: true,
      showExcerpt: true,
      showCategory: true,
      showAuthor: true,
      showDate: true,
      cardStyle: 'default',
    }, {
      layout: {
        display: 'grid', gap: '24px',
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '900px',
      },
    }, { endpoint: 'articles', params: { limit: '12', sourceMode: 'automatic', autoSource: 'latest' } }),

    b('sidebar', 'Sidebar', {
      widgets: [
        { id: '1', type: 'search', title: 'Cerca', props: { placeholder: 'Cerca articoli...' } },
        { id: '2', type: 'categories', title: 'Categorie', props: { categories: [] } },
        { id: '3', type: 'recent-posts', title: 'Più Letti', props: { posts: [] } },
      ],
      position: 'right',
      sticky: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '24px',
        padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '320px',
      },
    }),

    b('banner-zone', 'Zona Banner', {
      templateId: 'banner-sidebar-single',
      sourceMode: 'rotation',
      position: 'leaderboard',
      maxVisible: 1,
    }, {
      layout: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '100%', minHeight: '90px',
      },
      background: { type: 'color', value: '#f8f9fa' },
    }, { endpoint: 'banners', params: { sourceMode: 'rotation', position: 'leaderboard' } }),

    b('newsletter-signup', 'Iscrizione Newsletter', {
      mode: 'global',
      title: 'Newsletter',
      description: 'Ricevi gli articoli migliori direttamente nella tua casella.',
      buttonText: 'Iscriviti',
      placeholder: 'La tua email',
      compact: false,
      style: 'inline',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '600px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { radius: '12px' },
      typography: { textAlign: 'center' },
    }, { endpoint: 'site-newsletter', params: {} }),

    b('footer', 'Footer', {
      mode: 'global', variant: 'columns',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// 7. Pagina Articolo Custom
// ---------------------------------------------------------------------------

const paginaArticoloCustom: PageTemplate = {
  id: 'pagina-articolo-custom',
  name: 'Pagina Articolo Custom',
  description: 'Hero, testo contenuto, articoli correlati, area commenti, bio autore',
  category: 'editorial',
  previewColor: '#fdcb6e',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Testata', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '32px', bottom: '12px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('article-hero', 'Hero Articolo', {
      templateId: 'article-hero-cover-story',
      sourceMode: 'automatic',
      autoSource: 'featured',
      overlayColor: '#000000',
      overlayOpacity: 0.5,
      contentAlign: 'left',
      showCategory: true,
      showAuthor: true,
      showDate: true,
      showExcerpt: true,
      height: '450px',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '450px', overflow: 'hidden',
      },
      background: { type: 'image', value: '' },
      typography: { color: '#ffffff' },
    }, { endpoint: 'articles', params: { sourceMode: 'automatic', autoSource: 'featured', featured: 'true', limit: '1' } }),

    b('text', 'Contenuto Articolo', {
      content: '<p>Contenuto principale dell\'articolo. Scrivi qui il corpo del testo, con paragrafi, immagini inline e formattazione ricca.</p>',
      columns: 1,
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      typography: { fontFamily: 'Georgia, serif', fontSize: '18px', lineHeight: '1.8', color: '#333333' },
    }),

    b('related-content', 'Articoli Correlati', {
      title: 'Articoli Correlati',
      columns: 3,
      showDate: true,
      showExcerpt: true,
      showImage: true,
      cardStyle: 'elevated',
      items: [
        { id: '1', title: 'Articolo Correlato 1', excerpt: 'Anteprima...', image: '', url: '#', date: '2026-03-20' },
        { id: '2', title: 'Articolo Correlato 2', excerpt: 'Anteprima...', image: '', url: '#', date: '2026-03-19' },
        { id: '3', title: 'Articolo Correlato 3', excerpt: 'Anteprima...', image: '', url: '#', date: '2026-03-18' },
      ],
    }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }),

    // Comments area placeholder
    b('text', 'Area Commenti', {
      content: '<h3>Commenti</h3><p>L\'area commenti viene caricata dinamicamente dal CMS.</p>',
      columns: 1,
    }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { radius: '12px' },
      typography: { fontSize: '16px', lineHeight: '1.6', color: '#555555' },
    }),

    b('author-bio', 'Bio Autore', {
      name: 'Nome Autore',
      role: 'Giornalista',
      bio: 'Breve biografia dell\'autore che comparirà sotto l\'articolo.',
      avatar: '',
      layout: 'horizontal',
      socialLinks: [
        { platform: 'twitter', url: '#' },
        { platform: 'linkedin', url: '#' },
      ],
    }, {
      layout: {
        display: 'flex', alignItems: 'center', gap: '24px',
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
        margin: { top: '32px', right: 'auto', bottom: '32px', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { radius: '12px' },
    }),

    b('footer', 'Footer', {
      mode: 'global', variant: 'columns',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// 8. Blank con Struttura
// ---------------------------------------------------------------------------

const blankConStruttura: PageTemplate = {
  id: 'blank-con-struttura',
  name: 'Blank con Struttura',
  description: 'Navigazione header, sezione contenuto principale, footer. Struttura base da personalizzare.',
  category: 'generic',
  previewColor: '#636e72',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'SiteName', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }),

    b('section', 'Contenuto Principale', {
      tag: 'main',
      fullWidth: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'column',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '400px',
      },
      background: { type: 'none', value: '' },
    }),

    b('footer', 'Footer', {
      mode: 'global', variant: 'columns',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const PAGE_TEMPLATES: PageTemplate[] = [
  homepageGiornalistica,
  homepageMagazine,
  landingPage,
  chiSiamo,
  contatti,
  categoria,
  paginaArticoloCustom,
  blankConStruttura,
];

export function getPageTemplateById(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find(t => t.id === id);
}

export function getPageTemplatesByCategory(category?: string): PageTemplate[] {
  if (!category) return PAGE_TEMPLATES;
  return PAGE_TEMPLATES.filter(t => t.category === category);
}
