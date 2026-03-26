#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'valbrembana';
const EMAIL = 'codex-ai-test+cms@valbrembana.local';
const PASSWORD = 'CodexTest123!';
const PAGE_SLUG = 'motore-render-stress';
const PAGE_TITLE = 'Stress Test Motore Render';
const SCREENSHOT_DIR = path.resolve('tmp/visual-check-stress');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function id() {
  return crypto.randomUUID();
}

function spacing(all = '0') {
  return { top: all, right: all, bottom: all, left: all };
}

function sides(top, right = top, bottom = top, left = right) {
  return { top, right, bottom, left };
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

function sectionBlock(label, children, style = {}, extra = {}) {
  return {
    id: id(),
    type: 'section',
    label,
    props: {
      tag: 'section',
      fullWidth: true,
      ...(extra.props || {}),
    },
    style: baseStyle({
      layout: {
        display: 'flex',
        flexDirection: 'column',
        padding: sides('32px'),
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
        ...style.layout,
      },
      ...style,
    }),
    shape: extra.shape ?? null,
    responsive: extra.responsive || {},
    animation: extra.animation || null,
    children,
    locked: false,
    hidden: false,
  };
}

function columnsBlock(label, widths, children, style = {}, extra = {}) {
  return {
    id: id(),
    type: 'columns',
    label,
    props: {
      columnCount: widths.length,
      columnWidths: widths,
      gap: '28px',
      stackOnMobile: true,
      ...(extra.props || {}),
    },
    style: baseStyle({
      layout: {
        display: 'flex',
        flexDirection: 'row',
        gap: '28px',
        padding: spacing('0'),
        margin: spacing('0'),
        width: '100%',
        maxWidth: '1320px',
        alignItems: 'stretch',
        ...style.layout,
      },
      ...style,
    }),
    shape: extra.shape ?? null,
    responsive: extra.responsive || {},
    animation: extra.animation || null,
    children,
    locked: false,
    hidden: false,
  };
}

function textBlock(label, content, style = {}, extra = {}) {
  return {
    id: id(),
    type: 'text',
    label,
    props: {
      content,
      dropCap: false,
      columns: 1,
      ...(extra.props || {}),
    },
    style: baseStyle({
      layout: {
        padding: spacing('0'),
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
        ...style.layout,
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '18px',
        lineHeight: '1.7',
        color: '#0f172a',
        ...style.typography,
      },
      ...style,
    }),
    shape: extra.shape ?? null,
    responsive: extra.responsive || {},
    animation: extra.animation || null,
    children: [],
    locked: false,
    hidden: false,
  };
}

function slideshowBlock() {
  return {
    id: id(),
    type: 'slideshow',
    label: 'Slideshow hero',
    props: {
      slides: [
        {
          id: 'slide-1',
          image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
          title: 'Paesaggi in apertura',
          description: 'Slideshow reale del motore per controllare overlay, testi e controlli.',
          overlay: { enabled: true, color: 'rgba(15,23,42,0.35)', position: 'bottom-left' },
          buttons: [{ id: 'btn-a', text: 'Guarda', url: '#', style: 'primary' }],
          textStyle: { titleSize: '34px', titleWeight: '800', descSize: '16px', color: '#ffffff' },
        },
        {
          id: 'slide-2',
          image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=80',
          title: 'Seconda immagine',
          description: 'Transizioni e testo del blocco slideshow in preview e sito reale.',
          overlay: { enabled: true, color: 'rgba(0,0,0,0.28)', position: 'center' },
          buttons: [],
          textStyle: { titleSize: '34px', titleWeight: '800', descSize: '16px', color: '#ffffff' },
        },
      ],
      autoplay: true,
      interval: 3500,
      transition: 'fade',
      showDots: true,
      showArrows: true,
      height: '460px',
      objectFit: 'cover',
    },
    style: baseStyle({
      layout: {
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      },
      border: {
        radius: '24px',
      },
      shadow: '0 18px 50px rgba(15,23,42,0.18)',
    }),
    shape: null,
    responsive: {},
    animation: {
      trigger: 'entrance',
      effect: 'fade-in',
      duration: 700,
      delay: 0,
      easing: 'ease-out',
    },
    children: [],
    locked: false,
    hidden: false,
  };
}

function navigationBlock() {
  return {
    id: id(),
    type: 'navigation',
    label: 'Topbar stress',
    props: {
      mode: 'custom',
      logoText: 'VALBREMBANA LAB',
      logoUrl: '',
      items: [
        { id: 'm1', label: 'Home', url: '/' },
        { id: 'm2', label: 'Territorio', url: '/territorio' },
        { id: 'm3', label: 'Video', url: '/video' },
        { id: 'm4', label: 'Analisi', url: '/analisi' },
        { id: 'm5', label: 'Cultura', url: '/cultura' },
      ],
      layout: 'horizontal',
      variant: 'underline',
      justify: 'space-between',
      itemGap: 22,
      ctaText: 'Abbonati',
      ctaUrl: '/abbonati',
    },
    style: baseStyle({
      layout: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: sides('18px', '28px'),
      },
      background: {
        type: 'color',
        value: 'rgba(255,255,255,0.82)',
      },
      border: {
        width: '0 0 1px 0',
        style: 'solid',
        color: 'rgba(148,163,184,0.45)',
      },
      effects: {
        glassmorphism: {
          enabled: true,
          blur: 18,
          saturation: 160,
          bgOpacity: 0.75,
          bgColor: '#ffffff',
          borderOpacity: 0.25,
        },
      },
    }),
    shape: null,
    responsive: {},
    animation: null,
    children: [],
    locked: false,
    hidden: false,
  };
}

