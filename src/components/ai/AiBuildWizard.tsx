'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, Loader2, Wand2, X } from 'lucide-react';
import { createBlock, type Block, type BlockShape, type BlockStyle, type BlockType } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import { upsertPageBackgroundMeta } from '@/lib/page-settings';
import '@/lib/blocks/init';

interface WizardQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  placeholder?: string;
  required?: boolean;
  allowMultiple?: boolean;
  allowCustom?: boolean;
  options?: Array<{ label: string; value: string }>;
}

interface WizardBlueprint {
  title?: string;
  intro?: string;
  questions: WizardQuestion[];
}

interface WizardBlockSpec {
  blockType?: string;
  label?: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  shape?: BlockShape | null;
  children?: WizardBlockSpec[];
}

interface WizardBuildResult {
  pageBackground?: Record<string, unknown>;
  blocks: WizardBlockSpec[];
}

interface UrlContextResult {
  url: string;
  title: string;
  headings: string[];
  excerpt: string;
  summary: string;
}

interface AiBuildWizardProps {
  open: boolean;
  tenantId?: string | null;
  currentBlocks: Block[];
  currentMeta: Record<string, unknown>;
  onClose: () => void;
  onApply: (blocks: Block[], nextMeta: Record<string, unknown>) => Promise<void>;
}

const FALLBACK_BLUEPRINT: WizardBlueprint = {
  title: 'Build IA',
  intro: 'Rispondi a queste domande e preparo una pagina completa nel builder.',
  questions: [
    { id: 'page_type', label: 'Che tipo di pagina vuoi costruire?', type: 'multiselect', required: true, allowMultiple: true, allowCustom: true, options: [
      { value: 'homepage', label: 'Homepage editoriale' },
      { value: 'landing', label: 'Landing promozionale' },
      { value: 'special', label: 'Pagina speciale / evento' },
    ] },
    { id: 'style', label: 'Che stile vuoi?', type: 'textarea', placeholder: 'Es. moderno, premium, newsroom, forte uso immagini', required: true },
    { id: 'sections', label: 'Quali sezioni non devono mancare?', type: 'multiselect', required: true, allowMultiple: true, allowCustom: true, options: [
      { value: 'hero', label: 'Hero / apertura' },
      { value: 'breaking-ticker', label: 'Breaking ticker' },
      { value: 'slideshow', label: 'Slideshow articoli' },
      { value: 'tg-video', label: 'TG video' },
      { value: 'video-gallery', label: 'Video gallery' },
      { value: 'adv', label: 'Banner ADV' },
      { value: 'newsletter', label: 'Newsletter' },
      { value: 'footer', label: 'Footer ricco' },
    ] },
    { id: 'tone', label: 'Che tono visivo deve avere?', type: 'text', placeholder: 'Es. elegante, energico, sobrio' },
    { id: 'colors', label: 'Palette o colori desiderati', type: 'multiselect', allowMultiple: true, allowCustom: true, options: [
      { value: 'blu-notte', label: 'Blu notte' },
      { value: 'rosso-editoriale', label: 'Rosso editoriale' },
      { value: 'bianco-pulito', label: 'Bianco pulito' },
      { value: 'nero-premium', label: 'Nero premium' },
      { value: 'verde-newsroom', label: 'Verde newsroom' },
    ] },
    { id: 'notes', label: 'Note extra', type: 'textarea', placeholder: 'Es. con banner top, due rail laterali, footer ricco' },
  ],
};

const BLOCK_TYPE_ALIASES: Record<string, BlockType> = {
  header: 'navigation',
  navbar: 'navigation',
  topbar: 'navigation',
  menu: 'navigation',
  masthead: 'navigation',
  hero: 'hero',
  lead: 'article-hero',
  'article-hero': 'article-hero',
  'news-grid': 'article-grid',
  'article-grid': 'article-grid',
  sidebar: 'sidebar',
  ticker: 'breaking-ticker',
  'breaking-news': 'breaking-ticker',
  footer: 'footer',
  slideshow: 'slideshow',
  gallery: 'image-gallery',
  'image-gallery': 'image-gallery',
  video: 'video',
  section: 'section',
  columns: 'columns',
  text: 'text',
  'banner-zone': 'banner-zone',
  'banner-ad': 'banner-ad',
  newsletter: 'newsletter-signup',
  'newsletter-signup': 'newsletter-signup',
  divider: 'divider',
  'custom-html': 'custom-html',
  'cms-form': 'cms-form',
};

