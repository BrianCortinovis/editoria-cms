# DA FARE PRIMA DI PRODUZIONE

Checklist operativa finale prima del go-live reale con clienti.

Questa lista serve per evitare di mandare in produzione:
- chiavi temporanee o esposte
- domini mittente non verificati
- configurazioni demo lasciate attive
- tenant senza settaggi minimi SEO / GDPR / email
- provider newsletter o tracking non allineati

## 1. Sicurezza e chiavi

- Rigenerare tutte le chiavi temporanee usate durante sviluppo e test.
- Revocare subito qualsiasi chiave condivisa in chat, ticket, file locali o note operative.
- Verificare che in produzione non siano rimaste chiavi demo o di test.
- Controllare che `.env.local` non venga mai caricato su repository o backup condivisi.
- Confermare che tutte le variabili sensibili siano impostate solo su Vercel / provider deploy.

Variabili da controllare con priorita' alta:
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CRON_SECRET`
- `REVALIDATION_SECRET`
- `EMAIL_TRANSPORT`
- `RESEND_API_KEY`
- `PLATFORM_SECRET_ENCRYPTION_KEY`
- eventuali chiavi provider AI
- eventuali chiavi provider newsletter

Nota importante:
- La chiave Resend temporanea usata in questa fase va sostituita prima del go-live definitivo clienti.

## 2. Email transactional

Le email normali del CMS e dei siti ora usano il control plane email.

Pannelli da verificare:
- superadmin email: `/admin/email`
- email lato sito: `/dashboard/email`

Da fare:
- configurare un sender piattaforma reale
- impostare `from name`
- impostare `from email`
- impostare `reply-to`
- impostare `sender domain`
- verificare che il dominio mittente sia validato nel provider email

Scelta consigliata:
- mail normali: Resend
- newsletter: Brevo o provider dedicato separato

Per i siti clienti:
- decidere se ogni sito usa `sender piattaforma` oppure `sender custom`
- se `sender custom`, verificare DNS del dominio o sottodominio del cliente

Scelta consigliata per i domini:
- piccoli clienti: sottodominio piattaforma, ad esempio `mail.tuapiattaforma.it`
- clienti piu' strutturati: sottodominio dedicato del cliente, ad esempio `mail.cliente.it`

## 3. Newsletter

La newsletter deve restare separata dalle mail operative.

Pannello da verificare:
- `/dashboard/newsletter`

Da fare:
- scegliere provider definitivo newsletter
- se usiamo Brevo, configurare API key, sender, audience/lista, webhook
- confermare double opt-in se richiesto
- verificare form iscrizione pubblico
- verificare unsubscribe e gestione consensi
- verificare che i sender newsletter siano coerenti col dominio cliente

Non fare:
- usare Resend transactional come sostituto della newsletter massiva
- mischiare broadcast operativo e newsletter marketing nello stesso flusso

## 4. Domini e DNS

Pannelli da verificare:
- `/admin/domains`
- `/app/sites/[siteId]/domains`

Da fare:
- verificare dominio principale per ogni sito
- verificare eventuale redirect www / non-www
- verificare DNS per dominio pubblico
- verificare DNS per dominio mittente email
- verificare record SPF
- verificare record DKIM
- verificare record DMARC
- verificare eventuali record richiesti da Brevo / Resend

## 5. Superadmin control plane

Pannelli da verificare:
- `/admin`
- `/admin/sites`
- `/admin/storage`
- `/admin/publish`
- `/admin/cron`
- `/admin/compliance`
- `/admin/seo`
- `/admin/email`

Da fare:
- controllare che ogni sito abbia stack e target coerenti
- controllare quote storage
- controllare ultimi publish
- controllare moduli attivi per tenant
- controllare sender email per tenant
- controllare compliance sync
- controllare SEO overview

## 6. Tenant settings minimi

Per ogni sito cliente verificare almeno:
- nome sito
- slug tenant corretto
- dominio pubblico corretto
- logo e favicon corretti
- footer aggiornato
- contatti reali
- email redazione / supporto / privacy
- dati societa' o titolare
- menu e pagine base pubblicate

Se il sito invia email:
- sender valido
- reply-to valido
- audience definita
- policy interna su chi puo' inviare

## 7. GDPR e compliance

Pannelli da verificare:
- `/admin/compliance`
- `/dashboard/gdpr`

Da fare:
- compilare dati reali del titolare
- compilare email privacy / contatti
- verificare servizi attivi reali per tenant
- verificare cookie banner
- verificare blocco preventivo tracker fino al consenso
- verificare privacy policy
- verificare cookie policy
- verificare termini e condizioni

Controlli extra:
- non lasciare testi demo
- non lasciare riferimenti provider non usati
- verificare tempi di conservazione
- verificare basi giuridiche dichiarate

## 8. SEO e search

Pannelli da verificare:
- `/dashboard/seo`
- helper SEO interno

Da fare:
- verificare title e meta description base
- verificare canonical
- verificare robots
- verificare sitemap
- verificare robots.txt
- verificare structured data
- verificare Open Graph
- verificare immagini con alt text

Ricerca sito:
- verificare che la ricerca classica trovi articoli e pagine
- verificare che il publish aggiorni `search.json`
- se la ricerca AI e' attiva, verificare provider AI configurato
- se il provider AI non e' pronto, lasciare il fallback classico

## 9. Tracking e analytics

Da fare:
- configurare GA4 se richiesto
- configurare GTM se richiesto
- configurare Search Console
- configurare eventuale AdSense
- verificare che tutto rispetti il consenso cookie
- verificare che i codici non partano prima dell'opt-in per le categorie corrette

## 10. Publish e contenuti

Da fare:
- pubblicare homepage
- pubblicare pagine essenziali
- pubblicare articoli seed reali o rimuovere demo
- verificare che menu e footer siano coerenti
- verificare che i redirect siano attivi
- verificare sitemap tenant-specific
- verificare pagine `noindex`

Controlli contenuti:
- eliminare testi segnaposto
- eliminare immagini demo non volute
- eliminare CTA fittizie
- eliminare link `#` lasciati nei menu

