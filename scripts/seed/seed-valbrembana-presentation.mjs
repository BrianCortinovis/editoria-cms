#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function uid() {
  return crypto.randomUUID();
}

function isoDateDaysAgo(daysAgo, hour = 8, minute = 30) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function detectMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

function svgBanner({ width, height, background, accent, eyebrow, title, body, cta }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${background}"/>
  <rect x="0" y="0" width="${width}" height="14" fill="${accent}"/>
  <rect x="24" y="${Math.max(36, Math.round(height * 0.16))}" width="${Math.min(120, width - 48)}" height="22" rx="11" fill="${accent}" opacity="0.14"/>
  <text x="24" y="${Math.max(52, Math.round(height * 0.16) + 15)}" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(12, Math.round(width * 0.045))}" font-weight="700" letter-spacing="1.2">${eyebrow}</text>
  <text x="24" y="${Math.max(102, Math.round(height * 0.31))}" fill="#ffffff" font-family="Georgia, serif" font-size="${Math.max(30, Math.round(width * 0.11))}" font-weight="700">${title}</text>
  <foreignObject x="24" y="${Math.max(124, Math.round(height * 0.36))}" width="${width - 48}" height="${Math.max(90, Math.round(height * 0.28))}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial, Helvetica, sans-serif;font-size:${Math.max(14, Math.round(width * 0.05))}px;line-height:1.45;color:#ffffff;opacity:0.92;">
      ${body}
    </div>
  </foreignObject>
  <rect x="24" y="${height - 64}" width="${Math.min(170, width - 48)}" height="40" rx="20" fill="#ffffff"/>
  <text x="44" y="${height - 38}" fill="${background}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(13, Math.round(width * 0.05))}" font-weight="700">${cta}</text>