function buildStressBlocks() {
  const floatingBadge = textBlock(
    'Badge sovrapposto',
    '<div style="display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:rgba(15,23,42,0.9);color:#fff;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Overlay attivo</div>',
    {
      layout: {
        position: 'absolute',
        width: 'auto',
        maxWidth: 'fit-content',
        margin: { top: '-26px', right: '0', bottom: '0', left: '42px' },
        zIndex: 8,
      },
      customCss: 'box-shadow: 0 16px 40px rgba(15,23,42,.24);',
    }
  );

  const heroIntro = sectionBlock(
    'Hero editoriale grafico',
    [
      floatingBadge,
      columnsBlock('Hero split 34-66', ['34%', '66%'], [
        textBlock(
          'Colonna copy hero',
          `
          <div>
            <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#e2e8f0;margin-bottom:14px">Stress rendering page</div>
            <h1 style="font-family:Fraunces, Georgia, serif;font-size:72px;line-height:0.92;letter-spacing:-.05em;color:#fff;margin:0 0 18px 0">Forme, sfumature e overlay reali</h1>
            <p style="font-size:19px;line-height:1.7;color:rgba(255,255,255,0.84);margin:0 0 18px 0">Pagina di collaudo costruita con blocchi veri del builder per verificare motore grafico, preview e sito pubblico.</p>
            <p style="font-size:14px;line-height:1.7;color:#cbd5e1;margin:0">Controlliamo clip-path, divider, custom CSS, slideshow, glass, scroll gradient e sovrapposizioni.</p>
          </div>
          `,
          {
            layout: { maxWidth: '560px' },
          },
          {
            animation: {
              trigger: 'entrance',
              effect: 'slide-up',
              duration: 800,
              delay: 60,
              easing: 'ease-out',
            },
          }
        ),
        slideshowBlock(),
      ]),
    ],
    {
      layout: {
        position: 'relative',
        padding: sides('70px', '44px', '90px', '44px'),
      },
      background: {
        type: 'color',
        value: '#0f172a',
        advancedGradient: {
          type: 'linear',
          angle: 122,
          animated: true,
          animationDuration: 10000,
          hoverDriven: false,
          scrollDriven: false,
          stops: [
            { color: '#0f172a', position: 0, opacity: 1 },
            { color: '#1d4ed8', position: 48, opacity: 0.95 },
            { color: '#0ea5e9', position: 100, opacity: 0.9 },
          ],
        },
      },
      customCss: `
        isolation: isolate;
      `,
    },
    {
      shape: {
        type: 'clip-path',
        value: 'polygon(0 0, 100% 0, 100% 88%, 82% 100%, 0 94%)',
        topDivider: {
          shape: 'wave',
          height: 56,
          flip: false,
          invert: false,
          color: '#ffffff',
          opacity: 0.18,
        },
        bottomDivider: {
          shape: 'curve',
          height: 74,
          flip: false,
          invert: true,
          color: '#f8fafc',
          opacity: 1,
        },
      },
      responsive: {
        mobile: {
          layout: {
            padding: sides('36px', '20px', '54px', '20px'),
          },
        },
      },
    }
  );

  const featureMatrix = sectionBlock(
    'Feature matrix',
    [
      columnsBlock('Matrix 25-50-25', ['25%', '50%', '25%'], [
        textBlock(
          'Colonna sinistra gradienti',
          `
          <div>
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#475569;margin-bottom:10px">Gradienti</div>
            <h3 style="font-family:Fraunces, Georgia, serif;font-size:32px;line-height:1.05;margin:0 0 12px 0">Sezioni di misure diverse</h3>
            <p style="margin:0;color:#334155">Questa colonna serve a controllare che i tagli 25/50/25 restino coerenti anche con contenuti lunghi.</p>
          </div>
          `,
          {
            border: {
              radius: '24px',
              width: '1px',
              style: 'solid',
              color: 'rgba(148,163,184,0.22)',
            },
            background: {
              type: 'color',
              value: 'rgba(255,255,255,0.72)',
            },
            layout: { padding: sides('26px') },
            effects: {
              glassmorphism: {
                enabled: true,
                blur: 10,
                saturation: 140,
                bgOpacity: 0.58,
                bgColor: '#ffffff',
                borderOpacity: 0.18,
              },
            },
          }
        ),
        textBlock(
          'Centro con custom css e grain',
          `
          <div>
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#0f172a;margin-bottom:10px">Motore grafico</div>
            <h3 style="font-family:Fraunces, Georgia, serif;font-size:42px;line-height:1.02;margin:0 0 14px 0;color:#020617">Centro con texture e overlay</h3>
            <p style="font-size:17px;line-height:1.72;color:#0f172a;margin:0 0 14px 0">Qui controlliamo insieme <strong>grain</strong>, <strong>noise</strong>, background gradient avanzato e CSS custom scoped sul blocco reale.</p>
            <p style="font-size:15px;line-height:1.72;color:#1e293b;margin:0">Se il motore è corretto, editor, preview e sito devono mantenere struttura, texture e gerarchie visive.</p>
          </div>
          `,
          {
            layout: {
              padding: sides('34px'),
            },
            background: {
              type: 'gradient',
              value: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(226,232,240,0.9))',
              advancedGradient: {
                type: 'mesh',
                angle: 35,
                scrollDriven: true,
                animated: false,
                hoverDriven: false,
                stops: [
                  { color: '#ffffff', position: 0, opacity: 1 },
                  { color: '#cbd5e1', position: 58, opacity: 0.95 },
                  { color: '#bfdbfe', position: 100, opacity: 0.9 },
                ],
              },
            },
            border: {
              radius: '30px',
              width: '1px',
              style: 'solid',
              color: 'rgba(148,163,184,0.35)',
            },
            shadow: '0 22px 70px rgba(15,23,42,0.14)',
            customCss: `
              overflow: hidden;
            `,
            effects: {
              grain: { enabled: true, opacity: 0.12, size: 2 },
              noise: { enabled: true, opacity: 0.08, frequency: 0.7, type: 'fractalNoise' },
            },
          },
          {
            animation: {
              trigger: 'scroll',
              effect: 'slide-up',
              duration: 720,
              delay: 0,
              easing: 'ease-out',
            },
          }
        ),
        textBlock(
          'Colonna destra forme',
          `
          <div>
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#475569;margin-bottom:10px">Forme</div>
            <h3 style="font-family:Fraunces, Georgia, serif;font-size:30px;line-height:1.08;margin:0 0 12px 0">Clip path e divider</h3>
            <p style="margin:0;color:#334155">Il blocco hero sopra usa una forma custom e divider veri del motore, non un SVG hardcoded fuori sistema.</p>
          </div>
          `,
          {
            border: {
              radius: '24px',
              width: '1px',
              style: 'solid',
              color: 'rgba(148,163,184,0.22)',
            },
            background: {
              type: 'color',
              value: 'rgba(255,255,255,0.72)',
            },
            layout: { padding: sides('26px') },
          }
        ),
      ]),
    ],
    {
      layout: {
        padding: sides('48px', '34px', '54px', '34px'),
      },
      background: {
        type: 'color',
        value: '#f8fafc',
      },
    }
  );

  const overlapSection = sectionBlock(
    'Sezione overlap',
    [
      textBlock(
        'Card overlap principale',
        `
        <div>
          <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#1d4ed8;margin-bottom:12px">Sovrapposizioni</div>
          <h3 style="font-family:Fraunces, Georgia, serif;font-size:44px;line-height:1.02;margin:0 0 14px 0">Card con badge flottante</h3>
          <p style="font-size:17px;line-height:1.72;color:#334155;margin:0">Qui il blocco lavora con posizione relativa della sezione e overlay assoluto. Serve a controllare z-index e clipping.</p>
        </div>
        `,
        {
          layout: {
            padding: sides('34px'),
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            maxWidth: '960px',
          },
          background: {
            type: 'color',
            value: 'rgba(255,255,255,0.88)',
          },
          border: {
            radius: '28px',
            width: '1px',
            style: 'solid',
            color: 'rgba(148,163,184,0.28)',
          },
          shadow: '0 28px 60px rgba(15,23,42,0.12)',
          effects: {
            glassmorphism: {
              enabled: true,
              blur: 14,
              saturation: 160,
              bgOpacity: 0.72,
              bgColor: '#ffffff',
              borderOpacity: 0.22,
            },
          },
        },
        {
          shape: {
            type: 'clip-path',
            value: 'polygon(0 0, 100% 0, 100% 85%, 92% 100%, 0 100%)',
          },
        }
      ),
      textBlock(
        'Badge assoluto inferiore',
        '<div style="display:inline-flex;align-items:center;padding:14px 18px;border-radius:18px;background:#0f172a;color:#fff;font-size:14px;font-weight:700">Z-index e overlap test</div>',
        {
          layout: {
            position: 'absolute',
            width: 'auto',
            maxWidth: 'fit-content',
            margin: { top: '220px', right: '0', bottom: '0', left: '68px' },
            zIndex: 9,
          },
          shadow: '0 18px 48px rgba(15,23,42,0.28)',
        }
      ),
    ],
    {
      layout: {
        position: 'relative',
        padding: sides('70px', '34px', '80px', '34px'),
        minHeight: '420px',
      },
      background: {
        type: 'image',
        value: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?auto=format&fit=crop&w=1600&q=80',
        overlay: 'linear-gradient(135deg, rgba(15,23,42,0.35), rgba(59,130,246,0.14))',
        size: 'cover',
        position: 'center',
        repeat: 'no-repeat',
        parallax: true,
      },
      customCss: `
        background-blend-mode: overlay;
      `,
    }
  );

  return [navigationBlock(), heroIntro, featureMatrix, overlapSection];
}

