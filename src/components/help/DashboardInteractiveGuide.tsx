'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileText,
  LayoutTemplate,
  Megaphone,
  Newspaper,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { GuideSheet } from '@/components/help/GuideSheet';

type GuideSection = {
  id: string;
  label: string;
  title: string;
  intro: string;
  bullets: string[];
  tips: string[];
  icon: typeof FileText;
};

type GuidePage = {
  title: string;
  subtitle: string;
  sections: GuideSection[];
  links?: Array<{ href: string; label: string }>;
};

function createGuidePage(
  title: string,
  subtitle: string,
  sections: GuideSection[],
  links?: Array<{ href: string; label: string }>
): GuidePage {
  return { title, subtitle, sections, links };
}

const DASHBOARD_HOME_GUIDE = createGuidePage('Guida Home CMS', 'Panoramica del CMS e del flusso corretto di lavoro.', [
  {
    id: 'overview',
    label: 'Panoramica',
    title: 'Cos’e` la Home del CMS',
    intro: 'La Home non e` un modulo operativo singolo: serve a orientare il lavoro e a mostrare lo stato generale del tenant attivo.',
    bullets: [
      'Mostra un quadro rapido di articoli, media, eventi, banner e attivita` recenti.',
      'Ti aiuta a capire in quale modulo entrare, ma non sostituisce i moduli specialistici.',
      'Da qui parti verso contenuti, tassonomie, redazione, SEO, ADV e controllo tecnico.',
    ],
    tips: ['Usala come ingresso iniziale del CMS.', 'Dalla Home vai subito al modulo giusto senza allungare il flusso.'],
    icon: Newspaper,
  },
  {
    id: 'workflow',
    label: 'Flusso',
    title: 'Come leggere il CMS nel modo giusto',
    intro: 'Il CMS funziona bene quando il percorso e` lineare: si produce contenuto, si organizza il sito, si pubblica e poi si controlla il risultato.',
    bullets: [
      'Produzione: Articoli, Media, Eventi, Breaking News.',
      'Organizzazione: Pagine, Categorie, Tag, Menu, Regole slot.',
      'Distribuzione: SEO, newsletter, ADV, pubblicazione.',
      'Controllo: Utenti, impostazioni, tecnico, log, compliance.',
    ],
    tips: ['La Home deve chiarire il percorso, non creare scorciatoie confuse.', 'Ogni blocco del CMS deve avere un posto preciso nel flusso.'],
    icon: Workflow,
  },
  {
    id: 'security',
    label: 'Sicurezza',
    title: 'Cosa garantisce questa guida',
    intro: 'La guida aiuta a orientarsi, ma non sostituisce mai i controlli veri di tenant, ruoli e permessi.',
    bullets: [
      'Il contesto resta sempre il tenant attivo.',
      'Le operazioni reali continuano a essere verificate nei moduli e nelle API.',
      'La guida non deve introdurre bypass o scorciatoie insicure.',
    ],
    tips: ['Un buon helper accompagna il lavoro senza aggirare la sicurezza.', 'Il CMS deve restare leggibile e governabile anche per i ruoli meno tecnici.'],
    icon: ShieldCheck,
  },
]);

