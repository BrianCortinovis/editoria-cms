"use client";

import { FileText } from "lucide-react";
import { GuideSheet } from "@/components/help/GuideSheet";
import AIButton from "@/components/ai/AIButton";
import { useAuthStore } from "@/lib/store";

export default function CmsHomePage() {
  const { currentTenant } = useAuthStore();
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AIButton
          actions={[
            {
              id: "cms-ops-guide",
              label: "Guida operativa CMS",
              prompt: "Spiega come organizzare il lavoro nel CMS per questo tenant: redazione, SEO, tecnico, publish, media e newsletter. Dai una guida pratica basata sul contesto: {context}",
            },
            {
              id: "cms-tech-brief",
              label: "Brief tecnico CMS",
              prompt: "Prepara un brief tecnico sul funzionamento del CMS online: publish, tassonomie, contenuti, bridge, siti custom e strumenti utili al team tecnico: {context}",
            },
          ]}
          contextData={JSON.stringify(
            {
              tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
              sections: ["articoli", "pagine", "media", "categorie", "tag", "slot", "seo", "newsletter", "tecnico", "desktop-bridge"],
            },
            null,
            2,
          )}
        />
      </div>

      <GuideSheet
        eyebrow="Cloud CMS"
        title="CMS online senza editor visuale"
        intro="Questa area e` il punto di lavoro del CMS puro. Qui governi contenuti, media, tassonomie, regole slot, SEO e pubblicazione. Il builder visuale non vive piu` online: il desktop editor resta separato e dialoga tramite bridge tecnico."
        icon={FileText}
        links={[
          { href: "/dashboard/articoli", label: "Apri Articoli" },
          { href: "/dashboard/categorie", label: "Apri Categorie" },
          { href: "/dashboard/desktop-bridge", label: "Bridge Desktop Editor" },
          { href: "/dashboard/tecnico", label: "Apri Tecnico" },
        ]}
        summary={[
          "Contenuti: articoli, pagine, media e metadati.",
          "Tassonomie: categorie, tag e regole editoriali.",
          "Publish: il sito pubblico legge il published layer, non il DB live.",
          "Bridge: il desktop editor e i siti custom si agganciano dal layer tecnico.",
        ]}
        sections={[
          {
            id: "contenuti",
            label: "Contenuti",
            title: "Dove lavorare ogni giorno nel CMS",
            body: [
              "Il CMS online resta il centro dei contenuti. Qui la redazione scrive articoli, governa pagine, organizza media, definisce tassonomie e rifinisce SEO e publish. La logica e` editoriale e operativa, non visual builder.",
            ],
            bullets: [
              "Articoli: bozze, revisione, pubblicazione e regole editoriali.",
              "Pagine: anagrafica, slug, metadati e struttura pubblicata.",
              "Media: archivio asset del tenant.",
              "Categorie e tag: ordine, classificazione e automazioni editoriali.",
            ],
            note: "Il CMS online deve restare chiaro: contenuti e governo del sito, senza confondere struttura visuale e builder desktop.",
          },
          {
            id: "publish",
            label: "Publish",
            title: "Come funziona il sito pubblico",
            body: [
              "Il database resta la fonte di verita` del CMS, ma il sito pubblico non legge il DB live. Il publish genera documenti pubblicati e il runtime pubblico legge quel layer. Questo protegge performance, sicurezza e compatibilita` con siti custom o runtime esterni.",
            ],
            bullets: [
              "Source of truth: Supabase / write model.",
              "Published layer: JSON/versioni pubblicate.",
              "Public runtime: lettura dal layer pubblicato, non dal DB diretto.",
            ],
            note: "Questa separazione e` il punto chiave per newsroom veloci, frontend custom e deployment diversi.",
          },
          {
            id: "moduli",
            label: "Moduli",
            title: "Ordine corretto dei moduli del CMS",
            body: [
              "Nel lavoro quotidiano conviene leggere il CMS per gruppi: produzione, organizzazione, distribuzione e controllo. Questo riduce i passaggi e mantiene ogni parte al suo posto.",
            ],
            bullets: [
              "Produzione: Articoli, Media, Breaking News, Eventi.",
              "Organizzazione: Pagine, Categorie, Tag, Regole slot, Menu.",
              "Distribuzione: SEO, Redirect, Newsletter, ADV.",
              "Controllo: Tecnico, Log, Team, Impostazioni.",
            ],
          },
          {
            id: "bridge",
            label: "Bridge",
            title: "Dove si collega il desktop editor",
            body: [
              "Il desktop editor non deve piu` vivere nel webapp online. Il CMS espone bridge, contract e publish layer: il desktop prepara struttura e layout, ma il CMS resta il sistema che governa contenuti, publish e compatibilita` con i siti custom.",
            ],
            bullets: [
              "Bridge tecnico: /dashboard/tecnico",
              "Desktop bridge: /dashboard/desktop-bridge",
              "Route pubbliche del sito: published layer e API controllate",
            ],
          },
        ]}
      />
    </div>
  );
}