async function seedStressPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', TENANT_SLUG)
    .single();

  if (tenantError || !tenant) throw tenantError || new Error('Tenant non trovato');

  const payload = {
    tenant_id: tenant.id,
    title: PAGE_TITLE,
    slug: PAGE_SLUG,
    page_type: 'custom',
    is_published: true,
    meta: {
      title: 'Stress test render motore',
      description: 'Pagina locale di collaudo per gradienti, forme, divider, slideshow e overlay.',
      canonicalPath: `/${PAGE_SLUG}`,
      builder: {
        pageBackground: {
          type: 'slideshow',
          images: [
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
          ],
          overlay: 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(248,250,252,0.94))',
          size: 'cover',
          position: 'center',
          repeat: 'no-repeat',
          fixed: false,
          customCss: ':scope { background-color: #f8fafc; }',
          minHeight: '100%',
          slideshowDurationMs: 14000,
        },
      },
    },
    blocks: buildStressBlocks(),
  };

  const { data: existingPage } = await supabase
    .from('site_pages')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('slug', PAGE_SLUG)
    .maybeSingle();

  if (existingPage?.id) {
    const { error } = await supabase.from('site_pages').update(payload).eq('id', existingPage.id);
    if (error) throw error;
    return { pageId: existingPage.id, tenantSlug: tenant.slug };
  }

  const { data: page, error } = await supabase.from('site_pages').insert(payload).select('id').single();
  if (error || !page) throw error || new Error('Pagina non creata');
  return { pageId: page.id, tenantSlug: tenant.slug };
}