function extractJson<T>(content: string): T | null {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[{\[]/);
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let quote = '';

    for (let i = start; i < cleaned.length; i += 1) {
      const char = cleaned[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === quote) {
          inString = false;
          quote = '';
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        quote = char;
        continue;
      }

      if (char === '{' || char === '[') depth += 1;
      if (char === '}' || char === ']') depth -= 1;

      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }

    return null;
  }
}

function normalizeBlockType(rawType?: string, label?: string): BlockType | null {
  const candidates = [rawType, label]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-'));

  for (const candidate of candidates) {
    if (getBlockDefinition(candidate as BlockType)) {
      return candidate as BlockType;
    }
    if (BLOCK_TYPE_ALIASES[candidate]) {
      return BLOCK_TYPE_ALIASES[candidate];
    }
  }

  return null;
}

function mergeStyle(block: Block, style?: Record<string, unknown>) {
  if (!style) return;

  if (style.layout && typeof style.layout === 'object') {
    block.style.layout = { ...block.style.layout, ...(style.layout as BlockStyle['layout']) };
  }
  if (style.background && typeof style.background === 'object') {
    block.style.background = { ...block.style.background, ...(style.background as BlockStyle['background']) };
  }
  if (style.typography && typeof style.typography === 'object') {
    block.style.typography = { ...block.style.typography, ...(style.typography as BlockStyle['typography']) };
  }
  if (style.border && typeof style.border === 'object') {
    block.style.border = { ...block.style.border, ...(style.border as BlockStyle['border']) };
  }
  if (typeof style.shadow === 'string') block.style.shadow = style.shadow;
  if (typeof style.transform === 'string') block.style.transform = style.transform;
  if (typeof style.transition === 'string') block.style.transition = style.transition;
  if (typeof style.customCss === 'string') block.style.customCss = style.customCss;
}

function buildBlockTree(spec: WizardBlockSpec): Block | null {
  const normalizedType = normalizeBlockType(spec.blockType, spec.label);
  if (!normalizedType) return null;
  const def = getBlockDefinition(normalizedType);
  if (!def) return null;

  const block = createBlock(def.type, spec.label || def.label, { ...def.defaultProps, ...(spec.props || {}) }, def.defaultStyle);
  block.id = generateId();
  block.shape = spec.shape ?? block.shape;
  mergeStyle(block, spec.style);

  if (def.defaultDataSource) {
    block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
  }

  if (Array.isArray(spec.children) && spec.children.length > 0) {
    block.children = spec.children.map(buildBlockTree).filter((child): child is Block => Boolean(child));
  }

  return block;
}

function extractUrlsFromText(input: string) {
  const matches = input.match(/https?:\/\/[^\s)]+/gi) || [];
  return Array.from(new Set(matches));
}

