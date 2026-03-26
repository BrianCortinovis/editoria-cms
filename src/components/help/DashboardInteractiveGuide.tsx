'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  FileText,
  LayoutTemplate,
  Megaphone,
  Newspaper,
  PanelLeft,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';

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
};

function createGuidePage(
  title: string,
  subtitle: string,
  sections: GuideSection[]
): GuidePage {
  return { title, subtitle, sections };
}

const DASHBOARD_HOME_GUIDE = createGuidePage('Guida Interattiva Home CMS', 'Panoramica completa dei flussi del CMS e di come le aree lavorano insieme.', [
  {
    id: 'overview',
    label: 'Panoramica',
    title: 'Cos’è la Home del CMS',
    intro: 'La Home non è un modulo operativo singolo: è il punto di ingresso che ti orienta sullo stato generale del progetto.',
    bullets: [
      'Ti mostra il carico generale del tenant attivo: articoli, bozze, media, eventi e banner.',
      'Serve a capire dove entrare, non a sostituire i moduli specialistici.',
      'Da qui parti verso contenuti, redazione, layout, ADV, SEO e configurazione.',
    ],
    tips: [
      'Usala come cruscotto iniziale quando entri nel CMS.',
      'Se cerchi un’azione precisa, passa poi subito al modulo dedicato.',
    ],
    icon: Newspaper,
  },
  {
    id: 'workflow',
    label: 'Flusso',
    title: 'Flusso completo del CMS',
    intro: 'Il CMS lavora bene quando il flusso è chiaro: si produce contenuto, si struttura il sito, si rifinisce la distribuzione e poi si controlla tutto.',
    bullets: [
      'Produzione: Articoli, Redazione, Media, Eventi, Breaking News.',
      'Costruzione sito: Pagine, Layout, Editor, Menu, Footer.',
      'Distribuzione: SEO, Redirect, Newsletter, ADV.',
      'Controllo piattaforma: Utenti, Impostazioni, Tecnico, GDPR, Log.',
    ],
    tips: [
      'La Home è il posto giusto per ricordarti il flusso intero del prodotto.',
      'Se una redazione si perde, da qui ritrova la logica complessiva.',
    ],
    icon: Workflow,
  },
  {
    id: 'operations',
    label: 'Operatività',
    title: 'Come usarla ogni giorno',
    intro: 'La Home è utile se riduce tempo perso e chiarisce le priorità della giornata.',
    bullets: [
      'Controlla i numeri rapidi per capire il carico del tenant.',
      'Apri subito Nuovo Articolo, Layout Sito, Media o Breaking News dalle azioni rapide.',
      'Guarda gli ultimi articoli per capire cosa si sta muovendo davvero nella testata.',
    ],
    tips: [
      'Tienila come pagina iniziale del backoffice.',
      'Non allungare il flusso: dalla Home devi arrivare al modulo giusto in un click.',
    ],
    icon: Sparkles,
  },
  {
    id: 'security',
    label: 'Sicurezza',
    title: 'Cosa garantisce e cosa no',
    intro: 'La Home aggrega informazioni, ma i permessi reali continuano a vivere nei moduli operativi del CMS.',
    bullets: [
      'La pagina lavora sul tenant attivo del backoffice.',
      'Auth, ruoli e permessi continuano a essere verificati nelle pagine e nelle API vere.',
      'La Home deve guidare il lavoro, non creare scorciatoie insicure.',
    ],
    tips: [
      'Un buon pannello guida, ma non bypassa mai i controlli veri.',
    ],
    icon: ShieldCheck,
  },
]);

