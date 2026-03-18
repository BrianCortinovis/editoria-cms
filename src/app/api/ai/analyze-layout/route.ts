import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { resolveProvider } from "@/lib/ai/resolver";

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

    // Resolve best provider for layout analysis (Claude is best at code)
    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const resolved = resolveProvider(aiConfig, "layout");

    const filesSummary = files
      .filter((f: { path: string; content: string }) => {
        const ext = f.path.split(".").pop()?.toLowerCase();
        return ["html", "htm", "tsx", "jsx", "vue", "svelte", "astro"].includes(ext || "");
      })
      .slice(0, 15)
      .map((f: { path: string; content: string }) => `--- FILE: ${f.path} ---\n${f.content.slice(0, 2000)}`)
      .join("\n\n");

    if (!filesSummary) return NextResponse.json({ error: "No valid files found" }, { status: 400 });

    const result = await callAI(resolved.provider, [
      {
        role: "system",
        content: `Sei un esperto di web development e CMS. Analizza il codice sorgente di un INTERO sito web (più pagine HTML) e identifica TUTTE le zone editabili in OGNI pagina.

IMPORTANTE: analizza OGNI file separatamente. Ogni file è una pagina diversa del sito.

Per ogni zona trovata indica:
1. slot_key: identificativo univoco in kebab-case
2. label: nome leggibile italiano
3. page: tipo di pagina (homepage, article, category, about, contact, events, meteo, webcam, ski, trekking, accommodation, restaurant, activities, alpine, map, other)
4. content_type: articles, events, breaking_news, banners, o "static" per contenuto fisso
5. max_items: quanti elementi (1 per hero, 3-6 per griglie, ecc.)
6. layout_width: "full", "2/3", "1/2", "1/3", "1/4" — basato sul CSS reale
7. layout_height: "hero" (grande), "large", "medium", "small" — basato sulle dimensioni CSS
8. grid_cols: numero colonne se è una griglia
9. description: dove si trova nel layout

Cerca in ogni pagina: header, hero, griglie articoli, sidebar, due colonne affiancate, spazi banner, ticker, meteo, eventi, footer, form, ecc.

ATTENZIONE alle sezioni two-col/flex: se ci sono due div affiancati, sono slot separati con width 2/3 + 1/3.

Rispondi SEMPRE in JSON valido senza markdown:
{
  "pages": {
    "homepage": [
      {"slot_key": "hero", "label": "Hero Slideshow", "content_type": "articles", "max_items": 3, "layout_width": "full", "layout_height": "hero", "grid_cols": 1, "description": "Slideshow principale"}
    ],
    "meteo": [
      {"slot_key": "meteo-forecast", "label": "Previsioni Meteo", "content_type": "static", "max_items": 1, "layout_width": "full", "layout_height": "medium", "grid_cols": 3, "description": "Widget previsioni"}
    ]
  },
  "analysis": "descrizione del layout del sito"
}`
      },
      {
        role: "user",
        content: `Analizza questi file del sito web e identifica tutte le zone dove posizionare contenuti editoriali:\n\n${filesSummary}`
      }
    ], { apiKey: resolved.apiKey, model: resolved.model });

    let parsed;
    try {
      let cleanText = result.text.trim();
      if (cleanText.startsWith("```")) cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      parsed = JSON.parse(cleanText);
    } catch {
      parsed = { slots: [], analysis: result.text };
    }

    return NextResponse.json({
      ...parsed,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
