# AI Theme Brief

Usa questo file come istruzione iniziale quando devi progettare o generare un sito custom che dovra poi essere collegato a questo CMS.

Obiettivo:
- costruire un frontend custom libero nel design
- mantenerlo facile da collegare al CMS
- rendere riconoscibili a colpo d'occhio route, sezioni, datasource e ruoli
- evitare refactor pesanti dopo

## Modalita corretta

Preferire sempre:
- `theme-driven` oppure `hybrid-theme`

Non dare per scontato:
- che tutto debba essere renderizzato dal builder visuale
- che il CMS debba imporre il design del sito

Regola base:
- il sito pubblico puo essere totalmente custom
- il CMS deve restare la sorgente dati e controllo editoriale

## Cosa deve restare agganciabile al CMS

Il tema custom deve essere predisposto per collegare facilmente:
- config sito
- logo
- menu
- footer
- homepage
- pagine CMS
- articoli
- categorie
- ricerca
- breaking news
- banner
- newsletter
- SEO base

## Route standard da rispettare

Il sito custom deve prevedere queste route logiche:

- homepage: `/site/{tenantSlug}`
- pagina CMS: `/site/{tenantSlug}/{slug}`
- articolo: `/site/{tenantSlug}/articolo/{articleSlug}`
- categoria: `/site/{tenantSlug}/categoria/{categorySlug}`
- ricerca: `/site/{tenantSlug}/search`

Se il progetto usa un router diverso, mantenere comunque questa mappatura logica.

## API CMS da usare

Prima di generare il sito leggere sempre:

- `GET /api/v1/theme-contract?tenant={tenantSlug}`
- `GET /api/v1/site?tenant={tenantSlug}`
- `GET /api/v1/pages?tenant={tenantSlug}`
- `GET /api/v1/layout?tenant={tenantSlug}&page=homepage`
- `GET /api/v1/articles?tenant={tenantSlug}`
- `GET /api/v1/categories?tenant={tenantSlug}`
- `GET /api/v1/banners?tenant={tenantSlug}&position={position}`
- `GET /api/v1/breaking-news?tenant={tenantSlug}`
- `GET /api/v1/search?tenant={tenantSlug}&q={query}`
- `GET /api/v1/commands`

## Regola chiave per i contenuti

Non hardcodare nei componenti finali:
- titoli reali articoli
- card articolo statiche definitive
- menu finali
- footer definitivo
- ticker breaking definitivo
- banner finali

Puoi usare placeholder durante la progettazione, ma il codice finale deve essere predisposto a sostituirli facilmente con dati CMS.

## Section roles da usare

Ogni sezione importante del sito deve essere pensata come uno di questi ruoli:

- `hero`
- `breaking`
- `content-grid`
- `sidebar`
- `footer`
- `header`
- `article-body`
- `category-feed`
- `banner-row`
- `newsletter`
- `search`

## Attributi consigliati nel DOM

Quando costruisci il sito, usa attributi riconoscibili per aiutare il collegamento CMS.

Usa dove possibile:

- `data-cms-role="hero"`
- `data-cms-role="content-grid"`
- `data-cms-role="sidebar"`
- `data-cms-role="footer"`
- `data-cms-source="layout-homepage"`
- `data-cms-source="site-config"`
- `data-cms-source="articles"`
- `data-cms-slot="homepage-lead"`
- `data-cms-slot="homepage-sidebar"`
- `data-cms-slot="banner-header"`
- `data-cms-slot="breaking-primary"`

Questi attributi non sono obbligatori per il browser, ma sono molto utili per:
- IA
- bridge JS
- debug
- collegamento CMS successivo

## Convenzioni consigliate per i componenti

Usare nomi chiari e prevedibili:

- `SiteHeader`
- `PrimaryNav`
- `BreakingBar`
- `HomepageHero`
- `HomepageLeadGrid`
- `SidebarRail`
- `BannerRow`
- `ArticleCard`
- `CategoryFeed`
- `SiteFooter`
- `NewsletterModule`
- `SearchModule`

Evitare componenti con nomi vaghi tipo:
- `BlockA`
- `SectionOne`
- `CustomThing`
- `WidgetFinal`

## Compatibilita builder / CMS

Il sito custom deve poter convivere con il CMS cosi:

