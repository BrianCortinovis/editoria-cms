import { NextRequest, NextResponse } from "next/server";
import { callAIWithFallback } from "@/lib/ai/fallback";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { sanitizeFieldResponse } from "@/lib/ai/field-response";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AIMessage } from "@/lib/ai/providers";

const DEFAULT_TENANT_ID = "125172d3-f498-439f-a045-61e409dac706";

function buildMessages(system: string, prompt: string): AIMessage[] {
  return [
    { role: "system", content: system },
    { role: "user", content: prompt },
  ];
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, needles: string[]) {
  const normalized = normalizeText(text);
  return needles.some((needle) => normalized.includes(normalizeText(needle)));
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tenantId = body.tenant_id || DEFAULT_TENANT_ID;

    const supabase = await createServiceRoleClient();
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("name, settings")
      .eq("id", tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const aiConfig = tenant.settings?.module_config?.ai_assistant || {};

    const tests = [
      {
        name: "page-seo-analytics",
        task: "chatbot" as const,
        messages: buildMessages(
          buildChatSystemPrompt({ tenantName: tenant.name, pageTitle: "Impostazioni" }),
          "Pagina aperta: Impostazioni sito. In massimo 6 punti, cosa devo controllare per SEO e analytics prima di pubblicare?",
        ),
        validate: (text: string) =>
          includesAny(text, ["seo", "analytics", "meta", "tracking", "google"]),
      },
      {
        name: "cross-area-media",
        task: "chatbot" as const,
        messages: buildMessages(
          buildChatSystemPrompt({ tenantName: tenant.name, pageTitle: "Impostazioni" }),
          "Anche se sono nella pagina impostazioni, spiegami cosa devo controllare nel modulo Media del CMS prima di pubblicare una gallery.",
        ),
        validate: (text: string) =>
          includesAny(text, ["media", "gallery", "immagini", "alt", "formato"]),
      },
      {
        name: "field-assist-contract",
        task: "field-assist" as const,
        messages: buildMessages(
          "Sei un assistente del CMS online. Compili campi del CMS e restituisci solo il valore finale del campo.",
          [
            'Campo da compilare: Nome testata',
            'Nome interno: name',
            'Tipo: text',
            'Valore attuale: ""',
            'Richiesta utente: imposta Val Brembana Web QA CMS',
            'ISTRUZIONI OBBLIGATORIE:',
            '- Restituisci SOLO il valore finale da inserire nel campo.',
          ].join("\n"),
        ),
        validate: (text: string) => {
          const sanitized = sanitizeFieldResponse(text);
          return includesAny(sanitized, ["val brembana", "brembana web"]);
        },
      },
      {
        name: "fallback-openai-to-next-provider",
        task: "chatbot" as const,
        preferredProvider: "openai" as const,
        messages: buildMessages(
          "Sei un assistente del CMS online. Rispondi solo con una frase breve in italiano.",
          "Rispondi con una frase breve: controllo CMS ok.",
        ),
        validate: (text: string) => text.trim().length > 0,
      },
    ];

    const results = [];

    for (const test of tests) {
      const startedAt = Date.now();

      try {
        const result = await callAIWithFallback({
          aiConfig,
          task: test.task,
          messages: test.messages,
          preferredProvider: test.preferredProvider,
        });

        const ok = test.validate(result.text);
        results.push({
          name: test.name,
          ok,
          elapsedMs: Date.now() - startedAt,
          provider: result.provider,
          model: result.model,
          fallbackUsed: result.fallbackUsed,
          attempts: result.attempts,
          preview: result.text.slice(0, 240),
          sanitizedPreview:
            test.name === "field-assist-contract"
              ? sanitizeFieldResponse(result.text)
              : undefined,
        });
      } catch (testError) {
        results.push({
          name: test.name,
          ok: false,
          elapsedMs: Date.now() - startedAt,
          error: testError instanceof Error ? testError.message : String(testError),
        });
      }
    }

    const passed = results.filter((entry) => entry.ok).length;

    return NextResponse.json({
      tenantId,
      passed,
      total: results.length,
      ok: passed === results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (routeError) {
    return NextResponse.json(
      { error: routeError instanceof Error ? routeError.message : String(routeError) },
      { status: 500 },
    );
  }
}
