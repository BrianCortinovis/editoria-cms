import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { resolveProvider, type AITask } from "@/lib/ai/resolver";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenant_id, task, system, prompt } = await request.json();
    if (!tenant_id || !prompt) {
      return NextResponse.json({ error: "tenant_id and prompt required" }, { status: 400 });
    }

    const { data: tenant } = await supabase.from("tenants").select("settings").eq("id", tenant_id).single();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active" }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const resolved = resolveProvider(aiConfig, (task || "seo") as AITask);

    const result = await callAI(resolved.provider, [
      { role: "system", content: system || "Sei un assistente editoriale per un CMS giornalistico italiano. Rispondi in modo conciso e utile in italiano." },
      { role: "user", content: prompt },
    ], { apiKey: resolved.apiKey, model: resolved.model });

    return NextResponse.json({
      text: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