- homepage e pagine core: custom
- landing speciali: builder opzionale
- contenuti editoriali: CMS
- menu/footer/config: CMS
- banner/breaking/newsletter: CMS

Quindi il tema non deve dipendere dal builder per esistere.

## Struttura consigliata del frontend

Preferire una struttura del genere:

- `src/theme/site-header.*`
- `src/theme/site-footer.*`
- `src/theme/homepage-hero.*`
- `src/theme/homepage-grid.*`
- `src/theme/banner-row.*`
- `src/theme/article-card.*`
- `src/theme/category-feed.*`
- `src/theme/search-module.*`
- `src/theme/cms-bridge.*`
- `src/theme/theme-contract.local.json` opzionale

## Bridge CMS consigliato

Se il sito e statico o molto custom, usare un bridge dedicato:

- legge config sito
- legge homepage layout
- legge articoli
- legge banner
- legge breaking
- aggiorna il DOM o i componenti

Nome consigliato:

- `cms-bridge.js`
- oppure `theme-cms-bridge.ts`

## Cosa deve fare il bridge

Minimo richiesto:

- caricare `site-config`
- caricare `layout-homepage`
- caricare `articles`
- caricare `banners`
- caricare `breaking-news`
- popolare le sezioni del sito

Il bridge non deve:

- contenere logica grafica complessa del tema
- decidere l'identita visuale
- duplicare il CMS

## SEO e meta

Il sito custom deve essere predisposto a ricevere dal CMS:

- title
- description
- canonical
- og image
- robots

Non fissare questi valori in modo rigido se la pagina e CMS-driven.

## Banner e righe ADV

Quando disegni aree banner, prevedi:

- riga orizzontale scorrevole
- sidebar banner
- in-article banner
- footer banner

Le aree devono essere in grado di accettare:

- immagine
- HTML banner
- link esterno
- assenza temporanea banner senza rompere il layout

## Categorie e archivi

Le pagine categoria devono essere progettate per accettare:

- hero categoria opzionale
- lista articoli categoria
- eventuale sidebar
- banner categoria
- SEO categoria

## Articolo

La pagina articolo deve essere progettata per accettare:

- header articolo
- immagine cover
- metadati
- corpo HTML CMS
- correlati
- banner in-article
- newsletter inline
- commenti opzionali

## Evitare questi errori

Non fare:

- layout tutto basato su contenuti statici impossibili da sostituire
- classi o ID incomprensibili
- logiche sparse in 10 file senza mappa chiara
- route inventate senza corrispondenza col CMS
- mapping categorie scritto in modo opaco e hardcoded ovunque
- dipendenza totale da un solo script gigante senza ruoli sezione chiari

## Prompt operativo per un altro tool IA

Quando usi un altro tool IA per creare il sito, dagli anche questa istruzione:

`Costruisci un frontend custom compatibile con il CMS editoriale. Prima leggi AI_THEME_BRIEF.md, poi usa le route e i datasource standard del CMS. Mantieni il design totalmente custom ma rendi riconoscibili header, footer, hero, griglie contenuto, sidebar, banner, breaking, newsletter, articolo e categoria. Non hardcodare il contenuto finale: predisponi il sito per essere collegato facilmente al CMS tramite config sito, homepage layout, articoli, categorie, banner e breaking news.`

## Checklist finale

Prima di considerare il sito pronto per il collegamento CMS, verifica:

- il layout e custom e non dipende dal builder
- le route logiche corrispondono al CMS
- esiste una mappa chiara delle sezioni
- hero, grid, sidebar, footer e banner sono riconoscibili
- menu e footer sono sostituibili con dati CMS
- homepage puo essere popolata da `layout`
- articolo puo essere popolato da `articles`
- categoria puo essere popolata da `categories`
- breaking e banner possono essere agganciati senza refactor
- SEO e predisposto a ricevere meta dinamici
- il codice non e pieno di contenuti hardcoded irremovibili

## File da leggere sempre prima di generare un tema

Ordine consigliato:

1. `AI_THEME_BRIEF.md`
2. `theme.contract.example.json`
3. `GET /api/v1/theme-contract?tenant={tenantSlug}`
4. `GET /api/v1/commands`

Se segui queste regole, il sito custom restera molto piu semplice da collegare a questo CMS.
