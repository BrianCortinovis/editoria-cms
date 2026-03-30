# Platform App Foundation

## Obiettivo

Questo step introduce la base architetturale della Platform App senza rompere il CMS esistente.

Nel repository attuale:

- `tenants` e `user_tenants` sono gia` il perimetro di isolamento del CMS
- il CMS vive oggi soprattutto sotto `/dashboard`
- il public site viene risolto con slug (`/site/[tenant]`)

Per evitare una migrazione distruttiva, la platform app viene aggiunta come layer superiore:

- `tenant` resta il boundary di sicurezza e il riferimento del CMS
- `site` diventa l'entita` platform-facing che rappresenta il sito creato dall'utente
- nel MVP `site` e `tenant` sono in rapporto `1:1`
- in futuro si potra` evolvere a `1 tenant -> N sites` solo se servira` davvero

## Architettura Logica

### 1. Public / Marketing

- `/`
- `/pricing`
- `/login`
- `/register`
- `/forgot-password`
- `/verify-email`

Responsabilita`:

- acquisition
- auth entry points
- pricing e funnel

### 2. Platform App

Prefisso consigliato: `/app`

- `/app`
- `/app/onboarding`
- `/app/sites`
- `/app/sites/new`
- `/app/sites/[siteId]`
- `/app/sites/[siteId]/domains`
- `/app/sites/[siteId]/settings`
- `/app/sites/[siteId]/members`
- `/app/profile`
- `/app/security`
- `/app/notifications`
- `/app/billing`

Responsabilita`:

- account utente
- creazione siti
- ownership e memberships
- domini
- bridge sicuro verso il CMS

### 3. CMS del singolo sito

Transizione consigliata:

- mantenere per ora il CMS su `/dashboard`
- introdurre un bridge server-side da `/app/sites/[siteId]/open`
- il bridge verifica membership e imposta il contesto sito corrente in modo sicuro

Evoluzione possibile:

- `/cms/[siteSlug]/*` come namespace dedicato
- redirect automatico dal bridge verso il CMS namespaced

### 4. Superadmin

Prefisso consigliato: `/admin`

- `/admin`
- `/admin/users`
- `/admin/tenants`
- `/admin/sites`
- `/admin/domains`
- `/admin/audit`
- `/admin/system`

Non va mischiato con le permission tenant-level.

## Sitemap Operativa

### Public

- `/`
- `/pricing`
- `/login`
- `/register`
- `/forgot-password`
- `/verify-email`

### Platform

- `/app`
- `/app/onboarding`
- `/app/sites`
- `/app/sites/new`
- `/app/sites/[siteId]`
- `/app/sites/[siteId]/domains`
- `/app/sites/[siteId]/settings/general`
- `/app/sites/[siteId]/settings/domains`
- `/app/sites/[siteId]/settings/members`
- `/app/profile`
- `/app/security`
- `/app/notifications`
- `/app/billing`

### CMS

- `/app/sites/[siteId]/open`
- `/dashboard`
- `/dashboard/...`

### Superadmin

- `/admin`
- `/admin/users`
- `/admin/sites`
- `/admin/domains`
- `/admin/audit`

## Struttura Cartelle Consigliata

```text
src/
  app/
    (marketing)/
      page.tsx
      pricing/page.tsx
    (auth)/
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      verify-email/page.tsx
    (platform)/
      app/
        page.tsx
        onboarding/page.tsx
        sites/page.tsx
        sites/new/page.tsx
        sites/[siteId]/page.tsx
        sites/[siteId]/domains/page.tsx
        sites/[siteId]/open/route.ts
        profile/page.tsx
        security/page.tsx
        notifications/page.tsx
        billing/page.tsx
    (cms)/
      dashboard/
        ...
    (superadmin)/
      admin/
        ...
  lib/
    platform/
      types.ts
      authorization.ts
      cms-bridge.ts
      domain/
        provider.ts
        resolution.ts
      repositories/
      services/
      validations/
```

## Modello Dati

### Entita` chiave

- `profiles`: profilo platform-level legato a `auth.users`
- `tenants`: boundary di sicurezza usato dal CMS
- `sites`: record platform-facing in rapporto `1:1` con `tenants`
- `tenant_memberships`: autorizzazioni platform-level su sito/tenant
- `site_domains`: domini di default e custom
- `site_settings_platform`: configurazione platform-level del sito
- `subscriptions`
- `usage_metrics`
- `notifications`
- `audit_logs`
- `active_sessions`
- `domain_verification_events`

### Relazioni principali

- `auth.users (1) -> (1) profiles`
- `tenants (1) -> (1) sites`
- `sites (1) -> (N) site_domains`
- `sites (1) -> (N) tenant_memberships`
- `auth.users (1) -> (N) tenant_memberships`
- `sites (1) -> (1) site_settings_platform`

