import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { resolveProvider } from "@/lib/ai/resolver";

function detectPageType(filePath: string): string {
  const name = filePath.toLowerCase().replace(/\\/g, "/");
  const file = name.split("/").pop() || "";
  if (file.match(/^index\.|^home\./)) return "homepage";
  if (file.match(/^about|^chi-siamo/)) return "about";
  if (file.match(/^contact|^contatt/)) return "contact";
  if (file.match(/^event|^eventi/)) return "events";
  if (file.match(/^meteo|^weather/)) return "meteo";
  if (file.match(/^webcam/)) return "webcam";
  if (file.match(/^sci|^ski/)) return "ski";
  if (file.match(/^trek/)) return "trekking";
  if (file.match(/^dove-alloggiare|^alloggi|^hotel/)) return "accommodation";
  if (file.match(/^dove-mangiare|^ristoranti/)) return "restaurant";
  if (file.match(/^attivit/)) return "activities";
  if (file.match(/^alpini|^alpine/)) return "alpine";
  if (file.match(/^map|^mappa/)) return "map";
  if (file.match(/^admin/)) return "skip";
  return "other";
}

function getPageLabel(page: string): string {
  const labels: Record<string, string> = {
    homepage: "Homepage", about: "Chi Siamo", contact: "Contatti", events: "Eventi",
    meteo: "Meteo", webcam: "Webcam", ski: "Sci", trekking: "Trekking",
    accommodation: "Dove Alloggiare", restaurant: "Dove Mangiare",
    activities: "Attività", alpine: "Alpini", map: "Mappa", other: "Altra pagina",
  };
  return labels[page] || page;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenant_id, files } = await request.json();
    if (!tenant_id || !files || !Array.isArray(files)) {
      return NextResponse.json({ error: "tenant_id and files array required" }, { status: 400 });
    }

    const { data: tenant } = await supabase.from("tenants").select("settings").eq("id", tenant_id).single();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active" }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const resolved = resolveProvider(aiConfig, "layout");

    // Group files by detected page type
    const pageFiles: Record<string, { path: string; content: string }[]> = {};
    for (const file of files) {
      const ext = (file.path || "").split(".").pop()?.toLowerCase();
      if (!ext || !["html", "htm", "tsx", "jsx", "vue", "svelte", "astro"].includes(ext)) continue;
      const page = detectPageType(file.path || "");
      if (page === "skip") continue;
      if (!pageFiles[page]) pageFiles[page] = [];
      pageFiles[page].push(file);
    }

    const allPages: Record<string, unknown[]> = {};
    let totalProvider = "";

    // Analyze each page separately with its own AI call
    for (const [page, pFiles] of Object.entries(pageFiles)) {
      const fileContent = pFiles
        .map(f => f.content?.slice(0, 4000) || "")
        .join("\n\n");

      if (!fileContent.trim()) continue;

      try {
        const result = await callAI(resolved.provider, [
          {
            role: "system",
            content: `Analizza il codice HTML di UNA SINGOLA PAGINA di un sito giornalistico e identifica TUTTE le zone editabili.

Questa è la pagina: "${getPageLabel(page)}" (${page})

Per ogni zona trovata restituisci:
- slot_key: id univoco kebab-case
- label: nome italiano
- content_type: "articles", "events", "breaking_news", "banners", o "static"
- max_items: numero elementi (1 per hero, 3-8 per griglie)
- layout_width: "full", "2/3", "1/2", "1/3", "1/4"
- layout_height: "hero", "large", "medium", "small"
- grid_cols: colonne se griglia (1-4)
- description: dove si trova

IMPORTANTE: cerca TUTTE le sezioni della pagina:
- Header/nav
- Hero/slideshow
- Griglie di contenuti
- Sezioni a 2 colonne (main + sidebar = 2/3 + 1/3)
- Banner pubblicitari
- Ticker/breaking news
- Liste (hotel, ristoranti, sentieri, ecc.)
- Form (contatto, newsletter)
- Footer
- Qualsiasi area con contenuto testuale

Rispondi SOLO JSON valido, senza markdown:
{"slots": [{"slot_key": "...", "label": "...", "content_type": "...", "max_items": 1, "layout_width": "full", "layout_height": "medium", "grid_cols": 1, "description": "..."}]}`
          },
          {
            role: "user",
            content: `Codice HTML della pagina "${getPageLabel(page)}":\n\n${fileContent}`
          }
        ], { apiKey: resolved.apiKey, model: resolved.model });

        totalProvider = result.provider;

        let parsed;
        try {
          let cleanText = result.text.trim();
          if (cleanText.startsWith("```")) cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          parsed = JSON.parse(cleanText);
        } catch {
          continue;
        }

        if (parsed.slots && Array.isArray(parsed.slots) && parsed.slots.length > 0) {
          allPages[page] = parsed.slots;
        }
      } catch {
        // Skip failed pages, continue with others
        continue;
      }
    }

    return NextResponse.json({
      pages: allPages,
      detected_pages: Object.keys(allPages),
      total_slots: Object.values(allPages).reduce((sum, s) => sum + s.length, 0),
      analysis: `Analizzate ${Object.keys(allPages).length} pagine: ${Object.keys(allPages).map(p => getPageLabel(p)).join(", ")}`,
      provider: totalProvider,
      model: resolved.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
