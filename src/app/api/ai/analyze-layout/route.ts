import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callAI, type AIProvider } from "@/lib/ai/providers";
import { isModuleActive, getModuleConfig } from "@/lib/modules";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenant_id, files } = await request.json();

    if (!tenant_id || !files || !Array.isArray(files)) {
      return NextResponse.json({ error: "tenant_id and files array required" }, { status: 400 });
    }

    // Get tenant settings
    const { data: tenant } = await supabase.from("tenants").select("settings").eq("id", tenant_id).single();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active" }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const provider = (aiConfig.ai_provider || "claude") as AIProvider;
    const apiKey = aiConfig.ai_api_key;
    if (!apiKey) return NextResponse.json({ error: "AI API key not configured" }, { status: 400 });

    // Prepare file content for analysis (limit size)
    const filesSummary = files
      .filter((f: { path: string; content: string }) => {
        const ext = f.path.split(".").pop()?.toLowerCase();
        return ["html", "htm", "tsx", "jsx", "vue", "svelte", "astro"].includes(ext || "");
      })
      .slice(0, 15)
      .map((f: { path: string; content: string }) => `--- FILE: ${f.path} ---\n${f.content.slice(0, 2000)}`)
      .join("\n\n");

    if (!filesSummary) {
      return NextResponse.json({ error: "No valid files found" }, { status: 400 });
    }

    const result = await callAI(provider, [
      {
        role: "system",
        content: `Sei un esperto di web development e CMS. Analizza il codice sorgente di un sito web e identifica le zone/sezioni dove andrebbero posizionati contenuti editoriali (articoli, eventi, banner, ecc.).

Per ogni zona trovata, determina:
1. Un identificativo univoco (slot_key) in kebab-case
2. Un nome leggibile (label)
3. Il tipo di contenuto ideale (articles, events, breaking_news, banners)
4. Quanti elementi mostrare (max_items)
5. Una descrizione di dove si trova nel layout

Cerca: sezioni hero, griglie di articoli, sidebar, aree eventi, spazi per banner, footer con link, ecc.

Rispondi SEMPRE in JSON valido senza markdown:
{
  "slots": [
    {
      "slot_key": "hero",
      "label": "Articolo Principale",
      "content_type": "articles",
      "max_items": 1,
      "description": "Sezione hero in cima alla homepage",
      "style_hint": "full-width, large image"
    }
  ],
  "analysis": "breve descrizione del layout generale del sito"
}`
      },
      {
        role: "user",
        content: `Analizza questi file del sito web e identifica tutte le zone dove posizionare contenuti editoriali:\n\n${filesSummary}`
      }
    ], { apiKey, model: aiConfig.ai_model || undefined });

    let parsed;
    try {
      let cleanText = result.text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
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
