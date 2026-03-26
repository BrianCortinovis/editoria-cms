#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const TENANT_SLUG = 'valbrembana';

function id() {
  return crypto.randomUUID();
}

function spacing(top = '0', right = top, bottom = top, left = right) {
  return { top, right, bottom, left };
}

function style(overrides = {}) {
  return {
    layout: {
      display: 'block',
      padding: spacing(),
      margin: spacing(),
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

function text(label, content, overrides = {}) {
  return {
    id: id(),
    type: 'text',
    label,
    props: { content, dropCap: false, columns: 1 },
    style: style({
      layout: {
        padding: spacing(),
        margin: spacing(),
        width: '100%',
        maxWidth: '100%',
      },
      typography: {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        lineHeight: '1.6',
        color: '#0f172a',
      },
      ...overrides,
    }),
    shape: null,
    responsive: {},
    animation: null,
    children: [],
    locked: false,
    hidden: false,
  };
}

function section(label, children, overrides = {}) {
  return {
    id: id(),
    type: 'section',
    label,
    props: { tag: 'section', fullWidth: true },
    style: style({
      layout: {
        display: 'flex',
        flexDirection: 'column',
        padding: spacing('40px', '32px', '40px', '32px'),
        margin: spacing(),
        width: '100%',
        maxWidth: '100%',
      },
      ...overrides,
    }),
    shape: null,
    responsive: {},
    animation: null,
    children,
    locked: false,
    hidden: false,
  };
}

function columns(label, widths, children, overrides = {}) {
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
    style: style({
      layout: {
        display: 'flex',
        flexDirection: 'row',
        gap: '28px',
        padding: spacing(),
        margin: spacing(),
        width: '100%',
        maxWidth: '1360px',
        alignItems: 'stretch',
      },
      ...overrides,
    }),
    shape: null,
    responsive: {},
    animation: null,
    children,
    locked: false,
    hidden: false,
  };
}

function buildBlocks() {
  return [
    section('Hero stretto', [
      text('Hero title', `
        <div style="max-width:920px">
          <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#9a3412;margin-bottom:10px">Layout Lab</div>
          <h1 style="font-size:72px;line-height:.95;letter-spacing:-.04em;margin:0 0 14px 0">Sezioni miste e proporzioni diverse</h1>
          <p style="font-size:22px;line-height:1.55;color:#475569;margin:0">Pagina di test per verificare il motore builder su strutture con larghezze diverse, asimmetrie e fasce editoriali.</p>
        </div>
      `),
    ], {
      background: { type: 'color', value: '#ffffff' },
    }),

    section('Fascia 30 70', [
      columns('30-70', ['30%', '70%'], [
        section('Colonna stretta', [
          text('Colonna stretta testo', `
            <div style="border-top:2px solid #0f172a;padding-top:12px">
              <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:8px">Sidebar</div>
              <h3 style="font-size:30px;line-height:1.1;margin:0 0 12px 0">Sezione stretta</h3>
              <p style="font-size:16px;color:#475569;margin:0">Box laterale con contenuto breve per testare proporzioni sbilanciate.</p>
            </div>
          `),
        ]),
        section('Colonna larga', [
          text('Colonna larga testo', `
            <div style="border-top:3px solid #0f172a;padding-top:14px">
              <h2 style="font-size:54px;line-height:1;letter-spacing:-.03em;margin:0 0 14px 0">Colonna principale 70%</h2>
              <p style="font-size:19px;line-height:1.6;color:#475569;margin:0 0 18px 0">Qui il layout deve restare largo, leggibile e visivamente distinto dalla sidebar.</p>
              <img src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=80" alt="Paesaggio" style="width:100%;display:block;border-radius:10px" />
            </div>
          `),
        ]),
      ]),
    ], {
      background: { type: 'color', value: '#f8fafc' },
    }),

    section('Fascia 60 40', [
      columns('60-40', ['60%', '40%'], [
        section('Colonna sinistra 60', [
          text('Analisi 60', `
            <div style="border-top:1px solid #cbd5e1;padding-top:14px">
              <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:8px">Analisi</div>
              <h2 style="font-size:46px;line-height:1.05;margin:0 0 12px 0">Fascia media con contenuto editoriale più ricco</h2>
              <p style="font-size:18px;line-height:1.6;color:#475569;margin:0">Serve per capire se il motore mantiene ritmo e gerarchia anche fuori dal classico 50/50.</p>
            </div>
          `),
        ]),
        section('Colonna destra 40', [
          text('Box destra 40', `
            <div style="border:1px solid #cbd5e1;border-radius:12px;padding:18px;background:#fff">
              <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:8px">Dati</div>
              <h3 style="font-size:28px;line-height:1.1;margin:0 0 8px 0">Seconda colonna</h3>
              <p style="font-size:15px;color:#475569;margin:0">Elemento secondario da affiancare a contenuto principale.</p>
            </div>
          `),
        ]),
      ]),
    ]),

    section('Fascia 20 60 20', [
      columns('20-60-20', ['20%', '60%', '20%'], [
        section('Rail sinistra', [
          text('Rail 1', '<div style="font-size:14px;color:#475569">Rail sinistra</div>'),
        ]),
        section('Centro largo', [
          text('Centro largo', `
            <div style="text-align:center">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#9a3412;margin-bottom:8px">Focus</div>
              <h2 style="font-size:56px;line-height:1;letter-spacing:-.03em;margin:0 0 12px 0">Centro largo 60%</h2>
              <p style="font-size:20px;line-height:1.6;color:#475569;margin:0 auto;max-width:44rem">Questa fascia serve a verificare l&apos;equilibrio di una composizione molto editoriale.</p>
            </div>
          `),
        ]),
        section('Rail destra', [
          text('Rail 2', '<div style="font-size:14px;color:#475569">Rail destra</div>'),
        ]),
      ]),
    ], {
      background: { type: 'color', value: '#ffffff' },
    }),

    section('Fascia finale 25 25 50', [
      columns('25-25-50', ['25%', '25%', '50%'], [
        section('Box 1', [text('Box 1 testo', '<h3 style="margin:0 0 8px 0">25%</h3><p style="margin:0;color:#475569">Prima colonna stretta.</p>')], {
          background: { type: 'color', value: '#f8fafc' },
        }),
        section('Box 2', [text('Box 2 testo', '<h3 style="margin:0 0 8px 0">25%</h3><p style="margin:0;color:#475569">Seconda colonna stretta.</p>')], {
          background: { type: 'color', value: '#eef2ff' },
        }),
        section('Box 3', [text('Box 3 testo', '<h3 style="margin:0 0 8px 0">50%</h3><p style="margin:0;color:#475569">Terza colonna larga per chiudere il test con una coda più generosa.</p>')], {
          background: { type: 'color', value: '#fff7ed' },
        }),
      ]),
    ], {
      background: { type: 'color', value: '#ffffff' },
    }),
  ];
}

async function main() {
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
    title: 'Layout misto sezioni',
    slug: 'layout-misto-sezioni',
    page_type: 'custom',
    is_published: true,
    meta: {
      title: 'Layout misto sezioni',
      description: 'Pagina di test con sezioni di misure diverse',
      canonicalPath: '/layout-misto-sezioni',
    },
    blocks: buildBlocks(),
  };

  const { data: existing } = await supabase
    .from('site_pages')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('slug', payload.slug)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from('site_pages').update(payload).eq('id', existing.id);
    if (error) throw error;
    console.log(JSON.stringify({ pageId: existing.id, slug: payload.slug, mode: 'updated' }, null, 2));
    return;
  }

  const { data: page, error } = await supabase.from('site_pages').insert(payload).select('id').single();
  if (error || !page) throw error || new Error('Creazione pagina fallita');
  console.log(JSON.stringify({ pageId: page.id, slug: payload.slug, mode: 'created' }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
