import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { callAIWithFallback } from '@/lib/ai/fallback';
import { HUMAN_WORKFLOW_GUIDANCE, buildCmsFactPolicy } from '@/lib/ai/prompts';
import type { AIMessage, AIProvider } from '@/lib/ai/providers';
import type { AITask } from '@/lib/ai/resolver';
import { getModuleConfig, isModuleActive } from '@/lib/modules';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { isAiEnabledForUser } from '@/lib/ai/access';

interface DispatchPayload {
  taskType: string;
  prompt: string;
  systemPrompt?: string;
  preferredProvider?: string;
  preferredModel?: string;
  tenant_id?: string;
}

const SUPPORTED_TASKS: ReadonlySet<AITask> = new Set([
  'seo',
  'titles',
  'social',
  'translate',
  'summary',
  'layout',
  'search',
  'related',
  'summarize',
  'chatbot',
  'field-assist',
  'color-palette',
]);

function normalizeTask(taskType?: string): AITask {
  if (taskType && SUPPORTED_TASKS.has(taskType as AITask)) {
    return taskType as AITask;
  }

  return 'chatbot';
}

export async function POST(request: NextRequest) {
  try {
    const body: DispatchPayload = await request.json();
    const { taskType, prompt, systemPrompt, preferredProvider, preferredModel, tenant_id } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check per-user AI access (superadmin toggle)
    if (!(await isAiEnabledForUser(user.id))) {
      return NextResponse.json({ error: 'AI disabled for this user' }, { status: 403 });
    }

    // Rate limit: 20 req / 10 min
    const clientIp = getClientIp(request);
    const limiter = await checkRateLimit(`ai-dispatch:${user.id}:${clientIp}`, 20, 10 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Get tenant_id from auth or request
    let tenantToUse = tenant_id;
    if (!tenantToUse) {
      const { data: userTenants } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      tenantToUse = userTenants?.tenant_id;
    }

    if (!tenantToUse) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // Verify tenant membership if tenant_id was provided
    if (tenant_id) {
      const { data: access } = await supabase
        .from('user_tenants')
        .select('id')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant_id)
        .single();

      if (!access) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Load tenant config
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, settings')
      .eq('id', tenantToUse)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const settings = (tenant.settings || {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active for this tenant" }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const safeTenantName = (tenant.name || tenantToUse || '').replace(/["\\\n\r]/g, '');
    const sysPrompt = systemPrompt || `Sei un assistente AI del CMS online del tenant "${safeTenantName}". Aiuti redazione, SEO, analytics, tecnico e gestione operativa.
Non sei un builder visuale e non parli dell'editor desktop se non richiesto come integrazione CMS.
Rispondi in italiano in modo conciso, pratico e orientato all'azione. Task: ${taskType || 'general'}.
${buildCmsFactPolicy({ tenantName: safeTenantName })}
${HUMAN_WORKFLOW_GUIDANCE}`;

    const task = normalizeTask(taskType);

    // Build messages
    const messages: AIMessage[] = [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: prompt },
    ];

    let result;
    try {
      result = await callAIWithFallback({
        aiConfig,
        task,
        messages,
        preferredProvider: preferredProvider as AIProvider | undefined,
        preferredModel,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/No AI provider configured|non configurato/i.test(message)) {
        return NextResponse.json(
          { error: 'No AI provider configured. Go to Settings > AI' },
          { status: 400 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      content: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      fallbackUsed: result.fallbackUsed,
      attempts: result.attempts,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('AI dispatch error:', err);
    return NextResponse.json(
      { error: err.message || 'AI generation error', content: '' },
      { status: 500 }
    );
  }
}
