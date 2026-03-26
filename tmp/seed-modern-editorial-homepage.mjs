#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const TENANT_SLUG = 'valbrembana';
const BACKUP_DIR = path.resolve('tmp');
const DEMO_PREFIX = 'demo-home-vision';

function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
  return Object.fromEntries(
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      }),
  );
}

function uuid() {
  return crypto.randomUUID();
}

function spacing(all = '0') {
  return { top: all, right: all, bottom: all, left: all };
}

function baseStyle(overrides = {}) {
  return {
    layout: {
      display: 'block',
      padding: spacing('0'),
      margin: spacing('0'),
      width: '100%',
      maxWidth: '100%',
      ...overrides.layout,
    },
    background: {
      type: 'none',
      value: '',
      ...overrides.background,
    },
    typography: {
      ...overrides.typography,
    },
    border: {
      ...overrides.border,
    },
    shadow: overrides.shadow,
    opacity: overrides.opacity,
    transform: overrides.transform,
    transition: overrides.transition,
    filter: overrides.filter,
    backdropFilter: overrides.backdropFilter,
    mixBlendMode: overrides.mixBlendMode,
    textShadow: overrides.textShadow,
    customCss: overrides.customCss,
    effects: overrides.effects,
  };
}

function block(type, label, props = {}, style = {}, children = []) {
  return {
    id: uuid(),
    type,
    label,
    props,
    style: baseStyle(style),
    shape: null,
    responsive: {},
    animation: null,
    children,
    locked: false,
    hidden: false,
  };
}

function section(label, children, style = {}, props = {}) {
  return block(
    'section',
    label,
    { tag: 'section', fullWidth: true, ...props },
    {
      layout: {
        display: 'flex',
        flexDirection: 'column',
        padding: { top: '40px', right: '28px', bottom: '40px', left: '28px' },
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
        minHeight: '220px',
      },
      ...style,
    },
    children,
  );
}

function columns(label, widths, children, style = {}, props = {}) {
  return block(
    'columns',
    label,
    {
      columnCount: widths.length,
      columnWidths: widths,
      gap: '26px',
      stackOnMobile: true,
      ...props,
    },
    {
      layout: {
        display: 'flex',
        flexDirection: 'row',
        gap: '26px',
        padding: spacing('0'),
        margin: spacing('0'),
        width: '100%',
        maxWidth: '1380px',
        alignItems: 'stretch',
      },
      ...style,
    },
    children,
  );
}

function textBlock(label, content, style = {}) {
  return block(
    'text',
    label,
    { content, dropCap: false, columns: 1 },
    {
      layout: {
        padding: spacing('0'),
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
      },
      typography: {
        fontFamily: '"IBM Plex Serif", Georgia, serif',
        fontSize: '18px',
        lineHeight: '1.65',
        color: '#111827',
      },
      ...style,
    },
  );
}

function bannerZone(label, position, extraProps = {}, style = {}) {
  return block(
    'banner-zone',
    label,
    { position, scrollingRow: ['header', 'footer', 'topbar'].includes(position), ...extraProps },
    {
      layout: {
        padding: position === 'header' || position === 'footer'
          ? { top: '10px', right: '20px', bottom: '10px', left: '20px' }
          : { top: '0', right: '0', bottom: '0', left: '0' },
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
        minHeight: position === 'sidebar' ? '250px' : '120px',
      },
      background: {
        type: 'color',
        value: position === 'header' ? '#0f172a' : '#f8fafc',
      },
      ...style,
    },
  );
}

function articleGrid(label, categorySlug, limit, columnsCount, style = {}) {
  return block(
    'article-grid',
    label,
    {
      columns: columnsCount,
      limit,
      categorySlug,
      showImage: true,
      showExcerpt: true,
      showCategory: true,
      showAuthor: true,
      showDate: true,
      cardStyle: 'default',
    },
    {
      layout: {
        padding: spacing('0'),
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
        gap: '18px',
      },
      ...style,
    },
  );
}

function articleHero(label, style = {}) {
  return block(
    'article-hero',
    label,
    {
      useFeatured: true,
      overlayColor: 'rgba(2, 6, 23, 0.50)',
      showCategory: true,
      showAuthor: true,
      showDate: true,
      showExcerpt: true,
      height: '640px',
    },
    {
      layout: {
        minHeight: '640px',
        padding: { top: '44px', right: '44px', bottom: '44px', left: '44px' },
        width: '100%',
        maxWidth: '100%',
      },
      border: {
        radius: '26px',
      },
      shadow: '0 28px 80px rgba(15, 23, 42, 0.22)',
      ...style,
    },
  );
}

