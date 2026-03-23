import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function readSecret(name) {
  const text = fs.readFileSync(new URL('../setup-secrets.sh', import.meta.url), 'utf8');
  const match = text.match(new RegExp(`${name} --body "([^"]+)"`));
  return match ? match[1] : '';
}

function uid() {
  return crypto.randomUUID();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isoHoursFromNow(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function isoHoursAgo(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

function layoutStyle(overrides = {}) {
  return {
    border: {},
    layout: {
      width: '100%',
      maxWidth: '100%',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      ...overrides,
    },
    background: { type: 'none', value: '' },
    typography: {},
  };
}

function block(type, label, props = {}, style = {}, extra = {}) {
  return {
    id: uid(),
    type,
    label,
    props,
    shape: null,
    style,
    hidden: false,
    locked: false,
    children: [],
    animation: null,
    responsive: {},
    ...extra,
  };
}

function textBlock(label, content, style = {}, extra = {}) {
  return block(
    'text',
    label,
    { content },
    {
      ...layoutStyle({
        display: 'block',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
      }),
      ...style,
    },
    extra
  );
}

function sectionBlock(label, children, style = {}, props = {}) {
  return {
    ...block(
      'section',
      label,
      { tag: 'section', fullWidth: true, ...props },
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          padding: { top: '48px', right: '0', bottom: '48px', left: '0' },
        }),
        ...style,
      }
    ),
    children,
  };
}

function columnsBlock(label, children, widths, gap = '24px', style = {}) {
  return {
    ...block(
      'columns',
      label,
      {
        gap,
        columnCount: children.length,
        columnWidths: widths,
        stackOnMobile: true,
      },
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'row',
          gap,
        }),
        ...style,
      }
    ),
    children,
  };
}

function articleGridBlock(label, params, props = {}, style = {}) {
  return block(
    'article-grid',
    label,
    {
      limit: 4,
      columns: 2,
      showDate: true,
      showImage: true,
      showAuthor: true,
      showExcerpt: true,
      showCategory: true,
      ...props,
    },
    {
      ...layoutStyle({
        display: 'grid',
        gap: style?.layout?.gap || '18px',
      }),
      ...style,
    },
    {
      dataSource: {
        endpoint: 'articles',
        params,
      },
    }
  );
}

function categoryNavBlock(label, props = {}, style = {}) {
  return block(
    'category-nav',
    label,
    {
      style: 'underline',
      showCount: false,
      colorMode: 'neutral',
      ...props,
    },
    {
      ...layoutStyle({
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
      }),
      ...style,
    },
    {
      dataSource: {
        endpoint: 'categories',
        params: {},
      },
    }
  );
}

function sidebarWidgetsBlock(label, widgets, style = {}) {
  return block(
    'sidebar',
    label,
    {
      widgets,
      position: 'right',
      sticky: false,
    },
    {
      ...layoutStyle({
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        maxWidth: '100%',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
      }),
      ...style,
    }
  );
}

function bannerZoneBlock(label, position, style = {}, props = {}) {
  return block(
    'banner-zone',
    label,
    {
      position,
      fallbackHtml: '',
      ...props,
    },
    {
      ...layoutStyle({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '90px',
        padding: { top: '0', right: '0', bottom: '0', left: '0' },
      }),
      ...style,
    },
    {
      dataSource: {
        endpoint: 'banners',
        params: { position },
      },
    }
  );
}

function eventListBlock(label, limit = 4, style = {}) {
  return block(
    'event-list',
    label,
    { limit, showLocation: true, showPrice: true, layout: 'list' },
    {
      ...layoutStyle({
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }),
      ...style,
    },
    {
      dataSource: {
        endpoint: 'events',
        params: { limit: String(limit) },
      },
    }
  );
}

function cmsFormBlock(label, formSlug, style = {}) {
  return block(
    'cms-form',
    label,
    {
      formSlug,
      showTitle: true,
      showDescription: true,
      submitButtonText: 'Invia messaggio',
      layout: 'stacked',
    },
    {
      ...layoutStyle({
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '720px',
        padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
      }),
      border: {
        width: '1px',
        style: 'solid',
        color: '#d7d7d7',
        radius: '20px',
      },
      background: { type: 'color', value: '#ffffff' },
      typography: {},
      ...style,
    },
    {
      dataSource: {
        endpoint: 'forms',
        params: { slug: formSlug },
      },
    }
  );
}

function quoteBlock(label, text, author, source, style = {}) {
  return block(
    'quote',
    label,
    { text, author, source },
    {
      ...layoutStyle({
        display: 'block',
        padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' },
      }),
      background: { type: 'color', value: '#ffffff' },
      border: { width: '1px', style: 'solid', color: '#d7d7d7', radius: '20px' },
      typography: { color: '#171717' },
      ...style,
    }
  );
}

