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