function slideshowBlock() {
  return block(
    'slideshow',
    'Slideshow articoli',
    {
      slides: [
        {
          id: 's1',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80',
          title: 'Speciale weekend in valle',
          description: 'Guide, eventi e idee per vivere il territorio con un linguaggio da magazine digitale.',
          link: '#',
          overlay: { enabled: true, color: 'rgba(3, 7, 18, 0.42)', position: 'bottom-left' },
          buttons: [{ id: 'b1', text: 'Apri speciale', url: '#', style: 'primary' }],
          textStyle: { titleSize: '40px', titleWeight: '700', descSize: '17px', color: '#ffffff' },
        },
        {
          id: 's2',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80',
          title: 'Mercati, scuole, mobilità',
          description: 'La narrazione locale diventa una homepage di servizio con immagini forti e ritmo televisivo.',
          link: '#',
          overlay: { enabled: true, color: 'rgba(15, 23, 42, 0.38)', position: 'center' },
          buttons: [{ id: 'b2', text: 'Leggi il dossier', url: '#', style: 'secondary' }],
          textStyle: { titleSize: '38px', titleWeight: '700', descSize: '17px', color: '#ffffff' },
        },
        {
          id: 's3',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1600&q=80',
          title: 'Storie, volti e reportage',
          description: 'Un carosello visivo editoriale pensato per campagne, longform e raccolte fotografiche.',
          link: '#',
          overlay: { enabled: true, color: 'rgba(0, 0, 0, 0.34)', position: 'bottom-left' },
          buttons: [{ id: 'b3', text: 'Scopri le storie', url: '#', style: 'primary' }],
          textStyle: { titleSize: '38px', titleWeight: '700', descSize: '17px', color: '#ffffff' },
        },
      ],
      autoplay: true,
      interval: 4200,
      pauseOnHover: true,
      transition: 'slide',
      transitionSpeed: 650,
      direction: 'horizontal',
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      showDots: true,
      showArrows: true,
      showProgress: true,
      dotsPosition: 'bottom',
      arrowStyle: 'circle',
      height: '520px',
      objectFit: 'cover',
      showThumbnails: false,
      kenBurns: true,
      parallaxEffect: true,
    },
    {
      layout: {
        width: '100%',
        maxWidth: '100%',
      },
      border: {
        radius: '24px',
      },
      shadow: '0 24px 72px rgba(15, 23, 42, 0.18)',
    },
  );
}

function tgAnimationBlock() {
  return block(
    'custom-html',
    'TG animato',
    {
      html: `
        <div class="tg-live-shell">
          <div class="tg-live-head">
            <span class="tg-pulse"></span>
            <span>DIRETTA REDAZIONE</span>
          </div>
          <div class="tg-live-track">
            <div class="tg-live-card"><strong>08:00</strong><span>Prima edizione con apertura viabilità e meteo di valle.</span></div>
            <div class="tg-live-card"><strong>12:30</strong><span>Desk economia, scuole, lavori pubblici e punti critici.</span></div>
            <div class="tg-live-card"><strong>18:00</strong><span>Blocchi TG, video social e commenti in evidenza.</span></div>
            <div class="tg-live-card"><strong>20:00</strong><span>Edizione serale con studio virtuale e lanci video.</span></div>
          </div>
        </div>
      `,
      css: `
        .tg-live-shell {
          border-radius: 24px;
          padding: 22px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #111827 100%);
          color: #e2e8f0;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.26);
        }
        .tg-live-head {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #f8fafc;
          margin-bottom: 18px;
        }
        .tg-pulse {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #ef4444;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, .75);
          animation: tgPulse 1.6s infinite;
        }
        .tg-live-track {
          display: grid;
          gap: 12px;
        }
        .tg-live-card {
          display: grid;
          grid-template-columns: 84px 1fr;
          gap: 16px;
          align-items: start;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
          transform: translateX(0);
          animation: tgSlide 6s ease-in-out infinite;
        }
        .tg-live-card:nth-child(2) { animation-delay: .4s; }
        .tg-live-card:nth-child(3) { animation-delay: .8s; }
        .tg-live-card:nth-child(4) { animation-delay: 1.2s; }
        .tg-live-card strong {
          color: #fbbf24;
          letter-spacing: .08em;
          font-size: 13px;
        }
        .tg-live-card span {
          line-height: 1.55;
          color: #cbd5e1;
          font-size: 15px;
        }
        @keyframes tgPulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, .75); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes tgSlide {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
      `,
      js: '',
      sandboxed: true,
    },
    {
      layout: {
        width: '100%',
        maxWidth: '100%',
        padding: spacing('0'),
        margin: spacing('0'),
      },
    },
  );
}

function advHtmlBlock(label, html) {
  return block(
    'custom-html',
    label,
    {
      html,
      css: '',
      js: '',
      sandboxed: true,
    },
    {
      layout: {
        width: '100%',
        maxWidth: '100%',
        padding: spacing('0'),
        margin: spacing('0'),
      },
    },
  );
}

