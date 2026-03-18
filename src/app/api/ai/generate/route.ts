import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { AI_PROMPTS } from "@/lib/ai/prompts";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { resolveProvider, type AITask } from "@/lib/ai/resolver";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { tenant_id, type, title, article_body, summary } = body as {
      tenant_id: string;
      type: AITask;
      title: string;
      article_body: string;
      summary?: string;
    };

    if (!tenant_id || !type || !title) {
      return NextResponse.json({ error: "tenant_id, type, and title are required" }, { status: 400 });
    }

    // Get tenant settings
    const { data: tenant } = await supabase.from("tenants").select("settings").eq("id", tenant_id).single();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active. Activate in Moduli." }, { status: 403 });
    }

    // Resolve best provider for this task
    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const resolved = resolveProvider(aiConfig, type);

    // Build prompt
    const promptConfig = AI_PROMPTS[type as keyof typeof AI_PROMPTS];
    if (!promptConfig) {
      return NextResponse.json({ error: `Unknown prompt type: ${type}` }, { status: 400 });
    }

    const messages = [
      { role: "system" as const, content: promptConfig.system },
      { role: "user" as const, content: promptConfig.user(title, article_body || "", summary) },
    ];

    // Call the resolved provider
    const result = await callAI(resolved.provider, messages, {
      apiKey: resolved.apiKey,
      model: resolved.model,
    });

    // Parse JSON response
    let parsed;
    try {
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
