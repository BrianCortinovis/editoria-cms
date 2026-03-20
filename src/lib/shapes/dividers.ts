import type { DividerShape } from '@/lib/types';

export function generateDividerSvg(
  shape: DividerShape,
  width: number = 1440,
  height: number = 80,
  color: string = '#ffffff',
  flip: boolean = false,
  invert: boolean = false
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
    curve: `M0 ${height} C${width * 0.33} 0, ${width * 0.66} 0, ${width} ${height} L${width} ${height} L0 ${height} Z`,
    triangle: `M0 ${height} L${width / 2} 0 L${width} ${height} Z`,
    arrow: `M0 ${height} L${width / 2} ${height * 0.3} L${width} ${height} L${width * 0.75} ${height} L${width / 2} ${height * 0.6} L${width * 0.25} ${height} Z`,
    custom: '',
  };

  const path = paths[shape] || paths.wave;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="display:block;width:100%;height:${height}px;">
    <g${transform ? ` transform="${transform}"` : ''}>
      <path d="${path}" fill="${color}" />
    </g>
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
