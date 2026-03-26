import { createDefaultStyle, type Block, type BlockStyle, type BlockType } from "@/lib/types/block";

type TemplateCategory =
  | "Editorial"
  | "Portfolio"
  ;

export interface DashboardTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  audience: string;
  mood: string;
  description: string;
  blocksSummary: string[];
  previewScale: number;
  previewHeight: number;
  blocks: Block[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Editorial",
  "Portfolio",
];

function spacing(all: string) {
  return { top: all, right: all, bottom: all, left: all };
}

function makeSvgDataUrl(title: string, colors: [string, string, string]) {
  const [a, b, c] = colors;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${a}" />
          <stop offset="55%" stop-color="${b}" />
          <stop offset="100%" stop-color="${c}" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#g)" />
      <circle cx="1280" cy="180" r="180" fill="rgba(255,255,255,0.18)" />
      <circle cx="220" cy="720" r="220" fill="rgba(255,255,255,0.12)" />
      <text x="120" y="760" fill="rgba(255,255,255,0.78)" font-family="Arial, sans-serif" font-size="88" font-weight="700">${title}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeTextHtml(kicker: string, title: string, body: string) {
  return `
    <div>
      <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#64748b;margin-bottom:10px">${kicker}</div>
      <h2 style="font-size:34px;line-height:1.08;letter-spacing:-.03em;margin:0 0 14px 0;color:#0f172a">${title}</h2>
      <p style="font-size:16px;line-height:1.7;color:#475569;margin:0">${body}</p>
    </div>
  `;
}

function createBlockFactory(prefix: string) {
  let count = 0;

  return function makeBlock(
    type: BlockType,
    label: string,
    props: Record<string, unknown> = {},
    styleOverrides?: Partial<BlockStyle>,
    children: Block[] = []
  ): Block {
    count += 1;
    return {
      id: `${prefix}-${count}`,
      type,
      label,
      props,
      style: createDefaultStyle(styleOverrides),
      shape: null,
      responsive: {},
      animation: null,
      children,
      locked: false,
      hidden: false,
      dataSource: undefined,
    };
  };
}

function section(make: ReturnType<typeof createBlockFactory>, label: string, children: Block[], background = "#ffffff") {
  return make(
    "section",
    label,
    { tag: "section" },
    {
      layout: {
        display: "block",
        width: "100%",
        maxWidth: "100%",
        padding: { top: "56px", right: "0", bottom: "56px", left: "0" },
        margin: spacing("0"),
      },
      background: { type: "color", value: background },
    },
    children
  );
}

function container(make: ReturnType<typeof createBlockFactory>, label: string, children: Block[], maxWidth = "1180px") {
  return make(
    "container",
    label,
    { tag: "div" },
    {
      layout: {
        display: "block",
        width: "100%",
        maxWidth,
        padding: { top: "0", right: "24px", bottom: "0", left: "24px" },
        margin: { top: "0", right: "auto", bottom: "0", left: "auto" },
      },
    },
    children
  );
}

function columns(
  make: ReturnType<typeof createBlockFactory>,
  label: string,
  children: Block[],
  widths: string[] = ["50%", "50%"],
  gap = "28px"
) {
  return make(
    "columns",
    label,
    { tag: "div", columnWidths: widths, stackOnMobile: true },
    {
      layout: {
        display: "flex",
        width: "100%",
        maxWidth: "100%",
        gap,
        alignItems: "stretch",
        padding: spacing("0"),
        margin: spacing("0"),
      },
    },
    children
  );
}

function navigation(
  make: ReturnType<typeof createBlockFactory>,
  logoText: string,
  labels: string[],
  accent: string,
  variant: string,
  placement = "top"
) {
  return make("navigation", "Navigation", {
    mode: "custom",
    logoText,
    placement,
    variant,
    layout: placement === "left" || placement === "right" ? "vertical" : "horizontal",
    showIcons: true,
    showBadges: true,
    items: labels.map((label, index) => ({
      id: `${logoText}-${index}`,
      label,
      url: "#",
      icon: index === 0 ? "home" : index === 1 ? "newspaper" : index === 2 ? "play" : "layers",
      badge: index === 1 ? "Live" : "",
    })),
    ctaText: "Apri",
    ctaUrl: "#",
  }, {
    layout: {
      display: "flex",
      width: "100%",
      maxWidth: "100%",
      padding: { top: "18px", right: "28px", bottom: "18px", left: "28px" },
      margin: spacing("0"),
      justifyContent: "space-between",
      alignItems: "center",
    },
    background: { type: "color", value: variant === "floating" ? "rgba(15,23,42,0.78)" : "#ffffff" },
    typography: { color: variant === "floating" ? "#f8fafc" : "#0f172a" },
    border: { radius: variant === "floating" ? "20px" : "0" },
    shadow: variant === "floating" ? "0 24px 50px rgba(15,23,42,0.22)" : "0 1px 0 rgba(15,23,42,0.06)",
    customCss: `--e-color-primary:${accent};`,
  });
}

function hero(
  make: ReturnType<typeof createBlockFactory>,
  title: string,
  subtitle: string,
  imageTitle: string,
  colors: [string, string, string],
  accent: string,
  panelStyle = "glass",
  align = "left"
) {
  return make("hero", "Hero", {
    eyebrow: "Template reale",
    title,
    subtitle,
    ctaText: "Scopri di più",
    ctaUrl: "#",
    backgroundImage: makeSvgDataUrl(imageTitle, colors),
    overlayOpacity: 0.35,
    overlayColor: "#020617",
    contentPosition: align,
    textAlign: align === "center" ? "center" : "left",
    contentWidth: "780px",
    panelStyle,
    height: "620px",
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: { top: "48px", right: "24px", bottom: "48px", left: "24px" },
      margin: spacing("0"),
      minHeight: "620px",
    },
    customCss: `--e-color-primary:${accent};`,
  });
}

