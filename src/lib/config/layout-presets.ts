// Each row: [height in px, ...column widths as percentages]
// First element = row height, rest = column widths
export type LayoutRow = [number, ...string[]];

export interface LayoutPresetDef {
  id: string;
  name: string;
  description: string;
  category: 'editorial' | 'blog' | 'landing' | 'portfolio' | 'news' | 'magazine' | 'corporate' | 'creative' | 'minimal' | 'fantasy' | '2-colonne' | '3-colonne' | '4-colonne';
  rows: LayoutRow[];
  svg?: string; // Optional SVG thumbnail for complex shapes
}

export const LAYOUT_PRESETS: LayoutPresetDef[] = [

  // ═══════════════════════════════════════════════════════════════
  // EDITORIAL (7)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ed-classic', name: 'Editoriale Classico', category: 'editorial',
    description: 'Header, hero grande, contenuto con sidebar, footer',
    rows: [[8, '100%'], [40, '100%'], [6, '100%'], [30, '68%', '28%'], [30, '68%', '28%'], [10, '100%']],
  },
  {
    id: 'ed-magazine', name: 'Editoriale Magazine', category: 'editorial',
    description: 'Copertina full, 3 articoli, pubblicità, 2 colonne, footer',
    rows: [[8, '100%'], [50, '100%'], [25, '32%', '32%', '32%'], [8, '100%'], [30, '50%', '50%'], [10, '100%']],
  },
  {
    id: 'ed-longform', name: 'Longform Article', category: 'editorial',
    description: 'Articolo lungo con sezioni alternate testo e immagini',
    rows: [[8, '100%'], [45, '100%'], [30, '100%'], [25, '50%', '50%'], [30, '100%'], [25, '40%', '60%'], [10, '100%']],
  },
  {
    id: 'ed-double', name: 'Due Colonne Editoriale', category: 'editorial',
    description: 'Due colonne uguali per articoli affiancati',
    rows: [[8, '100%'], [35, '100%'], [35, '48%', '48%'], [35, '48%', '48%'], [10, '100%']],
  },
  {
    id: 'ed-3col', name: 'Tre Colonne', category: 'editorial',
    description: 'Griglia a 3 colonne per rassegna stampa',
    rows: [[8, '100%'], [35, '100%'], [6, '100%'], [30, '32%', '32%', '32%'], [30, '32%', '32%', '32%'], [10, '100%']],
  },
  {
    id: 'ed-sidebar-left', name: 'Sidebar Sinistra', category: 'editorial',
    description: 'Sidebar navigazione a sinistra, contenuto a destra',
    rows: [[8, '100%'], [50, '22%', '75%'], [30, '22%', '75%'], [10, '100%']],
  },
  {
    id: 'ed-featured', name: 'Articoli in Evidenza', category: 'editorial',
    description: 'Hero grande + 4 articoli secondari in griglia',
    rows: [[8, '100%'], [45, '60%', '38%'], [25, '24%', '24%', '24%', '24%'], [8, '100%'], [10, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // NEWS / TG (7)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'news-tg', name: 'TG Homepage', category: 'news',
    description: 'Breaking news hero, ticker, notizie categorie, pubblicità',
    rows: [[8, '100%'], [5, '100%'], [45, '100%'], [6, '100%'], [25, '32%', '32%', '32%'], [8, '100%'], [25, '50%', '50%'], [10, '100%']],
  },
  {
    id: 'news-portal', name: 'Portale Notizie', category: 'news',
    description: 'Mega header, hero + sidebar, griglia notizie, footer',
    rows: [[10, '100%'], [40, '65%', '32%'], [8, '100%'], [25, '32%', '32%', '32%'], [25, '32%', '32%', '32%'], [10, '100%']],
  },
  {
    id: 'news-breaking', name: 'Breaking News', category: 'news',
    description: 'Banner urgente, hero enorme, aggiornamenti rapidi',
    rows: [[5, '100%'], [8, '100%'], [55, '100%'], [20, '50%', '50%'], [20, '50%', '50%'], [10, '100%']],
  },
  {
    id: 'news-cat', name: 'News Categorie', category: 'news',
    description: 'Notizie organizzate per sezione: politica, economia, sport',
    rows: [[8, '100%'], [35, '100%'], [8, '100%'], [30, '48%', '48%'], [8, '100%'], [30, '48%', '48%'], [10, '100%']],
  },
  {
    id: 'news-live', name: 'Live News', category: 'news',
    description: 'Feed notizie live con sidebar video e social',
    rows: [[8, '100%'], [50, '65%', '32%'], [30, '65%', '32%'], [10, '100%']],
  },
  {
    id: 'news-sport', name: 'News Sportivo', category: 'news',
    description: 'Risultati, classifiche, highlights e calendario',
    rows: [[8, '100%'], [35, '55%', '42%'], [20, '24%', '24%', '24%', '24%'], [30, '65%', '32%'], [10, '100%']],
  },
  {
    id: 'news-local', name: 'Notizie Locali', category: 'news',
    description: 'Cronaca locale con meteo, eventi e annunci',
    rows: [[8, '100%'], [35, '100%'], [25, '32%', '32%', '32%'], [20, '65%', '32%'], [15, '48%', '48%'], [10, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // MAGAZINE (7)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'mag-cover', name: 'Magazine Copertina', category: 'magazine',
    description: 'Copertina full-screen, articoli in griglia elegante',
    rows: [[8, '100%'], [55, '100%'], [25, '32%', '32%', '32%'], [20, '100%'], [25, '48%', '48%'], [10, '100%']],
  },
  {
    id: 'mag-fashion', name: 'Fashion Magazine', category: 'magazine',
    description: 'Lookbook con foto grandi e testo sovrapposto',
    rows: [[8, '100%'], [50, '100%'], [30, '48%', '48%'], [50, '100%'], [30, '32%', '32%', '32%'], [10, '100%']],
  },
  {
    id: 'mag-lifestyle', name: 'Lifestyle', category: 'magazine',
    description: 'Layout arioso con spazi bianchi e immagini grandi',
    rows: [[8, '100%'], [45, '100%'], [10, '100%'], [35, '58%', '38%'], [10, '100%'], [35, '38%', '58%'], [10, '100%']],
  },
  {
    id: 'mag-4col', name: 'Magazine 4 Colonne', category: 'magazine',
    description: 'Griglia fitta a 4 colonne stile edicola',
    rows: [[8, '100%'], [40, '100%'], [25, '24%', '24%', '24%', '24%'], [25, '24%', '24%', '24%', '24%'], [8, '100%'], [10, '100%']],
  },
  {
    id: 'mag-feature', name: 'Feature Story', category: 'magazine',
    description: 'Storia di copertina con foto hero e testo lungo',
    rows: [[8, '100%'], [55, '100%'], [35, '100%'], [25, '48%', '48%'], [20, '100%'], [10, '100%']],
  },
  {
    id: 'mag-mosaic', name: 'Magazine Mosaico', category: 'magazine',
    description: 'Griglia mosaico con pezzi di dimensioni diverse',
    rows: [[8, '100%'], [30, '60%', '38%'], [30, '38%', '28%', '30%'], [30, '48%', '48%'], [20, '32%', '32%', '32%'], [10, '100%']],
  },
  {
    id: 'mag-digital', name: 'Magazine Digitale', category: 'magazine',
    description: 'Layout moderno con video, gallery e interattivo',
    rows: [[8, '100%'], [45, '100%'], [30, '48%', '48%'], [8, '100%'], [25, '32%', '32%', '32%'], [30, '100%'], [10, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // BLOG (7)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'blog-simple', name: 'Blog Semplice', category: 'blog',
    description: 'Layout pulito: header, post singolo centrato, footer',
    rows: [[8, '100%'], [30, '100%'], [50, '100%'], [15, '100%'], [10, '100%']],
  },
  {
    id: 'blog-sidebar', name: 'Blog con Sidebar', category: 'blog',
    description: 'Post a sinistra, sidebar con widget a destra',
    rows: [[8, '100%'], [35, '100%'], [40, '68%', '28%'], [40, '68%', '28%'], [10, '100%']],
  },
  {
    id: 'blog-grid', name: 'Blog Griglia', category: 'blog',
    description: 'Post in griglia card come Medium/Substack',
    rows: [[8, '100%'], [25, '32%', '32%', '32%'], [25, '32%', '32%', '32%'], [25, '32%', '32%', '32%'], [10, '100%']],
  },
  {
    id: 'blog-photo', name: 'Photoblog', category: 'blog',
    description: 'Blog fotografico con immagini grandi e testo sotto',
    rows: [[8, '100%'], [45, '100%'], [15, '100%'], [45, '100%'], [15, '100%'], [10, '100%']],
  },
  {
    id: 'blog-2col', name: 'Blog 2 Colonne', category: 'blog',
    description: 'Due colonne di post affiancati',
    rows: [[8, '100%'], [30, '100%'], [35, '48%', '48%'], [35, '48%', '48%'], [15, '100%'], [10, '100%']],
  },
  {
    id: 'blog-masonry', name: 'Blog Masonry', category: 'blog',
    description: 'Griglia masonry con card di altezze variabili',
    rows: [[8, '100%'], [35, '32%', '32%', '32%'], [25, '48%', '48%'], [35, '32%', '32%', '32%'], [10, '100%']],
  },
  {
    id: 'blog-newsletter', name: 'Blog Newsletter', category: 'blog',
    description: 'Blog con CTA newsletter prominente',
    rows: [[8, '100%'], [35, '100%'], [40, '100%'], [20, '100%'], [15, '100%'], [10, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // LANDING (7)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'land-product', name: 'Landing Prodotto', category: 'landing',
    description: 'Hero, features, testimonial, CTA, footer',
    rows: [[8, '100%'], [50, '100%'], [25, '32%', '32%', '32%'], [20, '100%'], [20, '100%'], [10, '100%']],
  },
  {
    id: 'land-saas', name: 'Landing SaaS', category: 'landing',
    description: 'Software landing con demo, pricing, FAQ',
    rows: [[8, '100%'], [45, '50%', '48%'], [20, '32%', '32%', '32%'], [25, '100%'], [30, '100%'], [20, '100%'], [10, '100%']],
  },
  {
    id: 'land-event', name: 'Landing Evento', category: 'landing',
    description: 'Evento con countdown, speakers, programma',
    rows: [[8, '100%'], [50, '100%'], [15, '100%'], [25, '24%', '24%', '24%', '24%'], [30, '100%'], [20, '100%'], [10, '100%']],
  },
  {
    id: 'land-app', name: 'Landing App', category: 'landing',
    description: 'App mobile con screenshot, features, download',
    rows: [[8, '100%'], [50, '55%', '42%'], [25, '32%', '32%', '32%'], [30, '42%', '55%'], [20, '100%'], [10, '100%']],
  },
  {
    id: 'land-waitlist', name: 'Waitlist', category: 'landing',
    description: 'Pagina waitlist minimalista con form centrale',
    rows: [[8, '100%'], [60, '100%'], [25, '100%'], [10, '100%']],
  },
  {
    id: 'land-course', name: 'Landing Corso', category: 'landing',
    description: 'Corso online con moduli, istruttore, recensioni',
    rows: [[8, '100%'], [45, '100%'], [30, '60%', '38%'], [25, '32%', '32%', '32%'], [20, '100%'], [25, '100%'], [10, '100%']],
  },
  {
    id: 'land-agency', name: 'Landing Agenzia', category: 'landing',
    description: 'Agenzia con servizi, portfolio, team, contatti',
    rows: [[8, '100%'], [50, '100%'], [25, '32%', '32%', '32%'], [30, '48%', '48%'], [20, '24%', '24%', '24%', '24%'], [20, '100%'], [10, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // PORTFOLIO (6)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'port-minimal', name: 'Portfolio Minimal', category: 'portfolio',
    description: 'Griglia 3 colonne pulita con hover',
    rows: [[8, '100%'], [45, '100%'], [30, '32%', '32%', '32%'], [30, '32%', '32%', '32%'], [10, '100%']],
  },
  {
    id: 'port-case', name: 'Case Studies', category: 'portfolio',
    description: 'Case study con immagini grandi alternate',
    rows: [[8, '100%'], [40, '100%'], [35, '55%', '42%'], [35, '42%', '55%'], [35, '55%', '42%'], [10, '100%']],
  },
  {
    id: 'port-gallery', name: 'Gallery Portfolio', category: 'portfolio',
    description: 'Galleria 4 colonne con lightbox',
    rows: [[8, '100%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [10, '100%']],
  },
  {
    id: 'port-creative', name: 'Portfolio Creativo', category: 'portfolio',
    description: 'Layout asimmetrico con pezzi sovrapposti',
    rows: [[8, '100%'], [50, '100%'], [30, '65%', '32%'], [30, '32%', '65%'], [20, '100%'], [10, '100%']],
  },
  {
    id: 'port-agency', name: 'Portfolio Agenzia', category: 'portfolio',
    description: 'Team, servizi, lavori, contatti',
    rows: [[8, '100%'], [45, '100%'], [20, '32%', '32%', '32%'], [30, '48%', '48%'], [25, '24%', '24%', '24%', '24%'], [20, '100%'], [10, '100%']],
  },
  {
    id: 'port-photo', name: 'Portfolio Fotografo', category: 'portfolio',
    description: 'Full-screen foto con navigazione minimale',
    rows: [[6, '100%'], [55, '100%'], [25, '48%', '48%'], [40, '100%'], [25, '32%', '32%', '32%'], [8, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // CORPORATE (6)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'corp-classic', name: 'Corporate Classico', category: 'corporate',
    description: 'Sito aziendale con hero, servizi, chi siamo, contatti',
    rows: [[8, '100%'], [45, '100%'], [25, '32%', '32%', '32%'], [30, '48%', '48%'], [20, '100%'], [10, '100%']],
  },
  {
    id: 'corp-modern', name: 'Corporate Moderno', category: 'corporate',
    description: 'Design moderno con sezioni grandi e numeri',
    rows: [[8, '100%'], [50, '100%'], [15, '24%', '24%', '24%', '24%'], [30, '55%', '42%'], [30, '42%', '55%'], [10, '100%']],
  },
  {
    id: 'corp-dashboard', name: 'Dashboard Style', category: 'corporate',
    description: 'Sidebar + area contenuto come dashboard',
    rows: [[8, '100%'], [40, '20%', '78%'], [40, '20%', '38%', '38%'], [10, '100%']],
  },
  {
    id: 'corp-team', name: 'Team & Chi Siamo', category: 'corporate',
    description: 'Focus sul team con bio e timeline aziendale',
    rows: [[8, '100%'], [40, '100%'], [30, '100%'], [20, '24%', '24%', '24%', '24%'], [25, '100%'], [10, '100%']],
  },
  {
    id: 'corp-service', name: 'Servizi Aziendali', category: 'corporate',
    description: 'Pagina servizi con griglia e dettagli',
    rows: [[8, '100%'], [35, '100%'], [30, '32%', '32%', '32%'], [35, '48%', '48%'], [30, '32%', '32%', '32%'], [10, '100%']],
  },
  {
    id: 'corp-onepage', name: 'One Page Corporate', category: 'corporate',
    description: 'Tutto in una pagina: hero, about, servizi, contatti',
    rows: [[8, '100%'], [50, '100%'], [30, '100%'], [25, '32%', '32%', '32%'], [15, '100%'], [25, '100%'], [20, '48%', '48%'], [10, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // CREATIVE (6)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cre-broken', name: 'Broken Grid', category: 'creative',
    description: 'Griglia rotta con elementi sovrapposti e asimmetrici',
    rows: [[6, '100%'], [50, '100%'], [30, '40%', '55%'], [30, '55%', '40%'], [30, '30%', '35%', '30%'], [8, '100%']],
  },
  {
    id: 'cre-fullbleed', name: 'Full Bleed', category: 'creative',
    description: 'Sezioni full-width alternate con spazi bianchi',
    rows: [[6, '100%'], [55, '100%'], [25, '100%'], [50, '100%'], [25, '100%'], [50, '100%'], [8, '100%']],
  },
  {
    id: 'cre-split', name: 'Split Screen', category: 'creative',
    description: 'Schermo diviso 50/50 per tutta la pagina',
    rows: [[6, '100%'], [50, '48%', '48%'], [40, '48%', '48%'], [40, '48%', '48%'], [8, '100%']],
  },
  {
    id: 'cre-zpattern', name: 'Z-Pattern', category: 'creative',
    description: 'Layout a Z con alternanza immagine-testo',
    rows: [[8, '100%'], [35, '55%', '42%'], [35, '42%', '55%'], [35, '55%', '42%'], [35, '42%', '55%'], [10, '100%']],
  },
  {
    id: 'cre-cards', name: 'Card Layout', category: 'creative',
    description: 'Tutto a card con dimensioni variabili',
    rows: [[8, '100%'], [35, '48%', '24%', '24%'], [25, '24%', '48%', '24%'], [35, '24%', '24%', '48%'], [10, '100%']],
  },
  {
    id: 'cre-immersive', name: 'Immersivo', category: 'creative',
    description: 'Sezioni full-screen con scroll narrativo',
    rows: [[4, '100%'], [60, '100%'], [60, '100%'], [40, '48%', '48%'], [60, '100%'], [6, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // MINIMAL (6)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'min-single', name: 'Colonna Singola', category: 'minimal',
    description: 'Una sola colonna centrata, massima leggibilità',
    rows: [[6, '100%'], [35, '100%'], [45, '100%'], [20, '100%'], [6, '100%']],
  },
  {
    id: 'min-hero', name: 'Solo Hero', category: 'minimal',
    description: 'Hero full-screen con un solo CTA',
    rows: [[4, '100%'], [80, '100%'], [6, '100%']],
  },
  {
    id: 'min-2section', name: 'Due Sezioni', category: 'minimal',
    description: 'Solo due sezioni: sopra e sotto',
    rows: [[4, '100%'], [45, '100%'], [45, '100%'], [6, '100%']],
  },
  {
    id: 'min-text', name: 'Testo Puro', category: 'minimal',
    description: 'Solo testo centrato per articoli lunghi',
    rows: [[6, '100%'], [15, '100%'], [60, '100%'], [10, '100%'], [6, '100%']],
  },
  {
    id: 'min-card', name: 'Single Card', category: 'minimal',
    description: 'Una card centrata nella pagina',
    rows: [[6, '100%'], [70, '100%'], [15, '100%'], [6, '100%']],
  },
  {
    id: 'min-split', name: 'Split Minimal', category: 'minimal',
    description: 'Due colonne semplici e pulite',
    rows: [[6, '100%'], [50, '48%', '48%'], [20, '100%'], [6, '100%']],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2 COLONNE (30 varianti)
  // ═══════════════════════════════════════════════════════════════
  { id: '2c-01', name: '2C Hero Grande + Sidebar', category: '2-colonne', description: 'Hero 70% con sidebar stretta',
    rows: [[8, '100%'], [55, '68%', '28%'], [30, '68%', '28%'], [10, '100%']] },
  { id: '2c-02', name: '2C Hero Piccolo + Contenuto', category: '2-colonne', description: 'Header, hero compatto, due colonne uguali',
    rows: [[8, '100%'], [25, '100%'], [40, '48%', '48%'], [30, '48%', '48%'], [10, '100%']] },
  { id: '2c-03', name: '2C Sidebar Larga', category: '2-colonne', description: 'Sidebar 40%, contenuto 60%',
    rows: [[8, '100%'], [35, '100%'], [40, '58%', '38%'], [40, '58%', '38%'], [10, '100%']] },
  { id: '2c-04', name: '2C Alternato', category: '2-colonne', description: 'Righe alternate: img-testo, testo-img',
    rows: [[8, '100%'], [40, '55%', '42%'], [40, '42%', '55%'], [40, '55%', '42%'], [10, '100%']] },
  { id: '2c-05', name: '2C Hero Full + Split', category: '2-colonne', description: 'Hero enorme, poi due colonne',
    rows: [[6, '100%'], [60, '100%'], [35, '48%', '48%'], [35, '48%', '48%'], [8, '100%']] },
  { id: '2c-06', name: '2C Rivista Doppia', category: '2-colonne', description: 'Due colonne per tutta la pagina come rivista aperta',
    rows: [[8, '100%'], [45, '48%', '48%'], [35, '48%', '48%'], [45, '48%', '48%'], [10, '100%']] },
  { id: '2c-07', name: '2C Sidebar Sinistra', category: '2-colonne', description: 'Menu sidebar a sinistra 25%, contenuto 75%',
    rows: [[8, '100%'], [45, '24%', '73%'], [45, '24%', '73%'], [10, '100%']] },
  { id: '2c-08', name: '2C Hero Split', category: '2-colonne', description: 'Hero diviso in due: immagine e testo',
    rows: [[8, '100%'], [50, '50%', '48%'], [30, '100%'], [25, '48%', '48%'], [10, '100%']] },
  { id: '2c-09', name: '2C Asimmetrico 30/70', category: '2-colonne', description: 'Colonna stretta e colonna larga',
    rows: [[8, '100%'], [40, '100%'], [45, '28%', '68%'], [30, '28%', '68%'], [10, '100%']] },
  { id: '2c-10', name: '2C Asimmetrico 75/25', category: '2-colonne', description: 'Contenuto dominante con sidebar mini',
    rows: [[8, '100%'], [50, '100%'], [35, '73%', '24%'], [35, '73%', '24%'], [10, '100%']] },
  { id: '2c-11', name: '2C Portfolio Doppio', category: '2-colonne', description: 'Griglia portfolio a due colonne',
    rows: [[6, '100%'], [40, '48%', '48%'], [40, '48%', '48%'], [40, '48%', '48%'], [6, '100%']] },
  { id: '2c-12', name: '2C Blog Sidebar', category: '2-colonne', description: 'Post blog largo + sidebar widget',
    rows: [[8, '100%'], [30, '100%'], [50, '65%', '32%'], [20, '100%'], [10, '100%']] },
  { id: '2c-13', name: '2C Hero Stretto + 2 Blocchi', category: '2-colonne', description: 'Hero stretto e due blocchi sotto',
    rows: [[8, '100%'], [20, '100%'], [50, '48%', '48%'], [15, '100%'], [10, '100%']] },
  { id: '2c-14', name: '2C News Principale', category: '2-colonne', description: 'Notizia grande a sinistra, lista a destra',
    rows: [[8, '100%'], [50, '62%', '35%'], [8, '100%'], [30, '48%', '48%'], [10, '100%']] },
  { id: '2c-15', name: '2C Landing Split', category: '2-colonne', description: 'Landing con testo e immagine alternati',
    rows: [[8, '100%'], [45, '48%', '48%'], [15, '100%'], [45, '48%', '48%'], [20, '100%'], [10, '100%']] },
  { id: '2c-16', name: '2C Dashboard', category: '2-colonne', description: 'Sidebar navigazione + area lavoro',
    rows: [[8, '100%'], [50, '20%', '78%'], [35, '20%', '78%'], [8, '100%']] },
  { id: '2c-17', name: '2C Magazine Aperto', category: '2-colonne', description: 'Due pagine affiancate stile rivista',
    rows: [[4, '100%'], [55, '48%', '48%'], [10, '100%'], [45, '48%', '48%'], [6, '100%']] },
  { id: '2c-18', name: '2C Hero + Griglia', category: '2-colonne', description: 'Hero grande poi griglia 2 colonne',
    rows: [[6, '100%'], [50, '100%'], [30, '48%', '48%'], [30, '48%', '48%'], [30, '48%', '48%'], [8, '100%']] },
  { id: '2c-19', name: '2C Pricing', category: '2-colonne', description: 'Due colonne pricing comparativo',
    rows: [[8, '100%'], [35, '100%'], [50, '48%', '48%'], [20, '100%'], [10, '100%']] },
  { id: '2c-20', name: '2C About', category: '2-colonne', description: 'Chi siamo con foto e testo alternati',
    rows: [[8, '100%'], [40, '55%', '42%'], [30, '100%'], [40, '42%', '55%'], [10, '100%']] },
  { id: '2c-21', name: '2C E-zine', category: '2-colonne', description: 'Rivista digitale con immagini grandi',
    rows: [[6, '100%'], [55, '60%', '38%'], [40, '38%', '60%'], [30, '100%'], [8, '100%']] },
  { id: '2c-22', name: '2C Comparison', category: '2-colonne', description: 'Due colonne per confronto A/B',
    rows: [[8, '100%'], [20, '100%'], [55, '48%', '48%'], [10, '100%'], [10, '100%']] },
  { id: '2c-23', name: '2C Feature Showcase', category: '2-colonne', description: 'Showcase funzionalità con screenshot',
    rows: [[8, '100%'], [45, '42%', '55%'], [15, '100%'], [45, '55%', '42%'], [15, '100%'], [10, '100%']] },
  { id: '2c-24', name: '2C Testimonials', category: '2-colonne', description: 'Testimonianze in due colonne',
    rows: [[8, '100%'], [40, '100%'], [35, '48%', '48%'], [35, '48%', '48%'], [15, '100%'], [10, '100%']] },
  { id: '2c-25', name: '2C Event', category: '2-colonne', description: 'Evento con programma e info',
    rows: [[8, '100%'], [45, '100%'], [35, '60%', '38%'], [25, '100%'], [10, '100%']] },
  { id: '2c-26', name: '2C Hero Mini + Content', category: '2-colonne', description: 'Hero piccolo e contenuto in due colonne',
    rows: [[8, '100%'], [15, '100%'], [45, '55%', '42%'], [45, '42%', '55%'], [10, '100%']] },
  { id: '2c-27', name: '2C Wide + Narrow', category: '2-colonne', description: 'Colonna larghissima e micro sidebar',
    rows: [[8, '100%'], [35, '100%'], [40, '80%', '18%'], [40, '80%', '18%'], [10, '100%']] },
  { id: '2c-28', name: '2C Fotostoria', category: '2-colonne', description: 'Foto grandi a sinistra, testo a destra',
    rows: [[6, '100%'], [50, '55%', '42%'], [50, '42%', '55%'], [50, '55%', '42%'], [8, '100%']] },
  { id: '2c-29', name: '2C Dual Hero', category: '2-colonne', description: 'Due hero affiancati',
    rows: [[6, '100%'], [55, '48%', '48%'], [30, '100%'], [30, '48%', '48%'], [8, '100%']] },
  { id: '2c-30', name: '2C News Ticker', category: '2-colonne', description: 'Notizie con ticker laterale',
    rows: [[8, '100%'], [5, '100%'], [40, '65%', '32%'], [30, '65%', '32%'], [8, '100%'], [10, '100%']] },

  // ═══════════════════════════════════════════════════════════════
  // 3 COLONNE (30 varianti)
  // ═══════════════════════════════════════════════════════════════
  { id: '3c-01', name: '3C Uguale', category: '3-colonne', description: 'Tre colonne uguali classiche',
    rows: [[8, '100%'], [40, '100%'], [35, '32%', '32%', '32%'], [35, '32%', '32%', '32%'], [10, '100%']] },
  { id: '3c-02', name: '3C Centro Largo', category: '3-colonne', description: 'Colonna centrale dominante',
    rows: [[8, '100%'], [35, '100%'], [40, '20%', '56%', '20%'], [40, '20%', '56%', '20%'], [10, '100%']] },
  { id: '3c-03', name: '3C Hero + Griglia', category: '3-colonne', description: 'Hero grande poi griglia 3 colonne',
    rows: [[6, '100%'], [50, '100%'], [30, '32%', '32%', '32%'], [30, '32%', '32%', '32%'], [8, '100%']] },
  { id: '3c-04', name: '3C Asimmetrico', category: '3-colonne', description: 'Tre colonne di larghezze diverse',
    rows: [[8, '100%'], [45, '100%'], [35, '50%', '25%', '22%'], [35, '22%', '25%', '50%'], [10, '100%']] },
  { id: '3c-05', name: '3C Holy Grail', category: '3-colonne', description: 'Layout sacro: sidebar-contenuto-sidebar',
    rows: [[8, '100%'], [50, '20%', '56%', '20%'], [40, '20%', '56%', '20%'], [10, '100%']] },
  { id: '3c-06', name: '3C Cards', category: '3-colonne', description: 'Griglia card a 3 colonne',
    rows: [[8, '100%'], [25, '100%'], [30, '32%', '32%', '32%'], [30, '32%', '32%', '32%'], [30, '32%', '32%', '32%'], [10, '100%']] },
  { id: '3c-07', name: '3C Magazine News', category: '3-colonne', description: 'Layout notizie a 3 colonne con hero',
    rows: [[8, '100%'], [45, '50%', '24%', '24%'], [30, '32%', '32%', '32%'], [8, '100%'], [10, '100%']] },
  { id: '3c-08', name: '3C Feature Grid', category: '3-colonne', description: 'Features in griglia 3x2',
    rows: [[8, '100%'], [50, '100%'], [25, '32%', '32%', '32%'], [25, '32%', '32%', '32%'], [20, '100%'], [10, '100%']] },
  { id: '3c-09', name: '3C Blog Cards', category: '3-colonne', description: 'Blog con post in card 3 colonne',
    rows: [[8, '100%'], [35, '100%'], [30, '32%', '32%', '32%'], [30, '32%', '32%', '32%'], [15, '100%'], [10, '100%']] },
  { id: '3c-10', name: '3C Pricing Table', category: '3-colonne', description: 'Tabella pricing tre piani',
    rows: [[8, '100%'], [30, '100%'], [50, '32%', '32%', '32%'], [15, '100%'], [10, '100%']] },
  { id: '3c-11', name: '3C Hero Split 3', category: '3-colonne', description: 'Hero diviso in 3 parti verticali',
    rows: [[6, '100%'], [55, '32%', '32%', '32%'], [30, '100%'], [25, '32%', '32%', '32%'], [8, '100%']] },
  { id: '3c-12', name: '3C Team', category: '3-colonne', description: 'Pagina team con 3 membri per riga',
    rows: [[8, '100%'], [35, '100%'], [40, '32%', '32%', '32%'], [40, '32%', '32%', '32%'], [15, '100%'], [10, '100%']] },
  { id: '3c-13', name: '3C Portfolio Misto', category: '3-colonne', description: 'Griglia portfolio con pezzi diversi',
    rows: [[6, '100%'], [45, '48%', '24%', '24%'], [35, '32%', '32%', '32%'], [45, '24%', '24%', '48%'], [8, '100%']] },
  { id: '3c-14', name: '3C Sidebar + 2 Col', category: '3-colonne', description: 'Sidebar + area con 2 colonne',
    rows: [[8, '100%'], [45, '100%'], [40, '22%', '37%', '37%'], [30, '22%', '37%', '37%'], [10, '100%']] },
  { id: '3c-15', name: '3C News Categorie', category: '3-colonne', description: 'Tre categorie di notizie affiancate',
    rows: [[8, '100%'], [5, '100%'], [40, '100%'], [35, '32%', '32%', '32%'], [35, '32%', '32%', '32%'], [10, '100%']] },
  { id: '3c-16', name: '3C Landing Features', category: '3-colonne', description: 'Landing con 3 features e CTA',
    rows: [[8, '100%'], [50, '100%'], [30, '32%', '32%', '32%'], [20, '100%'], [25, '32%', '32%', '32%'], [15, '100%'], [10, '100%']] },
  { id: '3c-17', name: '3C Wide Center', category: '3-colonne', description: 'Centro largo 60% con mini sidebar',
    rows: [[8, '100%'], [40, '100%'], [40, '18%', '60%', '18%'], [25, '100%'], [10, '100%']] },
  { id: '3c-18', name: '3C Cascata', category: '3-colonne', description: 'Sezioni che si restringono verso il basso',
    rows: [[8, '100%'], [40, '100%'], [30, '48%', '48%'], [25, '32%', '32%', '32%'], [15, '100%'], [10, '100%']] },
  { id: '3c-19', name: '3C Galleria', category: '3-colonne', description: 'Galleria fotografica 3 colonne con hero',
    rows: [[6, '100%'], [40, '100%'], [25, '32%', '32%', '32%'], [25, '32%', '32%', '32%'], [25, '32%', '32%', '32%'], [6, '100%']] },
  { id: '3c-20', name: '3C Hero + Side Info', category: '3-colonne', description: 'Hero con due box info laterali',
    rows: [[8, '100%'], [50, '60%', '18%', '18%'], [30, '32%', '32%', '32%'], [10, '100%']] },
  { id: '3c-21', name: '3C Servizi', category: '3-colonne', description: 'Servizi in griglia con descrizioni',
    rows: [[8, '100%'], [30, '100%'], [35, '32%', '32%', '32%'], [20, '100%'], [35, '32%', '32%', '32%'], [10, '100%']] },
  { id: '3c-22', name: '3C Reviews', category: '3-colonne', description: 'Recensioni in tre colonne',
    rows: [[8, '100%'], [45, '100%'], [40, '32%', '32%', '32%'], [20, '100%'], [10, '100%']] },
  { id: '3c-23', name: '3C Showcase', category: '3-colonne', description: 'Showcase prodotti in griglia',
    rows: [[8, '100%'], [45, '100%'], [8, '100%'], [35, '32%', '32%', '32%'], [35, '32%', '32%', '32%'], [10, '100%']] },
  { id: '3c-24', name: '3C F-Pattern', category: '3-colonne', description: 'Pattern F: largo, medio, stretto',
    rows: [[8, '100%'], [40, '100%'], [30, '65%', '32%'], [25, '32%', '32%', '32%'], [10, '100%']] },
  { id: '3c-25', name: '3C Columns + Hero', category: '3-colonne', description: 'Tre colonne sotto un hero panoramico',
    rows: [[8, '100%'], [45, '100%'], [6, '100%'], [40, '32%', '32%', '32%'], [30, '100%'], [10, '100%']] },
  { id: '3c-26', name: '3C Corporate', category: '3-colonne', description: 'Aziendale con 3 pilastri servizi',
    rows: [[8, '100%'], [40, '100%'], [15, '32%', '32%', '32%'], [30, '48%', '48%'], [20, '100%'], [10, '100%']] },
  { id: '3c-27', name: '3C Blog + Widgets', category: '3-colonne', description: 'Blog centrale con sidebar e widget',
    rows: [[8, '100%'], [30, '100%'], [45, '20%', '55%', '22%'], [20, '100%'], [10, '100%']] },
  { id: '3c-28', name: '3C Piramide', category: '3-colonne', description: 'Una colonna, due, tre - piramide inversa',
    rows: [[8, '100%'], [40, '100%'], [30, '48%', '48%'], [25, '32%', '32%', '32%'], [10, '100%']] },
  { id: '3c-29', name: '3C Piramide Inversa', category: '3-colonne', description: 'Tre colonne, due, una - piramide',
    rows: [[8, '100%'], [25, '32%', '32%', '32%'], [30, '48%', '48%'], [40, '100%'], [10, '100%']] },
  { id: '3c-30', name: '3C Mixed', category: '3-colonne', description: 'Mix di righe a 1, 2 e 3 colonne',
    rows: [[8, '100%'], [35, '100%'], [25, '48%', '48%'], [30, '32%', '32%', '32%'], [25, '48%', '48%'], [15, '100%'], [10, '100%']] },

  // ═══════════════════════════════════════════════════════════════
  // 4 COLONNE (30 varianti)
  // ═══════════════════════════════════════════════════════════════
  { id: '4c-01', name: '4C Uguale', category: '4-colonne', description: 'Quattro colonne uguali',
    rows: [[8, '100%'], [40, '100%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-02', name: '4C Hero + 4 Cards', category: '4-colonne', description: 'Hero grande poi 4 card sotto',
    rows: [[6, '100%'], [50, '100%'], [35, '24%', '24%', '24%', '24%'], [20, '100%'], [8, '100%']] },
  { id: '4c-03', name: '4C Magazine Edicola', category: '4-colonne', description: 'Griglia fitta stile edicola',
    rows: [[8, '100%'], [35, '100%'], [25, '24%', '24%', '24%', '24%'], [25, '24%', '24%', '24%', '24%'], [25, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-04', name: '4C Asimmetrico', category: '4-colonne', description: 'Colonne di larghezze diverse',
    rows: [[8, '100%'], [45, '100%'], [35, '40%', '20%', '20%', '18%'], [35, '18%', '20%', '20%', '40%'], [10, '100%']] },
  { id: '4c-05', name: '4C Hero Split 4', category: '4-colonne', description: 'Hero diviso in 4 strisce',
    rows: [[6, '100%'], [55, '24%', '24%', '24%', '24%'], [25, '100%'], [30, '24%', '24%', '24%', '24%'], [8, '100%']] },
  { id: '4c-06', name: '4C Dashboard Widgets', category: '4-colonne', description: 'Dashboard con 4 widget in alto',
    rows: [[8, '100%'], [20, '24%', '24%', '24%', '24%'], [40, '48%', '48%'], [30, '100%'], [10, '100%']] },
  { id: '4c-07', name: '4C Portfolio Grid', category: '4-colonne', description: 'Portfolio in griglia 4x3',
    rows: [[6, '100%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [6, '100%']] },
  { id: '4c-08', name: '4C Stats + Content', category: '4-colonne', description: 'Statistiche in 4 box poi contenuto',
    rows: [[8, '100%'], [45, '100%'], [15, '24%', '24%', '24%', '24%'], [35, '48%', '48%'], [10, '100%']] },
  { id: '4c-09', name: '4C Mega Footer', category: '4-colonne', description: 'Layout con footer a 4 colonne grande',
    rows: [[8, '100%'], [50, '100%'], [25, '48%', '48%'], [30, '24%', '24%', '24%', '24%'], [15, '100%']] },
  { id: '4c-10', name: '4C Team Grid', category: '4-colonne', description: 'Team con 4 persone per riga',
    rows: [[8, '100%'], [30, '100%'], [35, '24%', '24%', '24%', '24%'], [35, '24%', '24%', '24%', '24%'], [20, '100%'], [10, '100%']] },
  { id: '4c-11', name: '4C 1+3', category: '4-colonne', description: 'Una colonna grande + 3 piccole',
    rows: [[8, '100%'], [50, '100%'], [35, '48%', '16%', '16%', '16%'], [25, '100%'], [10, '100%']] },
  { id: '4c-12', name: '4C News Ticker', category: '4-colonne', description: 'Notizie in 4 box con ticker',
    rows: [[8, '100%'], [5, '100%'], [30, '24%', '24%', '24%', '24%'], [40, '48%', '48%'], [25, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-13', name: '4C Pricing', category: '4-colonne', description: '4 piani pricing affiancati',
    rows: [[8, '100%'], [30, '100%'], [50, '24%', '24%', '24%', '24%'], [20, '100%'], [10, '100%']] },
  { id: '4c-14', name: '4C Services', category: '4-colonne', description: '4 servizi con icona e descrizione',
    rows: [[8, '100%'], [40, '100%'], [30, '24%', '24%', '24%', '24%'], [20, '100%'], [30, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-15', name: '4C Steps', category: '4-colonne', description: '4 step processo orizzontale',
    rows: [[8, '100%'], [45, '100%'], [25, '24%', '24%', '24%', '24%'], [35, '100%'], [10, '100%']] },
  { id: '4c-16', name: '4C Gallery Square', category: '4-colonne', description: 'Galleria quadrata 4x4',
    rows: [[6, '100%'], [25, '24%', '24%', '24%', '24%'], [25, '24%', '24%', '24%', '24%'], [25, '24%', '24%', '24%', '24%'], [25, '24%', '24%', '24%', '24%'], [6, '100%']] },
  { id: '4c-17', name: '4C Cascata', category: '4-colonne', description: 'Cascata: 1 col, 2, 3, 4',
    rows: [[8, '100%'], [35, '100%'], [25, '48%', '48%'], [20, '32%', '32%', '32%'], [18, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-18', name: '4C News Grid', category: '4-colonne', description: 'Griglia notizie 4 colonne',
    rows: [[8, '100%'], [40, '48%', '24%', '24%'], [8, '100%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-19', name: '4C Hero Mini + Grid', category: '4-colonne', description: 'Hero compatto poi griglia fitta',
    rows: [[8, '100%'], [20, '100%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-20', name: '4C Alternato', category: '4-colonne', description: 'Righe alternate 2 e 4 colonne',
    rows: [[8, '100%'], [35, '100%'], [25, '48%', '48%'], [25, '24%', '24%', '24%', '24%'], [25, '48%', '48%'], [10, '100%']] },
  { id: '4c-21', name: '4C Wide + 3 Side', category: '4-colonne', description: 'Blocco largo + 3 stretti a destra',
    rows: [[8, '100%'], [50, '50%', '15%', '15%', '16%'], [30, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-22', name: '4C Feature Blocks', category: '4-colonne', description: 'Blocchi feature con hero grande',
    rows: [[8, '100%'], [50, '100%'], [8, '100%'], [35, '24%', '24%', '24%', '24%'], [8, '100%'], [10, '100%']] },
  { id: '4c-23', name: '4C Split Hero', category: '4-colonne', description: 'Hero 50/50 poi 4 colonne',
    rows: [[8, '100%'], [45, '48%', '48%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-24', name: '4C Compact Grid', category: '4-colonne', description: 'Griglia compatta tutto a 4 colonne',
    rows: [[8, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [8, '24%', '24%', '24%', '24%']] },
  { id: '4c-25', name: '4C E-commerce Style', category: '4-colonne', description: 'Griglia prodotti stile e-commerce',
    rows: [[8, '100%'], [15, '100%'], [30, '24%', '24%', '24%', '24%'], [30, '24%', '24%', '24%', '24%'], [15, '100%'], [30, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-26', name: '4C Mixed Width', category: '4-colonne', description: 'Colonne larghe e strette miste',
    rows: [[8, '100%'], [40, '100%'], [30, '35%', '15%', '15%', '32%'], [30, '15%', '32%', '35%', '15%'], [10, '100%']] },
  { id: '4c-27', name: '4C Hub', category: '4-colonne', description: 'Hub di contenuti con 4 sezioni',
    rows: [[8, '100%'], [30, '100%'], [40, '24%', '24%', '24%', '24%'], [15, '100%'], [25, '48%', '48%'], [10, '100%']] },
  { id: '4c-28', name: '4C Comparison', category: '4-colonne', description: 'Confronto 4 opzioni',
    rows: [[8, '100%'], [20, '100%'], [55, '24%', '24%', '24%', '24%'], [10, '100%'], [10, '100%']] },
  { id: '4c-29', name: '4C Timeline', category: '4-colonne', description: 'Timeline con 4 punti per riga',
    rows: [[8, '100%'], [35, '100%'], [15, '24%', '24%', '24%', '24%'], [35, '100%'], [15, '24%', '24%', '24%', '24%'], [10, '100%']] },
  { id: '4c-30', name: '4C Full Grid', category: '4-colonne', description: 'Tutto a griglia densa 4 colonne',
    rows: [[8, '100%'], [20, '24%', '24%', '24%', '24%'], [35, '48%', '24%', '24%'], [25, '24%', '24%', '48%'], [20, '24%', '24%', '24%', '24%'], [10, '100%']] },

  // ═══════════════════════════════════════════════════════════════
  // DIAGONALI (40) - Tagli diagonali simulati con colonne sfalsate
  // Le diagonali si vedono perché colonne adiacenti hanno larghezze
  // che cambiano gradualmente riga per riga
  // ═══════════════════════════════════════════════════════════════

  // --- Diagonali a 2 colonne ---
  { id: 'diag-2c-01', name: 'Diagonale SX→DX', category: 'creative', description: 'Colonna sinistra che si allarga verso il basso',
    rows: [[8, '100%'], [30, '30%', '68%'], [30, '40%', '58%'], [30, '50%', '48%'], [30, '60%', '38%'], [30, '70%', '28%'], [8, '100%']] },
  { id: 'diag-2c-02', name: 'Diagonale DX→SX', category: 'creative', description: 'Colonna destra che si allarga verso il basso',
    rows: [[8, '100%'], [30, '70%', '28%'], [30, '60%', '38%'], [30, '50%', '48%'], [30, '40%', '58%'], [30, '30%', '68%'], [8, '100%']] },
  { id: 'diag-2c-03', name: 'V Diagonale', category: 'creative', description: 'Forma a V: si restringe e si allarga',
    rows: [[8, '100%'], [25, '70%', '28%'], [25, '55%', '43%'], [25, '40%', '58%'], [25, '55%', '43%'], [25, '70%', '28%'], [8, '100%']] },
  { id: 'diag-2c-04', name: 'A Diagonale', category: 'creative', description: 'Forma a A: si allarga e si restringe',
    rows: [[8, '100%'], [25, '30%', '68%'], [25, '45%', '53%'], [25, '60%', '38%'], [25, '45%', '53%'], [25, '30%', '68%'], [8, '100%']] },
  { id: 'diag-2c-05', name: 'Zigzag 2C', category: 'creative', description: 'Zigzag diagonale a 2 colonne',
    rows: [[8, '100%'], [25, '30%', '68%'], [25, '68%', '30%'], [25, '30%', '68%'], [25, '68%', '30%'], [25, '30%', '68%'], [8, '100%']] },
  { id: 'diag-2c-06', name: 'Scala SX', category: 'creative', description: 'Gradini che scendono a sinistra',
    rows: [[8, '100%'], [20, '20%', '78%'], [20, '35%', '63%'], [20, '50%', '48%'], [20, '65%', '33%'], [20, '80%', '18%'], [8, '100%']] },
  { id: 'diag-2c-07', name: 'Clessidra 2C', category: 'creative', description: 'Clessidra: largo-stretto-largo',
    rows: [[8, '100%'], [20, '80%', '18%'], [25, '60%', '38%'], [25, '40%', '58%'], [25, '60%', '38%'], [20, '80%', '18%'], [8, '100%']] },
  { id: 'diag-2c-08', name: 'Onda 2C', category: 'creative', description: 'Colonne che ondeggiano',
    rows: [[6, '100%'], [25, '60%', '38%'], [25, '38%', '60%'], [25, '60%', '38%'], [25, '38%', '60%'], [25, '60%', '38%'], [25, '38%', '60%'], [6, '100%']] },

  // --- Diagonali a 3 colonne ---
  { id: 'diag-3c-01', name: 'Diag 3C Espansione', category: 'creative', description: 'Centro che si espande gradualmente',
    rows: [[8, '100%'], [25, '40%', '18%', '40%'], [25, '32%', '34%', '32%'], [25, '24%', '50%', '24%'], [25, '18%', '62%', '18%'], [8, '100%']] },
  { id: 'diag-3c-02', name: 'Diag 3C Contrazione', category: 'creative', description: 'Centro che si contrae',
    rows: [[8, '100%'], [25, '18%', '62%', '18%'], [25, '25%', '48%', '25%'], [25, '32%', '34%', '32%'], [25, '40%', '18%', '40%'], [8, '100%']] },
  { id: 'diag-3c-03', name: 'Diag 3C Cascata SX', category: 'creative', description: 'Prima colonna cresce, le altre si riducono',
    rows: [[8, '100%'], [22, '20%', '40%', '38%'], [22, '30%', '35%', '33%'], [22, '40%', '30%', '28%'], [22, '50%', '25%', '23%'], [22, '60%', '20%', '18%'], [8, '100%']] },
  { id: 'diag-3c-04', name: 'Diag 3C Rombo', category: 'creative', description: 'Forma a rombo con 3 colonne',
    rows: [[8, '100%'], [20, '40%', '18%', '40%'], [30, '28%', '42%', '28%'], [40, '18%', '62%', '18%'], [30, '28%', '42%', '28%'], [20, '40%', '18%', '40%'], [8, '100%']] },
  { id: 'diag-3c-05', name: 'Diag 3C Zigzag', category: 'creative', description: 'Tre colonne che zigzagano',
    rows: [[8, '100%'], [25, '50%', '24%', '24%'], [25, '24%', '50%', '24%'], [25, '24%', '24%', '50%'], [25, '50%', '24%', '24%'], [25, '24%', '50%', '24%'], [8, '100%']] },
  { id: 'diag-3c-06', name: 'Diag 3C Ventaglio', category: 'creative', description: 'Colonne che si aprono a ventaglio',
    rows: [[8, '100%'], [20, '10%', '78%', '10%'], [25, '20%', '58%', '20%'], [30, '30%', '38%', '30%'], [25, '32%', '34%', '32%'], [8, '100%']] },
  { id: 'diag-3c-07', name: 'Diag 3C Piramide', category: 'creative', description: 'Piramide con colonna centrale che cresce',
    rows: [[8, '100%'], [15, '45%', '8%', '45%'], [20, '38%', '22%', '38%'], [30, '28%', '42%', '28%'], [40, '18%', '62%', '18%'], [8, '100%']] },
  { id: 'diag-3c-08', name: 'Diag 3C Spirale', category: 'creative', description: 'Effetto spirale con shift progressivo',
    rows: [[8, '100%'], [22, '55%', '22%', '21%'], [22, '22%', '55%', '21%'], [22, '21%', '22%', '55%'], [22, '55%', '22%', '21%'], [22, '22%', '55%', '21%'], [8, '100%']] },

  // --- Diagonali a 4 colonne ---
  { id: 'diag-4c-01', name: 'Diag 4C Scala', category: 'creative', description: 'Scala ascendente a 4 colonne',
    rows: [[8, '100%'], [25, '40%', '28%', '18%', '12%'], [25, '30%', '30%', '22%', '16%'], [25, '20%', '28%', '28%', '22%'], [25, '12%', '18%', '28%', '40%'], [8, '100%']] },
  { id: 'diag-4c-02', name: 'Diag 4C Onda', category: 'creative', description: 'Onda su 4 colonne',
    rows: [[8, '100%'], [22, '40%', '24%', '18%', '16%'], [22, '18%', '40%', '24%', '16%'], [22, '16%', '18%', '40%', '24%'], [22, '24%', '16%', '18%', '40%'], [22, '40%', '24%', '18%', '16%'], [8, '100%']] },
  { id: 'diag-4c-03', name: 'Diag 4C Diamante', category: 'creative', description: 'Diamante: si espande e contrae',
    rows: [[8, '100%'], [18, '35%', '14%', '14%', '35%'], [25, '24%', '24%', '24%', '24%'], [30, '14%', '35%', '35%', '14%'], [25, '24%', '24%', '24%', '24%'], [18, '35%', '14%', '14%', '35%'], [8, '100%']] },
  { id: 'diag-4c-04', name: 'Diag 4C X', category: 'creative', description: 'Forma X incrociata',
    rows: [[8, '100%'], [20, '40%', '8%', '8%', '40%'], [25, '24%', '24%', '24%', '24%'], [25, '8%', '40%', '40%', '8%'], [25, '24%', '24%', '24%', '24%'], [20, '40%', '8%', '8%', '40%'], [8, '100%']] },

  // --- Diagonali miste (multi-colonna per riga) ---
  { id: 'diag-mix-01', name: 'Diag Mix Piramide', category: 'creative', description: 'Da 1 colonna a 4 e ritorno',
    rows: [[8, '100%'], [40, '100%'], [25, '48%', '48%'], [20, '32%', '32%', '32%'], [15, '24%', '24%', '24%', '24%'], [20, '32%', '32%', '32%'], [25, '48%', '48%'], [8, '100%']] },
  { id: 'diag-mix-02', name: 'Diag Mix Inversa', category: 'creative', description: 'Da 4 colonne a 1 e ritorno',
    rows: [[8, '100%'], [15, '24%', '24%', '24%', '24%'], [20, '32%', '32%', '32%'], [25, '48%', '48%'], [40, '100%'], [25, '48%', '48%'], [20, '32%', '32%', '32%'], [8, '100%']] },
  { id: 'diag-mix-03', name: 'Diag Mix Diamante', category: 'creative', description: 'Diamante: 1→2→3→4→3→2→1',
    rows: [[6, '100%'], [20, '100%'], [18, '48%', '48%'], [15, '32%', '32%', '32%'], [12, '24%', '24%', '24%', '24%'], [15, '32%', '32%', '32%'], [18, '48%', '48%'], [20, '100%'], [6, '100%']] },
  { id: 'diag-mix-04', name: 'Diag Mix Clessidra', category: 'creative', description: 'Clessidra: 4→2→1→2→4',
    rows: [[6, '100%'], [15, '24%', '24%', '24%', '24%'], [20, '48%', '48%'], [35, '100%'], [20, '48%', '48%'], [15, '24%', '24%', '24%', '24%'], [6, '100%']] },
  { id: 'diag-mix-05', name: 'Diag Mix Scala Up', category: 'creative', description: 'Ogni riga aggiunge una colonna',
    rows: [[8, '100%'], [35, '100%'], [25, '48%', '48%'], [20, '32%', '32%', '32%'], [15, '24%', '24%', '24%', '24%'], [12, '19%', '19%', '19%', '19%', '19%'], [8, '100%']] },
  { id: 'diag-mix-06', name: 'Diag Mix Fiamma', category: 'creative', description: 'Si allarga come una fiamma',
    rows: [[6, '100%'], [10, '80%'], [15, '100%'], [10, '48%', '48%'], [20, '100%'], [10, '32%', '32%', '32%'], [25, '100%'], [6, '100%']] },
  { id: 'diag-mix-07', name: 'Diag Mix Fulmine', category: 'creative', description: 'Zigzag di colonne diverse',
    rows: [[6, '100%'], [20, '70%', '28%'], [20, '28%', '70%'], [15, '32%', '32%', '32%'], [20, '70%', '28%'], [20, '28%', '70%'], [15, '24%', '24%', '24%', '24%'], [6, '100%']] },
  { id: 'diag-mix-08', name: 'Diag Mix Tornado', category: 'creative', description: 'Si stringe e allarga come un tornado',
    rows: [[6, '100%'], [15, '24%', '24%', '24%', '24%'], [25, '38%', '60%'], [35, '100%'], [25, '60%', '38%'], [15, '24%', '24%', '24%', '24%'], [6, '100%']] },
  { id: 'diag-mix-09', name: 'Diag Mix Freccia Giù', category: 'creative', description: 'Punta verso il basso come una freccia',
    rows: [[8, '100%'], [15, '24%', '24%', '24%', '24%'], [20, '32%', '32%', '32%'], [25, '48%', '48%'], [35, '100%'], [8, '100%']] },
  { id: 'diag-mix-10', name: 'Diag Mix Freccia Su', category: 'creative', description: 'Punta verso l alto come una freccia',
    rows: [[8, '100%'], [35, '100%'], [25, '48%', '48%'], [20, '32%', '32%', '32%'], [15, '24%', '24%', '24%', '24%'], [8, '100%']] },
  { id: 'diag-mix-11', name: 'Diag Mix Esplosione', category: 'creative', description: 'Centro che esplode verso fuori',
    rows: [[6, '100%'], [30, '100%'], [10, '48%', '48%'], [8, '32%', '32%', '32%'], [6, '24%', '24%', '24%', '24%'], [8, '32%', '32%', '32%'], [10, '48%', '48%'], [30, '100%'], [6, '100%']] },
  { id: 'diag-mix-12', name: 'Diag Mix Implosione', category: 'creative', description: 'Dai bordi verso il centro',
    rows: [[6, '100%'], [6, '24%', '24%', '24%', '24%'], [8, '32%', '32%', '32%'], [10, '48%', '48%'], [30, '100%'], [10, '48%', '48%'], [8, '32%', '32%', '32%'], [6, '24%', '24%', '24%', '24%'], [6, '100%']] },

  // ═══════════════════════════════════════════════════════════════
  // FANTASY - FORME CON SVG (30)
  // SVG thumbnails per forme impossibili con solo CSS
  // ═══════════════════════════════════════════════════════════════
  { id: 'fan-diag-split', name: 'Taglio Diagonale', category: 'fantasy', description: 'Due sezioni divise da taglio diagonale netto',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="12" rx="2" fill="#888"/><polygon points="2,18 198,18 198,80 2,140" fill="#aaa"/><polygon points="2,140 198,80 198,148 2,148" fill="#777"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-diag-3way', name: 'Triplo Diagonale', category: 'fantasy', description: 'Tre sezioni con tagli diagonali',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="2,16 66,16 66,148 2,100" fill="#aaa"/><polygon points="66,16 134,16 134,100 66,148" fill="#999"/><polygon points="134,16 198,16 198,148 134,100" fill="#bbb"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-diag-zigzag', name: 'Zigzag Diagonale', category: 'fantasy', description: 'Sezioni con bordi a zigzag diagonali',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="2,16 100,16 80,50 100,84 80,118 100,148 2,148" fill="#aaa"/><polygon points="100,16 198,16 198,148 100,148 120,118 100,84 120,50" fill="#999"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-diag-wave', name: 'Onda Diagonale', category: 'fantasy', description: 'Due sezioni separate da onda diagonale',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><path d="M2,16 L198,16 L198,60 C160,80 140,40 100,70 C60,100 40,60 2,90 Z" fill="#aaa"/><path d="M2,90 C40,60 60,100 100,70 C140,40 160,80 198,60 L198,148 L2,148 Z" fill="#999"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-diag-arrow', name: 'Freccia Diagonale', category: 'fantasy', description: 'Layout con freccia diagonale che divide la pagina',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="2,16 198,16 198,70 120,82 198,94 198,148 2,148 2,94 80,82 2,70" fill="#aaa"/><polygon points="2,70 80,82 2,94" fill="#777"/><polygon points="198,70 120,82 198,94" fill="#777"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-crystal-svg', name: 'Cristallo SVG', category: 'fantasy', description: 'Cristallo sfaccettato con tagli angolari',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="100,16 160,45 198,82 160,120 100,148 40,120 2,82 40,45" fill="#aaa"/><polygon points="100,16 100,82 40,45" fill="#999"/><polygon points="100,16 160,45 100,82" fill="#bbb"/><polygon points="40,45 2,82 100,82" fill="#888"/><polygon points="160,45 198,82 100,82" fill="#777"/><polygon points="2,82 40,120 100,82" fill="#aaa"/><polygon points="198,82 160,120 100,82" fill="#999"/><polygon points="40,120 100,148 100,82" fill="#bbb"/><polygon points="160,120 100,148 100,82" fill="#888"/></svg>` },
  { id: 'fan-shield-svg', name: 'Scudo Araldico', category: 'fantasy', description: 'Forma di scudo con divisioni araldiche',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><path d="M20,16 L180,16 L180,90 Q180,130 100,148 Q20,130 20,90 Z" fill="#aaa"/><path d="M20,16 L100,16 L100,148 Q20,130 20,90 Z" fill="#999"/><line x1="20" y1="70" x2="180" y2="70" stroke="#777" stroke-width="2"/><rect x="70" y="40" width="60" height="60" rx="4" fill="#777" opacity="0.3"/></svg>` },
  { id: 'fan-hexagon', name: 'Griglia Esagonale', category: 'fantasy', description: 'Nido d ape con esagoni',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="50,30 80,18 110,30 110,55 80,67 50,55" fill="#aaa" stroke="#fff" stroke-width="1"/><polygon points="110,30 140,18 170,30 170,55 140,67 110,55" fill="#999" stroke="#fff" stroke-width="1"/><polygon points="20,55 50,43 80,55 80,80 50,92 20,80" fill="#bbb" stroke="#fff" stroke-width="1"/><polygon points="80,55 110,43 140,55 140,80 110,92 80,80" fill="#aaa" stroke="#fff" stroke-width="1"/><polygon points="140,55 170,43 198,55 198,80 170,92 140,80" fill="#999" stroke="#fff" stroke-width="1"/><polygon points="50,80 80,68 110,80 110,105 80,117 50,105" fill="#999" stroke="#fff" stroke-width="1"/><polygon points="110,80 140,68 170,80 170,105 140,117 110,105" fill="#bbb" stroke="#fff" stroke-width="1"/><polygon points="80,105 110,93 140,105 140,130 110,142 80,130" fill="#aaa" stroke="#fff" stroke-width="1"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-diamond', name: 'Diamante Tagliato', category: 'fantasy', description: 'Diamante con sfaccettature multiple',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="40,30 100,16 160,30 198,82 100,148 2,82" fill="#aaa"/><polygon points="40,30 100,16 100,82" fill="#bbb"/><polygon points="100,16 160,30 100,82" fill="#999"/><polygon points="160,30 198,82 100,82" fill="#888"/><polygon points="40,30 2,82 100,82" fill="#aaa"/><polygon points="2,82 100,148 100,82" fill="#bbb"/><polygon points="198,82 100,148 100,82" fill="#999"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-eye-svg', name: 'Occhio Mistico', category: 'fantasy', description: 'Occhio con pupilla e iride',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="2" y="16" width="196" height="132" fill="#ddd" rx="4"/><path d="M2,82 Q50,30 100,30 Q150,30 198,82 Q150,134 100,134 Q50,134 2,82 Z" fill="#aaa"/><circle cx="100" cy="82" r="30" fill="#999"/><circle cx="100" cy="82" r="15" fill="#777"/><circle cx="106" cy="76" r="5" fill="#bbb"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-crown-svg', name: 'Corona Regale', category: 'fantasy', description: 'Corona con tre punte e gemme',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="20,120 40,40 70,80 100,20 130,80 160,40 180,120" fill="#aaa"/><rect x="20" y="120" width="160" height="20" rx="3" fill="#999"/><circle cx="40" cy="60" r="5" fill="#bbb"/><circle cx="100" cy="35" r="6" fill="#bbb"/><circle cx="160" cy="60" r="5" fill="#bbb"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-butterfly-svg', name: 'Farfalla', category: 'fantasy', description: 'Ali di farfalla con simmetria',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><path d="M100,30 Q40,20 20,50 Q2,80 30,110 Q60,140 100,82 Q140,140 170,110 Q198,80 180,50 Q160,20 100,30 Z" fill="#aaa"/><path d="M100,30 Q60,20 30,50 Q10,80 40,105 Q65,130 100,82 Z" fill="#999"/><path d="M100,30 Q140,20 170,50 Q190,80 160,105 Q135,130 100,82 Z" fill="#bbb"/><line x1="100" y1="30" x2="100" y2="140" stroke="#777" stroke-width="2"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-castle-svg', name: 'Castello Medievale', category: 'fantasy', description: 'Mura con torri e merli',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="10" y="20" width="20" height="8" fill="#999"/><rect x="40" y="20" width="20" height="8" fill="#999"/><rect x="80" y="10" width="40" height="8" fill="#999"/><rect x="140" y="20" width="20" height="8" fill="#999"/><rect x="170" y="20" width="20" height="8" fill="#999"/><rect x="15" y="28" width="12" height="120" fill="#aaa"/><rect x="45" y="28" width="12" height="120" fill="#aaa"/><rect x="145" y="28" width="12" height="120" fill="#aaa"/><rect x="175" y="28" width="12" height="120" fill="#aaa"/><rect x="57" y="50" width="88" height="98" fill="#bbb"/><rect x="85" y="18" width="30" height="40" fill="#aaa"/><path d="M85,18 L100,8 L115,18" fill="#999"/><rect x="80" y="100" width="40" height="48" rx="20 20 0 0" fill="#888"/><rect x="65" y="50" width="70" height="6" fill="#999"/></svg>` },
  { id: 'fan-flame-svg', name: 'Fiamma Viva', category: 'fantasy', description: 'Fiamma con lingue di fuoco',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="2" y="16" width="196" height="132" fill="#ddd" rx="4"/><path d="M100,20 Q120,50 115,70 Q130,45 125,80 Q145,60 130,100 Q140,90 130,120 Q120,148 100,148 Q80,148 70,120 Q60,90 70,100 Q55,60 75,80 Q70,45 85,70 Q80,50 100,20 Z" fill="#aaa"/><path d="M100,60 Q110,80 105,95 Q115,85 110,110 Q105,130 100,130 Q95,130 90,110 Q85,85 95,95 Q90,80 100,60 Z" fill="#999"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-portal-svg', name: 'Portale Dimensionale', category: 'fantasy', description: 'Arco con portale luminoso',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="16" width="196" height="132" fill="#ddd" rx="4"/><rect x="30" y="40" width="25" height="108" fill="#aaa"/><rect x="145" y="40" width="25" height="108" fill="#aaa"/><path d="M55,148 L55,60 Q55,30 100,30 Q145,30 145,60 L145,148 Z" fill="#999"/><path d="M65,148 L65,65 Q65,42 100,42 Q135,42 135,65 L135,148 Z" fill="#bbb"/><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-spiral', name: 'Spirale', category: 'fantasy', description: 'Layout a spirale concentrica',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="10" y="20" width="180" height="30" fill="#aaa" rx="3"/><rect x="130" y="20" width="60" height="80" fill="#999" rx="3"/><rect x="10" y="70" width="120" height="30" fill="#bbb" rx="3"/><rect x="10" y="70" width="50" height="70" fill="#aaa" rx="3"/><rect x="60" y="100" width="130" height="40" fill="#999" rx="3"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-pyramid-svg', name: 'Piramide', category: 'fantasy', description: 'Piramide con gradini e camera interna',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><polygon points="100,16 190,140 10,140" fill="#aaa"/><polygon points="100,16 100,140 10,140" fill="#999"/><polygon points="60,140 80,100 120,100 140,140" fill="#bbb"/><polygon points="80,100 90,80 110,80 120,100" fill="#888"/><rect x="92" y="110" width="16" height="30" fill="#777"/><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="2" y="148" width="196" height="10" rx="2" fill="#888"/></svg>` },
  { id: 'fan-tree-svg', name: 'Albero della Vita', category: 'fantasy', description: 'Albero con chioma ramificata',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="88" y="100" width="24" height="48" fill="#999" rx="2"/><ellipse cx="100" cy="65" rx="65" ry="50" fill="#aaa"/><ellipse cx="60" cy="50" rx="30" ry="25" fill="#999"/><ellipse cx="140" cy="50" rx="30" ry="25" fill="#bbb"/><ellipse cx="100" cy="35" rx="25" ry="22" fill="#aaa"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-mandala-svg', name: 'Mandala', category: 'fantasy', description: 'Pattern circolare simmetrico',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="2" y="16" width="196" height="132" fill="#ddd" rx="4"/><circle cx="100" cy="82" r="55" fill="#aaa"/><circle cx="100" cy="82" r="40" fill="#bbb"/><circle cx="100" cy="82" r="25" fill="#999"/><circle cx="100" cy="82" r="12" fill="#888"/><line x1="100" y1="27" x2="100" y2="137" stroke="#777" stroke-width="1"/><line x1="45" y1="82" x2="155" y2="82" stroke="#777" stroke-width="1"/><line x1="61" y1="43" x2="139" y2="121" stroke="#777" stroke-width="1"/><line x1="139" y1="43" x2="61" y2="121" stroke="#777" stroke-width="1"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-hourglass-svg', name: 'Clessidra', category: 'fantasy', description: 'Clessidra con strozzatura al centro',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="30,20 170,20 120,78 170,136 30,136 80,78" fill="#aaa"/><polygon points="30,20 100,20 80,78 30,136 30,20" fill="#999" opacity="0.5"/><rect x="25" y="16" width="150" height="6" fill="#999"/><rect x="25" y="134" width="150" height="6" fill="#999"/><rect x="75" y="72" width="50" height="12" rx="6" fill="#bbb"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-mosaic', name: 'Mosaico Bizantino', category: 'fantasy', description: 'Tessere irregolari come un mosaico',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="5" y="18" width="58" height="40" rx="2" fill="#aaa"/><rect x="67" y="18" width="90" height="40" rx="2" fill="#999"/><rect x="161" y="18" width="34" height="40" rx="2" fill="#bbb"/><rect x="5" y="62" width="40" height="55" rx="2" fill="#999"/><rect x="49" y="62" width="65" height="30" rx="2" fill="#bbb"/><rect x="118" y="62" width="77" height="30" rx="2" fill="#aaa"/><rect x="49" y="96" width="38" height="50" rx="2" fill="#aaa"/><rect x="91" y="96" width="50" height="50" rx="2" fill="#999"/><rect x="145" y="96" width="50" height="50" rx="2" fill="#bbb"/><rect x="5" y="121" width="40" height="25" rx="2" fill="#bbb"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-stained', name: 'Vetrata Gotica', category: 'fantasy', description: 'Vetrata con archi e divisioni gotiche',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><path d="M20,148 L20,50 Q20,20 60,20 L60,148 Z" fill="#aaa"/><path d="M65,148 L65,50 Q65,20 100,16 Q135,20 135,50 L135,148 Z" fill="#999"/><path d="M140,148 L140,50 Q140,20 180,20 L180,148 Z" fill="#bbb"/><path d="M65,50 Q65,30 100,25 Q135,30 135,50" fill="#888" opacity="0.3"/><line x1="100" y1="25" x2="100" y2="148" stroke="#777" stroke-width="1"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-vortex-svg', name: 'Vortice', category: 'fantasy', description: 'Spirale che risucchia verso il centro',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="2" y="16" width="196" height="132" fill="#ddd" rx="4"/><path d="M10,82 Q10,20 100,20 Q190,20 190,82" fill="none" stroke="#aaa" stroke-width="12"/><path d="M30,82 Q30,35 100,35 Q170,35 170,82" fill="none" stroke="#999" stroke-width="10"/><path d="M50,82 Q50,48 100,48 Q150,48 150,82" fill="none" stroke="#bbb" stroke-width="8"/><path d="M190,82 Q190,140 100,140 Q10,140 10,82" fill="none" stroke="#aaa" stroke-width="12"/><path d="M170,82 Q170,125 100,125 Q30,125 30,82" fill="none" stroke="#999" stroke-width="10"/><circle cx="100" cy="82" r="12" fill="#888"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-dna-svg', name: 'Doppia Elica', category: 'fantasy', description: 'DNA con doppia elica intrecciata',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><path d="M40,20 Q100,50 160,20 Q100,50 40,80 Q100,110 160,80 Q100,110 40,140" fill="none" stroke="#aaa" stroke-width="8"/><path d="M160,20 Q100,50 40,20 Q100,50 160,80 Q100,110 40,80 Q100,110 160,140" fill="none" stroke="#999" stroke-width="8"/><line x1="65" y1="28" x2="135" y2="28" stroke="#bbb" stroke-width="2"/><line x1="60" y1="50" x2="140" y2="50" stroke="#bbb" stroke-width="2"/><line x1="65" y1="72" x2="135" y2="72" stroke="#bbb" stroke-width="2"/><line x1="60" y1="95" x2="140" y2="95" stroke="#bbb" stroke-width="2"/><line x1="65" y1="117" x2="135" y2="117" stroke="#bbb" stroke-width="2"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-waves-svg', name: 'Onde Parallele', category: 'fantasy', description: 'Sezioni separate da onde curve',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><path d="M2,16 L198,16 L198,45 Q150,35 100,50 Q50,65 2,55 Z" fill="#aaa"/><path d="M2,55 Q50,65 100,50 Q150,35 198,45 L198,80 Q150,70 100,85 Q50,100 2,90 Z" fill="#999"/><path d="M2,90 Q50,100 100,85 Q150,70 198,80 L198,115 Q150,105 100,120 Q50,135 2,125 Z" fill="#bbb"/><path d="M2,125 Q50,135 100,120 Q150,105 198,115 L198,148 L2,148 Z" fill="#aaa"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-geo', name: 'Geometrico Astratto', category: 'fantasy', description: 'Forme geometriche sovrapposte',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><rect x="2" y="16" width="196" height="132" fill="#ddd" rx="4"/><rect x="10" y="20" width="80" height="60" rx="3" fill="#aaa" transform="rotate(-5 50 50)"/><circle cx="150" cy="50" r="35" fill="#999"/><polygon points="30,90 90,80 110,130 50,140" fill="#bbb"/><rect x="120" y="85" width="70" height="55" rx="3" fill="#aaa" transform="rotate(3 155 112)"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
  { id: 'fan-broken-svg', name: 'Vetro Rotto', category: 'fantasy', description: 'Layout frammentato come vetro rotto',
    rows: [[100, '100%']],
    svg: `<svg viewBox="0 0 200 160" fill="none"><rect x="2" y="2" width="196" height="10" rx="2" fill="#888"/><polygon points="2,16 80,16 60,70 2,55" fill="#aaa"/><polygon points="80,16 150,16 120,50 60,70" fill="#999"/><polygon points="150,16 198,16 198,60 120,50" fill="#bbb"/><polygon points="2,55 60,70 40,110 2,90" fill="#999"/><polygon points="60,70 120,50 140,100 80,120 40,110" fill="#aaa"/><polygon points="120,50 198,60 198,110 140,100" fill="#888"/><polygon points="2,90 40,110 30,148 2,148" fill="#bbb"/><polygon points="40,110 80,120 100,148 30,148" fill="#999"/><polygon points="80,120 140,100 160,148 100,148" fill="#aaa"/><polygon points="140,100 198,110 198,148 160,148" fill="#bbb"/><rect x="2" y="150" width="196" height="8" rx="2" fill="#888"/></svg>` },
];
