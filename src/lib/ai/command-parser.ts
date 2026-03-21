/**
 * AI Command Parser
 * Parses natural language commands from AI and converts them to structured actions
 */

export interface DividerCommand {
  action: 'updateDivider';
  position: 'top' | 'bottom';
  shape?: string;
  height?: number;
  gradient?: {
    type: 'linear' | 'radial' | 'conic';
    angle?: number;
    stops: Array<{ color: string; position: number }>;
  };
  opacity?: number;
  blendColor?: string;
  flip?: boolean;
}

export interface GradientCommand {
  action: 'updateGradient';
  type?: 'linear' | 'radial' | 'conic' | 'mesh';
  angle?: number;
  stops?: Array<{ color: string; position: number; opacity?: number }>;
  animated?: boolean;
  animationDuration?: number;
  scrollDriven?: boolean;
  hoverDriven?: boolean;
}

export interface EffectCommand {
  action: 'updateEffects';
  glassmorphism?: {
    blur: number;
    saturation: number;
    opacity: number;
    borderOpacity: number;
  };
  noise?: {
    type: 'fractalNoise' | 'turbulence';
    opacity: number;
    frequency: number;
  };
  grain?: {
    opacity: number;
    size: number;
  };
  parallax?: boolean;
}

export interface AnimationCommand {
  action: 'updateAnimation';
  trigger: 'entrance' | 'scroll' | 'hover';
  effect: string;
  duration?: number;
  delay?: number;
  easing?: string;
  scrollThreshold?: number;
}

export interface ClipPathCommand {
  action: 'updateClipPath';
  type: 'polygon' | 'circle' | 'ellipse' | 'inset' | 'path';
  value: string;
}

export type AICommand = DividerCommand | GradientCommand | EffectCommand | AnimationCommand | ClipPathCommand;

/**
 * Parse AI response and extract command
 */