</svg>`;
}

async function upsertStorageAsset(supabase, { tenantId, tenantSlug, uploadedBy, targetKey, body, contentType, altText, folder }) {
  const bucketPath = `${tenantSlug}/${targetKey}`;
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);

  const uploadResult = await supabase.storage.from("media").upload(bucketPath, buffer, {
    contentType,
    cacheControl: "3600",
    upsert: true,
  });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(bucketPath);
  const publicUrl = publicUrlData.publicUrl;

  const { data: existing } = await supabase
    .from("media")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("filename", bucketPath)
    .maybeSingle();

  const payload = {
    tenant_id: tenantId,
    filename: bucketPath,
    original_filename: path.basename(targetKey),
    mime_type: contentType,
    size_bytes: buffer.byteLength,
    width: null,
    height: null,
    url: publicUrl,
    thumbnail_url: contentType.startsWith("image/") ? publicUrl : null,
    alt_text: altText || null,
    folder: folder || null,
    uploaded_by: uploadedBy,
  };

  if (existing?.id) {
    const { error } = await supabase.from("media").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("media").insert(payload);
    if (error) throw error;
  }

  return publicUrl;
}

async function ensureLocalAsset(supabase, { tenantId, tenantSlug, uploadedBy, sourcePath, targetKey, altText, folder }) {
  const bucketPath = `${tenantSlug}/${targetKey}`;
  const { data: existing } = await supabase
    .from("media")
    .select("id, url")
    .eq("tenant_id", tenantId)
    .eq("filename", bucketPath)
    .maybeSingle();

  if (existing?.url) {
    return existing.url;
  }

  const buffer = fs.readFileSync(sourcePath);
  return upsertStorageAsset(supabase, {
    tenantId,
    tenantSlug,
    uploadedBy,
    targetKey,
    body: buffer,
    contentType: detectMimeType(sourcePath),
    altText,
    folder,
  });
}

function textBlock(content) {
  return {
    id: uid(),
    type: "text",
    label: "Testo",
    props: { content },
    style: {},
    hidden: false,
    locked: false,
    children: [],
  };
}

function sectionBlock(title, paragraphs) {
  return {
    id: uid(),
    type: "section",
    label: title,
    props: { tag: "section", fullWidth: true },
    style: {},
    hidden: false,
    locked: false,
    children: [textBlock(paragraphs.join(""))],
  };
}

const env = {
  ...loadEnvFile(".env.local"),
  ...process.env,
};

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const tenantSlug = process.argv[2] || "valbrembana";
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const PUBLIC_SHEET = {
  ragione_sociale: "Sergio Sonzogni Editore",
  partita_iva: "03739960163",
  codice_fiscale: "03739960163",
  indirizzo: "Via Paolo Boselli, 10",
  citta: "San Giovanni Bianco",
  cap: "24015",
  provincia: "BG",
  nazione: "IT",
  telefono: "0345 41834",
  email_testata: "redazione@valbrembanaweb.com",
  pec: "redazione@pec.valbrembanaweb.com",
  sdi: "M5UXCR1",
  direttore_responsabile: "Sergio Sonzogni",
  registro_tribunale: "Tribunale di Bergamo",
  num_registro: "9/2020",
  data_registro: "2020-01-20",
  editore: "Sergio Sonzogni Editore",
  iscr_roc: "ROC demo in aggiornamento",
  tipologia: "testata_giornalistica",
  facebook: "https://www.facebook.com/valbrembanaweb",
  instagram: "https://www.instagram.com/valbrembanaweb",
  twitter: "https://x.com/ValBrembanaWeb",
  telegram: "https://t.me/valbrembanaweb",
  youtube: "https://www.youtube.com/@valbrembanaweb",
  site_description:
    "Notizie, cronaca, sport, cultura e servizi dalla Valle Brembana con aggiornamento quotidiano, video TG e guide utili dal territorio.",
  google_analytics: "G-VBWDEMO2026",
  google_adsense: "ca-pub-6284115600122026",
};

const ADVERTISERS = [
  {
    name: "Hotel Bigio",
    email: "adv@hotelbigio.it",
    phone: "0345 900111",
    notes: "Cliente demo hospitality per header e square promo.",
  },
  {
    name: "Brembana Mobilita",
    email: "marketing@brembanamobilita.it",
    phone: "0345 903220",
    notes: "Cliente demo trasporti per vertical rail e servizi valle.",
  },
  {
    name: "Festival dei Borghi",
    email: "promo@festivaldeiborghi.it",
    phone: "0345 907700",
    notes: "Cliente demo eventi culturali per footer e sidebar.",
  },
  {
    name: "Caseificio San Matteo",
    email: "info@caseificiosanmatteo.it",
    phone: "0345 915500",
    notes: "Cliente demo food locale per rail ADV quadrato.",
  },
];

async function main() {
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name, settings, logo_url")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    throw tenantError || new Error(`Tenant ${tenantSlug} not found`);
  }

  const { data: author } = await supabase
    .from("profiles")
    .select("id, full_name")
    .or("email.eq.giornalista.test@valbrembana.local,email.eq.codex-ai-test+cms@valbrembana.local")
    .limit(1)
    .maybeSingle();

  if (!author?.id) {
    throw new Error("No author profile available for demo seed");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("tenant_id", tenant.id);

  const categoryBySlug = Object.fromEntries((categories || []).map((category) => [category.slug, category]));

  const outputRoot = "/Users/briancortinovis/Desktop/Valbrembana Giornale /output";
  const imageCandidates = [
    "news-tram.jpg",
    "news-foppolo.jpg",
    "news-canali.jpg",
    "news-fuochi.jpg",
    "news-luiselli.jpg",
    "featured-10206.jpg",
    "featured-89635.jpg",
    "featured-89672.jpg",
    "featured-89683.jpg",
    "news-lago-braies.png",
  ];

  const localImageUrls = {};
  for (const filename of imageCandidates) {
    const sourcePath = path.join(outputRoot, "images", filename);
    if (fs.existsSync(sourcePath)) {
      localImageUrls[filename] = await ensureLocalAsset(supabase, {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        uploadedBy: author.id,
        sourcePath,
        targetKey: `demo/articles/${filename}`,
        altText: filename.replace(/\.[a-z0-9]+$/i, "").replace(/-/g, " "),
        folder: "articles",
      });
    }
  }

  const svgBannerAssets = [
    {
      key: "demo/banners/header-hotel-bigio.svg",
      advertiser: "Hotel Bigio",
      name: "Hotel Bigio - Primavera in quota",
      position: "header",
      target_device: "all",
      weight: 80,
      starts_at: isoDateDaysAgo(4, 7),
      ends_at: null,
      link_url: "https://www.valbrembanaweb.com/dove-alloggiare/",
      width: 728,
      height: 90,
      body: "Week-end in quota, spa e cucina alpina a due passi dalle piste e dai sentieri della valle.",
      eyebrow: "ospitalita",
      title: "Hotel Bigio",
      cta: "Prenota ora",
      background: "#183153",
      accent: "#f97316",
      folder: "banners",
    },
    {
      key: "demo/banners/header-caseificio-san-matteo.svg",
      advertiser: "Caseificio San Matteo",
      name: "Caseificio San Matteo - sapori di valle",
      position: "header",
      target_device: "all",
      weight: 75,
      starts_at: isoDateDaysAgo(4, 7),
      ends_at: null,
      link_url: "https://www.valbrembanaweb.com/dove-mangiare/",
      width: 728,
      height: 90,
      body: "Formaggi, degustazioni e visite guidate: il lato piu autentico della filiera locale.",
      eyebrow: "gusto locale",
      title: "San Matteo",
      cta: "Scopri di piu",
      background: "#234f2f",
      accent: "#facc15",
      folder: "banners",
    },
    {
      key: "demo/banners/sidebar-brembana-mobilita-left.svg",
      advertiser: "Brembana Mobilita",
      name: "Brembana Mobilita - rail sinistro",
      position: "sidebar",
      target_device: "desktop",
      weight: 90,
      starts_at: isoDateDaysAgo(3, 9),
      ends_at: null,
      link_url: "https://www.valbrembanaweb.com/attivita-in-valle/",
      width: 300,
      height: 600,
      body: "Navette, parcheggi e collegamenti rapidi per muoversi tra borghi, terme e piste in alta stagione.",
      eyebrow: "servizi valle",
      title: "Brembana Mobilita",
      cta: "Consulta orari",
      background: "#0f172a",
      accent: "#22c55e",
      folder: "banners",
    },
    {
      key: "demo/banners/sidebar-caseificio-square-left.svg",
      advertiser: "Caseificio San Matteo",
      name: "Caseificio San Matteo - box quadrato",
      position: "sidebar",
      target_device: "desktop",
      weight: 65,
      starts_at: isoDateDaysAgo(3, 9),
      ends_at: null,
      link_url: "https://www.valbrembanaweb.com/dove-mangiare/",
      width: 300,
      height: 300,
      body: "Sapori di montagna, ceste regalo e bottega aperta tutti i fine settimana.",
      eyebrow: "bottega",
      title: "Forme e sapori",
      cta: "Vai alla guida",
      background: "#7c2d12",
      accent: "#fb923c",
      folder: "banners",
    },
    {
      key: "demo/banners/sidebar-festival-right.svg",
      advertiser: "Festival dei Borghi",
      name: "Festival dei Borghi - rail destro",
      position: "sidebar",
      target_device: "desktop",
      weight: 82,
      starts_at: isoDateDaysAgo(2, 8),
      ends_at: null,
      link_url: "https://www.valbrembanaweb.com/attivita-in-valle/",
      width: 300,
      height: 600,
      body: "Concerti, mostre e cammini tra i borghi: una campagna demo con taglio da testata.",
      eyebrow: "estate 2026",
      title: "Festival dei Borghi",
      cta: "Vedi il programma",
      background: "#4c1d95",
      accent: "#f59e0b",
      folder: "banners",
    },
    {
      key: "demo/banners/sidebar-hotel-square-right.svg",
      advertiser: "Hotel Bigio",
      name: "Hotel Bigio - promo quadrata",
      position: "sidebar",
      target_device: "desktop",
      weight: 60,
      starts_at: isoDateDaysAgo(2, 8),
      ends_at: null,
      link_url: "https://www.valbrembanaweb.com/dove-alloggiare/",
      width: 300,
      height: 300,
      body: "Camere nuove, colazione presto e parcheggio comodo per chi sale in valle ogni weekend.",
      eyebrow: "ospitalita",
      title: "Weekend in valle",
      cta: "Contatta l'hotel",
      background: "#1d4ed8",
      accent: "#f8fafc",
      folder: "banners",
    },
    {
      key: "demo/banners/footer-festival-borghi.svg",
      advertiser: "Festival dei Borghi",
      name: "Festival dei Borghi - footer",
      position: "footer",
      target_device: "all",
      weight: 70,
      starts_at: isoDateDaysAgo(2, 7),
      ends_at: null,
      link_url: "https://www.valbrembanaweb.com/attivita-in-valle/",
      width: 970,
      height: 250,
      body: "Una promozione ampia da fondo pagina, pensata per chiudere la home con un taglio culturale e territoriale.",
      eyebrow: "speciale estate",
      title: "Valle in scena",
      cta: "Scopri il calendario",
      background: "#111827",
      accent: "#ef4444",
      folder: "banners",
    },
  ];

  const uploadedBannerUrls = {};
  for (const banner of svgBannerAssets) {
    const body = svgBanner(banner);
    uploadedBannerUrls[banner.key] = await upsertStorageAsset(supabase, {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      uploadedBy: author.id,
      targetKey: banner.key,
      body,
      contentType: "image/svg+xml",
      altText: banner.name,
      folder: banner.folder,
    });
  }

  const advertiserIds = {};
  for (const advertiser of ADVERTISERS) {
    const { data: existing } = await supabase
      .from("advertisers")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("name", advertiser.name)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase.from("advertisers").update(advertiser).eq("id", existing.id);
      if (error) throw error;
      advertiserIds[advertiser.name] = existing.id;
    } else {
      const { data, error } = await supabase
        .from("advertisers")
        .insert({ tenant_id: tenant.id, ...advertiser })
        .select("id")
        .single();
      if (error) throw error;
      advertiserIds[advertiser.name] = data.id;
    }
  }

  await supabase.from("banners").delete().eq("tenant_id", tenant.id);
  const bannerRows = svgBannerAssets.map((banner) => ({
    tenant_id: tenant.id,
    name: banner.name,
    position: banner.position,
    type: "image",
    image_url: uploadedBannerUrls[banner.key],
    html_content: null,
    link_url: banner.link_url,
    target_categories: [],
    target_device: banner.target_device,
    weight: banner.weight,
    advertiser_id: advertiserIds[banner.advertiser] || null,
    starts_at: banner.starts_at,
    ends_at: banner.ends_at,
    is_active: true,
  }));
  const { error: bannerInsertError } = await supabase.from("banners").insert(bannerRows);
  if (bannerInsertError) throw bannerInsertError;

  const articleSeeds = [
    {
      title: "TEST articolo demo CMS",
      slug: "test-articolo-demo-cms",
      summary: "Tes test ets. Un articolo volutamente semplice per mostrare il template singolo collegato al CMS.",
      body: "<p>Tes test ets.</p><p>Questo articolo serve a mostrare al cliente che la pagina singola nasce dal template del sito e non da una pagina costruita a mano. Titolo, sommario, immagine e metadata arrivano dal CMS.</p><p>La pubblicazione aggiorna sia la home sia la pagina articolo collegata, mantenendo un flusso editoriale chiaro e professionale.</p>",
      category: "cronaca",
      cover: "news-foppolo.jpg",
      featured: true,
      breaking: false,
      publishedAt: isoDateDaysAgo(0, 6, 45),
      viewCount: 842,
    },
    {
      title: "San Giovanni Bianco apre il polo civico serale: studio, coworking e sportello giovani nello stesso spazio",
      slug: "san-giovanni-bianco-polo-civico-serale",
      summary: "Il nuovo presidio riunisce funzioni diverse e prova a riportare servizi e socialita` in una fascia oraria scoperta.",
      body: "<p>San Giovanni Bianco prova a cambiare il ritmo del centro con un polo civico aperto anche nelle ore serali. Il progetto unisce sala studio, coworking leggero e uno sportello giovani pensato per orientamento e servizi di prossimita`.</p><p>L'obiettivo e` tenere accesa una porzione di paese in una fascia oraria spesso debole, con una presenza stabile e non episodica. Per la valle significa anche testare nuovi modi di riuso degli spazi gia` esistenti.</p><p>Il desk segue la vicenda come cronaca civica: un fatto locale con ricadute concrete su mobilita`, accesso ai servizi e percezione della piazza.</p>",
      category: "cronaca",
      cover: "news-canali.jpg",
      featured: true,
      breaking: true,
      publishedAt: isoDateDaysAgo(0, 8, 30),
      viewCount: 2143,
    },
    {
      title: "Zogno ridisegna il nodo bus-stazione: piu corse, attese piu brevi e un percorso pedonale finalmente leggibile",
      slug: "zogno-ridisegna-nodo-bus-stazione",
      summary: "Il nuovo assetto punta su flussi piu lineari, sicurezza e tempi di interscambio ridotti nelle ore di punta.",
      body: "<p>A Zogno il tema non e` solo quante corse passano, ma come si attraversa davvero il nodo bus-stazione. La revisione dei percorsi pedonali e delle fermate riduce attese inutili e rende piu immediato il cambio mezzo.</p><p>Per il giornale e` un caso tipico da prima pagina locale: un'infrastruttura quotidiana che incide sulla vita reale, ma che spesso resta invisibile finche` non smette di funzionare.</p>",
      category: "cronaca",
      cover: "news-tram.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(1, 7, 50),
      viewCount: 1710,
    },
    {
      title: "Valnegra mette in sicurezza il percorso scuola-campo sportivo con un cantiere leggero ma molto atteso",
      slug: "valnegra-percorso-scuola-campo-sportivo-sicurezza",
      summary: "Cordoli, attraversamenti e segnaletica sono piccoli interventi, ma per i residenti cambiano davvero la quotidianita`.",
      body: "<p>Il Comune ha scelto un cantiere rapido e poco invasivo per mettere in sicurezza il collegamento tra scuola e campo sportivo. La novita` non e` scenografica, ma molto concreta: meno punti ciechi, piu leggibilita` e un margine di tranquillita` per famiglie e associazioni.</p><p>E` uno di quei temi che in un giornale di valle meritano spazio perche` raccontano bene il rapporto tra manutenzione, sicurezza e vita di comunità.</p>",
      category: "cronaca",
      cover: "featured-89672.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(2, 9, 20),
      viewCount: 980,
    },
    {
      title: "Trail delle vette minori rilancia la primavera sportiva: numeri in crescita e borghi coinvolti lungo tutto il percorso",
      slug: "trail-vette-minori-primavera-sportiva",
      summary: "La corsa cresce senza perdere il taglio territoriale e porta spettatori, volontari e piccola economia in piu comuni.",
      body: "<p>Il trail delle vette minori si conferma come una delle formule piu intelligenti della primavera sportiva locale: non solo gara, ma itinerario che attiva borghi, volontariato e servizi lungo il percorso.</p><p>Nel CMS questo articolo riempie la sezione Sport della home e mostra come una categoria possa vivere bene anche con contenuti di taglio territoriale, non solo agonistico.</p>",
      category: "sport",
      cover: "featured-89635.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(1, 11, 10),
      viewCount: 1325,
    },
    {
      title: "Basket di valle, le palestre minori tornano centrali: piu pubblico, staff condivisi e derby con atmosfera da grande serata",
      slug: "basket-valle-palestre-minori-centrali",
      summary: "Tra impianti piccoli e partite piene, il movimento locale ritrova pubblico e una filiera giovanile piu solida.",
      body: "<p>Il basket di valle sta ritrovando una sua centralita` grazie a un circuito di palestre minori che non vive piu di improvvisazione. Staff condivisi, settore giovanile piu ordinato e derby con buona presenza di pubblico stanno ridando forma al movimento.</p><p>Dal punto di vista editoriale e` un pezzo utile per dare profondita` alla sezione Sport oltre il titolo principale.</p>",
      category: "sport",
      cover: "featured-89683.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(3, 10, 5),
      viewCount: 905,
    },
    {
      title: "Piazzatorre rilancia il vivaio sci club con allenamenti condivisi e una nuova agenda di weekend in pista",
      slug: "piazzatorre-rilancia-vivaio-sci-club",
      summary: "Lavoro sui giovani, logistica piu semplice e appuntamenti cadenzati rendono il progetto piu credibile sul medio periodo.",
      body: "<p>Lo sci club di Piazzatorre torna a investire sui piu giovani con allenamenti condivisi, calendario piu leggibile e una comunicazione finalmente costante. Il risultato e` meno dispersione e piu continuita` per le famiglie.</p><p>Questo terzo articolo completa la sezione Sport in home e aiuta a mostrare il comportamento corretto del template categoria.</p>",
      category: "sport",
      cover: "news-foppolo.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(5, 9, 0),
      viewCount: 744,
    },
    {
      title: "Archivio vivo, la memoria della valle entra nei laboratori scolastici con immagini, audio e mappe narrate",
      slug: "archivio-vivo-memoria-valle-laboratori-scolastici",
      summary: "Un progetto scolastico usa materiali d'archivio per trasformare la memoria locale in attivita` viva e condivisa.",
      body: "<p>Foto, registrazioni e mappe entrano nelle classi come materiali da interrogare, non come semplice repertorio celebrativo. Il progetto sull'archivio vivo porta la valle dentro i laboratori scolastici con una grammatica piu moderna.</p><p>Per la sezione Cultura questo e` il tipo di contenuto che regge bene sia in home sia nella pagina singola.</p>",
      category: "cultura",
      cover: "news-lago-braies.png",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(2, 15, 10),
      viewCount: 1180,
    },
    {
      title: "Teatri di borgo, rassegne piccole e piene: il format diffuso che fa funzionare davvero la cultura locale",
      slug: "teatri-di-borgo-rassegne-piccole-piene",
      summary: "Sale raccolte, calendari chiari e pubblico fedele mostrano che la programmazione diffusa puo` essere sostenibile.",
      body: "<p>Le rassegne di borgo funzionano quando non inseguono modelli fuori scala. Programmi piu leggibili, sale raccolte e un rapporto stretto col territorio stanno rendendo queste stagioni piu solide e meno episodiche.</p><p>La Cultura in home guadagna cosi` una seconda storia di taglio diverso, ma coerente.</p>",
      category: "cultura",
      cover: "news-fuochi.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(4, 18, 0),
      viewCount: 864,
    },
    {
      title: "Palazzo Foppa apre una mostra fotografica sulla valle industriale: immagini, turni di lavoro e storie di officina",
      slug: "palazzo-foppa-mostra-fotografica-valle-industriale",
      summary: "Una mostra costruita bene trasforma archivi e memoria operaia in racconto contemporaneo e accessibile.",
      body: "<p>La nuova mostra di Palazzo Foppa mette insieme immagini, turni di lavoro, officine e racconti di fabbrica senza scivolare nella nostalgia piatta. La curatela lavora sul ritmo e sulla leggibilita`, due cose che anche una testata digitale deve imparare dalla buona cultura espositiva.</p><p>Con questo terzo contenuto la sezione Cultura della home si chiude senza vuoti.</p>",
      category: "cultura",
      cover: "news-luiselli.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(6, 14, 15),
      viewCount: 702,
    },
    {
      title: "Sentieri di mezza quota, la vera partita e la manutenzione continua: meno grandi annunci e piu cura visibile",
      slug: "sentieri-mezza-quota-manutenzione-continua",
      summary: "Il tema non e` inaugurare, ma mantenere bene: segnaletica, drenaggio e passaggi leggibili tutto l'anno.",
      body: "<p>La manutenzione dei sentieri di mezza quota e` uno dei temi piu concreti per la valle. Non produce sempre foto spettacolari, ma cambia davvero l'esperienza di residenti e visitatori.</p><p>In una home ben costruita questi articoli aiutano a dare sostanza di servizio oltre la cronaca.</p>",
      category: "territorio",
      cover: "news-canali.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(3, 7, 40),
      viewCount: 1104,
    },
    {
      title: "San Pellegrino studia una passerella leggera sul Brembo per ricucire il percorso tra terme, fiume e centro",
      slug: "san-pellegrino-passerella-brembo-terme-centro",
      summary: "L'ipotesi di una passerella leggera riapre il tema dell'accessibilita` e dei collegamenti brevi di qualita`.",
      body: "<p>Una passerella leggera sul Brembo potrebbe sembrare un dettaglio, ma per San Pellegrino significherebbe ricucire tre pezzi di esperienza urbana oggi separati: il centro, le terme e il fiume.</p><p>Il racconto di territorio serve proprio a questo: mostrare come infrastrutture piccole possano avere un impatto molto chiaro.</p>",
      category: "territorio",
      cover: "featured-10206.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(7, 10, 40),
      viewCount: 654,
    },
    {
      title: "Editoriale, una testata locale deve sembrare autorevole prima ancora di chiedere il click",
      slug: "editoriale-testata-locale-autorevole-prima-del-click",
      summary: "La forma editoriale e` gia sostanza: ordine, gerarchia e tono fanno percepire subito l'affidabilita` del giornale.",
      body: "<p>Nel digitale locale la forma e` gia sostanza. Una testata che vuole essere riconosciuta come autorevole deve mostrare subito ordine, priorita` e tono. La differenza tra una pagina casuale e una prima pagina vera si sente prima ancora di leggere il primo titolo.</p><p>Per questo il design editoriale non e` un lusso, ma una parte dell'affidabilita` percepita.</p>",
      category: "editoriali",
      cover: "featured-89635.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(5, 8, 0),
      viewCount: 1460,
    },
    {
      title: "Editoriale, il sito di una redazione deve mettere in scena il lavoro del desk, non nasconderlo",
      slug: "editoriale-sito-redazione-mettere-in-scena-lavoro-desk",
      summary: "Una homepage viva deve far percepire scelte, ritmo e priorita`, non sembrare una semplice lista indistinta.",
      body: "<p>Una redazione locale che lavora bene ha un ritmo visibile: breaking, servizi, approfondimenti, agenda e utilita`. Il sito non dovrebbe nascondere questo lavoro dietro una lista uniforme di card, ma metterlo in scena con gerarchie chiare.</p><p>Il desk non e` un dettaglio interno: e` parte della promessa editoriale al lettore.</p>",
      category: "editoriali",
      cover: "featured-89672.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(8, 7, 20),
      viewCount: 934,
    },
    {
      title: "Editoriale, per una testata di valle il digitale funziona quando resta servizio e non posa",
      slug: "editoriale-testata-valle-digitale-servizio-non-posa",
      summary: "Le scelte migliori non sono le piu rumorose, ma quelle che tengono insieme utilita`, chiarezza e continuita` editoriale.",
      body: "<p>Il digitale di una testata di valle non vince quando imita male i grandi marchi o rincorre effetti gratuiti. Funziona quando resta servizio, chiarezza, continuita` e rapporto corretto tra urgenza e utilita`.</p><p>Questo terzo editoriale aiuta a dare profondita` alla sezione Opinioni e completa la home senza lasciare buchi.</p>",
      category: "editoriali",
      cover: "featured-89683.jpg",
      featured: false,
      breaking: false,
      publishedAt: isoDateDaysAgo(10, 9, 15),
      viewCount: 801,
    },
  ];

  for (const seed of articleSeeds) {
    const category = categoryBySlug[seed.category];
    if (!category?.id) continue;

    const articlePayload = {
      tenant_id: tenant.id,
      title: seed.title,
      subtitle: null,
      slug: seed.slug,
      summary: seed.summary,
      body: seed.body,
      cover_image_url: localImageUrls[seed.cover] || Object.values(localImageUrls)[0] || null,
      category_id: category.id,
      author_id: author.id,
      status: "published",
      is_featured: seed.featured,
      is_breaking: seed.breaking,
      is_premium: false,
      homepage_position: null,
      meta_title: `${seed.title} | Val Brembana Web`,
      meta_description: seed.summary,
      og_image_url: localImageUrls[seed.cover] || Object.values(localImageUrls)[0] || null,
      published_at: seed.publishedAt,
      scheduled_at: null,
      view_count: seed.viewCount,
    };

    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("slug", seed.slug)
      .maybeSingle();

    let articleId = existing?.id || null;
    if (articleId) {
      const { error } = await supabase.from("articles").update(articlePayload).eq("id", articleId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("articles")
        .insert(articlePayload)
        .select("id")
        .single();
      if (error) throw error;
      articleId = data.id;
    }

    if (articleId) {
      await supabase.from("article_categories").upsert({ article_id: articleId, category_id: category.id });
    }
  }

  const breakingItems = [
    {
      text: "San Giovanni Bianco: polo civico serale aperto fino a tardi per studio, coworking e sportello giovani",
      link_url: `/site/${tenant.slug}/articolo/san-giovanni-bianco-polo-civico-serale`,
      priority: 100,
      expires_at: null,
    },
    {
      text: "Zogno ridisegna il nodo bus-stazione con percorso pedonale piu leggibile e attese ridotte",
      link_url: `/site/${tenant.slug}/articolo/zogno-ridisegna-nodo-bus-stazione`,
      priority: 90,
      expires_at: null,
    },
    {
      text: "Sentieri di mezza quota, manutenzione continua e segnaletica tornano al centro",
      link_url: `/site/${tenant.slug}/articolo/sentieri-mezza-quota-manutenzione-continua`,
      priority: 80,
      expires_at: null,
    },
    {
      text: "Trail di primavera, cresce il circuito sportivo che coinvolge i borghi della valle",
      link_url: `/site/${tenant.slug}/articolo/trail-vette-minori-primavera-sportiva`,
      priority: 70,
      expires_at: null,
    },
  ];

  await supabase.from("breaking_news").delete().eq("tenant_id", tenant.id);
  const { error: breakingError } = await supabase.from("breaking_news").insert(
    breakingItems.map((item) => ({
      tenant_id: tenant.id,
      text: item.text,
      link_url: item.link_url,
      is_active: true,
      priority: item.priority,
      created_by: author.id,
      expires_at: item.expires_at,
    })),
  );
  if (breakingError) throw breakingError;

  const mergedSettings = {
    ...(tenant.settings || {}),
    ...PUBLIC_SHEET,
    tg_video_url: tenant.settings?.tg_video_url || "",
    tg_video_label: "TG quotidiano Val Brembana Web",
    team_members: [
      { id: "desk-1", nome: "Sergio Sonzogni", email: "redazione@valbrembanaweb.com", ruolo: "editor" },
      { id: "desk-2", nome: "Desk Cronaca", email: "desk.cronaca@valbrembanaweb.com", ruolo: "giornalista" },
      { id: "desk-3", nome: "Desk Video", email: "desk.video@valbrembanaweb.com", ruolo: "videomaker" },
    ],
  };

  const { error: tenantSettingsError } = await supabase
    .from("tenants")
    .update({
      settings: mergedSettings,
      name: "Val Brembana Web",
    })
    .eq("id", tenant.id);
  if (tenantSettingsError) throw tenantSettingsError;

  const { data: existingConfig } = await supabase
    .from("site_config")
    .select("theme, navigation, footer, global_css")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  const updatedFooter = {
    ...(existingConfig?.footer || {}),
    description:
      "Portale d'informazione e servizi della Valle Brembana: cronaca, sport, cultura, agenda, video e ADV gestiti dal CMS.",
    columns: [
      {
        title: "Redazione",
        text: "Via Paolo Boselli, 10 - 24015 San Giovanni Bianco (BG) - redazione@valbrembanaweb.com - 0345 41834",
        links: [
          { label: "Cronaca", url: `/site/${tenant.slug}/categoria/cronaca` },
          { label: "Sport", url: `/site/${tenant.slug}/categoria/sport` },
        ],
      },
      {
        title: "Servizi",
        links: [
          { label: "Contatti", url: `/site/${tenant.slug}/contatti` },
          { label: "Chi siamo", url: `/site/${tenant.slug}/chi-siamo` },
          { label: "Pubblicita", url: `/site/${tenant.slug}/pubblicita` },
        ],
      },
      {
        title: "Informazioni legali",
        text: "Testata giornalistica n. 9/2020 registrata presso il Tribunale di Bergamo. P.IVA 03739960163.",
        links: [
          { label: "Privacy", url: `/site/${tenant.slug}/privacy` },
          { label: "Cookie", url: `/site/${tenant.slug}/cookie` },
        ],
      },
    ],
    links: [
      { label: "Privacy", url: `/site/${tenant.slug}/privacy` },
      { label: "Cookie", url: `/site/${tenant.slug}/cookie` },
    ],
    socialLinks: [
      { platform: "facebook", url: PUBLIC_SHEET.facebook },
      { platform: "instagram", url: PUBLIC_SHEET.instagram },
      { platform: "youtube", url: PUBLIC_SHEET.youtube },
    ],
    copyright: `© 2026 ${tenant.name}. Testata giornalistica n. 9/2020 - Tribunale di Bergamo.`,
  };

  const updatedNavigation = {
    ...(existingConfig?.navigation || {}),
    primary: [
      { id: "nav-home", label: "Home", url: `/site/${tenant.slug}` },
      { id: "nav-cronaca", label: "Cronaca", url: `/site/${tenant.slug}/categoria/cronaca`, sourceType: "category" },
      { id: "nav-sport", label: "Sport", url: `/site/${tenant.slug}/categoria/sport`, sourceType: "category" },
      { id: "nav-cultura", label: "Cultura", url: `/site/${tenant.slug}/categoria/cultura`, sourceType: "category" },
      { id: "nav-territorio", label: "Territorio", url: `/site/${tenant.slug}/categoria/territorio`, sourceType: "category" },
      { id: "nav-opinioni", label: "Opinioni", url: `/site/${tenant.slug}/categoria/editoriali`, sourceType: "category" },
      { id: "nav-farmacie", label: "Turno farmacie", url: `/site/${tenant.slug}/turno-farmacie`, sourceType: "page" },
      { id: "nav-video", label: "Video", url: "#video" },
      { id: "nav-contatti", label: "Contatti", url: `/site/${tenant.slug}/contatti`, sourceType: "page" },
    ],
    footer: [
      { id: "foot-about", label: "Chi siamo", url: `/site/${tenant.slug}/chi-siamo` },
      { id: "foot-contact", label: "Contatti", url: `/site/${tenant.slug}/contatti` },
      { id: "foot-privacy", label: "Privacy", url: `/site/${tenant.slug}/privacy` },
    ],
  };

  const { error: configError } = await supabase
    .from("site_config")
    .upsert(
      {
        tenant_id: tenant.id,
        theme: existingConfig?.theme || {},
        navigation: updatedNavigation,
        footer: updatedFooter,
        global_css: existingConfig?.global_css || null,
        favicon_url: tenant.logo_url || null,
        og_defaults: {
          siteName: "Val Brembana Web",
          locale: "it_IT",
          type: "website",
          title: "Val Brembana Web | Notizie, cronaca, sport e cultura dalla valle",
          description: PUBLIC_SHEET.site_description,
          image: tenant.logo_url || null,
        },
      },
      { onConflict: "tenant_id" },
    );
  if (configError) throw configError;

  const pages = [
    {
      slug: "chi-siamo",
      title: "Chi siamo",
      meta: {
        title: "Chi siamo | Val Brembana Web",
        description: "Dati editoriali, storia e missione di Val Brembana Web.",
      },
      blocks: [
        sectionBlock("Chi siamo", [
          `<p><strong>Val Brembana Web</strong> e' un portale di informazione e servizi dedicato alla valle, fondato nel 1998 e oggi strutturato come testata giornalistica registrata presso il Tribunale di Bergamo.</p>`,
          `<p>La redazione opera da <strong>San Giovanni Bianco</strong>, in Via Paolo Boselli 10, con un taglio editoriale orientato a cronaca locale, sport, cultura, territorio, servizi utili e video TG quotidiani.</p>`,
        ]),
        sectionBlock("Dati editoriali", [
          `<p><strong>Direttore responsabile:</strong> Sergio Sonzogni</p>`,
          `<p><strong>Testata giornalistica:</strong> n. 9/2020 registrata presso il Tribunale di Bergamo</p>`,
          `<p><strong>P.IVA:</strong> 03739960163</p>`,
        ]),
      ],
    },
    {
      slug: "contatti",
      title: "Contatti",
      meta: {
        title: "Contatti | Val Brembana Web",
        description: "Contatti redazione, sede e pubblicita' di Val Brembana Web.",
      },
      blocks: [
        sectionBlock("Contatti redazione", [
          `<p><strong>Sede redazione:</strong> Via Paolo Boselli, 10 - 24015 San Giovanni Bianco (BG)</p>`,
          `<p><strong>Telefono:</strong> 0345 41834</p>`,
          `<p><strong>Email redazione:</strong> redazione@valbrembanaweb.com</p>`,
        ]),
        sectionBlock("Pubblicita", [
          `<p><strong>Concessionaria pubblicita':</strong> info@italiacommunication.com</p>`,
          `<p>Per campagne ADV demo e piani di visibilita' territoriali il CMS ora gestisce anche banner laterali, header e footer con rotazione e clienti dedicati.</p>`,
        ]),
      ],
    },
    {
      slug: "privacy",
      title: "Privacy",
      meta: {
        title: "Privacy | Val Brembana Web",
        description: "Informazioni privacy e contatti del titolare per Val Brembana Web.",
      },
      blocks: [
        sectionBlock("Privacy", [
          `<p>L'indirizzo del sito e' <strong>www.valbrembanaweb.com</strong>. I commenti e i moduli possono raccogliere i dati strettamente necessari alla gestione editoriale e al contrasto dello spam.</p>`,
          `<p>I riferimenti pubblici della testata: Sergio Sonzogni Editore, Via Paolo Boselli 10, San Giovanni Bianco (BG), redazione@valbrembanaweb.com.</p>`,
        ]),
      ],
    },
    {
      slug: "cookie",
      title: "Cookie",
      meta: {
        title: "Cookie | Val Brembana Web",
        description: "Informativa sintetica sui cookie per la demo Val Brembana Web.",
      },
      blocks: [
        sectionBlock("Cookie", [
          `<p>La demo utilizza una informativa sintetica per rappresentare la presenza di cookie tecnici, di sessione e di strumenti di misurazione compatibili con il CMS.</p>`,
        ]),
      ],
    },
    {
      slug: "pubblicita",
      title: "Pubblicita",
      meta: {
        title: "Pubblicita | Val Brembana Web",
        description: "Spazi ADV, banner e contatti commerciali di Val Brembana Web.",
      },
      blocks: [
        sectionBlock("Pubblicita", [
          `<p>Val Brembana Web puo' gestire campagne header, sidebar, footer e interstitial con inserzionisti dedicati, pesi di rotazione, finestre temporali e materiale visuale verticale o quadrato.</p>`,
          `<p>Contatto demo: info@italiacommunication.com - 0345 41834</p>`,
        ]),
      ],
    },
  ];

  for (const page of pages) {
    const { data: existing } = await supabase
      .from("site_pages")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("slug", page.slug)
      .maybeSingle();

    const payload = {
      tenant_id: tenant.id,
      title: page.title,
      slug: page.slug,
      page_type:
        page.slug === "chi-siamo"
          ? "about"
          : page.slug === "contatti"
            ? "contact"
            : "custom",
      meta: page.meta,
      blocks: page.blocks,
      custom_css: null,
      is_published: true,
      sort_order: 0,
      created_by: author.id,
    };

    if (existing?.id) {
      const { error } = await supabase.from("site_pages").update(payload).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("site_pages").insert(payload);
      if (error) throw error;
    }
  }

  const { data: homepage } = await supabase
    .from("site_pages")
    .select("id, blocks, meta")
    .eq("tenant_id", tenant.id)
    .eq("slug", "homepage")
    .single();

  if (homepage?.id && Array.isArray(homepage.blocks)) {
    const nextBlocks = JSON.parse(JSON.stringify(homepage.blocks));
    const visit = (entries) => {
      for (const block of entries) {
        if (block?.type === "video" && block?.props) {
          block.props.aspectRatio = "16/9";
          block.props.title = "TG Val Brembana Web";
          block.props.caption = "Aggiornamento video quotidiano collegato al CMS.";
        }
        if (Array.isArray(block?.children) && block.children.length > 0) {
          visit(block.children);
        }
      }
    };
    visit(nextBlocks);

    const { error: homepageError } = await supabase
      .from("site_pages")
      .update({
        blocks: nextBlocks,
        meta: {
          ...(homepage.meta || {}),
          title: "Val Brembana Web | Notizie, cronaca, sport, cultura e servizi dalla valle",
          description: PUBLIC_SHEET.site_description,
        },
      })
      .eq("id", homepage.id);
    if (homepageError) throw homepageError;
  }

  console.log(`Val Brembana presentation seed completed for tenant ${tenant.slug}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
