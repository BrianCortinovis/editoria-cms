import type { AdvancedGradient } from '@/lib/types';

/**
 * Build a CSS gradient string from AdvancedGradient structure
 */
export function buildCssGradient(gradient: AdvancedGradient): string {
  if (!gradient || gradient.stops.length < 2) return '';

  const stops = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map((stop) => {
      const opacity = stop.opacity !== undefined ? stop.opacity : 1;
      // Support CSS variables like var(--c-accent)
      const color = stop.color.includes('var(')
        ? `${stop.color} ${opacity < 1 ? `/ ${opacity}` : ''}`
        : opacity < 1
          ? `${stop.color} / ${opacity}`
          : stop.color;
      return `${color} ${stop.position}%`;
    })
    .join(', ');

  const angle = gradient.angle ?? 90;

  switch (gradient.type) {
    case 'linear':
      return `linear-gradient(${angle}deg, ${stops})`;
    case 'radial':
      return `radial-gradient(circle, ${stops})`;
    case 'conic':
      return `conic-gradient(from ${angle}deg, ${stops})`;
    case 'mesh':
      // Mesh is emulated as stacked radial gradients with different centers
      // For simplicity, use the first two stops
      return `radial-gradient(circle at 30% 40%, ${stops})`;
    default:
      return `linear-gradient(${angle}deg, ${stops})`;
  }
}

/**
 * Build CSS @keyframes for animated gradients
 */
export function buildAnimatedGradientKeyframes(
  blockId: string,
  gradient: AdvancedGradient
): string {
  if (!gradient.animated || !gradient.animationDuration) return '';

  const duration = gradient.animationDuration;
  const angle1 = gradient.angle ?? 0;
  const angle2 = (angle1 + 180) % 360;

  const startGradient = buildCssGradient({
    ...gradient,
    angle: angle1,
    animated: false,
  });

  const endGradient = buildCssGradient({
    ...gradient,
    angle: angle2,
    animated: false,
  });

  return `
@keyframes gradient-shift-${blockId} {
  0% {
    background-image: ${startGradient};
  }
  50% {
    background-image: ${endGradient};
  }
  100% {
    background-image: ${startGradient};
  }
}

#${blockId} {
  animation: gradient-shift-${blockId} ${duration}ms ease-in-out infinite;
}
  `.trim();
}

/**
 * Preset gradients library
 */
export const GRADIENT_PRESETS: AdvancedGradient[] = [
  {
    type: 'linear',
    angle: 45,
    stops: [
      { color: '#FF6B6B', position: 0 },
      { color: '#FFD93D', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#667eea', position: 0 },
      { color: '#764ba2', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'linear',
    angle: 90,
    stops: [
      { color: '#00D4FF', position: 0 },
      { color: '#0099FF', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'radial',
    stops: [
      { color: '#FFD700', position: 0 },
      { color: '#FF4500', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'linear',
    angle: 180,
    stops: [
      { color: '#4CAF50', position: 0 },
      { color: '#2196F3', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'linear',
    angle: 45,
    stops: [
      { color: '#FF1493', position: 0 },
      { color: '#FFB6C1', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'conic',
    angle: 0,
    stops: [
      { color: '#FF0000', position: 0 },
      { color: '#FFFF00', position: 25 },
      { color: '#00FF00', position: 50 },
      { color: '#00FFFF', position: 75 },
      { color: '#FF0000', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'linear',
    angle: 270,
    stops: [
      { color: '#1a1a2e', position: 0 },
      { color: '#16213e', position: 50 },
      { color: '#0f3460', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'radial',
    stops: [
      { color: '#E0F7FA', position: 0 },
      { color: '#0277BD', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'linear',
    angle: 45,
    stops: [
      { color: '#FFA500', position: 0 },
      { color: '#FF6347', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'linear',
    angle: 90,
    stops: [
      { color: '#9C27B0', position: 0 },
      { color: '#E91E63', position: 100 },
    ],
    animated: false,
  },
  {
    type: 'linear',
    angle: 180,
    stops: [
      { color: '#FFCCCC', position: 0, opacity: 0.8 },
      { color: '#FF9999', position: 100, opacity: 0.6 },
    ],
    animated: false,
  },
];