function textBlock(
  make: ReturnType<typeof createBlockFactory>,
  kicker: string,
  title: string,
  body: string
) {
  return make("text", title, {
    content: makeTextHtml(kicker, title, body),
  });
}

function quote(make: ReturnType<typeof createBlockFactory>, text: string, author: string) {
  return make("quote", "Quote", {
    text,
    author,
    source: "Redazione template",
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: { top: "18px", right: "24px", bottom: "18px", left: "24px" },
      margin: spacing("0"),
    },
    background: { type: "color", value: "#f8fafc" },
    border: { radius: "20px", width: "1px", style: "solid", color: "#e2e8f0" },
  });
}

function banner(make: ReturnType<typeof createBlockFactory>, label: string, colors: [string, string, string], width: number, height: number) {
  return make("banner-ad", "Banner", {
    label,
    width,
    height,
    fallbackImage: makeSvgDataUrl(label, colors),
    fallbackUrl: "#",
    showLabel: true,
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
  });
}

function gallery(
  make: ReturnType<typeof createBlockFactory>,
  label: string,
  titles: string[],
  colors: Array<[string, string, string]>,
  layoutMode = "grid"
) {
  return make("image-gallery", label, {
    columns: layoutMode === "masonry" ? 3 : 3,
    gap: "16px",
    layout: layoutMode,
    aspectRatio: "4/3",
    showCaptions: true,
    captionPosition: layoutMode === "grid" ? "overlay" : "below",
    hoverEffect: "zoom",
    items: titles.map((title, index) => ({
      url: makeSvgDataUrl(title, colors[index % colors.length]),
      alt: title,
      caption: title,
      link: '#',
      badge: index % 3 === 0 ? 'Focus' : '',
      overlay: {
        enabled: true,
        title,
        description: 'Elemento reale del template CMS, modificabile dal pannello props.',
        position: 'bottom',
      },
      buttons: [{ id: `${label}-gallery-cta-${index}`, text: 'Apri', url: '#', style: 'primary' }],
    })),
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
  });
}

function slideshow(
  make: ReturnType<typeof createBlockFactory>,
  label: string,
  slides: Array<{ title: string; description: string; colors: [string, string, string] }>
) {
  return make("slideshow", label, {
    height: "520px",
    autoplay: false,
    showDots: true,
    showArrows: true,
    contentPosition: "bottom-left",
    panelStyle: "glass",
    slides: slides.map((slide, index) => ({
      id: `${label}-${index}`,
      image: makeSvgDataUrl(slide.title, slide.colors),
      title: slide.title,
      description: slide.description,
      overlay: { enabled: true, color: "rgba(2,6,23,0.28)" },
      buttons: [{ text: "Apri", url: "#", style: "primary" }],
    })),
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
  });
}

function social(make: ReturnType<typeof createBlockFactory>, title: string, layoutStyle = "card") {
  return make("social", "Social", {
    title,
    description: "Distribuzione canali, profili e touchpoint editoriali",
    layoutStyle,
    colorMode: layoutStyle === "glass" ? "brand" : "soft",
    showLabels: true,
    showHandles: true,
    showBadges: true,
    platforms: [
      { platform: "instagram", label: "Instagram", handle: "@valle.mag", url: "#", badge: "12K", enabled: true },
      { platform: "telegram", label: "Telegram", handle: "@desk_live", url: "#", badge: "Live", enabled: true },
      { platform: "youtube", label: "YouTube", handle: "TG Channel", url: "#", badge: "Video", enabled: true },
    ],
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
  });
}

function search(make: ReturnType<typeof createBlockFactory>, placeholder: string) {
  return make("search-bar", "Search", {
    placeholder,
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
  });
}

function comparison(make: ReturnType<typeof createBlockFactory>, label: string, left: string, right: string) {
  return make("comparison", label, {
    beforeImage: left,
    afterImage: right,
    beforeLabel: "Prima",
    afterLabel: "Dopo",
    initialPosition: 44,
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
    border: { radius: "24px" },
  });
}

function timeline(make: ReturnType<typeof createBlockFactory>, items: Array<{ date: string; title: string; description: string }>) {
  return make("timeline", "Timeline", {
    layout: "stacked",
    lineColor: "#8b5cf6",
    items,
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
  });
}

function map(make: ReturnType<typeof createBlockFactory>, address: string, lat: number, lng: number) {
  return make("map", "Map", {
    address,
    lat,
    lng,
    zoom: 13,
    markerTitle: address,
    height: "420px",
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
    border: { radius: "22px" },
  });
}

