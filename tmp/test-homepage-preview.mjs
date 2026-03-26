#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'valbrembana';
const EMAIL = 'codex-ai-test+cms@valbrembana.local';
const PASSWORD = 'CodexTest123!';
const SCREENSHOT_DIR = path.resolve('tmp/visual-check');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function id() {
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

function textBlock(label, content, style = {}) {
  return {
    id: id(),
    type: 'text',
    label,
    props: {
      content,
      dropCap: false,
      columns: 1,
    },
    style: baseStyle({
      layout: {
        padding: spacing('0'),
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
      },
      typography: {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        lineHeight: '1.6',
        color: '#111827',
      },
      ...style,
    }),
    shape: null,
    responsive: {},
    animation: null,
    children: [],
    locked: false,
    hidden: false,
  };
}

function sectionBlock(label, children, style = {}) {
  return {
    id: id(),
    type: 'section',
    label,
    props: {
      tag: 'section',
      fullWidth: true,
    },
    style: baseStyle({
      layout: {
        display: 'flex',
        flexDirection: 'column',
        padding: { top: '28px', right: '32px', bottom: '28px', left: '32px' },
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
      },
      ...style,
    }),
    shape: null,
    responsive: {},
    animation: null,
    children,
    locked: false,
    hidden: false,
  };
}

function columnsBlock(label, widths, children, style = {}) {
  return {
    id: id(),
    type: 'columns',
    label,
    props: {
      columnCount: widths.length,
      columnWidths: widths,
      gap: '28px',
      stackOnMobile: true,
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
      },
      ...style,
    }),
    shape: null,
    responsive: {},
    animation: null,
    children,
    locked: false,
    hidden: false,
  };
}

