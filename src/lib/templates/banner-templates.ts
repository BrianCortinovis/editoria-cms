import type { Block } from '@/lib/types';

export interface BannerTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
  defaultProps: Record<string, unknown>;
  defaultStyle: Block['style'];
}

export function getBannerTemplates(): BannerTemplate[] {
  return [
    // SINGLE BANNERS
    {
      id: 'banner-single-square',
      name: 'Banner Quadrato',
      category: 'Single',
      description: 'Banner singolo quadrato 1:1',
      preview: '#2563eb',
      defaultProps: {
        layout: 'single',
        banners: [{ id: 'b1', imageUrl: '', link: '', altText: 'Banner', duration: 0 }],
        carouselEnabled: false,
        aspectRatio: '1/1',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '400px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },
    {
      id: 'banner-single-rect-wide',
      name: 'Banner Rettangolare Largo',
      category: 'Single',
      description: 'Banner singolo rettangolare 16:9',
      preview: '#3b82f6',
      defaultProps: {
        layout: 'single',
        banners: [{ id: 'b1', imageUrl: '', link: '', altText: 'Banner', duration: 0 }],
        carouselEnabled: false,
        aspectRatio: '16/9',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '600px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },
    {
      id: 'banner-single-rect-tall',
      name: 'Banner Rettangolare Alto',
      category: 'Single',
      description: 'Banner singolo rettangolare 3:4',
      preview: '#1d4ed8',
      defaultProps: {
        layout: 'single',
        banners: [{ id: 'b1', imageUrl: '', link: '', altText: 'Banner', duration: 0 }],
        carouselEnabled: false,
        aspectRatio: '3/4',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '300px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },

    // COLONNE
    {
      id: 'banner-column-single',
      name: 'Colonna Singola',
      category: 'Colonne',
      description: 'Banner in colonna singola verticale',
      preview: '#60a5fa',
      defaultProps: {
        layout: 'column-single',
        banners: [
          { id: 'b1', imageUrl: '', link: '', altText: 'Banner 1', duration: 0 },
          { id: 'b2', imageUrl: '', link: '', altText: 'Banner 2', duration: 0 },
          { id: 'b3', imageUrl: '', link: '', altText: 'Banner 3', duration: 0 },
        ],
        carouselEnabled: false,
        aspectRatio: '1/1',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '200px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },
    {
      id: 'banner-column-double',
      name: 'Due Colonne',
      category: 'Colonne',
      description: 'Banner in 2 colonne',
      preview: '#0ea5e9',
      defaultProps: {
        layout: 'column-double',
        banners: [
          { id: 'b1', imageUrl: '', link: '', altText: 'Banner 1', duration: 0 },
          { id: 'b2', imageUrl: '', link: '', altText: 'Banner 2', duration: 0 },
          { id: 'b3', imageUrl: '', link: '', altText: 'Banner 3', duration: 0 },
          { id: 'b4', imageUrl: '', link: '', altText: 'Banner 4', duration: 0 },
        ],
        carouselEnabled: false,
        aspectRatio: '1/1',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '400px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },
    {
      id: 'banner-column-triple',
      name: 'Tre Colonne',
      category: 'Colonne',
      description: 'Banner in 3 colonne',
      preview: '#06b6d4',
      defaultProps: {
        layout: 'column-triple',
        banners: [
          { id: 'b1', imageUrl: '', link: '', altText: 'Banner 1', duration: 0 },
          { id: 'b2', imageUrl: '', link: '', altText: 'Banner 2', duration: 0 },
          { id: 'b3', imageUrl: '', link: '', altText: 'Banner 3', duration: 0 },
          { id: 'b4', imageUrl: '', link: '', altText: 'Banner 4', duration: 0 },
          { id: 'b5', imageUrl: '', link: '', altText: 'Banner 5', duration: 0 },
          { id: 'b6', imageUrl: '', link: '', altText: 'Banner 6', duration: 0 },
        ],
        carouselEnabled: false,
        aspectRatio: '1/1',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '600px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },

    // RIGHE (Orizzontale)
    {
      id: 'banner-row',
      name: 'Riga Orizzontale',
      category: 'Righe',
      description: 'Banner in riga orizzontale scorrevole',
      preview: '#10b981',
      defaultProps: {
        layout: 'row',
        banners: [
          { id: 'b1', imageUrl: '', link: '', altText: 'Banner 1', duration: 0 },
          { id: 'b2', imageUrl: '', link: '', altText: 'Banner 2', duration: 0 },
          { id: 'b3', imageUrl: '', link: '', altText: 'Banner 3', duration: 0 },
          { id: 'b4', imageUrl: '', link: '', altText: 'Banner 4', duration: 0 },
        ],
        carouselEnabled: false,
        aspectRatio: '16/9',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '100%', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },

    // GRID 2x2
    {
      id: 'banner-grid-2x2',
      name: 'Grid 2x2',
      category: 'Grid',
      description: 'Banner in grid 2x2',
      preview: '#f59e0b',
      defaultProps: {
        layout: 'grid-2x2',
        banners: [
          { id: 'b1', imageUrl: '', link: '', altText: 'Banner 1', duration: 0 },
          { id: 'b2', imageUrl: '', link: '', altText: 'Banner 2', duration: 0 },
          { id: 'b3', imageUrl: '', link: '', altText: 'Banner 3', duration: 0 },
          { id: 'b4', imageUrl: '', link: '', altText: 'Banner 4', duration: 0 },
        ],
        carouselEnabled: false,
        aspectRatio: '1/1',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '400px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },

    // CAROSELLI DINAMICI
    {
      id: 'banner-carousel-auto',
      name: 'Carosello Automatico',
      category: 'Dinamici',
      description: 'Banner che cambiano automaticamente ogni 5 secondi',
      preview: '#ef4444',
      defaultProps: {
        layout: 'carousel',
        banners: [
          { id: 'b1', imageUrl: '', link: '', altText: 'Banner 1', duration: 0 },
          { id: 'b2', imageUrl: '', link: '', altText: 'Banner 2', duration: 0 },
          { id: 'b3', imageUrl: '', link: '', altText: 'Banner 3', duration: 0 },
        ],
        carouselEnabled: true,
        carouselSpeed: 5,
        carouselAutoPlay: true,
        aspectRatio: '16/9',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '600px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },
    {
      id: 'banner-carousel-fast',
      name: 'Carosello Veloce',
      category: 'Dinamici',
      description: 'Banner che cambiano ogni 3 secondi',
      preview: '#dc2626',
      defaultProps: {
        layout: 'carousel',
        banners: [
          { id: 'b1', imageUrl: '', link: '', altText: 'Banner 1', duration: 0 },
          { id: 'b2', imageUrl: '', link: '', altText: 'Banner 2', duration: 0 },
          { id: 'b3', imageUrl: '', link: '', altText: 'Banner 3', duration: 0 },
          { id: 'b4', imageUrl: '', link: '', altText: 'Banner 4', duration: 0 },
        ],
        carouselEnabled: true,
        carouselSpeed: 3,
        carouselAutoPlay: true,
        aspectRatio: '16/9',
        showControls: true,
      },
      defaultStyle: {
        layout: { width: '600px', maxWidth: '100%', padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' }, display: 'flex' },
        background: { type: 'color', value: 'transparent' },
        typography: {},
        border: {},
      },
    },
  ];
}