export function AiBuildWizard({
  open,
  tenantId,
  currentBlocks,
  currentMeta,
  onClose,
  onApply,
}: AiBuildWizardProps) {
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [buildingPage, setBuildingPage] = useState(false);
  const [blueprint, setBlueprint] = useState<WizardBlueprint | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const blockCount = currentBlocks.length;

  const questions = blueprint?.questions || FALLBACK_BLUEPRINT.questions;

  useEffect(() => {
    if (!open) return;

    setAnswers({});
    setSelectedOptions({});
    setCustomAnswers({});
    setBlueprint(null);
    setLoadingQuestions(true);

    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/ai/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            taskType: 'layout',
            prompt: `Genera un wizard breve per costruire una pagina nel builder CMS.
Rispondi SOLO con JSON valido nel formato:
{
  "title": "Build IA",
  "intro": "testo breve",
  "questions": [
    {
      "id": "stringa_snake_case",
      "label": "domanda",
      "type": "text|textarea|select|multiselect",
      "placeholder": "opzionale",
      "required": true,
      "allowMultiple": false,
      "allowCustom": true,
      "options": [{"label":"...", "value":"..."}]
    }
  ]
}

Regole:
- massimo 6 domande
- domande utili a costruire una pagina ricca nel builder
- italiano
- almeno una domanda su stile, una su contenuti/sezioni e una su ADV/banner
- quando ci sono alternative concrete preferisci "multiselect" con opzioni
- permetti anche risposta libera con "allowCustom": true
- lo stato attuale della pagina ha ${blockCount} blocchi.`,
          }),
        });

        const data = await response.json();
        const parsed = extractJson<WizardBlueprint>(data.content || '');
        if (parsed?.questions?.length) {
          setBlueprint(parsed);
        } else {
          setBlueprint(FALLBACK_BLUEPRINT);
        }
      } catch {
        setBlueprint(FALLBACK_BLUEPRINT);
      } finally {
        setLoadingQuestions(false);
      }
    };

    void loadQuestions();
  }, [blockCount, open, tenantId]);

  const getQuestionAnswer = useCallback((question: WizardQuestion) => {
    const direct = answers[question.id]?.trim() || '';
    const selected = selectedOptions[question.id] || [];
    const custom = customAnswers[question.id]?.trim() || '';
    const selectedLabels = (question.options || [])
      .filter((option) => selected.includes(option.value))
      .map((option) => option.label);

    const parts = [...selectedLabels];
    if (direct) parts.push(direct);
    if (custom) parts.push(`Custom: ${custom}`);
    return parts.join(', ');
  }, [answers, customAnswers, selectedOptions]);

  const allRequiredFilled = useMemo(
    () => questions.every((question) => !question.required || Boolean(getQuestionAnswer(question).trim())),
    [getQuestionAnswer, questions]
  );

  const toggleMultiValue = (questionId: string, value: string) => {
    setSelectedOptions((prev) => {
      const current = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value],
      };
    });
  };

  const selectAllValues = (question: WizardQuestion) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [question.id]: (question.options || []).map((option) => option.value),
    }));
  };

  const clearAllValues = (questionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [questionId]: [] }));
  };

  const handleBuild = async () => {
    setBuildingPage(true);

    try {
      const questionAnswers = questions.map((question) => ({
        question,
        answer: getQuestionAnswer(question),
      }));

      const urls = Array.from(
        new Set(
          questionAnswers.flatMap(({ answer }) => extractUrlsFromText(answer))
        )
      );

      const urlContexts: UrlContextResult[] = [];
      for (const url of urls) {
        try {
          const contextResponse = await fetch('/api/ai/url-context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });

          if (!contextResponse.ok) continue;
          const contextData = await contextResponse.json();
          if (contextData?.summary) {
            urlContexts.push(contextData as UrlContextResult);
          }
        } catch {
          // Ignore individual URL extraction failures and continue with the rest of the wizard context.
        }
      }

      const answerSummary = questions
        .map((question) => `${question.label}: ${getQuestionAnswer(question)}`)
        .join('\n');

      const urlContextSummary = urlContexts.length > 0
        ? urlContexts.map((item, index) => (
`Fonte ${index + 1}
URL: ${item.url}
Titolo: ${item.title}
Heading: ${(item.headings || []).join(' | ')}
Estratto: ${item.excerpt}
Contesto:
${item.summary}`
        )).join('\n\n')
        : 'Nessuna fonte URL allegata nelle risposte.';

      const response = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          taskType: 'layout',
          prompt: `Costruisci una pagina completa per il builder CMS sulla base di queste risposte.
Rispondi SOLO con JSON valido nel formato:
{
  "pageBackground": {
    "type": "none|color|gradient|image|slideshow|custom-css",
    "value": "",
    "overlay": "",
    "size": "cover",
    "position": "center",
    "repeat": "no-repeat",
    "fixed": false,
    "customCss": "",
    "minHeight": "100%",
    "slideshowDurationMs": 16000,
    "images": []
  },
  "blocks": [
    {
      "blockType": "navigation|footer|hero|article-hero|article-grid|section|text|columns|container|image-gallery|video|audio|slideshow|quote|tabs|table|code|map|counter|newsletter-signup|sidebar|custom-html|divider|search-bar|breaking-ticker|banner-ad|banner-zone|cms-form",
      "label": "Nome blocco",
      "props": {},
      "style": {},
      "children": []
    }
  ]
}

Regole:
- genera una pagina completa e ricca
- usa blocchi reali del builder
- puoi usare children annidati
- crea una struttura editoriale moderna
- inserisci banner ADV di vario tipo se richiesti
- se utile usa slideshow, video, gallery, breaking ticker, hero, columns, footer
- se una risposta contiene istruzioni tipo "scarica il contenuto da questo URL e usalo", trattala come istruzione operativa e NON come testo letterale da stampare nei blocchi
- se trovi fonti URL qui sotto, usa il loro contenuto estratto per proporre e riempire i blocchi in modo coerente
- niente testo fuori dal JSON

RISPOSTE UTENTE:
${answerSummary}

CONTESTO URL ESTRATTO:
${urlContextSummary}`,
        }),
      });

      const data = await response.json();
      const parsed = extractJson<WizardBuildResult>(data.content || '');

      if (!parsed?.blocks?.length) {
        throw new Error('Nessun layout valido restituito dall’IA');
      }

      const nextBlocks = parsed.blocks.map(buildBlockTree).filter((block): block is Block => Boolean(block));
      if (nextBlocks.length === 0) {
        throw new Error('I blocchi generati non sono validi');
      }

      const nextMeta = parsed.pageBackground
        ? upsertPageBackgroundMeta(currentMeta, parsed.pageBackground)
        : currentMeta;

      await onApply(nextBlocks, nextMeta);
      onClose();
    } catch (error) {
      console.error('AI build wizard error:', error);
      alert(error instanceof Error ? error.message : 'Generazione non riuscita');
    } finally {
      setBuildingPage(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[92vw] max-w-3xl rounded-2xl border shadow-2xl overflow-hidden" style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}>
              {loadingQuestions || buildingPage ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--c-text-0)' }}>{blueprint?.title || 'Build IA'}</h3>
              <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>{blueprint?.intro || 'Wizard IA per costruire la pagina nel builder'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg" style={{ color: 'var(--c-text-2)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
          {loadingQuestions ? (
            <div className="rounded-xl p-6 border text-sm" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}>
              L’IA sta preparando le domande migliori per costruire la pagina.
            </div>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <label className="text-sm font-medium block" style={{ color: 'var(--c-text-0)' }}>
                  {question.label}
                </label>
                {question.type === 'textarea' ? (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                    placeholder={question.placeholder}
                    rows={4}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-0)' }}
                  />
                ) : question.type === 'select' ? (
                  <select
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-0)' }}
                  >
                    <option value="">Seleziona</option>
                    {(question.options || []).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : question.type === 'multiselect' || question.allowMultiple ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(question.options || []).map((option) => {
                        const active = (selectedOptions[question.id] || []).includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleMultiValue(question.id, option.value)}
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors"
                            style={active
                              ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)', borderColor: 'transparent' }
                              : { background: 'var(--c-bg-0)', color: 'var(--c-text-1)', borderColor: 'var(--c-border)' }}
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ background: active ? 'var(--c-accent)' : 'var(--c-border)' }}
                            />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    {!!question.options?.length && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => selectAllValues(question)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                          style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-1)', background: 'var(--c-bg-0)' }}
                        >
                          Seleziona tutto
                        </button>
                        <button
                          type="button"
                          onClick={() => clearAllValues(question.id)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                          style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-1)', background: 'var(--c-bg-0)' }}
                        >
                          Pulisci
                        </button>
                      </div>
                    )}
                    {(question.allowCustom ?? true) && (
                      <textarea
                        value={customAnswers[question.id] || ''}
                        onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        placeholder={question.placeholder || 'Aggiungi dettagli o richieste personalizzate'}
                        rows={3}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-0)' }}
                      />
                    )}
                  </div>
                ) : (
                  <input
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                    placeholder={question.placeholder}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-0)' }}
                  />
                )}
                {(question.type === 'select' && (question.allowCustom ?? false)) && (
                  <textarea
                    value={customAnswers[question.id] || ''}
                    onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                    placeholder="Aggiungi una risposta personalizzata"
                    rows={3}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-0)' }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
          <div className="text-xs" style={{ color: 'var(--c-text-2)' }}>
            Il wizard genera la pagina e la salva direttamente nel builder.
          </div>
          <button
            type="button"
            onClick={handleBuild}
            disabled={loadingQuestions || buildingPage || !allRequiredFilled}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--c-accent)', color: 'white' }}
          >
            {buildingPage ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            BUILD IA
          </button>
        </div>
      </div>
    </div>
  );
}
