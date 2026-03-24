import type { SupabaseClient } from '@supabase/supabase-js';
import '@/lib/blocks/init';
import { createBlock, type Block, type BlockShape, type BlockStyle, type BlockType, type DataSource } from '@/lib/types/block';
import { BLOCK_CATEGORIES, getAllBlockDefinitions, getBlockDefinition } from '@/lib/blocks/registry';
import { summarizeBlockTree } from '@/lib/editor/verification';
import { getThemeContract } from '@/lib/theme-contract';
import { mergeNewsletterIntoFooter, normalizeNewsletterConfig } from '@/lib/site/newsletter';

export type CommandPhase = 'discover' | 'create' | 'compose' | 'configure' | 'review' | 'publish';
export type CommandCategory = 'pages' | 'editor' | 'articles' | 'site' | 'adv' | 'forms' | 'taxonomy' | 'events' | 'moderation' | 'media' | 'newsletter' | 'workflow';

export interface CommandCatalogEntry {
  name: string;
  category: CommandCategory;
  phase: CommandPhase;
  description: string;
  humanFlow: string;
  input: Record<string, string>;
}

export interface RecommendedWorkflow {
  id: string;
  label: string;
  description: string;
  steps: string[];
}

export interface CommandEnvelope {
  command: string;
  input?: Record<string, unknown>;
  clientRequestId?: string;
}

export interface CommandExecutionContext {
  tenantId: string;
  userId: string;
  dryRun: boolean;
  supabase: SupabaseClient;
}

export interface CommandExecutionResult {
  command: string;
  clientRequestId?: string;
  success: boolean;
  dryRun: boolean;
  message: string;
  data?: unknown;
}

export interface CommandDiscoveryResponse {
  catalog: CommandCatalogEntry[];
  workflows: RecommendedWorkflow[];
  blockCategories: typeof BLOCK_CATEGORIES;
  blockDefinitions: Array<{
    type: BlockType;
    label: string;
    description: string;
    category: string;
    icon: string;
    supportsChildren: boolean;
    maxChildren?: number;
    allowedChildTypes?: BlockType[];
    defaultProps: Record<string, unknown>;
    defaultStyle: Record<string, unknown>;
    defaultDataSource?: DataSource;
  }>;
}