function carousel(make: ReturnType<typeof createBlockFactory>, title: string, colors: Array<[string, string, string]>) {
  return make("carousel", "Carousel", {
    cardWidth: "320px",
    gap: "18px",
    showArrows: true,
    showDots: true,
    showCategory: true,
    showExcerpt: true,
    cardStyle: "elevated",
    items: ["Primo focus", "Secondo focus", "Terzo focus", "Quarto focus"].map((item, index) => ({
      image: makeSvgDataUrl(item, colors[index % colors.length]),
      title: `${title} ${index + 1}`,
      excerpt: "Blocco reale del CMS usato come preview di template, non un disegno statico.",
      category: index % 2 === 0 ? "Feature" : "Story",
      date: "25/03/2026",
      author: "Desk",
      url: "#",
      buttons: [{ id: `${title}-cta-${index}`, text: 'Apri', url: '#', style: 'primary' }],
    })),
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
  });
}

function accordion(make: ReturnType<typeof createBlockFactory>, items: Array<{ title: string; content: string }>) {
  return make("accordion", "Accordion", {
    items,
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
  });
}

function footer(make: ReturnType<typeof createBlockFactory>, brand: string, description: string, socialTone = "telegram") {
  return make("footer", "Footer", {
    mode: "custom",
    variant: "columns",
    logoUrl: "",
    description,
    columns: [
      { title: "Sezioni", links: [{ label: "Home", url: "#" }, { label: "News", url: "#" }, { label: "Video", url: "#" }] },
      { title: "Progetto", links: [{ label: "Chi siamo", url: "#" }, { label: "Contatti", url: "#" }, { label: "Pubblicità", url: "#" }] },
      { title: "Servizi", text: "Newsletter, app, segnalazioni e community." },
    ],
    links: [{ label: "Privacy", url: "#" }, { label: "Cookie", url: "#" }, { label: "Credits", url: "#" }],
    socialLinks: [{ platform: socialTone, url: "#" }, { platform: "instagram", url: "#" }, { platform: "youtube", url: "#" }],
    newsletter: { enabled: false, title: "", description: "", buttonText: "Iscriviti", formSlug: "" },
    copyright: `© 2026 ${brand}. Template CMS demo.`,
  }, {
    layout: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: spacing("0"),
      margin: spacing("0"),
    },
    background: { type: "color", value: "#0f172a" },
    typography: { color: "#cbd5e1" },
  });
}