export function parseAICommand(response: string): AICommand | null {
  try {
    // First try direct JSON parsing
    const parsed = JSON.parse(response);
    if (parsed.action) return parsed;
  } catch {
    // Fall through to pattern matching
  }

  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * Extract color from text (e.g., "arancione" -> "#ff8c00")
 */
export function extractColor(text: string): string | null {
  const colorMap: Record<string, string> = {
    rosso: '#ff3333',
    arancione: '#ff8c00',
    giallo: '#ffc107',
    verde: '#4caf50',
    blu: '#2196f3',
    azzurro: '#00bcd4',
    viola: '#9c27b0',
    rosa: '#e91e63',
    bianco: '#ffffff',
    nero: '#000000',
    grigio: '#808080',
    marrone: '#795548',
  };

  const lower = text.toLowerCase();
  for (const [name, hex] of Object.entries(colorMap)) {
    if (lower.includes(name)) return hex;
  }

  // Try hex color pattern
  const hexMatch = text.match(/#[0-9a-f]{6}/i);
  if (hexMatch) return hexMatch[0];

  return null;
}

/**
 * Extract numeric value from text (e.g., "25 pixel" -> 25)
 */
export function extractNumber(text: string, min?: number, max?: number): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
}

/**
 * Extract shape from natural language (e.g., "onda" -> "wave")
 */
export function extractDividerShape(text: string): string | null {
  const shapeMap: Record<string, string> = {
    onda: 'wave',
    zigzag: 'zigzag-smooth',
    scala: 'staircase',
    nuvola: 'cloud',
    diagonale: 'diagonal',
    curva: 'curve',
    triangolo: 'triangle',
    freccia: 'arrow',
  };

  const lower = text.toLowerCase();
  for (const [name, shape] of Object.entries(shapeMap)) {
    if (lower.includes(name)) return shape;
  }

  return null;
}

/**
 * Extract animation effect from text
 */
export function extractAnimationEffect(text: string): string | null {
  const effectMap: Record<string, string> = {
    fade: 'fade-in',
    'sfuma': 'fade-in',
    slide: 'slide-up',
    scivola: 'slide-up',
    zoom: 'zoom-in',
    ingrandisci: 'zoom-in',
    bounce: 'bounce',
    rimbalza: 'bounce',
    rotate: 'rotate',
    ruota: 'rotate',
    flip: 'flip',
    ribalta: 'flip',
  };

  const lower = text.toLowerCase();
  for (const [name, effect] of Object.entries(effectMap)) {
    if (lower.includes(name)) return effect;
  }

  return null;
}

/**
 * Build a divider command from natural language
 */
export function buildDividerFromText(text: string): Partial<DividerCommand> {
  const cmd: Partial<DividerCommand> = { action: 'updateDivider' };

  // Position
  if (text.toLowerCase().includes('in alto') || text.toLowerCase().includes('sopra')) {
    cmd.position = 'top';
  } else if (text.toLowerCase().includes('in basso') || text.toLowerCase().includes('sotto')) {
    cmd.position = 'bottom';
  } else {
    cmd.position = 'bottom'; // default
  }

  // Shape
  const shape = extractDividerShape(text);
  if (shape) cmd.shape = shape;

  // Height
  const height = extractNumber(text, 20, 200);
  if (height) cmd.height = height;

  // Color/gradient
  const color = extractColor(text);
  if (color) {
    cmd.gradient = {
      type: 'linear',
      angle: 90,
      stops: [{ color, position: 0 }, { color, position: 100 }],
    };
  }

  // Opacity
  const opacity = extractNumber(text.match(/opacit[àa].*?(\d+)/i)?.[1] || '', 0, 100);
  if (opacity !== null) cmd.opacity = opacity / 100;

  return cmd;
}

/**
 * Build a gradient command from natural language
 */
export function buildGradientFromText(text: string): Partial<GradientCommand> {
  const cmd: Partial<GradientCommand> = { action: 'updateGradient' };

  // Type
  if (text.toLowerCase().includes('radiale')) {
    cmd.type = 'radial';
  } else if (text.toLowerCase().includes('conico')) {
    cmd.type = 'conic';
  } else {
    cmd.type = 'linear';
  }

  // Extract colors
  const colors: string[] = [];
  let match;
  const colorRegex = /[\w]+(?:\s+(?:e|o)\s+)?/g;
  const textLower = text.toLowerCase();

  // Try to find multiple color names
  const colorMap = {
    rosso: '#ff3333',
    arancione: '#ff8c00',
    giallo: '#ffc107',
    verde: '#4caf50',
    blu: '#2196f3',
    azzurro: '#00bcd4',
    viola: '#9c27b0',
    rosa: '#e91e63',
    bianco: '#ffffff',
    nero: '#000000',
  };

  for (const [name, color] of Object.entries(colorMap)) {
    if (textLower.includes(name)) colors.push(color);
  }

  if (colors.length >= 2) {
    cmd.stops = colors.map((color, i) => ({
      color,
      position: (i / (colors.length - 1)) * 100,
    }));
  } else if (colors.length === 1) {
    cmd.stops = [
      { color: colors[0], position: 0 },
      { color: colors[0], position: 100 },
    ];
  }

  // Angle
  if (cmd.type === 'linear') {
    const angle = extractNumber(text.match(/(\d+)\s*°?/)?.[1] || '', 0, 360);
    if (angle !== null) cmd.angle = angle;
  }

  // Animation
  if (textLower.includes('animato') || textLower.includes('animazione')) {
    cmd.animated = true;
    const duration = extractNumber(textLower.match(/(\d+)\s*ms/)?.[1] || '', 1000, 10000);
    if (duration) cmd.animationDuration = duration;
  }

  if (textLower.includes('scroll')) cmd.scrollDriven = true;
  if (textLower.includes('hover')) cmd.hoverDriven = true;

  return cmd;
}
