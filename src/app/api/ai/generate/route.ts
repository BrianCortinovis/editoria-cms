import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { callAIWithFallback } from '@/lib/ai/fallback';
import type { AIProvider } from '@/lib/ai/providers';
import type { AITask } from '@/lib/ai/resolver';
import { getModuleConfig, isModuleActive } from '@/lib/modules';
import { buildCmsFactPolicy } from '@/lib/ai/prompts';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { isAiEnabledForUser } from '@/lib/ai/access';

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

function inferFieldTask(fieldName?: string, fieldType?: string): AITask {
  const combined = `${fieldName || ''} ${fieldType || ''}`.toLowerCase();

  if (/(seo|meta|og|canonical|slug|tag)/.test(combined)) return 'seo';
  if (/(titolo|title|headline)/.test(combined)) return 'titles';
  if (/(social|facebook|instagram|telegram|twitter|x)/.test(combined)) return 'social';
  if (/(summary|sommario|excerpt|abstract|hook)/.test(combined)) return 'summary';

  return 'field-assist';
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

    // Rate limit: 20 req / 10 min
    const clientIp = getClientIp(request);
    const limiter = await checkRateLimit(`ai-generate:${user.id}:${clientIp}`, 20, 10 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Load tenant config for API keys
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, settings')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const safeTenantName = (tenant.name || tenant_id || '').replace(/["\\\n\r]/g, '');
    const factPolicy = buildCmsFactPolicy({ tenantName: safeTenantName });

    const settings = (tenant.settings || {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: 'Modulo IA non attivo per questo tenant' }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    let systemPrompt = '';
    let userPrompt = '';

    // Detect payload type and build prompts
    if (body.type && (body.type === 'seo' || body.type === 'titles' || body.type === 'social' || body.type === 'translate' || body.type === 'summary')) {
      // New structured task payload
      const title = body.title || '';
      const articleBody = body.article_body || '';
      const summary = body.summary || '';

      if (body.type === 'seo') {
        systemPrompt = `Sei un esperto SEO per testate giornalistiche italiane. Genera metadati SEO ottimizzati. Rispondi SEMPRE in formato JSON valido.
${factPolicy}`;
        userPrompt = `Analizza questo articolo e genera i metadati SEO ottimizzati.\n\nTITOLO: ${title}\n${summary ? `SOMMARIO: ${summary}` : ''}\nCORPO (primi 500 caratteri): ${articleBody.slice(0, 500)}\n\nRispondi in JSON con questa struttura: { "meta_title": "...", "meta_description": "...", "suggested_tags": [...], "og_description": "..." }`;
      } else if (body.type === 'titles') {
        systemPrompt = `Sei un titolista esperto di giornalismo italiano. Genera titoli alternativi. Rispondi SEMPRE in formato JSON valido.
${factPolicy}`;
        userPrompt = `Dato questo articolo, suggerisci 5 titoli alternativi efficaci per il web.\n\nTITOLO ATTUALE: ${title}\nCORPO (primi 500 caratteri): ${articleBody.slice(0, 500)}\n\nRispondi in JSON: { "titles": [...] }`;
      } else if (body.type === 'social') {
        systemPrompt = `Sei un social media manager per testate giornalistiche. Crea post ottimizzati. Rispondi SEMPRE in formato JSON valido.
${factPolicy}`;
        userPrompt = `Crea post per i social media basati su questo articolo.\n\nTITOLO: ${title}\nCORPO (primi 500 caratteri): ${articleBody.slice(0, 500)}\n\nRispondi in JSON: { "facebook": "...", "instagram": "...", "telegram": "...", "twitter": "..." }`;
      } else if (body.type === 'translate') {
        systemPrompt = `Sei un traduttore professionista italiano-inglese specializzato in giornalismo. Traduci in modo naturale e accurato. Rispondi SEMPRE in formato JSON valido.
${factPolicy}`;
        userPrompt = `Traduci questo articolo dall'italiano all'inglese.\n\nTITOLO: ${title}\n${summary ? `SOMMARIO: ${summary}` : ''}\nCORPO: ${articleBody.slice(0, 3000)}\n\nRispondi in JSON: { "title": "...", "summary": "...", "body": "..." }`;
      } else if (body.type === 'summary') {
        systemPrompt = `Sei un giornalista esperto. Genera sommari concisi. Rispondi SEMPRE in formato JSON valido.
${factPolicy}`;
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

      systemPrompt = `Sei un assistente AI per il CMS giornalistico del tenant "${safeTenantName}". Genera contenuti di qualità. Rispondi sempre in italiano.
${factPolicy}`;
      userPrompt = `Genera contenuto per il campo "${fieldName}" di tipo "${fieldType}":
${currentValue ? `Contenuto attuale: ${currentValue}` : ''}
${context ? `Contesto disponibile:\n${context}` : ''}

${style === 'journalist' ? 'Scrivi nello stile di un giornalista professionista.' : ''}
${style === 'publication' ? 'Scrivi nello stile editoriale della rivista.' : ''}

Restituisci direttamente il valore finale del campo, senza spiegazioni superflue.`.trim();
    }

    const task: AITask = body.type
      ? body.type
      : inferFieldTask(body.fieldName, body.fieldType);

    const result = await callAIWithFallback({
      aiConfig,
      task,
      preferredProvider: overrideProvider,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

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
      fallbackUsed: result.fallbackUsed,
      attempts: result.attempts,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
