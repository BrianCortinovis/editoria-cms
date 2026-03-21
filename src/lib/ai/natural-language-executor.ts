/**
 * Natural Language Command Executor
 * Converts natural language descriptions to structured commands
 * This allows AI to work directly with user prompts without JSON
 */

import {
  extractColor,
  extractNumber,
  extractDividerShape,
  extractAnimationEffect,
  buildDividerFromText,
  buildGradientFromText,
  type AICommand,
} from './command-parser';

export interface CommandExecution {
  success: boolean;
  command?: AICommand;
  error?: string;
}

/**
 * Parse natural language and convert to command
 * Supports Italian input naturally
 */
export function parseNaturalLanguage(text: string, context: 'divider' | 'gradient' | 'animation' | 'effect' | 'shape'): CommandExecution {
  try {
    const lower = text.toLowerCase();

    // Divider context: "fai un divisore con sfumatura arancione che fuma verso la foto lunga 25 pixel verso l'alto"
    if (context === 'divider') {
      const cmd = buildDividerFromText(text);
      if (cmd.shape || cmd.height || cmd.gradient) {
        return { success: true, command: cmd as AICommand };
      }
    }

    // Gradient context: "sfumatura blu e arancione animata"
    if (context === 'gradient') {
      const cmd = buildGradientFromText(text);
      if (cmd.stops || cmd.type || cmd.animated !== undefined) {
        return { success: true, command: cmd as AICommand };
      }
    }

    // Animation context: "animazione elegante on scroll"
    if (context === 'animation') {
      const cmd: any = { action: 'updateAnimation' };

      // Trigger
      if (lower.includes('scroll')) cmd.trigger = 'scroll';
      else if (lower.includes('hover')) cmd.trigger = 'hover';
      else if (lower.includes('entrata') || lower.includes('entrance')) cmd.trigger = 'entrance';
      else cmd.trigger = 'entrance'; // default

      // Effect
      const effect = extractAnimationEffect(text);
      if (effect) cmd.effect = effect;

      // Duration
      const duration = extractNumber(text.match(/(\d+)\s*m?s/)?.[1] || '', 100, 3000);
      if (duration) cmd.duration = duration;

      // Elegance modifiers
      if (lower.includes('elegante')) {
        cmd.effect = 'fade-in';
        cmd.duration = 800;
        cmd.easing = 'ease-out';
      } else if (lower.includes('energetica') || lower.includes('fun')) {
        cmd.effect = 'bounce';
        cmd.duration = 1000;
      } else if (lower.includes('sottile')) {
        cmd.effect = 'fade-in';
        cmd.duration = 400;
        cmd.easing = 'ease-in-out';
      }

      if (cmd.effect || cmd.trigger) {
        return { success: true, command: cmd as AICommand };
      }
    }

    // Effect context: "glassmorphism scuro" or "noise grain effect"
    if (context === 'effect') {
      const cmd: any = { action: 'updateEffects' };

      if (lower.includes('glassmorphism') || lower.includes('vetro')) {
        cmd.glassmorphism = {
          blur: lower.includes('scuro') ? 12 : 10,
          saturation: lower.includes('scuro') ? 90 : 110,
          bgOpacity: lower.includes('scuro') ? 0.15 : 0.08,
          bgColor: lower.includes('scuro') ? '#000000' : '#ffffff',
          borderOpacity: lower.includes('scuro') ? 0.2 : 0.15,
        };
      }

      if (lower.includes('noise') || lower.includes('rumore')) {
        const opacity = extractNumber(text.match(/(\d+)%?/)?.[1] || '', 0, 1);
        cmd.noise = {
          type: lower.includes('turbolenza') ? 'turbulence' : 'fractalNoise',
          opacity: opacity ? opacity / 100 : 0.1,
          frequency: 1,
        };
      }

      if (lower.includes('grain') || lower.includes('grana')) {
        cmd.grain = {
          opacity: 0.15,
          size: 2,
        };
      }

      if (cmd.glassmorphism || cmd.noise || cmd.grain) {
        return { success: true, command: cmd as AICommand };
      }
    }

    // Shape context: "forma circolare organica"
    if (context === 'shape') {
      const cmd: any = { action: 'updateClipPath' };

      if (lower.includes('circolo') || lower.includes('cerchio') || lower.includes('rotondo')) {
        cmd.type = 'circle';
        cmd.value = 'circle(50% at 50% 50%)';
      } else if (lower.includes('stella')) {
        cmd.type = 'polygon';
        cmd.value = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      } else if (lower.includes('organica') || lower.includes('naturale') || lower.includes('fluida')) {
        // Use a wavy organic shape
        cmd.type = 'polygon';
        cmd.value = 'polygon(0% 30%, 10% 20%, 20% 25%, 30% 15%, 40% 25%, 50% 20%, 60% 30%, 70% 25%, 80% 35%, 90% 30%, 100% 40%, 95% 60%, 100% 80%, 90% 85%, 80% 90%, 70% 88%, 60% 92%, 50% 88%, 40% 92%, 30% 90%, 20% 88%, 10% 85%, 0% 80%, 5% 60%)';
      } else if (lower.includes('rombo') || lower.includes('diamond')) {
        cmd.type = 'polygon';
        cmd.value = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      } else if (lower.includes('triangolo')) {
        cmd.type = 'polygon';
        cmd.value = 'polygon(50% 0%, 100% 100%, 0% 100%)';
      }

      if (cmd.value) {
        return { success: true, command: cmd as AICommand };
      }
    }

    return { success: false, error: `Impossibile interpretare il comando: "${text}"` };
  } catch (e) {
    return { success: false, error: `Errore nel parsing: ${String(e)}` };
  }
}

/**
 * Execute a natural language command directly
 * This is called by the AI when it receives plain text instead of JSON
 */
export function executeNaturalCommand(
  text: string,
  context: 'divider' | 'gradient' | 'animation' | 'effect' | 'shape',
  onCommand: (cmd: AICommand) => void
): CommandExecution {
  const result = parseNaturalLanguage(text, context);

  if (result.success && result.command) {
    try {
      onCommand(result.command);
      return { success: true, command: result.command };
    } catch (e) {
      return { success: false, error: `Errore nell'esecuzione: ${String(e)}` };
    }
  }

  return result;
}

/**
 * Smart command detector - tries to figure out context from text
 */
export function detectContextFromText(text: string): 'divider' | 'gradient' | 'animation' | 'effect' | 'shape' | null {
  const lower = text.toLowerCase();

  if (lower.includes('divisore') || lower.includes('divider') || lower.includes('divida')) {
    return 'divider';
  }
  if (lower.includes('sfumatura') || lower.includes('gradiente') || lower.includes('gradient')) {
    return 'gradient';
  }
  if (lower.includes('animazione') || lower.includes('animation') || lower.includes('scroll') || lower.includes('hover')) {
    return 'animation';
  }
  if (lower.includes('glassmorphism') || lower.includes('vetro') || lower.includes('noise') || lower.includes('grain') || lower.includes('effetto')) {
    return 'effect';
  }
  if (lower.includes('forma') || lower.includes('shape') || lower.includes('circolo') || lower.includes('stella') || lower.includes('rombo')) {
    return 'shape';
  }

  return null;
}