function videoBlock() {
  return block(
    'video',
    'TG ORE 20',
    {
      source: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'TG ORE 20',
      caption: 'Edizione serale demo della testata con studio, servizi e lanci video.',
      aspectRatio: '16/9',
      thumbnail: {
        show: true,
        text: 'Guarda il TG',
        style: 'overlay',
      },
    },
    {
      layout: {
        width: '100%',
        maxWidth: '100%',
        margin: spacing('0'),
      },
      border: {
        radius: '24px',
      },
      shadow: '0 20px 56px rgba(15, 23, 42, 0.18)',
    },
  );
}

function galleryBlock() {
  return block(
    'image-gallery',
    'TG video gallery',
    {
      items: [
        {
          id: 'g1',
          type: 'video',
          src: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
          alt: 'Studio serale',
          caption: 'Studio serale',
          overlay: { enabled: true, title: 'Studio TG', description: 'Apertura e lanci video', position: 'bottom', color: 'rgba(0,0,0,0.48)' },
          buttons: [],
          badge: 'VIDEO',
          link: '#',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        {
          id: 'g2',
          type: 'image',
          src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
          alt: 'Desk news',
          caption: 'Desk news',
          overlay: { enabled: true, title: 'Desk digitale', description: 'Monitor, social e live update', position: 'bottom', color: 'rgba(0,0,0,0.45)' },
          buttons: [],
          badge: 'NEWSROOM',
          link: '#',
        },
        {
          id: 'g3',
          type: 'video',
          src: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
          alt: 'Servizio esterno',
          caption: 'Servizio esterno',
          overlay: { enabled: true, title: 'Reportage', description: 'Collegamenti e interviste', position: 'bottom', color: 'rgba(0,0,0,0.45)' },
          buttons: [],
          badge: 'SERVIZIO',
          link: '#',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        {
          id: 'g4',
          type: 'image',
          src: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
          alt: 'Control room',
          caption: 'Control room',
          overlay: { enabled: true, title: 'Control room', description: 'Regia e distribuzione contenuti', position: 'bottom', color: 'rgba(0,0,0,0.45)' },
          buttons: [],
          badge: 'REGIA',
          link: '#',
        },
      ],
      layout: 'masonry',
      columns: 2,
      gap: '14px',
      aspectRatio: '16/10',
      objectFit: 'cover',
      borderRadius: '18px',
      hoverEffect: 'zoom',
      lightbox: true,
      showCaptions: true,
      captionPosition: 'below',
      filterTags: [],
      showFilter: false,
      maxItems: 0,
      loadMore: false,
      animation: 'fade-in',
    },
    {
      layout: {
        width: '100%',
        maxWidth: '100%',
        padding: spacing('0'),
        margin: spacing('0'),
      },
    },
  );
}

function footerBlock() {
  return block(
    'footer',
    'Footer testata',
    {
      mode: 'custom',
      variant: 'columns',
      logoUrl: '',
      description: 'Una homepage demo moderna pensata per mostrare rendering, pubblicità, TG, gallery e blocchi editoriali del CMS.',
      columns: [
        {
          title: 'Redazione',
          text: 'Cronaca, sport, cultura, meteo e video in un flusso editoriale unico.',
          links: [
            { label: 'Cronaca', url: '/cronaca' },
            { label: 'Sport', url: '/sport' },
          ],
        },
        {
          title: 'Servizi',
          links: [
            { label: 'Newsletter', url: '/newsletter' },
            { label: 'Abbonati', url: '/abbonati' },
            { label: 'Pubblicità', url: '/pubblicita' },
          ],
        },
        {
          title: 'Contatti',
          text: 'Redazione demo\ninfo@valbrembanaweb.test\n+39 000 000000',
          links: [],
        },
      ],
      links: [],
      copyright: '© 2026 Valbrembana Web Demo. Tutti i contenuti sono fittizi per test del CMS.',
      socialLinks: [
        { platform: 'facebook', url: '#' },
        { platform: 'instagram', url: '#' },
        { platform: 'twitter', url: '#' },
        { platform: 'youtube', url: '#' },
      ],
      newsletter: {
        enabled: true,
        title: 'Morning Brief',
        description: 'Ricevi ogni mattina una selezione di notizie, video e appuntamenti della giornata.',
        buttonText: 'Iscriviti',
        formSlug: '',
      },
    },
    {
      background: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #1f2937 100%)',
      },
      typography: {
        color: '#e5e7eb',
        fontSize: '14px',
      },
    },
  );
}

function buildHomepageBlocks() {
  const leftRail = section('Rail sinistra', [
    bannerZone('ADV sidebar sinistra', 'sidebar'),
    textBlock('Radar redazione', `
      <div style="padding:18px 18px 20px;border-radius:22px;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 14px 42px rgba(15,23,42,.06)">
        <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#0f766e;margin-bottom:10px">Radar</div>
        <h3 style="font-size:30px;line-height:1.02;margin:0 0 12px 0">Cronaca e servizio</h3>
        <p style="font-size:16px;line-height:1.6;color:#475569;margin:0 0 16px 0">Una rail laterale che mixa pubblicità, alert e schede rapide.</p>
        <ul style="margin:0;padding-left:18px;color:#334155;display:grid;gap:8px">
          <li>Viabilità e meteo di valle</li>
          <li>Scuole, trasporti, sanità</li>
          <li>Desk comuni e comunità</li>
        </ul>
      </div>
    `),
    articleGrid('Grid cronaca', 'cronaca', 3, 1),
  ], {
    layout: {
      padding: spacing('0'),
      minHeight: '100%',
    },
  });

  const centerRail = section('Rail centrale', [
    textBlock('Eyebrow home', `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:18px">
        <div>
          <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#0f766e;margin-bottom:8px">Edizione digitale</div>
          <h1 style="font-size:clamp(3.4rem,7vw,5.8rem);line-height:.9;letter-spacing:-.05em;margin:0;color:#0f172a">Val Brembana<br/>Live Desk</h1>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <span style="padding:8px 12px;border-radius:999px;background:#e0f2fe;color:#0c4a6e;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Newsroom</span>
          <span style="padding:8px 12px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">TV</span>
          <span style="padding:8px 12px;border-radius:999px;background:#ede9fe;color:#5b21b6;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">ADV</span>
        </div>
      </div>
    `),
    articleHero('Hero centrale'),
  ], {
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    },
    layout: {
      padding: spacing('0'),
    },
  });

  const rightRail = section('Rail destra', [
    textBlock('Agenda giornata', `
      <div style="padding:18px;border-radius:22px;background:linear-gradient(135deg,#111827 0%,#0f172a 100%);color:#e2e8f0;box-shadow:0 18px 44px rgba(15,23,42,.18)">
        <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#fbbf24;margin-bottom:10px">Agenda</div>
        <h3 style="font-size:30px;line-height:1.02;margin:0 0 12px 0;color:#ffffff">Desk del giorno</h3>
        <p style="font-size:15px;line-height:1.55;color:#cbd5e1;margin:0 0 14px 0">Tra video, liveblog e appuntamenti del territorio.</p>
        <div style="display:grid;gap:10px">
          <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.1);padding-top:10px"><strong>09:00</strong><span>Meteo e mobilità</span></div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.1);padding-top:10px"><strong>13:00</strong><span>Desk scuola e servizi</span></div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.1);padding-top:10px"><strong>20:00</strong><span>TG ORE 20</span></div>
        </div>
      </div>
    `),
    articleGrid('Grid sport', 'sport', 3, 1),
    bannerZone('ADV sidebar destra', 'sidebar'),
  ], {
    layout: {
      padding: spacing('0'),
      minHeight: '100%',
    },
  });

  return [
    block(
      'navigation',
      'Header testata',
      {
        mode: 'custom',
        logoText: 'VALBREMBANA WEB',
        logoUrl: '',
        items: [
          { id: 'home', label: 'Home', url: '/', children: [] },
          { id: 'cronaca', label: 'Cronaca', url: '/cronaca', children: [] },
          { id: 'sport', label: 'Sport', url: '/sport', children: [] },
          { id: 'cultura', label: 'Cultura', url: '/cultura', children: [] },
          { id: 'video', label: 'Video', url: '/video', children: [] },
          { id: 'adv', label: 'Pubblicità', url: '/pubblicita', children: [] },
        ],
        layout: 'horizontal',
        variant: 'underline',
        sticky: false,
        justify: 'space-between',
        itemGap: 18,
        showDescriptions: false,
        ctaText: 'Abbonati',
        ctaUrl: '/abbonati',
      },
      {
        layout: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: { top: '18px', right: '28px', bottom: '18px', left: '28px' },
        },
        background: {
          type: 'color',
          value: '#ffffff',
        },
        border: {
          width: '0 0 1px 0',
          style: 'solid',
          color: '#d7dde6',
        },
        shadow: '0 1px 0 rgba(15,23,42,0.04)',
      },
    ),
    bannerZone('Riga ADV top', 'header'),
    block(
      'breaking-ticker',
      'Breaking desk',
      { speed: 46, icon: 'Zap', label: 'ULTIMA ORA' },
      {
        background: { type: 'gradient', value: 'linear-gradient(90deg, #991b1b 0%, #b91c1c 50%, #7f1d1d 100%)' },
        typography: { color: '#ffffff', fontWeight: '700', fontSize: '14px' },
      },
    ),
    section('Hero newsroom', [
      columns('Hero 22-56-22', ['22%', '56%', '22%'], [leftRail, centerRail, rightRail]),
    ], {
      background: {
        type: 'gradient',
        value: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
      },
      layout: {
        padding: { top: '32px', right: '28px', bottom: '40px', left: '28px' },
      },
    }),
    section('Striscia contenuti', [
      columns('Mix editoriale', ['63%', '37%'], [
        section('Colonna slideshow', [
          textBlock('Titolo slideshow', `
            <div style="margin-bottom:18px">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#7c3aed;margin-bottom:10px">Speciali & campagne</div>
              <h2 style="font-size:44px;line-height:.96;letter-spacing:-.04em;margin:0;color:#111827">Slideshow articoli e sezioni vetrina</h2>
            </div>
          `),
          slideshowBlock(),
        ], { layout: { padding: spacing('0') } }),
        section('Video gallery e TG', [
          textBlock('Titolo gallery', `
            <div style="margin-bottom:18px">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#0f766e;margin-bottom:10px">Video wall</div>
              <h2 style="font-size:42px;line-height:.98;letter-spacing:-.03em;margin:0;color:#111827">TG video gallery</h2>
            </div>
          `),
          galleryBlock(),
        ], { layout: { padding: { top: '30px', right: '0', bottom: '0', left: '0' } } }),
      ], {
        layout: { maxWidth: '1380px', alignItems: 'start' },
      }, { gap: '28px' }),
    ], {
      background: {
        type: 'color',
        value: '#ffffff',
      },
    }),
    section('Fascia TG', [
      columns('TG live split', ['34%', '38%', '28%'], [
        section('Blocco animato tg', [tgAnimationBlock()], { layout: { padding: spacing('0') } }),
        section('Video TG principale', [
          textBlock('Titolo tg', `
            <div style="margin-bottom:16px">
              <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#f59e0b;margin-bottom:10px">Video redazione</div>
              <h2 style="font-size:44px;line-height:.95;letter-spacing:-.04em;margin:0;color:#ffffff">TG ORE 20</h2>
            </div>
          `, { typography: { color: '#ffffff' } }),
          videoBlock(),
        ], {
          background: {
            type: 'gradient',
            value: 'linear-gradient(135deg,#111827 0%,#1f2937 100%)',
          },
          layout: {
            padding: { top: '26px', right: '26px', bottom: '26px', left: '26px' },
          },
          border: { radius: '24px' },
          shadow: '0 22px 56px rgba(15, 23, 42, 0.24)',
        }),
        section('Rail tg laterale', [
          articleGrid('Articoli video', 'video', 4, 1),
          advHtmlBlock('Native adv TG', `
            <div style="min-height:220px;padding:20px;border-radius:22px;background:linear-gradient(135deg,#0f766e 0%,#0891b2 100%);color:#ffffff;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 18px 42px rgba(15,23,42,.16)">
              <div>
                <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;opacity:.8;margin-bottom:10px">Partner</div>
                <h3 style="font:700 30px/1.02 system-ui;margin:0 0 12px">Native adv video</h3>
                <p style="font:400 15px/1.55 system-ui;margin:0;color:rgba(255,255,255,.86)">Uno slot demo per branded clip, sponsor TG o promozione editoriale video.</p>
              </div>
              <div style="font:700 13px/1 system-ui;letter-spacing:.16em;text-transform:uppercase">Scopri il formato</div>
            </div>
          `),
        ], {
          layout: { padding: spacing('0') },
        }),
      ], { layout: { maxWidth: '1380px', alignItems: 'stretch' } }),
    ], {
      background: {
        type: 'gradient',
        value: 'linear-gradient(180deg,#0f172a 0%,#111827 100%)',
      },
      layout: {
        padding: { top: '38px', right: '28px', bottom: '38px', left: '28px' },
      },
    }),
    section('Pacchetto contenuti bassi', [
      columns('Basso 3 colonne', ['33%', '34%', '33%'], [
        section('Cultura', [
          textBlock('Titolo cultura', `
            <div style="margin-bottom:14px">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#be123c;margin-bottom:10px">Magazine</div>
              <h2 style="font-size:36px;line-height:1;margin:0;color:#111827">Cultura & community</h2>
            </div>
          `),
          articleGrid('Grid cultura', 'cultura', 3, 1),
        ], { layout: { padding: spacing('0') } }),
        section('ADV centrale', [
          advHtmlBlock('ADV billboard centrale', `
            <div style="min-height:320px;padding:24px;border-radius:24px;background:linear-gradient(135deg,#e11d48 0%,#7c3aed 100%);color:#fff;display:grid;place-items:center;text-align:center;box-shadow:0 20px 48px rgba(15,23,42,.14)">
              <div>
                <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;opacity:.82;margin-bottom:12px">Branded content</div>
                <h3 style="font:700 42px/1 system-ui;margin:0 0 12px">Billboard centrale</h3>
                <p style="font:400 17px/1.55 system-ui;margin:0 auto;max-width:32rem">Uno slot ampio per campagne visuali, retail, eventi o pacchetti premium.</p>
              </div>
            </div>
          `),
          textBlock('Copy adv', `
            <div style="padding:20px 22px;border-radius:20px;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 16px 36px rgba(15,23,42,.06)">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#92400e;margin-bottom:10px">Native adv</div>
              <h3 style="font-size:32px;line-height:1;margin:0 0 12px 0;color:#111827">Spazi pubblicitari e branded strip</h3>
              <p style="font-size:16px;line-height:1.6;color:#475569;margin:0">Qui il CMS mostra una composizione vera da testata: banner row, sidebar, native slot e footer adv.</p>
            </div>
          `),
        ], { layout: { padding: spacing('0') } }),
        section('Economia', [
          textBlock('Titolo economia', `
            <div style="margin-bottom:14px">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#0f766e;margin-bottom:10px">Focus</div>
              <h2 style="font-size:36px;line-height:1;margin:0;color:#111827">Imprese, turismo, economia</h2>
            </div>
          `),
          articleGrid('Grid economia', 'economia', 3, 1),
        ], { layout: { padding: spacing('0') } }),
      ], { layout: { maxWidth: '1380px', alignItems: 'start' } }),
    ], {
      background: {
        type: 'gradient',
        value: 'linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)',
      },
    }),
    bannerZone('Riga ADV footer', 'footer'),
    footerBlock(),
  ];
}