## 11. Media e storage

Da fare:
- verificare bucket media
- verificare bucket published
- verificare URL pubblici media
- verificare quote storage
- verificare naming file
- verificare immagini principali articoli
- verificare peso file troppo grandi

## 12. Utenti e permessi

Da fare:
- verificare superadmin reali
- verificare owner dei siti
- verificare admin, chief editor, editor
- rimuovere utenti test
- rimuovere inviti non necessari
- controllare che ruoli bassi non vedano funzioni sensibili

Controlli pratici:
- accesso admin email solo superadmin
- accesso email sito solo admin/caporedattore
- accesso social/config solo ruoli alti

## 13. Cron e automazioni

Da fare:
- verificare cron publish maintenance
- verificare cron SEO analysis
- verificare eventuali job social
- verificare eventuali webhook esterni
- verificare `CRON_SECRET`

## 14. Hardening tecnico finale

Da fare:
- confermare `PLATFORM_SECRET_ENCRYPTION_KEY`
- confermare rate limiting distribuito con Redis/Upstash in produzione
- verificare middleware auth
- verificare protezioni trusted origin per API mutative
- verificare che gli endpoint di test siano disabilitati in production
- verificare che i segreti non siano salvati in chiaro nei log

## 15. Pulizia pre go-live

- togliere dati demo non necessari
- togliere contenuti di seed non voluti
- togliere indirizzi email fake
- togliere form recipient di prova
- togliere domini di prova
- togliere account utenti test
- togliere branding placeholder

## 16. Verifica finale manuale

Per ogni sito cliente fare un giro rapido:
- home
- articolo
- categoria
- pagina custom
- ricerca
- form
- commenti se attivi
- newsletter signup
- cookie banner
- privacy / cookie / termini
- sitemap
- robots
- mobile
- desktop

Per piattaforma:
- login
- dashboard tenant
- publish
- superadmin
- email control plane
- sender sito
- invio email test

## 17. Test minimi consigliati prima del go-live

- `npx tsc --noEmit`
- `npm run build`
- health check `/api/v1/health`
- test ricerca sito
- test publish
- test form email
- test invio email transactional
- test sender piattaforma
- test sender custom sito

## 18. Decisioni operative da fissare prima dei clienti

- provider email transactional definitivo
- provider newsletter definitivo
- policy domini mittente: piattaforma o dominio cliente
- chi puo' inviare email lato sito
- chi puo' inviare broadcast superadmin
- se usare double opt-in newsletter
- se attivare ricerca AI tenant per tenant

## 19. Stato attuale del progetto

Gia' pronto:
- control plane superadmin email
- invio email sito
- sender piattaforma e sender sito
- separazione transactional vs newsletter
- ricerca classica funzionante
- fallback sicuro per ricerca AI
- compliance centralizzata
- SEO helper e pannelli operativi

Da rifinire sempre prima del go-live vero:
- rotazione chiavi definitive
- domini email verificati
- sender reali
- provider newsletter reale
- dati legali reali per tenant
- pulizia contenuti demo

## 20. Passaggio a stack pulito v1.0

