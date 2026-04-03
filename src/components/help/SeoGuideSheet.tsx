"use client";

import { Search } from "lucide-react";
import { GuideSheet, type GuideSheetSection } from "@/components/help/GuideSheet";

const SEO_GUIDE_SECTIONS: GuideSheetSection[] = [
  {
    id: "obiettivo",
    label: "Fondamenta",
    title: "Cos'e' davvero il SEO nel CMS",
    body: [
      "Il SEO nel CMS non serve a riempire campi in piu': serve a rendere ogni contenuto comprensibile a Google, leggibile dagli utenti e governabile dal team senza interventi continui del developer.",
      "L'obiettivo corretto e' dare controllo editoriale su title, description, slug, canonical, robots, Open Graph, immagini e struttura, mantenendo pero' default sicuri e coerenti per tutto il tenant.",
    ],
    bullets: [
      "Pensa prima all'intento di ricerca, poi al campo tecnico.",
      "Ogni contenuto deve avere un obiettivo preciso: traffico, presidio locale, conversione, brand o approfondimento.",
      "Il CMS deve aiutare il lavoro del SEO specialist, non sostituirlo con automazioni cieche.",
    ],
    note: "Buon SEO significa contenuti utili, struttura chiara e segnali tecnici coerenti.",
  },
  {
    id: "workflow",
    label: "Metodo",
    title: "Flusso consigliato per lavorare bene",
    body: [
      "Il metodo migliore e' sempre lo stesso: definisci il contenuto, scegli la query o il tema principale, cura lo snippet SERP, verifica l'indicizzazione e poi controlla il runtime pubblico.",
      "Nel CMS conviene usare i default per partire veloci e poi rifinire solo le pagine che hanno reale valore SEO o commerciale.",
    ],
    bullets: [
      "1. Scegli focus keyword o intento di ricerca.",
      "2. Scrivi titolo e struttura della pagina pensando all'utente.",
      "3. Compila meta title e meta description in modo specifico.",
      "4. Controlla canonical, robots e Open Graph.",
      "5. Verifica sitemap, schema e risorse pubbliche.",
    ],
  },
  {
    id: "articoli",
    label: "Articoli",
    title: "Come usare bene i campi SEO degli articoli",
    body: [
      "Negli articoli il CMS ora gestisce meta title, meta description, canonical URL, robots index/follow, Open Graph title/description, focus keyword, schema type e alt della cover.",
      "Usa override solo quando servono davvero. Se il titolo articolo e lo snippet sono gia' corretti, non forzare campi inutilmente. L'override va usato per casi editoriali specifici, non come abitudine.",
    ],
    bullets: [
      "Meta title: chiaro, specifico, non duplicato, meglio se con entita' locale o tema principale.",
      "Meta description: descrive il valore del pezzo, non ripete solo il titolo.",
      "Canonical: usalo solo se vuoi dichiarare una URL preferita diversa da quella standard.",
      "Robots noindex: usalo per pagine che non devono competere in SERP.",
      "Cover image alt: descrivi l'immagine in modo utile, non scrivere keyword stuffing.",
    ],
  },
  {
    id: "pagine",
    label: "Pagine",
    title: "SEO delle pagine istituzionali, categorie e landing",
    body: [
      "Le pagine statiche sono spesso le piu' importanti per presidiare query stabili: chi siamo, contatti, servizi, landing locali, pagine evento, pagine commerciali o sezioni del giornale.",
      "Per queste pagine conviene lavorare con piu' precisione su title, description, canonical path, schema type, noindex/nofollow e struttura del contenuto.",
    ],
    bullets: [
      "Usa slug brevi e leggibili.",
      "Evita pagine quasi uguali con query cannibalizzate.",
      "Le pagine noindex non devono entrare in sitemap.",
      "Le categorie devono avere un ruolo editoriale reale, non solo archivistico.",
    ],
  },
  {
    id: "snippet",
    label: "Snippet",
    title: "Come scrivere title, description e Open Graph",
    body: [
      "Meta title e meta description servono soprattutto a controllare lo snippet in SERP e a chiarire il topic della pagina. Open Graph serve invece per le condivisioni social e messaging.",
      "Un buon title non e' solo una lista di keyword: deve spiegare subito cosa trovera' l'utente e perche' il risultato vale il click.",
    ],
    bullets: [
      "Title: meglio una promessa chiara che un titolo generico.",
      "Description: completa il title, non copiarlo.",
      "OG title e OG description: usali quando vuoi una resa social diversa dalla SERP.",
      "Preview SERP: controllala sempre sui contenuti piu' importanti.",
    ],
  },
  {
    id: "tecnico",
    label: "Tecnico",
    title: "Gli strumenti tecnici da controllare nel CMS",
    body: [
      "Il SEO tecnico non e' fatto solo di plugin. In questa piattaforma devi controllare sitemap, robots.txt, canonical, structured data, redirect, alt text, Search Console e configurazioni tracking.",
      "Questi elementi servono a fare crawling pulito, evitare duplicazioni e dare segnali chiari ai motori sui contenuti che vuoi far emergere.",
    ],
    bullets: [
      "Sitemap XML: deve essere raggiungibile e contenere solo URL indicizzabili.",
      "Robots.txt: va gestito con cautela, soprattutto sui tenant in produzione.",
      "Redirect 301: quando cambi slug o percorsi, non perdere storico e link equity.",
      "Structured data: article, breadcrumb, organization e collection page aiutano la comprensione del sito.",
      "Search Console e Google News: sono strumenti di verifica, non optional.",
    ],
  },
  {
    id: "monitoraggio",
    label: "Controlli",
    title: "Come usare la dashboard SEO del CMS",
    body: [
      "La pagina SEO ti aiuta a controllare lo stato del tenant, verificare il runtime pubblico e capire dove intervenire prima. Non limitarti allo score: guarda quali controlli sono davvero verificati nel sito pubblico.",
      "Le risorse SEO del pannello sono utili per controlli rapidi con il team tecnico o con un consulente esterno: sitemap, robots, endpoint pubblici e breadcrumb schema.",
    ],
    bullets: [
      "Checklist SEO sito: controlla se il runtime pubblico espone davvero i segnali attesi.",
      "Audit SEO articoli: individua meta mancanti, OG image assenti e articoli deboli.",
      "Analisi IA: usala per trovare opportunita', non per sostituire il giudizio editoriale.",
      "Genera Meta: usala come acceleratore iniziale, poi rifinisci i contenuti che contano.",
    ],
  },
  {
    id: "cose-da-evitare",
    label: "Errori",
    title: "Gli errori SEO piu' comuni da evitare",
    body: [
      "Molti problemi SEO nascono non da mancanza di strumenti, ma dall'uso disordinato degli strumenti. Se compili tutto senza criterio, il CMS diventa rumoroso invece che professionale.",
      "Meglio pochi segnali chiari e coerenti che decine di override messi senza motivo.",
    ],
    bullets: [
      "Non duplicare title e description su pagine diverse.",
      "Non mettere noindex senza capire se la pagina serve al business.",
      "Non cambiare slug importanti senza verificare i redirect.",
      "Non usare keyword ripetute artificialmente in title, description o alt text.",
      "Non considerare concluso il lavoro senza controllo su runtime pubblico e Search Console.",
    ],
  },
  {
    id: "checklist-finale",
    label: "Checklist",
    title: "Checklist pratica prima di pubblicare",
    body: [
      "Prima di considerare un contenuto SEO-ready, fai sempre una verifica finale rapida. Bastano pochi controlli ripetuti bene per evitare la maggior parte degli errori operativi.",
    ],
    bullets: [
      "Slug pulito e coerente.",
      "Meta title presente e non banale.",
      "Meta description utile e specifica.",
      "Immagine cover con alt sensato.",
      "Canonical corretto o lasciato al default se non serve override.",
      "Robots coerente con l'obiettivo della pagina.",
      "Contenuto con H1 chiaro e struttura leggibile.",
      "Controllo finale su pagina pubblica, non solo nel backoffice.",
    ],
    note: "Se il contenuto e' strategico, fai sempre un ultimo check anche in Search Console e con un crawl esterno.",
  },
];

export function SeoGuideSheet() {
  return (
    <GuideSheet
      eyebrow="SEO Helper"
      title="Guida SEO completa del CMS"
      intro="Questa guida spiega come lavorare bene con il SEO nel CMS: metodo, uso corretto dei campi, controlli tecnici, errori da evitare e modo migliore per sfruttare gli strumenti gia' presenti in piattaforma."
      icon={Search}
      summary={[
        "Usa il CMS per governare title, description, canonical, robots, schema e immagini senza rompere il sito.",
        "Lavora con default solidi e override solo quando servono davvero.",
        "Controlla sempre sia il contenuto sia il runtime pubblico.",
        "La dashboard SEO serve a verificare, non solo a riempire KPI.",
      ]}
      sections={SEO_GUIDE_SECTIONS}
      links={[
        { href: "/dashboard/articoli", label: "Articoli" },
        { href: "/dashboard/pagine", label: "Pagine" },
        { href: "/dashboard/redirect", label: "Redirect" },
      ]}
    />
  );
}