const PAGE_GUIDES: Array<{ match: (pathname: string) => boolean; page: GuidePage }> = [
  { match: (pathname) => pathname === '/dashboard', page: DASHBOARD_HOME_GUIDE },
  {
    match: (pathname) => pathname === '/dashboard/redazione',
    page: createGuidePage('Guida Interattiva Redazione', 'Hub operativo del desk giornalistico, con focus su workflow, priorità e automazioni.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Cos’è la pagina Redazione',
        intro: 'Redazione è l’hub operativo del CMS: non sostituisce i moduli, li organizza per il lavoro quotidiano della testata.',
        bullets: [
          'In alto vedi subito quante bozze, revisioni, approvazioni, programmati e breaking sono attivi.',
          'Le card rapide portano ai moduli veri: articoli, commenti, breaking, eventi e strumenti IA.',
          'La colonna “Da lavorare adesso” raccoglie i contenuti editoriali che richiedono attenzione immediata.',
        ],
        tips: ['Usala come schermata iniziale di desk.', 'Se una redazione entra ogni giorno qui, ha subito il quadro operativo.'],
        icon: Newspaper,
      },
      {
        id: 'workflow',
        label: 'Workflow',
        title: 'Come scorre il flusso editoriale',
        intro: 'La pagina riflette il flusso umano classico di una redazione: scrittura, revisione, approvazione, programmazione e pubblicazione.',
        bullets: [
          'Bozza: il redattore prepara il contenuto.',
          'In revisione: il pezzo passa al desk o al caporedattore.',
          'Approvato: il contenuto è pronto per uscire o per essere programmato.',
          'Pubblicato / Breaking: il pezzo è online e può alimentare homepage, ticker o slot editoriali.',
        ],
        tips: ['Le etichette stato vanno lette come priorità di lavoro, non solo come semplice archivio.', 'I programmati aiutano il desk a capire cosa sta per uscire senza aprire ogni articolo.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Cosa fare davvero ogni giorno',
        intro: 'La parte utile non è solo visualizzare dati: è sapere dove cliccare e in che ordine lavorare.',
        bullets: [
          'Nuovo articolo: apre subito la scrittura di un nuovo pezzo.',
          'Tutti gli articoli: controllo largo su archivio, filtri e stati.',
          'Moderazione commenti: presidio qualità e rischio spam.',
          'Desk breaking e Agenda eventi: gestione del contenuto caldo e programmato.',
        ],
        tips: ['Per un desk giornalistico, i collegamenti rapidi devono evitare passaggi inutili.', 'Se un modulo serve tutti i giorni, qui deve essere sempre a un click.'],
        icon: Sparkles,
      },
      {
        id: 'security',
        label: 'Sicurezza',
        title: 'Ruoli, responsabilità e sicurezza',
        intro: 'Redazione deve essere veloce, ma anche controllata: i moduli dietro restano soggetti a ruoli e permessi CMS.',
        bullets: [
          'Le query sono filtrate per tenant corrente.',
          'Le operazioni reali restano nei moduli CMS che applicano auth, ruoli e regole di accesso.',
          'La pagina Redazione non deve inventare bypass: deve fare da pannello di regia, non da scorciatoia insicura.',
        ],
        tips: ['Un caporedattore deve vedere tutto il flusso.', 'Un collaboratore dovrebbe avere accesso solo a ciò che gli serve davvero.'],
        icon: ShieldCheck,
      },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/desk',
    page: createGuidePage('Guida Interattiva Desk Giornalisti', 'Interfaccia mobile-first per reporter e collaboratori: raccolta materiali, bozza classica o articolo con IA e invio in revisione.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Cos’è il Desk Giornalisti',
        intro: 'Desk è la superficie semplice per chi deve produrre rapidamente un articolo senza entrare nel CMS completo.',
        bullets: [
          'Ogni progetto articolo raccoglie testo, foto, video e clip audio nello stesso posto.',
          'Il pannello è pensato per telefono, inviati e collaboratori: pochi campi, niente rumore.',
          'Lavora sugli articoli reali del CMS, quindi bozze, revisione e pubblicazione restano nel flusso editoriale vero.',
        ],
        tips: ['È la porta giusta per giornalisti e contributor.', 'Riduce il rischio di errori rispetto all’editor completo.'],
        icon: FileText,
      },
      {
        id: 'capture',
        label: 'Raccolta',
        title: 'Come funziona la raccolta dal telefono',
        intro: 'Il Desk nasce per permettere invio rapido dal campo: testo, foto, video e audio restano legati al progetto articolo.',
        bullets: [
          'Foto, video e audio vengono caricati nella media library e collegati alla bozza.',
          'La prima immagine utile può diventare copertina articolo.',
          'Il progetto resta aggiornabile: puoi tornare più volte e completare il pezzo in momenti diversi.',
        ],
        tips: ['Da mobile usa i pulsanti Foto, Video e Audio.', 'Apri sempre prima un progetto articolo, poi raccogli i materiali.'],
        icon: PanelLeft,
      },
      {
        id: 'ai',
        label: 'IA',
        title: 'Come lavora l’articolo con IA',
        intro: 'La modalità IA genera una prima bozza professionale, ma rispetta sempre l’istruzione esplicita scritta dal giornalista.',
        bullets: [
          'Preset e slider aiutano a dare forma al pezzo: tono, stile e lunghezza.',
          'Il prompt speciale ha priorità assoluta: se chiedi un tono specifico, quello deve prevalere.',
          'Input grezzi, fatti chiave e media allegati vengono usati come contesto per la generazione.',
        ],
        tips: ['Usa i preset per partire veloce.', 'Se vuoi un tono preciso, scrivilo chiaramente nel prompt speciale.'],
        icon: Sparkles,
      },
      {
        id: 'workflow',
        label: 'Workflow',
        title: 'Salvataggio, revisione e pubblicazione',
        intro: 'Il Desk non è un blocco separato: entra nel workflow reale della redazione.',
        bullets: [
          'Collaboratori e reporter salvano in bozza o inviano in revisione.',
          'Editor, caporedattori e admin possono pubblicare direttamente.',
          'Lo stato articolo resta quello vero del CMS, quindi il desk e la redazione leggono gli stessi contenuti.',
        ],
        tips: ['Se sei contributor, usa “Invia in revisione”.', 'Se sei editoriale senior, puoi chiudere il flusso da qui.'],
        icon: Workflow,
      },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/pagine',
    page: createGuidePage('Guida Interattiva Pagine', 'Gestione del ciclo di vita delle pagine: creazione, slug, struttura, preview e pubblicazione.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'A cosa serve questa pagina',
        intro: 'Qui governi le pagine del sito: homepage, landing, pagine statiche e pagine speciali del tenant.',
        bullets: [
          'Da qui crei nuove pagine e controlli stato, URL e metadati.',
          'Questo modulo è il punto giusto per il ciclo di vita pagina, non per i singoli articoli.',
          'Le azioni rapide collegano preview, layout, SEO ed editor.',
        ],
        tips: ['Usalo come anagrafica delle pagine del sito.', 'Qui decidi struttura e pubblicazione della pagina.'],
        icon: FileText,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Come scorre il lavoro su una pagina',
        intro: 'Una pagina professionale non nasce tutta in un punto solo: qui parte la scheda, poi passa a layout, editor e preview.',
        bullets: [
          'Crea o seleziona la pagina.',
          'Controlla titolo, slug e metadati precompilati.',
          'Apri Layout o Editor per costruzione e rifinitura.',
          'Fai preview, poi pubblica o tieni in bozza.',
        ],
        tips: ['Meglio partire da qui per tenere URL e metadata in ordine.', 'La coerenza della pagina si governa da questo modulo.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Cosa fai davvero qui',
        intro: 'Questa pagina ti aiuta a non disperdere il lavoro tra più moduli scollegati.',
        bullets: [
          'Duplica pagine, apri preview vere, apri online, passa a Layout e SEO.',
          'Verifica subito se la pagina è bozza o pubblicata.',
          'Usa gli strumenti rapidi per ridurre i passaggi tra moduli.',
        ],
        tips: ['Ottimo per homepage, landing commerciali e pagine istituzionali.', 'Meno adatto alla produzione giornalistica continua: per quella usa Articoli e Redazione.'],
        icon: Sparkles,
      },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/layout',
    page: createGuidePage('Guida Interattiva Layout', 'Template, confronto, anteprima e applicazione di strutture pagina reali sul CMS.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Cosa fa Layout',
        intro: 'Layout accelera la progettazione del sito: template, confronto e applicazione di schemi reali alle pagine.',
        bullets: [
          'Non è un mockup finto: applica blocchi veri del CMS.',
          'Ti fa ragionare per struttura, confronti e varianti prima di rifinire in editor.',
          'È perfetto per homepage, landing e schemi editoriali ripetibili.',
        ],
        tips: ['Usalo per accelerare.', 'Per il micro-dettaglio passa poi in Editor.'],
        icon: LayoutTemplate,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Come usarlo bene',
        intro: 'La sequenza corretta evita spreco di tempo e mantiene ordine tra modello e pagina reale.',
        bullets: [
          'Seleziona la pagina di destinazione.',
          'Scegli un template, costruiscilo o confrontalo.',
          'Applica il layout alla pagina reale.',
          'Apri la pagina nell’editor per rifiniture finali.',
        ],
        tips: ['Se lavori con testate o layout ricorrenti, qui guadagni molto tempo.', 'Tieni chiaro il confine: Layout struttura, Editor rifinisce.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Cosa controllare qui',
        intro: 'Il valore di Layout è far partire la pagina già intelligente, non vuota.',
        bullets: [
          'Controlla il template selezionato e il confronto con la pagina attuale.',
          'Usa i layout con ruoli assegnati per dare già una destinazione ai blocchi.',
          'Verifica sempre cosa stai applicando alla pagina reale.',
        ],
        tips: ['Ottimo per allineare redazione e design.', 'Evita di costruire da zero ogni homepage.'],
        icon: Sparkles,
      },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/templates',
    page: createGuidePage('Guida Interattiva Template', 'Libreria di template completi da consultare come base visuale per pagine, homepage, magazine, landing e schemi editoriali.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'A cosa serve la Libreria Template',
        intro: 'Questa pagina raccoglie template completi già impaginati come riferimento operativo: non sono blocchi isolati, ma schemi pagina interi da cui partire.',
        bullets: [
          'Copre stili molto diversi: newsroom, magazine, video, corporate, eventi, directory, longform e landing.',
          'Ogni card mostra già composizione, tono visivo e mix di moduli utili per quel tipo di progetto.',
          'Serve a velocizzare briefing, scelta direzione creativa e confronto con il cliente o la redazione.',
        ],
        tips: ['Usala come libreria di partenza prima di aprire Layout o Editor.', 'È ideale per allineare velocemente team, design e contenuti.'],
        icon: LayoutTemplate,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Come si usa bene nel CMS',
        intro: 'Il modo corretto è scegliere prima la struttura generale e solo dopo entrare nel dettaglio fine del singolo blocco.',
        bullets: [
          'Filtra per categoria in base al tipo di progetto.',
          'Apri il template che si avvicina di più al risultato desiderato.',
          'Porta la direzione visiva in Layout o nell’Editor per adattarla al tenant reale.',
        ],
        tips: ['Prima decidi il modello, poi rifinisci i dettagli.', 'Evita di costruire tutto da zero se un template copre già l’80% della struttura.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Cosa osservare nei template',
        intro: 'Il valore non è solo estetico: ogni template mostra un modo diverso di organizzare priorità, navigazione, gerarchie e spazi contenuto.',
        bullets: [
          'Guarda rapporto tra hero, griglie, sidebar, moduli video, ADV e footer.',
          'Confronta stili editoriali sobri contro layout più visuali o commerciali.',
          'Usa i template per capire se serve una homepage di flusso, una landing o una struttura magazine.',
        ],
        tips: ['Una buona libreria template aiuta anche chi non progetta layout tutti i giorni.', 'Usala come strumento decisionale, non solo come galleria bella.'],
        icon: Sparkles,
      },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/articoli' || pathname.startsWith('/dashboard/articoli/'),
    page: createGuidePage('Guida Interattiva Articoli', 'Produzione contenuti, stati editoriali, SEO articolo e pubblicazione del pezzo.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Il cuore della produzione contenuti',
        intro: 'Qui la redazione scrive, completa e governa i pezzi del sito.',
        bullets: [
          'Il modulo articoli copre scrittura, aggiornamento, stato e pubblicazione.',
          'Lavora in tandem con categorie, tag, commenti, breaking e media.',
          'È il centro della produzione giornalistica quotidiana.',
        ],
        tips: ['Per notizie e contenuti editoriali veri, questo è il modulo principale.', 'Per pagine statiche usa Pagine.'],
        icon: Newspaper,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Flusso editoriale del pezzo',
        intro: 'Un articolo professionale non è solo testo: passa per stati, metadati, media e distribuzione.',
        bullets: [
          'Crea il pezzo o aprilo in modifica.',
          'Completa titolo, corpo, media, tassonomie e SEO.',
          'Portalo in revisione o programmazione quando serve.',
          'Pubblicalo quando è pronto per andare online.',
        ],
        tips: ['Tieni chiaro il passaggio tra bozza, revisione, approvazione e pubblicazione.', 'Un buon flusso redazionale riduce errori di uscita.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Dettagli utili di questa pagina',
        intro: 'Qui la qualità editoriale si gioca nei dettagli: dati, immagini, metadati e stato corretto.',
        bullets: [
          'Controlla slug, sommario, categorie, copertina e campi SEO.',
          'Usa gli strumenti IA per accelerare, ma verifica sempre il risultato.',
          'Controlla se il pezzo va in homepage, breaking o programmazione.',
        ],
        tips: ['Questa pagina produce contenuti reali, quindi richiede rigore.', 'Ogni dato incompleto qui si riflette sul sito pubblico.'],
        icon: Sparkles,
      },
    ]),
  },
  {
    match: (pathname) => pathname === '/dashboard/media',
    page: createGuidePage('Guida Interattiva Media', 'Archivio file del tenant per immagini, asset e riuso ordinato nel CMS.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Perché esiste la Media Library',
        intro: 'La libreria media tiene in ordine file, immagini e risorse usate da articoli, pagine, ADV e moduli del sito.',
        bullets: [
          'È l’archivio centrale del tenant.',
          'Riduce copie sparse, URL manuali e riusi confusi.',
          'Migliora ordine, coerenza e controllo qualità.',
        ],
        tips: ['Meglio scegliere un media dal CMS che incollare URL a mano.', 'L’ordine qui aiuta tutto il progetto.'],
        icon: FileText,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Come usarla bene',
        intro: 'La Media Library va trattata come archivio professionale, non come cestino file.',
        bullets: [
          'Carica il file nel tenant corretto.',
          'Controlla formato, dimensioni e uso previsto.',
          'Riutilizzalo in articoli, pagine o banner senza duplicarlo.',
        ],
        tips: ['Una libreria ordinata riduce errori e sprechi.', 'Pensa ai media come patrimonio comune della testata.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Cosa controllare qui',
        intro: 'Qui conta la qualità del file quasi quanto il contenuto che rappresenta.',
        bullets: [
          'Evita file troppo pesanti o non adatti al web.',
          'Mantieni nomi e upload coerenti.',
          'Verifica che il file serva davvero a un uso editoriale o commerciale reale.',
        ],
        tips: ['Questa pagina impatta performance e ordine del progetto.', 'Non trattarla come semplice upload box.'],
        icon: Sparkles,
      },
    ]),
  },
  {
    match: (pathname) =>
      pathname === '/dashboard/categorie' ||
      pathname === '/dashboard/tag' ||
      pathname === '/dashboard/commenti' ||
      pathname === '/dashboard/breaking-news' ||
      pathname === '/dashboard/eventi',
    page: createGuidePage('Guida Interattiva Flusso Editoriale', 'Moduli che completano il lavoro redazionale: classificazione, priorità, agenda e moderazione.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Moduli di supporto alla redazione',
        intro: 'Queste pagine non sono “accessorie”: aiutano a organizzare, evidenziare e moderare il contenuto del sito.',
        bullets: [
          'Categorie e tag danno struttura all’archivio.',
          'Commenti e breaking governano la parte viva e urgente del sito pubblico.',
          'Eventi copre contenuti con logica di agenda e calendario.',
        ],
        tips: ['Un CMS professionale non vive solo di articoli: vive anche di ordine e priorità.', 'La qualità editoriale passa molto da qui.'],
        icon: Newspaper,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Dove si inseriscono nel lavoro',
        intro: 'Questi moduli si usano insieme alla produzione contenuti, non a parte.',
        bullets: [
          'Classifica correttamente i contenuti.',
          'Metti in evidenza ciò che merita priorità.',
          'Modera e controlla quello che arriva dal pubblico.',
        ],
        tips: ['Più questi moduli sono curati, più il sito appare professionale.', 'Sono fondamentali per un desk ordinato.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Cosa guardare in queste pagine',
        intro: 'Qui non costruisci layout, ma precisione editoriale.',
        bullets: [
          'Coerenza dei nomi e della struttura.',
          'Priorità corrette per breaking e contenuti caldi.',
          'Moderazione commenti e agenda sempre aggiornate.',
        ],
        tips: ['Ogni disordine qui si riflette sulla navigazione e sulla qualità del sito.', 'Sono moduli piccoli solo in apparenza.'],
        icon: Sparkles,
      },
    ]),
  },
  {
    match: (pathname) =>
      pathname === '/dashboard/banner' ||
      pathname === '/dashboard/inserzionisti' ||
      pathname === '/dashboard/adv' ||
      pathname === '/dashboard/contabilita',
    page: createGuidePage('Guida Interattiva ADV e Commerciale', 'Parte pubblicitaria e commerciale del CMS: clienti, spazi, performance e ordine operativo.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'La parte commerciale del CMS',
        intro: 'Questa area governa la monetizzazione del progetto: banner, clienti, posizioni e controllo economico.',
        bullets: [
          'Separa bene area editoriale e area commerciale.',
          'Aiuta a mantenere ordine su campagne, spazi e inserzionisti.',
          'È centrale per un prodotto editoriale sostenibile.',
        ],
        tips: ['L’ADV deve essere gestita bene quanto i contenuti.', 'Ordine commerciale = meno errori operativi.'],
        icon: Megaphone,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Come si lavora qui',
        intro: 'Il flusso corretto è cliente, spazio, creatività, misurazione e controllo.',
        bullets: [
          'Crea o aggiorna cliente/inserzionista.',
          'Prepara banner e posizione.',
          'Controlla dati e stato campagna.',
          'Verifica ritorno, delivery e contabilità.',
        ],
        tips: ['Tieni sempre distinta la logica commerciale da quella redazionale.', 'Meglio pochi dati chiari che una gestione confusa.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Dettagli pratici',
        intro: 'L’obiettivo qui è evitare caos su materiali, posizioni e numeri.',
        bullets: [
          'Controlla device, posizione, stato e resa dei banner.',
          'Mantieni ordinati clienti e materiali collegati.',
          'Usa questa area per il lato business, non per impaginare il sito.',
        ],
        tips: ['Una buona ADV nel CMS è ordinata, misurabile e separata dal contenuto.', 'È un’area da trattare con precisione operativa.'],
        icon: Sparkles,
      },
    ]),
  },
  {
    match: (pathname) =>
      pathname === '/dashboard/seo' ||
      pathname === '/dashboard/redirect' ||
      pathname === '/dashboard/newsletter',
    page: createGuidePage('Guida Interattiva Distribuzione e Crescita', 'Visibilità, continuità URL e distribuzione dei contenuti verso pubblico e utenti iscritti.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'Dove finisce il lavoro editoriale',
        intro: 'Questi moduli aiutano il contenuto a vivere meglio online: essere trovato, mantenere continuità e raggiungere il pubblico.',
        bullets: [
          'SEO migliora reperibilità e qualità di uscita.',
          'Redirect protegge la continuità delle URL.',
          'Newsletter segue rilancio e fidelizzazione.',
        ],
        tips: ['Non considerare chiuso un contenuto senza pensare anche a questa fase.', 'Qui si gioca molta qualità del prodotto finale.'],
        icon: Sparkles,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Come usare questi moduli',
        intro: 'Dopo la produzione, il contenuto va rifinito e distribuito bene.',
        bullets: [
          'Ottimizza metadata e resa SEO.',
          'Controlla URL legacy e redirect se il sito evolve.',
          'Usa newsletter e strumenti di distribuzione per estendere la portata dei contenuti.',
        ],
        tips: ['La distribuzione è parte del lavoro, non un extra finale.', 'Queste pagine completano il valore del contenuto.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Cosa controllare qui',
        intro: 'In queste pagine vanno letti i dettagli che fanno la differenza nel medio periodo.',
        bullets: [
          'Meta title, description, OG e copertura contenuti.',
          'Redirect corretti per pagine migrate o URL storiche.',
          'Ordine e qualità delle uscite newsletter.',
        ],
        tips: ['Sono moduli di rifinitura professionale.', 'Usali con continuità, non solo quando c’è un problema.'],
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
      pathname === '/dashboard/form',
    page: createGuidePage('Guida Interattiva Configurazione e Controllo', 'Area sistemica del CMS: team, moduli, compliance, strumenti tecnici e configurazione della piattaforma.', [
      {
        id: 'overview',
        label: 'Panoramica',
        title: 'La parte infrastrutturale del CMS',
        intro: 'Qui non costruisci il contenuto finale: governi il contesto in cui il CMS lavora.',
        bullets: [
          'Include utenti, testata, impostazioni, moduli, log, IA, GDPR, migrazioni e strumenti tecnici.',
          'Queste pagine hanno impatto trasversale sul progetto.',
          'Sono moduli da usare con più consapevolezza che fretta.',
        ],
        tips: ['Qui si lavora sulla piattaforma, non solo sul contenuto.', 'Le modifiche fatte in quest’area spesso si riflettono su tutto il CMS.'],
        icon: Settings2,
      },
      {
        id: 'workflow',
        label: 'Flusso',
        title: 'Come leggere questa area',
        intro: 'La logica corretta è configurare, verificare, tracciare e poi usare il CMS in modo più stabile.',
        bullets: [
          'Configura tenant, ruoli o moduli.',
          'Controlla compliance, log o stato tecnico quando serve.',
          'Usa strumenti IA e migrazioni in modo controllato, non impulsivo.',
        ],
        tips: ['Questa area richiede precisione.', 'È il posto giusto per rendere il CMS più affidabile e sostenibile.'],
        icon: Workflow,
      },
      {
        id: 'operations',
        label: 'Operatività',
        title: 'Cosa verificare qui',
        intro: 'Il valore di questa area è mantenere ordine e governabilità della piattaforma.',
        bullets: [
          'Ruoli corretti, configurazioni coerenti, moduli attivati con criterio.',
          'Log e pannelli tecnici usati come strumenti di controllo, non come scorciatoie rischiose.',
          'GDPR e migrazioni trattati come aspetti centrali, non accessori.',
        ],
        tips: ['Usa questa zona quando devi amministrare il CMS come prodotto.', 'È l’area meno “editoriale”, ma tra le più importanti.'],
        icon: ShieldCheck,
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
  const [sectionOpen, setSectionOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [active, setActive] = useState<string>('overview');

  const current = useMemo(() => {
    if (!page) return null;
    return page.sections.find((section) => section.id === active) || page.sections[0];
  }, [active, page]);

  if (!page || !current) return null;

  const Icon = current.icon;

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
    >
      <button
        type="button"
        onClick={() => setSectionOpen((value) => !value)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
          >
            <BookOpen size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>
              {page.title}
            </h3>
            <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--c-text-2)' }}>
              {page.subtitle}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 shrink-0">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
          >
            {sectionOpen ? 'Chiudi guida' : 'Apri guida'}
          </span>
          <ChevronDown
            size={18}
            className={sectionOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
            style={{ color: 'var(--c-text-3)' }}
          />
        </div>
      </button>

      {sectionOpen ? (
        <div className="p-5 pt-0 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
          <aside
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--c-border)' }}
            >
              <div className="flex items-center gap-2">
                <PanelLeft size={15} style={{ color: 'var(--c-accent)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                  Sommario guida
                </h4>
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--c-text-3)' }}>
                {page.sections.length} sezioni
              </span>
            </div>
            <div className="p-3 space-y-2">
              {page.sections.map((section, index) => {
                const SectionIcon = section.icon;
                const activeItem = section.id === current.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      if (section.id === current.id) {
                        setExpanded((value) => !value);
                        return;
                      }
                      setActive(section.id);
                      setExpanded(true);
                    }}
                    className="w-full text-left rounded-2xl px-3 py-3 transition"
                    style={
                      activeItem
                        ? { background: 'var(--c-accent-soft)', border: '1px solid rgba(14,165,233,0.15)' }
                        : { background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={activeItem ? { background: 'rgba(255,255,255,0.75)', color: 'var(--c-accent)' } : { background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}
                      >
                        <SectionIcon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: activeItem ? 'var(--c-accent)' : 'var(--c-text-3)' }}>
                            Step {index + 1}
                          </span>
                          {activeItem ? (
                            <ChevronDown
                              size={14}
                              className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                              style={{ color: 'var(--c-accent)' }}
                            />
                          ) : null}
                        </div>
                        <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--c-text-0)' }}>
                          {section.label}
                        </div>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: activeItem ? 'var(--c-text-1)' : 'var(--c-text-2)' }}>
                          {section.intro}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}
          >
            <div
              className="px-5 py-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
              style={{ borderBottom: '1px solid var(--c-border)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold" style={{ color: 'var(--c-text-0)' }}>
                    {current.title}
                  </h4>
                  <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--c-text-2)' }}>
                    {current.intro}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition"
                  style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                >
                  <ChevronDown
                    size={14}
                    className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                  />
                  {expanded ? 'Chiudi spiegazione' : 'Apri spiegazione'}
                </button>
              </div>
            </div>

            {expanded ? (
              <div className="p-5 space-y-4">
                <div className="rounded-2xl p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} style={{ color: 'var(--c-accent)' }} />
                    <h5 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                      Spiegazione della pagina
                    </h5>
                  </div>
                  <div className="space-y-3">
                    {current.bullets.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl px-4 py-3 text-sm"
                        style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
                  <div className="rounded-2xl p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} style={{ color: 'var(--c-accent)' }} />
                      <h5 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                        Consigli pratici
                      </h5>
                    </div>
                    <div className="space-y-2">
                      {current.tips.map((tip) => (
                        <div key={tip} className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}>
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.10), rgba(59,130,246,0.05))', border: '1px solid var(--c-border)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck size={16} style={{ color: 'var(--c-accent)' }} />
                      <h5 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                        Lettura veloce
                      </h5>
                    </div>
                    <div className="space-y-2 text-sm" style={{ color: 'var(--c-text-1)' }}>
                      <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                        Capisci prima il ruolo della pagina nel flusso generale del CMS.
                      </div>
                      <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                        Usa il modulo per il suo scopo preciso, senza mescolare funzioni di altre aree.
                      </div>
                      <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                        Ricorda che auth, tenant e ruoli restano comunque governati dal CMS.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="rounded-2xl px-4 py-4 text-sm" style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}>
                  Sezione richiusa. Dal sommario a sinistra puoi cambiare argomento, oppure riaprire la spiegazione quando ti serve.
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