export const COMMAND_CATALOG: CommandCatalogEntry[] = [
  {
    name: 'cms.theme.contract.get',
    category: 'site',
    phase: 'discover',
    description: 'Legge il contratto standard per costruire un tema custom compatibile col CMS.',
    humanFlow: 'Il tecnico legge prima questo contract e poi sviluppa il frontend custom agganciando le route e i datasource corretti.',
    input: {},
  },
  {
    name: 'cms.page.list',
    category: 'pages',
    phase: 'discover',
    description: 'Elenca le pagine reali del CMS con slug e stato pubblicazione.',
    humanFlow: 'Prima di modificare un sito, l’editor umano controlla quali pagine esistono già.',
    input: {},
  },
  {
    name: 'cms.page.get',
    category: 'pages',
    phase: 'discover',
    description: 'Legge una pagina CMS singola con blocchi, meta e stato.',
    humanFlow: 'L’IA legge la pagina reale prima di modificarne struttura e contenuti.',
    input: {
      pageId: 'ID pagina',
      pageSlug: 'Slug pagina alternativo',
    },
  },
  {
    name: 'cms.page.create',
    category: 'pages',
    phase: 'create',
    description: 'Crea una nuova pagina CMS vuota o con blocchi iniziali.',
    humanFlow: 'L’IA deve prima creare la pagina, poi aprirla e comporla nel builder.',
    input: {
      title: 'Titolo pagina',
      slug: 'Slug URL',
      page_type: 'Tipo pagina (homepage, custom, about, contact...)',
      is_published: 'Pubblica subito o lascia in bozza',
      blocks: 'Blocchi iniziali opzionali',
    },
  },
  {
    name: 'cms.page.update',
    category: 'pages',
    phase: 'configure',
    description: 'Aggiorna metadati pagina, slug, titolo, stato e blocchi completi.',
    humanFlow: 'Serve per rifinire una pagina esistente dopo la composizione nel builder.',
    input: {
      pageId: 'ID pagina',
      title: 'Nuovo titolo',
      slug: 'Nuovo slug',
      meta: 'Meta JSON',
      is_published: 'Boolean',
      blocks: 'Array blocchi completo opzionale',
    },
  },
  {
    name: 'cms.page.publish',
    category: 'pages',
    phase: 'publish',
    description: 'Pubblica una pagina del CMS.',
    humanFlow: 'La pubblicazione viene dopo revisione contenuto e layout.',
    input: {
      pageId: 'ID pagina',
    },
  },
  {
    name: 'editor.block.list',
    category: 'editor',
    phase: 'discover',
    description: 'Legge l’albero blocchi di una pagina builder.',
    humanFlow: 'Prima di inserire o cambiare blocchi, l’editor controlla la struttura esistente.',
    input: {
      pageId: 'ID pagina',
    },
  },
  {
    name: 'editor.block.add',
    category: 'editor',
    phase: 'compose',
    description: 'Aggiunge un blocco del builder in pagina o dentro un parent.',
    humanFlow: 'L’IA costruisce il sito come un umano: aggiunge blocchi uno per volta nella pagina corretta.',
    input: {
      pageId: 'ID pagina',
      blockType: 'Tipo blocco registry',
      label: 'Etichetta blocco',
      parentId: 'ID parent opzionale',
      index: 'Posizione opzionale',
      props: 'Props blocco',
      style: 'Style blocco',
      shape: 'Shape blocco',
      dataSource: 'Datasource opzionale',
    },
  },
  {
    name: 'editor.block.update',
    category: 'editor',
    phase: 'compose',
    description: 'Aggiorna props, style, shape, animation, responsive o datasource di un blocco.',
    humanFlow: 'Questa è la base vera dei tool editor: gradienti, clip-path, divider, layout, testo e collegamenti CMS.',
    input: {
      pageId: 'ID pagina',
      blockId: 'ID blocco',
      patch: 'Patch con label, props, style, shape, animation, responsive, hidden, locked, dataSource',
    },
  },
  {
    name: 'editor.block.remove',
    category: 'editor',
    phase: 'compose',
    description: 'Rimuove un blocco dall’albero pagina.',
    humanFlow: 'L’IA deve poter rifinire e togliere blocchi come farebbe un editor umano.',
    input: {
      pageId: 'ID pagina',
      blockId: 'ID blocco',
    },
  },
  {
    name: 'editor.block.move',
    category: 'editor',
    phase: 'compose',
    description: 'Sposta un blocco in un altro parent o in un altro indice.',
    humanFlow: 'Serve a riordinare la composizione senza rigenerare tutta la pagina.',
    input: {
      pageId: 'ID pagina',
      blockId: 'ID blocco',
      newParentId: 'Nuovo parent opzionale',
      newIndex: 'Nuova posizione',
    },
  },
  {
    name: 'editor.block.duplicate',
    category: 'editor',
    phase: 'compose',
    description: 'Duplica un blocco esistente nel builder.',
    humanFlow: 'Molto utile per creare variazioni partendo da un blocco già impostato.',
    input: {
      pageId: 'ID pagina',
      blockId: 'ID blocco',
    },
  },
  {
    name: 'editor.verify.page',
    category: 'editor',
    phase: 'review',
    description: 'Verifica struttura blocchi e feature avanzate della pagina builder.',
    humanFlow: 'Serve al tecnico per controllare se la pagina usa forme, gradienti, effetti, responsive e altri strumenti del motore editoriale.',
    input: {
      pageId: 'ID pagina',
    },
  },
  {
    name: 'cms.article.list',
    category: 'articles',
    phase: 'discover',
    description: 'Elenca articoli per stato o categoria.',
    humanFlow: 'Prima di creare o aggiornare un articolo, il desk controlla cosa esiste già.',
    input: {
      status: 'draft, in_review, approved, published, archived',
      categoryId: 'Filtro categoria opzionale',
      limit: 'Limite opzionale',
    },
  },
  {
    name: 'cms.article.get',
    category: 'articles',
    phase: 'discover',
    description: 'Legge un articolo singolo con contenuto e metadati.',
    humanFlow: 'Prima di cambiare un articolo, il desk legge la versione esistente.',
    input: {
      articleId: 'ID articolo',
      articleSlug: 'Slug articolo alternativo',
    },
  },
  {
    name: 'cms.article.create',
    category: 'articles',
    phase: 'create',
    description: 'Crea un nuovo articolo in bozza o nello stato richiesto.',
    humanFlow: 'Flusso redazionale vero: prima bozza, poi revisione, poi pubblicazione.',
    input: {
      title: 'Titolo articolo',
      slug: 'Slug articolo',
      body: 'HTML body',
      summary: 'Sommario',
      status: 'Stato editoriale',
      category_id: 'Categoria primaria',
      cover_image_url: 'Cover',
      meta_title: 'SEO title',
      meta_description: 'SEO description',
    },
  },
  {
    name: 'cms.article.update',
    category: 'articles',
    phase: 'compose',
    description: 'Aggiorna un articolo esistente.',
    humanFlow: 'L’IA deve poter rifinire un articolo senza ricrearlo da zero.',
    input: {
      articleId: 'ID articolo',
      patch: 'Campi da aggiornare',
    },
  },
  {
    name: 'cms.article.set-status',
    category: 'articles',
    phase: 'publish',
    description: 'Cambia lo stato editoriale di un articolo e gestisce published_at/scheduled_at.',
    humanFlow: 'Riproduce il percorso umano draft > review > approved > published.',
    input: {
      articleId: 'ID articolo',
      status: 'Nuovo stato',
      scheduled_at: 'Data opzionale per scheduled/published',
    },
  },
  {
    name: 'cms.category.list',
    category: 'taxonomy',
    phase: 'discover',
    description: 'Elenca le categorie editoriali del tenant.',
    humanFlow: 'Il desk controlla categorie e ordine prima di classificare articoli e layout.',
    input: {},
  },
  {
    name: 'cms.category.create',
    category: 'taxonomy',
    phase: 'create',
    description: 'Crea una categoria editoriale.',
    humanFlow: 'Prima si definiscono le categorie, poi si usano in articoli, homepage e automazioni.',
    input: {
      name: 'Nome categoria',
      slug: 'Slug categoria opzionale',
      description: 'Descrizione opzionale',
      color: 'Colore esadecimale',
      sort_order: 'Ordine opzionale',
    },
  },
  {
    name: 'cms.category.update',
    category: 'taxonomy',
    phase: 'configure',
    description: 'Aggiorna una categoria esistente.',
    humanFlow: 'Le tassonomie vanno corrette senza ricrearle da zero.',
    input: {
      categoryId: 'ID categoria',
      categorySlug: 'Slug categoria alternativo',
      patch: 'Patch campi categoria',
    },
  },
  {
    name: 'cms.category.delete',
    category: 'taxonomy',
    phase: 'configure',
    description: 'Elimina una categoria del tenant.',
    humanFlow: 'Va usato con cautela quando una categoria non serve piu.',
    input: {
      categoryId: 'ID categoria',
      categorySlug: 'Slug categoria alternativo',
    },
  },
  {
    name: 'cms.tag.list',
    category: 'taxonomy',
    phase: 'discover',
    description: 'Elenca i tag del tenant.',
    humanFlow: 'I tag servono per arricchire articoli e archivi senza creare nuove categorie.',
    input: {},
  },
  {
    name: 'cms.tag.create',
    category: 'taxonomy',
    phase: 'create',
    description: 'Crea un tag editoriale.',
    humanFlow: 'Il tecnico o la redazione aggiunge tag quando emergono temi ricorrenti.',
    input: {
      name: 'Nome tag',
      slug: 'Slug tag opzionale',
    },
  },
  {
    name: 'cms.tag.update',
    category: 'taxonomy',
    phase: 'configure',
    description: 'Aggiorna un tag esistente.',
    humanFlow: 'Permette di correggere nome o slug senza perdere il tag.',
    input: {
      tagId: 'ID tag',
      tagSlug: 'Slug tag alternativo',
      patch: 'Patch campi tag',
    },
  },
  {
    name: 'cms.tag.delete',
    category: 'taxonomy',
    phase: 'configure',
    description: 'Elimina un tag.',
    humanFlow: 'Si usa per pulire tassonomie sporche o duplicate.',
    input: {
      tagId: 'ID tag',
      tagSlug: 'Slug tag alternativo',
    },
  },
  {
    name: 'cms.site-config.get',
    category: 'site',
    phase: 'discover',
    description: 'Legge theme, navigation, footer e config globale del sito.',
    humanFlow: 'Prima di cambiare il chrome del sito, il CMS legge la configurazione reale.',
    input: {},
  },
  {
    name: 'cms.site-config.update',
    category: 'site',
    phase: 'configure',
    description: 'Aggiorna theme, global_css, favicon, og defaults, navigation o footer.',
    humanFlow: 'La configurazione globale va cambiata per patch, non ricreata ogni volta.',
    input: {
      patch: 'Patch parziale del site_config',
    },
  },
  {
    name: 'cms.navigation.set-menu',
    category: 'site',
    phase: 'configure',
    description: 'Sostituisce uno dei menu globali del sito.',
    humanFlow: 'L’IA può seguire il flusso umano: prima crea pagine, poi collega il menu.',
    input: {
      menuKey: 'primary, secondary, mobile, footer',
      items: 'Array menu items',
    },
  },
  {
    name: 'cms.footer.update',
    category: 'site',
    phase: 'configure',
    description: 'Aggiorna il footer globale del sito.',
    humanFlow: 'Footer e newsletter vanno configurati dopo la struttura principale.',
    input: {
      patch: 'Patch footer',
    },
  },
  {
    name: 'cms.banner.list',
    category: 'adv',
    phase: 'discover',
    description: 'Elenca i banner ADV del tenant.',
    humanFlow: 'Prima di inserire ADV, la redazione controlla creatività e posizioni già presenti.',
    input: {},
  },
  {
    name: 'cms.banner.create',
    category: 'adv',
    phase: 'create',
    description: 'Crea un banner ADV reale del CMS.',
    humanFlow: 'ADV segue il flusso umano della redazione: slot, creatività, attivazione.',
    input: {
      name: 'Nome banner',
      position: 'header, sidebar, in_article, footer, interstitial',
      type: 'image, html, adsense',
      image_url: 'Immagine opzionale',
      html_content: 'HTML opzionale',
      link_url: 'Link target',
      is_active: 'Boolean',
    },
  },
  {
    name: 'cms.banner.update',
    category: 'adv',
    phase: 'configure',
    description: 'Aggiorna una creativita ADV esistente.',
    humanFlow: 'ADV cambia spesso creativita, date e peso senza dover ricreare tutto.',
    input: {
      bannerId: 'ID banner',
      patch: 'Patch banner',
    },
  },
  {
    name: 'cms.banner.delete',
    category: 'adv',
    phase: 'configure',
    description: 'Elimina un banner del tenant.',
    humanFlow: 'Serve a pulire creativita scadute o errate.',
    input: {
      bannerId: 'ID banner',
    },
  },
  {
    name: 'cms.breaking.list',
    category: 'events',
    phase: 'discover',
    description: 'Elenca le breaking news del tenant.',
    humanFlow: 'Prima di inserirne una nuova si controllano priorita e stato delle breaking attive.',
    input: {},
  },
  {
    name: 'cms.breaking.create',
    category: 'events',
    phase: 'create',
    description: 'Crea una breaking news reale del CMS.',
    humanFlow: 'Flusso rapido di redazione per news urgenti o alert.',
    input: {
      text: 'Testo breaking',
      link_url: 'Link opzionale',
      priority: 'Priorita',
      expires_at: 'Scadenza opzionale ISO',
      is_active: 'Boolean',
    },
  },
  {
    name: 'cms.breaking.update',
    category: 'events',
    phase: 'configure',
    description: 'Aggiorna una breaking news esistente.',
    humanFlow: 'Una breaking puo essere corretta, rilanciata o depotenziata nel tempo.',
    input: {
      breakingId: 'ID breaking',
      patch: 'Patch campi breaking',
    },
  },
  {
    name: 'cms.breaking.delete',
    category: 'events',
    phase: 'configure',
    description: 'Elimina una breaking news.',
    humanFlow: 'Si usa per pulire breaking obsolete o errate.',
    input: {
      breakingId: 'ID breaking',
    },
  },
  {
    name: 'cms.event.list',
    category: 'events',
    phase: 'discover',
    description: 'Elenca gli eventi del tenant.',
    humanFlow: 'La redazione controlla calendario eventi prima di inserire nuovi appuntamenti.',
    input: {
      upcomingOnly: 'Mostra solo futuri',
      limit: 'Limite opzionale',
    },
  },
  {
    name: 'cms.event.create',
    category: 'events',
    phase: 'create',
    description: 'Crea un evento reale del CMS.',
    humanFlow: 'Gli eventi seguono un flusso operativo simile a scheda calendario.',
    input: {
      title: 'Titolo evento',
      starts_at: 'Data inizio ISO',
      description: 'Descrizione',
      location: 'Luogo',
      image_url: 'Immagine',
      category: 'Categoria evento',
      price: 'Prezzo',
      ticket_url: 'URL biglietti',
      ends_at: 'Data fine ISO',
      is_recurring: 'Boolean',
      recurrence_rule: 'Regola ricorrenza',
    },
  },
  {
    name: 'cms.event.update',
    category: 'events',
    phase: 'configure',
    description: 'Aggiorna un evento esistente.',
    humanFlow: 'Permette di correggere date, location e dettagli senza ricreare la scheda.',
    input: {
      eventId: 'ID evento',
      patch: 'Patch evento',
    },
  },
  {
    name: 'cms.event.delete',
    category: 'events',
    phase: 'configure',
    description: 'Elimina un evento.',
    humanFlow: 'Serve a rimuovere appuntamenti annullati o duplicati.',
    input: {
      eventId: 'ID evento',
    },
  },
  {
    name: 'cms.form.list',
    category: 'forms',
    phase: 'discover',
    description: 'Elenca i form CMS disponibili per blocchi e workflow.',
    humanFlow: 'Prima di collegare un form in pagina, l’IA verifica i moduli esistenti.',
    input: {},
  },
  {
    name: 'cms.form.create',
    category: 'forms',
    phase: 'create',
    description: 'Crea un form reale del CMS da collegare ai blocchi.',
    humanFlow: 'Prima si crea il modulo, poi si collega il blocco form nella pagina.',
    input: {
      name: 'Nome form',
      slug: 'Slug form',
      description: 'Descrizione',
      fields: 'Array campi',
      recipient_emails: 'Array email destinatarie',
      success_message: 'Messaggio finale',
      is_active: 'Boolean',
    },
  },
  {
    name: 'cms.form.update',
    category: 'forms',
    phase: 'configure',
    description: 'Aggiorna un form CMS esistente.',
    humanFlow: 'I form evolvono nel tempo e vanno aggiornati senza rompere gli slug usati nei blocchi.',
    input: {
      formId: 'ID form',
      formSlug: 'Slug form alternativo',
      patch: 'Patch campi form',
    },
  },
  {
    name: 'cms.form.submission.list',
    category: 'forms',
    phase: 'discover',
    description: 'Elenca le submission di un form o del tenant.',
    humanFlow: 'Serve al tecnico per verificare richieste, lead e integrazioni.',
    input: {
      formId: 'ID form opzionale',
      formSlug: 'Slug form alternativo',
      status: 'Filtro stato opzionale',
      limit: 'Limite opzionale',
    },
  },
  {
    name: 'cms.comment.list',
    category: 'moderation',
    phase: 'discover',
    description: 'Elenca i commenti articolo del tenant.',
    humanFlow: 'La moderazione parte da una vista reale dei commenti in arrivo.',
    input: {
      status: 'pending, approved, spam, trash',
      limit: 'Limite opzionale',
    },
  },
  {
    name: 'cms.comment.moderate',
    category: 'moderation',
    phase: 'configure',
    description: 'Modera un commento cambiandone stato.',
    humanFlow: 'Approva, marca spam o cestina come farebbe il desk moderazione.',
    input: {
      commentId: 'ID commento',
      status: 'approved, pending, spam, trash',
    },
  },
  {
    name: 'cms.media.list',
    category: 'media',
    phase: 'discover',
    description: 'Elenca i media del tenant.',
    humanFlow: 'Prima di riusare o pulire i media, il desk controlla libreria e filtri.',
    input: {
      search: 'Ricerca filename opzionale',
      limit: 'Limite opzionale',
    },
  },
  {
    name: 'cms.media.update',
    category: 'media',
    phase: 'configure',
    description: 'Aggiorna metadati media come alt text o cartella.',
    humanFlow: 'Serve per sistemare SEO, accessibilita e organizzazione libreria.',
    input: {
      mediaId: 'ID media',
      patch: 'Patch media',
    },
  },
  {
    name: 'cms.media.delete',
    category: 'media',
    phase: 'configure',
    description: 'Elimina un media da database e storage.',
    humanFlow: 'Pulisce asset errati o non piu necessari.',
    input: {
      mediaId: 'ID media',
    },
  },
  {
    name: 'cms.newsletter.get',
    category: 'newsletter',
    phase: 'discover',
    description: 'Legge la configurazione centrale del modulo newsletter.',
    humanFlow: 'Prima di collegare blocchi o provider, il tecnico legge la config attuale.',
    input: {},
  },
  {
    name: 'cms.newsletter.update',
    category: 'newsletter',
    phase: 'configure',
    description: 'Aggiorna la configurazione centrale della newsletter.',
    humanFlow: 'Permette di allineare signup, provider e placements senza uscire dal flusso API.',
    input: {
      patch: 'Patch configurazione newsletter',
    },
  },
];