function buildTemplatePage(
  id: string,
  config: Omit<DashboardTemplate, "blocks" | "previewScale" | "previewHeight">
): DashboardTemplate {
  const make = createBlockFactory(id);
  const baseColors: Array<[string, string, string]> = [
    ["#1d4ed8", "#2563eb", "#38bdf8"],
    ["#7c3aed", "#9333ea", "#ec4899"],
    ["#0f766e", "#14b8a6", "#67e8f9"],
    ["#b91c1c", "#ef4444", "#fb7185"],
  ];

  const isVideoDriven = config.id === "video-command" || config.id === "tg-studio";
  const commonNav = navigation(make, config.name, ["Home", "Focus", "Stories", "Video", "Contatti"], "#8b0000", isVideoDriven ? "floating" : "boxed");
  const commonFooter = footer(make, config.name, config.description, isVideoDriven ? "youtube" : "telegram");

  let blocks: Block[] = [];

  switch (config.id) {
    case "newswire-prime":
      blocks = [
        commonNav,
        hero(make, "Homepage newsroom ad alta priorità", "Ticker, fasce notizie, moduli veloci e spazio banner per una testata che aggiorna tutto il giorno.", "Newswire Prime", ["#0f172a", "#1d4ed8", "#38bdf8"], "#1d4ed8", "glass", "left"),
        section(make, "News blocks", [
          container(make, "News container", [
            columns(make, "News columns", [
              textBlock(make, "Focus", "Apertura di giornata", "Titolo forte, sommario pulito, taglio rapido e spazio a notizie correlate in fondo al blocco."),
              slideshow(make, "Slideshow", [
                { title: "Cronaca live", description: "Una fascia aggiornata con immagini, titolo e call to action.", colors: baseColors[0] },
                { title: "Sport in primo piano", description: "Seconda storia pronta da ruotare nella homepage.", colors: baseColors[1] },
              ]),
            ], ["34%", "66%"]),
            banner(make, "ADV top newsroom", ["#0f172a", "#334155", "#64748b"], 970, 250),
            carousel(make, "Stories", baseColors),
          ]),
        ], "#f8fafc"),
        commonFooter,
      ];
      break;
    case "magazine-cover":
      blocks = [
        navigation(make, "Magazine Cover", ["Home", "Cover", "Culture", "Moda", "Design"], "#b91c1c", "minimal"),
        hero(make, "Cover story premium e ritmo più fotografico", "Una homepage magazine con moduli visuali, quote editoriali e spazi di respiro più lenti e curati.", "Magazine Cover", ["#111827", "#b91c1c", "#f97316"], "#b91c1c", "solid-dark", "center"),
        section(make, "Magazine grid", [
          container(make, "Magazine container", [
            gallery(make, "Gallery", ["Cover story", "Rubrica", "Scene", "Studio", "Edit", "Portrait"], baseColors, "masonry"),
            quote(make, "Le homepage magazine devono respirare, non solo accumulare moduli.", "Direzione artistica"),
          ]),
        ], "#fff7ed"),
        commonFooter,
      ];
      break;
    case "video-command":
      blocks = [
        navigation(make, "Video Command", ["Live", "TG", "Clip", "Playlists", "Shorts"], "#0ea5e9", "floating"),
        slideshow(make, "Video hero", [
          { title: "TG ORE 20", description: "Edizione serale con card video, riassunti e call to action verso la diretta.", colors: ["#020617", "#0ea5e9", "#38bdf8"] },
          { title: "Studio centrale", description: "Seconda fascia per breaking e video in evidenza.", colors: ["#111827", "#2563eb", "#7dd3fc"] },
        ]),
        section(make, "Video strips", [
          container(make, "Video container", [
            carousel(make, "Video rail", [["#0f172a", "#1d4ed8", "#38bdf8"], ["#1e293b", "#0ea5e9", "#67e8f9"], ["#111827", "#3b82f6", "#93c5fd"]]),
            social(make, "Canali e distribuzione video", "toolbar"),
          ]),
        ], "#f8fafc"),
        commonFooter,
      ];
      break;
    case "glass-launch":
      blocks = [
        navigation(make, "Glass Launch", ["Prodotto", "Metriche", "FAQ", "Prezzi", "Contatti"], "#9333ea", "floating"),
        hero(make, "Landing contemporanea con superfici glass", "Pensata per conversione, benefit, testimonianze e funnel chiaro verso la CTA principale.", "Glass Launch", ["#0f172a", "#7c3aed", "#ec4899"], "#9333ea", "glass", "left"),
        section(make, "Launch sections", [
          container(make, "Launch container", [
            columns(make, "Benefits", [
              textBlock(make, "Benefit", "Valore chiaro sopra la piega", "Messaggio principale forte, numeri credibili, seconda fascia benefit e proof visuale."),
              comparison(make, "Before after", makeSvgDataUrl("Prima", ["#0f172a", "#334155", "#64748b"]), makeSvgDataUrl("Dopo", ["#7c3aed", "#9333ea", "#ec4899"])),
            ]),
            accordion(make, [
              { title: "Quanto è personalizzabile?", content: "<p>Molto: è un template CMS reale, non un mock.</p>" },
              { title: "Posso rifinirlo in editor?", content: "<p>Sì, nasce proprio per passare poi al dettaglio blocco per blocco.</p>" },
            ]),
          ]),
        ], "#faf5ff"),
        commonFooter,
      ];
      break;
    case "split-headline":
      blocks = [
        navigation(make, "Split Headline", ["Home", "Brand", "Servizi", "News", "Team"], "#14b8a6", "boxed"),
        hero(make, "Hero spezzato per corporate newsroom", "Layout chiaro, doppia gerarchia e spazio a servizi, metriche e notizie di brand.", "Split Headline", ["#1f2937", "#14b8a6", "#67e8f9"], "#14b8a6", "solid-light", "left"),
        section(make, "Split modules", [
          container(make, "Split container", [
            columns(make, "Split grid", [
              textBlock(make, "Servizi", "Blocchi corporate con tono editoriale", "Perfetto per chi vuole tenere insieme brand, newsroom e pagine istituzionali."),
              social(make, "Presenza brand", "card"),
            ]),
          ]),
        ], "#f0fdfa"),
        commonFooter,
      ];
      break;
    case "sidebar-insight":
      blocks = [
        navigation(make, "Sidebar Insight", ["Analisi", "Opinioni", "Autori", "Temi", "Archivi"], "#475569", "rail", "left"),
        section(make, "Insight header", [
          container(make, "Insight container", [
            columns(make, "Insight split", [
              textBlock(make, "Longform", "Pagina editoriale con colonna guida e contenuto principale", "Utile per rubriche, blog professionali, essays e pubblicazioni che lavorano su testo, quote e guide tematiche."),
              quote(make, "Un buon template di analisi deve privilegiare lettura e gerarchia, non rumore.", "Desk opinioni"),
            ], ["62%", "38%"]),
          ]),
        ], "#ffffff"),
        section(make, "Insight timeline", [
          container(make, "Insight timeline container", [
            timeline(make, [
              { date: "08:00", title: "Brief del mattino", description: "Apertura ragionata con angolo principale." },
              { date: "11:30", title: "Analisi estesa", description: "Approfondimento e citazioni chiave." },
              { date: "18:00", title: "Commento finale", description: "Sintesi e rilancio newsletter." },
            ]),
          ]),
        ], "#f8fafc"),
        commonFooter,
      ];
      break;
    case "event-pulse":
      blocks = [
        navigation(make, "Event Pulse", ["Agenda", "Festival", "Mappe", "Biglietti", "Sponsor"], "#f59e0b", "pills"),
        hero(make, "Homepage eventi con ritmo da agenda", "Date, card programma, mappe, highlight sponsor e moduli rapidi per iscrizione e partecipazione.", "Event Pulse", ["#1e1b4b", "#f59e0b", "#fde68a"], "#f59e0b", "glass", "left"),
        section(make, "Events modules", [
          container(make, "Events container", [
            columns(make, "Map and timeline", [
              map(make, "Centro eventi, Bergamo", 45.6983, 9.6773),
              timeline(make, [
                { date: "21 MAR", title: "Apertura porte", description: "Start area expo e networking." },
                { date: "22 MAR", title: "Main stage", description: "Talk, panel e keynote." },
                { date: "23 MAR", title: "After hours", description: "Closing e community night." },
              ]),
            ]),
          ]),
        ], "#fffbeb"),
        commonFooter,
      ];
      break;
    case "sport-scoreline":
      blocks = [
        navigation(make, "Scoreline", ["Match day", "Risultati", "Video", "Classifiche", "Live"], "#22c55e", "underline"),
        hero(make, "Sport dashboard per risultati e highlight", "Hero partita, moduli risultati, rail video e spazi rapidi per numeri e card match day.", "Scoreline", ["#111827", "#22c55e", "#86efac"], "#22c55e", "solid-dark", "left"),
        section(make, "Sport content", [
          container(make, "Sport container", [
            carousel(make, "Highlights", [["#111827", "#22c55e", "#86efac"], ["#0f172a", "#16a34a", "#4ade80"], ["#14532d", "#22c55e", "#bbf7d0"]]),
            banner(make, "ADV sport", ["#0f172a", "#14532d", "#22c55e"], 970, 250),
          ]),
        ], "#f0fdf4"),
        commonFooter,
      ];
      break;
    case "local-paper":
      blocks = [
        navigation(make, "Local Paper", ["Cronaca", "Comuni", "Meteo", "Eventi", "Sport"], "#0f766e", "boxed"),
        hero(make, "Cronaca locale, agenda e vita di territorio", "Template da giornale locale con focus cronaca, agenda, meteo, editoriali e prossimità.", "Local Paper", ["#3f1d0f", "#0f766e", "#fde68a"], "#0f766e", "glass", "left"),
        section(make, "Local layout", [
          container(make, "Local container", [
            columns(make, "Local columns", [
              textBlock(make, "Territorio", "Notizie di valle e fascia servizi", "Ottimo per testate locali che devono tenere insieme cronaca, utilità e community."),
              gallery(make, "Local gallery", ["Meteo", "Comuni", "Sentieri"], [["#0f766e", "#14b8a6", "#67e8f9"], ["#92400e", "#f59e0b", "#fde68a"], ["#14532d", "#16a34a", "#86efac"]], "grid"),
            ]),
          ]),
        ], "#fefce8"),
        commonFooter,
      ];
      break;
    case "city-directory":
      blocks = [
        navigation(make, "City Directory", ["Attività", "Mangiare", "Dormire", "Guide", "Mappe"], "#f97316", "pills"),
        section(make, "Directory intro", [
          container(make, "Directory container", [
            search(make, "Cerca attività, luoghi, guide e servizi"),
            columns(make, "Directory body", [
              map(make, "Bergamo centro", 45.698264, 9.677269),
              textBlock(make, "Directory", "Portale servizi, listing e guide locali", "Ricerca veloce, mappa, sezioni utili, recensioni e pagine attività in un layout ordinato."),
            ]),
          ]),
        ], "#fff7ed"),
        commonFooter,
      ];
      break;
    case "podcast-room":
      blocks = [
        navigation(make, "Podcast Room", ["Episodi", "Serie", "Speaker", "Transcript", "Community"], "#a855f7", "floating"),
        hero(make, "Hub podcast e audio magazine", "Pagina dedicata a episodi, player, speaker, highlight e contenuti seriali.", "Podcast Room", ["#09090b", "#7c3aed", "#e879f9"], "#a855f7", "solid-dark", "left"),
        section(make, "Podcast modules", [
          container(make, "Podcast container", [
            carousel(make, "Episodes", [["#0f172a", "#7c3aed", "#c084fc"], ["#1e1b4b", "#a855f7", "#e9d5ff"], ["#111827", "#8b5cf6", "#ddd6fe"]]),
            social(make, "Canali audio", "card"),
          ]),
        ], "#faf5ff"),
        commonFooter,
      ];
      break;
    case "membership-plus":
      blocks = [
        navigation(make, "Membership Plus", ["Vantaggi", "Piani", "FAQ", "Community", "Accedi"], "#d97706", "boxed"),
        hero(make, "Homepage membership e abbonamenti premium", "Pensata per pricing, vantaggi, proof sociale e percorso di conversione chiaro.", "Membership Plus", ["#111827", "#d97706", "#fdba74"], "#d97706", "solid-light", "left"),
        section(make, "Membership body", [
          container(make, "Membership container", [
            comparison(make, "Plans", makeSvgDataUrl("Basic", ["#1f2937", "#374151", "#6b7280"]), makeSvgDataUrl("Club", ["#78350f", "#d97706", "#fdba74"])),
            accordion(make, [
              { title: "Cosa include il piano Plus?", content: "<p>Accesso premium, community, newsletter e contenuti dedicati.</p>" },
              { title: "Posso personalizzarlo?", content: "<p>Sì, come tutti i template veri del CMS.</p>" },
            ]),
          ]),
        ], "#fffaf0"),
        commonFooter,
      ];
      break;
    case "travel-journal":
      blocks = [
        navigation(make, "Travel Journal", ["Destinazioni", "Guide", "Gallery", "Mappe", "Itinerari"], "#06b6d4", "minimal"),
        hero(make, "Template travel con immagini, mappe e percorsi", "Pensato per guide di viaggio, destinazioni, reportage e itinerari editoriali.", "Travel Journal", ["#0c4a6e", "#06b6d4", "#67e8f9"], "#06b6d4", "glass", "center"),
        section(make, "Travel body", [
          container(make, "Travel container", [
            gallery(make, "Travel gallery", ["Lago", "Sentiero", "Borgo", "Panorama", "Stazione", "Rifugio"], [["#0c4a6e", "#0284c7", "#67e8f9"], ["#14532d", "#22c55e", "#86efac"], ["#78350f", "#f59e0b", "#fde68a"]], "grid"),
            map(make, "Val Brembana", 45.9179, 9.7502),
          ]),
        ], "#ecfeff"),
        commonFooter,
      ];
      break;
    case "corporate-pulse":
      blocks = [
        navigation(make, "Corporate Pulse", ["Company", "Servizi", "Newsroom", "Team", "Contatti"], "#2563eb", "boxed"),
        hero(make, "Corporate CMS con taglio editoriale", "Unisce homepage brand, newsroom, metriche, servizi e sezioni istituzionali.", "Corporate Pulse", ["#0f172a", "#2563eb", "#93c5fd"], "#2563eb", "solid-light", "left"),
        section(make, "Corporate modules", [
          container(make, "Corporate container", [
            columns(make, "Corporate split", [
              textBlock(make, "Brand", "Progetto corporate con sezioni chiare", "La struttura tiene insieme presentazione, trust, team e news senza sembrare rigida."),
              social(make, "Canali e touchpoint", "toolbar"),
            ]),
            banner(make, "ADV sponsor", ["#0f172a", "#2563eb", "#93c5fd"], 970, 250),
          ]),
        ], "#eff6ff"),
        commonFooter,
      ];
      break;
    case "fashion-grid":
      blocks = [
        navigation(make, "Fashion Grid", ["Cover", "Trend", "Beauty", "Look", "Culture"], "#ec4899", "minimal"),
        hero(make, "Lifestyle e moda con ritmo visuale forte", "Cover story, mosaici fotografici, quote, trend blocks e sezioni shopping.", "Fashion Grid", ["#111111", "#ec4899", "#f9a8d4"], "#ec4899", "solid-dark", "center"),
        section(make, "Fashion gallery", [
          container(make, "Fashion container", [
            gallery(make, "Fashion gallery", ["Cover", "Trend", "Beauty", "Runway", "Details", "Studio"], [["#111111", "#ec4899", "#fbcfe8"], ["#4c0519", "#db2777", "#f9a8d4"], ["#831843", "#ec4899", "#fce7f3"]], "masonry"),
            quote(make, "Il template lifestyle deve essere editoriale, non solo decorativo.", "Fashion desk"),
          ]),
        ], "#fff1f2"),
        commonFooter,
      ];
      break;
    case "minimal-brief":
      blocks = [
        navigation(make, "Minimal Brief", ["Home", "Brief", "Selected", "Info", "Contact"], "#111827", "minimal"),
        hero(make, "Template minimale, tipografico e molto arioso", "Pensato per studi, progetti editoriali piccoli o pagine che vogliono sottrarre rumore visivo.", "Minimal Brief", ["#ffffff", "#e5e7eb", "#cbd5e1"], "#111827", "solid-light", "left"),
        section(make, "Minimal content", [
          container(make, "Minimal container", [
            columns(make, "Minimal split", [
              textBlock(make, "Brief", "Pochi moduli, molta gerarchia", "Qui conta il ritmo tipografico e la pulizia generale del layout."),
              textBlock(make, "Selected", "Spazio a blocchi essenziali", "Un template perfetto per identità curate, portfolio leggeri e pagine manifesto."),
            ]),
          ]),
        ], "#ffffff"),
        commonFooter,
      ];
      break;
    case "tg-studio":
      blocks = [
        navigation(make, "TG Studio", ["Live", "Edizioni", "Clip", "Palinsesto", "Replay"], "#ef4444", "floating"),
        slideshow(make, "TG slideshow", [
          { title: "TG ORE 20", description: "Edizione principale con focus breaking, studio e video rail.", colors: ["#020617", "#ef4444", "#fb7185"] },
          { title: "Studio centrale", description: "Seconda scena per palinsesto e approfondimenti.", colors: ["#111827", "#dc2626", "#fca5a5"] },
        ]),
        section(make, "TG modules", [
          container(make, "TG container", [
            timeline(make, [
              { date: "07:30", title: "Prima edizione", description: "Apertura del desk mattino." },
              { date: "13:00", title: "Edizione pranzo", description: "Fast news e servizio rapido." },
              { date: "20:00", title: "Edizione serale", description: "Blocco studio e approfondimenti." },
            ]),
          ]),
        ], "#fff1f2"),
        commonFooter,
      ];
      break;
    case "market-watch":
      blocks = [
        navigation(make, "Market Watch", ["Mercati", "Analisi", "Watchlist", "Dati", "Newsletter"], "#10b981", "underline"),
        hero(make, "Template finanza e mercati con taglio dati-first", "Usabile per testate economia, mercati, indicatori, watchlist e commento giornaliero.", "Market Watch", ["#0f172a", "#10b981", "#6ee7b7"], "#10b981", "solid-dark", "left"),
        section(make, "Market modules", [
          container(make, "Market container", [
            carousel(make, "Watchlist", [["#0f172a", "#10b981", "#6ee7b7"], ["#052e16", "#16a34a", "#86efac"], ["#1f2937", "#22c55e", "#bbf7d0"]]),
            textBlock(make, "Commento", "Analisi, dati e blocchi sintetici", "Template ideale per economici, finanza personale o dashboard editoriali di mercato."),
          ]),
        ], "#ecfdf5"),
        commonFooter,
      ];
      break;
    case "creator-portfolio":
      blocks = [
        navigation(make, "Creator Portfolio", ["Works", "Story", "Studio", "Press", "Contact"], "#8b5cf6", "boxed"),
        hero(make, "Portfolio editoriale per creativi e studi", "Manifesto, lavori selezionati, case history e contatti in un template più narrativo.", "Creator Portfolio", ["#111827", "#8b5cf6", "#c4b5fd"], "#8b5cf6", "glass", "left"),
        section(make, "Portfolio body", [
          container(make, "Portfolio container", [
            gallery(make, "Portfolio gallery", ["Case A", "Case B", "Case C", "Case D", "Case E", "Case F"], [["#111827", "#8b5cf6", "#ddd6fe"], ["#1e1b4b", "#7c3aed", "#c4b5fd"], ["#312e81", "#6366f1", "#a5b4fc"]], "grid"),
            quote(make, "Un buon portfolio non mostra solo lavori: mostra criterio e direzione.", "Studio creativo"),
          ]),
        ], "#f5f3ff"),
        commonFooter,
      ];
      break;
    case "newsletter-desk":
      blocks = [
        navigation(make, "Newsletter Desk", ["Issue", "Themes", "Archive", "Authors", "Join"], "#38bdf8", "minimal"),
        hero(make, "Homepage per prodotti newsletter e community mail-first", "Issue principali, temi ricorrenti, archivi, autori e call to action verso iscrizione.", "Newsletter Desk", ["#172554", "#38bdf8", "#7dd3fc"], "#38bdf8", "solid-dark", "left"),
        section(make, "Newsletter modules", [
          container(make, "Newsletter container", [
            columns(make, "Newsletter split", [
              textBlock(make, "Edizioni", "Template per numeri, temi e serialità", "Molto utile per verticali email-first e prodotti editoriali ricorrenti."),
              social(make, "Community e canali", "card"),
            ]),
          ]),
        ], "#f0f9ff"),
        commonFooter,
      ];
      break;
    default:
      blocks = [commonNav, hero(make, config.name, config.description, config.name, ["#0f172a", "#334155", "#64748b"], "#8b0000"), commonFooter];
  }

  return {
    ...config,
    previewScale: 0.24,
    previewHeight: 420,
    blocks,
  };
}

