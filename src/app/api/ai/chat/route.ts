import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveProvider } from '@/lib/ai/resolver';
import { callAI } from '@/lib/ai/providers';
import { buildChatSystemPrompt } from '@/lib/ai/prompts';
import type { AIMessage, AIProvider } from '@/lib/ai/providers';

interface ChatPayload {
  messages: AIMessage[];
  tenant_id: string;
  provider?: AIProvider;
  model?: string;
  context?: { pageTitle?: string; pageMeta?: Record<string, unknown> };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatPayload = await request.json();
    const { messages, tenant_id, provider: overrideProvider, model: overrideModel, context } = body;

    if (!tenant_id || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify tenant membership
    const { data: access, error: accessError } = await supabase
      .from('user_tenants')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .single();

    if (accessError || !access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Load tenant config
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, settings')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const aiConfig = tenant.settings?.module_config?.ai_assistant || {};
    const tenantName = tenant.name || 'Editoria CMS';

    // Build system prompt with tenant context
    const systemPrompt = buildChatSystemPrompt({ tenantName, pageTitle: context?.pageTitle });

    // Prepare messages with system prompt
    const allMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system'),
    ];

    // Resolve provider
    let resolvedProvider;
    if (overrideProvider) {
      const credentials = {
        ...aiConfig,
        [overrideProvider === 'ollama' ? 'ollama_url' : `${overrideProvider}_api_key`]:
          overrideProvider === 'ollama' ? aiConfig.ollama_url : aiConfig[`${overrideProvider}_api_key`],
      };
      resolvedProvider = resolveProvider(credentials, 'chatbot');
      if (resolvedProvider.provider !== overrideProvider) {
        return NextResponse.json({ error: `Provider ${overrideProvider} not configured` }, { status: 400 });
      }
    } else {
      resolvedProvider = resolveProvider(aiConfig, 'chatbot');
    }

    // Override model if specified
    if (overrideModel) {
      resolvedProvider.model = overrideModel;
    }

    // Call AI with full conversation history
    const result = await callAI(
      resolvedProvider.provider,
      allMessages,
      {
        apiKey: resolvedProvider.provider === 'ollama' ? resolvedProvider.apiKey : resolvedProvider.apiKey,
        model: resolvedProvider.model,
        ollamaUrl: resolvedProvider.provider === 'ollama' ? resolvedProvider.apiKey : undefined,
      }
    );

    return NextResponse.json({
      text: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