async function ensureCategory(supabase, tenantId, { name, slug, color, description }) {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      tenant_id: tenantId,
      name,
      slug,
      color,
      description,
      sort_order: 0,
    })
    .select('id')
    .single();

  if (error || !data) throw error || new Error(`Categoria ${slug} non creata`);
  return data.id;
}

async function seedArticles(supabase, tenantId, authorId, categories) {
  await supabase
    .from('articles')
    .delete()
    .eq('tenant_id', tenantId)
    .like('slug', `${DEMO_PREFIX}-%`);

  const articles = [
    {
      title: 'Valle live: apertura newsroom tra servizio, video e grande immagine',
      slug: `${DEMO_PREFIX}-apertura-newsroom`,
      summary: 'Una homepage pensata come una testata contemporanea: forte, visiva, ordinata e piena di contenuti.',
      category_id: categories.cronaca,
      cover_image_url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
      is_featured: true,
      is_breaking: true,
      reading_time_minutes: 5,
    },
    {
      title: 'Viabilità di valle, cantieri e mobilità: il desk del mattino',
      slug: `${DEMO_PREFIX}-viabilita-valle`,
      summary: 'Tutto quello che serve sapere per muoversi tra fondovalle, scuole e principali collegamenti.',
      category_id: categories.cronaca,
      cover_image_url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 3,
    },
    {
      title: 'Sport locale: weekend pieno, campionati e calendario eventi',
      slug: `${DEMO_PREFIX}-sport-weekend`,
      summary: 'Squadre del territorio, palinsesto, campi e risultati in una colonna editoriale a scorrimento.',
      category_id: categories.sport,
      cover_image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 4,
    },
    {
      title: 'Festival, mostre e comunità: la cultura diventa sezione premium',
      slug: `${DEMO_PREFIX}-festival-mostre`,
      summary: 'Dalla rassegna locale ai grandi appuntamenti diffusi sul territorio, con taglio magazine.',
      category_id: categories.cultura,
      cover_image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 6,
    },
    {
      title: 'Imprese alpine e turismo quattro stagioni: i numeri che contano',
      slug: `${DEMO_PREFIX}-imprese-turismo`,
      summary: 'Un focus rapido su imprese, hospitality, stagionalità e nuovi servizi.',
      category_id: categories.economia,
      cover_image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 4,
    },
    {
      title: 'TG ORE 20: lo studio serale diventa esperienza homepage',
      slug: `${DEMO_PREFIX}-tg-ore-20`,
      summary: 'Video principale, gallery e blocchi animati per rendere la home più viva e televisiva.',
      category_id: categories.video,
      cover_image_url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 3,
    },
    {
      title: 'Scuole, trasporti e servizi: il pacchetto utile da aprire ogni mattina',
      slug: `${DEMO_PREFIX}-scuole-servizi`,
      summary: 'Una selezione di notizie pratiche e continue per la vita quotidiana sul territorio.',
      category_id: categories.cronaca,
      cover_image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 4,
    },
    {
      title: 'Raccontare il territorio con immagini forti: fotostorie, gallery e reportage',
      slug: `${DEMO_PREFIX}-fotostorie-reportage`,
      summary: 'Il linguaggio visuale entra nella testata con un layout più ampio e contemporaneo.',
      category_id: categories.cultura,
      cover_image_url: 'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 5,
    },
    {
      title: 'Mercati, negozi e piazze: l’economia locale spiegata semplice',
      slug: `${DEMO_PREFIX}-mercati-piazze`,
      summary: 'Numeri, contesto e facce del territorio in una chiave leggibile e giornalistica.',
      category_id: categories.economia,
      cover_image_url: 'https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 5,
    },
    {
      title: 'Sport di valle: storie piccole, ritmo alto, lettura rapida',
      slug: `${DEMO_PREFIX}-sport-storie`,
      summary: 'Una colonna sportiva pensata per home page dense ma ordinate.',
      category_id: categories.sport,
      cover_image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 3,
    },
    {
      title: 'La regia digitale della redazione: come si costruisce un TG per il web',
      slug: `${DEMO_PREFIX}-regia-digitale`,
      summary: 'Dalla control room ai canali social, il dietro le quinte diventa contenuto.',
      category_id: categories.video,
      cover_image_url: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 4,
    },
    {
      title: 'Eventi, piazze e weekend: la cultura locale entra in homepage',
      slug: `${DEMO_PREFIX}-eventi-weekend`,
      summary: 'Un blocco che incrocia agenda, storie e percorsi in un layout da rivista.',
      category_id: categories.cultura,
      cover_image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80',
      reading_time_minutes: 4,
    },
  ];

  const now = Date.now();
  const payload = articles.map((article, index) => ({
    tenant_id: tenantId,
    author_id: authorId,
    title: article.title,
    slug: article.slug,
    subtitle: null,
    summary: article.summary,
    body: `<p>${article.summary}</p><p>Contenuto dimostrativo creato per popolare il CMS locale con una homepage ricca di moduli editoriali, video, banner e gallery.</p>`,
    cover_image_url: article.cover_image_url,
    category_id: article.category_id,
    status: 'published',
    is_featured: article.is_featured || false,
    is_breaking: article.is_breaking || false,
    is_premium: false,
    meta_title: article.title,
    meta_description: article.summary,
    og_image_url: article.cover_image_url,
    reading_time_minutes: article.reading_time_minutes,
    published_at: new Date(now - index * 1000 * 60 * 70).toISOString(),
    scheduled_at: null,
  }));

  const { error } = await supabase.from('articles').insert(payload);
  if (error) throw error;
}

