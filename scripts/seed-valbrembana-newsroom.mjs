#!/usr/bin/env node

import fs from "node:fs";
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

function isoOffset({ days = 0, hours = 0, minutes = 0 }) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(date.getUTCHours() + hours);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function richBody(paragraphs) {
  return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("\n");
}

function attachmentFor(media) {
  if (!media) return [];
  return [
    {
      id: media.id,
      name: media.original_filename || media.filename || "Media",
      mimeType: media.mime_type || "application/octet-stream",
      url: media.url,
    },
  ];
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

const EXTRA_TAGS = [
  { name: "Primo Piano", slug: "primo-piano" },
  { name: "Video TG", slug: "video-tg" },
  { name: "Viabilita", slug: "viabilita" },
  { name: "Scuola", slug: "scuola" },
  { name: "Servizi", slug: "servizi" },
];

async function ensureTags(tenantId) {
  const { data: existingRows, error: existingError } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("tenant_id", tenantId);

  if (existingError) throw existingError;

  const existing = new Map((existingRows || []).map((tag) => [tag.slug, tag]));
  const missing = EXTRA_TAGS.filter((tag) => !existing.has(tag.slug));

  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("tags")
      .insert(missing.map((tag) => ({ tenant_id: tenantId, ...tag })))
      .select("id, name, slug");

    if (insertError) throw insertError;
    for (const tag of inserted || []) {
      existing.set(tag.slug, tag);
    }
  }

  return existing;
}

