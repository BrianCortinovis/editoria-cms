# Newsletter Architecture

## Scelta consigliata

La newsletter non deve vivere come motore proprietario completo dentro il CMS.

La soluzione giusta e`:

- `CMS` come punto di orchestrazione
- `provider esterno` per invio e delivery
- `modulo newsletter` dentro il CMS come interfaccia editoriale e bridge operativo

## Perche`

Gestire in proprio:

- deliverability
- reputation
- bounce
- unsubscribe
- suppression list
- DKIM/SPF/DMARC
- warmup

ti complica il CMS senza darti un vero vantaggio adesso.

## Modello corretto

### Dentro il CMS

Il CMS deve gestire:

- template newsletter
- contenuti editoriali
- configurazione campagne
- selezione articoli
- preview
- storico invii
- stato sincronizzazione provider

### Fuori dal CMS

Il provider esterno deve gestire:

- invio email
- liste reali
- segmenti
- bounce
- unsubscribe
- statistiche delivery

## Architettura tecnica

- `Newsletter module` nel CMS
- `NewsletterProvider interface`
- adapter provider esterni
- preview server-side `html + text + payload`
- stato base salvato nel CMS
- delivery reale delegato al provider

Esempi:

- `BrevoProvider`
- `MailchimpProvider`
- `ConvertKitProvider`
- `ButtondownProvider`

## Regola

Il CMS non deve dipendere da un provider unico hardcoded.

Deve avere:

- modulo UI interno
- service layer astratto
- provider adapter

## Modello operativo nel progetto

Nel progetto attuale la newsletter funziona cosi`:

- `GET /api/newsletter/module`
  carica configurazione, campagne, forms, categorie e articoli pubblicati del tenant
- `PUT /api/newsletter/module`
  salva configurazione modulo e stato campagne nel `site_config.footer`
- `POST /api/newsletter/preview`
  genera anteprima server-side e payload provider-agnostic

La UI del composer vive in:

- `/dashboard/newsletter`

## Dati e responsabilita`

Supabase viene usato solo per:

- auth
- membership tenant
- configurazione newsletter
- campagne bozza e stato base

Il provider esterno viene usato per:

- liste reali
- invio
- unsubscribe
- bounce
- metriche delivery

## Composer

La campagna si costruisce dal CMS perche` deve pescare in modo nativo:

- articoli pubblicati
- categorie
- metadata editoriali
- form di iscrizione
- sender e audience del sito

L'output minimo prodotto dal CMS e`:

- `html`
- `text`
- `providerPayload`

Questo consente di usare il CMS come cabina di regia editoriale e il provider come delivery layer.

## Conclusione

Quindi:

- `sì` al modulo newsletter nel CMS
- `no` al motore email proprietario completo
- `sì` a provider esterni come delivery layer

Questo ti lascia:

- UX editoriale centralizzata
- costi e complessita` piu` bassi
- possibilita` di cambiare provider senza rifare il CMS
