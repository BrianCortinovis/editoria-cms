# Cronjobs CMS

## Obiettivo

I cron job servono a mantenere coerente il `published layer` senza dipendere da modifiche manuali in dashboard.

Nel tuo CMS i casi davvero importanti sono:

- articoli schedulati da pubblicare
- breaking news scadute da togliere
- banner scaduti da disattivare
- placement homepage scaduti da rimuovere

## Endpoint cron principale

- `GET /api/cron/publish-maintenance`

Questo cron:

1. trova articoli con `status = approved` e `scheduled_at <= now`
2. li porta a `published`
3. disattiva breaking news scadute
4. disattiva banner scaduti
5. cancella i placement scaduti in `slot_assignments`
6. rilancia un `full_rebuild` del published layer per i tenant toccati

## Endpoint cron secondario

- `GET /api/cron/seo-analysis`

Questo resta separato e va usato solo per analisi AI/SEO, non per il funzionamento editoriale del sito.

## Sicurezza

Entrambi i cron richiedono:

- header `Authorization: Bearer {CRON_SECRET}`

Quindi:

- nessun accesso pubblico anonimo
- nessun trigger lato browser
- nessun tenant scelto dal client

## Configurazione consigliata su Vercel

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-maintenance",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/seo-analysis",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Frequenza consigliata

### publish-maintenance

- ogni 5 minuti

Per newsroom ad aggiornamento frequente e` un buon compromesso tra freschezza e costo.

### seo-analysis

- una volta al giorno di notte

## Variabili richieste

- `CRON_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Regola architetturale

Il cron non serve a far leggere il DB al sito pubblico.

Serve a mantenere aggiornato il `published layer`, cosi` il sito live resta:

- veloce
- sicuro
- coerente con il CMS
