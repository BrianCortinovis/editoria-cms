# Custom Theme Workflow

Questo progetto puo essere usato in modalita `theme-driven` o `hybrid-theme` senza dipendere dal renderer visuale del builder per tutto il sito.

## Idea

Il CMS resta il motore dati:

- tenant
- site config
- menu
- footer
- homepage layout slots
- pagine pubblicate
- articoli
- categorie
- ricerca
- SEO

Il frontend custom resta il motore di rendering:

- homepage
- pagina articolo
- pagina categoria
- pagina ricerca
- componenti visuali proprietari

## Contract da leggere prima di sviluppare

1. `theme.contract.json` nel progetto del sito, se esiste
2. `theme.contract.example.json` come base
3. `GET /api/v1/theme-contract?tenant={tenantSlug}`
4. `GET /api/v1/commands` per discovery tecnico

## Flusso consigliato per Codex / VSCode

1. Leggere il contract del tema.
2. Scoprire i datasource del tenant.
3. Generare il sito custom con componenti mappati alle section roles.
4. Usare le API CMS ufficiali invece di hardcodare contenuti.
5. Lasciare il builder come supporto per pagine speciali, non come vincolo per tutto il tema.

## Modalita consigliata

- `theme-driven`: per siti molto brandizzati
- `hybrid-theme`: consigliata per questo CMS

## API chiave

- `GET /api/v1/theme-contract?tenant={tenantSlug}`
- `GET /api/v1/site?tenant={tenantSlug}`
- `GET /api/v1/pages?tenant={tenantSlug}`
- `GET /api/v1/layout?tenant={tenantSlug}&page=homepage`
- `GET /api/v1/articles?tenant={tenantSlug}`
- `GET /api/v1/commands`

## Perche funziona bene

- il sito puo essere totalmente custom
- il CMS continua a gestire contenuti e workflow
- il tema nasce gia compatibile
- si puo riusare lo stesso approccio per giornali, hotel, scuole e altri verticali
