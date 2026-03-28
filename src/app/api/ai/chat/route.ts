import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { callAIWithFallback } from '@/lib/ai/fallback';
import { buildChatSystemPrompt } from '@/lib/ai/prompts';
import type { AIMessage, AIProvider } from '@/lib/ai/providers';
import { getModuleConfig, isModuleActive } from '@/lib/modules';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { isAiEnabledForUser } from '@/lib/ai/access';

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

    // Check per-user AI access (superadmin toggle)
    if (!(await isAiEnabledForUser(user.id))) {
      return NextResponse.json({ error: 'AI disabilitata per questo utente' }, { status: 403 });
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

    // Rate limit: 15 req / 10 min
    const clientIp = getClientIp(request);
    const limiter = await checkRateLimit(`ai-chat:${user.id}:${clientIp}`, 15, 10 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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

    const settings = (tenant.settings || {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: 'Modulo IA non attivo per questo tenant' }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const tenantName = tenant.name || 'Editoria CMS';

    // Build system prompt with tenant context
    const systemPrompt = buildChatSystemPrompt({ tenantName, pageTitle: context?.pageTitle });

    // Prepare messages with system prompt
    const allMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system'),
    ];

    const result = await callAIWithFallback({
      aiConfig,
      task: 'chatbot',
      messages: allMessages,
      preferredProvider: overrideProvider,
      preferredModel: overrideModel,
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
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
