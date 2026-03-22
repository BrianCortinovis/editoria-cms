'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { isFillableFieldElement, useFieldContextStore } from '@/lib/stores/field-context-store';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { X, Sparkles, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { AIMessage } from '@/lib/ai/providers';
import type { AICommand } from '@/lib/ai/command-parser';
import { parseAICommand } from '@/lib/ai/command-parser';
import { detectContextFromText, parseNaturalLanguage } from '@/lib/ai/natural-language-executor';
import { buildCssGradient } from '@/lib/shapes/gradients';
import type { AdvancedGradient, AnimationEffect, BlockAnimation, BlockEffects, BlockType, DividerConfig, DividerShape } from '@/lib/types';
import { createBlock } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import toast from 'react-hot-toast';
import '@/lib/blocks/init';

interface AiAction {
  action: string;
  blockType?: string;
  blockId?: string;
  targetBlockId?: string;
  position?: 'inside' | 'after' | 'before';
  label?: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  shape?: { type: string; value: string } | null;
  text?: string;
}

const GENERIC_EDITOR_ACTIONS = new Set([
  'add-block',
  'remove-block',
  'update-block-props',
  'update-block-style',
  'set-device',
]);

const BOOLEAN_FIELD_TYPES = new Set(['checkbox', 'switch']);

function parseAiResponse(content: string): AiAction[] | null {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((item) => item?.action && GENERIC_EDITOR_ACTIONS.has(item.action));
      return filtered.length > 0 ? filtered : null;
    }
    if (parsed.action && GENERIC_EDITOR_ACTIONS.has(parsed.action)) return [parsed];
    return null;
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item) => item?.action && GENERIC_EDITOR_ACTIONS.has(item.action));
          return filtered.length > 0 ? filtered : null;
        }
      } catch { }
    }

    const objMatch = cleaned.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (objMatch) {
      try {
        const parsed = JSON.parse(objMatch[0]);
        if (parsed.action && GENERIC_EDITOR_ACTIONS.has(parsed.action)) return [parsed];
      } catch { }
    }

    return null;
  }
}