const PAGE_GUIDES: Array<{ match: (pathname: string) => boolean; page: GuidePage }> = [
  { match: (pathname) => pathname === '/dashboard', page: DASHBOARD_HOME_GUIDE },
  {
    match: (pathname) => pathname === '/dashboard/redazione',
    page: createGuidePage('Guida Redazione', 'Hub operativo del desk giornalistico, con priorita`, stati e automazioni.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'A cosa serve Redazione',
        intro: 'Redazione organizza il lavoro editoriale quotidiano: non sostituisce gli articoli o i moduli, ma li mette in un ordine utile al desk.',
        bullets: [
          'Mostra bozze, revisioni, approvati, programmati e breaking.',
          'Raccoglie i collegamenti rapidi ai moduli che il desk usa ogni giorno.',
          'Aiuta a leggere priorita`, carico operativo e contenuti che richiedono attenzione.',
        ],
        tips: ['Usala come schermata iniziale del desk.', 'Le priorita` della giornata devono essere leggibili a colpo d’occhio.'],
        icon: Newspaper,
      },
      {
        id: 'roles',
        label: 'Ruoli',
        title: 'Chi entra dove nel lavoro editoriale',
        intro: 'La redazione funziona meglio quando ogni ruolo entra dallo strumento giusto invece di passare sempre dal modulo piu` pesante.',
        bullets: [
          'Collaboratore: usa soprattutto Desk Giornalisti per aprire bozze, allegare media e passare il pezzo in revisione.',
          'Editor: lavora tra Articoli, Desk, Commenti, Breaking ed Eventi per rifinire e mettere in linea il flusso.',
          'Caporedattore: governa priorita`, approvazioni, automazioni homepage e distribuzione editoriale.',
          'Super admin: controlla anche logica di piattaforma, ruoli e stato tecnico, ma il lavoro quotidiano parte comunque da qui.',
        ],
        tips: ['Se un ruolo entra nel modulo sbagliato, il CMS sembra piu` pesante del necessario.', 'Redazione deve diventare il pannello iniziale del lavoro editoriale, non solo una statistica.'],
        icon: Workflow,
      },
      {
        id: 'workflow',
        label: 'Workflow',
        title: 'Come scorre il lavoro editoriale',
        intro: 'Il flusso corretto resta sempre questo: scrittura, revisione, approvazione, programmazione e pubblicazione.',
        bullets: [
          'Bozza: il pezzo nasce e si consolida.',
          'Revisione: il desk o il caporedattore verifica.',
          'Approvazione: il contenuto e` pronto.',
          'Pubblicazione o breaking: il pezzo entra nel sito e nei flussi di evidenza.',
        ],
        tips: ['Le etichette stato vanno lette come priorita` reali di lavoro.', 'Il desk deve vedere subito cosa richiede intervento umano.'],
        icon: Workflow,
      },
      {
        id: 'tools',
        label: 'Strumenti',
        title: 'Quali moduli usare nelle varie fasi della giornata',
        intro: 'Il lavoro della redazione non passa da un solo modulo: Redazione serve proprio a riunire gli ingressi corretti senza costringere il team a cercarli uno per uno.',
        bullets: [
          'Produzione: Desk, Articoli, Media.',
          'Controllo: Commenti, Breaking, Eventi, Form.',
          'Distribuzione: Social, Newsletter, SEO.',
          'Verifica: Log attivita`, Redirect, Tecnico quando serve.',
        ],
        tips: ['Meglio pochi ingressi chiari e ripetibili che una sidebar da interpretare ogni volta.', 'Un desk editoriale efficace rende evidenti le azioni, non i moduli.'],
        icon: Sparkles,
      },
      {
        id: 'automation',
        label: 'Automazioni',
        title: 'Come leggere le regole automatiche',
        intro: 'Le automazioni non sostituiscono la redazione: servono a rendere prevedibili homepage, slot e ricambio dei contenuti.',
        bullets: [
          'La finestra di freschezza homepage regola quanto un contenuto resta eleggibile negli slot automatici.',
          'Categorie, tag e placement possono cooperare per evidenze e primo piano.',
          'Le regole vanno preparate prima, poi collegate agli slot quando il sito e` pronto.',
        ],
        tips: ['Automazione non vuol dire rigidita`.', 'Una newsroom veloce usa regole semplici ma chiare.'],
        icon: Sparkles,
      },
    ], [
      { href: '/dashboard/desk', label: 'Apri Desk' },
      { href: '/dashboard/articoli', label: 'Apri Articoli' },
      { href: '/dashboard/commenti', label: 'Apri Commenti' },
      { href: '/dashboard/breaking-news', label: 'Apri Breaking' },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/desk',
    page: createGuidePage('Guida Desk Giornalisti', 'Interfaccia rapida per reporter e collaboratori.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Cos’e` il Desk',
        intro: 'Il Desk e` la porta leggera del CMS per chi deve raccogliere materiali e preparare articoli senza entrare nel pannello completo.',
        bullets: [
          'Raccoglie testo, foto, video e audio nello stesso flusso.',
          'Riduce il rumore dell’interfaccia per reporter e contributor.',
          'Lavora sugli articoli reali del CMS e sul workflow vero della redazione.',
        ],
        tips: ['Usalo per produzione veloce dal campo.', 'Il CMS completo resta per lavoro piu` strutturato.'],
        icon: FileText,
      },
      {
        id: 'roles',
        label: 'Uso corretto',
        title: 'Quando usare il Desk invece dell’editor completo',
        intro: 'Il Desk non e` una copia semplificata del CMS: e` il suo ingresso operativo per chi lavora sul pezzo mentre e` ancora in movimento.',
        bullets: [
          'Serve a raccogliere il materiale quando l’articolo non e` ancora pronto per il flusso completo.',
          'Riduce il tempo perso tra telefono, appunti, media e prima stesura.',
          'Lascia al desk editoriale e al caporedattore il lavoro di rifinitura e messa in linea.',
        ],
        tips: ['Se il giornalista deve “capire il CMS”, il Desk non sta facendo il suo lavoro.', 'Il passaggio a Articoli deve essere naturale, non traumatico.'],
        icon: Workflow,
      },
      {
        id: 'workflow',
        label: 'Workflow',
        title: 'Come passa il contenuto dal campo al CMS',
        intro: 'Il Desk serve a far entrare materiali e bozze nel flusso ufficiale della testata senza perdere tempo.',
        bullets: [
          'Apri o crea il progetto articolo.',
          'Carica materiali e note.',
          'Salva in bozza o invia in revisione.',
          'Il desk editoriale rifinisce e pubblica nel CMS.',
        ],
        tips: ['Meglio pochi campi chiari che una UI piena di rumore.', 'Il giornalista deve arrivare al pezzo, non al pannello.'],
        icon: Workflow,
      },
    ], [
      { href: '/giornalista', label: 'Apri App Giornalista' },
      { href: '/dashboard/articoli', label: 'Apri Articoli' },
      { href: '/dashboard/media', label: 'Apri Media' },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/pagine' || pathname === '/dashboard/layout' || pathname === '/dashboard/templates',
    page: createGuidePage('Guida Pagine e Struttura', 'Pagine, struttura e libreria dei modelli del sito.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Dove nasce la struttura del sito',
        intro: 'Questa area governa la struttura del sito: pagine, schemi, librerie e relazioni con il desktop editor.',
        bullets: [
          'Pagine governa anagrafica, slug e pubblicazione.',
          'Layout e template guidano la struttura, non i contenuti editoriali.',
          'Le regole di contenuto stanno nel CMS, il builder resta separato.',
        ],
        tips: ['La struttura va impostata con metodo prima del dettaglio grafico.', 'Separare struttura e contenuto rende il CMS piu` chiaro.'],
        icon: LayoutTemplate,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Come usare quest’area senza confusione',
        intro: 'Prima si definisce la pagina, poi il ruolo strutturale, poi il contenuto e infine il publish.',
        bullets: [
          'Crea o seleziona la pagina.',
          'Definisci la struttura o il template di riferimento.',
          'Collega regole contenuto e menu nel CMS.',
          'Pubblica e verifica il layer pubblicato.',
        ],
        tips: ['Non mischiare builder online e CMS editoriale.', 'Una pagina ben strutturata evita rifacimenti dopo.'],
        icon: Workflow,
      },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/articoli' || pathname.startsWith('/dashboard/articoli/'),
    page: createGuidePage('Guida Articoli', 'Produzione editoriale, stati, tassonomie e publish.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Il cuore della produzione contenuti',
        intro: 'Qui si scrivono, classificano e pubblicano i pezzi del sito.',
        bullets: [
          'Titolo, corpo, media, categorie, tag e SEO vivono nello stesso flusso.',
          'Gli articoli possono alimentare homepage, listing, categorie e breaking.',
          'Tag e categorie non sono decorativi: guidano anche regole editoriali e placement.',
        ],
        tips: ['Questa e` la pagina principale della redazione.', 'Ogni campo qui ha effetti sul sito pubblico e sul publish layer.'],
        icon: Newspaper,
      },
      {
        id: 'workflow',
        label: 'Workflow',
        title: 'Come leggere categorie, tag e placement',
        intro: 'Categorie e tag servono sia alla navigazione sia alla logica editoriale del sito.',
        bullets: [
          'La categoria primaria guida la presenza naturale del pezzo.',
          'I tag possono attivare evidenze o placement come Primo Piano.',
          'La modalita` duplicate mantiene l’articolo sia nel placement sia nella categoria.',
          'La modalita` exclusive lo tiene solo nel placement finche` attivo, poi torna alla categoria.',
        ],
        tips: ['Il placement deve nascere da regole chiare, non da correzioni improvvisate.', 'Prima definisci la tassonomia, poi colleghi gli slot.'],
        icon: Sparkles,
      },
    ]),
  },
  {
    match: (pathname) =>
      pathname === '/dashboard/media' ||
      pathname === '/dashboard/categorie' ||
      pathname === '/dashboard/tag' ||
      pathname === '/dashboard/commenti' ||
      pathname === '/dashboard/breaking-news' ||
      pathname === '/dashboard/eventi',
    page: createGuidePage('Guida Flusso Editoriale', 'Tassonomie, supporti redazionali, commenti e contenuti caldi.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'I moduli che danno ordine al lavoro editoriale',
        intro: 'Questi moduli non sono secondari: tengono in ordine il contenuto e rendono il sito piu` governabile.',
        bullets: [
          'Categorie e tag organizzano l’archivio e le regole di evidenza.',
          'Breaking ed eventi danno priorita` e ritmo al sito.',
          'Commenti e media chiudono il cerchio della gestione editoriale quotidiana.',
        ],
        tips: ['Una testata ordinata nasce anche da qui.', 'Le regole vanno preparate prima di usarle su larga scala.'],
        icon: Sparkles,
      },
      {
        id: 'workflow',
        label: 'Workflow',
        title: 'Come preparare il sito prima di pubblicare tanto',
        intro: 'Prima si definiscono tassonomie e regole, poi si spinge il flusso di contenuti. Questo evita homepage fragili e archivi disordinati.',
        bullets: [
          'Riordina categorie e significato dei tag.',
          'Prepara regole redazionali anche se la homepage non e` ancora chiusa.',
          'Collega slot e placement quando la struttura e` pronta.',
        ],
        tips: ['Non devi avere tutto gia` online per impostare bene il CMS.', 'La preparazione a monte rende il publish piu` pulito.'],
        icon: Workflow,
      },
    ]),
  },
  {
    match: (pathname) =>
      pathname === '/dashboard/banner' ||
      pathname === '/dashboard/inserzionisti' ||
      pathname === '/dashboard/adv' ||
      pathname === '/dashboard/contabilita',
    page: createGuidePage('Guida ADV e Commerciale', 'Gestione commerciale e pubblicitaria del CMS.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Dove vive la parte business',
        intro: 'Questa area gestisce inserzionisti, creativita`, posizioni e controllo commerciale senza confondersi con il flusso editoriale.',
        bullets: [
          'Separa contenuto e monetizzazione.',
          'Tiene ordinati clienti, campagne e creativita`.',
          'Supporta il publish del sito senza sporcare il CMS editoriale.',
        ],
        tips: ['Commerciale e redazione devono restare collegati ma distinti.', 'Le regole qui devono essere misurabili e precise.'],
        icon: Megaphone,
      },
    ]),
  },
  {
    match: (pathname) =>
      pathname === '/dashboard/seo' ||
      pathname === '/dashboard/redirect' ||
      pathname === '/dashboard/newsletter',
    page: createGuidePage('Guida Distribuzione', 'Visibilita`, continuita` URL e rilancio dei contenuti.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Dove il contenuto esce davvero',
        intro: 'SEO, redirect e newsletter servono a dare continuita`, visibilita` e distribuzione ai contenuti pubblicati.',
        bullets: [
          'SEO rifinisce metadata e resa pubblica.',
          'Redirect protegge le URL quando il sito evolve.',
          'Newsletter aiuta rilancio e fidelizzazione.',
        ],
        tips: ['La distribuzione e` parte del prodotto finale.', 'Non chiudere il lavoro al salvataggio del contenuto.'],
        icon: ShieldCheck,
      },
    ]),
  },
  {
    match: (pathname) =>
      pathname === '/dashboard/menu' ||
      pathname === '/dashboard/footer' ||
      pathname === '/dashboard/testata' ||
      pathname === '/dashboard/impostazioni' ||
      pathname === '/dashboard/moduli' ||
      pathname === '/dashboard/gdpr' ||
      pathname === '/dashboard/utenti' ||
      pathname === '/dashboard/activity-log' ||
      pathname === '/dashboard/tecnico' ||
      pathname === '/dashboard/migrazioni' ||
      pathname === '/dashboard/ia' ||
      pathname === '/dashboard/ai-debug' ||
      pathname === '/dashboard/ai-test' ||
      pathname === '/dashboard/form' ||
      pathname === '/dashboard/cms' ||
      pathname === '/dashboard/desktop-bridge',
    page: createGuidePage('Guida Configurazione e Controllo', 'Area sistemica del CMS: piattaforma, controllo tecnico, bridge e configurazione.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'La parte di governo del CMS',
        intro: 'Qui non si produce solo contenuto: si governa il contesto tecnico e organizzativo in cui il CMS lavora.',
        bullets: [
          'Comprende impostazioni, testata, ruoli, log, tecnico, migrazioni e bridge.',
          'Ha un impatto trasversale su tutto il prodotto.',
          'Va letta come area di governo e controllo, non come semplice raccolta utility.',
        ],
        tips: ['Questa zona richiede precisione piu` che velocita`.', 'Un CMS solido nasce anche da queste pagine.'],
        icon: Settings2,
      },
      {
        id: 'workflow',
        label: 'Workflow',
        title: 'Come usare questa area senza fare confusione',
        intro: 'La logica corretta e` configurare, verificare, pubblicare e poi monitorare. Le scorciatoie non devono rompere il modello.',
        bullets: [
          'Platform e profilo utente stanno a monte del CMS.',
          'Il CMS gestisce contenuti, tassonomie, publish e controllo sito.',
          'Il desktop editor resta separato e si collega tramite bridge tecnico.',
        ],
        tips: ['Questa separazione va mantenuta sempre chiara anche in UI.', 'Il tecnico deve trovare documenti e contratti, non una dashboard rumorosa.'],
        icon: Workflow,
      },
    ]),
  },
];

function resolvePage(pathname: string): GuidePage | null {
  if (!pathname.startsWith('/dashboard') || pathname === '/dashboard/editor') {
    return null;
  }

  return PAGE_GUIDES.find((entry) => entry.match(pathname))?.page ?? null;
}

export function DashboardInteractiveGuide() {
  const pathname = usePathname();
  const page = useMemo(() => resolvePage(pathname), [pathname]);

  const sections = useMemo(() => {
    if (!page) {
      return [];
    }

    return page.sections.map((section) => ({
      id: section.id,
      label: section.label,
      title: section.title,
      body: [section.intro],
      bullets: section.bullets,
      note: section.tips.join(' '),
    }));
  }, [page]);

  if (!page) {
    return null;
  }

  return (
    <GuideSheet
      eyebrow="Manuale CMS"
      title={page.title}
      intro={page.subtitle}
      icon={BookOpen}
      summary={page.sections.map((section) => section.label)}
      sections={sections}
      links={page.links}
    />
  );
}