export const RECOMMENDED_WORKFLOWS: RecommendedWorkflow[] = [
  {
    id: 'homepage-human-flow',
    label: 'Homepage Human Flow',
    description: 'Flusso umano reale per costruire una homepage editoriale senza saltare passaggi.',
    steps: [
      'cms.page.list',
      'cms.page.create',
      'editor.block.add',
      'editor.block.update',
      'cms.navigation.set-menu',
      'cms.footer.update',
      'cms.page.publish',
    ],
  },
  {
    id: 'article-publication-flow',
    label: 'Article Publication Flow',
    description: 'Flusso redazionale completo per un articolo.',
    steps: [
      'cms.article.list',
      'cms.article.create',
      'cms.article.update',
      'cms.article.set-status',
    ],
  },
  {
    id: 'adv-placement-flow',
    label: 'ADV Placement Flow',
    description: 'Flusso per inserire ADV nel sito e collegarlo alla composizione builder.',
    steps: [
      'cms.banner.create',
      'editor.block.add',
      'editor.block.update',
      'cms.page.publish',
    ],
  },
];

function summarizeBlock(block: Block): Record<string, unknown> {
  return {
    id: block.id,
    type: block.type,
    label: block.label,
    hidden: block.hidden,
    locked: block.locked,
    childCount: block.children.length,
    children: block.children.map(summarizeBlock),
  };
}

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function slugifyValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function findBlock(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    const nested = findBlock(block.children, id);
    if (nested) return nested;
  }
  return null;
}

