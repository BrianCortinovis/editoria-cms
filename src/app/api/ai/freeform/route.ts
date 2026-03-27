import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { callAIWithFallback } from "@/lib/ai/fallback";
import type { AITask } from "@/lib/ai/resolver";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenant_id, task, system, prompt } = await request.json();
    if (!tenant_id || !prompt) {
      return NextResponse.json({ error: "tenant_id and prompt required" }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from("user_tenants")
      .select("id")
      .eq("user_id", user.id)
      .eq("tenant_id", tenant_id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: tenant } = await supabase.from("tenants").select("settings").eq("id", tenant_id).single();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active" }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const result = await callAIWithFallback({
      aiConfig,
      task: (task || "seo") as AITask,
      messages: [
        { role: "system", content: system || "Sei un assistente operativo del CMS online. Aiuti su redazione, SEO, analytics, tecnico, workflow, publish e gestione. Rispondi in italiano in modo conciso e utile." },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({
      text: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      fallbackUsed: result.fallbackUsed,
      attempts: result.attempts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
