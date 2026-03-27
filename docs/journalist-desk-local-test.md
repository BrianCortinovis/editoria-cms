# Desk Giornalisti: test locale

Questa guida serve per provare la mini-app giornalisti e i ruoli team **solo in locale**.

## Cosa prepara

Lo script crea o aggiorna tre utenti di prova sul tenant scelto:

- `admin.test@local.cms` / `admin1234` → `admin`
- `desk.test@local.cms` / `desk1234` → `chief_editor`
- `reporter.test@local.cms` / `reporter1234` → `contributor`

## Sicurezza

Lo script è volutamente bloccato se `NEXT_PUBLIC_SUPABASE_URL` non punta a `localhost` o `127.0.0.1`.

Questo evita di creare account con password facili su ambienti reali.

## Come usarlo

1. avvia Supabase locale
2. verifica che `.env.local` punti al Supabase locale
3. esegui:

```bash
node scripts/create-local-test-users.mjs
```

Se vuoi un tenant diverso da `valbrembana`:

```bash
node scripts/create-local-test-users.mjs nome-tenant
```

## Come provare la app giornalista

Con `reporter.test@local.cms`:

- accedi al CMS
- apri `Desk`
- crea un progetto articolo
- carica foto, video o audio
- usa `Scrittura classica` oppure `Articolo con IA`
- salva in bozza o invia in revisione

Con `desk.test@local.cms`:

- controlla i contenuti in revisione
- verifica il passaggio editoriale

Con `admin.test@local.cms`:

- controlla ruoli, flussi e visibilità dei moduli

## Obiettivo del test

Verificare che:

- il contributor veda un CMS molto più limitato
- il desk lavori da mobile o da pannello semplice
- i media restino collegati al progetto articolo
- il prompt speciale dell'IA prevalga su preset e slider
