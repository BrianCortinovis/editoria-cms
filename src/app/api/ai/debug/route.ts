import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { callAI } from '@/lib/ai/providers';
import { resolveProvider } from '@/lib/ai/resolver';
import type { AIMessage } from '@/lib/ai/providers';

interface DebugPayload {
  prompt: string;
  systemPrompt?: string;
  blockList?: string;
}

const FALLBACK_ORDER: Record<string, string[]> = {
  claude: ['openai', 'gemini'],
  openai: ['gemini', 'claude'],
  gemini: ['openai', 'claude'],
  ollama: ['gemini', 'openai'],
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body: DebugPayload = await request.json();
    const { prompt, systemPrompt, blockList } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt richiesto' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from auth
    const { data: userTenants } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = userTenants?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // Load tenant config
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const aiConfig = tenant.settings?.module_config?.ai_assistant || {};

    // Resolve provider
    let resolvedProvider;
    try {
      resolvedProvider = resolveProvider(aiConfig, 'chatbot' as any);
    } catch (e) {
      return NextResponse.json(
        { error: 'Nessun provider IA configurato' },
        { status: 400 }
      );
    }

    // Build system prompt
    const defaultSystemPrompt = blockList
      ? `Sei un assistente AI per un builder/CMS giornalistico. Puoi creare layout con blocchi.
Blocchi disponibili: ${blockList}
Quando crei layout, genera JSON array con azioni "add-block". Usa SOLO blocchi dalla lista. Rispondi sempre in italiano.`
      : `Sei un assistente AI. Rispondi in italiano.`;

    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

    // Build messages
    const messages: AIMessage[] = [
      { role: 'system', content: finalSystemPrompt },
      { role: 'user', content: prompt },
    ];

    // Call AI with fallback chain
    let lastError: Error | null = null;
    const tryProviders = [resolvedProvider.provider, ...(FALLBACK_ORDER[resolvedProvider.provider] || [])];

    const logs: string[] = [];
    logs.push(`🔍 Debug AI Request`);
    logs.push(`📍 Provider: ${resolvedProvider.provider}`);
    logs.push(`🔄 Fallback chain: ${tryProviders.join(' → ')}`);
    logs.push(`\n📝 System Prompt:\n${finalSystemPrompt}\n`);
    logs.push(`💬 User Prompt:\n${prompt}\n`);

    for (const provider of tryProviders as any[]) {
      try {
        logs.push(`\n🚀 Tentando con ${provider}...`);

        const credentials = {
          [`${provider}_api_key`]: aiConfig[`${provider}_api_key`],
          [`${provider}_model`]: aiConfig[`${provider}_model`],
          ollama_url: aiConfig.ollama_url,
          ollama_model: aiConfig.ollama_model,
        };

        const apiKey = provider === 'ollama'
          ? credentials.ollama_url
          : credentials[`${provider}_api_key`];

        if (!apiKey) {
          logs.push(`⚠️  ${provider}: API key non configurata`);
          continue;
        }

        logs.push(`⏳ Chiamata in corso...`);

        const result = await callAI(provider, messages, {
          apiKey,
          model: credentials[`${provider}_model`],
          ollamaUrl: provider === 'ollama' ? apiKey : undefined,
        });

        logs.push(`✨ Risposta ricevuta!`);
        logs.push(`📊 Provider usato: ${result.provider}`);
        logs.push(`🤖 Modello: ${result.model}`);
        logs.push(`\n📄 Response:\n${result.text}`);

        // Try to parse as JSON
        try {
          const parsed = JSON.parse(result.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, ''));
          logs.push(`\n✅ JSON valido!`);
          logs.push(`📦 Actions count: ${Array.isArray(parsed) ? parsed.length : 1}`);
          if (Array.isArray(parsed)) {
            parsed.forEach((action: any, idx: number) => {
              logs.push(`  [${idx}] ${action.action} - ${action.blockType || action.label || ''}`);
            });
          }
        } catch {
          logs.push(`\n⚠️  Risposta non è JSON`);
        }

        return NextResponse.json({
          success: true,
          content: result.text,
          provider: result.provider,
          model: result.model,
          logs: logs.join('\n'),
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logs.push(`❌ Errore: ${errMsg}`);
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    logs.push(`\n\n❌ Tutti i provider hanno fallito!`);
    return NextResponse.json({
      success: false,
      error: lastError?.message || 'Nessun provider disponibile',
      logs: logs.join('\n'),
    }, { status: 500 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err.message || 'Errore generico', logs: `❌ ${err.message}` },
      { status: 500 }
    );
  }
}
