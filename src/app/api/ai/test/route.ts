import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { callAI } from '@/lib/ai/providers';
import { resolveProvider } from '@/lib/ai/resolver';
import type { AIMessage } from '@/lib/ai/providers';

const BLOCK_LIST = 'section, hero, text, columns, container, image-gallery, video, slideshow, carousel, quote, accordion, tabs, social, newsletter, banner-ad, related-content, author-bio, timeline, counter, divider';

interface TestCase {
  name: string;
  prompt: string;
  expectedType: 'json' | 'text';
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Generic Layout - Home Page',
    prompt: 'Crea una home page giornalistica professionale con hero grande in alto, sotto sezioni per le notizie principali, editoriali e contenuti correlati',
    expectedType: 'json',
    description: 'Deve generare JSON array di blocchi per layout completo',
  },
  {
    name: 'Specific Article Layout',
    prompt: 'Crea il layout per una pagina articolo: titolo grande, immagine in evidenza, testo articolo, box autore, articoli correlati',
    expectedType: 'json',
    description: 'Deve generare blocchi per pagina articolo',
  },
  {
    name: 'Field Content - Title',
    prompt: 'Genera un titolo accattivante per un articolo sulle elezioni comunali',
    expectedType: 'text',
    description: 'Deve generare solo testo, non JSON',
  },
  {
    name: 'Field Content - Summary',
    prompt: 'Scrivi un riassunto di 50 parole per: "Il sindaco annuncia nuovi investimenti per la mobilità sostenibile"',
    expectedType: 'text',
    description: 'Deve generare testo conciso',
  },
  {
    name: 'Complex Layout - Magazine',
    prompt: 'Disegna una home page magazine con: hero principale, griglia di articoli in 3 colonne, timeline di ultime notizie, newsletter, banner pubblicitario',
    expectedType: 'json',
    description: 'Layout complesso con molti blocchi',
  },
  {
    name: 'SEO Content',
    prompt: 'Scrivi meta description (max 160 caratteri) per pagina home di giornale locale',
    expectedType: 'text',
    description: 'Testo specifico con vincolo lunghezza',
  },
];

function parseAiResponse(content: string): any[] | null {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.action) return [parsed];
    return null;
  } catch {
    return null;
  }
}

function validateJsonResponse(content: string): { valid: boolean; actionCount?: number; types?: string[] } {
  const parsed = parseAiResponse(content);
  if (!parsed) return { valid: false };

  const types = new Set(parsed.map((p: any) => p.action || p.blockType));
  return { valid: true, actionCount: parsed.length, types: Array.from(types) };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const aiConfig = tenant.settings?.module_config?.ai_assistant || {};

    let resolvedProvider;
    try {
      resolvedProvider = resolveProvider(aiConfig, 'chatbot' as any);
    } catch (e) {
      return NextResponse.json(
        { error: 'Provider not configured', status: 'error' },
        { status: 400 }
      );
    }

    const results: any[] = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of TEST_CASES) {
      const testResult: any = {
        name: testCase.name,
        description: testCase.description,
        expectedType: testCase.expectedType,
        status: 'pending',
        response: '',
        validation: null,
        error: null,
      };

      try {
        // Determine system prompt
        const systemPrompt = testCase.expectedType === 'json'
          ? `Sei un assistente AI per un builder giornalistico. Crea layout con blocchi.
Blocchi disponibili: ${BLOCK_LIST}
Rispondi SEMPRE con un JSON array di azioni "add-block". Rispondi SEMPRE in italiano.`
          : `Sei un assistente AI per un CMS editoriale. Genera contenuti concisi e di qualità. Rispondi sempre in italiano.`;

        const messages: AIMessage[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: testCase.prompt },
        ];

        const result = await callAI(resolvedProvider.provider, messages, {
          apiKey: aiConfig[`${resolvedProvider.provider}_api_key`],
          model: aiConfig[`${resolvedProvider.provider}_model`],
        });

        testResult.response = result.text.substring(0, 500) + (result.text.length > 500 ? '...' : '');
        testResult.provider = result.provider;
        testResult.model = result.model;

        // Validate response type
        if (testCase.expectedType === 'json') {
          const validation = validateJsonResponse(result.text);
          testResult.validation = validation;
          if (validation.valid) {
            testResult.status = 'passed';
            passed++;
          } else {
            testResult.status = 'failed';
            testResult.error = 'Non è un JSON valido';
            failed++;
          }
        } else {
          // Text response
          if (result.text.trim().length > 0 && !result.text.includes('[{') && !result.text.includes('```json')) {
            testResult.status = 'passed';
            passed++;
          } else {
            testResult.status = 'failed';
            testResult.error = 'Risposta sembra essere JSON quando dovrebbe essere testo';
            failed++;
          }
        }
      } catch (err) {
        testResult.status = 'error';
        testResult.error = err instanceof Error ? err.message : 'Unknown error';
        failed++;
      }

      results.push(testResult);
    }

    return NextResponse.json({
      status: failed === 0 ? 'success' : 'warning',
      summary: {
        total: TEST_CASES.length,
        passed,
        failed,
        successRate: `${Math.round((passed / TEST_CASES.length) * 100)}%`,
      },
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err.message || 'Test error', status: 'error' },
      { status: 500 }
    );
  }
}
