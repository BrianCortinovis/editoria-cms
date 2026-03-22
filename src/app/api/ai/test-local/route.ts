import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/providers';
import { resolveProvider } from '@/lib/ai/resolver';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AIMessage } from '@/lib/ai/providers';

// SOLO PER TESTING LOCALE - Rimuovere in produzione
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
    const body = await request.json();
    const { provider = 'claude', apiKey, model } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key richiesta nel body della richiesta', status: 'error' },
        { status: 400 }
      );
    }

    const TEST_CONFIG = {
      provider: provider as any,
      apiKey,
      model: model || 'claude-opus-4-1-20250805',
    };

    const results: any[] = [];
    let passed = 0;
    let failed = 0;

    console.log('🚀 Inizio test suite IA locale');

    for (const testCase of TEST_CASES) {
      const testResult: any = {
        name: testCase.name,
        description: testCase.description,
        expectedType: testCase.expectedType,
        status: 'pending',
        response: '',
        validation: null,
        error: null,
        provider: TEST_CONFIG.provider,
        model: TEST_CONFIG.model,
      };

      try {
        // Determina system prompt
        const systemPrompt = testCase.expectedType === 'json'
          ? `Sei un assistente AI per un builder giornalistico. Crea layout con blocchi.
Blocchi disponibili: ${BLOCK_LIST}
Rispondi SEMPRE con un JSON array di azioni "add-block". Rispondi SEMPRE in italiano.`
          : `Sei un assistente AI per un CMS editoriale. Genera contenuti concisi e di qualità. Rispondi sempre in italiano.`;

        const messages: AIMessage[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: testCase.prompt },
        ];

        console.log(`\n📝 Test: ${testCase.name}`);
        console.log(`📤 Provider: ${TEST_CONFIG.provider}`);
        console.log(`🤖 Model: ${TEST_CONFIG.model}`);

        if (!TEST_CONFIG.apiKey) {
          throw new Error(`API key non configurata per ${TEST_CONFIG.provider}`);
        }

        const result = await callAI(TEST_CONFIG.provider, messages, {
          apiKey: TEST_CONFIG.apiKey,
          model: TEST_CONFIG.model,
        });

        testResult.response = result.text.substring(0, 500) + (result.text.length > 500 ? '...' : '');
        testResult.provider = result.provider;
        testResult.model = result.model;

        console.log(`📥 Risposta ricevuta (${result.text.length} caratteri)`);

        // Valida tipo risposta
        if (testCase.expectedType === 'json') {
          const validation = validateJsonResponse(result.text);
          testResult.validation = validation;
          if (validation.valid) {
            testResult.status = 'passed';
            passed++;
            console.log(`✅ JSON valido - ${validation.actionCount} blocchi`);
          } else {
            testResult.status = 'failed';
            testResult.error = 'Non è un JSON valido';
            failed++;
            console.log(`❌ JSON non valido`);
          }
        } else {
          // Text response
          if (result.text.trim().length > 0 && !result.text.includes('[{') && !result.text.includes('```json')) {
            testResult.status = 'passed';
            passed++;
            console.log(`✅ Testo valido`);
          } else {
            testResult.status = 'failed';
            testResult.error = 'Risposta sembra essere JSON quando dovrebbe essere testo';
            failed++;
            console.log(`❌ Formato testo non valido`);
          }
        }
      } catch (err) {
        testResult.status = 'error';
        testResult.error = err instanceof Error ? err.message : 'Errore sconosciuto';
        failed++;
        console.log(`❌ Errore: ${testResult.error}`);
      }

      results.push(testResult);
    }

    console.log(`\n✨ Test completati: ${passed} passati, ${failed} falliti`);

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
    console.error('❌ Errore test:', err);
    return NextResponse.json(
      { error: err.message || 'Errore test locale', status: 'error' },
      { status: 500 }
    );
  }
}