async function main() {
  const serviceRoleKey = readSecret('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient('https://xtyoeajjxgeeemwlcotk.supabase.co', serviceRoleKey);
  console.log('1/9 tenant');

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', 'valbrembana')
    .single();

  if (tenantError || !tenant) {
    throw new Error(tenantError?.message || 'Tenant valbrembana non trovato');
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, name, color')
    .eq('tenant_id', tenant.id);
  console.log('2/9 categories');

  const categoryBySlug = Object.fromEntries((categories || []).map((category) => [category.slug, category]));
  const { data: firstArticle } = await supabase
    .from('articles')
    .select('author_id')
    .eq('tenant_id', tenant.id)
    .limit(1)
    .single();

  const authorId = firstArticle?.author_id;
  if (!authorId) {
    throw new Error('Nessun autore disponibile nel tenant');
  }

  const tagsSeed = [
    'Montagna',
    'Comuni',
    'Inchieste',
    'Turismo',
    'Basket',
    'Weekend',
    'Cultura',
    'Opinioni',
  ];

  const tagMap = {};
  for (const name of tagsSeed) {
    const slug = slugify(name);
    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      tagMap[slug] = existing.id;
      continue;
    }

    const { data: created, error } = await supabase
      .from('tags')
      .insert({ tenant_id: tenant.id, name, slug })
      .select('id')
      .single();

    if (error) throw error;
    tagMap[slug] = created.id;
  }
  console.log('3/9 tags');

  const articlesSeed = [
    {
      title: 'San Giovanni Bianco apre il polo civico serale: studio, coworking e sportello giovani nello stesso spazio',
      slug: 'san-giovanni-bianco-polo-civico-serale',
      category: 'cronaca',
      summary: 'Un hub civico riaperto fino a tardi cambia la vita del centro: servizi, studio assistito e una nuova piazza sociale indoor.',
      body: '<p>Il nuovo polo civico di San Giovanni Bianco apre in fascia serale con una formula che unisce studio, lavoro agile e servizi di prossimita. Il progetto nasce come risposta concreta alla domanda di spazi accessibili, centrali e vissuti anche oltre l orario d ufficio.</p><p>Nella struttura trovano posto sale condivise, supporto per studenti e una programmazione di micro-eventi civici che trasforma il presidio in un punto di riferimento stabile per il paese.</p>',
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80',
      tags: ['comuni', 'inchieste'],
      featured: true,
      publishedAgoHours: 2,
    },
    {
      title: 'Zogno ridisegna il nodo bus-stazione: piu corse, attese piu brevi e un percorso pedonale finalmente leggibile',
      slug: 'zogno-ridisegna-nodo-bus-stazione',
      category: 'cronaca',
      summary: 'Mobilita locale e qualita dell esperienza urbana tornano al centro con un intervento pragmatico e visibile.',
      body: '<p>Il nuovo assetto del nodo bus-stazione di Zogno punta a ridurre tempi morti e incertezze per pendolari e studenti. La novita principale e la leggibilita del percorso, con una sequenza piu lineare tra arrivi, attese e connessioni.</p><p>Per il centro valle il tema della mobilita quotidiana torna cosi a essere un tema di qualita della vita, oltre che di trasporto pubblico.</p>',
      image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1600&q=80',
      tags: ['comuni', 'weekend'],
      publishedAgoHours: 4,
    },
    {
      title: 'Il trail delle vette minori rilancia la primavera sportiva: numeri in crescita e borghi coinvolti lungo tutto il percorso',
      slug: 'trail-vette-minori-primavera-sportiva',
      category: 'sport',
      summary: 'La corsa in quota diventa racconto di territorio: non solo agonismo, ma economia diffusa, accoglienza e promozione.',
      body: '<p>Il trail delle vette minori cresce e trascina con se un idea di sport che funziona anche come racconto territoriale. Rifugi, borghi e associazioni costruiscono un calendario che si allunga oltre la sola giornata di gara.</p><p>La manifestazione conferma il valore degli eventi sportivi quando si integrano con l identita dei luoghi e non restano episodi isolati.</p>',
      image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1600&q=80',
      tags: ['montagna', 'turismo'],
      publishedAgoHours: 6,
    },
    {
      title: 'Basket di valle, le palestre minori tornano centrali: piu pubblico, staff condivisi e derby con atmosfera da grande serata',
      slug: 'basket-valle-palestre-minori-centrali',
      category: 'sport',
      summary: 'Il basket giovanile diventa laboratorio sociale e sportivo, con impianti piccoli ma pienamente vissuti.',
      body: '<p>La stagione del basket locale racconta una rete di palestre che torna a essere frequentata e riconoscibile. La crescita del pubblico e la collaborazione tra societa trasformano il fine settimana in un presidio comunitario.</p><p>Il valore sportivo si intreccia con quello educativo, e il palazzetto torna a essere un luogo di appartenenza condivisa.</p>',
      image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1600&q=80',
      tags: ['basket', 'comuni'],
      publishedAgoHours: 8,
    },
    {
      title: 'Archivio vivo, la memoria della valle entra nei laboratori scolastici con immagini, audio e mappe narrate',
      slug: 'archivio-vivo-memoria-valle-laboratori-scolastici',
      category: 'cultura',
      summary: 'Un progetto che unisce scuole, associazioni e archivi per trasformare il patrimonio in strumento di lettura del presente.',
      body: '<p>Le scuole della valle iniziano a lavorare su fotografie, registrazioni e mappe di comunita per costruire un archivio vivo, aperto e continuamente riletto. Non si tratta di una conservazione passiva, ma di un uso pubblico della memoria.</p><p>Il progetto produce materiali didattici, incontri e nuove occasioni di racconto condiviso tra generazioni.</p>',
      image: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=1600&q=80',
      tags: ['cultura', 'inchieste'],
      publishedAgoHours: 10,
    },
    {
      title: 'Teatri di borgo, rassegne piccole e piene: il format diffuso che fa funzionare davvero la cultura locale',
      slug: 'teatri-di-borgo-rassegne-piccole-piene',
      category: 'cultura',
      summary: 'Programmazioni leggere, luoghi riconoscibili e una comunicazione piu chiara stanno cambiando il modo di vivere gli eventi.',
      body: '<p>Le rassegne di borgo funzionano quando costruiscono un calendario riconoscibile, luoghi facili da raggiungere e un linguaggio semplice per il pubblico. La cultura locale guadagna forza quando smette di sembrare eccezionale e torna a essere frequente.</p><p>La diffusione territoriale diventa cosi un vantaggio editoriale e non un limite logistico.</p>',
      image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1600&q=80',
      tags: ['cultura', 'weekend'],
      publishedAgoHours: 12,
    },
    {
      title: 'Sentieri di mezza quota, la vera partita e la manutenzione continua: meno grandi annunci e piu cura visibile',
      slug: 'sentieri-mezza-quota-manutenzione-continua',
      category: 'territorio',
      summary: 'Segnaletica, piccoli lavori e una regia annuale fanno la differenza molto piu dei progetti spot.',
      body: '<p>Il tema non e soltanto aprire nuovi tracciati, ma mantenere bene quelli esistenti. Nei sentieri di mezza quota il valore pubblico sta nella continuita della manutenzione, nella chiarezza della segnaletica e nella leggibilita dell esperienza per chi arriva da fuori.</p><p>Quando la cura e visibile, anche il racconto turistico diventa piu credibile.</p>',
      image: 'https://images.unsplash.com/photo-1501554728187-ce583db33af7?auto=format&fit=crop&w=1600&q=80',
      tags: ['montagna', 'turismo'],
      publishedAgoHours: 14,
    },
    {
      title: 'Editoriale, una testata locale deve sembrare autorevole prima ancora di chiedere il click',
      slug: 'editoriale-testata-locale-autorevole-prima-del-click',
      category: 'editoriali',
      summary: 'Gerarchie, ritmo, fotografie e titolazione devono far percepire una regia. La fiducia inizia dall impaginazione.',
      body: '<p>Nel digitale locale la forma e gia sostanza. Una testata che vuole essere riconosciuta come autorevole deve mostrare subito ordine, priorita e tono. La differenza tra una pagina casuale e una prima pagina vera si sente prima ancora di leggere il primo titolo.</p><p>Per questo il design editoriale non e un lusso, ma una parte dell affidabilita percepita.</p>',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
      tags: ['opinioni', 'inchieste'],
      publishedAgoHours: 16,
    },
    {
      title: 'Editoriale, il sito di una redazione deve mettere in scena il lavoro del desk, non nasconderlo',
      slug: 'editoriale-sito-redazione-mettere-in-scena-lavoro-desk',
      category: 'editoriali',
      summary: 'Video, live desk, approfondimenti e agenda devono convivere in una struttura chiara e leggibile.',
      body: '<p>Una homepage editoriale forte rende visibile la macchina della redazione. Il lettore deve percepire i livelli del racconto: urgenza, gerarchia, approfondimento, servizio. Non basta elencare contenuti, serve metterli in scena.</p><p>Il risultato e una pagina che invita a restare, non solo a cliccare.</p>',
      image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
      tags: ['opinioni', 'cultura'],
      publishedAgoHours: 18,
    },
  ];

  const articleIdsBySlug = {};
  for (const seed of articlesSeed) {
    const category = categoryBySlug[seed.category];
    if (!category) {
      throw new Error(`Categoria non trovata: ${seed.category}`);
    }

    const articlePayload = {
      tenant_id: tenant.id,
      title: seed.title,
      slug: seed.slug,
      summary: seed.summary,
      body: seed.body,
      cover_image_url: seed.image,
      category_id: category.id,
      author_id: authorId,
      status: 'published',
      is_featured: Boolean(seed.featured),
      is_breaking: false,
      is_premium: false,
      meta_title: seed.title,
      meta_description: seed.summary,
      og_image_url: seed.image,
      published_at: isoHoursAgo(seed.publishedAgoHours),
      import_source: 'cms-demo',
      imported_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('slug', seed.slug)
      .maybeSingle();

    let articleId = existing?.id;
    if (articleId) {
      const { error } = await supabase.from('articles').update(articlePayload).eq('id', articleId);
      if (error) throw error;
    } else {
      const { data: created, error } = await supabase
        .from('articles')
        .insert(articlePayload)
        .select('id')
        .single();
      if (error) throw error;
      articleId = created.id;
    }

    articleIdsBySlug[seed.slug] = articleId;

    await supabase.from('article_categories').upsert({
      article_id: articleId,
      category_id: category.id,
    });

    await supabase.from('article_authors').upsert({
      article_id: articleId,
      author_id: authorId,
      role: 'Autore',
      sort_order: 0,
      is_primary: true,
    });

    if (seed.tags?.length) {
      await supabase.from('article_tags').delete().eq('article_id', articleId);
      await supabase.from('article_tags').insert(
        seed.tags.map((tagSlug) => ({
          article_id: articleId,
          tag_id: tagMap[tagSlug],
        }))
      );
    }
  }
  console.log('4/9 articles');

  await supabase.from('breaking_news').delete().eq('tenant_id', tenant.id);
  await supabase.from('breaking_news').insert([
    {
      tenant_id: tenant.id,
      text: 'Riapre il polo civico serale a San Giovanni Bianco: servizi e studio fino a tarda sera',
      link_url: `/site/${tenant.slug}/articolo/san-giovanni-bianco-polo-civico-serale`,
      is_active: true,
      priority: 90,
      created_by: authorId,
    },
    {
      tenant_id: tenant.id,
      text: 'Trail di primavera, iscrizioni record e borghi coinvolti lungo tutto il percorso',
      link_url: `/site/${tenant.slug}/articolo/trail-vette-minori-primavera-sportiva`,
      is_active: true,
      priority: 80,
      created_by: authorId,
    },
    {
      tenant_id: tenant.id,
      text: 'Editoriale: una testata locale deve apparire autorevole prima ancora del click',
      link_url: `/site/${tenant.slug}/articolo/editoriale-testata-locale-autorevole-prima-del-click`,
      is_active: true,
      priority: 70,
      created_by: authorId,
    },
    {
      tenant_id: tenant.id,
      text: 'Sentieri di mezza quota, manutenzione continua e segnaletica tornano al centro',
      link_url: `/site/${tenant.slug}/articolo/sentieri-mezza-quota-manutenzione-continua`,
      is_active: true,
      priority: 60,
      created_by: authorId,
    },
  ]);
  console.log('5/9 breaking');

  await supabase.from('events').delete().eq('tenant_id', tenant.id);
  await supabase.from('events').insert([
    {
      tenant_id: tenant.id,
      title: 'Forum di valle: come si legge una homepage editoriale',
      description: 'Incontro pubblico con desk, designer e redazione sulla costruzione di una prima pagina digitale autorevole.',
      location: 'San Pellegrino Terme, Sala Congressi',
      image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
      category: 'Incontri',
      price: 'Ingresso libero',
      ticket_url: '#',
      starts_at: isoHoursFromNow(28),
      ends_at: isoHoursFromNow(31),
      is_recurring: false,
    },
    {
      tenant_id: tenant.id,
      title: 'Passeggiata guidata tra archivi, botteghe e memoria di borgo',
      description: 'Un itinerario culturale diffuso per testare il modulo eventi con immagini, luogo e fascia oraria.',
      location: 'Piazza Brembana',
      image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
      category: 'Cultura',
      price: '12 EUR',
      ticket_url: '#',
      starts_at: isoHoursFromNow(52),
      ends_at: isoHoursFromNow(56),
      is_recurring: false,
    },
    {
      tenant_id: tenant.id,
      title: 'Weekend sportivo in quota tra trail, famiglie e attivita per ragazzi',
      description: 'Agenda live della valle per verificare il layout eventi in homepage e categoria.',
      location: 'Zogno, area eventi',
      image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
      category: 'Sport',
      price: 'Gratuito',
      ticket_url: '#',
      starts_at: isoHoursFromNow(76),
      ends_at: isoHoursFromNow(82),
      is_recurring: false,
    },
  ]);
  console.log('6/9 events');

  await supabase.from('banners').delete().eq('tenant_id', tenant.id);
  await supabase.from('banners').insert([
    {
      tenant_id: tenant.id,
      name: 'Header partner montagna',
      position: 'header',
      type: 'image',
      image_url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80',
      link_url: '#',
      target_categories: [],
      target_device: 'all',
      weight: 10,
      is_active: true,
    },
    {
      tenant_id: tenant.id,
      name: 'Sidebar special edition',
      position: 'sidebar',
      type: 'html',
      html_content: '<div style="padding:24px;border-radius:24px;background:#ffffff;color:#111111;font-family:Inter,system-ui,sans-serif;border:1px solid #d7d7d7;box-shadow:0 18px 44px rgba(0,0,0,.07)"><div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:#6b6b6b">ADV Speciale</div><h3 style="margin:.55rem 0 0;font-size:1.55rem;line-height:1.02;font-family:Fraunces,Georgia,serif">Festival dei borghi 2026</h3><p style="margin:.85rem 0 0;color:#4b4b4b;line-height:1.58">Un formato promozionale elegante, con resa piu editoriale e meno invasiva, pensato per convivere con una homepage newspaper-style.</p><a href=\"#\" style=\"display:inline-block;margin-top:1rem;padding:.72rem 1rem;border-radius:999px;background:#111111;color:#ffffff;text-decoration:none;font-weight:700\">Scopri il programma</a></div>',
      link_url: null,
      target_categories: [],
      target_device: 'desktop',
      weight: 8,
      is_active: true,
    },
    {
      tenant_id: tenant.id,
      name: 'Footer tourisme valley',
      position: 'footer',
      type: 'image',
      image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80',
      link_url: '#',
      target_categories: [],
      target_device: 'all',
      weight: 6,
      is_active: true,
    },
    {
      tenant_id: tenant.id,
      name: 'Interstitial comparsa demo',
      position: 'interstitial',
      type: 'html',
      html_content: '<div style="padding:18px 20px;border-radius:18px;background:#ffffff;color:#111111;font-family:Inter,system-ui,sans-serif;border:1px solid #d7d7d7;box-shadow:0 14px 34px rgba(0,0,0,.07)"><strong style="display:block;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6b6b6b">Promo comparsa</strong><div style="margin-top:.45rem;font-size:1.02rem;font-weight:700;line-height:1.35">Formato interstitial pronto per il test runtime ADV</div></div>',
      link_url: null,
      target_categories: [],
      target_device: 'all',
      weight: 5,
      is_active: true,
    },
  ]);
  console.log('7/9 banners');

  const forms = [
    {
      slug: 'newsletter-valle',
      name: 'Newsletter Valle',
      description: 'Form newsletter collegato al blocco homepage.',
      success_message: 'Iscrizione ricevuta. Controlla la tua inbox.',
      is_active: true,
      fields: [
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'nome@email.it' },
      ],
    },
    {
      slug: 'contatti-redazione',
      name: 'Contatti Redazione',
      description: 'Modulo contatti pubblico per segnalazioni e ADV.',
      success_message: 'Messaggio ricevuto dalla redazione.',
      is_active: true,
      fields: [
        { name: 'name', label: 'Nome e cognome', type: 'text', required: true, placeholder: 'Il tuo nome' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'nome@email.it' },
        { name: 'topic', label: 'Tema', type: 'select', required: true, options: ['Segnalazione', 'ADV', 'Collaborazioni', 'Altro'] },
        { name: 'message', label: 'Messaggio', type: 'textarea', required: true, placeholder: 'Scrivi qui la tua richiesta' },
      ],
    },
  ];

  for (const form of forms) {
    const { data: existing } = await supabase
      .from('site_forms')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('slug', form.slug)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('site_forms').update(form).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('site_forms').insert({ tenant_id: tenant.id, ...form });
      if (error) throw error;
    }
  }
  console.log('8/9 forms');

  const theme = {
    fonts: {
      body: '"Instrument Sans", Inter, system-ui, sans-serif',
      heading: '"Fraunces", Georgia, serif',
      mono: '"JetBrains Mono", monospace',
    },
    layoutPreset: 'newspaper',
    mastheadNote: 'Val Brembana digital edition',
    colors: {
      background: '#ffffff',
      surface: '#ffffff',
      text: '#111111',
      textSecondary: '#5f5f5f',
      primary: '#111111',
      secondary: '#8b1e24',
      accent: '#8b1e24',
      border: '#d4d4d4',
    },
    spacing: {
      unit: 4,
      sectionGap: '56px',
      containerMax: '1240px',
    },
    borderRadius: '10px',
  };

  const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Instrument+Sans:wght@400;500;600;700&display=swap');
body { letter-spacing: -0.01em; background:#fff; }
main { padding-top: 0; }
header { border-bottom: 1px solid var(--e-color-border) !important; }
footer { border-top: 1px solid var(--e-color-border) !important; }
header nav a:hover, footer a:hover { color: var(--e-color-primary); }
[data-block="article-grid"] a:hover h3 { text-decoration: underline; }
[data-block="article-grid"] a { background:#fff; }
[data-block="article-grid"] a,
[data-block="article-hero"],
[data-block="banner-zone"],
[data-block="sidebar"] section,
[data-block="newsletter"],
[data-block="cms-form"] { border-radius: 8px !important; }
[data-block="article-grid"] a { box-shadow:none !important; }
[data-block="article-grid"] h3 { letter-spacing: -0.02em; }
[data-block="article-hero"] { border: 1px solid var(--e-color-border); }
[data-block="article-hero"] h2,
[data-block="article-hero"] h3 { letter-spacing:-0.03em; }
[data-block="breaking-ticker"] a { color:#fff; text-decoration:none; }
[data-block="breaking-ticker"] a:hover { text-decoration:underline; }
@media (max-width: 900px) {
  header > div, footer > div { padding-left: 18px !important; padding-right: 18px !important; }
}
  `.trim();

  const navigation = {
    primary: [
      { id: 'nav-home', label: 'Home', url: `/site/${tenant.slug}` },
      { id: 'nav-cronaca', label: 'Cronaca', url: `/site/${tenant.slug}/categoria/cronaca`, sourceType: 'category' },
      { id: 'nav-opinioni', label: 'Opinioni', url: `/site/${tenant.slug}/categoria/editoriali`, sourceType: 'category' },
      { id: 'nav-sport', label: 'Sport', url: `/site/${tenant.slug}/categoria/sport`, sourceType: 'category' },
      { id: 'nav-cultura', label: 'Cultura', url: `/site/${tenant.slug}/categoria/cultura`, sourceType: 'category' },
      { id: 'nav-territorio', label: 'Territorio', url: `/site/${tenant.slug}/categoria/territorio`, sourceType: 'category' },
      { id: 'nav-agenda', label: 'Agenda', url: '#agenda' },
      { id: 'nav-contatti', label: 'Contatti', url: `/site/${tenant.slug}/contatti`, sourceType: 'page' },
    ],
    secondary: [
      { id: 'sec-prime', label: 'Prime storie', url: '#prime-storie' },
      { id: 'sec-live', label: 'Live desk', url: '#news-desk' },
      { id: 'sec-opinion', label: 'Opinioni', url: '#opinion' },
      { id: 'sec-about', label: 'Chi siamo', url: `/site/${tenant.slug}/chi-siamo` },
      { id: 'sec-contact', label: 'Segnala una storia', url: `/site/${tenant.slug}/contatti` },
    ],
    mobile: [
      { id: 'mob-home', label: 'Home', url: `/site/${tenant.slug}` },
      { id: 'mob-cronaca', label: 'Cronaca', url: `/site/${tenant.slug}/categoria/cronaca` },
      { id: 'mob-opinioni', label: 'Opinioni', url: `/site/${tenant.slug}/categoria/editoriali` },
      { id: 'mob-sport', label: 'Sport', url: `/site/${tenant.slug}/categoria/sport` },
      { id: 'mob-cultura', label: 'Cultura', url: `/site/${tenant.slug}/categoria/cultura` },
      { id: 'mob-territorio', label: 'Territorio', url: `/site/${tenant.slug}/categoria/territorio` },
      { id: 'mob-contatti', label: 'Contatti', url: `/site/${tenant.slug}/contatti` },
    ],
    footer: [
      { id: 'foot-about', label: 'Chi siamo', url: `/site/${tenant.slug}/chi-siamo` },
      { id: 'foot-contact', label: 'Contatti', url: `/site/${tenant.slug}/contatti` },
      { id: 'foot-editoriali', label: 'Editoriali', url: `/site/${tenant.slug}/categoria/editoriali` },
    ],
  };

  const footer = {
    description: 'Testata demo costruita con i moduli reali del CMS: impianto da grande quotidiano digitale, righe editoriali nette, sfondo bianco e gerarchie piu severe.',
    columns: [
      {
        title: 'Redazione',
        text: 'Cronaca, opinioni, sport, cultura e territorio organizzati come una prima pagina digitale piu densa e piu autorevole.',
        links: [
          { label: 'Cronaca', url: `/site/${tenant.slug}/categoria/cronaca` },
          { label: 'Opinioni', url: `/site/${tenant.slug}/categoria/editoriali` },
        ],
      },
      {
        title: 'Servizi',
        links: [
          { label: 'Newsletter', url: '#newsletter' },
          { label: 'Contatti', url: `/site/${tenant.slug}/contatti` },
          { label: 'ADV', url: '/dashboard/adv' },
        ],
      },
      {
        title: 'Test',
        text: 'Tema chiaro, masthead newspaper, banner header/sidebar/footer/interstitial, eventi, form CMS, pagine statiche e homepage builder.',
        links: [
          { label: 'Chi siamo', url: `/site/${tenant.slug}/chi-siamo` },
          { label: 'Segnala una storia', url: `/site/${tenant.slug}/contatti` },
        ],
      },
    ],
    links: [
      { label: 'Privacy', url: '#' },
      { label: 'Cookie', url: '#' },
    ],
    socialLinks: [
      { platform: 'facebook', url: '#' },
      { platform: 'instagram', url: '#' },
      { platform: 'youtube', url: '#' },
    ],
    copyright: `© ${new Date().getFullYear()} ${tenant.name}. Demo editoriale del CMS con impostazione da grande quotidiano digitale.`,
    newsletter: {
      enabled: true,
      title: 'Newsletter del desk',
      description: 'La selezione serale delle storie da non perdere.',
      buttonText: 'Iscriviti',
      formSlug: 'newsletter-valle',
    },
    newsletterSettings: {
      enabled: true,
      mode: 'form',
      title: 'Resta nel flusso della redazione',
      description: 'Una newsletter elegante e breve: ultime notizie, agenda e un editoriale scelto dal desk.',
      buttonText: 'Iscriviti alla newsletter',
      placeholder: 'La tua email',
      privacyText: 'Iscrivendoti accetti di ricevere comunicazioni editoriali della testata.',
      successMessage: 'Perfetto, sei dentro la newsletter demo.',
      formSlug: 'newsletter-valle',
      compact: false,
      theme: 'accent',
      placements: {
        homepage: true,
        articleInline: false,
        articleFooter: true,
        categoryHeader: false,
        footer: true,
        stickyBar: false,
      },
      digest: {
        enabled: true,
        frequency: 'weekly',
        sendTime: '07:30',
        intro: 'La selezione settimanale del desk.',
        categories: ['cronaca', 'editoriali', 'territorio'],
        includeBreaking: true,
        includeEvents: true,
      },
      leadMagnet: {
        enabled: true,
        title: 'Edizione del mattino',
        description: 'Il meglio della valle in meno di tre minuti.',
      },
      segments: [
        { label: 'Cronaca', value: 'cronaca' },
        { label: 'Editoriali', value: 'editoriali' },
        { label: 'Weekend', value: 'weekend' },
      ],
      provider: {
        provider: 'custom',
        audienceLabel: 'Lista principale',
        formAction: '',
        webhookUrl: '',
        listId: '',
        senderName: tenant.name,
        senderEmail: 'desk@example.com',
        replyTo: 'desk@example.com',
        doubleOptIn: true,
      },
    },
  };

  const { error: configError } = await supabase
    .from('site_config')
    .upsert({
      tenant_id: tenant.id,
      theme,
      navigation,
      footer,
      global_css: globalCss,
    }, { onConflict: 'tenant_id' });

  if (configError) throw configError;
  console.log('8.5/9 config');

  const homepageBlocks = [
    sectionBlock(
      'Frontline',
      [
        columnsBlock(
          'Frontline row',
          [
            textBlock(
              'Frontline intro',
              `<div id="prime-storie"></div><p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:#6a6a6a">Prima pagina digitale</p><h2 style="margin:.55rem 0 0;font-family:Fraunces,Georgia,serif;font-size:clamp(2.3rem,5vw,3.8rem);line-height:.92;color:#111111">Una homepage da grande quotidiano: piu ordine, piu gerarchia, meno effetto magazine</h2><p style="margin:1rem 0 0;max-width:760px;font-size:1.03rem;line-height:1.68;color:#4f4f4f">La struttura mette in testa il lead, a lato il flusso delle notizie, poi desk, opinioni, verticali e agenda. Tutto passa dai moduli reali del CMS e da una cromia bianca, piu secca e piu editoriale.</p>`
            ),
            bannerZoneBlock(
              'Banner header',
              'header',
              {
                ...layoutStyle({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '150px',
                }),
                border: { width: '1px', style: 'solid', color: '#d4d4d4', radius: '8px' },
                background: { type: 'color', value: '#ffffff' },
                typography: {},
              }
            ),
          ],
          ['70%', '30%'],
          '24px'
        ),
        categoryNavBlock(
          'Category rail',
          { style: 'underline', showCount: false, colorMode: 'neutral' },
          {
            ...layoutStyle({
              display: 'flex',
              gap: '12px',
              margin: { top: '20px', right: '0', bottom: '0', left: '0' },
              padding: { top: '12px', right: '0', bottom: '12px', left: '0' },
            }),
            border: { width: '1px', style: 'solid', color: '#d4d4d4', radius: '0' },
            background: { type: 'color', value: '#ffffff' },
            typography: {},
          }
        ),
      ],
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          padding: { top: '28px', right: '0', bottom: '24px', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        }),
      }
    ),
    block(
      'breaking-ticker',
      'Breaking ticker',
      { label: 'ULTIMA ORA', speed: 42 },
      {
        ...layoutStyle({
          display: 'flex',
          alignItems: 'center',
          padding: { top: '10px', right: '14px', bottom: '10px', left: '14px' },
          margin: { top: '0', right: '0', bottom: '18px', left: '0' },
        }),
        background: { type: 'color', value: '#111111' },
        typography: { color: '#ffffff', fontSize: '13px', fontWeight: '700' },
      },
      {
        dataSource: {
          endpoint: 'breaking-news',
          params: {},
        },
      }
    ),
    bannerZoneBlock(
      'Interstitial promo',
      'interstitial',
      {
        ...layoutStyle({
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: '90px',
          maxWidth: '320px',
          margin: { top: '0', right: '0', bottom: '14px', left: 'auto' },
          position: 'sticky',
          top: '16px',
          zIndex: 20,
        }),
        typography: {},
      }
    ),
    sectionBlock(
      'Lead package',
      [
        columnsBlock(
          'Lead package columns',
          [
            block(
              'article-hero',
              'Hero articolo',
              {
                articleSlug: '',
                useFeatured: true,
                overlayColor: 'rgba(7, 10, 18, 0.34)',
                showCategory: true,
                showAuthor: true,
                showDate: true,
                showExcerpt: true,
                height: '520px',
              },
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  minHeight: '520px',
                  padding: { top: '34px', right: '34px', bottom: '34px', left: '34px' },
                  overflow: 'hidden',
                }),
                background: { type: 'image', value: '' },
                typography: { color: '#ffffff' },
                border: { width: '1px', style: 'solid', color: '#d4d4d4', radius: '8px' },
                shadow: 'none',
              },
              {
                dataSource: {
                  endpoint: 'articles',
                  params: { featured: 'true', limit: '1' },
                },
              }
            ),
            sectionBlock(
              'Lead rail',
              [
                textBlock(
                  'Lead rail intro',
                  '<p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6b6b6b">In evidenza</p><h3 style="margin:.45rem 0 0;font-family:Fraunces,Georgia,serif;font-size:2rem;line-height:.98;color:#111">Quattro titoli per dare subito il tono della giornata</h3>',
                  { typography: { color: '#111' } }
                ),
                articleGridBlock(
                  'Lead rail grid',
                  { limit: '4' },
                  { limit: 4, columns: 1, showExcerpt: false, showImage: true, cardStyle: 'minimal' },
                  {
                    ...layoutStyle({
                      display: 'grid',
                      gap: '12px',
                      margin: { top: '12px', right: '0', bottom: '0', left: '0' },
                    }),
                  }
                ),
              ],
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                  padding: { top: '0', right: '0', bottom: '0', left: '0' },
                }),
              },
              { tag: 'aside' }
            )
          ],
          ['64%', '36%'],
          '24px'
        ),
      ],
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          padding: { top: '0', right: '0', bottom: '48px', left: '0' },
        }),
      }
    ),
    sectionBlock(
      'News desk',
      [
        textBlock(
          'News desk intro',
          '<div id="news-desk"></div><p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6b6b6b">Live desk e contesto</p><h2 style="margin:.55rem 0 0;font-family:Fraunces,Georgia,serif;font-size:clamp(1.9rem,4vw,3rem);line-height:.95;color:#111">Video, immagini, utilita e opinioni in una struttura piu severa e piu leggibile</h2><p style="margin:.9rem 0 0;max-width:860px;font-size:1rem;line-height:1.67;color:#4f4f4f">Qui il sito mostra sia il lato visivo sia quello di servizio: TG video, slideshow, ricerca, tassonomie, ultimi articoli e un rail dedicato alle opinioni.</p>',
          { typography: { color: '#1a1a1a' } }
        ),
        columnsBlock(
          'News desk columns',
          [
            sectionBlock(
              'Desk main',
              [
                columnsBlock(
                  'Desk media + tools',
                  [
                    sectionBlock(
                      'Desk media',
                      [
                        block(
                          'video',
                          'TG video',
                          {
                            url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
                            title: 'TG di valle',
                            caption: 'Un video centrale per simulare il cuore visivo del desk.',
                            aspectRatio: '16/9',
                          },
                          {
                            ...layoutStyle({
                              display: 'block',
                              margin: { top: '0', right: '0', bottom: '16px', left: '0' },
                            }),
                            border: { radius: '8px' },
                            shadow: 'none',
                            background: { type: 'none', value: '' },
                            typography: {},
                          }
                        ),
                        block(
                          'slideshow',
                          'Slideshow desk',
                          {
                            height: '320px',
                            autoplay: true,
                            interval: 4200,
                            showDots: true,
                            showArrows: true,
                            slides: [
                              {
                                id: 'slide-a',
                                image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1600&q=80',
                                title: 'Il desk apre la giornata con un impianto piu netto',
                                description: 'Fotografie demo e linee sottili per testare il linguaggio da grande quotidiano digitale.',
                                overlay: { enabled: true, color: 'rgba(10,16,30,0.2)' },
                                textStyle: { color: '#ffffff', titleSize: '28px', titleWeight: '800', descSize: '15px' },
                                buttons: [{ id: 'a1', text: 'Apri la cronaca', url: `/site/${tenant.slug}/categoria/cronaca` }],
                              },
                              {
                                id: 'slide-b',
                                image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80',
                                title: 'Le opinioni hanno un rail dedicato e leggibile',
                                description: 'La homepage distingue meglio urgenza, analisi e servizio.',
                                overlay: { enabled: true, color: 'rgba(10,10,10,0.24)' },
                                textStyle: { color: '#ffffff', titleSize: '27px', titleWeight: '800', descSize: '15px' },
                                buttons: [{ id: 'b1', text: 'Vai alle opinioni', url: `/site/${tenant.slug}/categoria/editoriali`, style: 'secondary' }],
                              },
                              {
                                id: 'slide-c',
                                image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
                                title: 'ADV e CMS convivono senza rompere il tono editoriale',
                                description: 'Header, sidebar, footer e comparsa usano il modulo banner reale del sistema.',
                                overlay: { enabled: true, color: 'rgba(16,16,16,0.22)' },
                                textStyle: { color: '#ffffff', titleSize: '27px', titleWeight: '800', descSize: '15px' },
                                buttons: [],
                              },
                            ],
                          },
                          {
                            ...layoutStyle({
                              display: 'block',
                            }),
                            border: { radius: '8px' },
                            shadow: 'none',
                            background: { type: 'none', value: '' },
                            typography: {},
                          }
                        ),
                        bannerZoneBlock(
                          'Banner in article',
                          'in_article',
                          {
                            ...layoutStyle({
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              margin: { top: '16px', right: '0', bottom: '0', left: '0' },
                              minHeight: '110px',
                            }),
                            border: { width: '1px', style: 'solid', color: '#d4d4d4', radius: '8px' },
                            background: { type: 'color', value: '#ffffff' },
                            typography: {},
                          },
                          {
                            fallbackHtml: '<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#111;font-weight:700">Adv in article</div>',
                          }
                        ),
                      ],
                      {
                        ...layoutStyle({
                          display: 'flex',
                          flexDirection: 'column',
                        }),
                      },
                      { tag: 'div' }
                    ),
                    sidebarWidgetsBlock(
                      'Desk tools',
                      [
                        {
                          id: 'search',
                          type: 'search',
                          title: 'Cerca nel sito',
                          props: { placeholder: 'Cerca un articolo, un tema, un comune...' },
                        },
                        {
                          id: 'recent',
                          type: 'recent-posts',
                          title: 'Piu letti',
                          props: {
                            posts: [
                              { title: 'San Giovanni Bianco apre il polo civico serale', url: `/site/${tenant.slug}/articolo/san-giovanni-bianco-polo-civico-serale`, date: 'Oggi' },
                              { title: 'Zogno ridisegna il nodo bus-stazione', url: `/site/${tenant.slug}/articolo/zogno-ridisegna-nodo-bus-stazione`, date: 'Oggi' },
                              { title: 'Trail delle vette minori, numeri in crescita', url: `/site/${tenant.slug}/articolo/trail-vette-minori-primavera-sportiva`, date: 'Ieri' },
                              { title: 'Una testata deve sembrare autorevole prima del click', url: `/site/${tenant.slug}/articolo/editoriale-testata-locale-autorevole-prima-del-click`, date: 'Ieri' },
                            ],
                          },
                        },
                        {
                          id: 'categories',
                          type: 'categories',
                          title: 'Sezioni',
                          props: {
                            categories: [
                              { name: 'Cronaca', count: 2, url: `/site/${tenant.slug}/categoria/cronaca` },
                              { name: 'Sport', count: 2, url: `/site/${tenant.slug}/categoria/sport` },
                              { name: 'Cultura', count: 2, url: `/site/${tenant.slug}/categoria/cultura` },
                              { name: 'Opinioni', count: 2, url: `/site/${tenant.slug}/categoria/editoriali` },
                            ],
                          },
                        },
                        {
                          id: 'tags',
                          type: 'tags',
                          title: 'Temi',
                          props: { tags: ['Montagna', 'Comuni', 'Inchieste', 'Cultura', 'Weekend', 'Turismo'] },
                        },
                      ],
                      {
                        ...layoutStyle({
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                        }),
                      }
                    ),
                  ],
                  ['60%', '40%'],
                  '20px'
                ),
              ],
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                }),
                typography: {},
              },
              { tag: 'div' }
            ),
            sectionBlock(
              'Opinion rail',
              [
                textBlock(
                  'Opinion heading',
                  '<div id="opinion"></div><p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6b6b6b">Opinioni</p><h3 style="margin:.45rem 0 0;font-family:Fraunces,Georgia,serif;font-size:2rem;line-height:.98;color:#111">Un rail laterale dedicato a editoriali e interpretazione</h3>',
                  { typography: { color: '#111' } }
                ),
                articleGridBlock(
                  'Opinion rail grid',
                  { categorySlug: 'editoriali', limit: '3' },
                  { limit: 3, columns: 1, showExcerpt: true, showImage: true },
                  {
                    ...layoutStyle({
                      display: 'grid',
                      gap: '12px',
                      margin: { top: '12px', right: '0', bottom: '0', left: '0' },
                    }),
                  }
                ),
                bannerZoneBlock(
                  'Sidebar banner',
                  'sidebar',
                  {
                    ...layoutStyle({
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: { top: '18px', right: '0', bottom: '0', left: '0' },
                      minHeight: '280px',
                    }),
                    typography: {},
                  }
                ),
              ],
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                  padding: { top: '18px', right: '18px', bottom: '18px', left: '18px' },
                }),
                background: { type: 'color', value: '#ffffff' },
                border: { width: '1px', style: 'solid', color: '#d4d4d4', radius: '8px' },
                typography: {},
              },
              { tag: 'aside' }
            ),
          ],
          ['68%', '32%'],
          '24px'
        ),
      ],
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          padding: { top: '0', right: '0', bottom: '56px', left: '0' },
        }),
      }
    ),
    sectionBlock(
      'Verticals',
      [
        columnsBlock(
          'Vertical columns',
          [
            sectionBlock(
              'Cronaca rail',
              [
                textBlock('Cronaca heading', '<p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6d6d6d">Cronaca</p><h3 style="margin:.45rem 0 0;font-family:Fraunces,Georgia,serif;font-size:2rem;line-height:1;color:#111">I temi civici e le decisioni che cambiano la giornata</h3>'),
                articleGridBlock('Cronaca grid', { categorySlug: 'cronaca', limit: '2' }, { limit: 2, columns: 1 }),
              ],
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                  padding: { top: '0', right: '0', bottom: '0', left: '0' },
                }),
              }
            ),
            sectionBlock(
              'Sport rail',
              [
                textBlock('Sport heading', '<p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6d6d6d">Sport</p><h3 style="margin:.45rem 0 0;font-family:Fraunces,Georgia,serif;font-size:2rem;line-height:1;color:#111">Weekend, derby e impianti minori che tornano centrali</h3>'),
                articleGridBlock('Sport grid', { categorySlug: 'sport', limit: '2' }, { limit: 2, columns: 1 }),
              ],
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                  padding: { top: '0', right: '0', bottom: '0', left: '0' },
                }),
              }
            ),
            sectionBlock(
              'Territorio rail',
              [
                textBlock('Territorio heading', '<p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6d6d6d">Territorio</p><h3 style="margin:.45rem 0 0;font-family:Fraunces,Georgia,serif;font-size:2rem;line-height:1;color:#111">Sentieri, luoghi e manutenzione: il valore della cura visibile</h3>'),
                articleGridBlock('Territorio grid', { categorySlug: 'territorio', limit: '2' }, { limit: 2, columns: 1 }),
              ],
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                  padding: { top: '0', right: '0', bottom: '0', left: '0' },
                }),
              }
            ),
          ],
          ['33.3%', '33.3%', '33.3%'],
          '24px'
        ),
      ],
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          padding: { top: '0', right: '0', bottom: '56px', left: '0' },
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        }),
      }
    ),
    sectionBlock(
      'Culture and events',
      [
        columnsBlock(
          'Culture and events columns',
          [
            sectionBlock(
              'Culture deck',
              [
                textBlock('Culture heading', '<p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6d6d6d">Cultura</p><h3 style="margin:.45rem 0 0;font-family:Fraunces,Georgia,serif;font-size:2.2rem;line-height:1;color:#111">Archivi, scene piccole e programmazioni che funzionano</h3>'),
                articleGridBlock('Culture grid', { categorySlug: 'cultura', limit: '2' }, { limit: 2, columns: 2 }),
              ],
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                  padding: { top: '0', right: '0', bottom: '0', left: '0' },
                }),
              }
            ),
            sectionBlock(
              'Events rail',
              [
                textBlock('Events heading', '<div id="agenda"></div><p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6d6d6d">Agenda</p><h3 style="margin:.45rem 0 0;font-family:Fraunces,Georgia,serif;font-size:2.2rem;line-height:1;color:#111">Eventi e appuntamenti, con il modulo agenda in vista</h3>'),
                eventListBlock(
                  'Events list',
                  4,
                  {
                    ...layoutStyle({
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      margin: { top: '10px', right: '0', bottom: '0', left: '0' },
                    }),
                  }
                ),
              ],
              {
                ...layoutStyle({
                  display: 'flex',
                  flexDirection: 'column',
                  padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
                }),
                border: { width: '1px', style: 'solid', color: '#d4d4d4', radius: '8px' },
                background: { type: 'color', value: '#ffffff' },
                typography: {},
              }
            ),
          ],
          ['62%', '38%'],
          '28px'
        ),
      ],
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          padding: { top: '0', right: '0', bottom: '56px', left: '0' },
        }),
      }
    ),
    block(
      'newsletter',
      'Newsletter homepage',
      {
        mode: 'global',
        title: 'Resta nel flusso della redazione',
        description: 'Ultime notizie, agenda e una selezione di opinioni in un formato piu essenziale e piu da quotidiano.',
        buttonText: 'Iscriviti',
        placeholder: 'La tua email',
        privacyText: 'Modulo reale del CMS, pronto per il test invio.',
        layout: 'inline',
      },
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          padding: { top: '30px', right: '28px', bottom: '30px', left: '28px' },
          margin: { top: '0', right: '0', bottom: '34px', left: '0' },
        }),
        background: { type: 'color', value: '#ffffff' },
        border: { width: '1px', style: 'solid', color: '#d4d4d4', radius: '8px' },
        typography: { textAlign: 'center' },
      },
      {
        dataSource: {
          endpoint: 'site-newsletter',
          params: {},
        },
      }
    ),
    bannerZoneBlock(
      'Footer banner',
      'footer',
      {
        ...layoutStyle({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '140px',
          margin: { top: '0', right: '0', bottom: '16px', left: '0' },
        }),
        border: { width: '1px', style: 'solid', color: '#d4d4d4', radius: '8px' },
        background: { type: 'color', value: '#ffffff' },
        typography: {},
      }
    ),
  ];

  const { data: homepage } = await supabase
    .from('site_pages')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('slug', 'homepage')
    .maybeSingle();

  const homepagePayload = {
    tenant_id: tenant.id,
    title: 'Homepage',
    slug: 'homepage',
    is_published: true,
    blocks: homepageBlocks,
    meta: {
      title: `${tenant.name} | Edizione demo newspaper premium`,
      description: 'Homepage demo in stile testata giornalistica contemporanea, costruita con moduli reali del CMS.',
    },
  };

  if (homepage?.id) {
    const { error } = await supabase.from('site_pages').update(homepagePayload).eq('id', homepage.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('site_pages').insert(homepagePayload);
    if (error) throw error;
  }

  const aboutBlocks = [
    sectionBlock(
      'About intro',
      [
        textBlock(
          'About text',
          `<p style="margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6d6d6d">Chi siamo</p><h1 style="margin:.55rem 0 0;font-family:Fraunces,Georgia,serif;font-size:clamp(2.5rem,5vw,4.4rem);line-height:.94;color:#111">Una testata demo per stressare il CMS come piattaforma editoriale vera</h1><p style="margin-top:1rem;max-width:820px;font-size:1.08rem;line-height:1.7;color:#4f4f4f">Questa pagina esiste per testare non solo la homepage, ma anche le pagine statiche del CMS. La redazione demo mette insieme cronaca, sport, cultura, agenda, newsletter e ADV in una struttura piu bianca, piu netta e piu contemporanea.</p>`
        ),
        quoteBlock(
          'About quote',
          'Il punto non e imitare un quotidiano storico in modo letterale, ma raggiungere lo stesso senso di gerarchia, gravita e fiducia con strumenti visivi piu moderni.',
          'Manifesto di test',
          tenant.name,
          {
            background: { type: 'color', value: '#ffffff' },
            border: { width: '1px', style: 'solid', color: '#ddd2c4', radius: '20px' },
            typography: { color: '#161616' },
          }
        ),
      ],
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          padding: { top: '48px', right: '0', bottom: '48px', left: '0' },
        }),
      }
    ),
    articleGridBlock(
      'About editorial picks',
      { categorySlug: 'editoriali', limit: '2' },
      { limit: 2, columns: 2 },
      {
        ...layoutStyle({
          display: 'grid',
          gap: '18px',
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        }),
      }
    ),
  ];

  const contactBlocks = [
    sectionBlock(
      'Contact intro',
      [
        columnsBlock(
          'Contact columns',
          [
            textBlock(
              'Contact text',
              `<p style="margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#6d6d6d">Contatti</p><h1 style="margin:.55rem 0 0;font-family:Fraunces,Georgia,serif;font-size:clamp(2.3rem,5vw,4rem);line-height:.95;color:#111">Segnala una storia, scrivi alla redazione o chiedi un progetto ADV</h1><p style="margin-top:1rem;font-size:1.05rem;line-height:1.7;color:#4f4f4f">Questa pagina usa il vero blocco <strong>Form CMS</strong> collegato a un modulo reale. Serve a testare flusso contatti, submit e resa grafica in una pagina statica del sito.</p><p style="margin-top:1.2rem;color:#4f4f4f"><strong>Desk:</strong> desk@example.com<br/><strong>ADV:</strong> adv@example.com<br/><strong>Segnalazioni:</strong> redazione@example.com</p>`
            ),
            cmsFormBlock('Contact form', 'contatti-redazione'),
          ],
          ['40%', '60%'],
          '32px'
        ),
      ],
      {
        ...layoutStyle({
          display: 'flex',
          flexDirection: 'column',
          padding: { top: '48px', right: '0', bottom: '48px', left: '0' },
        }),
      }
    ),
  ];

  const pagesToUpsert = [
    {
      slug: 'chi-siamo',
      title: 'Chi siamo',
      blocks: aboutBlocks,
      meta: {
        title: `Chi siamo | ${tenant.name}`,
        description: 'Pagina statica demo della testata per testare il modulo pagine del CMS.',
      },
    },
    {
      slug: 'contatti',
      title: 'Contatti',
      blocks: contactBlocks,
      meta: {
        title: `Contatti | ${tenant.name}`,
        description: 'Pagina contatti con form CMS reale e layout editoriale.',
      },
    },
  ];

  for (const page of pagesToUpsert) {
    const { data: existing } = await supabase
      .from('site_pages')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('slug', page.slug)
      .maybeSingle();

    const payload = {
      tenant_id: tenant.id,
      title: page.title,
      slug: page.slug,
      is_published: true,
      blocks: page.blocks,
      meta: page.meta,
    };

    if (existing?.id) {
      const { error } = await supabase.from('site_pages').update(payload).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('site_pages').insert(payload);
      if (error) throw error;
    }
  }

  console.log('Seed completata per tenant', tenant.slug);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