export const DASHBOARD_TEMPLATE_LIBRARY: DashboardTemplate[] = [
  buildTemplatePage("newswire-prime", {
    id: "newswire-prime",
    name: "Newswire Prime",
    category: "Editorial",
    audience: "Quotidiano digitale",
    mood: "veloce, ordinato, autorevole",
    description: "Homepage newsroom con fasce breaking, hero forte, rail contenuti e spazio advertising.",
    blocksSummary: ["Navigation", "Hero", "Slideshow", "Banner", "Carousel", "Footer"],
  }),
  buildTemplatePage("magazine-cover", {
    id: "magazine-cover",
    name: "Magazine Cover",
    category: "Editorial",
    audience: "Rivista digitale",
    mood: "premium, visuale, editoriale",
    description: "Cover homepage con fotografia dominante, ritmo magazine e griglia visiva più curata.",
    blocksSummary: ["Navigation", "Hero", "Gallery", "Quote", "Footer"],
  }),
  buildTemplatePage("video-command", {
    id: "video-command",
    name: "Video Command",
    category: "Editorial",
    audience: "Redazione video",
    mood: "broadcast, urgente, brillante",
    description: "Template video-first per TG, clip, playlists e distribuzione canali.",
    blocksSummary: ["Navigation", "Slideshow", "Carousel", "Social", "Footer"],
  }),
  buildTemplatePage("glass-launch", {
    id: "glass-launch",
    name: "Studio Glasscase",
    category: "Portfolio",
    audience: "Studio creativo",
    mood: "moderno, glass, case-study",
    description: "Portfolio per studi creativi con hero glass, confronto progetto e sezioni FAQ/approccio.",
    blocksSummary: ["Navigation", "Hero", "Comparison", "Accordion", "Footer"],
  }),
  buildTemplatePage("split-headline", {
    id: "split-headline",
    name: "Agency Splitfolio",
    category: "Portfolio",
    audience: "Agenzia e studio",
    mood: "chiaro, modulare, sofisticato",
    description: "Portfolio agency con hero spezzato, blocchi servizi e touchpoint editoriali.",
    blocksSummary: ["Navigation", "Hero", "Text", "Social", "Footer"],
  }),
  buildTemplatePage("sidebar-insight", {
    id: "sidebar-insight",
    name: "Sidebar Insight",
    category: "Editorial",
    audience: "Blog professionale",
    mood: "leggibile, profondo, ragionato",
    description: "Template da analisi e opinione con struttura narrativa e timeline editoriale.",
    blocksSummary: ["Navigation", "Text", "Quote", "Timeline", "Footer"],
  }),
  buildTemplatePage("event-pulse", {
    id: "event-pulse",
    name: "Event Pulse",
    category: "Editorial",
    audience: "Agenda e festival",
    mood: "vivo, locale, organizzato",
    description: "Template per agenda eventi con hero, mappa, timeline programma e sponsor.",
    blocksSummary: ["Navigation", "Hero", "Map", "Timeline", "Footer"],
  }),
  buildTemplatePage("sport-scoreline", {
    id: "sport-scoreline",
    name: "Scoreline",
    category: "Editorial",
    audience: "Testata sportiva",
    mood: "dinamico, forte, metrico",
    description: "Template per risultati, match day, highlight video e spazi commerciali.",
    blocksSummary: ["Navigation", "Hero", "Carousel", "Banner", "Footer"],
  }),
  buildTemplatePage("local-paper", {
    id: "local-paper",
    name: "Local Paper",
    category: "Editorial",
    audience: "Cronaca locale",
    mood: "vicino, di territorio, utile",
    description: "Template da testata locale con cronaca, utilità, meteo e agenda di valle.",
    blocksSummary: ["Navigation", "Hero", "Text", "Gallery", "Footer"],
  }),
  buildTemplatePage("city-directory", {
    id: "city-directory",
    name: "Spatial Showcase",
    category: "Portfolio",
    audience: "Architettura e interiors",
    mood: "geometrico, spaziale, curato",
    description: "Portfolio spatial con ricerca progetto, mappa, layout listing e sezioni showcase.",
    blocksSummary: ["Navigation", "Search", "Map", "Text", "Footer"],
  }),
  buildTemplatePage("podcast-room", {
    id: "podcast-room",
    name: "Audio Reel",
    category: "Portfolio",
    audience: "Producer e sound studio",
    mood: "immersivo, seriale, atmosferico",
    description: "Portfolio audio per producer, speaker, studi podcast e reel sonori.",
    blocksSummary: ["Navigation", "Hero", "Carousel", "Social", "Footer"],
  }),
  buildTemplatePage("membership-plus", {
    id: "membership-plus",
    name: "Service Casebook",
    category: "Portfolio",
    audience: "Consulenza premium",
    mood: "premium, strategico, conversione",
    description: "Portfolio servizi con confronto pacchetti, metodo, FAQ e invito al contatto.",
    blocksSummary: ["Navigation", "Hero", "Comparison", "Accordion", "Footer"],
  }),
  buildTemplatePage("travel-journal", {
    id: "travel-journal",
    name: "Expedition Portfolio",
    category: "Portfolio",
    audience: "Fotografo travel",
    mood: "aperto, fotografico, emozionale",
    description: "Portfolio travel con panorama hero, gallery, mappe e percorsi di progetto.",
    blocksSummary: ["Navigation", "Hero", "Gallery", "Map", "Footer"],
  }),
  buildTemplatePage("corporate-pulse", {
    id: "corporate-pulse",
    name: "Brand Casefile",
    category: "Portfolio",
    audience: "Brand studio",
    mood: "solido, pulito, case-driven",
    description: "Portfolio corporate per studio brand con servizi, casi, trust e touchpoint.",
    blocksSummary: ["Navigation", "Hero", "Text", "Social", "Banner", "Footer"],
  }),
  buildTemplatePage("fashion-grid", {
    id: "fashion-grid",
    name: "Lookbook Grid",
    category: "Portfolio",
    audience: "Moda e trend",
    mood: "editoriale, alto contrasto, visivo",
    description: "Portfolio moda/lookbook con mosaici, quote e card editoriali ad alto contrasto.",
    blocksSummary: ["Navigation", "Hero", "Gallery", "Quote", "Footer"],
  }),
  buildTemplatePage("minimal-brief", {
    id: "minimal-brief",
    name: "Minimal Portfolio CV",
    category: "Portfolio",
    audience: "Freelance e consulenti",
    mood: "essenziale, arioso, tipografico",
    description: "Portfolio minimale dove la gerarchia tipografica guida CV, servizi e manifesto.",
    blocksSummary: ["Navigation", "Hero", "Text", "Footer"],
  }),
  buildTemplatePage("tg-studio", {
    id: "tg-studio",
    name: "TG Studio",
    category: "Editorial",
    audience: "TG e broadcast",
    mood: "televisivo, ritmato, urgente",
    description: "Template broadcast con slideshow, timeline edizioni e fasce TG.",
    blocksSummary: ["Navigation", "Slideshow", "Timeline", "Footer"],
  }),
  buildTemplatePage("market-watch", {
    id: "market-watch",
    name: "Market Watch",
    category: "Editorial",
    audience: "Economia e mercati",
    mood: "denso, dati, professionale",
    description: "Template economia con hero, watchlist e blocchi commento dati-first.",
    blocksSummary: ["Navigation", "Hero", "Carousel", "Text", "Footer"],
  }),
  buildTemplatePage("creator-portfolio", {
    id: "creator-portfolio",
    name: "Creator Portfolio Atelier",
    category: "Portfolio",
    audience: "Creativi e studi",
    mood: "narrativo, elegante, showcase",
    description: "Portfolio con manifesto, lavori selezionati, quote studio e case history visive.",
    blocksSummary: ["Navigation", "Hero", "Gallery", "Quote", "Footer"],
  }),
  buildTemplatePage("newsletter-desk", {
    id: "newsletter-desk",
    name: "Newsletter Desk",
    category: "Editorial",
    audience: "Prodotti mail-first",
    mood: "chiaro, seriale, conversione",
    description: "Template newsletter con issue, temi, community e call to action.",
    blocksSummary: ["Navigation", "Hero", "Text", "Social", "Footer"],
  }),
];
