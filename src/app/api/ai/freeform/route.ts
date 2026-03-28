import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { callAIWithFallback } from "@/lib/ai/fallback";
import type { AITask } from "@/lib/ai/resolver";
import { buildCmsFactPolicy } from "@/lib/ai/prompts";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { isAiEnabledForUser } from "@/lib/ai/access";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check per-user AI access (superadmin toggle)
    if (!(await isAiEnabledForUser(user.id))) {
      return NextResponse.json({ error: "AI disabilitata per questo utente" }, { status: 403 });
    }

    // Rate limit: 15 req / 10 min
    const clientIp = getClientIp(request);
    const limiter = await checkRateLimit(`ai-freeform:${user.id}:${clientIp}`, 15, 10 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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

    const { data: tenant } = await supabase.from("tenants").select("name, settings").eq("id", tenant_id).single();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active" }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const safeTenantName = (tenant.name || tenant_id || '').replace(/["\\\n\r]/g, '');
    const result = await callAIWithFallback({
        aiConfig,
        task: (task || "seo") as AITask,
        messages: [
        { role: "system", content: system || `Sei un assistente operativo del CMS online del tenant "${safeTenantName}". Aiuti su redazione, SEO, analytics, tecnico, workflow, publish e gestione. Rispondi in italiano in modo conciso e utile.
${buildCmsFactPolicy({ tenantName: safeTenantName })}` },
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
