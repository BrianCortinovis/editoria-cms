# Cloudflare Go-Live

Questa checklist serve per mettere il CMS dietro Cloudflare in modo corretto, senza rompere:
- sito pubblico
- CMS backoffice
- API pubbliche
- canale dev/API esterno con bearer token

## 1. DNS e Proxy

- mettere il dominio pubblico dietro Cloudflare proxy
- lasciare TLS `Full (strict)`
- forzare HTTPS
- attivare HTTP/2 e HTTP/3

## 2. Caching

- cache aggressiva solo sulle pagine pubbliche:
  - `/site/*`
  - `/robots.txt`
  - `/sitemap.xml`
- non cacheare:
  - `/dashboard/*`
  - `/auth/*`
  - `/api/builder/*`
  - `/api/v1/commands`
  - `/api/ai/*`
- usare `Cache Everything` solo dove hai HTML pubblico stabile

## 3. Bot e Challenge

- attivare Bot Fight Mode o equivalente
- challenge su:
  - `/api/v1/forms/*`
  - `/api/v1/articles/*/comments`
  - `/api/v1/search`
- escludere da challenge i percorsi dev/API con bearer token se usati da tool esterni

## 4. Rate Limiting Edge

- impostare regole rate limit Cloudflare per:
  - `POST /api/v1/forms/*`
  - `POST /api/v1/articles/*/comments`
  - `GET /api/v1/search`
  - `POST /api/layout/import-from-url`
- mantenere anche il rate limit applicativo, non sostituirlo

## 5. WAF Rules

- bloccare querystring anomale troppo lunghe
- bloccare user-agent vuoti o chiaramente malevoli
- bloccare metodi non usati verso API pubbliche
- limitare request body troppo grandi su form/commenti/search

## 6. IP Reale

L'app legge già:
- `cf-connecting-ip`
- `true-client-ip`
- `x-forwarded-for`
- `x-real-ip`

Quindi il rate limit funziona correttamente anche dietro Cloudflare.

## 7. Turnstile

Configurare:
- `TURNSTILE_SECRET_KEY`

Applicato già a:
- form pubblici
- commenti pubblici

## 8. Rate Limit Distribuito

Configurare:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Se questi env non ci sono, il progetto usa fallback in-memory.
Per produzione con più istanze, usare sempre Upstash/Redis.

## 9. Origin Protection

Se possibile:
- limitare l'accesso diretto all'origine
- permettere traffico solo da Cloudflare

## 10. Monitoraggio

Monitorare:
- 4xx/5xx
- picchi search/forms/comments
- consumo AI
- spike di richieste per tenant

## 11. Verifica finale

Prima del go-live verificare:
- login CMS
- preview editor
- pubblicazione pagina
- commenti
- form
- ricerca
- API pubbliche sito
- canale dev con bearer token