async function upsertCmsMemberships({ tenantId, siteId, userId, cmsRole, platformRole }) {
  const { data: existingCms } = await supabase
    .from("user_tenants")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingCms?.id) {
    const { error } = await supabase.from("user_tenants").update({ role: cmsRole }).eq("id", existingCms.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("user_tenants").insert({
      tenant_id: tenantId,
      user_id: userId,
      role: cmsRole,
    });
    if (error) throw error;
  }

  const { data: existingPlatform } = await supabase
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("site_id", siteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingPlatform?.id) {
    const { error } = await supabase
      .from("tenant_memberships")
      .update({
        role: platformRole,
        revoked_at: null,
        joined_at: new Date().toISOString(),
      })
      .eq("id", existingPlatform.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("tenant_memberships").insert({
      tenant_id: tenantId,
      site_id: siteId,
      user_id: userId,
      role: platformRole,
      joined_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

async function upsertWorkflowArticle({
  tenantId,
  categoryId,
  authorId,
  slug,
  title,
  subtitle,
  summary,
  body,
  status,
  coverImageUrl,
  tagIds,
  publishedAt = null,
  scheduledAt = null,
  attachments = [],
  isFeatured = false,
  isBreaking = false,
  isPremium = false,
  tonePreset = "giornalistico",
  stylePreset = "classico",
}) {
  const payload = {
    tenant_id: tenantId,
    author_id: authorId,
    title,
    subtitle: subtitle || null,
    slug,
    summary,
    body,
    cover_image_url: coverImageUrl || null,
    category_id: categoryId,
    status,
    is_featured: isFeatured,
    is_breaking: isBreaking,
    is_premium: isPremium,
    meta_title: `${title} | Val Brembana Web`,
    meta_description: summary,
    og_image_url: coverImageUrl || null,
    published_at: publishedAt,
    scheduled_at: scheduledAt,
    import_source: "newsroom_seed",
    import_metadata: {
      desk_origin: "newsroom_seed",
      desk_media: attachments,
      desk_tone_preset: tonePreset,
      desk_style_preset: stylePreset,
      desk_tone_slider: 48,
      desk_length_slider: 58,
      desk_ai_prompt: "Taglio locale autorevole, dati chiari, apertura forte e chiusura utile.",
      desk_ai_facts: summary,
      desk_ai_inputs: `${title}\n${summary}`,
      workflow_seed: true,
    },
  };

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();

  let articleId = existing?.id || null;
  if (articleId) {
    const { error } = await supabase.from("articles").update(payload).eq("id", articleId);
    if (error) throw error;
  } else {
    const { data: inserted, error } = await supabase.from("articles").insert(payload).select("id").single();
    if (error || !inserted) throw error || new Error("Unable to create article");
    articleId = inserted.id;
  }

  const { error: revisionsDeleteError } = await supabase.from("article_revisions").delete().eq("article_id", articleId);
  if (revisionsDeleteError) throw revisionsDeleteError;

  const revisions = [
    {
      article_id: articleId,
      title: `${title} - prima stesura`,
      body: richBody([
        summary,
        "Prima stesura raccolta dal desk mobile con fonti ancora da consolidare.",
      ]),
      changed_by: authorId,
    },
    {
      article_id: articleId,
      title,
      body,
      changed_by: authorId,
    },
  ];

  const { error: revisionsInsertError } = await supabase.from("article_revisions").insert(revisions);
  if (revisionsInsertError) throw revisionsInsertError;

  const { error: tagDeleteError } = await supabase.from("article_tags").delete().eq("article_id", articleId);
  if (tagDeleteError) throw tagDeleteError;

  if (tagIds.length > 0) {
    const { error: tagInsertError } = await supabase
      .from("article_tags")
      .insert(tagIds.map((tagId) => ({ article_id: articleId, tag_id: tagId })));
    if (tagInsertError) throw tagInsertError;
  }

  return articleId;
}

async function main() {
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    throw tenantError || new Error(`Tenant ${tenantSlug} not found`);
  }

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, tenant_id")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (siteError || !site) {
    throw siteError || new Error("Site not found for tenant");
  }

  const [
    membershipRows,
    categoryRows,
    mediaRows,
    publishedRows,
    formRows,
  ] = await Promise.all([
    supabase.from("user_tenants").select("user_id, role").eq("tenant_id", tenant.id),
    supabase.from("categories").select("id, name, slug").eq("tenant_id", tenant.id).order("sort_order"),
    supabase.from("media").select("id, filename, original_filename, mime_type, url").eq("tenant_id", tenant.id).order("created_at", { ascending: true }),
    supabase.from("articles").select("id, title, slug, category_id, status").eq("tenant_id", tenant.id).eq("status", "published").order("published_at", { ascending: false }),
    supabase.from("site_forms").select("id, name, slug").eq("tenant_id", tenant.id).order("created_at"),
  ]);

  if (membershipRows.error) throw membershipRows.error;
  if (categoryRows.error) throw categoryRows.error;
  if (mediaRows.error) throw mediaRows.error;
  if (publishedRows.error) throw publishedRows.error;
  if (formRows.error) throw formRows.error;

  const memberships = membershipRows.data || [];
  const superAdmin = memberships.find((item) => item.role === "super_admin")?.user_id || memberships[0]?.user_id;
  const chiefEditor = memberships.find((item) => item.role === "chief_editor")?.user_id || superAdmin;
  const contributor = memberships.find((item) => item.role === "contributor")?.user_id || superAdmin;
  const editors = memberships.filter((item) => item.role === "editor").map((item) => item.user_id);
  const editorPrimary = editors[0] || chiefEditor;
  const editorSecondary = editors[1] || editorPrimary;

  const categoryMap = new Map((categoryRows.data || []).map((row) => [row.slug, row]));
  const tagMap = await ensureTags(tenant.id);
  const imageMedia = (mediaRows.data || []).filter((item) => item.mime_type?.startsWith("image/"));
  const videoMedia = (mediaRows.data || []).filter((item) => item.mime_type?.startsWith("video/"));
  const forms = formRows.data || [];
  const publishedArticles = publishedRows.data || [];

  await Promise.all([
    upsertCmsMemberships({ tenantId: tenant.id, siteId: site.id, userId: chiefEditor, cmsRole: "chief_editor", platformRole: "admin" }),
    upsertCmsMemberships({ tenantId: tenant.id, siteId: site.id, userId: editorPrimary, cmsRole: "editor", platformRole: "editor" }),
    upsertCmsMemberships({ tenantId: tenant.id, siteId: site.id, userId: editorSecondary, cmsRole: "editor", platformRole: "editor" }),
    upsertCmsMemberships({ tenantId: tenant.id, siteId: site.id, userId: contributor, cmsRole: "contributor", platformRole: "viewer" }),
  ]);

  const articleSpecs = [
    {
      slug: "riunione-protezione-civile-zogno-piano-frane",
      title: "Protezione civile, a Zogno tavolo urgente sul piano frane dopo le ultime segnalazioni dai versanti",
      subtitle: "La bozza raccoglie dati da affinare con il Comune e i tecnici entro sera.",
      summary: "Bozza di cronaca in lavorazione con fonti istituzionali gia` raccolte e verifica finale ancora aperta.",
      body: richBody([
        "La redazione ha aperto una bozza rapida dopo la riunione convocata a Zogno tra protezione civile, tecnici comunali e volontari di vallata. Il nodo centrale riguarda i versanti monitorati nelle ultime 48 ore e il calendario dei sopralluoghi da chiudere prima del fine settimana.",
        "Nel testo restano da consolidare i dettagli tecnici sulle opere minori e una dichiarazione ufficiale del sindaco. La scaletta desk prevede aggiornamento entro le 18, conferma dati meteo e richiamo ai tratti di viabilita` da seguire con maggiore attenzione.",
      ]),
      status: "draft",
      authorId: contributor,
      categorySlug: "cronaca",
      tagSlugs: ["comuni", "primo-piano", "viabilita"],
      media: imageMedia[0],
      tonePreset: "urgente",
    },
    {
      slug: "tg-valle-sopralluogo-ciclabile-brembo",
      title: "TG Valle, sopralluogo sulla ciclabile del Brembo: clip pronta, testo in revisione e lanci da stringere",
      subtitle: "Servizio video con immagini raccolte in mattinata e chiusura ancora da alleggerire.",
      summary: "Pezzo in revisione con video e testo gia` montati, in attesa della rilettura finale del desk.",
      body: richBody([
        "Il servizio video sul sopralluogo tecnico lungo la ciclabile del Brembo e` entrato in revisione con una prima scaletta gia` definita: apertura su immagini di campo, secondo blocco sulle manutenzioni piu` urgenti, chiusura sui tempi comunicati dagli uffici.",
        "Il desk ha chiesto una stretta sui lanci e un controllo finale sui nomi dei tratti interessati, in modo da allineare servizio video e articolo di accompagnamento senza duplicazioni o riferimenti imprecisi.",
      ]),
      status: "in_review",
      authorId: contributor,
      categorySlug: "territorio",
      tagSlugs: ["video-tg", "montagna", "turismo"],
      media: videoMedia[0] || imageMedia[1],
      tonePreset: "giornalistico",
      stylePreset: "live",
    },
    {
      slug: "san-pellegrino-visite-guidate-borghi-storici",
      title: "San Pellegrino prepara il calendario delle visite guidate nei borghi storici, scheda pronta per la verifica finale",
      subtitle: "Testo approvato dal desk in attesa di messa online con galleria e box servizi.",
      summary: "Articolo approvato e pronto alla pubblicazione con taglio culturale e box pratico per i lettori.",
      body: richBody([
        "Il calendario di primavera delle visite guidate nei borghi storici di San Pellegrino e` pronto per andare online dopo il via libera del desk. Il focus dell'articolo resta sulla formula delle passeggiate accompagnate, i punti di ritrovo e la novita` delle tappe dedicate ai cortili interni.",
        "Il caporedattore ha chiesto solo un ultimo controllo sugli orari di partenza e sui contatti per le prenotazioni, gia` inseriti in chiusura insieme ai riferimenti per i gruppi e alle date delle visite speciali.",
      ]),
      status: "approved",
      authorId: chiefEditor,
      categorySlug: "cultura",
      tagSlugs: ["weekend", "cultura"],
      media: imageMedia[2],
    },
    {
      slug: "basket-serina-corsa-playoff-sabato-chiave",
      title: "Basket, la corsa playoff della valle passa da un sabato chiave a Serina: pezzo approvato e programmato",
      subtitle: "Il desk sport ha chiuso il testo e fissato l'uscita automatica nel pomeriggio.",
      summary: "Articolo sportivo approvato con programmazione attiva, pronto a uscire senza interventi manuali.",
      body: richBody([
        "La redazione sport ha chiuso il pezzo sulla corsa playoff con un taglio orientato al servizio: stato di forma, calendario residuo, avversarie dirette e atmosfera attesa al palazzetto di Serina. Nel box di supporto restano i riferimenti a orario, parcheggi e canali per seguire il risultato live.",
        "Il contenuto e` gia` approvato e programmato per il pomeriggio, quando il traffico del sito tende a crescere e la sezione sport raccoglie meglio i rilanci social e il traffico diretto da newsletter.",
      ]),
      status: "approved",
      authorId: editorPrimary,
      categorySlug: "sport",
      tagSlugs: ["basket", "weekend", "primo-piano"],
      media: imageMedia[3],
      scheduledAt: isoOffset({ days: 1, hours: 2 }),
    },
    {
      slug: "pista-ciclabile-alta-valle-sopralluogo-post-piogge",
      title: "Pista ciclabile in alta valle, sopralluogo post piogge: nota del direttore con taglio servizio ancora in bozza",
      subtitle: "Bozza interna con impostazione editoriale da chiudere dopo il confronto con la redazione.",
      summary: "Bozza del direttore focalizzata su metodo, servizio ai lettori e responsabilita` delle fonti.",
      body: richBody([
        "La bozza interna raccoglie il punto di vista editoriale sul sopralluogo lungo la ciclabile dopo le piogge. L'obiettivo e` evitare titoli allarmistici e spiegare invece in modo semplice cosa e` aperto, cosa va monitorato e quali tempi ha comunicato il territorio.",
        "Prima della pubblicazione serve una verifica con il desk cronaca per allineare il tono all'apertura principale e mantenere coerenza con il servizio video e con gli aggiornamenti del ticker.",
      ]),
      status: "draft",
      authorId: superAdmin,
      categorySlug: "editoriali",
      tagSlugs: ["opinioni", "servizi"],
      media: imageMedia[4],
      tonePreset: "istituzionale",
    },
    {
      slug: "san-giovanni-bianco-polo-civico-test-serale",
      title: "San Giovanni Bianco, il polo civico entra nella fase test dei servizi serali: pezzo in revisione",
      subtitle: "La struttura del pezzo e` pronta, mancano una conferma logistica e la battuta finale del Comune.",
      summary: "Articolo di cronaca in revisione con fonti gia` sentite e ultimo passaggio sul quadro servizi.",
      body: richBody([
        "Il polo civico di San Giovanni Bianco entra in una fase test con servizi serali che la redazione ha deciso di raccontare in chiave molto pratica: orari, spazi effettivamente aperti, impatto per famiglie e giovani, ricadute sul centro.",
        "Il desk ha chiesto un controllo finale sui numeri delle presenze attese e su un passaggio relativo alla sala studio, per evitare che la notizia esca con promesse non ancora operative.",
      ]),
      status: "in_review",
      authorId: editorSecondary,
      categorySlug: "cronaca",
      tagSlugs: ["comuni", "servizi"],
      media: imageMedia[5],
      tonePreset: "neutro",
    },
    {
      slug: "editoriale-desk-regola-titoli-autorita-locale",
      title: "Editoriale desk, la regola resta una: titoli forti sì, ma solo se l'autorita` locale regge i fatti",
      subtitle: "Pezzo approvato dal caporedattore per la pubblicazione nel fine settimana.",
      summary: "Editoriale approvato sul metodo redazionale: autorevolezza, verifica e lettura utile per il territorio.",
      body: richBody([
        "Nel lavoro di una testata locale il titolo deve aprire il pezzo, non sostituirlo. Questo editoriale mette in fila i principi con cui il desk vuole affrontare le giornate piu` tese: verifica delle fonti, chiarezza su cio` che sappiamo davvero e responsabilita` nel tenere separate analisi e fatti.",
        "L'uscita e` approvata ma non ancora online, perche` il desk vuole allinearla alla prossima newsletter e al richiamo di home dedicato agli editoriali di metodo.",
      ]),
      status: "approved",
      authorId: chiefEditor,
      categorySlug: "editoriali",
      tagSlugs: ["opinioni", "inchieste"],
      media: imageMedia[6],
      tonePreset: "istituzionale",
      stylePreset: "approfondimento",
    },
    {
      slug: "archivio-inverno-record-impianti-pasqua",
      title: "Archivio sport, inverno record e bilanci impianti verso Pasqua: pezzo chiuso e spostato in archivio",
      subtitle: "Contenuto conservato come storico interno per il desk.",
      summary: "Articolo archiviato che resta utile come riferimento redazionale ma non rientra nel flusso attivo.",
      body: richBody([
        "Il pezzo riepiloga l'andamento della stagione invernale, i numeri sulle aperture e il passaggio verso le attivita` di Pasqua. Il desk ha deciso di archiviarlo perche` i dati sono stati assorbiti da contenuti piu` aggiornati e da un approfondimento piu` ampio.",
        "Resta comunque un riferimento utile per comparare i dati nelle prossime settimane e recuperare citazioni gia` verificate senza rimettere mano alla cronaca corrente.",
      ]),
      status: "archived",
      authorId: editorPrimary,
      categorySlug: "sport",
      tagSlugs: ["montagna", "weekend"],
      media: imageMedia[7],
    },
    {
      slug: "festival-borghi-prove-generali-programma",
      title: "Festival dei Borghi, prove generali sul programma: bozza cultura con box ancora da completare",
      subtitle: "La collaboratrice ha chiuso il grosso del testo ma resta da definire il taglio del box ospiti.",
      summary: "Bozza cultura con struttura solida, in attesa di completamento del box programma e ospiti.",
      body: richBody([
        "La bozza sul Festival dei Borghi mette in fila il programma, i luoghi e le prime conferme arrivate dagli organizzatori. Restano da completare il box ospiti e una scheda pratica su biglietteria e prevendite, che il desk vuole tenere distinta dal pezzo principale.",
        "L'impianto generale funziona gia`: apertura forte, calendario ordinato e chiusura con utilita` per chi segue la rassegna durante il weekend.",
      ]),
      status: "draft",
      authorId: contributor,
      categorySlug: "cultura",
      tagSlugs: ["weekend", "cultura"],
      media: imageMedia[8] || imageMedia[0],
      stylePreset: "approfondimento",
    },
    {
      slug: "mercato-sabato-zogno-viabilita-nuovo-percorso",
      title: "Mercato del sabato a Zogno, il nuovo percorso viabilita` e` pronto: pezzo approvato per la mattina",
      subtitle: "Versione finale pronta con mappa, indicazioni e consigli pratici.",
      summary: "Articolo approvato con taglio servizio, pensato per essere messo online al mattino con forte utilita` pubblica.",
      body: richBody([
        "La versione finale del pezzo spiega il nuovo percorso della viabilita` durante il mercato del sabato a Zogno e raccoglie in modo chiaro deviazioni, parcheggi consigliati e orari di maggiore pressione. Il desk lo considera un contenuto di puro servizio da spingere in mattinata.",
        "Il taglio resta pratico e ordinato, con box finale sulle strade da evitare e richiamo ai canali social della testata per eventuali aggiornamenti in tempo reale.",
      ]),
      status: "approved",
      authorId: superAdmin,
      categorySlug: "cronaca",
      tagSlugs: ["viabilita", "servizi", "primo-piano"],
      media: imageMedia[9] || imageMedia[1],
      tonePreset: "neutro",
    },
  ];

  const workflowArticleIds = [];

  for (const spec of articleSpecs) {
    const category = categoryMap.get(spec.categorySlug);
    if (!category) {
      throw new Error(`Category ${spec.categorySlug} not found`);
    }

    const tagIds = spec.tagSlugs.map((slug) => tagMap.get(slug)?.id).filter(Boolean);
    const attachments = attachmentFor(spec.media);

    const articleId = await upsertWorkflowArticle({
      tenantId: tenant.id,
      categoryId: category.id,
      authorId: spec.authorId,
      slug: spec.slug,
      title: spec.title,
      subtitle: spec.subtitle,
      summary: spec.summary,
      body: spec.body,
      status: spec.status,
      coverImageUrl: spec.media?.url || null,
      tagIds,
      attachments,
      publishedAt: spec.status === "published" ? isoOffset({ days: -1 }) : null,
      scheduledAt: spec.scheduledAt || null,
      tonePreset: spec.tonePreset,
      stylePreset: spec.stylePreset || "classico",
    });

    workflowArticleIds.push(articleId);
  }

  const publishedArticleBySlug = new Map(publishedArticles.map((article) => [article.slug, article]));
  const commentTargets = [
    publishedArticleBySlug.get("test-articolo-demo-cms"),
    publishedArticleBySlug.get("zogno-ridisegna-nodo-bus-stazione"),
    publishedArticles[0],
  ].filter(Boolean);

  await supabase.from("article_comments").delete().eq("tenant_id", tenant.id);

  const comments = [
    {
      tenant_id: tenant.id,
      article_id: commentTargets[0]?.id,
      author_name: "Maria Rota",
      author_email: "maria.rota@example.com",
      body: "Articolo chiaro e utile, soprattutto per chi usa ogni giorno la stazione. Bene anche il richiamo ai tempi del cantiere.",
      status: "approved",
      source: "web",
      published_at: isoOffset({ days: -1, hours: -2 }),
      ip_hash: "demo-approved-1",
    },
    {
      tenant_id: tenant.id,
      article_id: commentTargets[0]?.id,
      author_name: "Gianni Milesi",
      author_email: "gianni.milesi@example.com",
      body: "Sarebbe utile aggiungere un dettaglio sui parcheggi temporanei durante la fase due.",
      status: "pending",
      source: "web",
      ip_hash: "demo-pending-1",
    },
    {
      tenant_id: tenant.id,
      article_id: commentTargets[1]?.id,
      author_name: "Promo Fast Money",
      author_email: "spam@bad-network.biz",
      body: "Ottimo contenuto, visita subito il nostro portale e guadagna da casa.",
      status: "spam",
      source: "web",
      ip_hash: "demo-spam-1",
    },
    {
      tenant_id: tenant.id,
      article_id: commentTargets[2]?.id,
      author_name: "Laura Sonzogni",
      author_email: "laura.sonzogni@example.com",
      body: "Il servizio sul desk e sulla testata rende bene il lavoro della redazione. Interessante il focus sul metodo.",
      status: "approved",
      source: "web",
      published_at: isoOffset({ days: -2, hours: -3 }),
      ip_hash: "demo-approved-2",
    },
    {
      tenant_id: tenant.id,
      article_id: commentTargets[2]?.id,
      author_name: "Utente irritato",
      author_email: "utente.irritato@example.com",
      body: "Commento rimosso dal desk durante la simulazione redazionale.",
      status: "trash",
      source: "web",
      ip_hash: "demo-trash-1",
    },
  ].filter((item) => item.article_id);

  if (comments.length > 0) {
    const { error: commentError } = await supabase.from("article_comments").insert(comments);
    if (commentError) throw commentError;
  }

  await supabase.from("form_submissions").delete().eq("tenant_id", tenant.id);

  const newsletterForm = forms.find((form) => form.slug === "newsletter-valle") || forms[0];
  const contactForm = forms.find((form) => form.slug === "contatti-redazione") || forms[1] || forms[0];

  const submissions = [
    {
      tenant_id: tenant.id,
      form_id: newsletterForm?.id,
      submitter_name: "Anna Pesenti",
      submitter_email: "anna.pesenti@example.com",
      payload: { email: "anna.pesenti@example.com", source: "footer-home", interest: "cronaca" },
      source_page: "/",
      ip_hash: "form-newsletter-1",
      status: "new",
    },
    {
      tenant_id: tenant.id,
      form_id: newsletterForm?.id,
      submitter_name: "Marco Ruggeri",
      submitter_email: "marco.ruggeri@example.com",
      payload: { email: "marco.ruggeri@example.com", source: "/sport", interest: "sport" },
      source_page: "/sport",
      ip_hash: "form-newsletter-2",
      status: "processed",
    },
    {
      tenant_id: tenant.id,
      form_id: contactForm?.id,
      submitter_name: "Comune di Zogno",
      submitter_email: "segreteria@comune.zogno.bg.it",
      payload: { subject: "Rettifica orari mercato", message: "Vi segnaliamo una modifica sugli orari di chiusura delle strade." },
      source_page: "/contatti",
      ip_hash: "form-contact-1",
      status: "new",
    },
    {
      tenant_id: tenant.id,
      form_id: contactForm?.id,
      submitter_name: "Pro Loco San Pellegrino",
      submitter_email: "info@prolocosanpellegrino.it",
      payload: { subject: "Evento di primavera", message: "Inviamo il programma aggiornato per il weekend del 5 aprile." },
      source_page: "/contatti",
      ip_hash: "form-contact-2",
      status: "replied",
    },
  ].filter((item) => item.form_id);

  if (submissions.length > 0) {
    const { error: submissionError } = await supabase.from("form_submissions").insert(submissions);
    if (submissionError) throw submissionError;
  }

  await supabase.from("events").delete().eq("tenant_id", tenant.id);
  const events = [
    {
      tenant_id: tenant.id,
      title: "Mercatino di Primavera in centro",
      description: "Banchi, artigianato locale e degustazioni in piazza per tutto il fine settimana.",
      location: "San Pellegrino Terme",
      image_url: imageMedia[2]?.url || null,
      category: "mercati",
      price: "Ingresso libero",
      ticket_url: null,
      starts_at: isoOffset({ days: 2, hours: 9 }),
      ends_at: isoOffset({ days: 2, hours: 15 }),
    },
    {
      tenant_id: tenant.id,
      title: "Passeggiata guidata lungo la ciclabile",
      description: "Escursione facile con accompagnatori locali e focus sui nuovi tratti riaperti.",
      location: "San Giovanni Bianco",
      image_url: imageMedia[4]?.url || null,
      category: "escursioni",
      price: "5 euro",
      ticket_url: "https://valbrembanaweb.com/eventi/passeggiata-ciclabile",
      starts_at: isoOffset({ days: 4, hours: 8 }),
      ends_at: isoOffset({ days: 4, hours: 11 }),
    },
    {
      tenant_id: tenant.id,
      title: "Presentazione del Festival dei Borghi",
      description: "Conferenza stampa aperta al pubblico con programma, ospiti e focus logistica.",
      location: "Palazzo Foppa",
      image_url: imageMedia[8]?.url || null,
      category: "cultura",
      price: "Ingresso libero",
      ticket_url: null,
      starts_at: isoOffset({ days: 5, hours: 10 }),
      ends_at: isoOffset({ days: 5, hours: 12 }),
    },
    {
      tenant_id: tenant.id,
      title: "Basket serale, allenamento aperto del vivaio",
      description: "Sessione aperta con staff e giovani atleti prima del weekend decisivo.",
      location: "Palestra di Serina",
      image_url: imageMedia[3]?.url || null,
      category: "sport",
      price: "Ingresso libero",
      ticket_url: null,
      starts_at: isoOffset({ days: 1, hours: 17 }),
      ends_at: isoOffset({ days: 1, hours: 19 }),
    },
    {
      tenant_id: tenant.id,
      title: "Sportello straordinario servizi al cittadino",
      description: "Apertura serale sperimentale con prenotazione facoltativa e operatori comunali dedicati.",
      location: "Polo civico San Giovanni Bianco",
      image_url: imageMedia[5]?.url || null,
      category: "servizi",
      price: "Gratuito",
      ticket_url: null,
      starts_at: isoOffset({ days: 6, hours: 16 }),
      ends_at: isoOffset({ days: 6, hours: 20 }),
    },
  ];

  const { error: eventError } = await supabase.from("events").insert(events);
  if (eventError) throw eventError;

  await supabase.from("redirects").delete().eq("tenant_id", tenant.id);
  const redirects = [
    {
      tenant_id: tenant.id,
      source_path: "/vecchio-sito/consiglio-zogno-frane",
      target_path: "/articolo/riunione-protezione-civile-zogno-piano-frane",
      status_code: 301,
      is_active: true,
    },
    {
      tenant_id: tenant.id,
      source_path: "/viabilita/mercato-zogno",
      target_path: "/articolo/mercato-sabato-zogno-viabilita-nuovo-percorso",
      status_code: 302,
      is_active: true,
    },
    {
      tenant_id: tenant.id,
      source_path: "/sport/playoff-serina",
      target_path: "/articolo/basket-serina-corsa-playoff-sabato-chiave",
      status_code: 301,
      is_active: true,
    },
  ];
  const { error: redirectError } = await supabase.from("redirects").insert(redirects);
  if (redirectError) throw redirectError;

  await supabase.from("activity_log").delete().eq("tenant_id", tenant.id);

  const mediaForLog = imageMedia[0];
  const bannerRow = (await supabase.from("banners").select("id").eq("tenant_id", tenant.id).limit(1)).data?.[0] || null;
  const logEntries = [
    {
      tenant_id: tenant.id,
      user_id: contributor,
      action: "create",
      entity_type: "article",
      entity_id: workflowArticleIds[0],
      details: { title: "Bozza protezione civile aperta dal desk mobile", status: "draft" },
    },
    {
      tenant_id: tenant.id,
      user_id: contributor,
      action: "update",
      entity_type: "media",
      entity_id: mediaForLog?.id || null,
      details: { note: "Caricata foto di campo per il servizio sulla ciclabile" },
    },
    {
      tenant_id: tenant.id,
      user_id: editorSecondary,
      action: "update",
      entity_type: "article",
      entity_id: workflowArticleIds[5],
      details: { title: "Polo civico, richiesta verifica servizi", status: "in_review" },
    },
    {
      tenant_id: tenant.id,
      user_id: chiefEditor,
      action: "publish",
      entity_type: "banner",
      entity_id: bannerRow?.id || null,
      details: { note: "Rotazione ADV home aggiornata per il weekend" },
    },
    {
      tenant_id: tenant.id,
      user_id: chiefEditor,
      action: "update",
      entity_type: "event",
      entity_id: null,
      details: { note: "Calendario eventi primavera riallineato dal desk" },
    },
    {
      tenant_id: tenant.id,
      user_id: superAdmin,
      action: "update",
      entity_type: "settings",
      entity_id: null,
      details: { note: "Controllo linea editoriale e checklist pubblicazione" },
    },
    {
      tenant_id: tenant.id,
      user_id: superAdmin,
      action: "archive",
      entity_type: "article",
      entity_id: workflowArticleIds[7],
      details: { title: "Archivio inverno record", status: "archived" },
    },
    {
      tenant_id: tenant.id,
      user_id: contributor,
      action: "login",
      entity_type: "user",
      entity_id: contributor,
      details: { source: "giornalista-app" },
    },
    {
      tenant_id: tenant.id,
      user_id: editorPrimary,
      action: "update",
      entity_type: "article",
      entity_id: workflowArticleIds[3],
      details: { title: "Playoff Serina, programmato per domani", scheduled: true },
    },
    {
      tenant_id: tenant.id,
      user_id: chiefEditor,
      action: "update",
      entity_type: "article",
      entity_id: workflowArticleIds[6],
      details: { title: "Editoriale desk approvato", status: "approved" },
    },
  ];

  const { error: logError } = await supabase.from("activity_log").insert(logEntries);
  if (logError) throw logError;

  const { data: articleCounts } = await supabase
    .from("articles")
    .select("status")
    .eq("tenant_id", tenant.id);

  const statusSummary = {};
  for (const article of articleCounts || []) {
    statusSummary[article.status] = (statusSummary[article.status] || 0) + 1;
  }

  const { count: commentsCount } = await supabase
    .from("article_comments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);
  const { count: submissionsCount } = await supabase
    .from("form_submissions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);
  const { count: activityCount } = await supabase
    .from("activity_log")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);
  const { count: eventsCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);
  const { count: redirectsCount } = await supabase
    .from("redirects")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenant: tenant.slug,
        workflowArticlesSeeded: workflowArticleIds.length,
        statusSummary,
        comments: commentsCount ?? 0,
        formSubmissions: submissionsCount ?? 0,
        activityLog: activityCount ?? 0,
        events: eventsCount ?? 0,
        redirects: redirectsCount ?? 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