async function login(page) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent?.includes('Accedi'));
      if (!(button instanceof HTMLButtonElement)) throw new Error('Bottone login non trovato');
      button.click();
    }),
  ]);
}

async function readPreviewFrame(page) {
  await page.waitForFunction(
    () => !document.body.innerText.includes('Rendering reale della pagina...'),
    { timeout: 45000 }
  );
  await page.waitForSelector('iframe[title="Preview pagina"]', { timeout: 45000 });
  const frameHandle = await page.$('iframe[title="Preview pagina"]');
  const frame = await frameHandle?.contentFrame();
  if (!frame) throw new Error('Preview iframe non disponibile');
  await frame.waitForSelector('body');
  return frame;
}

async function main() {
  const seeded = await seedStressPage();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const editorPage = await browser.newPage();
  editorPage.setDefaultTimeout(90000);

  try {
    await editorPage.setViewport({ width: 1600, height: 1800, deviceScaleFactor: 1 });
    await login(editorPage);
    await editorPage.goto(`${BASE_URL}/dashboard/editor?page=${seeded.pageId}`, { waitUntil: 'networkidle2' });
    await editorPage.waitForSelector('[data-block-id]', { timeout: 45000 });

    const editorText = await editorPage.evaluate(() => document.body.innerText);
    const editorBlockCount = await editorPage.$$eval('[data-block-id]', (nodes) => nodes.length);

    await editorPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'editor-canvas.png'),
      fullPage: true,
    });

    const verify = await editorPage.evaluate(async (pageId) => {
      const response = await fetch('/api/dev/editor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      });
      return response.json();
    }, seeded.pageId);

    await editorPage.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent?.includes('Preview'));
      if (!(button instanceof HTMLButtonElement)) throw new Error('Bottone Preview non trovato');
      button.click();
    });

    const previewFrame = await readPreviewFrame(editorPage);
    await previewFrame.waitForFunction(
      () =>
        document.body.innerText.includes('Forme, sfumature e overlay reali') &&
        document.body.innerText.includes('Centro con texture e overlay'),
      { timeout: 45000 }
    );
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const previewText = await previewFrame.evaluate(() => document.body.innerText);

    await editorPage.evaluate(() => {
      const frame = document.querySelector('.sb-preview-frame');
      const iframe = document.querySelector('iframe[title="Preview pagina"]');
      if (frame) {
        frame.style.width = '1280px';
        frame.style.minHeight = '2200px';
        frame.style.height = '2200px';
      }
      if (iframe) {
        iframe.style.height = '2200px';
        iframe.style.minHeight = '2200px';
      }
    });

    const previewBodyHandle = await previewFrame.$('body');
    if (!previewBodyHandle) throw new Error('Body preview non trovato');
    await previewBodyHandle.screenshot({
      path: path.join(SCREENSHOT_DIR, 'preview-render.png'),
    });

    const publicPage = await browser.newPage();
    publicPage.setDefaultTimeout(90000);
    await publicPage.setViewport({ width: 1280, height: 2200, deviceScaleFactor: 1 });
    await publicPage.goto(`${BASE_URL}/site/${seeded.tenantSlug}/${PAGE_SLUG}`, { waitUntil: 'networkidle2' });
    const publicText = await publicPage.evaluate(() => document.body.innerText);
    await publicPage.screenshot({
      path: path.join(SCREENSHOT_DIR, 'public-render.png'),
      fullPage: false,
    });

    const markers = [
      'VALBREMBANA LAB',
      'Forme, sfumature e overlay reali',
      'Paesaggi in apertura',
      'Centro con texture e overlay',
      'Z-index e overlap test',
    ];

    const result = {
      pageId: seeded.pageId,
      slug: PAGE_SLUG,
      screenshotDir: SCREENSHOT_DIR,
      editorBlockCount,
      verify,
      markers: markers.map((marker) => ({
        marker,
        inEditor: editorText.includes(marker),
        inPreview: previewText.includes(marker),
        inPublicPage: publicText.includes(marker),
      })),
    };

    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[error]', error);
  process.exit(1);
});
