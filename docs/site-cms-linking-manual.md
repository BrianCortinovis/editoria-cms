# Collegamento Sito <-> CMS

## Obiettivo

Usare lo stesso Cloud CMS sia per:

- siti generati dal Desktop Builder
- siti custom sviluppati a mano

senza rompere compatibilita`, linking, SEO o publish.

## Regola base

Il CMS e` il `write model`.

Il sito pubblico non legge direttamente Supabase.

Il sito pubblico legge:

- `published layer`
- API pubbliche compatibili
- bridge pack

## Due casi supportati

### 1. Sito generato dal Desktop Builder

Il Desktop Builder:

1. importa il `site pack`
2. costruisce layout, homepage, componenti e struttura
3. salva mapping locale tra componenti frontend e datasource CMS
4. esporta il sito
5. il sito esportato legge il layer pubblicato del CMS

In questo caso il builder non governa contenuti editoriali live.

Governa:

- struttura
- resa grafica
- componenti
- linking frontend

Il CMS continua a governare:

- articoli
- categorie
- tag
- menu
- footer
- settings
- SEO pubblicato
- publish

### 2. Sito custom

Il tecnico non usa il Desktop Builder, ma usa gli stessi contract:

- `site pack`
- `theme contract`
- `published JSON`

Quindi il sito custom deve rispettare gli stessi pattern URL e la stessa logica dati.

## Pattern URL nativi

- homepage: `/`
- articolo: `/articolo/{articleSlug}`
- categoria: `/categoria/{categorySlug}`
- pagina CMS: `/{pageSlug}`
- search: `/search`

Il frontend non deve inventare URL diversi se vuole restare nativamente compatibile col CMS.

## Datasource corretti

I componenti del frontend devono collegarsi a questi datasource, non al DB:

- `settings.json`
- `menu.json`
- `homepage.json`
- `pages/{slug}.json`
- `articles/{slug}.json`
- `categories/{slug}.json`
- `posts.json`
- `tags.json`
- `events.json`
- `breaking-news.json`
- `banners.json`
- `manifest.json`

## Come linkano i componenti al gestionale

Ogni componente costruito nel builder o nel sito custom deve puntare a una di queste entita`:

- `article`
- `category`
- `page`
- `listing`
- `menu`
- `settings`
- `layout`

Quindi il mapping corretto non e`:

- `query SQL`
- `tabella Supabase`
- `chiave privata`

ma:

- `route pubblica`
- `documento pubblicato`
- `contract del bridge`

## Esempio pratico

### Hero homepage

Può leggere:

- homepage pubblicata
- oppure layout homepage pubblicato

### Card articolo

Deve linkare:

- `/articolo/{slug}`

e leggere dati da:

- `articles/{slug}.json`
- oppure `posts.json` / `homepage.json`

### Menu

Deve leggere:

- `menu.json`

### Footer

Deve leggere:

- `menu.json`
- oppure `settings.json` se il progetto lo prevede

## Cosa non fare

- query live dal frontend pubblico verso Supabase
- key Supabase nel client del sito
- URL custom non allineati al CMS
- menu hardcoded se il CMS lo governa
- footer hardcoded se il CMS lo governa
- SEO locale che ignora il CMS pubblicato

## Sintesi finale

- `CMS`: source of truth editoriale
- `Desktop Builder`: struttura e resa frontend
- `Sito custom`: alternativa al builder ma sugli stessi contract
- `Published layer`: ponte stabile tra CMS e sito live