Scenario consigliato:
- sviluppo iniziale su account personale o stack provvisorio
- una volta chiusa la base `v1.0`, fare una copia pulita del progetto
- creare nuovi account, nuove chiavi e nuovi provider
- portare in produzione solo asset definitivi

Obiettivo:
- nessuna dipendenza da account personali
- nessuna chiave provvisoria
- nessun dominio demo
- nessun dato test misto ai dati clienti

Stack nuovi da creare per il passaggio definitivo:
- nuovo team/account Vercel
- nuovo progetto Vercel
- nuovo progetto Supabase
- nuove env production
- nuove env development
- nuovi provider email transactional
- nuovo provider newsletter
- nuovi domini pubblici
- nuovi domini mittente email
- nuovi segreti cron e revalidation

Ordine corretto del passaggio:
1. congelare la base codice `v1.0`
2. creare repository o branch di rilascio pulito se necessario
3. creare nuovo progetto Supabase pulito
4. applicare migrations sul nuovo database
5. creare nuovo progetto Vercel collegato al repo pulito
6. configurare env `development`, `preview`, `production`
7. configurare nuovo provider email transactional
8. configurare nuovo provider newsletter
9. configurare domini pubblici e DNS
10. configurare sender email piattaforma e sender per-tenant
11. importare solo dati realmente necessari
12. eseguire checklist completa pre go-live
13. aprire produzione al primo cliente

Cose da non copiare dal vecchio stack:
- chiavi API
- segreti cron
- sender email provvisori
- domini di test
- utenti test
- tenant demo non necessari
- contenuti seed non voluti
- log/audit inutili

Se serve mantenere un ambiente di sviluppo:
- usare un progetto `dev` separato
- usare un Supabase `dev` separato
- usare chiavi email separate
- non riutilizzare sender production per test interni

Nomi ambiente consigliati:
- `editoria-cms-dev`
- `editoria-cms-staging`
- `editoria-cms-prod`

## 21. Note utili anche per IA e automazioni

Questa sezione serve a evitare errori quando un assistente IA o una procedura automatica lavora sul progetto.

Principi da seguire:
- non assumere mai che le chiavi attuali siano definitive
- trattare sempre il deploy attuale come ambiente provvisorio finche' non esiste il nuovo stack pulito
- non copiare segreti da env vecchie a env nuove senza rotazione
- non considerare newsletter e transactional come lo stesso sistema
- non assumere che un tenant possa usare il proprio dominio mittente senza verifica DNS

Regole operative per IA:
- se trova chiavi in chat o note, considerarle temporanee o compromesse
- se deve fare un deploy definitivo, ricordarsi di richiedere o usare chiavi nuove
- se deve configurare email, separare sempre:
  - transactional
  - newsletter
- se deve configurare domini email, preferire sottodomini dedicati
- se deve verificare produzione, controllare prima:
  - env
  - domini
  - sender
  - provider
  - permessi

Regole operative per script e automazioni:
- non usare mai `.env.local` come sorgente definitiva production
- preferire env del provider deploy
- non scrivere segreti nei log
- non salvare secret raw in audit o metadata leggibili
- non inviare broadcast senza controllare audience e sender effettivo

Contesto da dare sempre all'IA quando aiuta sul go-live:
- il progetto attuale puo' stare su account personali provvisori
- la produzione definitiva verra' fatta su stack nuovi puliti
- tutte le API key definitive andranno ruotate
- newsletter e mail normali usano sistemi separati
- i tenant piccoli possono usare sender piattaforma
- i tenant strutturati possono usare sender custom solo dopo verifica DNS

## 22. File e punti da ricordare nel passaggio finale

Documenti utili:
- [DEPLOYMENT.md](/Users/briancortinovis/Documents/editoria-cms/docs/setup/DEPLOYMENT.md)
- [cloudflare-go-live.md](/Users/briancortinovis/Documents/editoria-cms/docs/architecture/cloudflare-go-live.md)
- [DA_FARE_PRIMA_DI_PRODUZIONE.md](/Users/briancortinovis/Documents/editoria-cms/docs/guides/DA_FARE_PRIMA_DI_PRODUZIONE.md)

Punti applicativi da ricontrollare quando si rifara' il deploy pulito:
- `/admin/email`
- `/dashboard/email`
- `/dashboard/newsletter`
- `/admin/compliance`
- `/dashboard/seo`
- `/admin/domains`
- `/admin/sites`
- `/admin/storage`
- `/admin/publish`
- `/admin/cron`

Variabili che quasi sicuramente andranno cambiate nel passaggio finale:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `REVALIDATION_SECRET`
- `EMAIL_TRANSPORT`
- `RESEND_API_KEY`
- provider API key newsletter
- provider API key AI
- eventuali webhook URL
