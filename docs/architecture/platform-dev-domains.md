# Platform Domains In Dev

## Stato attuale

La Platform App ora usa lo schema Supabase nativo anche per i tenant storici.

Se non hai ancora un dominio reale:

- lascia `NEXT_PUBLIC_PLATFORM_BASE_DOMAIN=localhost`
- lascia `PLATFORM_DOMAIN_PROVIDER=vps`
- i siti platform useranno host tecnici tipo `valbrembana.localhost`

Questo e` sufficiente per:

- profilo platform
- elenco siti
- dettaglio sito
- bridge `Apri CMS`
- membership e ruoli tenant
- domini platform di default a livello dati

## Quando usare il backfill

Se avevi tenant legacy creati prima della Platform App, esegui:

```bash
npm run platform:backfill
```

Lo script:

- crea `sites` mancanti per i `tenants` legacy
- crea `tenant_memberships` dai vecchi `user_tenants`
- crea `site_domains` primari
- crea `site_settings_platform`
- crea `subscriptions` iniziali

Lo script e` idempotente a livello pratico: i tenant che hanno gia` un record in `sites` vengono saltati.

## Migrazioni Supabase

Per controllare lo stato:

```bash
npm run supabase:migrations:list
```

Per applicare le migration remote:

```bash
npm run supabase:push
```

Richiede:

- `SUPABASE_ACCESS_TOKEN`
- oppure una sessione `supabase login` gia` attiva

## Passaggio a dominio reale

Quando avrai un dominio vero, per esempio `platform.tuodominio.it` o `tuodominio.it`, ti basta:

1. aggiornare `NEXT_PUBLIC_PLATFORM_BASE_DOMAIN`
2. scegliere il provider:
   - `PLATFORM_DOMAIN_PROVIDER=vercel`
   - oppure `PLATFORM_DOMAIN_PROVIDER=vps`
3. creare o riallineare i `site_domains` di default

Con domini veri conviene poi:

- rimuovere i `*.localhost` dai record di default
- aggiornare `tenants.domain`
- verificare il resolver host -> `site_id` -> `tenant_id`

## Nota importante

`localhost` qui e` solo un valore tecnico di bootstrap del dato.
Non e` pensato per routing DNS reale pubblico.
