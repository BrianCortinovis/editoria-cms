# Desktop Editor <-> Cloud CMS Bridge

## Obiettivo

Separare in modo netto:

- `Desktop Editor`: crea layout, struttura, componenti, linking e SEO di base del frontend custom.
- `Cloud CMS`: governa contenuti, media, tassonomie, menu, footer, slot rules, publish e source of truth online.

L'editor desktop non deve piu` vivere online nel CMS.

## Principio operativo

Il desktop editor non scrive liberamente nel database del CMS.

Il desktop editor lavora contro un contratto:

- route native del CMS
- pattern di linking interni
- datasource pubblici e compatibili
- menu e footer governati dal CMS
- metadati SEO governati dal CMS pubblicato

## File / endpoint da usare

- Theme contract pubblico:
  - `/api/v1/theme-contract?tenant={tenantSlug}`
- Site config pubblico:
  - `/api/v1/site?tenant={tenantSlug}`
- Site bridge pack autenticato:
  - `/api/v1/bridge/site-pack?tenant={tenantSlug}`

## Cosa contiene il Site Bridge Pack

- tenant corrente
- route native del runtime pubblico
- API pubbliche da usare
- pagine CMS pubblicate
- categorie
- slot editoriali e regole contenuto
- navigation e footer
- convenzioni SEO
- istruzioni operative per IA builder

## Regole tecniche

1. Le pagine custom devono linkare le pagine CMS con gli slug reali pubblicati.
2. Gli articoli devono usare `/articolo/{articleSlug}`.
3. Le categorie devono usare `/categoria/{categorySlug}`.
4. Menu e footer vanno letti dal CMS se il progetto vuole compatibilita` nativa.
5. Canonical, meta title e meta description finali restano governati dal CMS.
6. Il desktop editor puo` generare il sito ottimizzato, ma il CMS resta il source of truth online.

## UX target

### Nel CMS

- nessun editor visuale online
- accesso rapido a contenuti, pagine, media, categorie, slot rules, SEO
- area tecnica che espone bridge pack e contract

### Nel Desktop Editor

- import bridge pack
- generazione sito custom gia` allineata al linking CMS
- export/sync verso runtime o deploy custom
- AI locale che riceve il bridge pack come contesto obbligatorio

## Uso consigliato con IA

Prima di generare un sito custom, dare all'IA:

1. `theme-contract`
2. `site bridge pack`
3. eventuali linee guida visuali del brand
4. obiettivo del sito

L'IA deve costruire il frontend rispettando route, linking, datasource, menu, footer e SEO definiti dal bridge.