function navigationBlock() {
  return {
    id: id(),
    type: 'navigation',
    label: 'Header testata',
    props: {
      mode: 'custom',
      logoText: 'VALBREMBANA WEB',
      logoUrl: '',
      items: [
        { id: 'm1', label: 'Home', url: '/' },
        { id: 'm2', label: 'Cronaca', url: '/cronaca' },
        { id: 'm3', label: 'Sport', url: '/sport' },
        { id: 'm4', label: 'Cultura', url: '/cultura' },
        { id: 'm5', label: 'Video', url: '/video' },
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
    style: baseStyle({
      layout: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: { top: '18px', right: '28px', bottom: '18px', left: '28px' },
        margin: spacing('0'),
        width: '100%',
        maxWidth: '100%',
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
    }),
    shape: null,
    responsive: {},
    animation: null,
    children: [],
    locked: false,
    hidden: false,
  };
}

function videoBlock() {
  return {
    id: id(),
    type: 'video',
    label: 'TG ORE 20',
    props: {
      source: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'TG ORE 20',
      caption: 'Edizione serale della testata',
      aspectRatio: '16/9',
    },
    style: baseStyle({
      layout: {
        display: 'block',
        padding: spacing('0'),
        margin: { top: '16px', right: '0', bottom: '0', left: '0' },
        width: '100%',
        maxWidth: '100%',
      },
      border: {
        radius: '10px',
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

function buildHomepageBlocks() {
  const leftCol = sectionBlock('Colonna sinistra', [
    textBlock(
      'Notizie sinistra',
      `
      <div style="border-top:2px solid #0f172a;padding-top:12px">
        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:10px">In primo piano</div>
        <h3 style="font-size:28px;line-height:1.15;margin:0 0 14px 0">Cronaca di Valle</h3>
        <p style="font-size:15px;color:#475569;margin:0 0 18px 0">Aggiornamenti rapidi su viabilità, servizi e comunità locali.</p>
        <h4 style="font-size:22px;line-height:1.2;margin:0 0 10px 0">Traffico e territorio</h4>
        <p style="font-size:15px;color:#475569;margin:0">Cantieri, mobilità e lavori pubblici monitorati in tempo reale.</p>
      </div>
      `
    ),
  ]);

  const centerCol = sectionBlock('Colonna centrale', [
    textBlock(
      'Hero centrale',
      `
      <div style="border-top:3px solid #0f172a;padding-top:16px">
        <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#9a3412;margin-bottom:12px">Edizione digitale</div>
        <h1 style="font-size:64px;line-height:0.95;letter-spacing:-.04em;margin:0 0 16px 0;font-weight:700">Apertura Val Brembana</h1>
        <p style="font-size:20px;line-height:1.55;color:#334155;max-width:52rem;margin:0 0 20px 0">Una homepage di test costruita con blocchi reali del builder per verificare fedeltà tra editor, anteprima ed esportazione HTML.</p>
        <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" alt="Hero" style="width:100%;height:auto;border-radius:8px;display:block" />
      </div>
      `,
      {
        typography: {
          fontFamily: 'Georgia, serif',
        },
      }
    ),
  ]);

  const rightCol = sectionBlock('Colonna destra', [
    textBlock(
      'Notizie destra',
      `
      <div style="border-top:2px solid #0f172a;padding-top:12px">
        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:10px">Approfondimenti</div>
        <h3 style="font-size:28px;line-height:1.15;margin:0 0 14px 0">Sport in Primo Piano</h3>
        <p style="font-size:15px;color:#475569;margin:0 0 18px 0">Weekend, classifiche e racconti dalle squadre del territorio.</p>
        <h4 style="font-size:22px;line-height:1.2;margin:0 0 10px 0">Cultura e comunità</h4>
        <p style="font-size:15px;color:#475569;margin:0">Eventi, festival e storie locali in un formato da testata moderna.</p>
      </div>
      `
    ),
  ]);

  return [
    navigationBlock(),
    sectionBlock(
      'Pacchetto principale',
      [
        columnsBlock('Griglia homepage 24-52-24', ['24%', '52%', '24%'], [leftCol, centerCol, rightCol]),
      ],
      {
        background: { type: 'color', value: '#ffffff' },
      }
    ),
    sectionBlock(
      'Fascia TG',
      [
        textBlock(
          'Titolo TG',
          `
          <div>
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:8px">Video redazione</div>
            <h2 style="font-size:42px;line-height:1.05;letter-spacing:-.03em;margin:0">TG ORE 20</h2>
          </div>
          `
        ),
        videoBlock(),
      ],
      {
        background: { type: 'color', value: '#f8fafc' },
      }
    ),
    sectionBlock(
      'Editoriali finali',
      [
        columnsBlock('Editoriali finali', ['50%', '50%'], [
          textBlock(
            'Editoriale 1',
            `
            <div style="border-top:1px solid #cbd5e1;padding-top:14px">
              <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:10px">Analisi</div>
              <h3 style="font-size:34px;line-height:1.08;margin:0 0 12px 0">Territorio e innovazione</h3>
              <p style="font-size:17px;line-height:1.6;color:#475569;margin:0">Una sezione editoriale costruita per testare la resa dei blocchi di testo su più colonne.</p>
            </div>
            `
          ),
          textBlock(
            'Editoriale 2',
            `
            <div style="border-top:1px solid #cbd5e1;padding-top:14px">
              <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:10px">Commento</div>
              <h3 style="font-size:34px;line-height:1.08;margin:0 0 12px 0">Redazione digitale</h3>
              <p style="font-size:17px;line-height:1.6;color:#475569;margin:0">L&apos;obiettivo di questo test è verificare un homepage newspaper-like con blocchi veri del CMS.</p>
            </div>
            `
          ),
        ]),
      ]
    ),
  ];
}

async function seedHomepage() {
  console.log('[seed] preparo homepage test');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', TENANT_SLUG)
    .single();

  if (tenantError || !tenant) throw tenantError || new Error('Tenant non trovato');

  const { data: existingPage } = await supabase
    .from('site_pages')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('slug', 'homepage')
    .maybeSingle();

  const payload = {
    tenant_id: tenant.id,
    title: 'Homepage',
    slug: 'homepage',
    page_type: 'homepage',
    is_published: true,
    meta: {
      title: 'VALBREMBANA WEB',
      description: 'Homepage test giornalistica moderna con TG e griglia 24/52/24',
      canonicalPath: '/',
    },
    blocks: buildHomepageBlocks(),
  };

  if (existingPage?.id) {
    const { error } = await supabase.from('site_pages').update(payload).eq('id', existingPage.id);
    if (error) throw error;
    console.log(`[seed] homepage aggiornata ${existingPage.id}`);
    return { pageId: existingPage.id, tenantSlug: tenant.slug };
  }

  const { data: page, error } = await supabase.from('site_pages').insert(payload).select('id').single();
  if (error || !page) throw error || new Error('Pagina non creata');
  console.log(`[seed] homepage creata ${page.id}`);
  return { pageId: page.id, tenantSlug: tenant.slug };
}

async function login(page) {
  console.log('[login] apro login');
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
  console.log('[login] login completato');
}

async function readPreviewText(page) {
  console.log('[preview] attendo iframe preview');
  await page.waitForSelector('iframe[title="Preview pagina"]', { timeout: 30000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Rendering reale della pagina...'), { timeout: 45000 }).catch(() => null);
  const frameHandle = await page.$('iframe[title="Preview pagina"]');
  const frame = await frameHandle?.contentFrame();
  if (!frame) throw new Error('Preview iframe non disponibile');
  await frame.waitForSelector('body');
  console.log('[preview] iframe pronto');
  return frame.evaluate(() => document.body.innerText);
}

async function captureEditorCanvas(page) {
  const canvasHandle =
    (await page.$('[data-block-id]')) ||
    (await page.$('main')) ||
    (await page.$('body'));

  if (!canvasHandle) {
    throw new Error('Canvas editor non disponibile per screenshot');
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'editor-canvas.png'),
    fullPage: true,
  });
}

async function capturePreviewScreenshot(page) {
  await page.evaluate(() => {
    const frame = document.querySelector('.sb-preview-frame');
    const iframe = document.querySelector('iframe[title="Preview pagina"]');
    if (frame) {
      frame.style.width = '1280px';
      frame.style.minHeight = '1600px';
      frame.style.height = '1600px';
    }
    if (iframe) {
      iframe.style.height = '1600px';
      iframe.style.minHeight = '1600px';
    }
  });

  const previewHandle = await page.$('.sb-preview-frame');
  if (!previewHandle) {
    throw new Error('Container preview non trovato');
  }

  await previewHandle.screenshot({
    path: path.join(SCREENSHOT_DIR, 'preview-render.png'),
  });
}

async function capturePublicScreenshot(page) {
  await page.setViewport({ width: 1280, height: 1600, deviceScaleFactor: 1 });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'public-render.png'),
    fullPage: false,
  });
}

async function main() {
  const seeded = await seedHomepage();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(90000);

  try {
    await page.setViewport({ width: 1600, height: 1800, deviceScaleFactor: 1 });
    await login(page);
    console.log('[editor] apro editor');
    await page.goto(`${BASE_URL}/dashboard/editor?page=${seeded.pageId}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-block-id]', { timeout: 45000 });
    console.log('[editor] blocchi caricati');

    const editorBlockCount = await page.$$eval('[data-block-id]', (nodes) => nodes.length);
    const editorText = await page.evaluate(() => document.body.innerText);
    await captureEditorCanvas(page);

    console.log('[editor] apro preview');
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent?.includes('Preview'));
      if (!(button instanceof HTMLButtonElement)) throw new Error('Bottone Preview non trovato');
      button.click();
    });

    const previewText = await readPreviewText(page);
    await capturePreviewScreenshot(page);

    const publicPage = await browser.newPage();
    publicPage.setDefaultTimeout(90000);
    await publicPage.setViewport({ width: 1280, height: 1600, deviceScaleFactor: 1 });
    console.log('[public] apro sito pubblico');
    await publicPage.goto(`${BASE_URL}/site/${seeded.tenantSlug}`, { waitUntil: 'networkidle2' });
    const publicText = await publicPage.evaluate(() => document.body.innerText);
    await capturePublicScreenshot(publicPage);

    const markers = [
      'VALBREMBANA WEB',
      'Apertura Val Brembana',
      'Cronaca di Valle',
      'Sport in Primo Piano',
      'TG ORE 20',
    ];

    const result = {
      pageId: seeded.pageId,
      screenshotDir: SCREENSHOT_DIR,
      editorBlockCount,
      markers: markers.map((marker) => ({
        marker,
        inEditor: editorText.includes(marker),
        inPreview: previewText.includes(marker),
        inPublicPage: publicText.includes(marker),
      })),
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[error]', error);
  console.error(error);
  process.exit(1);
});
