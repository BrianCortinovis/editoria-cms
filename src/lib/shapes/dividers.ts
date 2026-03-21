import type { DividerShape } from '@/lib/types';

export function generateDividerSvg(
  shape: DividerShape,
  width: number = 1440,
  height: number = 80,
  color: string = '#ffffff',
  flip: boolean = false,
  invert: boolean = false,
  opacity: number = 1
): string {
  const transform = [
    flip ? `scale(-1, 1) translate(-${width}, 0)` : '',
    invert ? `scale(1, -1) translate(0, -${height})` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const paths: Record<DividerShape, string> = {
    diagonal: `M0 ${height} L${width} 0 L${width} ${height} Z`,
    wave: `M0 ${height * 0.6} C${width * 0.25} ${height * 0.2}, ${width * 0.5} ${height}, ${width * 0.75} ${height * 0.4} S${width} ${height * 0.8} ${width} ${height * 0.5} L${width} ${height} L0 ${height} Z`,
    zigzag: generateZigzag(width, height),
    'zigzag-smooth': generateZigzagSmooth(width, height),
    curve: `M0 ${height} C${width * 0.33} 0, ${width * 0.66} 0, ${width} ${height} L${width} ${height} L0 ${height} Z`,
    triangle: `M0 ${height} L${width / 2} 0 L${width} ${height} Z`,
    arrow: `M0 ${height} L${width / 2} ${height * 0.3} L${width} ${height} L${width * 0.75} ${height} L${width / 2} ${height * 0.6} L${width * 0.25} ${height} Z`,
    staircase: generateStaircase(width, height),
    cloud: generateCloud(width, height),
    bezier: '',
    custom: '',
  };

  const path = paths[shape] || paths.wave;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="display:block;width:100%;height:${height}px;">
    <g${transform ? ` transform="${transform}"` : ''}>
      <path d="${path}" fill="${color}" opacity="${opacity}" />
    </g>
  </svg>`;
}

export function generateTransparentBlendDivider(
  fromColor: string,
  toColor: string,
  width: number = 1440,
  height: number = 80,
  shape: DividerShape = 'wave'
): string {
  const paths: Record<DividerShape, string> = {
    diagonal: `M0 ${height} L${width} 0 L${width} ${height} Z`,
    wave: `M0 ${height * 0.6} C${width * 0.25} ${height * 0.2}, ${width * 0.5} ${height}, ${width * 0.75} ${height * 0.4} S${width} ${height * 0.8} ${width} ${height * 0.5} L${width} ${height} L0 ${height} Z`,
    zigzag: generateZigzag(width, height),
    'zigzag-smooth': generateZigzagSmooth(width, height),
    curve: `M0 ${height} C${width * 0.33} 0, ${width * 0.66} 0, ${width} ${height} L${width} ${height} L0 ${height} Z`,
    triangle: `M0 ${height} L${width / 2} 0 L${width} ${height} Z`,
    arrow: `M0 ${height} L${width / 2} ${height * 0.3} L${width} ${height} L${width * 0.75} ${height} L${width / 2} ${height * 0.6} L${width * 0.25} ${height} Z`,
    staircase: generateStaircase(width, height),
    cloud: generateCloud(width, height),
    bezier: `M0 ${height} C${width * 0.33} ${height * 0.3}, ${width * 0.66} ${height * 0.7}, ${width} ${height} L${width} ${height} Z`,
    custom: '',
  };

  const path = paths[shape] || paths.wave;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="display:block;width:100%;height:${height}px;">
    <defs>
      <linearGradient id="blendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${fromColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${toColor};stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="${path}" fill="url(#blendGrad)" />
  </svg>`;
}

function generateZigzag(width: number, height: number): string {
  const segments = 12;
  const segWidth = width / segments;
  let path = `M0 ${height}`;

  for (let i = 0; i < segments; i++) {
    const x = segWidth * (i + 0.5);
    const y = i % 2 === 0 ? 0 : height * 0.6;
    path += ` L${x} ${y}`;
  }

  path += ` L${width} ${height} Z`;
  return path;
}

function generateZigzagSmooth(width: number, height: number): string {
  const segments = 12;
  const segWidth = width / segments;
  let path = `M0 ${height}`;

  for (let i = 0; i < segments; i++) {
    const x1 = segWidth * i;
    const x2 = segWidth * (i + 0.5);
    const x3 = segWidth * (i + 1);
    const y = i % 2 === 0 ? height * 0.3 : height * 0.7;
    path += ` Q${x2} ${y}, ${x3} ${height}`;
  }

  path += ` L${width} ${height} Z`;
  return path;
}

function generateStaircase(width: number, height: number): string {
  const steps = 8;
  const stepWidth = width / steps;
  const stepHeight = height / steps;
  let path = `M0 ${height}`;

  for (let i = 0; i < steps; i++) {
    const x = stepWidth * (i + 1);
    const y = height - stepHeight * (i + 1);
    path += ` L${x} ${y} L${x} ${height}`;
  }

  path += ` L${width} ${height} Z`;
  return path;
}

function generateCloud(width: number, height: number): string {
  const bumps = 4;
  const bumpWidth = width / bumps;
  let path = `M0 ${height}`;

  for (let i = 0; i < bumps; i++) {
    const cx = bumpWidth * (i + 0.5);
    const startX = bumpWidth * i;
    const endX = bumpWidth * (i + 1);
    path += ` Q${cx} 0, ${endX} ${height * 0.4}`;
  }

  path += ` L${width} ${height} Z`;
  return path;
}

export const CLIP_PATH_PRESETS = [
  { name: 'Nessuno', value: 'none' },
  { name: 'Diagonale alto-sx', value: 'polygon(0 0, 100% 10%, 100% 100%, 0 100%)' },
  { name: 'Diagonale alto-dx', value: 'polygon(0 10%, 100% 0, 100% 100%, 0 100%)' },
  { name: 'Diagonale basso-sx', value: 'polygon(0 0, 100% 0, 100% 100%, 0 90%)' },
  { name: 'Diagonale basso-dx', value: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)' },
  { name: 'Doppia diagonale', value: 'polygon(0 5%, 100% 0, 100% 95%, 0 100%)' },
  { name: 'Freccia giù', value: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' },
  { name: 'Freccia su', value: 'polygon(50% 0, 100% 15%, 100% 100%, 0 100%, 0 15%)' },
  { name: 'Pentagono', value: 'polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)' },
  { name: 'Esagono', value: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)' },
  { name: 'Rombo', value: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' },
  { name: 'Cerchio', value: 'circle(50% at 50% 50%)' },
  { name: 'Ellisse', value: 'ellipse(50% 40% at 50% 50%)' },
  { name: 'Inset arrotondato', value: 'inset(5% round 20px)' },
];

// Convert divider shapes to clip-path polygons for section borders
export function dividerToClipPath(shape: DividerShape, height: number = 60): string {
  const clipPaths: Record<DividerShape, string> = {
    diagonal: `polygon(0 0, 100% ${Math.min(height, 30)}%, 100% 100%, 0 100%)`,
    wave: `polygon(0 0, 2% 2%, 4% 1%, 6% 3%, 8% 1%, 10% 3%, 12% 1%, 14% 4%, 16% 1%, 18% 4%, 20% 2%, 22% 5%, 24% 1%, 26% 5%, 28% 2%, 30% 5%, 32% 1%, 34% 6%, 36% 1%, 38% 6%, 40% 2%, 42% 6%, 44% 1%, 46% 6%, 48% 2%, 50% 6%, 52% 2%, 54% 6%, 56% 1%, 58% 6%, 60% 2%, 62% 5%, 64% 1%, 66% 5%, 68% 2%, 70% 5%, 72% 1%, 74% 4%, 76% 2%, 78% 4%, 80% 1%, 82% 3%, 84% 2%, 86% 3%, 88% 1%, 90% 3%, 92% 1%, 94% 2%, 96% 1%, 98% 2%, 100% 0, 100% 100%, 0 100%)`,
    zigzag: `polygon(0 0, 5% ${height / 2}%, 10% 0, 15% ${height / 2}%, 20% 0, 25% ${height / 2}%, 30% 0, 35% ${height / 2}%, 40% 0, 45% ${height / 2}%, 50% 0, 55% ${height / 2}%, 60% 0, 65% ${height / 2}%, 70% 0, 75% ${height / 2}%, 80% 0, 85% ${height / 2}%, 90% 0, 95% ${height / 2}%, 100% 0, 100% 100%, 0 100%)`,
    'zigzag-smooth': `polygon(0 0, 5% ${height / 3}%, 10% 0, 15% ${height / 3}%, 20% 0, 25% ${height / 3}%, 30% 0, 35% ${height / 3}%, 40% 0, 45% ${height / 3}%, 50% 0, 55% ${height / 3}%, 60% 0, 65% ${height / 3}%, 70% 0, 75% ${height / 3}%, 80% 0, 85% ${height / 3}%, 90% 0, 95% ${height / 3}%, 100% 0, 100% 100%, 0 100%)`,
    curve: `polygon(0 0, 10% ${height * 0.2}%, 20% ${height * 0.4}%, 30% ${height * 0.6}%, 40% ${height * 0.8}%, 50% ${height}%, 60% ${height * 0.8}%, 70% ${height * 0.6}%, 80% ${height * 0.4}%, 90% ${height * 0.2}%, 100% 0, 100% 100%, 0 100%)`,
    triangle: `polygon(50% 0, 100% ${height}%, 0 ${height}%, 0 100%, 100% 100%)`,
    arrow: `polygon(25% 0, 50% ${height * 0.6}%, 75% 0, 100% ${height}%, 75% ${height}%, 50% ${height * 0.4}%, 25% ${height}%, 0 100%, 0 ${height}%)`,
    staircase: `polygon(0 0, 20% 0, 20% ${height * 0.25}%, 40% ${height * 0.25}%, 40% ${height * 0.5}%, 60% ${height * 0.5}%, 60% ${height * 0.75}%, 80% ${height * 0.75}%, 80% ${height}%, 100% ${height}%, 100% 0, 100% 100%, 0 100%)`,
    cloud: `polygon(0 ${height * 0.3}%, 5% ${height * 0.1}%, 10% ${height * 0.2}%, 15% 0, 20% ${height * 0.15}%, 25% ${height * 0.05}%, 30% ${height * 0.2}%, 35% ${height * 0.08}%, 40% ${height * 0.25}%, 45% 0, 50% ${height * 0.2}%, 55% ${height * 0.05}%, 60% ${height * 0.25}%, 65% ${height * 0.1}%, 70% ${height * 0.2}%, 75% 0, 80% ${height * 0.15}%, 85% ${height * 0.05}%, 90% ${height * 0.2}%, 95% ${height * 0.1}%, 100% ${height * 0.3}%, 100% 100%, 0 100%)`,
    bezier: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
    custom: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
  };

  return clipPaths[shape] || clipPaths.wave;
}
