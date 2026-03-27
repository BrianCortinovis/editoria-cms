"use client";

import { Cpu } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { GuideSheet } from "@/components/help/GuideSheet";

export default function DesktopBridgePage() {
  const { currentTenant } = useAuthStore();
  const tenantSlug = currentTenant?.slug || "tenant-slug";
  const bridgeUrl = `/api/v1/bridge/site-pack?tenant=${tenantSlug}`;
  const publicArticlesUrl = `/api/v1/articles?tenant=${tenantSlug}`;
  const publicSiteUrl = `/api/v1/site?tenant=${tenantSlug}`;

  return (
    <GuideSheet
      eyebrow="Desktop Bridge"
      title="Collegamento tra Cloud CMS, editor desktop e siti custom"
      intro="Il builder visuale non vive piu` online nel CMS. Questa pagina spiega il collegamento corretto: il desktop editor genera struttura e layout, il CMS resta la fonte di verita` dei contenuti e il sito pubblico legge solo il layer pubblicato."
      icon={Cpu}
      links={[
        { href: "/dashboard/cms", label: "Torna al CMS" },
        { href: "/dashboard/tecnico", label: "Apri Tecnico" },
      ]}
      summary={[
        `Bridge pack del tenant: ${bridgeUrl}`,
        "Cartella locale Desktop Builder: /Users/briancortinovis/Desktop/Desktop Builder",
        "Desktop editor separato dal webapp online.",
        "CMS come control plane dei contenuti.",
        "Siti custom collegati via contract e publish layer.",
      ]}
      sections={[
        {
          id: "modello",
          label: "Modello",
          title: "Qual e` la separazione corretta",
          body: [
            "La separazione giusta e` questa: Platform App per profilo e siti, Cloud CMS per contenuti e pubblicazione, Desktop Editor per struttura e layout, runtime pubblico che legge solo il layer pubblicato. In questo modo il CMS online non si porta dietro il peso del builder visuale.",
          ],
          bullets: [
            "Platform App: profilo, siti, domini, team, accessi.",
            "Cloud CMS: contenuti, media, tassonomie, SEO, publish.",
            "Desktop Editor: layout, builder visuale, AI locale.",
            "Sito pubblico: lettura dal published layer.",
          ],
        },
        {
          id: "bridge-pack",
          label: "Bridge Pack",
          title: "Che cosa consegni al tecnico o all’AI costruttrice",
          body: [
            "Il bridge pack e` il contratto principale per chi deve costruire o collegare un sito. Non deve leggere tabelle sparse o inventare route. Deve partire da un contratto stabile che dica pagine, linking, menu, footer, datasource, slot e convenzioni SEO del tenant.",
          ],
          bullets: [
            `Endpoint tenant corrente: ${bridgeUrl}`,
            "Contiene route native, menu, footer, pages map, categorie, slot e SEO conventions.",
            "Va usato come contesto obbligatorio sia dal tecnico sia dall’AI builder locale.",
          ],
          note: "Il bridge pack riduce integrazioni fragili e impedisce che ogni frontend inventi un proprio modello incompatibile.",
        },
        {
          id: "linking",
          label: "Linking",
          title: "Come linkano davvero le cose al gestionale",
          body: [
            "Il frontend costruito dal Desktop Builder o un sito custom non deve inventare route proprie. Deve linkare articoli, categorie, pagine e search usando gli stessi pattern del CMS pubblicato. In pratica il gestionale governa slug, menu, categorie, listing e metadati; il frontend governa solo resa, componenti e performance.",
            "Quando il builder crea un componente che mostra articoli o categorie, non salva query dirette a Supabase nel frontend. Salva invece un datasource compatibile col bridge pack: articolo singolo, feed articoli, categoria, pagina pubblicata, menu, settings o layout pubblicato.",
          ],
          bullets: [
            "Articolo: /articolo/{articleSlug}",
            "Categoria: /categoria/{categorySlug}",
            "Pagina CMS: /{pageSlug}",
            `Config sito: ${publicSiteUrl}`,
            `Listing articoli: ${publicArticlesUrl}`,
          ],
          note: "Regola chiave: il gestionale decide cosa esiste e con quali slug; il frontend decide come renderizzarlo.",
        },
        {
          id: "custom-sites",
          label: "Siti custom",
          title: "Come si collega un frontend esterno",
          body: [
            "Il sito custom non deve parlare direttamente con Supabase. Il CMS scrive nel database, il publish genera il layer pubblico e il frontend custom legge quel layer o le API pubbliche compatibili. Questa e` la strada giusta per sicurezza, performance e scalabilita`.",
          ],
          bullets: [
            "DB CMS = write model",
            "Publish = generazione JSON/documenti pubblicati",
            "Frontend custom = lettura manifest e documenti pubblicati",
            "Nessuna chiave Supabase nel frontend pubblico",
          ],
        },
        {
          id: "desktop",
          label: "Desktop",
          title: "Cosa deve fare il desktop editor",
          body: [
            "Il desktop editor deve costruire struttura, layout e output compatibile con il CMS. Non deve diventare un altro CMS completo. Il CMS online continua a governare contenuti, publish, tassonomie e compatibilita` multi-tenant.",
          ],
          bullets: [
            "Layout e struttura sito nel desktop.",
            "Contenuti, regole editoriali e publish nel CMS.",
            "Bridge tecnico come punto di sincronizzazione.",
            "Cartella locale gia` predisposta sul Desktop come punto di accesso separato.",
          ],
        },
        {
          id: "modello-dati",
          label: "Dati",
          title: "Con che cosa si collega il sito al CMS",
          body: [
            "Il collegamento corretto non e` DB diretto. Il builder o il sito custom devono lavorare con un contratto pubblicato: settings, menu, homepage, pagine, articoli, categorie, tags, events e gli altri documenti del published layer. Questo permette al CMS di restare il write model e al sito pubblico di restare veloce e sicuro.",
            "Se il sito e` creato dal Desktop Builder, l'editor salva mapping e datasource in un progetto locale. Quando esporta, il frontend risultante usa bridge pack e published layer. Se il sito e` custom, il tecnico usa gli stessi contract senza passare dall'editor.",
          ],
          bullets: [
            "Write model: Supabase via CMS.",
            "Read model: published JSON e API pubbliche.",
            "Builder project: mapping tra componenti frontend e datasource CMS.",
            "Nessuna chiave Supabase nel frontend live.",
          ],
        },
      ]}
    />
  );
}