### Nota importante sul naming

Il requisito usa sia `tenant` sia `site`. In questo repo conviene mantenerli entrambi:

- `tenant_id` = boundary di isolamento dati del CMS
- `site_id` = identita` del sito nel layer platform

La risoluzione host deve sempre produrre:

- `host -> site_id -> tenant_id`

## Authorization Strategy

### Principi

- nessun `tenant_id` trusted dal client
- membership sempre verificata lato server
- per operazioni sensibili usare Server Actions o Route Handlers server-side
- RLS come guardrail di database, non come unico meccanismo applicativo
- service role solo in servizi orchestrati e auditati

### Ruoli

Platform roles:

- `owner`
- `admin`
- `editor`
- `viewer`

Superadmin resta separato e non vive nelle membership tenant-level.

### Regole minime

- `viewer`: read-only platform access, puo` aprire il CMS solo se il CMS supporta lettura
- `editor`: puo` aprire il CMS e gestire contenuti
- `admin`: puo` gestire impostazioni sito, domini, membri
- `owner`: puo` tutto sul sito, incluso archive/delete e billing

### Flusso create site

La creazione sito va fatta in una singola transazione server-side:

1. validazione input
2. creazione `tenant`
3. creazione `site`
4. creazione `tenant_membership` con ruolo `owner`
5. creazione `site_settings_platform`
6. creazione default subdomain in `site_domains`
7. audit log

## Domain Resolution Strategy

### Requisiti

- unicita` globale del dominio
- un solo primary domain per sito
- supporto subdomain di default
- supporto custom domains
- supporto Vercel o VPS tramite adapter

### Dev mode senza dominio reale

Se il progetto gira ancora senza dominio pubblico:

- usare `NEXT_PUBLIC_PLATFORM_BASE_DOMAIN=localhost`
- mantenere `PLATFORM_DOMAIN_PROVIDER=vps`
- fare bootstrap o backfill dei siti con host tecnici `slug.localhost`

Vedi anche [platform-dev-domains.md](/Users/briancortinovis/Documents/editoria-cms/docs/platform-dev-domains.md).

### Flusso di risoluzione

1. normalizzare l'host
2. ignorare host riservati della platform (`app`, `admin`, `api`, ambiente locale)
3. cercare `site_domains.hostname`
4. verificare `status = active`
5. ricavare `site_id`
6. ricavare `tenant_id`
7. costruire il contesto sito pubblico

### Compatibilita` con il repo attuale

Nel periodo di transizione e` utile un fallback:

- prima lookup su `site_domains`
- poi fallback a `tenants.domain`

Cosi` i tenant gia` esistenti continuano a funzionare mentre la platform migra i domini nel nuovo modello.

## Accesso Sicuro al CMS

### Caso 1: Platform e CMS nella stessa app

Flusso consigliato:

1. utente clicca `Apri CMS` da `/app/sites/[siteId]`
2. route server-side verifica la membership su `site_id`
3. la route imposta un cookie HttpOnly con il `site_id` attivo
4. la route reindirizza a `/dashboard`
5. il CMS legge il contesto lato server e ricava il `tenant_id`

### Caso 2: Platform e CMS separati

Flusso consigliato:

1. platform verifica membership lato server
2. genera bridge token firmato e short-lived
3. redirect verso CMS con token one-time o a scadenza molto breve
4. il CMS valida firma, scadenza, `site_id`, `tenant_id`, `user_id`
5. il CMS rigenera il proprio contesto server-side senza fidarsi del client

Non bisogna mai passare direttamente `tenant_id` o `role` in query string senza firma.

## RLS Strategy

Per le nuove tabelle platform:

- `sites`: `SELECT` per membri del sito, `UPDATE` solo owner/admin
- `tenant_memberships`: `SELECT` per il proprio record e per owner/admin del sito
- `site_domains`: `SELECT` per membri, `INSERT/UPDATE/DELETE` solo owner/admin
- `notifications`: `SELECT/UPDATE` solo utente destinatario
- `audit_logs`: `SELECT` solo owner/admin e superadmin

La creazione del sito e la gestione dei domini devono passare da servizi server-side, non da insert client diretti.

## Tradeoff Scelti

- si introduce `sites` senza rifattorizzare subito tutto il CMS su `site_id`
- il CMS continua a lavorare con `tenant_id`
- la platform app vive sotto `/app` per non rompere l'attuale `/dashboard`
- il resolver host supporta fallback legacy fino a migrazione domini completata

## Roadmap

### MVP

- foundation SQL
- auth/account pages
- dashboard vuota platform
- create site
- my sites
- domain management base
- CMS bridge

### V2

- inviti e collaboratori completi
- billing reale
- session management avanzato
- 2FA
- provisioning asincrono domini e SSL
- superadmin UI