async function seedBreakingNews(supabase, tenantId, authorId) {
  await supabase
    .from('breaking_news')
    .delete()
    .eq('tenant_id', tenantId)
    .like('text', 'DEMO HOME:%');

  const payload = [
    { text: 'DEMO HOME: viabilità aggiornata, nessuna criticità sulle direttrici principali', priority: 100 },
    { text: 'DEMO HOME: TG ORE 20 in apertura con focus su scuole, servizi e meteo', priority: 90 },
    { text: 'DEMO HOME: weekend sportivo pieno, risultati e calendario in homepage', priority: 80 },
    { text: 'DEMO HOME: nuova fascia video e gallery newsroom attive nella home', priority: 70 },
  ].map((item) => ({
    tenant_id: tenantId,
    text: item.text,
    link_url: '#',
    priority: item.priority,
    created_by: authorId,
    expires_at: null,
    is_active: true,
  }));

  const { error } = await supabase.from('breaking_news').insert(payload);
  if (error) throw error;
}

async function seedBanners(supabase, tenantId) {
  await supabase
    .from('banners')
    .delete()
    .eq('tenant_id', tenantId)
    .like('name', 'DEMO HOME %');

  const payload = [
    {
      name: 'DEMO HOME Header 1',
      position: 'header',
      type: 'html',
      html_content: '<div style="display:flex;align-items:center;justify-content:center;min-height:80px;padding:0 24px;border-radius:18px;background:linear-gradient(90deg,#f97316 0%,#fb7185 100%);color:#fff;font:700 18px/1.2 system-ui"><span style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin-right:14px;opacity:.8">ADV</span>Campagna turismo primavera · pacchetto display premium</div>',
      image_url: null,
      link_url: '#',
      target_device: 'all',
      weight: 10,
    },
    {
      name: 'DEMO HOME Header 2',
      position: 'header',
      type: 'html',
      html_content: '<div style="display:flex;align-items:center;justify-content:center;min-height:80px;padding:0 24px;border-radius:18px;background:linear-gradient(90deg,#0ea5e9 0%,#22c55e 100%);color:#fff;font:700 18px/1.2 system-ui"><span style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin-right:14px;opacity:.8">SPONSOR</span>Valle experience · outdoor, ski, trails e camere</div>',
      image_url: null,
      link_url: '#',
      target_device: 'all',
      weight: 9,
    },
    {
      name: 'DEMO HOME Sidebar 1',
      position: 'sidebar',
      type: 'html',
      html_content: '<div style="min-height:250px;padding:18px;border-radius:22px;background:linear-gradient(180deg,#111827 0%,#1f2937 100%);color:#fff;display:flex;flex-direction:column;justify-content:space-between"><div><div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;opacity:.75;margin-bottom:10px">ADV Display</div><h3 style="font:700 28px/1.05 system-ui;margin:0 0 10px">Pacchetto hotel & spa</h3><p style="font:400 15px/1.55 system-ui;margin:0;color:#cbd5e1">Visual pensato per riempire i rail laterali del quotidiano digitale.</p></div><div style="font:700 13px/1 system-ui;letter-spacing:.14em;text-transform:uppercase;color:#fbbf24">Prenota ora</div></div>',
      image_url: null,
      link_url: '#',
      target_device: 'desktop',
      weight: 8,
    },
    {
      name: 'DEMO HOME Footer 1',
      position: 'footer',
      type: 'html',
      html_content: '<div style="display:flex;align-items:center;justify-content:center;min-height:82px;padding:0 22px;border-radius:18px;background:#f8fafc;color:#0f172a;border:1px solid #cbd5e1;font:700 17px/1.2 system-ui"><span style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin-right:14px;color:#64748b">ADV</span>Footer sponsor · newsletter, pacchetti premium, campagne locali</div>',
      image_url: null,
      link_url: '#',
      target_device: 'all',
      weight: 8,
    },
  ].map((item) => ({
    tenant_id: tenantId,
    ...item,
    target_categories: [],
    is_active: true,
    starts_at: null,
    ends_at: null,
  }));

  const { error } = await supabase.from('banners').insert(payload);
  if (error) throw error;
}