function sanitizeFieldResponse(content: string) {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```[\w-]*\s*/i, '').replace(/\s*```$/i, '').trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"'))
    || (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

function formatFieldOptions(
  options: Array<{ value: string; label: string }> | undefined
) {
  if (!options || options.length === 0) {
    return 'Nessuna opzione esplicita disponibile';
  }

  return options
    .map((option) => `- value="${option.value}" | label="${option.label}"`)
    .join('\n');
}

function inferDividerGradientDirection(angle?: number): 'vertical' | 'horizontal' | 'diagonal' {
  if (angle === undefined) {
    return 'vertical';
  }

  const normalizedAngle = ((angle % 360) + 360) % 360;
  if (normalizedAngle === 0 || normalizedAngle === 180) {
    return 'horizontal';
  }
  if (normalizedAngle === 90 || normalizedAngle === 270) {
    return 'vertical';
  }

  return 'diagonal';
}

function resolveStructuredBuilderCommand(content: string, userPrompt: string): AICommand | null {
  const parsedCommand = parseAICommand(content);
  if (parsedCommand) {
    return parsedCommand;
  }

  const detectedContext = detectContextFromText(userPrompt) || detectContextFromText(content);
  if (!detectedContext) {
    return null;
  }

  const parsedNaturalLanguage = parseNaturalLanguage(userPrompt, detectedContext);
  return parsedNaturalLanguage.success ? parsedNaturalLanguage.command ?? null : null;
}

export function GlobalAiChat() {
  const { currentTenant } = useAuthStore();
  const {
    selectedField,
    pageContext,
    captureFieldElement,
    syncFieldElement,
    applyValueToSelectedField,
  } = useFieldContextStore();
  const pageStore = usePageStore();
  const {
    addBlock,
    blocks,
    selectedBlockId,
    removeBlock,
    updateBlock,
    updateBlockProps,
    updateBlockShape,
    updateBlockStyle,
    getBlock,
  } = pageStore;
  const { setDeviceMode } = useUiStore();
  const selectedBlock = selectedBlockId ? getBlock(selectedBlockId) : null;

  // Check if we're in an editor context (has page store)
  const isEditorContext = !!pageStore && blocks !== undefined;

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: `Ciao! Sono il tuo assistente IA. Puoi chiedermi di generare contenuti, fare domande, o ricevere aiuto con il CMS.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (isFillableFieldElement(event.target)) {
        captureFieldElement(event.target);
      }
    };

    const handleFieldChange = (event: Event) => {
      if (isFillableFieldElement(event.target)) {
        syncFieldElement(event.target);
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('input', handleFieldChange, true);
    document.addEventListener('change', handleFieldChange, true);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('input', handleFieldChange, true);
      document.removeEventListener('change', handleFieldChange, true);
    };
  }, [captureFieldElement, syncFieldElement]);

  useEffect(() => {
    if (selectedField) {
      const contextMsg = `
Campo selezionato: ${selectedField.label || selectedField.name}
Valore attuale: "${selectedField.value}"
${
  pageContext.allFields && Object.keys(pageContext.allFields).length > 0
    ? `\nContesto della pagina:\n${Object.entries(pageContext.allFields)
      .slice(0, 5)
      .map(([k, v]) => `- ${k}: "${v}"`)
      .join('\n')}`
    : ''
}

Sono pronto ad aiutarti a generare contenuto per questo campo!`;

      setMessages((prev) => {
        if (prev.length > 1 && prev[prev.length - 1].role === 'user') {
          return prev;
        }

        const nextMessages: AIMessage[] = [
          prev[0],
          { role: 'assistant', content: contextMsg },
        ];

        if (
          prev.length === nextMessages.length
          && prev[1]?.role === 'assistant'
          && prev[1]?.content === contextMsg
        ) {
          return prev;
        }

        return nextMessages;
      });
    }
  }, [selectedField, pageContext]);

  const executeActions = (actions: AiAction[]): string[] => {
    const results: string[] = [];

    for (const action of actions) {
      try {
        switch (action.action) {
          case 'add-block': {
            if (!action.blockType) {
              results.push('✗ blockType mancante');
              break;
            }
            const def = getBlockDefinition(action.blockType as BlockType);
            if (!def) {
              results.push(`✗ Blocco "${action.blockType}" non trovato`);
              break;
            }
            const mergedProps = { ...def.defaultProps, ...(action.props || {}) };
            const block = createBlock(def.type, action.label || def.label, mergedProps, def.defaultStyle);
            if (action.style) {
              if (action.style.background) block.style.background = { ...block.style.background, ...action.style.background };
              if (action.style.typography) block.style.typography = { ...block.style.typography, ...action.style.typography };
              if (action.style.layout) block.style.layout = { ...block.style.layout, ...action.style.layout };
            }
            block.id = generateId();
            if (def.defaultDataSource) {
              block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
            }

            const targetId = action.targetBlockId || selectedBlockId;
            const pos = action.position || 'after';

            if (targetId && pos === 'inside') {
              addBlock(block, targetId);
            } else {
              addBlock(block);
            }
            results.push(`+ ${action.label || def.label}`);
            break;
          }
          case 'remove-block': {
            if (!action.blockId) {
              results.push('✗ blockId mancante');
              break;
            }
            removeBlock(action.blockId);
            results.push(`- Rimosso blocco`);
            break;
          }
          case 'update-block-props': {
            if (!action.blockId || !action.props) break;
            updateBlockProps(action.blockId, action.props);
            results.push(`~ Aggiornate proprietà`);
            break;
          }
          case 'update-block-style': {
            if (!action.blockId || !action.style) break;
            updateBlockStyle(action.blockId, action.style);
            results.push(`~ Aggiornato stile`);
            break;
          }
          case 'set-device': {
            if (action.text === 'desktop' || action.text === 'tablet' || action.text === 'mobile') {
              setDeviceMode(action.text);
              results.push(`📱 Device: ${action.text}`);
            }
            break;
          }
          default:
            results.push(`? Azione sconosciuta: ${action.action}`);
        }
      } catch (err) {
        results.push(`✗ Errore: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    return results;
  };

  const executeBuilderCommand = (command: AICommand): string => {
    if (!selectedBlockId || !selectedBlock) {
      return '✗ Seleziona un blocco prima di usare i tool IA del builder';
    }

    switch (command.action) {
      case 'updateDivider': {
        const existingDivider = command.position === 'top'
          ? selectedBlock.shape?.topDivider
          : selectedBlock.shape?.bottomDivider;
        const gradientStops = command.gradient?.stops || [];
        const nextDivider: DividerConfig = {
          shape: (command.shape as DividerShape) || existingDivider?.shape || 'wave',
          height: command.height ?? existingDivider?.height ?? 80,
          flip: command.flip ?? existingDivider?.flip ?? false,
          invert: existingDivider?.invert ?? false,
          color: gradientStops[0]?.color || existingDivider?.color || '#ffffff',
          opacity: command.opacity ?? existingDivider?.opacity,
          blendWithSection: existingDivider?.blendWithSection,
          blendColor: command.blendColor ?? existingDivider?.blendColor,
          gradient: command.gradient
            ? {
              enabled: true,
              colorStart: gradientStops[0]?.color || existingDivider?.color || '#ffffff',
              colorEnd: gradientStops[gradientStops.length - 1]?.color || 'transparent',
              direction: inferDividerGradientDirection(command.gradient.angle),
            }
            : existingDivider?.gradient,
        };

        updateBlockShape(selectedBlock.id, {
          type: selectedBlock.shape?.type || 'clip-path',
          value: selectedBlock.shape?.value || 'none',
          topDivider: command.position === 'top' ? nextDivider : selectedBlock.shape?.topDivider,
          bottomDivider: command.position === 'bottom' ? nextDivider : selectedBlock.shape?.bottomDivider,
        });

        return `~ Aggiornato divisore ${command.position === 'top' ? 'superiore' : 'inferiore'}`;
      }

      case 'updateGradient': {
        const currentGradient: AdvancedGradient = selectedBlock.style.background.advancedGradient || {
          type: 'linear',
          angle: 90,
          stops: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 },
          ],
        };

        const nextGradient: AdvancedGradient = {
          ...currentGradient,
          ...command,
          stops: command.stops?.length ? command.stops : currentGradient.stops,
        };

        updateBlockStyle(selectedBlock.id, {
          background: {
            ...selectedBlock.style.background,
            type: 'gradient',
            value: buildCssGradient(nextGradient),
            advancedGradient: nextGradient,
          },
        });

        return '~ Aggiornato gradiente avanzato';
      }

      case 'updateEffects': {
        const currentEffects: BlockEffects = selectedBlock.style.effects || {};
        const commandEffects = command as AICommand & {
          glassmorphism?: {
            blur?: number;
            saturation?: number;
            opacity?: number;
            bgOpacity?: number;
            bgColor?: string;
            borderOpacity?: number;
          };
          noise?: {
            type?: 'fractalNoise' | 'turbulence';
            opacity?: number;
            frequency?: number;
          };
          grain?: {
            opacity?: number;
            size?: number;
          };
          parallax?: boolean;
        };

        updateBlockStyle(selectedBlock.id, {
          effects: {
            ...currentEffects,
            glassmorphism: commandEffects.glassmorphism
              ? {
                enabled: true,
                blur: commandEffects.glassmorphism.blur ?? currentEffects.glassmorphism?.blur ?? 10,
                saturation: commandEffects.glassmorphism.saturation ?? currentEffects.glassmorphism?.saturation ?? 100,
                bgOpacity: commandEffects.glassmorphism.bgOpacity ?? commandEffects.glassmorphism.opacity ?? currentEffects.glassmorphism?.bgOpacity ?? 0.1,
                bgColor: commandEffects.glassmorphism.bgColor ?? currentEffects.glassmorphism?.bgColor ?? '#ffffff',
                borderOpacity: commandEffects.glassmorphism.borderOpacity ?? currentEffects.glassmorphism?.borderOpacity ?? 0.2,
              }
              : currentEffects.glassmorphism,
            noise: commandEffects.noise
              ? {
                enabled: true,
                type: commandEffects.noise.type ?? currentEffects.noise?.type ?? 'fractalNoise',
                opacity: commandEffects.noise.opacity ?? currentEffects.noise?.opacity ?? 0.1,
                frequency: commandEffects.noise.frequency ?? currentEffects.noise?.frequency ?? 1,
              }
              : currentEffects.noise,
            grain: commandEffects.grain
              ? {
                enabled: true,
                opacity: commandEffects.grain.opacity ?? currentEffects.grain?.opacity ?? 0.15,
                size: commandEffects.grain.size ?? currentEffects.grain?.size ?? 2,
              }
              : currentEffects.grain,
          },
          background: commandEffects.parallax !== undefined
            ? {
              ...selectedBlock.style.background,
              parallax: commandEffects.parallax,
            }
            : undefined,
        });

        return '~ Aggiornati effetti visivi';
      }

      case 'updateAnimation': {
        const currentAnimation: BlockAnimation = selectedBlock.animation || {
          trigger: 'entrance',
          effect: 'fade-in',
          duration: 600,
          delay: 0,
          easing: 'ease-out',
        };

        const nextAnimation: BlockAnimation = {
          trigger: command.trigger ?? currentAnimation.trigger,
          effect: (command.effect as AnimationEffect | undefined) ?? currentAnimation.effect,
          duration: command.duration ?? currentAnimation.duration,
          delay: command.delay ?? currentAnimation.delay,
          easing: command.easing ?? currentAnimation.easing,
        };

        updateBlock(selectedBlock.id, {
          animation: nextAnimation,
        });

        return '~ Aggiornata animazione';
      }

      case 'updateClipPath': {
        updateBlockShape(selectedBlock.id, {
          type: 'clip-path',
          value: command.value,
          topDivider: selectedBlock.shape?.topDivider,
          bottomDivider: selectedBlock.shape?.bottomDivider,
        });

        return '~ Aggiornata forma del blocco';
      }

      default:
        return '? Tool non supportato';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentTenant) {
      toast.error('Scrivi un messaggio');
      return;
    }

    const newMessages: AIMessage[] = [
      ...messages,
      { role: 'user', content: inputValue },
    ];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    try {
      let contextualPrompt: string;

      if (selectedField) {
        const currentPath = pageContext.path || (typeof window !== 'undefined' ? window.location.pathname : '');
        const isBooleanField = BOOLEAN_FIELD_TYPES.has(selectedField.type);
        const isRadioField = selectedField.type === 'radio';
        contextualPrompt = `
Campo da compilare: ${selectedField.label || selectedField.name}
Nome interno: ${selectedField.name}
Tipo: ${selectedField.type}
Elemento HTML: ${selectedField.htmlTag || 'input'}
Valore attuale: "${selectedField.value}"
Placeholder: "${selectedField.placeholder || ''}"
Stato booleano attuale: ${selectedField.checked === undefined ? 'n/a' : selectedField.checked ? 'true' : 'false'}
Pagina: "${pageContext.pageTitle || pageContext.pageName || document.title}"
Percorso: "${currentPath}"

Contesto della pagina:
${
  pageContext.allFields
    ? Object.entries(pageContext.allFields)
      .map(([k, v]) => `${k}: "${v}"`)
      .join('\n')
    : 'Nessun contesto disponibile'
}

Opzioni disponibili:
${formatFieldOptions(selectedField.options)}

Richiesta utente: ${inputValue}

ISTRUZIONI OBBLIGATORIE:
- Restituisci SOLO il valore finale da inserire nel campo.
- Nessuna spiegazione, nessun markdown, niente virgolette aggiuntive.
- Se il campo è una select, scegli solo tra le opzioni disponibili e restituisci l'opzione più adatta.
- Se il campo è checkbox o switch, restituisci SOLO "true" oppure "false".
- Se il campo è radio, scegli solo una delle opzioni disponibili e restituisci il valore o la label corrispondente.
- Se il campo è email, url, number, date o datetime-local, rispetta il formato del campo.
- Se il campo fa parte di una pagina CMS, usa il contesto della pagina e degli altri campi per completarlo in modo coerente.`;

        if (isBooleanField) {
          contextualPrompt += '\n- Questo campo controlla uno stato ON/OFF del CMS: rispondi solo con true o false.';
        }

        if (isRadioField) {
          contextualPrompt += '\n- Questo campo accetta una sola scelta tra le opzioni disponibili.';
        }
      } else {
        contextualPrompt = `${selectedBlock
          ? `Blocco selezionato:
- ID: ${selectedBlock.id}
- Tipo: ${selectedBlock.type}
- Label: ${selectedBlock.label}
- Props: ${JSON.stringify(selectedBlock.props)}
- Shape: ${JSON.stringify(selectedBlock.shape)}
- Animation: ${JSON.stringify(selectedBlock.animation)}
`
          : ''}Richiesta utente: ${inputValue}

ISTRUZIONI CRITICHE:
1. Se l'utente chiede di creare/modificare/disegnare layout, pagine, blocchi, sezioni, home, articoli, ecc. → SEMPRE JSON
2. Se chiede una domanda generica → risposta testo
3. Se c'è un blocco selezionato e la richiesta riguarda divisori, gradienti, effetti, animazioni o forme del blocco → restituisci JSON oggetto singolo con action specializzata

Se JSON, usa ESATTAMENTE questo formato (array di oggetti, non oggetto singolo):
[
  {
    "action": "add-block",
    "blockType": "hero|section|text|columns|container|image-gallery|video|slideshow|carousel|quote|accordion|tabs|social|newsletter|banner-ad|related-content|author-bio|timeline|counter|divider",
    "label": "Descrizione breve blocco",
    "props": {"text": "contenuto del blocco"},
    "style": {}
  }
]

Blocchi: hero (hero grande), section (sezione), text (testo), columns (3 colonne), container (box), image-gallery (galleria), video (video), slideshow (slideshow), carousel (carosello), quote (citazione), accordion (soffietto), tabs (schede), social (social), newsletter (newsletter), banner-ad (banner), related-content (correlati), author-bio (autore), timeline (timeline), counter (contatori), divider (divisore).

Per modificare il blocco selezionato puoi anche usare UNO di questi formati JSON:
{"action":"updateDivider","position":"top|bottom","shape":"wave","height":80,"opacity":0.9,"flip":false,"gradient":{"type":"linear","angle":90,"stops":[{"color":"#ffffff","position":0},{"color":"#000000","position":100}]}}
{"action":"updateGradient","type":"linear","angle":45,"stops":[{"color":"#ff8c00","position":0},{"color":"#1e40af","position":100}],"animated":true,"animationDuration":3000}
{"action":"updateEffects","glassmorphism":{"blur":12,"saturation":100,"bgOpacity":0.12,"bgColor":"#ffffff","borderOpacity":0.2},"noise":{"type":"fractalNoise","opacity":0.1,"frequency":1},"grain":{"opacity":0.15,"size":2},"parallax":true}
{"action":"updateAnimation","trigger":"scroll","effect":"fade-in","duration":800,"delay":0,"easing":"ease-out"}
{"action":"updateClipPath","type":"polygon","value":"polygon(...)"}

IMPORTANTE: Rispondi con SOLO JSON quando è richiesto layout, senza spiegazioni aggiuntive.`;
      }

      const response = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: selectedField ? 'field-assist' : 'chatbot',
          prompt: contextualPrompt,
          systemPrompt: selectedField
            ? `Sei un assistente AI per un CMS editoriale. Aiuti l'utente a generare contenuti coerenti con il contesto della pagina. Rispondi sempre in italiano.`
            : `Sei un assistente AI specializzato in layout giornalistici e tool visuali per un CMS.
COMPITI:
1. Quando l'utente richiede layout/blocchi/design → rispondi SOLO con JSON array di add-block actions
2. Quando l'utente modifica un blocco selezionato con gradienti, divisori, effetti, animazioni o shape → rispondi SOLO con un JSON object della action specializzata corretta
2. Per domande generiche → rispondi in testo italiano

FORMATO JSON OBBLIGATORIO:
[{"action":"add-block","blockType":"hero","label":"Hero principale","props":{},"style":{}}]

Non aggiungere spiegazioni, commenti o testo. SOLO JSON quando richiesto layout o tool builder.
Rispondi SEMPRE in italiano.`,
        }),
      });

      const data = await response.json();
      if (data.content) {
        const actions = parseAiResponse(data.content);
        const builderCommand = !selectedField && isEditorContext
          ? resolveStructuredBuilderCommand(data.content, inputValue)
          : null;

        if (actions && actions.length > 0 && !selectedField && isEditorContext) {
          const results = executeActions(actions);
          const resultMsg = `Fatto!\n${results.join('\n')}`;
          setMessages((prev) => [...prev, { role: 'assistant', content: resultMsg }]);
          toast.success('✓ Blocchi creati!');
        } else if (builderCommand && !selectedField && isEditorContext) {
          const result = executeBuilderCommand(builderCommand);
          setMessages((prev) => [...prev, { role: 'assistant', content: `Fatto!\n${result}` }]);
          toast.success('✓ Tool builder applicato!');
        } else if (selectedField) {
          const fieldValue = sanitizeFieldResponse(data.content);
          const applied = applyValueToSelectedField(fieldValue);

          if (applied) {
            const aiMessage: AIMessage = { role: 'assistant', content: `✓ Campo "${selectedField.label || selectedField.name}" riempito!` };
            setMessages((prev) => [...prev, aiMessage]);
            toast.success('✓ Campo riempito!');
          } else {
            const aiMessage: AIMessage = { role: 'assistant', content: fieldValue };
            setMessages((prev) => [...prev, aiMessage]);
            await navigator.clipboard.writeText(fieldValue).catch(() => { });
            toast.success('✓ Contenuto generato! Pronto da incollare.');
          }
        } else {
          // Risposta normale
          const aiMessage: AIMessage = { role: 'assistant', content: data.content };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Errore: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Errore di connessione. Riprova.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 w-96 rounded-lg shadow-2xl flex flex-col"
      style={{
        background: 'var(--c-bg-1)',
        borderColor: 'var(--c-border)',
        border: '1px solid',
        height: expanded ? '600px' : '56px',
        transition: 'height 0.3s ease',
        zIndex: 9999,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b cursor-pointer"
        style={{ borderColor: 'var(--c-border)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: 'var(--c-accent)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--c-text-0)' }}>
            ✨ AI Assistant
          </span>
          {selectedField && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}>
              {selectedField.label || selectedField.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMessages([{ role: 'assistant', content: 'Chat cancellata. Come posso aiutarti?' }]);
            }}
            className="p-1 rounded transition-opacity"
            style={{ color: 'var(--c-text-2)' }}
            title="Cancella chat"
          >
            <X size={16} />
          </button>
          {expanded ? (
            <ChevronDown size={16} style={{ color: 'var(--c-text-2)' }} />
          ) : (
            <ChevronUp size={16} style={{ color: 'var(--c-text-2)' }} />
          )}
        </div>
      </div>

      {expanded && (
        <>
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ color: 'var(--c-text-0)' }}
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-xs px-3 py-2 rounded-lg text-sm break-words select-text cursor-text"
                  style={{
                    background: msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-bg-2)',
                    color: msg.role === 'user' ? '#fff' : 'var(--c-text-0)',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                  }}
                  onContextMenu={(e) => e.stopPropagation()}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="text-xs p-2 rounded animate-pulse" style={{ color: 'var(--c-text-2)' }}>
                  Sta pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t flex gap-2"
            style={{ borderColor: 'var(--c-border)' }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Scrivi un prompt..."
              disabled={loading}
              data-ai-ignore-field-context="true"
              className="flex-1 text-sm px-3 py-2 rounded border focus:outline-none"
              style={{
                background: 'var(--c-bg-0)',
                borderColor: 'var(--c-border)',
                color: 'var(--c-text-0)',
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 rounded transition-opacity disabled:opacity-50"
              style={{ background: 'var(--c-accent)', color: '#fff' }}
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
