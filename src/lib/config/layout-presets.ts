export type LayoutRow = [number, ...string[]];

export interface LayoutPresetDef {
  id: string;
  name: string;
  description: string;
  category:
    | "editorial"
    | "news"
    | "magazine"
    | "blog"
    | "landing"
    | "portfolio"
    | "corporate"
    | "creative"
    | "minimal"
    | "broadsheet"
    | "fullwidth"
    | "showcase";
  rows: LayoutRow[];
  svg?: string;
}

export const LAYOUT_PRESETS: LayoutPresetDef[] = [
  {
    id: "editorial-frontpage",
    name: "Prima Pagina Editoriale",
    category: "editorial",
    description: "Tutto il pacchetto classico: testata, ticker, apertura e desk.",
    rows: [[9, "100%"], [5, "100%"], [42, "68%", "30%"], [26, "24%", "52%", "24%"], [22, "50%", "50%"], [10, "100%"]],
  },
  {
    id: "editorial-sidebar-left",
    name: "Editoriale Sidebar SX",
    category: "editorial",
    description: "Navigazione laterale e contenuto dominante con chiusura editoriale.",
    rows: [[8, "22%", "76%"], [32, "22%", "76%"], [24, "22%", "36%", "36%"], [18, "100%"], [10, "100%"]],
  },
  {
    id: "editorial-bottom-menu",
    name: "Editoriale Menu Basso",
    category: "editorial",
    description: "Apertura pulita e fascia menu/desk sotto il lead principale.",
    rows: [[8, "100%"], [36, "62%", "36%"], [14, "32%", "32%", "32%"], [28, "48%", "48%"], [12, "100%"]],
  },

  {
    id: "news-tg-home",
    name: "TG Home",
    category: "news",
    description: "Ticker forte, apertura centrale e colonna servizi laterale.",
    rows: [[8, "100%"], [5, "100%"], [44, "20%", "50%", "28%"], [24, "32%", "32%", "32%"], [18, "48%", "48%"], [10, "100%"]],
  },
  {
    id: "news-live-bulletin",
    name: "Live Bulletin",
    category: "news",
    description: "Colonna live a sinistra e desk veloce nella parte alta.",
    rows: [[8, "22%", "76%"], [30, "22%", "76%"], [24, "22%", "24%", "24%", "24%"], [22, "60%", "38%"], [10, "100%"]],
  },
  {
    id: "news-service-grid",
    name: "News di Servizio",
    category: "news",
    description: "Locale/servizio con meteo, eventi, focus e desk centrale.",
    rows: [[8, "100%"], [28, "36%", "62%"], [18, "24%", "24%", "24%", "24%"], [24, "62%", "36%"], [14, "48%", "48%"], [10, "100%"]],
  },

  {
    id: "broadsheet-sunday",
    name: "Broadsheet Domenicale",
    category: "broadsheet",
    description: "Gabbia larga da domenicale con lead story e colonne alte.",
    rows: [[10, "100%"], [4, "100%"], [50, "74%", "24%"], [24, "24%", "24%", "24%", "24%"], [22, "38%", "24%", "38%"], [12, "100%"]],
  },
  {
    id: "broadsheet-metro",
    name: "Broadsheet Metro",
    category: "broadsheet",
    description: "Testata secca, rail stretti e contenuto molto centrale.",
    rows: [[10, "100%"], [4, "100%"], [38, "18%", "62%", "18%"], [24, "18%", "30%", "30%", "18%"], [20, "50%", "50%"], [10, "100%"]],
  },
  {
    id: "broadsheet-balance",
    name: "Broadsheet Bilanciato",
    category: "broadsheet",
    description: "Lead principale in alto e piano inferiore molto ordinato.",
    rows: [[10, "100%"], [5, "100%"], [40, "50%", "24%", "24%"], [22, "32%", "32%", "32%"], [24, "62%", "36%"], [10, "100%"]],
  },

  {
    id: "magazine-cover",
    name: "Magazine Cover",
    category: "magazine",
    description: "Copertina piena e teaser distribuiti su piani diversi.",
    rows: [[8, "34%", "64%"], [52, "60%", "38%"], [18, "32%", "32%", "32%"], [28, "58%", "38%"], [10, "100%"]],
  },
  {
    id: "magazine-mosaic",
    name: "Magazine Mosaico",
    category: "magazine",
    description: "Taglio rivista con mosaico e pesi sbilanciati nella parte alta.",
    rows: [[8, "100%"], [34, "24%", "50%", "24%"], [24, "24%", "24%", "50%"], [22, "32%", "32%", "32%"], [20, "48%", "48%"], [10, "100%"]],
  },
  {
    id: "magazine-ribbon",
    name: "Magazine Ribbon",
    category: "magazine",
    description: "Fasce editoriali e moduli laterali, più design che griglia piatta.",
    rows: [[8, "18%", "80%"], [24, "18%", "80%"], [16, "100%"], [30, "38%", "58%"], [16, "100%"], [24, "48%", "48%"], [10, "100%"]],
  },

  {
    id: "blog-longform",
    name: "Blog Longform",
    category: "blog",
    description: "Hero stretto e lunga colonna lettura molto comoda.",
    rows: [[8, "28%", "70%"], [24, "72%", "26%"], [56, "72%", "26%"], [12, "100%"]],
  },
  {
    id: "blog-journal-grid",
    name: "Journal Grid",
    category: "blog",
    description: "Archivio editoriale con apertura mista e card regolari sotto.",
    rows: [[8, "100%"], [28, "62%", "36%"], [22, "32%", "32%", "32%"], [22, "32%", "32%", "32%"], [10, "100%"]],
  },
  {
    id: "blog-notes-sidebar",
    name: "Blog con Note",
    category: "blog",
    description: "Colonna articolo, note/sidebar e menu basso finale.",
    rows: [[8, "20%", "78%"], [20, "20%", "78%"], [48, "68%", "30%"], [14, "24%", "24%", "24%", "24%"], [10, "100%"]],
  },

  {
    id: "landing-saas",
    name: "Landing SaaS",
    category: "landing",
    description: "Hero split, feature row, prova sociale e CTA conclusiva.",
    rows: [[8, "26%", "72%"], [52, "50%", "48%"], [22, "32%", "32%", "32%"], [20, "100%"], [22, "48%", "48%"], [12, "100%"]],
  },
  {
    id: "landing-waitlist",
    name: "Waitlist Focus",
    category: "landing",
    description: "Pagina conversione semplice con header ridotto e focus centrale.",
    rows: [[8, "18%", "80%"], [18, "38%", "60%"], [54, "100%"], [10, "100%"]],
  },
  {
    id: "landing-event",
    name: "Landing Evento",
    category: "landing",
    description: "Hero, speakers, agenda e form finale in un flusso chiaro.",
    rows: [[8, "32%", "32%", "32%"], [44, "62%", "36%"], [18, "24%", "24%", "24%", "24%"], [28, "100%"], [20, "48%", "48%"], [10, "100%"]],
  },

  {
    id: "portfolio-case-study",
    name: "Case Study",
    category: "portfolio",
    description: "Racconto progetto alternato con immagini e testo in diagonale narrativa.",
    rows: [[8, "100%"], [30, "38%", "60%"], [34, "60%", "38%"], [34, "38%", "60%"], [10, "100%"]],
  },
  {
    id: "portfolio-gallery",
    name: "Portfolio Gallery",
    category: "portfolio",
    description: "Galleria lavori più asciutta, ma con hero superiore misto.",
    rows: [[8, "100%"], [28, "48%", "48%"], [24, "24%", "24%", "24%", "24%"], [24, "24%", "24%", "24%", "24%"], [10, "100%"]],
  },
  {
    id: "portfolio-sidebar-rail",
    name: "Portfolio con Rail",
    category: "portfolio",
    description: "Menu/progetti laterali e showcase centrale dei lavori.",
    rows: [[8, "22%", "76%"], [36, "22%", "76%"], [28, "22%", "36%", "36%"], [12, "100%"]],
  },

  {
    id: "corporate-pillars",
    name: "Corporate Pilastri",
    category: "corporate",
    description: "Hero aziendale, pilastri servizi e modulo fiducia.",
    rows: [[8, "100%"], [42, "64%", "34%"], [20, "32%", "32%", "32%"], [24, "48%", "48%"], [18, "100%"], [10, "100%"]],
  },
  {
    id: "corporate-onepage",
    name: "Corporate One Page",
    category: "corporate",
    description: "About, servizi, team e contatti in una pagina lineare.",
    rows: [[8, "100%"], [28, "100%"], [24, "32%", "32%", "32%"], [22, "100%"], [22, "48%", "48%"], [18, "100%"], [10, "100%"]],
  },
  {
    id: "corporate-sidebar-nav",
    name: "Corporate Sidebar",
    category: "corporate",
    description: "Impostazione più istituzionale con navigazione laterale alta.",
    rows: [[8, "20%", "78%"], [30, "20%", "78%"], [24, "20%", "38%", "38%"], [18, "100%"], [10, "100%"]],
  },

  {
    id: "creative-split-stage",
    name: "Split Stage",
    category: "creative",
    description: "Taglio forte in alto e moduli secondari sotto in contrasto.",
    rows: [[8, "100%"], [52, "60%", "40%"], [18, "100%"], [22, "34%", "32%", "34%"], [10, "100%"]],
  },
  {
    id: "creative-z-flow",
    name: "Z Flow",
    category: "creative",
    description: "Alternanza narrativa immagine/testo con ritmo forte.",
    rows: [[8, "100%"], [34, "58%", "38%"], [34, "38%", "58%"], [34, "58%", "38%"], [10, "100%"]],
  },
  {
    id: "creative-rails",
    name: "Creative Rails",
    category: "creative",
    description: "Centro largo e due colonne creative di servizio ai lati.",
    rows: [[8, "100%"], [40, "18%", "62%", "18%"], [24, "18%", "30%", "30%", "18%"], [18, "100%"], [10, "100%"]],
  },

  {
    id: "minimal-hero-card",
    name: "Minimal Hero + Card",
    category: "minimal",
    description: "Apertura sobria e blocco unico centrale ben respirato.",
    rows: [[6, "32%", "66%"], [54, "100%"], [24, "100%"], [8, "100%"]],
  },
  {
    id: "minimal-reading",
    name: "Minimal Reading",
    category: "minimal",
    description: "Colonna lettura pura, quasi senza distrazioni.",
    rows: [[6, "100%"], [16, "100%"], [64, "100%"], [8, "100%"]],
  },
  {
    id: "minimal-side-note",
    name: "Minimal Side Note",
    category: "minimal",
    description: "Layout essenziale con piccola colonna laterale di supporto.",
    rows: [[6, "18%", "80%"], [20, "72%", "26%"], [52, "72%", "26%"], [8, "100%"]],
  },

  {
    id: "fullwidth-bands",
    name: "Full Width Bands",
    category: "fullwidth",
    description: "Fasce piene alternate, senza gabbia stretta ripetitiva.",
    rows: [[8, "28%", "70%"], [60, "100%"], [18, "100%"], [28, "100%"], [18, "100%"], [24, "100%"], [10, "100%"]],
  },
  {
    id: "fullwidth-broadcast",
    name: "Full Width Broadcast",
    category: "fullwidth",
    description: "Barra breaking e pacchetto centrale, ma con taglio molto largo.",
    rows: [[8, "18%", "62%", "18%"], [5, "100%"], [48, "100%"], [20, "24%", "52%", "24%"], [20, "100%"], [10, "100%"]],
  },
  {
    id: "fullwidth-split-ribbon",
    name: "Full Width Split Ribbon",
    category: "fullwidth",
    description: "Hero split alto e bande larghissime più sotto.",
    rows: [[8, "100%"], [50, "58%", "40%"], [18, "24%", "24%", "24%", "24%"], [26, "100%"], [20, "48%", "48%"], [10, "100%"]],
  },

  {
    id: "showcase-panels",
    name: "Showcase Panels",
    category: "showcase",
    description: "Hero largo e pannelli sotto, pulito ma già grafico.",
    rows: [[8, "24%", "74%"], [56, "100%"], [26, "34%", "32%", "34%"], [20, "100%"], [10, "100%"]],
  },
  {
    id: "showcase-poster",
    name: "Showcase Poster",
    category: "showcase",
    description: "Taglio manifesto con poche sezioni grandi e molto impatto.",
    rows: [[8, "100%"], [66, "100%"], [18, "100%"], [20, "48%", "48%"], [10, "100%"]],
  },
  {
    id: "showcase-side-menu",
    name: "Showcase Side Menu",
    category: "showcase",
    description: "Menu laterale/design rail e palco centrale visivo.",
    rows: [[8, "20%", "78%"], [44, "20%", "78%"], [22, "20%", "38%", "38%"], [10, "100%"]],
  },
];
