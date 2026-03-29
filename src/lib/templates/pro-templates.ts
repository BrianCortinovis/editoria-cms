/**
 * Professional page layout templates for the Desktop Editor.
 * 35 pro templates across editorial, business, layout, and generic categories.
 */

import { createBlock, createDefaultStyle, type Block, type BlockStyle } from '@/lib/types/block';
import { generateId } from '@/lib/utils/id';
import type { PageTemplate } from './page-templates';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

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
// EDITORIAL CATEGORY
// ---------------------------------------------------------------------------

// 1. Quotidiano Classico
const quotidianoClassico: PageTemplate = {
  id: 'quotidiano-classico',
  name: 'Quotidiano Classico',
  description: 'Layout classico a tre colonne: sidebar sinistra con categorie e banner, contenuto principale con hero e griglia articoli, sidebar destra con trending e newsletter',
  category: 'editorial',
  previewColor: '#1a1a2e',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Quotidiano', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '32px', bottom: '12px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.3)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('breaking-ticker', 'Ultima Ora', {
      speed: 50, label: 'ULTIMA ORA', direction: 'left',
    }, {
      layout: {
        display: 'flex', alignItems: 'center',
        padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
      background: { type: 'color', value: '#c0392b' },
      typography: { color: '#ffffff', fontWeight: '600', fontSize: '14px' },
    }, { endpoint: 'breaking-news', params: {} }),

    // Three-column layout: left sidebar + main + right sidebar
    b('columns', 'Layout Tre Colonne', {
      columns: 3,
      gap: '0',
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1400px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      // Left sidebar
      b('sidebar', 'Sidebar Sinistra', {
        widgets: [
          { id: 'cat-1', type: 'categories', title: 'Categorie', props: { categories: [] } },
          { id: 'banner-1', type: 'banner-ad', title: 'Pubblicità', props: {} },
          { id: 'tags-1', type: 'tags', title: 'Tag Popolari', props: { tags: [] } },
        ],
        position: 'left',
        sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '220px', maxWidth: '220px', minHeight: '600px',
        },
        background: { type: 'color', value: '#f8f9fa' },
        border: { width: '0 1px 0 0', style: 'solid', color: '#e0e0e0' },
      }, { endpoint: 'categories', params: {} }),

      // Main content
      b('section', 'Contenuto Principale', {}, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '0',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('article-hero', 'Articolo Hero', {
          templateId: 'article-hero-cover-story',
          sourceMode: 'automatic', autoSource: 'featured',
          overlayColor: '#000000', overlayOpacity: 0.5,
          contentAlign: 'left', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true, height: '420px',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%', minHeight: '420px', overflow: 'hidden',
          },
          background: { type: 'image', value: '' },
          typography: { color: '#ffffff' },
        }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

        b('article-grid', 'Griglia Articoli', {
          templateId: 'article-grid-newsroom-3',
          sourceMode: 'automatic', autoSource: 'latest',
          columns: 2, limit: 6, showImage: true, showExcerpt: true, showCategory: true, showAuthor: true, showDate: true,
        }, {
          layout: {
            display: 'grid', gap: '20px',
            padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
        }, { endpoint: 'articles', params: { limit: '6' } }),
      ]),

      // Right sidebar
      b('sidebar', 'Sidebar Destra', {
        widgets: [
          { id: 'trending-1', type: 'recent-posts', title: 'Di Tendenza', props: { posts: [] } },
          { id: 'newsletter-1', type: 'newsletter', title: 'Newsletter', props: {} },
          { id: 'banner-2', type: 'banner-ad', title: 'Pubblicità', props: {} },
        ],
        position: 'right',
        sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '280px', maxWidth: '280px', minHeight: '600px',
        },
        background: { type: 'color', value: '#f8f9fa' },
        border: { width: '0 0 0 1px', style: 'solid', color: '#e0e0e0' },
      }, { endpoint: 'articles', params: { trending: 'true', limit: '5' } }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
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

// 2. Quotidiano Moderno
const quotidianoModerno: PageTemplate = {
  id: 'quotidiano-moderno',
  name: 'Quotidiano Moderno',
  description: 'Hero full-width, poi layout a due colonne: 70% articoli + 30% sidebar destra sticky',
  category: 'editorial',
  previewColor: '#2c3e50',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'News', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '40px', bottom: '14px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.1)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('article-hero', 'Hero Full-Width', {
      templateId: 'article-hero-cover-story',
      sourceMode: 'automatic', autoSource: 'featured',
      overlayColor: '#000000', overlayOpacity: 0.55,
      contentAlign: 'left', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true, height: '540px',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: { top: '60px', right: '60px', bottom: '60px', left: '60px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '540px', overflow: 'hidden',
      },
      background: { type: 'image', value: '' },
      typography: { color: '#ffffff' },
    }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

    b('columns', 'Layout Principale', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'flex-start',
        padding: { top: '40px', right: '40px', bottom: '40px', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('section', 'Articoli Principali', {}, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '24px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '70%', maxWidth: '70%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('article-grid', 'Ultimi Articoli', {
          templateId: 'article-grid-newsroom-3',
          sourceMode: 'automatic', autoSource: 'latest',
          columns: 2, limit: 8, showImage: true, showExcerpt: true, showCategory: true, showAuthor: true, showDate: true,
        }, {
          layout: {
            display: 'grid', gap: '24px',
            padding: { top: '0', right: '0', bottom: '0', left: '0' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
        }, { endpoint: 'articles', params: { limit: '8' } }),
      ]),

      b('sidebar', 'Sidebar Destra Sticky', {
        widgets: [
          { id: 'trending-1', type: 'recent-posts', title: 'Più Letti', props: { posts: [] } },
          { id: 'banner-1', type: 'banner-ad', title: 'Pubblicità', props: {} },
          { id: 'newsletter-1', type: 'newsletter', title: 'Newsletter', props: {} },
          { id: 'tags-1', type: 'tags', title: 'Argomenti', props: { tags: [] } },
        ],
        position: 'right',
        sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '30%', maxWidth: '30%', position: 'sticky',
        },
        background: { type: 'none', value: '' },
      }, { endpoint: 'articles', params: { trending: 'true', limit: '5' } }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2c3e50' },
      typography: { color: '#bdc3c7', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 3. Rivista Digitale
const rivistaDigitale: PageTemplate = {
  id: 'rivista-digitale',
  name: 'Rivista Digitale',
  description: 'Banner superiore, griglia articoli stile masonry, sidebar orizzontale inferiore scrollabile',
  category: 'editorial',
  previewColor: '#8e44ad',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Rivista', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('banner-zone', 'Banner Superiore', {
      templateId: 'banner-leaderboard',
      sourceMode: 'rotation', position: 'leaderboard', maxVisible: 1,
    }, {
      layout: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: { top: '12px', right: '16px', bottom: '12px', left: '16px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '100%', minHeight: '90px',
      },
      background: { type: 'color', value: '#f0f0f0' },
    }, { endpoint: 'banners', params: { position: 'leaderboard' } }),

    b('article-featured', 'Articolo in Primo Piano', {
      sourceMode: 'automatic', autoSource: 'featured',
      layout: 'magazine', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'stretch',
        padding: { top: '32px', right: '40px', bottom: '32px', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px', minHeight: '380px',
      },
      background: { type: 'none', value: '' },
    }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

    b('article-grid', 'Griglia Articoli', {
      templateId: 'article-grid-masonry',
      sourceMode: 'automatic', autoSource: 'latest',
      columns: 3, limit: 9, showImage: true, showExcerpt: false, showCategory: true, showAuthor: false, showDate: true,
      masonry: true,
    }, {
      layout: {
        display: 'grid', gap: '20px',
        padding: { top: '24px', right: '40px', bottom: '24px', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
      },
    }, { endpoint: 'articles', params: { limit: '9' } }),

    // Horizontal scrollable bottom bar
    b('section', 'Barra Inferiore Scorrevole', {}, {
      layout: {
        display: 'flex', flexDirection: 'column',
        padding: { top: '24px', right: '0', bottom: '24px', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { width: '1px 0 0 0', style: 'solid', color: '#e0e0e0' },
    }, undefined, [
      b('article-list', 'Articoli Recenti Orizzontali', {
        sourceMode: 'automatic', autoSource: 'latest',
        limit: 10, orientation: 'horizontal', showImage: true, showCategory: true, showDate: true,
        scrollable: true, overflowX: 'auto',
      }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '16px', overflow: 'hidden',
          padding: { top: '8px', right: '24px', bottom: '8px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
      }, { endpoint: 'articles', params: { limit: '10' } }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2d1b42' },
      typography: { color: '#c9aee0', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 4. Blog Professionale
const blogProfessionale: PageTemplate = {
  id: 'blog-professionale',
  name: 'Blog Professionale',
  description: 'Sidebar sinistra con navigazione e categorie, area contenuto principale senza sidebar destra',
  category: 'editorial',
  previewColor: '#27ae60',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Blog', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('columns', 'Layout Blog', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'flex-start',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('sidebar', 'Sidebar Sinistra', {
        widgets: [
          { id: 'search-1', type: 'search', title: 'Cerca', props: {} },
          { id: 'cat-1', type: 'categories', title: 'Categorie', props: { categories: [] } },
          { id: 'archive-1', type: 'archive', title: 'Archivio', props: {} },
          { id: 'tags-1', type: 'tags', title: 'Tag', props: { tags: [] } },
        ],
        position: 'left',
        sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '24px',
          padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '260px', maxWidth: '260px', position: 'sticky',
        },
        background: { type: 'color', value: '#fafafa' },
        border: { width: '0 1px 0 0', style: 'solid', color: '#eeeeee' },
      }, { endpoint: 'categories', params: {} }),

      b('section', 'Feed Blog', {}, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '32px',
          padding: { top: '32px', right: '40px', bottom: '32px', left: '40px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('article-hero', 'Articolo in Evidenza', {
          templateId: 'article-hero-cover-story',
          sourceMode: 'automatic', autoSource: 'featured',
          overlayColor: '#1a1a1a', overlayOpacity: 0.4,
          contentAlign: 'left', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true, height: '360px',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' },
            margin: { top: '0', right: '0', bottom: '24px', left: '0' },
            width: '100%', maxWidth: '100%', minHeight: '360px', overflow: 'hidden',
          },
          background: { type: 'image', value: '' },
          typography: { color: '#ffffff' },
          border: { radius: '8px' },
        }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

        b('article-list', 'Lista Articoli', {
          sourceMode: 'automatic', autoSource: 'latest',
          limit: 10, orientation: 'vertical',
          showImage: true, showExcerpt: true, showCategory: true, showAuthor: true, showDate: true, showReadMore: true,
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', gap: '28px',
            padding: { top: '0', right: '0', bottom: '0', left: '0' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
        }, { endpoint: 'articles', params: { limit: '10' } }),
      ]),
    ]),

    b('newsletter-signup', 'Newsletter', {
      mode: 'global',
      title: 'Iscriviti al Blog',
      description: 'Ricevi i nuovi articoli direttamente nella tua casella email.',
      buttonText: 'Iscriviti',
      placeholder: 'La tua email',
      compact: false,
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '600px',
      },
      background: { type: 'color', value: '#e8f8ef' },
      border: { radius: '12px' },
      typography: { textAlign: 'center' },
    }, { endpoint: 'site-newsletter', params: {} }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1e3a2a' },
      typography: { color: '#a8d5bc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 5. Portale News 24h
const portaleNews24h: PageTemplate = {
  id: 'portale-news-24h',
  name: 'Portale News 24h',
  description: 'Ticker breaking news, hero grande + 3 notizie, zona banner pubblicitaria, griglia 4 colonne',
  category: 'editorial',
  previewColor: '#e74c3c',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'News24', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '10px', right: '24px', bottom: '10px', left: '24px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#e74c3c' },
      typography: { color: '#ffffff' },
      shadow: '0 2px 8px rgba(231,76,60,0.4)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('breaking-ticker', 'Breaking News', {
      speed: 60, label: 'BREAKING', direction: 'left',
    }, {
      layout: {
        display: 'flex', alignItems: 'center',
        padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
      background: { type: 'color', value: '#c0392b' },
      typography: { color: '#ffffff', fontWeight: '700', fontSize: '13px' },
    }, { endpoint: 'breaking-news', params: {} }),

    b('category-nav', 'Navigazione Sezioni', {
      style: 'tabs', showCount: false, colorMode: 'uniform',
    }, {
      layout: {
        display: 'flex', gap: '0',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
        overflow: 'hidden',
      },
      background: { type: 'color', value: '#2c2c2c' },
      typography: { color: '#ffffff', fontSize: '13px', fontWeight: '500' },
    }, { endpoint: 'categories', params: {} }),

    // Hero + 3 small
    b('columns', 'Hero + Notizie Brevi', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'stretch',
        padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1400px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('article-hero', 'Notizia Principale', {
        templateId: 'article-hero-cover-story',
        sourceMode: 'automatic', autoSource: 'featured',
        overlayColor: '#000000', overlayOpacity: 0.6,
        contentAlign: 'left', showCategory: true, showAuthor: false, showDate: true, showExcerpt: true, height: '480px',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '65%', maxWidth: '65%', minHeight: '480px', overflow: 'hidden',
        },
        background: { type: 'image', value: '' },
        typography: { color: '#ffffff' },
        border: { radius: '4px' },
      }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

      b('article-list', 'Notizie Secondarie', {
        sourceMode: 'automatic', autoSource: 'latest',
        limit: 3, orientation: 'vertical',
        showImage: true, showExcerpt: false, showCategory: true, showDate: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '12px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '35%', maxWidth: '35%',
        },
      }, { endpoint: 'articles', params: { limit: '3', offset: '1' } }),
    ]),

    b('banner-zone', 'Banner Pubblicitario', {
      templateId: 'banner-leaderboard',
      sourceMode: 'rotation', position: 'leaderboard', maxVisible: 1,
    }, {
      layout: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '100%', minHeight: '90px',
      },
      background: { type: 'color', value: '#f0f0f0' },
    }, { endpoint: 'banners', params: { position: 'leaderboard' } }),

    b('article-grid', 'Griglia Notizie', {
      templateId: 'article-grid-newsroom-4',
      sourceMode: 'automatic', autoSource: 'latest',
      columns: 4, limit: 8, showImage: true, showExcerpt: false, showCategory: true, showDate: true,
    }, {
      layout: {
        display: 'grid', gap: '16px',
        padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1400px',
      },
    }, { endpoint: 'articles', params: { limit: '8', offset: '4' } }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a1a' },
      typography: { color: '#cccccc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 6. Testata Sportiva
const testataSportiva: PageTemplate = {
  id: 'testata-sportiva',
  name: 'Testata Sportiva',
  description: 'Hero sportivo con sezione punteggi live, griglia articoli sport, sidebar con classifiche e risultati',
  category: 'editorial',
  previewColor: '#e67e22',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sport Live', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '32px', bottom: '12px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#1a1a1a' },
      typography: { color: '#ffffff' },
      border: { width: '0 0 3px 0', style: 'solid', color: '#e67e22' },
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('breaking-ticker', 'Risultati Live', {
      speed: 40, label: 'LIVE', direction: 'left',
    }, {
      layout: {
        display: 'flex', alignItems: 'center',
        padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
      background: { type: 'color', value: '#e67e22' },
      typography: { color: '#ffffff', fontWeight: '700', fontSize: '13px' },
    }, { endpoint: 'breaking-news', params: { category: 'sport' } }),

    b('article-hero', 'Hero Sport', {
      templateId: 'article-hero-cover-story',
      sourceMode: 'automatic', autoSource: 'featured',
      category: 'sport',
      overlayColor: '#000000', overlayOpacity: 0.5,
      contentAlign: 'left', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true, height: '460px',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: { top: '40px', right: '48px', bottom: '40px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '460px', overflow: 'hidden',
      },
      background: { type: 'image', value: '' },
      typography: { color: '#ffffff' },
    }, { endpoint: 'articles', params: { featured: 'true', category: 'sport', limit: '1' } }),

    b('columns', 'Contenuto Sport', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'flex-start',
        padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('article-grid', 'Articoli Sport', {
        templateId: 'article-grid-newsroom-3',
        sourceMode: 'automatic', autoSource: 'latest',
        category: 'sport',
        columns: 2, limit: 6, showImage: true, showExcerpt: true, showCategory: true, showAuthor: true, showDate: true,
      }, {
        layout: {
          display: 'grid', gap: '20px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '70%', maxWidth: '70%',
        },
      }, { endpoint: 'articles', params: { category: 'sport', limit: '6' } }),

      b('sidebar', 'Sidebar Classifiche', {
        widgets: [
          { id: 'standings-1', type: 'recent-posts', title: 'Classifica', props: { posts: [] } },
          { id: 'results-1', type: 'recent-posts', title: 'Risultati', props: { posts: [] } },
          { id: 'banner-1', type: 'banner-ad', title: 'Pubblicità', props: {} },
        ],
        position: 'right', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '30%', maxWidth: '30%', position: 'sticky',
        },
        background: { type: 'none', value: '' },
      }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a1a' },
      typography: { color: '#aaaaaa', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 7. Giornale Locale
const giornaleLocale: PageTemplate = {
  id: 'giornale-locale',
  name: 'Giornale Locale',
  description: 'Navigazione con sezioni locali, hero articolo, griglia a 2 colonne con tab categorie, sidebar eventi',
  category: 'editorial',
  previewColor: '#16a085',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Il Locale', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '32px', bottom: '12px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 4px rgba(0,0,0,0.1)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('category-nav', 'Sezioni Locali', {
      style: 'underline', showCount: false, colorMode: 'uniform',
    }, {
      layout: {
        display: 'flex', gap: '0',
        padding: { top: '0', right: '32px', bottom: '0', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
        overflow: 'hidden',
      },
      background: { type: 'color', value: '#16a085' },
      typography: { color: '#ffffff', fontSize: '14px', fontWeight: '500' },
    }, { endpoint: 'categories', params: { type: 'local' } }),

    b('article-hero', 'Notizia Principale', {
      templateId: 'article-hero-cover-story',
      sourceMode: 'automatic', autoSource: 'featured',
      overlayColor: '#000000', overlayOpacity: 0.45,
      contentAlign: 'left', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true, height: '400px',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: { top: '32px', right: '40px', bottom: '32px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '400px', overflow: 'hidden',
      },
      background: { type: 'image', value: '' },
      typography: { color: '#ffffff' },
    }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

    b('columns', 'Articoli + Eventi', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'flex-start',
        padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('article-grid', 'Ultime Notizie', {
        sourceMode: 'automatic', autoSource: 'latest',
        columns: 2, limit: 6, showImage: true, showExcerpt: true, showCategory: true, showDate: true,
      }, {
        layout: {
          display: 'grid', gap: '20px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '65%', maxWidth: '65%',
        },
      }, { endpoint: 'articles', params: { limit: '6' } }),

      b('sidebar', 'Sidebar Eventi', {
        widgets: [
          { id: 'events-1', type: 'events', title: 'Prossimi Eventi', props: {} },
          { id: 'weather-1', type: 'recent-posts', title: 'Meteo Locale', props: {} },
          { id: 'newsletter-1', type: 'newsletter', title: 'Newsletter', props: {} },
        ],
        position: 'right', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '35%', maxWidth: '35%', position: 'sticky',
        },
        background: { type: 'none', value: '' },
      }, { endpoint: 'events', params: { upcoming: 'true', limit: '5' } }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#0d6b59' },
      typography: { color: '#a8d8d1', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 8. Magazine Cultura
const magazineCultura: PageTemplate = {
  id: 'magazine-cultura',
  name: 'Magazine Cultura',
  description: 'Slideshow full-width, articolo in evidenza, 3 colonne con bio autori, sezione recensioni',
  category: 'editorial',
  previewColor: '#6c3483',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Cultura', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '40px', bottom: '16px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: { width: '0 0 2px 0', style: 'solid', color: '#6c3483' },
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('slideshow', 'Slideshow Cultura', {
      templateId: 'slideshow-editorial-hero',
      autoplay: true, interval: 6000, transition: 'fade', loop: true,
      showDots: true, showArrows: true, height: '520px',
      slides: [
        { id: '1', type: 'image', image: '', title: 'Arte Contemporanea', description: 'Le mostre da non perdere', link: '', overlay: { enabled: true, color: 'rgba(108,52,131,0.4)', position: 'bottom-left' }, buttons: [], textStyle: { titleSize: '40px', titleWeight: '700', descSize: '18px', color: '#ffffff' } },
        { id: '2', type: 'image', image: '', title: 'Letteratura', description: 'I libri della stagione', link: '', overlay: { enabled: true, color: 'rgba(0,0,0,0.35)', position: 'center' }, buttons: [], textStyle: { titleSize: '40px', titleWeight: '700', descSize: '18px', color: '#ffffff' } },
        { id: '3', type: 'image', image: '', title: 'Cinema', description: 'Uscite e recensioni', link: '', overlay: { enabled: true, color: 'rgba(0,0,0,0.4)', position: 'bottom-right' }, buttons: [], textStyle: { titleSize: '40px', titleWeight: '700', descSize: '18px', color: '#ffffff' } },
      ],
    }, {
      layout: {
        display: 'block',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
    }),

    b('article-featured', 'Articolo in Primo Piano', {
      sourceMode: 'automatic', autoSource: 'featured',
      layout: 'magazine', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'center',
        padding: { top: '48px', right: '60px', bottom: '48px', left: '60px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
      background: { type: 'color', value: '#faf7fc' },
    }, { endpoint: 'articles', params: { featured: 'true', category: 'cultura', limit: '1' } }),

    b('article-grid', 'Articoli con Autori', {
      sourceMode: 'automatic', autoSource: 'latest',
      category: 'cultura',
      columns: 3, limit: 6, showImage: true, showExcerpt: true, showCategory: true, showAuthor: true, showDate: true,
      cardStyle: 'author',
    }, {
      layout: {
        display: 'grid', gap: '28px',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }, { endpoint: 'articles', params: { category: 'cultura', limit: '6' } }),

    b('text', 'Sezione Recensioni', {
      content: '<h2>Recensioni</h2><p>Le nostre ultime recensioni di libri, film, mostre e spettacoli.</p>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '48px', bottom: '16px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
      typography: { fontSize: '16px', color: '#333333', fontFamily: 'Georgia, serif' },
      border: { width: '0 0 2px 0', style: 'solid', color: '#6c3483' },
    }),

    b('article-grid', 'Griglia Recensioni', {
      sourceMode: 'automatic', autoSource: 'latest',
      category: 'recensioni',
      columns: 4, limit: 4, showImage: true, showExcerpt: false, showCategory: true, showDate: true, showRating: true,
    }, {
      layout: {
        display: 'grid', gap: '20px',
        padding: { top: '16px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }, { endpoint: 'articles', params: { category: 'recensioni', limit: '4' } }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2d1342' },
      typography: { color: '#c9aee0', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 9. News Aggregator
const newsAggregator: PageTemplate = {
  id: 'news-aggregator',
  name: 'News Aggregator',
  description: 'Griglia multi-sorgente, navigazione a tab per categoria, sidebar sinistra con filtri fonte, trending topics',
  category: 'editorial',
  previewColor: '#2980b9',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Aggregator', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '32px', bottom: '12px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#2980b9' },
      typography: { color: '#ffffff' },
      shadow: '0 2px 8px rgba(41,128,185,0.4)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('search-bar', 'Barra di Ricerca', {
      placeholder: 'Cerca tra tutte le fonti...',
      showFilters: true,
      compact: false,
    }, {
      layout: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '900px',
      },
      background: { type: 'color', value: '#f0f6fb' },
    }),

    b('category-nav', 'Tab Categorie', {
      style: 'tabs', showCount: true, colorMode: 'category',
    }, {
      layout: {
        display: 'flex', gap: '0',
        padding: { top: '0', right: '32px', bottom: '0', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
        overflow: 'hidden',
      },
      background: { type: 'color', value: '#ffffff' },
      border: { width: '0 0 2px 0', style: 'solid', color: '#e0e0e0' },
    }, { endpoint: 'categories', params: {} }),

    b('columns', 'Aggregatore Layout', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'flex-start',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('sidebar', 'Filtri Fonti', {
        widgets: [
          { id: 'sources-1', type: 'categories', title: 'Fonti', props: { categories: [] } },
          { id: 'tags-1', type: 'tags', title: 'Argomenti', props: { tags: [] } },
          { id: 'date-1', type: 'archive', title: 'Per Data', props: {} },
        ],
        position: 'left', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '240px', maxWidth: '240px', position: 'sticky',
        },
        background: { type: 'color', value: '#fafafa' },
        border: { width: '0 1px 0 0', style: 'solid', color: '#eeeeee' },
      }),

      b('section', 'Feed Aggregato', {}, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '0',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('article-grid', 'Griglia Notizie', {
          sourceMode: 'automatic', autoSource: 'latest',
          columns: 3, limit: 12, showImage: true, showExcerpt: false, showCategory: true, showDate: true, showSource: true,
        }, {
          layout: {
            display: 'grid', gap: '16px',
            padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
        }, { endpoint: 'articles', params: { limit: '12' } }),

        b('trending-articles', 'Trending Topics', {
          limit: 8, showTrend: true, period: '24h',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', gap: '8px',
            padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
          background: { type: 'color', value: '#f0f6fb' },
        }, { endpoint: 'articles', params: { trending: 'true', limit: '8', period: '24h' } }),
      ]),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a3a4f' },
      typography: { color: '#8ab4cc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 10. Editoriale Longform
const editorialeLongform: PageTemplate = {
  id: 'editoriale-longform',
  name: 'Editoriale Longform',
  description: 'Navigazione minimale, hero full-width, testo wide centrato (max 720px), bio autore, articoli correlati',
  category: 'editorial',
  previewColor: '#34495e',
  blocks: [
    b('navigation', 'Navigazione Minimale', {
      mode: 'custom', menuKey: 'primary', logoText: '', templateId: 'minimal-centered', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '48px', bottom: '16px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      border: { width: '0 0 1px 0', style: 'solid', color: '#eeeeee' },
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('article-hero', 'Hero Longform', {
      templateId: 'article-hero-cover-story',
      sourceMode: 'automatic', autoSource: 'featured',
      overlayColor: '#000000', overlayOpacity: 0.6,
      contentAlign: 'center', showCategory: true, showAuthor: true, showDate: true, showExcerpt: false, height: '600px',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '80px', bottom: '80px', left: '80px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '600px', overflow: 'hidden',
      },
      background: { type: 'image', value: '' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

    b('text', 'Contenuto Longform', {
      content: '<h1>Titolo dell\'Articolo</h1><p class="lead">Questo è il testo introduttivo dell\'articolo longform. Un formato pensato per approfondimenti di qualità.</p><p>Il testo completo dell\'articolo si estende qui, con paragrafi ben spaziati e leggibili su desktop e mobile.</p>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '64px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '720px',
      },
      typography: { fontSize: '19px', lineHeight: '1.8', color: '#2c2c2c', fontFamily: 'Georgia, serif' },
    }),

    b('author-bio', 'Bio Autore', {
      showAvatar: true, showSocial: true, showBio: true,
      layout: 'horizontal',
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '20px',
        padding: { top: '40px', right: '24px', bottom: '40px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '720px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { width: '1px', style: 'solid', color: '#eeeeee', radius: '8px' },
    }),

    b('divider', 'Separatore', {
      style: 'line',
    }, {
      layout: {
        display: 'block',
        padding: { top: '8px', right: '0', bottom: '8px', left: '0' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '720px',
      },
      border: { width: '1px 0 0 0', style: 'solid', color: '#eeeeee' },
    }),

    b('related-content', 'Articoli Correlati', {
      limit: 3, layout: 'grid', showImage: true, showExcerpt: false,
      title: 'Potrebbe Interessarti',
    }, {
      layout: {
        display: 'grid', gap: '20px',
        padding: { top: '40px', right: '24px', bottom: '60px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '900px',
      },
    }, { endpoint: 'articles', params: { related: 'true', limit: '3' } }),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '40px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2c2c2c' },
      typography: { color: '#999999', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// BUSINESS CATEGORY
// ---------------------------------------------------------------------------

// 11. Corporate Homepage
const corporateHomepage: PageTemplate = {
  id: 'corporate-homepage',
  name: 'Corporate Homepage',
  description: 'Hero con CTA, 3 colonne servizi, carousel testimonianze, loghi partner, CTA finale, footer',
  category: 'business',
  previewColor: '#1e3799',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Corporate', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '48px', bottom: '16px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.06)',
    }, { endpoint: 'site-navigation', params: { menu: 'primary' } }),

    b('hero', 'Hero Corporate', {
      templateId: 'hero-editorial-impact',
      title: 'Soluzioni per il Tuo Business',
      subtitle: 'Offriamo servizi professionali per far crescere la tua azienda nel mercato globale.',
      ctaText: 'Scopri di più',
      ctaUrl: '/servizi',
      ctaStyle: 'primary',
      ctaSecondaryText: 'Contattaci',
      ctaSecondaryUrl: '/contatti',
      alignment: 'left',
      height: '80vh',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
        padding: { top: '100px', right: '80px', bottom: '100px', left: '80px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '560px',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #1e3799 0%, #0c2461 100%)' },
      typography: { color: '#ffffff' },
    }),

    b('text', 'Intro Servizi', {
      content: '<h2>I Nostri Servizi</h2><p>Forniamo soluzioni complete e personalizzate per rispondere alle esigenze di ogni tipo di azienda.</p>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '64px', right: '24px', bottom: '24px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      typography: { textAlign: 'center', fontSize: '18px', color: '#333333', lineHeight: '1.6' },
    }),

    b('columns', 'Tre Servizi', { columns: 3 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'stretch',
        padding: { top: '0', right: '60px', bottom: '64px', left: '60px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'Servizio 1', {
        content: '<h3>Consulenza Strategica</h3><p>Analizziamo il tuo mercato e definiamo una strategia vincente per il tuo business.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#f8faff' },
        border: { radius: '8px', width: '1px', style: 'solid', color: '#e8eef8' },
        typography: { textAlign: 'center', color: '#333333', lineHeight: '1.6' },
        shadow: '0 2px 12px rgba(0,0,0,0.06)',
      }),
      b('text', 'Servizio 2', {
        content: '<h3>Sviluppo Tecnologico</h3><p>Creiamo soluzioni digitali su misura per ottimizzare i tuoi processi aziendali.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#f8faff' },
        border: { radius: '8px', width: '1px', style: 'solid', color: '#e8eef8' },
        typography: { textAlign: 'center', color: '#333333', lineHeight: '1.6' },
        shadow: '0 2px 12px rgba(0,0,0,0.06)',
      }),
      b('text', 'Servizio 3', {
        content: '<h3>Marketing Digitale</h3><p>Gestiamo la tua presenza online per aumentare la visibilità e acquisire nuovi clienti.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#f8faff' },
        border: { radius: '8px', width: '1px', style: 'solid', color: '#e8eef8' },
        typography: { textAlign: 'center', color: '#333333', lineHeight: '1.6' },
        shadow: '0 2px 12px rgba(0,0,0,0.06)',
      }),
    ]),

    b('carousel', 'Testimonianze', {
      autoplay: true, interval: 5000, showDots: true, showArrows: false,
      items: [
        { id: '1', type: 'quote', content: '"Collaborare con questo team ha trasformato la nostra strategia digitale."', author: 'Marco Ferretti', role: 'CEO, TechCorp' },
        { id: '2', type: 'quote', content: '"Professionisti eccellenti, risultati concreti e misurabili."', author: 'Laura Marini', role: 'Direttore Marketing, AlphaGroup' },
        { id: '3', type: 'quote', content: '"Supporto puntuale e soluzioni innovative. Consigliato a tutti."', author: 'Davide Rossi', role: 'Founder, StartupX' },
      ],
    }, {
      layout: {
        display: 'block',
        padding: { top: '60px', right: '60px', bottom: '60px', left: '60px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
      background: { type: 'color', value: '#f0f4ff' },
      typography: { textAlign: 'center', color: '#333333', fontFamily: 'Georgia, serif', fontSize: '20px' },
    }),

    b('image-gallery', 'Loghi Partner', {
      layout: 'row', columns: 5, showCaption: false, lightbox: false,
      images: [],
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '32px', justifyContent: 'center', alignItems: 'center',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1100px',
      },
      background: { type: 'color', value: '#ffffff' },
    }),

    b('hero', 'CTA Finale', {
      title: 'Pronto a Iniziare?',
      subtitle: 'Contattaci oggi per una consulenza gratuita.',
      ctaText: 'Parla con noi',
      ctaUrl: '/contatti',
      ctaStyle: 'primary',
      alignment: 'center',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '300px',
      },
      background: { type: 'color', value: '#1e3799' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '56px', right: '48px', bottom: '32px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#0c1a3a' },
      typography: { color: '#8899cc', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 12. Portfolio Showcase
const portfolioShowcase: PageTemplate = {
  id: 'portfolio-showcase',
  name: 'Portfolio Showcase',
  description: 'Navigazione minimale, galleria grid di progetti, descrizioni, form di contatto',
  category: 'business',
  previewColor: '#2d3436',
  blocks: [
    b('navigation', 'Navigazione Minimale', {
      mode: 'custom', menuKey: 'primary', logoText: 'Portfolio', templateId: 'minimal-centered', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '20px', right: '48px', bottom: '20px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      border: { width: '0 0 1px 0', style: 'solid', color: '#f0f0f0' },
    }),

    b('hero', 'Intro Portfolio', {
      title: 'Il Mio Lavoro',
      subtitle: 'Designer & Developer — Creo esperienze digitali che lasciano il segno.',
      alignment: 'center',
      height: '50vh',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '380px',
      },
      background: { type: 'color', value: '#f8f8f8' },
      typography: { color: '#1a1a1a', textAlign: 'center' },
    }),

    b('image-gallery', 'Galleria Progetti', {
      layout: 'grid', columns: 3, showCaption: true, lightbox: true,
      images: [],
      gap: '16px',
    }, {
      layout: {
        display: 'grid', gap: '16px',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
      background: { type: 'none', value: '' },
    }),

    b('text', 'Descrizione Approccio', {
      content: '<h2>Il Mio Approccio</h2><p>Ogni progetto inizia con un\'analisi approfondita degli obiettivi. Combino creatività e metodologia per consegnare risultati di qualità.</p>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '24px', bottom: '24px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '720px',
      },
      typography: { textAlign: 'center', fontSize: '18px', color: '#333333', lineHeight: '1.7' },
    }),

    b('cms-form', 'Form Contatto', {
      title: 'Parliamo del tuo Progetto',
      description: 'Raccontami cosa hai in mente.',
      fields: [
        { id: 'name', type: 'text', label: 'Nome', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'project', type: 'select', label: 'Tipo di Progetto', options: ['Web Design', 'Brand Identity', 'UI/UX', 'Sviluppo'] },
        { id: 'message', type: 'textarea', label: 'Messaggio', required: true, rows: 5 },
      ],
      submitText: 'Invia Messaggio',
      successMessage: 'Grazie! Ti rispondo entro 24 ore.',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '20px',
        padding: { top: '48px', right: '48px', bottom: '64px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '700px',
      },
      background: { type: 'color', value: '#f8f8f8' },
      border: { radius: '12px' },
    }),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '48px', bottom: '24px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a1a' },
      typography: { color: '#888888', fontSize: '14px', textAlign: 'center' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 13. SaaS Landing
const saasLanding: PageTemplate = {
  id: 'saas-landing',
  name: 'SaaS Landing',
  description: 'Hero con demo CTA, griglia feature comparison, sezione prezzi 3 colonne, FAQ accordion, newsletter',
  category: 'business',
  previewColor: '#00b894',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'SaaS', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '48px', bottom: '14px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    b('hero', 'Hero SaaS', {
      title: 'Gestisci il tuo Business in Modo Intelligente',
      subtitle: 'La piattaforma all-in-one per team ad alta produttività. Prova gratis per 14 giorni.',
      ctaText: 'Inizia Gratis',
      ctaUrl: '/trial',
      ctaStyle: 'primary',
      ctaSecondaryText: 'Guarda la Demo',
      ctaSecondaryUrl: '/demo',
      alignment: 'center',
      height: '75vh',
      showTrustBadges: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '100px', right: '48px', bottom: '100px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '560px',
      },
      background: { type: 'gradient', value: 'linear-gradient(160deg, #00b894 0%, #00cec9 100%)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('comparison', 'Feature Comparison', {
      title: 'Perché scegliere noi',
      columns: ['Feature', 'Free', 'Pro', 'Enterprise'],
      rows: [
        { feature: 'Utenti', free: '1', pro: '10', enterprise: 'Illimitati' },
        { feature: 'Storage', free: '1 GB', pro: '100 GB', enterprise: 'Illimitato' },
        { feature: 'Supporto', free: 'Email', pro: 'Priorità', enterprise: 'Dedicato 24/7' },
        { feature: 'API Access', free: 'No', pro: 'Si', enterprise: 'Si' },
        { feature: 'Integrazioni', free: '3', pro: 'Tutte', enterprise: 'Custom' },
      ],
    }, {
      layout: {
        display: 'block',
        padding: { top: '64px', right: '48px', bottom: '64px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1000px',
      },
      background: { type: 'none', value: '' },
    }),

    b('text', 'Intro Prezzi', {
      content: '<h2>Piani e Prezzi</h2><p>Scegli il piano che si adatta alle tue esigenze. Nessuna carta di credito richiesta per iniziare.</p>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '24px', bottom: '16px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '700px',
      },
      typography: { textAlign: 'center', fontSize: '18px', color: '#333333', lineHeight: '1.6' },
    }),

    b('columns', 'Piani Prezzi', { columns: 3 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'stretch',
        padding: { top: '0', right: '48px', bottom: '64px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1100px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'Piano Free', {
        content: '<h3>Free</h3><p class="price">€0/mese</p><ul><li>1 utente</li><li>1 GB storage</li><li>3 integrazioni</li><li>Supporto via email</li></ul><a href="/signup">Inizia Gratis</a>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '40px', right: '28px', bottom: '40px', left: '28px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#f8f8f8' },
        border: { radius: '12px', width: '1px', style: 'solid', color: '#e0e0e0' },
        typography: { textAlign: 'center' },
      }),
      b('text', 'Piano Pro', {
        content: '<h3>Pro</h3><p class="price">€29/mese</p><ul><li>10 utenti</li><li>100 GB storage</li><li>Tutte le integrazioni</li><li>Supporto prioritario</li></ul><a href="/signup-pro">Inizia Pro</a>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '40px', right: '28px', bottom: '40px', left: '28px' },
          margin: { top: '-16px', right: '0', bottom: '-16px', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#00b894' },
        border: { radius: '12px' },
        typography: { textAlign: 'center', color: '#ffffff' },
        shadow: '0 8px 32px rgba(0,184,148,0.35)',
      }),
      b('text', 'Piano Enterprise', {
        content: '<h3>Enterprise</h3><p class="price">Contattaci</p><ul><li>Utenti illimitati</li><li>Storage illimitato</li><li>API custom</li><li>Supporto dedicato 24/7</li></ul><a href="/enterprise">Parla con noi</a>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '40px', right: '28px', bottom: '40px', left: '28px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#f8f8f8' },
        border: { radius: '12px', width: '1px', style: 'solid', color: '#e0e0e0' },
        typography: { textAlign: 'center' },
      }),
    ]),

    b('accordion', 'FAQ', {
      title: 'Domande Frequenti',
      items: [
        { id: '1', question: 'Posso cancellare in qualsiasi momento?', answer: 'Sì, puoi cancellare l\'abbonamento in qualsiasi momento senza penali.' },
        { id: '2', question: 'I dati sono sicuri?', answer: 'Utilizziamo crittografia end-to-end e backup automatici giornalieri.' },
        { id: '3', question: 'Supportate l\'integrazione con strumenti terzi?', answer: 'Sì, supportiamo oltre 200 integrazioni con i principali strumenti di produttività.' },
        { id: '4', question: 'È disponibile una versione mobile?', answer: 'Sì, le nostre app iOS e Android sono incluse in tutti i piani.' },
      ],
      style: 'bordered',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '0',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
    }),

    b('newsletter-signup', 'Newsletter', {
      mode: 'global',
      title: 'Resta Aggiornato',
      description: 'Ricevi tips e aggiornamenti sul prodotto direttamente nella tua email.',
      buttonText: 'Iscriviti',
      placeholder: 'La tua email aziendale',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '600px',
      },
      background: { type: 'color', value: '#e8faf7' },
      border: { radius: '12px' },
      typography: { textAlign: 'center' },
    }, { endpoint: 'site-newsletter', params: {} }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '56px', right: '48px', bottom: '32px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a2e2a' },
      typography: { color: '#7abcb0', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 14. E-commerce Vetrina
const ecommerceVetrina: PageTemplate = {
  id: 'ecommerce-vetrina',
  name: 'E-commerce Vetrina',
  description: 'Galleria prodotti grid, sidebar con filtri e categorie, banner in evidenza, newsletter',
  category: 'business',
  previewColor: '#e17055',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Shop', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }),

    b('banner-zone', 'Banner Promozionale', {
      sourceMode: 'manual', position: 'hero',
      templateId: 'banner-hero',
    }, {
      layout: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '340px',
      },
      background: { type: 'color', value: '#fff0ec' },
    }, { endpoint: 'banners', params: { position: 'hero' } }),

    b('columns', 'Shop Layout', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'flex-start',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('sidebar', 'Sidebar Filtri', {
        widgets: [
          { id: 'search-1', type: 'search', title: 'Cerca Prodotto', props: {} },
          { id: 'cat-1', type: 'categories', title: 'Categorie', props: { categories: [] } },
          { id: 'price-1', type: 'filter', title: 'Prezzo', props: { min: 0, max: 1000 } },
          { id: 'tags-1', type: 'tags', title: 'Tags', props: { tags: [] } },
        ],
        position: 'left', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '260px', maxWidth: '260px', position: 'sticky',
        },
        background: { type: 'color', value: '#fafafa' },
        border: { width: '0 1px 0 0', style: 'solid', color: '#eeeeee' },
      }, { endpoint: 'categories', params: {} }),

      b('article-grid', 'Griglia Prodotti', {
        sourceMode: 'automatic', autoSource: 'latest',
        columns: 3, limit: 12, showImage: true, showExcerpt: false, showCategory: true, showDate: false, cardStyle: 'product',
      }, {
        layout: {
          display: 'grid', gap: '20px',
          padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
      }, { endpoint: 'articles', params: { limit: '12', type: 'product' } }),
    ]),

    b('newsletter-signup', 'Newsletter Shop', {
      mode: 'global',
      title: 'Offerte Esclusive',
      description: 'Iscriviti e ricevi il 10% di sconto sul primo ordine.',
      buttonText: 'Iscriviti',
      placeholder: 'La tua email',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '600px',
      },
      background: { type: 'color', value: '#fff0ec' },
      border: { radius: '12px' },
      typography: { textAlign: 'center' },
    }, { endpoint: 'site-newsletter', params: {} }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2d1e1a' },
      typography: { color: '#c9a49c', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 15. Restaurant/Hotel
const restaurantHotel: PageTemplate = {
  id: 'restaurant-hotel',
  name: 'Restaurant/Hotel',
  description: 'Hero full-width, sezione menu/servizi, galleria immagini, mappa + contatti, form prenotazione',
  category: 'business',
  previewColor: '#b7950b',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Ristorante', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '48px', bottom: '16px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: 'rgba(0,0,0,0.85)' },
      typography: { color: '#f0d060' },
    }),

    b('hero', 'Hero Principale', {
      title: 'Un\'Esperienza Gastronomica Unica',
      subtitle: 'Cucina tradizionale con ingredienti freschi selezionati ogni giorno.',
      ctaText: 'Prenota un Tavolo',
      ctaUrl: '#prenotazione',
      ctaStyle: 'primary',
      alignment: 'center',
      height: '85vh',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '120px', right: '48px', bottom: '120px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '560px',
      },
      background: { type: 'image', value: '', overlay: 'rgba(0,0,0,0.5)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('text', 'Menu e Specialità', {
      content: '<h2>Il Nostro Menu</h2><p>Ogni piatto racconta una storia di tradizione e passione. Scopri le nostre specialità stagionali.</p>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '64px', right: '24px', bottom: '32px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '720px',
      },
      typography: { textAlign: 'center', fontSize: '18px', color: '#333333', fontFamily: 'Georgia, serif', lineHeight: '1.7' },
    }),

    b('columns', 'Categorie Menu', { columns: 3 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '24px',
        padding: { top: '0', right: '60px', bottom: '60px', left: '60px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1100px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'Antipasti', {
        content: '<h3>Antipasti</h3><p>Selezione di salumi locali, bruschette al pomodoro fresco, caprese con mozzarella di bufala.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#faf8f2' },
        border: { radius: '8px', width: '1px', style: 'solid', color: '#e8e0cc' },
        typography: { textAlign: 'center', color: '#444444', fontFamily: 'Georgia, serif', lineHeight: '1.7' },
      }),
      b('text', 'Primi Piatti', {
        content: '<h3>Primi Piatti</h3><p>Pasta fresca fatta in casa: tagliatelle al ragù, risotto ai funghi porcini, gnocchi al tartufo.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#faf8f2' },
        border: { radius: '8px', width: '1px', style: 'solid', color: '#e8e0cc' },
        typography: { textAlign: 'center', color: '#444444', fontFamily: 'Georgia, serif', lineHeight: '1.7' },
      }),
      b('text', 'Secondi e Dolci', {
        content: '<h3>Secondi e Dolci</h3><p>Bistecca fiorentina, pesce del giorno, e dolci tradizionali: tiramisù, panna cotta, cantucci.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#faf8f2' },
        border: { radius: '8px', width: '1px', style: 'solid', color: '#e8e0cc' },
        typography: { textAlign: 'center', color: '#444444', fontFamily: 'Georgia, serif', lineHeight: '1.7' },
      }),
    ]),

    b('image-gallery', 'Galleria Ristorante', {
      layout: 'masonry', columns: 4, showCaption: false, lightbox: true, images: [],
    }, {
      layout: {
        display: 'grid', gap: '12px',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
    }),

    b('columns', 'Mappa e Info', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'stretch',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('map', 'Mappa', {
        lat: 41.9028, lng: 12.4964, zoom: 15, mapType: 'roadmap', height: '400px', showMarker: true,
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '50%', maxWidth: '50%', overflow: 'hidden', minHeight: '400px',
        },
      }),
      b('text', 'Informazioni e Orari', {
        content: '<h3>Come Raggiungerci</h3><p><strong>Indirizzo:</strong> Via della Cucina 12, Roma</p><p><strong>Tel:</strong> +39 06 1234567</p><p><strong>Email:</strong> prenotazioni@ristorante.it</p><h3>Orari</h3><p>Lun-Ven: 12:00-15:00, 19:00-23:00</p><p>Sab-Dom: 12:00-23:00</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '50%', maxWidth: '50%',
        },
        background: { type: 'color', value: '#faf8f2' },
        typography: { fontSize: '16px', lineHeight: '1.8', color: '#333333', fontFamily: 'Georgia, serif' },
      }),
    ]),

    b('cms-form', 'Form Prenotazione', {
      title: 'Prenota un Tavolo',
      fields: [
        { id: 'name', type: 'text', label: 'Nome e Cognome', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'phone', type: 'tel', label: 'Telefono', required: true },
        { id: 'date', type: 'date', label: 'Data', required: true },
        { id: 'time', type: 'time', label: 'Ora', required: true },
        { id: 'guests', type: 'number', label: 'Numero Ospiti', required: true },
        { id: 'notes', type: 'textarea', label: 'Note Speciali', rows: 3 },
      ],
      submitText: 'Conferma Prenotazione',
      successMessage: 'Prenotazione inviata! Ti confermeremo a breve.',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '20px',
        padding: { top: '64px', right: '48px', bottom: '64px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '700px',
      },
      background: { type: 'color', value: '#faf8f2' },
      border: { radius: '12px', width: '1px', style: 'solid', color: '#e8e0cc' },
    }),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '40px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1510' },
      typography: { color: '#a09070', fontSize: '14px', textAlign: 'center' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 16. Studio Professionale
const studioProfessionale: PageTemplate = {
  id: 'studio-professionale',
  name: 'Studio Professionale',
  description: 'Hero elegante, sezione team, lista servizi, testimonianze, form contatto',
  category: 'business',
  previewColor: '#2c3e50',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Studio Legale', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '18px', right: '60px', bottom: '18px', left: '60px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      border: { width: '0 0 1px 0', style: 'solid', color: '#e0e0e0' },
    }),

    b('hero', 'Hero Studio', {
      title: 'Professionalità e Competenza al Vostro Servizio',
      subtitle: 'Trent\'anni di esperienza in diritto civile, commerciale e internazionale.',
      ctaText: 'Richiedi una Consulenza',
      ctaUrl: '#contatti',
      ctaStyle: 'primary',
      alignment: 'left',
      height: '60vh',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
        padding: { top: '100px', right: '120px', bottom: '100px', left: '80px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '480px',
      },
      background: { type: 'gradient', value: 'linear-gradient(120deg, #2c3e50 0%, #34495e 100%)' },
      typography: { color: '#ffffff' },
    }),

    b('columns', 'Team', { columns: 3 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '32px',
        padding: { top: '64px', right: '60px', bottom: '64px', left: '60px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1100px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'Avv. Marco Ferretti', {
        content: '<h3>Avv. Marco Ferretti</h3><p><em>Socio Fondatore</em></p><p>Specializzato in diritto commerciale e contrattualistica internazionale. 25 anni di esperienza.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '32px', right: '20px', bottom: '32px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#f8f9fa' },
        border: { radius: '8px' },
        typography: { textAlign: 'center', color: '#333333', lineHeight: '1.6' },
      }),
      b('text', 'Avv. Laura Bianchi', {
        content: '<h3>Avv. Laura Bianchi</h3><p><em>Socia</em></p><p>Esperta in diritto del lavoro e tutela dei consumatori. Docente universitaria dal 2010.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '32px', right: '20px', bottom: '32px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#f8f9fa' },
        border: { radius: '8px' },
        typography: { textAlign: 'center', color: '#333333', lineHeight: '1.6' },
      }),
      b('text', 'Dott. Andrea Greco', {
        content: '<h3>Dott. Andrea Greco</h3><p><em>Of Counsel</em></p><p>Consulente in diritto tributario e pianificazione fiscale per imprese nazionali e internazionali.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '32px', right: '20px', bottom: '32px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#f8f9fa' },
        border: { radius: '8px' },
        typography: { textAlign: 'center', color: '#333333', lineHeight: '1.6' },
      }),
    ]),

    b('text', 'Aree di Pratica', {
      content: '<h2>Aree di Pratica</h2>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '900px',
      },
      typography: { textAlign: 'center', fontSize: '28px', fontWeight: '600', color: '#2c3e50' },
    }),

    b('columns', 'Servizi', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '20px',
        padding: { top: '0', right: '60px', bottom: '64px', left: '60px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '900px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'Diritto Commerciale', {
        content: '<h4>Diritto Commerciale</h4><p>Contratti, M&A, joint venture, tutela della proprietà intellettuale e franchising.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        border: { width: '0 0 0 3px', style: 'solid', color: '#2c3e50', radius: '0 8px 8px 0' },
        background: { type: 'color', value: '#f8f9fa' },
        typography: { color: '#333333', lineHeight: '1.6' },
      }),
      b('text', 'Diritto del Lavoro', {
        content: '<h4>Diritto del Lavoro</h4><p>Contratti di lavoro, controversie, ristrutturazioni aziendali e welfare aziendale.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        border: { width: '0 0 0 3px', style: 'solid', color: '#2c3e50', radius: '0 8px 8px 0' },
        background: { type: 'color', value: '#f8f9fa' },
        typography: { color: '#333333', lineHeight: '1.6' },
      }),
      b('text', 'Diritto Tributario', {
        content: '<h4>Diritto Tributario</h4><p>Pianificazione fiscale, contenzioso tributario, operazioni straordinarie e restructuring.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        border: { width: '0 0 0 3px', style: 'solid', color: '#2c3e50', radius: '0 8px 8px 0' },
        background: { type: 'color', value: '#f8f9fa' },
        typography: { color: '#333333', lineHeight: '1.6' },
      }),
      b('text', 'Diritto Internazionale', {
        content: '<h4>Diritto Internazionale</h4><p>Investimenti esteri, arbitrati internazionali, compliance e regolamentazione transfrontaliera.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        border: { width: '0 0 0 3px', style: 'solid', color: '#2c3e50', radius: '0 8px 8px 0' },
        background: { type: 'color', value: '#f8f9fa' },
        typography: { color: '#333333', lineHeight: '1.6' },
      }),
    ]),

    b('quote', 'Testimonianza', {
      text: 'Lo studio ci ha assistito in una complessa operazione di M&A internazionale con professionalità e precisione eccezionali.',
      author: 'CEO, Multinazionale Italiana',
      style: 'large',
    }, {
      layout: {
        display: 'block',
        padding: { top: '56px', right: '80px', bottom: '56px', left: '80px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#f0f2f5' },
      typography: { textAlign: 'center', fontFamily: 'Georgia, serif', fontSize: '22px', lineHeight: '1.6', color: '#2c3e50' },
    }),

    b('cms-form', 'Form Contatto', {
      title: 'Richiedi una Consulenza',
      fields: [
        { id: 'name', type: 'text', label: 'Nome e Cognome', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'phone', type: 'tel', label: 'Telefono' },
        { id: 'area', type: 'select', label: 'Area di Interesse', options: ['Diritto Commerciale', 'Diritto del Lavoro', 'Diritto Tributario', 'Altro'] },
        { id: 'message', type: 'textarea', label: 'Descrivi la tua esigenza', required: true, rows: 5 },
      ],
      submitText: 'Invia Richiesta',
      successMessage: 'Grazie! Un nostro professionista vi contatterà entro 24 ore.',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '20px',
        padding: { top: '64px', right: '60px', bottom: '64px', left: '60px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { radius: '8px' },
    }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '56px', right: '60px', bottom: '32px', left: '60px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a2530' },
      typography: { color: '#8899aa', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 17. Evento/Conferenza
const eventoConferenza: PageTemplate = {
  id: 'evento-conferenza',
  name: 'Evento/Conferenza',
  description: 'Hero countdown, programma timeline, card speaker, mappa venue, form registrazione',
  category: 'business',
  previewColor: '#8e44ad',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Evento 2026', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '48px', bottom: '14px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: 'rgba(142,68,173,0.95)' },
      typography: { color: '#ffffff' },
    }),

    b('hero', 'Hero Evento', {
      title: 'Summit Digitale 2026',
      subtitle: '15-16 Maggio 2026 · Milano, MiCo Convention Centre',
      ctaText: 'Registrati Ora',
      ctaUrl: '#registrazione',
      ctaStyle: 'primary',
      ctaSecondaryText: 'Programma',
      ctaSecondaryUrl: '#programma',
      alignment: 'center',
      height: '70vh',
      showCountdown: true,
      countdownDate: '2026-05-15',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '100px', right: '48px', bottom: '100px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '520px',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #8e44ad 0%, #6c3483 50%, #4a235a 100%)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('counter', 'Statistiche Evento', {
      counters: [
        { id: '1', value: 2500, label: 'Partecipanti', suffix: '+' },
        { id: '2', value: 80, label: 'Speaker', suffix: '+' },
        { id: '3', value: 48, label: 'Ore di Contenuto', suffix: 'h' },
        { id: '4', value: 30, label: 'Workshop', suffix: '+' },
      ],
      animated: true,
      layout: 'row',
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', justifyContent: 'space-around', alignItems: 'center',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#f9f4fc' },
      typography: { textAlign: 'center', color: '#8e44ad' },
    }),

    b('timeline', 'Programma', {
      title: 'Programma',
      orientation: 'vertical',
      items: [
        { id: '1', date: '15 Maggio 09:00', title: 'Apertura e Benvenuto', description: 'Keynote inaugurale e introduzione al Summit.' },
        { id: '2', date: '15 Maggio 10:30', title: 'AI & Future of Work', description: 'Panel con i leader dell\'intelligenza artificiale.' },
        { id: '3', date: '15 Maggio 14:00', title: 'Workshop Interattivi', description: '12 workshop paralleli su temi chiave del digitale.' },
        { id: '4', date: '16 Maggio 09:30', title: 'Innovation Day', description: 'Presentazione startup e pitch competition.' },
        { id: '5', date: '16 Maggio 17:00', title: 'Cerimonia di Chiusura', description: 'Premi, networking e cocktail finale.' },
      ],
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '0',
        padding: { top: '64px', right: '48px', bottom: '64px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '900px',
      },
    }),

    b('columns', 'Speaker', { columns: 3 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '24px',
        padding: { top: '48px', right: '60px', bottom: '64px', left: '60px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1100px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'Speaker 1', {
        content: '<h4>Dr. Elena Romano</h4><p><em>Chief AI Officer, TechGiant</em></p><p>Pioniera dell\'intelligenza artificiale applicata al business.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#faf4fc' },
        border: { radius: '12px', width: '1px', style: 'solid', color: '#e8d4f0' },
        typography: { textAlign: 'center', lineHeight: '1.5' },
      }),
      b('text', 'Speaker 2', {
        content: '<h4>Marco Bianchi</h4><p><em>Founder, StartupHub Italia</em></p><p>Ha fondato 5 startup di successo nell\'ecosistema europeo.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#faf4fc' },
        border: { radius: '12px', width: '1px', style: 'solid', color: '#e8d4f0' },
        typography: { textAlign: 'center', lineHeight: '1.5' },
      }),
      b('text', 'Speaker 3', {
        content: '<h4>Prof. Sara Conti</h4><p><em>Università Bocconi</em></p><p>Ricercatrice in economia digitale e trasformazione dei mercati.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#faf4fc' },
        border: { radius: '12px', width: '1px', style: 'solid', color: '#e8d4f0' },
        typography: { textAlign: 'center', lineHeight: '1.5' },
      }),
    ]),

    b('map', 'Mappa Venue', {
      lat: 45.4785, lng: 9.1677, zoom: 14, mapType: 'roadmap', height: '360px', showMarker: true,
    }, {
      layout: {
        display: 'block',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden', minHeight: '360px',
      },
    }),

    b('cms-form', 'Registrazione', {
      title: 'Registrati all\'Evento',
      fields: [
        { id: 'name', type: 'text', label: 'Nome Completo', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'company', type: 'text', label: 'Azienda' },
        { id: 'role', type: 'text', label: 'Ruolo' },
        { id: 'ticket', type: 'select', label: 'Tipo Biglietto', options: ['Standard €199', 'VIP €399', 'Workshop Bundle €499'], required: true },
      ],
      submitText: 'Registrati',
      successMessage: 'Registrazione completata! Controlla la tua email per la conferma.',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '20px',
        padding: { top: '64px', right: '48px', bottom: '64px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '700px',
      },
      background: { type: 'color', value: '#f9f4fc' },
      border: { radius: '12px' },
    }),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '40px', right: '48px', bottom: '24px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2a1035' },
      typography: { color: '#b08ac8', fontSize: '14px', textAlign: 'center' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 18. Immobiliare
const immobiliare: PageTemplate = {
  id: 'immobiliare',
  name: 'Immobiliare',
  description: 'Hero con ricerca, griglia immobili, sidebar con filtri, sezione mappa, form contatto',
  category: 'business',
  previewColor: '#27ae60',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Immobiliare', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '40px', bottom: '14px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
    }),

    b('hero', 'Hero Ricerca', {
      title: 'Trova la Casa dei Tuoi Sogni',
      subtitle: 'Migliaia di proprietà in tutta Italia. Compra, vendi o affitta con noi.',
      ctaText: 'Cerca Immobili',
      ctaUrl: '#ricerca',
      ctaStyle: 'primary',
      alignment: 'center',
      height: '55vh',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '440px',
      },
      background: { type: 'image', value: '', overlay: 'rgba(0,0,0,0.45)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('search-bar', 'Ricerca Avanzata', {
      placeholder: 'Cerca per città, zona o indirizzo...',
      showFilters: true,
      filters: ['Tipo', 'Prezzo', 'Superficie', 'Locali'],
    }, {
      layout: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: { top: '24px', right: '40px', bottom: '24px', left: '40px' },
        margin: { top: '-40px', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1100px',
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 8px 32px rgba(0,0,0,0.12)',
      border: { radius: '12px' },
    }),

    b('columns', 'Immobili Layout', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'flex-start',
        padding: { top: '32px', right: '0', bottom: '32px', left: '0' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('sidebar', 'Filtri', {
        widgets: [
          { id: 'type-1', type: 'filter', title: 'Tipo di Immobile', props: { options: ['Appartamento', 'Villa', 'Ufficio', 'Negozio'] } },
          { id: 'price-1', type: 'filter', title: 'Prezzo', props: { min: 50000, max: 2000000 } },
          { id: 'size-1', type: 'filter', title: 'Superficie', props: { min: 20, max: 500, unit: 'mq' } },
          { id: 'rooms-1', type: 'filter', title: 'Locali', props: { options: ['1', '2', '3', '4', '5+'] } },
          { id: 'zone-1', type: 'categories', title: 'Zona', props: { categories: [] } },
        ],
        position: 'left', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '16px',
          padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '280px', maxWidth: '280px', position: 'sticky',
        },
        background: { type: 'color', value: '#fafafa' },
        border: { width: '0 1px 0 0', style: 'solid', color: '#eeeeee' },
      }),

      b('article-grid', 'Griglia Immobili', {
        sourceMode: 'automatic', autoSource: 'latest',
        columns: 3, limit: 9, showImage: true, showExcerpt: true, showCategory: true, showDate: false, cardStyle: 'property',
      }, {
        layout: {
          display: 'grid', gap: '20px',
          padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
      }, { endpoint: 'articles', params: { type: 'property', limit: '9' } }),
    ]),

    b('map', 'Mappa Immobili', {
      lat: 45.4654, lng: 9.1859, zoom: 12, mapType: 'roadmap', height: '480px', showMarker: true, showClusters: true,
    }, {
      layout: {
        display: 'block',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', overflow: 'hidden',
      },
    }),

    b('cms-form', 'Form Contatto Agenzia', {
      title: 'Contatta un Agente',
      fields: [
        { id: 'name', type: 'text', label: 'Nome', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'phone', type: 'tel', label: 'Telefono', required: true },
        { id: 'interest', type: 'select', label: 'Sei interessato a', options: ['Comprare', 'Vendere', 'Affittare', 'Valutazione gratuita'] },
        { id: 'message', type: 'textarea', label: 'Messaggio', rows: 4 },
      ],
      submitText: 'Invia Richiesta',
      successMessage: 'Grazie! Un nostro agente ti contatterà a breve.',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '20px',
        padding: { top: '64px', right: '40px', bottom: '64px', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '700px',
      },
      background: { type: 'color', value: '#f0faf4' },
      border: { radius: '12px' },
    }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '56px', right: '40px', bottom: '32px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a2e22' },
      typography: { color: '#7abcA0', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 19. Startup Pitch
const startupPitch: PageTemplate = {
  id: 'startup-pitch',
  name: 'Startup Pitch',
  description: 'Hero bold con video, sezioni problema/soluzione, contatori metriche, team, CTA investitori',
  category: 'business',
  previewColor: '#fd79a8',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Startup', templateId: 'minimal-centered', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '48px', bottom: '16px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: 'rgba(10,10,10,0.95)' },
      typography: { color: '#ffffff' },
    }),

    b('hero', 'Hero Startup', {
      title: 'Rivoluzionamo il Modo in cui il Mondo Lavora',
      subtitle: 'La piattaforma AI-first che riduce del 70% il tempo speso in attività ripetitive.',
      ctaText: 'Guarda il Video',
      ctaUrl: '#video',
      ctaStyle: 'primary',
      ctaSecondaryText: 'Richiedi Demo',
      ctaSecondaryUrl: '#demo',
      alignment: 'center',
      height: '90vh',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '120px', right: '60px', bottom: '120px', left: '60px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '600px',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #2d0a4e 100%)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('video', 'Demo Video', {
      url: '',
      autoplay: false, controls: true, loop: false, muted: false,
      poster: '',
      aspectRatio: '16:9',
    }, {
      layout: {
        display: 'block',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '960px', overflow: 'hidden',
      },
      border: { radius: '12px' },
      shadow: '0 24px 80px rgba(253,121,168,0.25)',
    }),

    b('columns', 'Problema e Soluzione', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'Il Problema', {
        content: '<h2>Il Problema</h2><p>Le aziende perdono in media 23 ore a settimana in attività manuali e ripetitive. Questo significa sprechi enormi di tempo, denaro e talento umano.</p><ul><li>Processi non automatizzati</li><li>Dati sparsi in sistemi non connessi</li><li>Report manuali e inefficienti</li></ul>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: { top: '80px', right: '60px', bottom: '80px', left: '60px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '50%', maxWidth: '50%',
        },
        background: { type: 'color', value: '#fff5f8' },
        typography: { color: '#333333', lineHeight: '1.7', fontSize: '17px' },
      }),
      b('text', 'La Soluzione', {
        content: '<h2>La Soluzione</h2><p>La nostra piattaforma AI connette tutti i tuoi strumenti, automatizza i processi ripetitivi e fornisce insights in tempo reale.</p><ul><li>Automazione intelligente end-to-end</li><li>Integrazione con 200+ strumenti</li><li>Analytics predittiva con AI</li></ul>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: { top: '80px', right: '60px', bottom: '80px', left: '60px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '50%', maxWidth: '50%',
        },
        background: { type: 'color', value: '#f5f0ff' },
        typography: { color: '#333333', lineHeight: '1.7', fontSize: '17px' },
      }),
    ]),

    b('counter', 'Metriche Chiave', {
      counters: [
        { id: '1', value: 70, label: 'Riduzione Attività Manuali', suffix: '%' },
        { id: '2', value: 340, label: 'Clienti Attivi', suffix: '+' },
        { id: '3', value: 2.4, label: 'Risparmio Medio Annuo', prefix: '€', suffix: 'M' },
        { id: '4', value: 98, label: 'Soddisfazione Clienti', suffix: '%' },
      ],
      animated: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', justifyContent: 'space-around',
        padding: { top: '64px', right: '48px', bottom: '64px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('columns', 'Team Fondatori', { columns: 3 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '24px',
        padding: { top: '64px', right: '60px', bottom: '64px', left: '60px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1000px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'CEO', {
        content: '<h4>Alessandro Ferrari</h4><p><em>CEO & Co-Founder</em></p><p>Ex Google, 10 anni in AI e machine learning. Forbes Under 30.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#fdf5f9' },
        border: { radius: '12px' },
        typography: { textAlign: 'center', lineHeight: '1.5' },
      }),
      b('text', 'CTO', {
        content: '<h4>Sofia Marchetti</h4><p><em>CTO & Co-Founder</em></p><p>Ex Amazon, PhD in Computer Science. 8 brevetti tecnologici registrati.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#fdf5f9' },
        border: { radius: '12px' },
        typography: { textAlign: 'center', lineHeight: '1.5' },
      }),
      b('text', 'COO', {
        content: '<h4>Lorenzo Ricci</h4><p><em>COO & Co-Founder</em></p><p>Ex McKinsey, MBA Bocconi. Ha scalato 3 startup da zero a exit.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'color', value: '#fdf5f9' },
        border: { radius: '12px' },
        typography: { textAlign: 'center', lineHeight: '1.5' },
      }),
    ]),

    b('hero', 'CTA Investitori', {
      title: 'Unisciti alla Prossima Grande Rivoluzione',
      subtitle: 'Siamo in fase di raccolta Series A. Contattaci per il pitch deck completo.',
      ctaText: 'Richiedi Pitch Deck',
      ctaUrl: '/investors',
      ctaStyle: 'primary',
      alignment: 'center',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '300px',
      },
      background: { type: 'color', value: '#0a0a0a' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '48px', bottom: '24px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#080808' },
      typography: { color: '#666666', fontSize: '13px', textAlign: 'center' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 20. Non-Profit
const nonProfit: PageTemplate = {
  id: 'non-profit',
  name: 'Non-Profit',
  description: 'Hero emozionale, testo missione, contatori impatto, galleria, CTA donazione, eventi, footer',
  category: 'business',
  previewColor: '#e74c3c',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Associazione', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '40px', bottom: '14px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 2px 4px rgba(0,0,0,0.08)',
    }),

    b('hero', 'Hero Emotivo', {
      title: 'Insieme, Possiamo Cambiare il Mondo',
      subtitle: 'Dal 2003 supportiamo comunità vulnerabili in 45 paesi. Ogni donazione salva una vita.',
      ctaText: 'Dona Ora',
      ctaUrl: '/dona',
      ctaStyle: 'primary',
      ctaSecondaryText: 'Scopri la Nostra Missione',
      ctaSecondaryUrl: '/missione',
      alignment: 'center',
      height: '80vh',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '120px', right: '60px', bottom: '120px', left: '60px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '580px',
      },
      background: { type: 'image', value: '', overlay: 'rgba(0,0,0,0.5)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('text', 'La Nostra Missione', {
      content: '<h2>La Nostra Missione</h2><p>Crediamo in un mondo dove ogni bambino ha accesso all\'istruzione, ogni famiglia ha cibo sicuro e ogni comunità ha gli strumenti per prosperare. Lavoriamo ogni giorno per trasformare questa visione in realtà.</p>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '64px', right: '24px', bottom: '48px', left: '24px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
      typography: { textAlign: 'center', fontSize: '19px', lineHeight: '1.8', color: '#333333', fontFamily: 'Georgia, serif' },
    }),

    b('counter', 'Impatto', {
      counters: [
        { id: '1', value: 2400000, label: 'Persone Aiutate', suffix: '+' },
        { id: '2', value: 45, label: 'Paesi', suffix: '' },
        { id: '3', value: 850, label: 'Progetti Completati', suffix: '+' },
        { id: '4', value: 23, label: 'Anni di Attività', suffix: '' },
      ],
      animated: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', justifyContent: 'space-around',
        padding: { top: '56px', right: '48px', bottom: '56px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#e74c3c' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('image-gallery', 'Galleria Progetti', {
      layout: 'masonry', columns: 3, showCaption: true, lightbox: true, images: [],
    }, {
      layout: {
        display: 'grid', gap: '8px',
        padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }),

    b('hero', 'CTA Donazione', {
      title: 'Aiutaci a Fare la Differenza',
      subtitle: 'Con soli €5 al mese puoi garantire istruzione a un bambino per un anno intero.',
      ctaText: 'Dona Ora',
      ctaUrl: '/dona',
      ctaStyle: 'primary',
      ctaSecondaryText: 'Diventa Volontario',
      ctaSecondaryUrl: '/volontariato',
      alignment: 'center',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '360px',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('event-list', 'Prossimi Eventi', {
      limit: 4, showDate: true, showLocation: true, showDescription: true, layout: 'list',
      title: 'Prossimi Eventi',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '16px',
        padding: { top: '64px', right: '48px', bottom: '64px', left: '48px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '900px',
      },
    }, { endpoint: 'events', params: { upcoming: 'true', limit: '4' } }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '56px', right: '40px', bottom: '32px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a0505' },
      typography: { color: '#cc8888', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// LAYOUT CATEGORY
// ---------------------------------------------------------------------------

// 21. Layout Sidebar Sinistra
const layoutSidebarSinistra: PageTemplate = {
  id: 'layout-sidebar-sinistra',
  name: 'Layout Sidebar Sinistra',
  description: 'Sidebar sinistra fissa (nav + categorie), area contenuto principale scrollabile a destra',
  category: 'generic',
  previewColor: '#3498db',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    b('columns', 'Layout Sidebar Sinistra', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'flex-start',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '80vh',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('sidebar', 'Sidebar Sinistra', {
        widgets: [
          { id: 'nav-1', type: 'categories', title: 'Navigazione', props: { categories: [] } },
          { id: 'cat-1', type: 'categories', title: 'Categorie', props: { categories: [] } },
          { id: 'tags-1', type: 'tags', title: 'Tag', props: { tags: [] } },
        ],
        position: 'left', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '24px',
          padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '260px', maxWidth: '260px', position: 'sticky', minHeight: '100vh',
        },
        background: { type: 'color', value: '#f5f6fa' },
        border: { width: '0 1px 0 0', style: 'solid', color: '#e0e0e0' },
      }, { endpoint: 'categories', params: {} }),

      b('section', 'Area Contenuto', {}, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '32px',
          padding: { top: '32px', right: '40px', bottom: '40px', left: '40px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('article-grid', 'Contenuto Principale', {
          sourceMode: 'automatic', autoSource: 'latest',
          columns: 2, limit: 8, showImage: true, showExcerpt: true, showCategory: true, showDate: true,
        }, {
          layout: {
            display: 'grid', gap: '24px',
            padding: { top: '0', right: '0', bottom: '0', left: '0' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
        }, { endpoint: 'articles', params: { limit: '8' } }),
      ]),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2c3e50' },
      typography: { color: '#95a5a6', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 22. Layout Sidebar Destra
const layoutSidebarDestra: PageTemplate = {
  id: 'layout-sidebar-destra',
  name: 'Layout Sidebar Destra',
  description: 'Contenuto principale a sinistra, sidebar destra con banner, categorie e newsletter',
  category: 'generic',
  previewColor: '#9b59b6',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    b('columns', 'Layout Sidebar Destra', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'flex-start',
        padding: { top: '32px', right: '32px', bottom: '40px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1300px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('section', 'Contenuto Principale', {}, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '28px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('article-hero', 'Articolo in Evidenza', {
          templateId: 'article-hero-cover-story',
          sourceMode: 'automatic', autoSource: 'featured',
          overlayColor: '#000000', overlayOpacity: 0.45,
          contentAlign: 'left', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true, height: '380px',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%', minHeight: '380px', overflow: 'hidden',
          },
          background: { type: 'image', value: '' },
          typography: { color: '#ffffff' },
          border: { radius: '8px' },
        }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

        b('article-grid', 'Griglia Articoli', {
          sourceMode: 'automatic', autoSource: 'latest',
          columns: 2, limit: 6, showImage: true, showExcerpt: true, showCategory: true, showDate: true,
        }, {
          layout: {
            display: 'grid', gap: '20px',
            padding: { top: '0', right: '0', bottom: '0', left: '0' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
        }, { endpoint: 'articles', params: { limit: '6' } }),
      ]),

      b('sidebar', 'Sidebar Destra', {
        widgets: [
          { id: 'banner-1', type: 'banner-ad', title: 'Pubblicità', props: {} },
          { id: 'cat-1', type: 'categories', title: 'Categorie', props: { categories: [] } },
          { id: 'newsletter-1', type: 'newsletter', title: 'Newsletter', props: {} },
          { id: 'tags-1', type: 'tags', title: 'Tag Popolari', props: { tags: [] } },
        ],
        position: 'right', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '300px', maxWidth: '300px', position: 'sticky',
        },
        background: { type: 'none', value: '' },
      }, { endpoint: 'categories', params: {} }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2c3e50' },
      typography: { color: '#95a5a6', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 23. Layout Double Sidebar
const layoutDoubleSidebar: PageTemplate = {
  id: 'layout-double-sidebar',
  name: 'Layout Double Sidebar',
  description: 'Sidebar sinistra (nav), contenuto centrale, sidebar destra (banner + trending) — holy grail a 3 colonne',
  category: 'generic',
  previewColor: '#16a085',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    b('columns', 'Tre Colonne', { columns: 3 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'flex-start',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('sidebar', 'Sidebar Sinistra', {
        widgets: [
          { id: 'nav-1', type: 'categories', title: 'Menu', props: { categories: [] } },
          { id: 'cat-1', type: 'categories', title: 'Categorie', props: { categories: [] } },
        ],
        position: 'left', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '220px', maxWidth: '220px', position: 'sticky', minHeight: '80vh',
        },
        background: { type: 'color', value: '#f5f6fa' },
        border: { width: '0 1px 0 0', style: 'solid', color: '#e0e0e0' },
      }, { endpoint: 'categories', params: {} }),

      b('section', 'Contenuto Centrale', {}, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '28px',
          padding: { top: '28px', right: '28px', bottom: '40px', left: '28px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('article-hero', 'Articolo in Evidenza', {
          templateId: 'article-hero-cover-story',
          sourceMode: 'automatic', autoSource: 'featured',
          overlayColor: '#000000', overlayOpacity: 0.45,
          contentAlign: 'left', showCategory: true, showDate: true, height: '340px',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%', minHeight: '340px', overflow: 'hidden',
          },
          background: { type: 'image', value: '' },
          typography: { color: '#ffffff' },
          border: { radius: '6px' },
        }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

        b('article-grid', 'Griglia Articoli', {
          sourceMode: 'automatic', autoSource: 'latest',
          columns: 2, limit: 6, showImage: true, showExcerpt: false, showCategory: true, showDate: true,
        }, {
          layout: {
            display: 'grid', gap: '16px',
            padding: { top: '0', right: '0', bottom: '0', left: '0' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
        }, { endpoint: 'articles', params: { limit: '6' } }),
      ]),

      b('sidebar', 'Sidebar Destra', {
        widgets: [
          { id: 'banner-1', type: 'banner-ad', title: 'Banner', props: {} },
          { id: 'trending-1', type: 'recent-posts', title: 'Di Tendenza', props: { posts: [] } },
          { id: 'newsletter-1', type: 'newsletter', title: 'Newsletter', props: {} },
        ],
        position: 'right', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '260px', maxWidth: '260px', position: 'sticky',
        },
        background: { type: 'color', value: '#f5f6fa' },
        border: { width: '0 0 0 1px', style: 'solid', color: '#e0e0e0' },
      }, { endpoint: 'articles', params: { trending: 'true', limit: '5' } }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a2e2a' },
      typography: { color: '#7abcb0', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 24. Layout Sidebar Top
const layoutSidebarTop: PageTemplate = {
  id: 'layout-sidebar-top',
  name: 'Layout Sidebar Top',
  description: 'Sidebar orizzontale superiore scrollabile con categorie e tag, contenuto principale sotto',
  category: 'generic',
  previewColor: '#f39c12',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    // Top horizontal sidebar
    b('section', 'Sidebar Superiore Orizzontale', {}, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '8px', overflow: 'hidden',
        padding: { top: '12px', right: '16px', bottom: '12px', left: '16px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { width: '0 0 1px 0', style: 'solid', color: '#e0e0e0' },
    }, undefined, [
      b('category-nav', 'Categorie Scrollabili', {
        style: 'pills', showCount: true, colorMode: 'category', scrollable: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '8px', overflow: 'hidden',
          padding: { top: '4px', right: '8px', bottom: '4px', left: '8px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
      }, { endpoint: 'categories', params: {} }),
    ]),

    b('section', 'Contenuto Principale', {}, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '28px',
        padding: { top: '32px', right: '40px', bottom: '40px', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('article-featured', 'Articolo in Primo Piano', {
        sourceMode: 'automatic', autoSource: 'featured',
        layout: 'horizontal', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'center',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%', minHeight: '280px',
        },
        border: { radius: '8px' },
        shadow: '0 4px 16px rgba(0,0,0,0.06)',
      }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

      b('article-grid', 'Griglia Articoli', {
        sourceMode: 'automatic', autoSource: 'latest',
        columns: 3, limit: 9, showImage: true, showExcerpt: false, showCategory: true, showDate: true,
      }, {
        layout: {
          display: 'grid', gap: '20px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
      }, { endpoint: 'articles', params: { limit: '9' } }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2d2010' },
      typography: { color: '#c8a870', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 25. Layout Sidebar Bottom
const layoutSidebarBottom: PageTemplate = {
  id: 'layout-sidebar-bottom',
  name: 'Layout Sidebar Bottom',
  description: 'Contenuto principale, poi barra orizzontale scrollabile in basso con contenuti correlati e trending',
  category: 'generic',
  previewColor: '#e74c3c',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    b('article-hero', 'Hero', {
      templateId: 'article-hero-cover-story',
      sourceMode: 'automatic', autoSource: 'featured',
      overlayColor: '#000000', overlayOpacity: 0.5,
      contentAlign: 'left', showCategory: true, showDate: true, height: '440px',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: { top: '40px', right: '48px', bottom: '40px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '440px', overflow: 'hidden',
      },
      background: { type: 'image', value: '' },
      typography: { color: '#ffffff' },
    }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

    b('article-grid', 'Griglia Principale', {
      sourceMode: 'automatic', autoSource: 'latest',
      columns: 3, limit: 9, showImage: true, showExcerpt: false, showCategory: true, showDate: true,
    }, {
      layout: {
        display: 'grid', gap: '20px',
        padding: { top: '32px', right: '40px', bottom: '32px', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1200px',
      },
    }, { endpoint: 'articles', params: { limit: '9' } }),

    // Bottom horizontal scrollable sidebar
    b('section', 'Sidebar Inferiore', {}, {
      layout: {
        display: 'flex', flexDirection: 'column',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#f0f0f0' },
      border: { width: '2px 0 0 0', style: 'solid', color: '#e74c3c' },
    }, undefined, [
      b('text', 'Titolo Sezione', {
        content: '<h3>Potrebbe Interessarti</h3>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '20px', right: '24px', bottom: '8px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        typography: { fontSize: '16px', fontWeight: '600', color: '#333333' },
      }),

      b('article-list', 'Articoli Correlati Orizzontali', {
        sourceMode: 'automatic', autoSource: 'trending',
        limit: 8, orientation: 'horizontal',
        showImage: true, showCategory: true, showDate: false, scrollable: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '16px', overflow: 'hidden',
          padding: { top: '8px', right: '24px', bottom: '20px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
      }, { endpoint: 'articles', params: { trending: 'true', limit: '8' } }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a0a0a' },
      typography: { color: '#cc8888', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 26. Layout L-Shape
const layoutLShape: PageTemplate = {
  id: 'layout-l-shape',
  name: 'Layout L-Shape',
  description: 'Top bar full-width + sidebar sinistra formano una L, contenuto nell\'area rimanente',
  category: 'generic',
  previewColor: '#8e44ad',
  blocks: [
    // Outer wrapper: flex-col
    b('section', 'Wrapper Esterno', {}, {
      layout: {
        display: 'flex', flexDirection: 'column',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '100vh',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      // Top bar (the horizontal part of the L)
      b('section', 'Top Bar', {}, {
        layout: {
          display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('navigation', 'Navigazione', {
          mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic', sticky: true,
        }, {
          layout: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
          },
          background: { type: 'color', value: '#6c3483' },
          typography: { color: '#ffffff' },
          shadow: '0 2px 8px rgba(108,52,131,0.3)',
        }),
      ]),

      // Row below: sidebar + content
      b('columns', 'Riga Sidebar + Contenuto', { columns: 2 }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'flex-start',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('sidebar', 'Sidebar L', {
          widgets: [
            { id: 'nav-1', type: 'categories', title: 'Menu Sezioni', props: { categories: [] } },
            { id: 'cat-1', type: 'categories', title: 'Categorie', props: { categories: [] } },
            { id: 'tags-1', type: 'tags', title: 'Tag', props: { tags: [] } },
          ],
          position: 'left', sticky: true,
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', gap: '20px',
            padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '240px', maxWidth: '240px', position: 'sticky', minHeight: '80vh',
          },
          background: { type: 'color', value: '#faf5fc' },
          border: { width: '0 1px 0 0', style: 'solid', color: '#e8d4f0' },
        }, { endpoint: 'categories', params: {} }),

        b('section', 'Area Contenuto Principale', {}, {
          layout: {
            display: 'flex', flexDirection: 'column', gap: '28px',
            padding: { top: '28px', right: '36px', bottom: '40px', left: '36px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
          background: { type: 'none', value: '' },
        }, undefined, [
          b('article-grid', 'Contenuto', {
            sourceMode: 'automatic', autoSource: 'latest',
            columns: 3, limit: 9, showImage: true, showExcerpt: false, showCategory: true, showDate: true,
          }, {
            layout: {
              display: 'grid', gap: '20px',
              padding: { top: '0', right: '0', bottom: '0', left: '0' },
              margin: { top: '0', right: '0', bottom: '0', left: '0' },
              width: '100%', maxWidth: '100%',
            },
          }, { endpoint: 'articles', params: { limit: '9' } }),
        ]),
      ]),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1e0a2e' },
      typography: { color: '#b08ac8', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 27. Layout Holy Grail
const layoutHolyGrail: PageTemplate = {
  id: 'layout-holy-grail',
  name: 'Layout Holy Grail',
  description: 'Header, 3 colonne (sidebar-sinistra, main, sidebar-destra), footer — il classico layout Holy Grail',
  category: 'generic',
  previewColor: '#e67e22',
  blocks: [
    b('navigation', 'Header / Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Holy Grail', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#e67e22' },
      typography: { color: '#ffffff' },
    }),

    b('columns', 'Holy Grail Tre Colonne', { columns: 3 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'stretch',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: 'calc(100vh - 200px)',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('sidebar', 'Nav Sinistra', {
        widgets: [
          { id: 'nav-1', type: 'categories', title: 'Navigazione', props: { categories: [] } },
          { id: 'search-1', type: 'search', title: 'Cerca', props: {} },
        ],
        position: 'left', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '200px', maxWidth: '200px', position: 'sticky',
        },
        background: { type: 'color', value: '#fef9f4' },
        border: { width: '0 1px 0 0', style: 'solid', color: '#f5ddc0' },
      }),

      b('section', 'Contenuto Main', {}, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '28px',
          padding: { top: '28px', right: '32px', bottom: '40px', left: '32px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('article-hero', 'Hero', {
          templateId: 'article-hero-cover-story',
          sourceMode: 'automatic', autoSource: 'featured',
          overlayColor: '#000000', overlayOpacity: 0.45,
          contentAlign: 'left', showCategory: true, showDate: true, height: '320px',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%', minHeight: '320px', overflow: 'hidden',
          },
          background: { type: 'image', value: '' },
          typography: { color: '#ffffff' },
          border: { radius: '6px' },
        }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

        b('article-grid', 'Articoli', {
          sourceMode: 'automatic', autoSource: 'latest',
          columns: 2, limit: 6, showImage: true, showExcerpt: false, showCategory: true, showDate: true,
        }, {
          layout: {
            display: 'grid', gap: '16px',
            padding: { top: '0', right: '0', bottom: '0', left: '0' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
        }, { endpoint: 'articles', params: { limit: '6' } }),
      ]),

      b('sidebar', 'Sidebar Destra', {
        widgets: [
          { id: 'banner-1', type: 'banner-ad', title: 'Pubblicità', props: {} },
          { id: 'trending-1', type: 'recent-posts', title: 'Trending', props: { posts: [] } },
          { id: 'newsletter-1', type: 'newsletter', title: 'Newsletter', props: {} },
        ],
        position: 'right', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '20px',
          padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '240px', maxWidth: '240px', position: 'sticky',
        },
        background: { type: 'color', value: '#fef9f4' },
        border: { width: '0 0 0 1px', style: 'solid', color: '#f5ddc0' },
      }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '40px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a0e00' },
      typography: { color: '#c8a870', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 28. Layout Magazine Grid
const layoutMagazineGrid: PageTemplate = {
  id: 'layout-magazine-grid',
  name: 'Layout Magazine Grid',
  description: 'Nessuna sidebar, griglia pura stile magazine con articoli di dimensioni miste (hero 2x2, normali 1x1)',
  category: 'generic',
  previewColor: '#2d3436',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Magazine', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '40px', bottom: '16px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: '#1a1a1a' },
      typography: { color: '#ffffff' },
    }),

    b('category-nav', 'Categorie', {
      style: 'underline', showCount: false, colorMode: 'category',
    }, {
      layout: {
        display: 'flex', gap: '0',
        padding: { top: '0', right: '40px', bottom: '0', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
        overflow: 'hidden',
      },
      background: { type: 'color', value: '#ffffff' },
      border: { width: '0 0 2px 0', style: 'solid', color: '#1a1a1a' },
    }, { endpoint: 'categories', params: {} }),

    b('article-featured', 'Hero Grande', {
      sourceMode: 'automatic', autoSource: 'featured',
      layout: 'full-width', showCategory: true, showAuthor: true, showDate: true, showExcerpt: true,
    }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'stretch',
        padding: { top: '24px', right: '40px', bottom: '0', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px', minHeight: '480px',
      },
    }, { endpoint: 'articles', params: { featured: 'true', limit: '1' } }),

    b('article-grid', 'Griglia 4 Colonne', {
      sourceMode: 'automatic', autoSource: 'latest',
      columns: 4, limit: 8, showImage: true, showExcerpt: false, showCategory: true, showDate: true,
    }, {
      layout: {
        display: 'grid', gap: '16px',
        padding: { top: '24px', right: '40px', bottom: '16px', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
      },
    }, { endpoint: 'articles', params: { limit: '8', offset: '1' } }),

    b('banner-zone', 'Banner Mid-Page', {
      sourceMode: 'rotation', position: 'leaderboard', maxVisible: 1,
    }, {
      layout: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '100%', minHeight: '90px',
      },
      background: { type: 'color', value: '#f0f0f0' },
    }, { endpoint: 'banners', params: { position: 'leaderboard' } }),

    b('article-grid', 'Seconda Griglia', {
      sourceMode: 'automatic', autoSource: 'latest',
      columns: 3, limit: 6, showImage: true, showExcerpt: true, showCategory: true, showDate: true,
    }, {
      layout: {
        display: 'grid', gap: '20px',
        padding: { top: '16px', right: '40px', bottom: '40px', left: '40px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1280px',
      },
    }, { endpoint: 'articles', params: { limit: '6', offset: '9' } }),

    b('footer', 'Footer', { mode: 'global', variant: 'columns' }, {
      layout: {
        display: 'block',
        padding: { top: '48px', right: '40px', bottom: '32px', left: '40px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a1a' },
      typography: { color: '#888888', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 29. Layout Dashboard
const layoutDashboard: PageTemplate = {
  id: 'layout-dashboard',
  name: 'Layout Dashboard',
  description: 'Sidebar navigazione sinistra, toolbar superiore, area principale con griglia di card/widget',
  category: 'generic',
  previewColor: '#2c3e50',
  blocks: [
    b('section', 'App Shell', {}, {
      layout: {
        display: 'flex', flexDirection: 'column',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '100vh',
      },
      background: { type: 'color', value: '#f4f6f9' },
    }, undefined, [
      // Top toolbar
      b('navigation', 'Top Toolbar', {
        mode: 'custom', menuKey: 'dashboard', logoText: 'Dashboard', templateId: 'minimal-centered',
      }, {
        layout: {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
        },
        background: { type: 'color', value: '#2c3e50' },
        typography: { color: '#ffffff' },
        shadow: '0 2px 8px rgba(0,0,0,0.2)',
      }),

      b('columns', 'Dashboard Body', { columns: 2 }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'flex-start',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        // Left nav sidebar
        b('sidebar', 'Nav Sidebar', {
          widgets: [
            { id: 'nav-1', type: 'categories', title: 'Menu Principale', props: { categories: [] } },
            { id: 'nav-2', type: 'categories', title: 'Impostazioni', props: { categories: [] } },
          ],
          position: 'left', sticky: true,
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', gap: '8px',
            padding: { top: '20px', right: '0', bottom: '20px', left: '0' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '220px', maxWidth: '220px', minHeight: 'calc(100vh - 54px)', position: 'sticky',
          },
          background: { type: 'color', value: '#34495e' },
          typography: { color: '#ecf0f1' },
        }),

        // Main dashboard area
        b('section', 'Area Dashboard', {}, {
          layout: {
            display: 'flex', flexDirection: 'column', gap: '24px',
            padding: { top: '28px', right: '28px', bottom: '40px', left: '28px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
          background: { type: 'none', value: '' },
        }, undefined, [
          b('counter', 'KPI Principali', {
            counters: [
              { id: '1', value: 1284, label: 'Visitatori Oggi', suffix: '' },
              { id: '2', value: 47, label: 'Articoli Pubblicati', suffix: '' },
              { id: '3', value: 92, label: 'Commenti', suffix: '' },
              { id: '4', value: 12400, label: 'Sessioni Mensili', suffix: '' },
            ],
            animated: true, layout: 'row',
          }, {
            layout: {
              display: 'flex', flexDirection: 'row', gap: '16px',
              padding: { top: '0', right: '0', bottom: '0', left: '0' },
              margin: { top: '0', right: '0', bottom: '0', left: '0' },
              width: '100%', maxWidth: '100%',
            },
          }),

          b('article-grid', 'Ultimi Contenuti', {
            sourceMode: 'automatic', autoSource: 'latest',
            columns: 3, limit: 6, showImage: false, showExcerpt: false, showCategory: true, showDate: true, showAuthor: true,
            cardStyle: 'compact',
          }, {
            layout: {
              display: 'grid', gap: '16px',
              padding: { top: '0', right: '0', bottom: '0', left: '0' },
              margin: { top: '0', right: '0', bottom: '0', left: '0' },
              width: '100%', maxWidth: '100%',
            },
            background: { type: 'color', value: '#ffffff' },
            border: { radius: '8px' },
            shadow: '0 2px 8px rgba(0,0,0,0.06)',
          }, { endpoint: 'articles', params: { limit: '6' } }),
        ]),
      ]),
    ]),
  ],
};

// 30. Layout Fullscreen Sections
const layoutFullscreenSections: PageTemplate = {
  id: 'layout-fullscreen-sections',
  name: 'Layout Fullscreen Sections',
  description: 'Sezioni a piena altezza viewport, una sotto l\'altra, ognuna con sfondo diverso',
  category: 'generic',
  previewColor: '#6c5ce7',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Brand', templateId: 'top-classic', sticky: true,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '16px', right: '48px', bottom: '16px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', position: 'sticky', zIndex: 1000,
      },
      background: { type: 'color', value: 'transparent' },
      typography: { color: '#ffffff' },
    }),

    b('hero', 'Sezione 1 — Hero', {
      title: 'La Prima Sezione',
      subtitle: 'Ogni sezione occupa l\'intera altezza dello schermo.',
      ctaText: 'Scopri di più',
      ctaUrl: '#sezione-2',
      ctaStyle: 'primary',
      alignment: 'center',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '100vh',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('section', 'Sezione 2 — Contenuto', {}, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '60px', bottom: '80px', left: '60px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '100vh',
      },
      background: { type: 'color', value: '#f8f9fa' },
    }, undefined, [
      b('text', 'Contenuto Sezione 2', {
        content: '<h2>La Nostra Storia</h2><p>Una sezione dedicata al racconto della vostra azienda, dei vostri valori e della visione che vi guida ogni giorno.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '24px', bottom: '40px', left: '24px' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '800px',
        },
        typography: { textAlign: 'center', fontSize: '20px', lineHeight: '1.8', color: '#333333' },
      }),

      b('image-gallery', 'Immagini', {
        layout: 'row', columns: 3, showCaption: false, lightbox: true, images: [],
      }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '16px', justifyContent: 'center',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '900px',
        },
      }),
    ]),

    b('section', 'Sezione 3 — Servizi', {}, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '60px', bottom: '80px', left: '60px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '100vh',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)' },
      typography: { color: '#ffffff' },
    }, undefined, [
      b('text', 'Titolo Servizi', {
        content: '<h2>I Nostri Servizi</h2><p>Offriamo soluzioni complete per accompagnare la tua crescita.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '24px', bottom: '40px', left: '24px' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '700px',
        },
        typography: { textAlign: 'center', color: '#ffffff', fontSize: '20px', lineHeight: '1.7' },
      }),

      b('columns', 'Cards Servizi', { columns: 3 }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '24px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '1000px',
        },
        background: { type: 'none', value: '' },
      }, undefined, [
        b('text', 'Servizio A', {
          content: '<h3>Strategia</h3><p>Definiamo il percorso migliore per raggiungere i tuoi obiettivi di business.</p>',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
          background: { type: 'color', value: 'rgba(255,255,255,0.08)' },
          border: { radius: '12px', width: '1px', style: 'solid', color: 'rgba(255,255,255,0.15)' },
          typography: { textAlign: 'center', color: '#ffffff', lineHeight: '1.6' },
        }),
        b('text', 'Servizio B', {
          content: '<h3>Tecnologia</h3><p>Implementiamo soluzioni tecnologiche innovative su misura per la tua realtà.</p>',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
          background: { type: 'color', value: 'rgba(255,255,255,0.08)' },
          border: { radius: '12px', width: '1px', style: 'solid', color: 'rgba(255,255,255,0.15)' },
          typography: { textAlign: 'center', color: '#ffffff', lineHeight: '1.6' },
        }),
        b('text', 'Servizio C', {
          content: '<h3>Marketing</h3><p>Aumentiamo la tua visibilità e generiamo lead qualificati per il tuo business.</p>',
        }, {
          layout: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            width: '100%', maxWidth: '100%',
          },
          background: { type: 'color', value: 'rgba(255,255,255,0.08)' },
          border: { radius: '12px', width: '1px', style: 'solid', color: 'rgba(255,255,255,0.15)' },
          typography: { textAlign: 'center', color: '#ffffff', lineHeight: '1.6' },
        }),
      ]),
    ]),

    b('section', 'Sezione 4 — CTA Finale', {}, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '100vh',
      },
      background: { type: 'color', value: '#fdfdfd' },
    }, undefined, [
      b('text', 'CTA Finale', {
        content: '<h2>Pronti a Iniziare?</h2><p>Contattaci oggi per una consulenza gratuita e scopri come possiamo aiutarti.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '24px', bottom: '32px', left: '24px' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '700px',
        },
        typography: { textAlign: 'center', fontSize: '20px', lineHeight: '1.7', color: '#333333' },
      }),

      b('cms-form', 'Form Contatto Rapido', {
        title: '',
        fields: [
          { id: 'name', type: 'text', label: 'Nome', required: true },
          { id: 'email', type: 'email', label: 'Email', required: true },
          { id: 'message', type: 'textarea', label: 'Messaggio', rows: 4 },
        ],
        submitText: 'Invia',
        successMessage: 'Grazie! Ti risponderemo presto.',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '16px',
          padding: { top: '0', right: '24px', bottom: '0', left: '24px' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '600px',
        },
      }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '48px', bottom: '24px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a2e' },
      typography: { color: '#9090c0', fontSize: '14px', textAlign: 'center' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// ---------------------------------------------------------------------------
// GENERIC/UTILITY TEMPLATES
// ---------------------------------------------------------------------------

// 31. Pagina 404 Custom
const pagina404: PageTemplate = {
  id: 'pagina-404',
  name: 'Pagina 404 Custom',
  description: 'Messaggio di errore centrato, barra di ricerca, link alle pagine più visitate',
  category: 'generic',
  previewColor: '#e74c3c',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic', sticky: false,
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    b('section', 'Contenuto 404', {}, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '24px',
        padding: { top: '80px', right: '48px', bottom: '80px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '70vh',
      },
      background: { type: 'color', value: '#ffffff' },
    }, undefined, [
      b('text', 'Messaggio 404', {
        content: '<h1 style="font-size:120px;line-height:1;color:#e74c3c;font-weight:900;margin:0">404</h1><h2 style="font-size:28px;color:#333;margin-top:16px">Pagina non trovata</h2><p style="font-size:18px;color:#666;max-width:500px;text-align:center;">Siamo spiacenti, la pagina che stai cercando non esiste o è stata spostata.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '600px',
        },
        typography: { textAlign: 'center' },
      }),

      b('search-bar', 'Ricerca', {
        placeholder: 'Cerca nel sito...',
        showFilters: false,
        autoFocus: true,
      }, {
        layout: {
          display: 'flex', alignItems: 'center',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '500px',
        },
        border: { radius: '32px', width: '2px', style: 'solid', color: '#e74c3c' },
        shadow: '0 4px 16px rgba(231,76,60,0.15)',
      }),

      b('trending-articles', 'Pagine Popolari', {
        limit: 5, showTrend: false, title: 'Pagine Popolari',
        layout: 'list',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '8px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '500px',
        },
        background: { type: 'color', value: '#f8f9fa' },
        border: { radius: '8px' },
      }, { endpoint: 'articles', params: { popular: 'true', limit: '5' } }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a1a1a' },
      typography: { color: '#888888', fontSize: '14px', textAlign: 'center' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 32. Pagina Manutenzione
const paginaManutenzione: PageTemplate = {
  id: 'pagina-manutenzione',
  name: 'Pagina Manutenzione',
  description: 'Messaggio centrato con countdown, link social, torna presto',
  category: 'generic',
  previewColor: '#f39c12',
  blocks: [
    b('section', 'Pagina Manutenzione', {}, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '32px',
        padding: { top: '0', right: '48px', bottom: '0', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '100vh',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' },
    }, undefined, [
      b('text', 'Logo / Nome Sito', {
        content: '<h1 style="font-size:48px;font-weight:900;color:#ffffff;letter-spacing:-1px">Il Tuo Sito</h1>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '600px',
        },
        typography: { textAlign: 'center' },
      }),

      b('text', 'Messaggio Manutenzione', {
        content: '<h2 style="color:#ffffff;font-size:28px">Stiamo lavorando per te</h2><p style="color:rgba(255,255,255,0.9);font-size:18px;line-height:1.6">Il sito è temporaneamente in manutenzione per migliorare la tua esperienza. Torneremo presto!</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '600px',
        },
        typography: { textAlign: 'center' },
      }),

      b('counter', 'Countdown', {
        counters: [
          { id: '1', value: 2, label: 'Giorni', suffix: '' },
          { id: '2', value: 14, label: 'Ore', suffix: '' },
          { id: '3', value: 30, label: 'Minuti', suffix: '' },
          { id: '4', value: 0, label: 'Secondi', suffix: '' },
        ],
        animated: false, layout: 'row', isCountdown: true,
        targetDate: '2026-04-01T12:00:00',
      }, {
        layout: {
          display: 'flex', flexDirection: 'row', gap: '24px', justifyContent: 'center',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '500px',
        },
        typography: { color: '#ffffff', textAlign: 'center' },
      }),

      b('social', 'Social Links', {
        mode: 'links', templateId: 'social-editorial-row',
        style: 'circle', size: 'medium', colorMode: 'white', alignment: 'center', showLabels: false,
        platforms: [
          { id: 'fb', platform: 'facebook', label: 'Facebook', handle: '', url: '#', enabled: true },
          { id: 'ig', platform: 'instagram', label: 'Instagram', handle: '', url: '#', enabled: true },
          { id: 'tw', platform: 'x', label: 'X', handle: '', url: '#', enabled: true },
        ],
      }, {
        layout: {
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '300px',
        },
      }),
    ]),
  ],
};

// 33. Pagina Privacy/Legal
const paginaPrivacy: PageTemplate = {
  id: 'pagina-privacy',
  name: 'Pagina Privacy/Legal',
  description: 'Navigazione, contenuto longform con tabella dei contenuti in sidebar, footer',
  category: 'generic',
  previewColor: '#7f8c8d',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic',
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '12px', right: '32px', bottom: '12px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    b('text', 'Header Pagina', {
      content: '<h1>Privacy Policy</h1><p>Ultimo aggiornamento: Marzo 2026</p>',
    }, {
      layout: {
        display: 'block',
        padding: { top: '40px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1100px',
      },
      background: { type: 'color', value: '#f8f9fa' },
      border: { width: '0 0 1px 0', style: 'solid', color: '#e0e0e0' },
      typography: { fontSize: '14px', color: '#666666', lineHeight: '1.5' },
    }),

    b('columns', 'Layout Privacy', { columns: 2 }, {
      layout: {
        display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'flex-start',
        padding: { top: '40px', right: '32px', bottom: '60px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '1100px',
      },
      background: { type: 'none', value: '' },
    }, undefined, [
      b('text', 'Contenuto Privacy', {
        content: '<h2>1. Titolare del Trattamento</h2><p>Il titolare del trattamento dei dati personali è [Nome Azienda], con sede legale in [indirizzo].</p><h2>2. Tipologie di Dati Raccolti</h2><p>Il presente sito raccoglie dati personali forniti volontariamente dall\'utente (nome, email, telefono) e dati di navigazione raccolti automaticamente (indirizzo IP, cookie tecnici).</p><h2>3. Finalità del Trattamento</h2><p>I dati vengono trattati per: erogazione dei servizi richiesti, adempimenti di legge, invio di comunicazioni commerciali (previo consenso), analisi statistiche aggregate e anonime.</p><h2>4. Base Giuridica</h2><p>Il trattamento si basa sul consenso dell\'interessato, sull\'esecuzione di un contratto, su obblighi di legge, o sul legittimo interesse del titolare.</p><h2>5. Conservazione dei Dati</h2><p>I dati sono conservati per il tempo strettamente necessario agli scopi per i quali sono stati raccolti, salvo diversi obblighi di legge.</p><h2>6. Diritti dell\'Interessato</h2><p>L\'utente ha il diritto di accedere, rettificare, cancellare, limitare il trattamento, opporsi e portare i propri dati. Per esercitare questi diritti contattare privacy@example.com.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '100%', maxWidth: '100%',
        },
        typography: { fontSize: '16px', lineHeight: '1.85', color: '#333333' },
      }),

      b('sidebar', 'Tabella Contenuti', {
        widgets: [
          { id: 'toc-1', type: 'categories', title: 'In questa pagina', props: {
            categories: [
              { name: '1. Titolare del Trattamento', slug: '#1' },
              { name: '2. Dati Raccolti', slug: '#2' },
              { name: '3. Finalità', slug: '#3' },
              { name: '4. Base Giuridica', slug: '#4' },
              { name: '5. Conservazione', slug: '#5' },
              { name: '6. Diritti', slug: '#6' },
            ],
          }},
        ],
        position: 'right', sticky: true,
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', gap: '16px',
          padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          width: '260px', maxWidth: '260px', position: 'sticky',
        },
        background: { type: 'color', value: '#f8f9fa' },
        border: { radius: '8px', width: '1px', style: 'solid', color: '#e0e0e0' },
      }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#2c3e50' },
      typography: { color: '#95a5a6', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 34. Pagina FAQ
const paginaFaq: PageTemplate = {
  id: 'pagina-faq',
  name: 'Pagina FAQ',
  description: 'Navigazione, sezioni accordion raggruppate per argomento, barra di ricerca, CTA contatto',
  category: 'generic',
  previewColor: '#2980b9',
  blocks: [
    b('navigation', 'Navigazione', {
      mode: 'custom', menuKey: 'primary', logoText: 'Sito', templateId: 'top-classic',
    }, {
      layout: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 1px 4px rgba(0,0,0,0.08)',
    }),

    b('hero', 'Header FAQ', {
      title: 'Domande Frequenti',
      subtitle: 'Trova rapidamente le risposte alle domande più comuni.',
      alignment: 'center',
      height: '30vh',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: { top: '60px', right: '48px', bottom: '60px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '280px',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #2980b9 0%, #3498db 100%)' },
      typography: { color: '#ffffff', textAlign: 'center' },
    }),

    b('search-bar', 'Ricerca FAQ', {
      placeholder: 'Cerca nelle FAQ...',
      showFilters: false,
    }, {
      layout: {
        display: 'flex', alignItems: 'center',
        padding: { top: '0', right: '32px', bottom: '0', left: '32px' },
        margin: { top: '-28px', right: 'auto', bottom: '32px', left: 'auto' },
        width: '100%', maxWidth: '700px',
      },
      background: { type: 'color', value: '#ffffff' },
      shadow: '0 8px 32px rgba(0,0,0,0.12)',
      border: { radius: '32px', width: '2px', style: 'solid', color: '#3498db' },
    }),

    b('accordion', 'FAQ Generali', {
      title: 'Domande Generali',
      items: [
        { id: '1', question: 'Come posso creare un account?', answer: 'Clicca su "Registrati" in alto a destra e compila il modulo con i tuoi dati. La verifica email è necessaria per completare la registrazione.' },
        { id: '2', question: 'Come posso recuperare la password?', answer: 'Nella pagina di login clicca su "Password dimenticata" e inserisci la tua email. Riceverai le istruzioni per il reset.' },
        { id: '3', question: 'Quali metodi di pagamento accettate?', answer: 'Accettiamo carte di credito/debito Visa e Mastercard, PayPal, bonifico bancario e SEPA Direct Debit.' },
      ],
      style: 'bordered',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '0',
        padding: { top: '0', right: '32px', bottom: '32px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
    }),

    b('accordion', 'FAQ Abbonamenti', {
      title: 'Abbonamenti e Fatturazione',
      items: [
        { id: '1', question: 'Posso cambiare piano in qualsiasi momento?', answer: 'Sì, puoi fare l\'upgrade o il downgrade del tuo piano in qualsiasi momento dalla sezione Account > Abbonamento.' },
        { id: '2', question: 'Emettete fattura?', answer: 'Sì, emettiamo fattura elettronica per tutti i piani a pagamento. Puoi scaricarle dalla sezione Fatturazione del tuo account.' },
        { id: '3', question: 'È disponibile un rimborso?', answer: 'Offriamo una garanzia soddisfatti o rimborsati di 30 giorni per tutti i nuovi abbonamenti.' },
      ],
      style: 'bordered',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '0',
        padding: { top: '0', right: '32px', bottom: '32px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
    }),

    b('accordion', 'FAQ Supporto Tecnico', {
      title: 'Supporto Tecnico',
      items: [
        { id: '1', question: 'Come posso contattare il supporto?', answer: 'Puoi contattarci via email a support@example.com, tramite chat live (disponibile Lun-Ven 9-18), o aprendo un ticket nel tuo account.' },
        { id: '2', question: 'Quali browser sono supportati?', answer: 'Supportiamo Chrome, Firefox, Safari e Edge nelle ultime 2 versioni maggiori. Internet Explorer non è supportato.' },
        { id: '3', question: 'Come posso esportare i miei dati?', answer: 'Nella sezione Account > Privacy puoi richiedere l\'esportazione completa di tutti i tuoi dati in formato JSON o CSV.' },
      ],
      style: 'bordered',
    }, {
      layout: {
        display: 'flex', flexDirection: 'column', gap: '0',
        padding: { top: '0', right: '32px', bottom: '40px', left: '32px' },
        margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
        width: '100%', maxWidth: '800px',
      },
    }),

    b('section', 'CTA Contatto', {}, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px',
        padding: { top: '56px', right: '48px', bottom: '56px', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#eaf4fb' },
      border: { width: '1px 0', style: 'solid', color: '#bee3f8' },
    }, undefined, [
      b('text', 'Non hai trovato risposta?', {
        content: '<h3>Non hai trovato la risposta che cercavi?</h3><p>Il nostro team di supporto è pronto ad aiutarti.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '500px',
        },
        typography: { textAlign: 'center', color: '#333333', fontSize: '18px', lineHeight: '1.6' },
      }),
    ]),

    b('footer', 'Footer', { mode: 'global', variant: 'minimal' }, {
      layout: {
        display: 'block',
        padding: { top: '32px', right: '32px', bottom: '24px', left: '32px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%',
      },
      background: { type: 'color', value: '#1a2e3f' },
      typography: { color: '#6a9abf', fontSize: '14px' },
    }, { endpoint: 'site-footer', params: {} }),
  ],
};

// 35. Pagina Redirect/Coming Soon
const paginaComingSoon: PageTemplate = {
  id: 'pagina-coming-soon',
  name: 'Pagina Coming Soon',
  description: 'Contenuto minimale centrato, iscrizione newsletter, link social',
  category: 'generic',
  previewColor: '#00b894',
  blocks: [
    b('section', 'Pagina Coming Soon', {}, {
      layout: {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '36px',
        padding: { top: '0', right: '48px', bottom: '0', left: '48px' },
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        width: '100%', maxWidth: '100%', minHeight: '100vh',
      },
      background: { type: 'gradient', value: 'linear-gradient(135deg, #00b894 0%, #00cec9 50%, #0984e3 100%)' },
    }, undefined, [
      b('text', 'Logo / Nome', {
        content: '<h1 style="font-size:52px;font-weight:900;color:#ffffff;letter-spacing:-2px;text-align:center">Il Tuo Brand</h1>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '700px',
        },
        typography: { textAlign: 'center' },
      }),

      b('text', 'Messaggio Coming Soon', {
        content: '<h2 style="color:#ffffff;font-size:30px;text-align:center">Qualcosa di Straordinario sta Arrivando</h2><p style="color:rgba(255,255,255,0.9);font-size:18px;text-align:center;line-height:1.7;max-width:560px">Stiamo lavorando per portarti qualcosa di cui non potrai fare a meno. Iscriviti per essere il primo a saperlo.</p>',
      }, {
        layout: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '600px',
        },
        typography: { textAlign: 'center' },
      }),

      b('newsletter-signup', 'Iscrizione Anticipata', {
        mode: 'global',
        title: '',
        description: '',
        buttonText: 'Avvisami al Lancio',
        placeholder: 'La tua email',
        compact: true,
        style: 'inline',
      }, {
        layout: {
          display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '500px',
        },
        background: { type: 'color', value: 'rgba(255,255,255,0.15)' },
        border: { radius: '40px', width: '2px', style: 'solid', color: 'rgba(255,255,255,0.5)' },
        typography: { color: '#ffffff' },
      }, { endpoint: 'site-newsletter', params: {} }),

      b('social', 'Social Links', {
        mode: 'links', templateId: 'social-editorial-row',
        style: 'circle', size: 'medium', colorMode: 'white', alignment: 'center', showLabels: false,
        platforms: [
          { id: 'fb', platform: 'facebook', label: 'Facebook', handle: '', url: '#', enabled: true },
          { id: 'ig', platform: 'instagram', label: 'Instagram', handle: '', url: '#', enabled: true },
          { id: 'tw', platform: 'x', label: 'X', handle: '', url: '#', enabled: true },
          { id: 'li', platform: 'linkedin', label: 'LinkedIn', handle: '', url: '#', enabled: true },
        ],
      }, {
        layout: {
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '300px',
        },
      }),

      b('text', 'Copyright', {
        content: '<p style="color:rgba(255,255,255,0.6);font-size:13px;text-align:center">© 2026 Il Tuo Brand. Tutti i diritti riservati.</p>',
      }, {
        layout: {
          display: 'block',
          padding: { top: '0', right: '0', bottom: '0', left: '0' },
          margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
          width: '100%', maxWidth: '400px',
        },
        typography: { textAlign: 'center' },
      }),
    ]),
  ],
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const PRO_TEMPLATES: PageTemplate[] = [
  // Editorial (10)
  quotidianoClassico,
  quotidianoModerno,
  rivistaDigitale,
  blogProfessionale,
  portaleNews24h,
  testataSportiva,
  giornaleLocale,
  magazineCultura,
  newsAggregator,
  editorialeLongform,
  // Business (10)
  corporateHomepage,
  portfolioShowcase,
  saasLanding,
  ecommerceVetrina,
  restaurantHotel,
  studioProfessionale,
  eventoConferenza,
  immobiliare,
  startupPitch,
  nonProfit,
  // Layout (10)
  layoutSidebarSinistra,
  layoutSidebarDestra,
  layoutDoubleSidebar,
  layoutSidebarTop,
  layoutSidebarBottom,
  layoutLShape,
  layoutHolyGrail,
  layoutMagazineGrid,
  layoutDashboard,
  layoutFullscreenSections,
  // Generic/Utility (5)
  pagina404,
  paginaManutenzione,
  paginaPrivacy,
  paginaFaq,
  paginaComingSoon,
];