function updateBlockInTree(blocks: Block[], id: string, updater: (block: Block) => Block): Block[] {
  return blocks.map((block) => {
    if (block.id === id) return updater(block);
    return { ...block, children: updateBlockInTree(block.children, id, updater) };
  });
}

function removeBlockFromTree(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => ({ ...block, children: removeBlockFromTree(block.children, id) }));
}

function cloneBlock(block: Block): Block {
  return {
    ...block,
    id: crypto.randomUUID(),
    children: block.children.map(cloneBlock),
  };
}

function insertBlock(blocks: Block[], newBlock: Block, parentId?: string | null, index?: number): Block[] {
  if (!parentId) {
    const next = [...blocks];
    if (typeof index === 'number') next.splice(index, 0, newBlock);
    else next.push(newBlock);
    return next;
  }

  return blocks.map((block) => {
    if (block.id !== parentId) {
      return { ...block, children: insertBlock(block.children, newBlock, parentId, index) };
    }

    const nextChildren = [...block.children];
    if (typeof index === 'number') nextChildren.splice(index, 0, newBlock);
    else nextChildren.push(newBlock);
    return { ...block, children: nextChildren };
  });
}

function moveBlockTree(blocks: Block[], blockId: string, newParentId: string | null, newIndex: number): Block[] {
  const block = findBlock(blocks, blockId);
  if (!block) throw new Error(`Blocco ${blockId} non trovato`);
  const without = removeBlockFromTree(blocks, blockId);
  return insertBlock(without, block, newParentId, newIndex);
}

async function loadPageByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.pageId === 'string' && input.pageId) {
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.pageId)
      .single();
    if (error || !data) throw new Error('Pagina non trovata');
    return data;
  }

  if (typeof input.pageSlug === 'string' && input.pageSlug) {
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', input.pageSlug)
      .single();
    if (error || !data) throw new Error('Pagina non trovata');
    return data;
  }

  throw new Error('pageId o pageSlug richiesti');
}

async function loadSiteConfig(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from('site_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) throw new Error('Site config non trovata');
  return data;
}

function mergeRecord(base: unknown, patch: unknown) {
  return {
    ...(typeof base === 'object' && base !== null ? (base as Record<string, unknown>) : {}),
    ...(typeof patch === 'object' && patch !== null ? (patch as Record<string, unknown>) : {}),
  };
}

async function loadArticleByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.articleId === 'string' && input.articleId) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.articleId)
      .single();
    if (error || !data) throw new Error('Articolo non trovato');
    return data;
  }

  if (typeof input.articleSlug === 'string' && input.articleSlug) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', input.articleSlug)
      .single();
    if (error || !data) throw new Error('Articolo non trovato');
    return data;
  }

  throw new Error('articleId o articleSlug richiesti');
}

async function loadCategoryByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.categoryId === 'string' && input.categoryId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.categoryId)
      .single();
    if (error || !data) throw new Error('Categoria non trovata');
    return data;
  }

  if (typeof input.categorySlug === 'string' && input.categorySlug) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', input.categorySlug)
      .single();
    if (error || !data) throw new Error('Categoria non trovata');
    return data;
  }

  throw new Error('categoryId o categorySlug richiesti');
}

async function loadTagByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.tagId === 'string' && input.tagId) {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.tagId)
      .single();
    if (error || !data) throw new Error('Tag non trovato');
    return data;
  }

  if (typeof input.tagSlug === 'string' && input.tagSlug) {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', input.tagSlug)
      .single();
    if (error || !data) throw new Error('Tag non trovato');
    return data;
  }

  throw new Error('tagId o tagSlug richiesti');
}

async function loadEventByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.eventId === 'string' && input.eventId) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.eventId)
      .single();
    if (error || !data) throw new Error('Evento non trovato');
    return data;
  }

  throw new Error('eventId richiesto');
}

async function loadBreakingByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.breakingId === 'string' && input.breakingId) {
    const { data, error } = await supabase
      .from('breaking_news')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.breakingId)
      .single();
    if (error || !data) throw new Error('Breaking news non trovata');
    return data;
  }

  throw new Error('breakingId richiesto');
}

async function loadBannerByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.bannerId === 'string' && input.bannerId) {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.bannerId)
      .single();
    if (error || !data) throw new Error('Banner non trovato');
    return data;
  }

  throw new Error('bannerId richiesto');
}

async function loadFormByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.formId === 'string' && input.formId) {
    const { data, error } = await supabase
      .from('site_forms')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.formId)
      .single();
    if (error || !data) throw new Error('Form non trovato');
    return data;
  }

  if (typeof input.formSlug === 'string' && input.formSlug) {
    const { data, error } = await supabase
      .from('site_forms')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', input.formSlug)
      .single();
    if (error || !data) throw new Error('Form non trovato');
    return data;
  }

  throw new Error('formId o formSlug richiesti');
}

async function loadCommentByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.commentId === 'string' && input.commentId) {
    const { data, error } = await supabase
      .from('article_comments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.commentId)
      .single();
    if (error || !data) throw new Error('Commento non trovato');
    return data;
  }

  throw new Error('commentId richiesto');
}

async function loadMediaByInput(supabase: SupabaseClient, tenantId: string, input: Record<string, unknown>) {
  if (typeof input.mediaId === 'string' && input.mediaId) {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', input.mediaId)
      .single();
    if (error || !data) throw new Error('Media non trovato');
    return data;
  }

  throw new Error('mediaId richiesto');
}

export function getCommandDiscovery(): CommandDiscoveryResponse {
  return {
    catalog: COMMAND_CATALOG,
    workflows: RECOMMENDED_WORKFLOWS,
    blockCategories: BLOCK_CATEGORIES,
    blockDefinitions: getAllBlockDefinitions().map((definition) => ({
      type: definition.type,
      label: definition.label,
      description: definition.description,
      category: definition.category,
      icon: definition.icon,
      supportsChildren: definition.supportsChildren,
      maxChildren: definition.maxChildren,
      allowedChildTypes: definition.allowedChildTypes,
      defaultProps: definition.defaultProps,
      defaultStyle: definition.defaultStyle as Record<string, unknown>,
      defaultDataSource: definition.defaultDataSource,
    })),
  };
}

export async function executeCommands(
  context: CommandExecutionContext,
  commands: CommandEnvelope[]
): Promise<CommandExecutionResult[]> {
  const results: CommandExecutionResult[] = [];

  for (const item of commands) {
    try {
      const data = await executeSingleCommand(context, item);
      results.push({
        command: item.command,
        clientRequestId: item.clientRequestId,
        success: true,
        dryRun: context.dryRun,
        message: data.message,
        data: data.data,
      });
    } catch (error) {
      results.push({
        command: item.command,
        clientRequestId: item.clientRequestId,
        success: false,
        dryRun: context.dryRun,
        message: error instanceof Error ? error.message : 'Errore comando',
      });
    }
  }

  return results;
}