async function backupHomepage(supabase, tenantId) {
  const { data: page } = await supabase
    .from('site_pages')
    .select('id, slug, blocks, meta')
    .eq('tenant_id', tenantId)
    .eq('slug', 'homepage')
    .maybeSingle();

  if (!page) return null;

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const backupPath = path.join(BACKUP_DIR, `homepage-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(page, null, 2));
  return backupPath;
}

async function upsertHomepage(supabase, tenantId) {
  const blocks = buildHomepageBlocks();
  const payload = {
    tenant_id: tenantId,
    title: 'Homepage',
    slug: 'homepage',
    page_type: 'homepage',
    is_published: true,
    meta: {
      title: 'Valbrembana Web Demo',
      description: 'Homepage demo moderna di testata giornalistica con ADV, TG, slideshow, gallery e contenuti editoriali.',
      canonicalPath: '/',
      pageBackground: {
        type: 'gradient',
        gradient: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      },
    },
    blocks,
  };

  const { data: existing } = await supabase
    .from('site_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', 'homepage')
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from('site_pages').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase.from('site_pages').insert(payload).select('id').single();
  if (error || !data) throw error || new Error('Homepage non creata');
  return data.id;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', TENANT_SLUG)
    .single();

  if (tenantError || !tenant) throw tenantError || new Error('Tenant non trovato');

  const { data: tenantUser, error: tenantUserError } = await supabase
    .from('user_tenants')
    .select('user_id')
    .eq('tenant_id', tenant.id)
    .limit(1)
    .single();

  if (tenantUserError || !tenantUser?.user_id) throw tenantUserError || new Error('Utente tenant non trovato');

  const backupPath = await backupHomepage(supabase, tenant.id);

  const categoryIds = {
    cronaca: await ensureCategory(supabase, tenant.id, {
      name: 'Cronaca',
      slug: 'cronaca',
      color: '#b91c1c',
      description: 'Notizie di territorio e servizi.',
    }),
    sport: await ensureCategory(supabase, tenant.id, {
      name: 'Sport',
      slug: 'sport',
      color: '#0f766e',
      description: 'Sport e weekend agonistico.',
    }),
    cultura: await ensureCategory(supabase, tenant.id, {
      name: 'Cultura',
      slug: 'cultura',
      color: '#7c3aed',
      description: 'Eventi e magazine.',
    }),
    economia: await ensureCategory(supabase, tenant.id, {
      name: 'Economia',
      slug: 'economia',
      color: '#92400e',
      description: 'Imprese e turismo.',
    }),
    video: await ensureCategory(supabase, tenant.id, {
      name: 'Video',
      slug: 'video',
      color: '#0f172a',
      description: 'TG e contenuti video.',
    }),
  };

  await seedArticles(supabase, tenant.id, tenantUser.user_id, categoryIds);
  await seedBreakingNews(supabase, tenant.id, tenantUser.user_id);
  await seedBanners(supabase, tenant.id);
  const homepageId = await upsertHomepage(supabase, tenant.id);

  console.log(JSON.stringify({
    ok: true,
    tenant: tenant.slug,
    homepageId,
    backupPath,
    articlesSeeded: true,
    bannersSeeded: true,
    breakingSeeded: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
