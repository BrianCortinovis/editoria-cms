import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveProvider } from '@/lib/ai/resolver';
import { callProvider } from '@/lib/ai/providers';
import type { AIProvider } from '@/lib/ai/providers';

interface GeneratePayload {
  tenant_id: string;
  fieldName?: string;
  fieldType?: string;
  currentValue?: string;
  style?: string;
  context?: Record<string, unknown> | string;
  // OR
  type?: 'seo' | 'titles' | 'social' | 'translate' | 'summary';
  title?: string;
  article_body?: string;
  summary?: string;
  // Optional
  provider?: AIProvider;
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePayload = await request.json();
    const { tenant_id, provider: overrideProvider } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify user authentication
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

    // Load tenant config for API keys
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const aiConfig = tenant.settings?.module_config?.ai_assistant || {};
    let systemPrompt = '';
    let userPrompt = '';

    // Detect payload type and build prompts
    if (body.type && (body.type === 'seo' || body.type === 'titles' || body.type === 'social' || body.type === 'translate' || body.type === 'summary')) {
      // New structured task payload
      const title = body.title || '';
      const articleBody = body.article_body || '';
      const summary = body.summary || '';

      if (body.type === 'seo') {
        systemPrompt = 'Sei un esperto SEO per testate giornalistiche italiane. Genera metadati SEO ottimizzati. Rispondi SEMPRE in formato JSON valido.';
        userPrompt = `Analizza questo articolo e genera i metadati SEO ottimizzati.\n\nTITOLO: ${title}\n${summary ? `SOMMARIO: ${summary}` : ''}\nCORPO (primi 500 caratteri): ${articleBody.slice(0, 500)}\n\nRispondi in JSON con questa struttura: { "meta_title": "...", "meta_description": "...", "suggested_tags": [...], "og_description": "..." }`;
      } else if (body.type === 'titles') {
        systemPrompt = 'Sei un titolista esperto di giornalismo italiano. Genera titoli alternativi. Rispondi SEMPRE in formato JSON valido.';
        userPrompt = `Dato questo articolo, suggerisci 5 titoli alternativi efficaci per il web.\n\nTITOLO ATTUALE: ${title}\nCORPO (primi 500 caratteri): ${articleBody.slice(0, 500)}\n\nRispondi in JSON: { "titles": [...] }`;
      } else if (body.type === 'social') {
        systemPrompt = 'Sei un social media manager per testate giornalistiche. Crea post ottimizzati. Rispondi SEMPRE in formato JSON valido.';
        userPrompt = `Crea post per i social media basati su questo articolo.\n\nTITOLO: ${title}\nCORPO (primi 500 caratteri): ${articleBody.slice(0, 500)}\n\nRispondi in JSON: { "facebook": "...", "instagram": "...", "telegram": "...", "twitter": "..." }`;
      } else if (body.type === 'translate') {
        systemPrompt = 'Sei un traduttore professionista italiano-inglese specializzato in giornalismo. Traduci in modo naturale e accurato. Rispondi SEMPRE in formato JSON valido.';
        userPrompt = `Traduci questo articolo dall'italiano all'inglese.\n\nTITOLO: ${title}\n${summary ? `SOMMARIO: ${summary}` : ''}\nCORPO: ${articleBody.slice(0, 3000)}\n\nRispondi in JSON: { "title": "...", "summary": "...", "body": "..." }`;
      } else if (body.type === 'summary') {
        systemPrompt = 'Sei un giornalista esperto. Genera sommari concisi. Rispondi SEMPRE in formato JSON valido.';
        userPrompt = `Genera un sommario per questo articolo.\n\nTITOLO: ${title}\nCORPO (primi 1000 caratteri): ${articleBody.slice(0, 1000)}\n\nRispondi in JSON: { "summary": "...", "reading_hook": "..." }`;
      }
    } else {
      // Old form field payload
      const fieldName = body.fieldName || 'contenuto';
      const fieldType = body.fieldType || 'testo';
      const currentValue = body.currentValue || '';
      const style = body.style || '';
      const context = typeof body.context === 'string'
        ? body.context
        : body.context
          ? JSON.stringify(body.context, null, 2)
          : '';

      systemPrompt = `Sei un assistente AI per un CMS giornalistico. Genera contenuti di qualità. Rispondi sempre in italiano.`;
      userPrompt = `Genera contenuto per il campo "${fieldName}" di tipo "${fieldType}":
${currentValue ? `Contenuto attuale: ${currentValue}` : ''}
${context ? `Contesto disponibile:\n${context}` : ''}

${style === 'journalist' ? 'Scrivi nello stile di un giornalista professionista.' : ''}
${style === 'publication' ? 'Scrivi nello stile editoriale della rivista.' : ''}

Restituisci direttamente il valore finale del campo, senza spiegazioni superflue.`.trim();
    }

    // Resolve which provider to use
    let resolvedProvider;
    if (overrideProvider) {
      // If override provider specified, try to use it
      const credentials = {
        ...aiConfig,
        [overrideProvider === 'ollama' ? 'ollama_url' : `${overrideProvider}_api_key`]: overrideProvider === 'ollama' ? aiConfig.ollama_url : aiConfig[`${overrideProvider}_api_key`],
      };
      resolvedProvider = resolveProvider(credentials, 'summarize');
      if (resolvedProvider.provider !== overrideProvider) {
        return NextResponse.json({ error: `Provider ${overrideProvider} not configured` }, { status: 400 });
      }
    } else {
      resolvedProvider = resolveProvider(aiConfig, 'summarize');
    }

    // Handle Ollama URL vs API key
    const apiKey = resolvedProvider.provider === 'ollama'
      ? resolvedProvider.apiKey
      : resolvedProvider.apiKey;

    // Call the AI provider
    const result = await callProvider(
      resolvedProvider.provider,
      apiKey,
      { system: systemPrompt, prompt: userPrompt, model: resolvedProvider.model }
    );

    // Parse JSON response from AI (prompts instruct AI to return JSON)
    let parsedResult: unknown = result.text;
    try {
      parsedResult = JSON.parse(result.text);
    } catch {
      // If not valid JSON, keep as string (some prompts may return plain text)
      console.warn('AI response was not valid JSON', { provider: result.provider });
    }

    return NextResponse.json({
      result: parsedResult,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