async function executeSingleCommand(
  context: CommandExecutionContext,
  item: CommandEnvelope
): Promise<{ message: string; data?: unknown }> {
  const input = item.input || {};
  const supabase = context.supabase;

  switch (item.command) {
    case 'cms.theme.contract.get': {
      return {
        message: 'Contract tema custom letto',
        data: getThemeContract({ tenantId: context.tenantId }),
      };
    }

    case 'cms.page.list': {
      const { data, error } = await supabase
        .from('site_pages')
        .select('id, title, slug, page_type, is_published, updated_at')
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return { message: `Trovate ${data?.length || 0} pagine`, data };
    }

    case 'cms.page.get': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      return { message: `Pagina letta: ${page.title}`, data: page };
    }

    case 'cms.page.create': {
      if (context.dryRun) {
        return { message: `Dry-run: creerei la pagina "${String(input.title || 'Nuova pagina')}"` };
      }

      const slug = typeof input.slug === 'string' && input.slug.trim()
        ? input.slug.trim()
        : String(input.title || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || crypto.randomUUID();

      const { data, error } = await supabase
        .from('site_pages')
        .insert({
          tenant_id: context.tenantId,
          title: String(input.title || 'Nuova pagina'),
          slug,
          page_type: String(input.page_type || 'custom'),
          meta: typeof input.meta === 'object' && input.meta ? input.meta : {},
          blocks: Array.isArray(input.blocks) ? input.blocks : [],
          is_published: Boolean(input.is_published),
          created_by: context.userId,
        })
        .select('id, title, slug, is_published')
        .single();
      if (error) throw error;
      return { message: `Pagina creata: ${data.title}`, data };
    }

    case 'cms.page.update': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const patch: Record<string, unknown> = {};
      for (const key of ['title', 'slug', 'meta', 'blocks', 'custom_css', 'is_published', 'sort_order', 'page_type']) {
        if (key in input) patch[key] = input[key];
      }

      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei la pagina "${page.title}"` };
      }

      const { data, error } = await supabase
        .from('site_pages')
        .update(patch)
        .eq('id', page.id)
        .select('id, title, slug, is_published')
        .single();
      if (error) throw error;
      return { message: `Pagina aggiornata: ${data.title}`, data };
    }

    case 'cms.page.publish': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      if (context.dryRun) {
        return { message: `Dry-run: pubblicherei la pagina "${page.title}"` };
      }
      const { data, error } = await supabase
        .from('site_pages')
        .update({ is_published: true })
        .eq('id', page.id)
        .select('id, title, slug, is_published')
        .single();
      if (error) throw error;
      return { message: `Pagina pubblicata: ${data.title}`, data };
    }

    case 'editor.block.list': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const blocks = ensureArray(page.blocks as Block[]);
      return {
        message: `Letto albero blocchi di "${page.title}"`,
        data: blocks.map(summarizeBlock),
      };
    }

    case 'editor.block.add': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const blockType = String(input.blockType || '').trim() as BlockType;
      if (!blockType) throw new Error('blockType richiesto');

      const definition = getBlockDefinition(blockType);
      if (!definition) throw new Error(`Blocco ${blockType} non trovato`);

      const block = createBlock(
        definition.type,
        typeof input.label === 'string' && input.label ? input.label : definition.label,
        { ...definition.defaultProps, ...(typeof input.props === 'object' && input.props ? input.props : {}) },
        definition.defaultStyle
      );
      block.id = crypto.randomUUID();
      block.shape = (input.shape as BlockShape | null) ?? null;
      block.animation = (input.animation as Block['animation']) ?? null;
      block.responsive = (input.responsive as Block['responsive']) ?? {};
      block.hidden = Boolean(input.hidden);
      block.locked = Boolean(input.locked);
      block.dataSource = (input.dataSource as DataSource | undefined) ?? definition.defaultDataSource;
      if (input.style && typeof input.style === 'object') {
        const style = input.style as Partial<BlockStyle>;
        block.style = {
          layout: { ...block.style.layout, ...style.layout },
          background: { ...block.style.background, ...style.background },
          typography: { ...block.style.typography, ...style.typography },
          border: { ...block.style.border, ...style.border },
          shadow: style.shadow ?? block.style.shadow,
          opacity: style.opacity ?? block.style.opacity,
          transform: style.transform ?? block.style.transform,
          transition: style.transition ?? block.style.transition,
          filter: style.filter ?? block.style.filter,
          backdropFilter: style.backdropFilter ?? block.style.backdropFilter,
          mixBlendMode: style.mixBlendMode ?? block.style.mixBlendMode,
          textShadow: style.textShadow ?? block.style.textShadow,
          customCss: style.customCss ?? block.style.customCss,
          effects: style.effects ?? block.style.effects,
        };
      }

      const currentBlocks = ensureArray(page.blocks as Block[]);
      const nextBlocks = insertBlock(
        currentBlocks,
        block,
        typeof input.parentId === 'string' ? input.parentId : null,
        typeof input.index === 'number' ? input.index : undefined
      );

      if (context.dryRun) {
        return { message: `Dry-run: aggiungerei il blocco ${block.type} in "${page.title}"`, data: { blockId: block.id } };
      }

      const { error } = await supabase
        .from('site_pages')
        .update({ blocks: nextBlocks })
        .eq('id', page.id);
      if (error) throw error;

      return { message: `Blocco ${block.type} aggiunto`, data: { blockId: block.id, pageId: page.id } };
    }

    case 'editor.block.update': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const blockId = String(input.blockId || '');
      if (!blockId) throw new Error('blockId richiesto');

      const patch = (input.patch || {}) as Record<string, unknown>;
      const currentBlocks = ensureArray(page.blocks as Block[]);
      const existing = findBlock(currentBlocks, blockId);
      if (!existing) throw new Error(`Blocco ${blockId} non trovato`);

      const nextBlocks = updateBlockInTree(currentBlocks, blockId, (block) => ({
        ...block,
        label: typeof patch.label === 'string' ? patch.label : block.label,
        props: patch.props && typeof patch.props === 'object' ? { ...block.props, ...(patch.props as Record<string, unknown>) } : block.props,
        style: patch.style && typeof patch.style === 'object'
          ? {
              layout: { ...block.style.layout, ...((patch.style as Partial<BlockStyle>).layout || {}) },
              background: { ...block.style.background, ...((patch.style as Partial<BlockStyle>).background || {}) },
              typography: { ...block.style.typography, ...((patch.style as Partial<BlockStyle>).typography || {}) },
              border: { ...block.style.border, ...((patch.style as Partial<BlockStyle>).border || {}) },
              shadow: (patch.style as Partial<BlockStyle>).shadow ?? block.style.shadow,
              opacity: (patch.style as Partial<BlockStyle>).opacity ?? block.style.opacity,
              transform: (patch.style as Partial<BlockStyle>).transform ?? block.style.transform,
              transition: (patch.style as Partial<BlockStyle>).transition ?? block.style.transition,
              filter: (patch.style as Partial<BlockStyle>).filter ?? block.style.filter,
              backdropFilter: (patch.style as Partial<BlockStyle>).backdropFilter ?? block.style.backdropFilter,
              mixBlendMode: (patch.style as Partial<BlockStyle>).mixBlendMode ?? block.style.mixBlendMode,
              textShadow: (patch.style as Partial<BlockStyle>).textShadow ?? block.style.textShadow,
              customCss: (patch.style as Partial<BlockStyle>).customCss ?? block.style.customCss,
              effects: (patch.style as Partial<BlockStyle>).effects ?? block.style.effects,
            }
          : block.style,
        shape: patch.shape !== undefined ? (patch.shape as BlockShape | null) : block.shape,
        animation: patch.animation !== undefined ? (patch.animation as Block['animation']) : block.animation,
        responsive: patch.responsive && typeof patch.responsive === 'object' ? (patch.responsive as Block['responsive']) : block.responsive,
        dataSource: patch.dataSource && typeof patch.dataSource === 'object' ? (patch.dataSource as DataSource) : block.dataSource,
        hidden: typeof patch.hidden === 'boolean' ? patch.hidden : block.hidden,
        locked: typeof patch.locked === 'boolean' ? patch.locked : block.locked,
      }));

      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei il blocco ${existing.label}` };
      }

      const { error } = await supabase
        .from('site_pages')
        .update({ blocks: nextBlocks })
        .eq('id', page.id);
      if (error) throw error;
      return { message: `Blocco aggiornato: ${existing.label}` };
    }

    case 'editor.block.remove': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const blockId = String(input.blockId || '');
      if (!blockId) throw new Error('blockId richiesto');
      const currentBlocks = ensureArray(page.blocks as Block[]);
      const existing = findBlock(currentBlocks, blockId);
      if (!existing) throw new Error(`Blocco ${blockId} non trovato`);
      const nextBlocks = removeBlockFromTree(currentBlocks, blockId);

      if (context.dryRun) {
        return { message: `Dry-run: rimuoverei il blocco ${existing.label}` };
      }

      const { error } = await supabase.from('site_pages').update({ blocks: nextBlocks }).eq('id', page.id);
      if (error) throw error;
      return { message: `Blocco rimosso: ${existing.label}` };
    }

    case 'editor.block.move': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const blockId = String(input.blockId || '');
      if (!blockId) throw new Error('blockId richiesto');
      const newIndex = Number(input.newIndex ?? 0);
      const nextBlocks = moveBlockTree(
        ensureArray(page.blocks as Block[]),
        blockId,
        typeof input.newParentId === 'string' ? input.newParentId : null,
        Number.isNaN(newIndex) ? 0 : newIndex
      );

      if (context.dryRun) {
        return { message: `Dry-run: sposterei il blocco ${blockId}` };
      }

      const { error } = await supabase.from('site_pages').update({ blocks: nextBlocks }).eq('id', page.id);
      if (error) throw error;
      return { message: `Blocco spostato: ${blockId}` };
    }

    case 'editor.block.duplicate': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const blockId = String(input.blockId || '');
      if (!blockId) throw new Error('blockId richiesto');
      const currentBlocks = ensureArray(page.blocks as Block[]);
      const existing = findBlock(currentBlocks, blockId);
      if (!existing) throw new Error(`Blocco ${blockId} non trovato`);
      const duplicated = cloneBlock(existing);

      const insertAfter = (blocks: Block[]): Block[] => {
        const idx = blocks.findIndex((block) => block.id === blockId);
        if (idx !== -1) {
          const next = [...blocks];
          next.splice(idx + 1, 0, duplicated);
          return next;
        }
        return blocks.map((block) => ({ ...block, children: insertAfter(block.children) }));
      };

      const nextBlocks = insertAfter(currentBlocks);
      if (context.dryRun) {
        return { message: `Dry-run: duplicherei il blocco ${existing.label}`, data: { blockId: duplicated.id } };
      }
      const { error } = await supabase.from('site_pages').update({ blocks: nextBlocks }).eq('id', page.id);
      if (error) throw error;
      return { message: `Blocco duplicato: ${existing.label}`, data: { blockId: duplicated.id } };
    }

    case 'editor.verify.page': {
      const page = await loadPageByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const blocks = ensureArray(page.blocks as Block[]);
      const summary = summarizeBlockTree(blocks);
      return {
        message: `Verifica pagina completata: ${summary.blockCount} blocchi, profondità massima ${summary.maxDepth}`,
        data: {
          page: {
            id: page.id,
            title: page.title,
            slug: page.slug,
          },
          summary,
        },
      };
    }

    case 'cms.article.list': {
      let query = supabase
        .from('articles')
        .select('id, title, slug, status, published_at, updated_at')
        .eq('tenant_id', context.tenantId)
        .order('updated_at', { ascending: false });
      if (typeof input.status === 'string' && input.status) query = query.eq('status', input.status);
      if (typeof input.categoryId === 'string' && input.categoryId) query = query.eq('category_id', input.categoryId);
      if (typeof input.limit === 'number') query = query.limit(input.limit);
      const { data, error } = await query;
      if (error) throw error;
      return { message: `Trovati ${data?.length || 0} articoli`, data };
    }

    case 'cms.article.get': {
      const article = await loadArticleByInput(supabase, context.tenantId, input as Record<string, unknown>);
      return { message: `Articolo letto: ${article.title}`, data: article };
    }

    case 'cms.article.create': {
      if (context.dryRun) {
        return { message: `Dry-run: creerei l'articolo "${String(input.title || 'Nuovo articolo')}"` };
      }

      const status = String(input.status || 'draft');
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        tenant_id: context.tenantId,
        author_id: context.userId,
        title: String(input.title || 'Nuovo articolo'),
        slug: typeof input.slug === 'string' && input.slug ? input.slug : String(input.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        subtitle: input.subtitle ?? null,
        summary: input.summary ?? null,
        body: input.body ?? '',
        cover_image_url: input.cover_image_url ?? null,
        category_id: input.category_id ?? null,
        status,
        is_featured: Boolean(input.is_featured),
        is_breaking: Boolean(input.is_breaking),
        is_premium: Boolean(input.is_premium),
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
        og_image_url: input.og_image_url ?? null,
        published_at: status === 'published' ? now : null,
        scheduled_at: status === 'approved' && input.scheduled_at ? input.scheduled_at : null,
      };
      const { data, error } = await supabase.from('articles').insert(payload).select('id, title, slug, status').single();
      if (error) throw error;
      return { message: `Articolo creato: ${data.title}`, data };
    }

    case 'cms.article.update': {
      const articleId = String(input.articleId || '');
      if (!articleId) throw new Error('articleId richiesto');
      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei l'articolo ${articleId}` };
      }
      const patch = typeof input.patch === 'object' && input.patch ? input.patch : {};
      const { data, error } = await supabase
        .from('articles')
        .update(patch)
        .eq('tenant_id', context.tenantId)
        .eq('id', articleId)
        .select('id, title, slug, status')
        .single();
      if (error) throw error;
      return { message: `Articolo aggiornato: ${data.title}`, data };
    }

    case 'cms.article.set-status': {
      const articleId = String(input.articleId || '');
      const status = String(input.status || '');
      if (!articleId || !status) throw new Error('articleId e status richiesti');
      const patch: Record<string, unknown> = { status };
      if (status === 'published') patch.published_at = typeof input.scheduled_at === 'string' ? input.scheduled_at : new Date().toISOString();
      if (status === 'approved' && typeof input.scheduled_at === 'string') patch.scheduled_at = input.scheduled_at;
      if (status !== 'published') patch.published_at = status === 'archived' ? null : patch.published_at ?? null;

      if (context.dryRun) {
        return { message: `Dry-run: imposterei lo stato ${status} per ${articleId}` };
      }

      const { data, error } = await supabase
        .from('articles')
        .update(patch)
        .eq('tenant_id', context.tenantId)
        .eq('id', articleId)
        .select('id, title, slug, status, published_at, scheduled_at')
        .single();
      if (error) throw error;
      return { message: `Stato articolo aggiornato a ${status}`, data };
    }

    case 'cms.category.list': {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, color, sort_order')
        .eq('tenant_id', context.tenantId)
        .order('sort_order');
      if (error) throw error;
      return { message: `Trovate ${data?.length || 0} categorie`, data };
    }

    case 'cms.category.create': {
      const name = String(input.name || '').trim();
      if (!name) throw new Error('name richiesto');
      if (context.dryRun) {
        return { message: `Dry-run: creerei la categoria "${name}"` };
      }

      const { count } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', context.tenantId);

      const { data, error } = await supabase
        .from('categories')
        .insert({
          tenant_id: context.tenantId,
          name,
          slug: typeof input.slug === 'string' && input.slug.trim() ? input.slug.trim() : slugifyValue(name),
          description: input.description ?? null,
          color: typeof input.color === 'string' && input.color ? input.color : '#8B0000',
          sort_order: typeof input.sort_order === 'number' ? input.sort_order : (count ?? 0),
        })
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Categoria creata: ${data.name}`, data };
    }

    case 'cms.category.update': {
      const category = await loadCategoryByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const patch = typeof input.patch === 'object' && input.patch ? { ...(input.patch as Record<string, unknown>) } : {};
      if (typeof patch.name === 'string' && !patch.slug) {
        patch.slug = slugifyValue(patch.name);
      }
      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei la categoria "${category.name}"` };
      }
      const { data, error } = await supabase
        .from('categories')
        .update(patch)
        .eq('id', category.id)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Categoria aggiornata: ${data.name}`, data };
    }

    case 'cms.category.delete': {
      const category = await loadCategoryByInput(supabase, context.tenantId, input as Record<string, unknown>);
      if (context.dryRun) {
        return { message: `Dry-run: eliminerei la categoria "${category.name}"` };
      }
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
        .eq('tenant_id', context.tenantId);
      if (error) throw error;
      return { message: `Categoria eliminata: ${category.name}` };
    }

    case 'cms.tag.list': {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, slug')
        .eq('tenant_id', context.tenantId)
        .order('name');
      if (error) throw error;
      return { message: `Trovati ${data?.length || 0} tag`, data };
    }

    case 'cms.tag.create': {
      const name = String(input.name || '').trim();
      if (!name) throw new Error('name richiesto');
      if (context.dryRun) {
        return { message: `Dry-run: creerei il tag "${name}"` };
      }
      const { data, error } = await supabase
        .from('tags')
        .insert({
          tenant_id: context.tenantId,
          name,
          slug: typeof input.slug === 'string' && input.slug.trim() ? input.slug.trim() : slugifyValue(name),
        })
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Tag creato: ${data.name}`, data };
    }

    case 'cms.tag.update': {
      const tag = await loadTagByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const patch = typeof input.patch === 'object' && input.patch ? { ...(input.patch as Record<string, unknown>) } : {};
      if (typeof patch.name === 'string' && !patch.slug) {
        patch.slug = slugifyValue(patch.name);
      }
      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei il tag "${tag.name}"` };
      }
      const { data, error } = await supabase
        .from('tags')
        .update(patch)
        .eq('id', tag.id)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Tag aggiornato: ${data.name}`, data };
    }

    case 'cms.tag.delete': {
      const tag = await loadTagByInput(supabase, context.tenantId, input as Record<string, unknown>);
      if (context.dryRun) {
        return { message: `Dry-run: eliminerei il tag "${tag.name}"` };
      }
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tag.id)
        .eq('tenant_id', context.tenantId);
      if (error) throw error;
      return { message: `Tag eliminato: ${tag.name}` };
    }

    case 'cms.site-config.get': {
      const config = await loadSiteConfig(supabase, context.tenantId);
      return { message: 'Configurazione sito letta', data: config };
    }

    case 'cms.site-config.update': {
      const config = await loadSiteConfig(supabase, context.tenantId);
      const patch = typeof input.patch === 'object' && input.patch ? (input.patch as Record<string, unknown>) : {};
      const update: Record<string, unknown> = {};

      if (patch.theme) update.theme = mergeRecord(config.theme, patch.theme);
      if (patch.navigation) update.navigation = patch.navigation;
      if (patch.footer) update.footer = mergeRecord(config.footer, patch.footer);
      for (const key of ['global_css', 'global_head', 'favicon_url', 'og_defaults']) {
        if (key in patch) update[key] = patch[key];
      }

      if (context.dryRun) {
        return { message: 'Dry-run: aggiornerei la configurazione globale del sito' };
      }

      const { data, error } = await supabase
        .from('site_config')
        .update(update)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: 'Configurazione sito aggiornata', data };
    }

    case 'cms.navigation.set-menu': {
      const config = await loadSiteConfig(supabase, context.tenantId);
      const menuKey = String(input.menuKey || '');
      if (!menuKey) throw new Error('menuKey richiesto');
      const existingNav = typeof config.navigation === 'object' && config.navigation ? (config.navigation as Record<string, unknown>) : {};
      const navigation = { ...existingNav, [menuKey]: ensureArray(input.items as Record<string, unknown>[]) };

      if (context.dryRun) {
        return { message: `Dry-run: sostituirei il menu ${menuKey}` };
      }

      const { data, error } = await supabase
        .from('site_config')
        .update({ navigation })
        .eq('tenant_id', context.tenantId)
        .select('navigation')
        .single();
      if (error) throw error;
      return { message: `Menu ${menuKey} aggiornato`, data };
    }

    case 'cms.footer.update': {
      const config = await loadSiteConfig(supabase, context.tenantId);
      const patch = typeof input.patch === 'object' && input.patch ? input.patch : {};
      const footer = mergeRecord(config.footer, patch);

      if (context.dryRun) {
        return { message: 'Dry-run: aggiornerei il footer globale' };
      }

      const { data, error } = await supabase
        .from('site_config')
        .update({ footer })
        .eq('tenant_id', context.tenantId)
        .select('footer')
        .single();
      if (error) throw error;
      return { message: 'Footer aggiornato', data };
    }

    case 'cms.banner.create': {
      if (context.dryRun) {
        return { message: `Dry-run: creerei il banner "${String(input.name || 'Nuovo banner')}"` };
      }

      const { data, error } = await supabase
        .from('banners')
        .insert({
          tenant_id: context.tenantId,
          name: String(input.name || 'Nuovo banner'),
          position: String(input.position || 'sidebar'),
          type: String(input.type || 'image'),
          image_url: input.image_url ?? null,
          html_content: input.html_content ?? null,
          link_url: input.link_url ?? null,
          target_categories: ensureArray(input.target_categories as string[]),
          target_device: String(input.target_device || 'all'),
          weight: Number(input.weight ?? 0),
          is_active: 'is_active' in input ? Boolean(input.is_active) : true,
        })
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Banner creato: ${data.name}`, data };
    }

    case 'cms.banner.list': {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { message: `Trovati ${data?.length || 0} banner`, data };
    }

    case 'cms.banner.update': {
      const banner = await loadBannerByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const patch = typeof input.patch === 'object' && input.patch ? input.patch : {};
      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei il banner "${banner.name}"` };
      }
      const { data, error } = await supabase
        .from('banners')
        .update(patch)
        .eq('id', banner.id)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Banner aggiornato: ${data.name}`, data };
    }

    case 'cms.banner.delete': {
      const banner = await loadBannerByInput(supabase, context.tenantId, input as Record<string, unknown>);
      if (context.dryRun) {
        return { message: `Dry-run: eliminerei il banner "${banner.name}"` };
      }
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', banner.id)
        .eq('tenant_id', context.tenantId);
      if (error) throw error;
      return { message: `Banner eliminato: ${banner.name}` };
    }

    case 'cms.breaking.list': {
      const { data, error } = await supabase
        .from('breaking_news')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { message: `Trovate ${data?.length || 0} breaking news`, data };
    }

    case 'cms.breaking.create': {
      const text = String(input.text || '').trim();
      if (!text) throw new Error('text richiesto');
      if (context.dryRun) {
        return { message: `Dry-run: creerei la breaking "${text.slice(0, 48)}"` };
      }
      const { data, error } = await supabase
        .from('breaking_news')
        .insert({
          tenant_id: context.tenantId,
          text,
          link_url: input.link_url ?? null,
          priority: typeof input.priority === 'number' ? input.priority : 0,
          created_by: context.userId,
          expires_at: input.expires_at ?? null,
          is_active: 'is_active' in input ? Boolean(input.is_active) : true,
        })
        .select('*')
        .single();
      if (error) throw error;
      return { message: 'Breaking news creata', data };
    }

    case 'cms.breaking.update': {
      const breaking = await loadBreakingByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const patch = typeof input.patch === 'object' && input.patch ? input.patch : {};
      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei la breaking "${breaking.text}"` };
      }
      const { data, error } = await supabase
        .from('breaking_news')
        .update(patch)
        .eq('id', breaking.id)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: 'Breaking news aggiornata', data };
    }

    case 'cms.breaking.delete': {
      const breaking = await loadBreakingByInput(supabase, context.tenantId, input as Record<string, unknown>);
      if (context.dryRun) {
        return { message: `Dry-run: eliminerei la breaking "${breaking.text}"` };
      }
      const { error } = await supabase
        .from('breaking_news')
        .delete()
        .eq('id', breaking.id)
        .eq('tenant_id', context.tenantId);
      if (error) throw error;
      return { message: 'Breaking news eliminata' };
    }

    case 'cms.event.list': {
      let query = supabase
        .from('events')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('starts_at', { ascending: true });
      if (input.upcomingOnly !== false) {
        query = query.gte('starts_at', new Date().toISOString());
      }
      if (typeof input.limit === 'number') {
        query = query.limit(input.limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { message: `Trovati ${data?.length || 0} eventi`, data };
    }

    case 'cms.event.create': {
      const title = String(input.title || '').trim();
      const startsAt = String(input.starts_at || '').trim();
      if (!title || !startsAt) throw new Error('title e starts_at richiesti');
      if (context.dryRun) {
        return { message: `Dry-run: creerei l'evento "${title}"` };
      }
      const { data, error } = await supabase
        .from('events')
        .insert({
          tenant_id: context.tenantId,
          title,
          description: input.description ?? null,
          location: input.location ?? null,
          image_url: input.image_url ?? null,
          category: input.category ?? null,
          price: input.price ?? null,
          ticket_url: input.ticket_url ?? null,
          starts_at: startsAt,
          ends_at: input.ends_at ?? null,
          is_recurring: Boolean(input.is_recurring),
          recurrence_rule: input.recurrence_rule ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Evento creato: ${data.title}`, data };
    }

    case 'cms.event.update': {
      const event = await loadEventByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const patch = typeof input.patch === 'object' && input.patch ? input.patch : {};
      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei l'evento "${event.title}"` };
      }
      const { data, error } = await supabase
        .from('events')
        .update(patch)
        .eq('id', event.id)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Evento aggiornato: ${data.title}`, data };
    }

    case 'cms.event.delete': {
      const event = await loadEventByInput(supabase, context.tenantId, input as Record<string, unknown>);
      if (context.dryRun) {
        return { message: `Dry-run: eliminerei l'evento "${event.title}"` };
      }
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)
        .eq('tenant_id', context.tenantId);
      if (error) throw error;
      return { message: `Evento eliminato: ${event.title}` };
    }

    case 'cms.form.list': {
      const { data, error } = await supabase
        .from('site_forms')
        .select('id, name, slug, is_active, updated_at')
        .eq('tenant_id', context.tenantId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return { message: `Trovati ${data?.length || 0} form`, data };
    }

    case 'cms.form.create': {
      if (context.dryRun) {
        return { message: `Dry-run: creerei il form "${String(input.name || 'Nuovo form')}"` };
      }

      const { data, error } = await supabase
        .from('site_forms')
        .insert({
          tenant_id: context.tenantId,
          name: String(input.name || 'Nuovo form'),
          slug: String(input.slug || '').trim(),
          description: input.description ?? null,
          fields: ensureArray(input.fields as Record<string, unknown>[]),
          recipient_emails: ensureArray(input.recipient_emails as string[]),
          success_message: input.success_message ?? null,
          is_active: 'is_active' in input ? Boolean(input.is_active) : true,
        })
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Form creato: ${data.name}`, data };
    }

    case 'cms.form.update': {
      const form = await loadFormByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const patch = typeof input.patch === 'object' && input.patch ? input.patch : {};
      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei il form "${form.name}"` };
      }
      const { data, error } = await supabase
        .from('site_forms')
        .update(patch)
        .eq('id', form.id)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Form aggiornato: ${data.name}`, data };
    }

    case 'cms.form.submission.list': {
      let query = supabase
        .from('form_submissions')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: false });

      if (typeof input.formId === 'string' && input.formId) {
        query = query.eq('form_id', input.formId);
      } else if (typeof input.formSlug === 'string' && input.formSlug) {
        const form = await loadFormByInput(supabase, context.tenantId, input as Record<string, unknown>);
        query = query.eq('form_id', form.id);
      }

      if (typeof input.status === 'string' && input.status) {
        query = query.eq('status', input.status);
      }
      if (typeof input.limit === 'number') {
        query = query.limit(input.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { message: `Trovate ${data?.length || 0} submission`, data };
    }

    case 'cms.comment.list': {
      let query = supabase
        .from('article_comments')
        .select('id, article_id, author_name, author_email, author_url, body, status, created_at, published_at')
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: false });
      if (typeof input.status === 'string' && input.status) {
        query = query.eq('status', input.status);
      }
      if (typeof input.limit === 'number') {
        query = query.limit(input.limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { message: `Trovati ${data?.length || 0} commenti`, data };
    }

    case 'cms.comment.moderate': {
      const comment = await loadCommentByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const status = String(input.status || '').trim();
      if (!status) throw new Error('status richiesto');
      if (context.dryRun) {
        return { message: `Dry-run: modererei il commento ${comment.id} come ${status}` };
      }
      const { data, error } = await supabase
        .from('article_comments')
        .update({
          status,
          published_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', comment.id)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Commento aggiornato a ${status}`, data };
    }

    case 'cms.media.list': {
      let query = supabase
        .from('media')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: false });
      if (typeof input.search === 'string' && input.search.trim()) {
        query = query.ilike('original_filename', `%${input.search.trim()}%`);
      }
      if (typeof input.limit === 'number') {
        query = query.limit(input.limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { message: `Trovati ${data?.length || 0} media`, data };
    }

    case 'cms.media.update': {
      const media = await loadMediaByInput(supabase, context.tenantId, input as Record<string, unknown>);
      const patch = typeof input.patch === 'object' && input.patch ? input.patch : {};
      if (context.dryRun) {
        return { message: `Dry-run: aggiornerei il media "${media.original_filename}"` };
      }
      const { data, error } = await supabase
        .from('media')
        .update(patch)
        .eq('id', media.id)
        .eq('tenant_id', context.tenantId)
        .select('*')
        .single();
      if (error) throw error;
      return { message: `Media aggiornato: ${data.original_filename}`, data };
    }

    case 'cms.media.delete': {
      const media = await loadMediaByInput(supabase, context.tenantId, input as Record<string, unknown>);
      if (context.dryRun) {
        return { message: `Dry-run: eliminerei il media "${media.original_filename}"` };
      }
      const storageError = await supabase.storage.from('media').remove([String(media.filename || '')]);
      if (storageError.error) throw storageError.error;
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', media.id)
        .eq('tenant_id', context.tenantId);
      if (error) throw error;
      return { message: `Media eliminato: ${media.original_filename}` };
    }

    case 'cms.newsletter.get': {
      const config = await loadSiteConfig(supabase, context.tenantId);
      const newsletter = normalizeNewsletterConfig(config.footer);
      return { message: 'Configurazione newsletter letta', data: newsletter };
    }

    case 'cms.newsletter.update': {
      const config = await loadSiteConfig(supabase, context.tenantId);
      const current = normalizeNewsletterConfig(config.footer);
      const patch = typeof input.patch === 'object' && input.patch ? (input.patch as Record<string, unknown>) : {};
      const draft = {
        ...current,
        ...patch,
        provider: mergeRecord(current.provider, patch.provider),
        digest: mergeRecord(current.digest, patch.digest),
        placements: mergeRecord(current.placements, patch.placements),
        leadMagnet: mergeRecord(current.leadMagnet, patch.leadMagnet),
        segments: Array.isArray(patch.segments)
          ? ensureArray(patch.segments as Array<{ label: string; value: string }>)
          : current.segments,
      };
      const next = normalizeNewsletterConfig({
        newsletterSettings: draft,
        newsletter: {
          enabled: Boolean((draft as Record<string, unknown>).enabled),
          title: (draft as Record<string, unknown>).title,
          description: (draft as Record<string, unknown>).description,
          buttonText: (draft as Record<string, unknown>).buttonText,
          formSlug: (draft as Record<string, unknown>).formSlug,
        },
      });

      if (context.dryRun) {
        return { message: 'Dry-run: aggiornerei il modulo newsletter' };
      }

      const footer = mergeNewsletterIntoFooter(config.footer, next);
      const { data, error } = await supabase
        .from('site_config')
        .update({ footer })
        .eq('tenant_id', context.tenantId)
        .select('footer')
        .single();
      if (error) throw error;
      return { message: 'Newsletter aggiornata', data: normalizeNewsletterConfig(data.footer) };
    }

    default:
      throw new Error(`Comando non supportato: ${item.command}`);
  }
}
