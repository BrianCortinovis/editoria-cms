import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { callAI } from '@/lib/ai/providers';
import { resolveProvider } from '@/lib/ai/resolver';
import type { AIMessage } from '@/lib/ai/providers';

interface DispatchPayload {
  taskType: string;
  prompt: string;
  systemPrompt?: string;
  preferredProvider?: string;
  tenant_id?: string;
}

const FALLBACK_ORDER: Record<string, string[]> = {
  claude: ['openai', 'gemini'],
  openai: ['gemini', 'claude'],
  gemini: ['openai', 'claude'],
  ollama: ['gemini', 'openai'],
};

export async function POST(request: NextRequest) {
  try {
    const body: DispatchPayload = await request.json();
    const { taskType, prompt, systemPrompt, preferredProvider, tenant_id } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt richiesto' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      .select('settings')
      .eq('id', tenantToUse)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const aiConfig = tenant.settings?.module_config?.ai_assistant || {};
    const sysPrompt = systemPrompt || `Sei un assistente AI integrato in un CMS editoriale. Aiuti l'utente a creare e ottimizzare contenuti. Rispondi in italiano in modo conciso e preciso. Task: ${taskType || 'general'}`;

    // Resolve provider (with fallback chain)
    let resolvedProvider;
    try {
      resolvedProvider = resolveProvider(aiConfig, (taskType || 'chatbot') as any);
    } catch (e) {
      return NextResponse.json(
        { error: 'Nessun provider IA configurato. Vai a Impostazioni > IA' },
        { status: 400 }
      );
    }

    // Override if preferred provider specified and available
    if (preferredProvider) {
      try {
        const credentials = { ...aiConfig };
        const overrideResolved = resolveProvider(
          { ...aiConfig, [`${preferredProvider}_api_key`]: aiConfig[`${preferredProvider}_api_key`] } as any,
          (taskType || 'chatbot') as any
        );
        if (overrideResolved.provider === preferredProvider) {
          resolvedProvider = overrideResolved;
        }
      } catch {
        // Fallback to default resolution
      }
    }

    // Build messages
    const messages: AIMessage[] = [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: prompt },
    ];

    // Call AI with fallback chain
    let lastError: Error | null = null;
    const tryProviders = [resolvedProvider.provider, ...(FALLBACK_ORDER[resolvedProvider.provider] || [])];

    for (const provider of tryProviders as any[]) {
      try {
        const credentials = {
          [`${provider}_api_key`]: aiConfig[`${provider}_api_key`],
          [`${provider}_model`]: aiConfig[`${provider}_model`],
          ollama_url: aiConfig.ollama_url,
          ollama_model: aiConfig.ollama_model,
        };

        // Get the credential for this provider
        const apiKey = provider === 'ollama'
          ? credentials.ollama_url
          : credentials[`${provider}_api_key`];

        if (!apiKey) {
          continue; // Try next provider
        }

        const result = await callAI(provider, messages, {
          apiKey,
          model: credentials[`${provider}_model`],
          ollamaUrl: provider === 'ollama' ? apiKey : undefined,
        });

        return NextResponse.json({
          content: result.text,
          provider: result.provider,
          model: result.model,
          usage: result.usage,
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue; // Try next provider
      }
    }

    // All providers failed
    throw lastError || new Error('Nessun provider IA disponibile');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('AI dispatch error:', err);
    return NextResponse.json(
      { error: err.message || 'Errore generazione AI', content: '' },
      { status: 500 }
    );
  }
}
