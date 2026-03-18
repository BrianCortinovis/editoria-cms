import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callAI, type AIProvider } from "@/lib/ai/providers";
import { AI_PROMPTS } from "@/lib/ai/prompts";
import { isModuleActive, getModuleConfig } from "@/lib/modules";

type PromptType = "seo" | "titles" | "social" | "translate" | "summary";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, type, title, article_body, summary } = body as {
      tenant_id: string;
      type: PromptType;
      title: string;
      article_body: string;
      summary?: string;
    };

    if (!tenant_id || !type || !title) {
      return NextResponse.json(
        { error: "tenant_id, type, and title are required" },
        { status: 400 }
      );
    }

    // Get tenant settings
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenant_id)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;

    // Check if AI module is active
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json(
        { error: "AI module not active for this tenant. Activate it in Settings > Modules." },
        { status: 403 }
      );
    }

    // Get AI config
    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const provider = (aiConfig.ai_provider || "claude") as AIProvider;
    const apiKey = aiConfig.ai_api_key;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured. Add it in Settings > Modules > AI Assistant." },
        { status: 400 }
      );
    }

    // Build prompt
    const promptConfig = AI_PROMPTS[type];
    if (!promptConfig) {
      return NextResponse.json(
        { error: `Unknown prompt type: ${type}` },
        { status: 400 }
      );
    }

    const messages = [
      { role: "system" as const, content: promptConfig.system },
      {
        role: "user" as const,
        content: promptConfig.user(title, article_body || "", summary),
      },
    ];

    // Call AI
    const result = await callAI(provider, messages, {
      apiKey,
      model: aiConfig.ai_model || undefined,
    });

    // Parse JSON response
    let parsed;
    try {
      // Clean markdown code blocks if present
      let cleanText = result.text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleanText);
    } catch {
      parsed = { raw: result.text };
    }

    return NextResponse.json({
      data: parsed,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
